export type RegistrationType = "anonymous" | "service_auth";
export type RegistrationStatus = "pending" | "claimed" | "denied";
export type TokenPhase = "pre_claim" | "post_claim";

export const KNOWN_SCOPES = ["notes.read", "notes.write"] as const;
export type KnownScope = (typeof KNOWN_SCOPES)[number];

export const PRE_CLAIM_SCOPES: KnownScope[] = ["notes.read"];
export const POST_CLAIM_SCOPES: KnownScope[] = ["notes.read", "notes.write"];

export type ClaimAttempt = {
  id: string;
  userCode: string;
  verificationUri: string;
  claimAttemptToken: string;
  expiresAt: number;
  interval: number;
};

export type Registration = {
  id: string;
  type: RegistrationType;
  agentName: string;
  loginHint?: string;
  ownerEmail?: string;
  status: RegistrationStatus;
  claimToken: string;
  claimTokenExpires: number;
  identityAssertion?: string;
  preClaimScopes: string[];
  postClaimScopes: string[];
  claimAttempt?: ClaimAttempt;
  createdAt: number;
  claimedAt?: number;
};

export type AccessToken = {
  token: string;
  registrationId: string;
  scopes: string[];
  expiresAt: number;
  phase: TokenPhase;
  revoked: boolean;
  createdAt: number;
};

export type Note = {
  id: string;
  body: string;
  author: "agent" | "user";
  createdAt: number;
  registrationId: string;
};

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 22)}`;
}

export function sixDigitCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

export function demoAssertion(reg: Registration, phase: TokenPhase): string {
  const payload = {
    sub: reg.id,
    phase,
    scopes: phase === "pre_claim" ? reg.preClaimScopes : reg.postClaimScopes,
    demo: true,
    iat: Math.floor(Date.now() / 1000),
  };
  return `demo-jag.${btoa(JSON.stringify(payload))}.unsigned`;
}

export function demoAccessToken(): string {
  return `at_demo_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function filterKnownScopes(requested: unknown): string[] {
  if (!Array.isArray(requested) || requested.length === 0) {
    return [...POST_CLAIM_SCOPES];
  }
  const wanted = new Set(requested.filter((s) => typeof s === "string"));
  const granted = KNOWN_SCOPES.filter((s) => wanted.has(s));
  return granted.length > 0 ? granted : [...POST_CLAIM_SCOPES];
}

export function originFromRequest(req: Request): string {
  const url = new URL(req.url);
  const forwarded = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  if (forwarded) return `${proto}://${forwarded}`;
  return url.origin;
}

export function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

export function oauthError(status: number, error: string, description: string): Response {
  return json({ error, error_description: description }, status);
}

export function emailsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function parseScopesField(raw?: string): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw.split(/[,\s]+/).filter(Boolean);
  }
}
