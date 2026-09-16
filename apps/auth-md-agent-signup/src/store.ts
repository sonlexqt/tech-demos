import {
  type AccessToken,
  type ClaimAttempt,
  type Note,
  type Registration,
  type TokenPhase,
  demoAccessToken,
  demoAssertion,
  filterKnownScopes,
  newId,
  PRE_CLAIM_SCOPES,
  sixDigitCode,
} from "./protocol";

const CLAIM_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const CLAIM_ATTEMPT_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

class MemoryStore {
  registrations = new Map<string, Registration>();
  tokens = new Map<string, AccessToken>();
  assertions = new Map<string, string>();
  notes: Note[] = [];

  reset(): void {
    this.registrations.clear();
    this.tokens.clear();
    this.assertions.clear();
    this.notes = [];
  }

  snapshot() {
    return {
      registrations: [...this.registrations.values()].map((r) => ({
        ...r,
        claimToken: r.claimToken ? `${r.claimToken.slice(0, 12)}…` : undefined,
        identityAssertion: r.identityAssertion ? `${r.identityAssertion.slice(0, 24)}…` : undefined,
      })),
      tokens: [...this.tokens.values()].map((t) => ({
        ...t,
        token: t.token,
      })),
      notes: this.notes,
    };
  }

  createRegistration(input: {
    type: Registration["type"];
    agentName: string;
    loginHint?: string;
    requestedScopes?: unknown;
    origin: string;
  }): Registration {
    const postClaimScopes = filterKnownScopes(input.requestedScopes);
    const preClaimScopes = PRE_CLAIM_SCOPES.filter((s) => postClaimScopes.includes(s));
    const now = Date.now();
    const registration: Registration = {
      id: newId("reg"),
      type: input.type,
      agentName: input.agentName || "unnamed-agent",
      loginHint: input.loginHint,
      status: "pending",
      claimToken: newId("clm"),
      claimTokenExpires: now + CLAIM_TOKEN_TTL_MS,
      preClaimScopes,
      postClaimScopes,
      createdAt: now,
    };

    if (input.type === "anonymous") {
      registration.identityAssertion = demoAssertion(registration, "pre_claim");
      this.assertions.set(registration.identityAssertion, registration.id);
    } else {
      registration.claimAttempt = this.mintClaimAttempt(registration, input.origin);
    }

    this.registrations.set(registration.id, registration);
    return registration;
  }

  mintClaimAttempt(reg: Registration, origin: string): ClaimAttempt {
    const attempt: ClaimAttempt = {
      id: newId("cla"),
      userCode: sixDigitCode(),
      claimAttemptToken: newId("cat"),
      expiresAt: Date.now() + CLAIM_ATTEMPT_TTL_MS,
      interval: 2,
      verificationUri: "",
    };
    attempt.verificationUri = `${origin}/claim?claim_attempt_token=${attempt.claimAttemptToken}`;
    reg.claimAttempt = attempt;
    return attempt;
  }

  byClaimToken(token: string): Registration | undefined {
    return [...this.registrations.values()].find((r) => r.claimToken === token);
  }

  byClaimAttemptToken(token: string): Registration | undefined {
    return [...this.registrations.values()].find((r) => r.claimAttempt?.claimAttemptToken === token);
  }

  byAssertion(assertion: string): Registration | undefined {
    const id = this.assertions.get(assertion);
    if (id) return this.registrations.get(id);
    return [...this.registrations.values()].find((r) => r.identityAssertion === assertion);
  }

  rememberAssertion(reg: Registration, assertion: string): void {
    reg.identityAssertion = assertion;
    this.assertions.set(assertion, reg.id);
  }

  issueToken(reg: Registration, phase: TokenPhase): AccessToken {
    if (phase === "post_claim") {
      for (const token of this.tokens.values()) {
        if (token.registrationId === reg.id && token.phase === "pre_claim") {
          token.revoked = true;
        }
      }
    }
    const access: AccessToken = {
      token: demoAccessToken(),
      registrationId: reg.id,
      scopes: phase === "pre_claim" ? reg.preClaimScopes : reg.postClaimScopes,
      expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
      phase,
      revoked: false,
      createdAt: Date.now(),
    };
    this.tokens.set(access.token, access);
    return access;
  }

  lookupBearer(header: string | null): AccessToken | undefined {
    if (!header?.startsWith("Bearer ")) return undefined;
    const token = header.slice("Bearer ".length).trim();
    const access = this.tokens.get(token);
    if (!access || access.revoked || access.expiresAt < Date.now()) return undefined;
    return access;
  }

  addNote(registrationId: string, body: string, author: Note["author"]): Note {
    const note: Note = {
      id: newId("note"),
      body,
      author,
      createdAt: Date.now(),
      registrationId,
    };
    this.notes.push(note);
    return note;
  }

  notesFor(registrationId: string): Note[] {
    return this.notes.filter((n) => n.registrationId === registrationId);
  }
}

export const store = new MemoryStore();
