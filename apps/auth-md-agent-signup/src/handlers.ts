import { authorizationServerMetadata, protectedResourceMetadata, renderAuthMd } from "./auth-md";
import {
  demoAssertion,
  json,
  oauthError,
  originFromRequest,
  parseScopesField,
  type Registration,
} from "./protocol";
import { store } from "./store";

const CLAIM_GRANT = "urn:workos:agent-auth:grant-type:claim";
const JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer";

const WWW_AUTH = (origin: string) =>
  `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`;

type Body = Record<string, unknown>;

async function parseBody(req: Request): Promise<Body> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await req.json()) as Body;
    } catch {
      return {};
    }
  }
  const text = await req.text();
  if (!text) return {};
  if (contentType.includes("application/x-www-form-urlencoded") || text.includes("=")) {
    const params = new URLSearchParams(text);
    const out: Body = {};
    for (const [k, v] of params.entries()) out[k] = v;
    return out;
  }
  try {
    return JSON.parse(text) as Body;
  } catch {
    return {};
  }
}

function str(body: Body, key: string): string | undefined {
  const v = body[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function registrationPublic(reg: Registration, origin: string) {
  const base: Record<string, unknown> = {
    registration_id: reg.id,
    registration_type: reg.type,
    agent_name: reg.agentName,
    status: reg.status,
    claim_url: `${origin}/agent/identity/claim`,
    claim_token: reg.claimToken,
    claim_token_expires: new Date(reg.claimTokenExpires).toISOString(),
    pre_claim_scopes: reg.preClaimScopes,
    post_claim_scopes: reg.postClaimScopes,
  };
  if (reg.identityAssertion) {
    base.identity_assertion = reg.identityAssertion;
    base.assertion_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  if (reg.claimAttempt) {
    base.claim = {
      user_code: reg.claimAttempt.userCode,
      expires_in: Math.max(0, Math.floor((reg.claimAttempt.expiresAt - Date.now()) / 1000)),
      verification_uri: reg.claimAttempt.verificationUri,
      interval: reg.claimAttempt.interval,
      claim_attempt_token: reg.claimAttempt.claimAttemptToken,
    };
  }
  return base;
}

function tokenResponse(access: { token: string; scopes: string[]; expiresAt: number }, identityAssertion?: string) {
  const body: Record<string, unknown> = {
    access_token: access.token,
    token_type: "Bearer",
    expires_in: Math.max(0, Math.floor((access.expiresAt - Date.now()) / 1000)),
    scope: access.scopes.join(" "),
  };
  if (identityAssertion) {
    body.identity_assertion = identityAssertion;
    body.assertion_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  return json(body);
}

export async function handleApi(req: Request, url: URL): Promise<Response | null> {
  const origin = originFromRequest(req);
  const path = url.pathname;
  const method = req.method;

  if (method === "GET" && path === "/auth.md") {
    return new Response(renderAuthMd(origin), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (method === "GET" && path === "/.well-known/oauth-protected-resource") {
    return json(protectedResourceMetadata(origin));
  }

  if (method === "GET" && path === "/.well-known/oauth-authorization-server") {
    return json(authorizationServerMetadata(origin));
  }

  if (method === "GET" && path === "/api/demo/state") {
    return json(store.snapshot());
  }

  if (method === "POST" && path === "/api/demo/reset") {
    store.reset();
    return json({ ok: true });
  }

  if (method === "POST" && path === "/agent/identity") {
    const body = await parseBody(req);
    const type = str(body, "type");
    if (type !== "anonymous" && type !== "service_auth") {
      if (type === "identity_assertion") {
        return oauthError(400, "invalid_request", "This demo does not accept identity_assertion / ID-JAG.");
      }
      return oauthError(400, "invalid_request", "type must be anonymous or service_auth.");
    }
    const requested = Array.isArray(body.scopes) ? body.scopes : parseScopesField(str(body, "scopes"));
    const reg = store.createRegistration({
      type,
      agentName: str(body, "source") ?? "intern-agent",
      loginHint: str(body, "login_hint"),
      requestedScopes: requested,
      origin,
    });
    if (type === "service_auth" && !reg.loginHint) {
      // still allowed — claim desk will bind an owner
    }
    return json(registrationPublic(reg, origin), 201);
  }

  if (method === "POST" && path === "/agent/identity/claim") {
    const body = await parseBody(req);
    const claimToken = str(body, "claim_token");
    if (!claimToken) return oauthError(400, "invalid_request", "claim_token is required.");
    const reg = store.byClaimToken(claimToken);
    if (!reg) return oauthError(400, "invalid_claim_token", "Unknown or expired claim_token.");
    if (reg.status === "claimed") {
      return oauthError(409, "claimed_or_in_flight", "Registration is already claimed.");
    }
    if (reg.status === "denied") {
      return oauthError(400, "invalid_claim_token", "Registration was denied. Re-register.");
    }
    if (reg.claimTokenExpires < Date.now()) {
      return oauthError(410, "claim_expired", "Outer claim window closed. Restart at Step 3.");
    }
    if (reg.type !== "anonymous") {
      // service_auth already has a claim block; mint a fresh code if asked
    }
    const email = str(body, "email") ?? str(body, "login_hint");
    if (email) reg.loginHint = email;
    const attempt = store.mintClaimAttempt(reg, origin);
    return json({
      registration_id: reg.id,
      claim_attempt_id: attempt.id,
      status: "initiated",
      expires_at: new Date(attempt.expiresAt).toISOString(),
      claim_attempt: {
        user_code: attempt.userCode,
        expires_in: Math.max(0, Math.floor((attempt.expiresAt - Date.now()) / 1000)),
        verification_uri: attempt.verificationUri,
        interval: attempt.interval,
        claim_attempt_token: attempt.claimAttemptToken,
      },
    });
  }

  if (method === "POST" && path === "/oauth2/token") {
    const body = await parseBody(req);
    const grant = str(body, "grant_type");
    if (grant === JWT_BEARER) {
      const assertion = str(body, "assertion");
      if (!assertion) return oauthError(400, "invalid_request", "assertion is required.");
      const reg = store.byAssertion(assertion);
      if (!reg) return oauthError(400, "invalid_grant", "Unknown or revoked identity_assertion.");
      if (reg.status === "denied") {
        return oauthError(400, "invalid_grant", "Registration was denied.");
      }
      const phase = reg.status === "claimed" ? "post_claim" : "pre_claim";
      if (phase === "pre_claim" && reg.type !== "anonymous") {
        return oauthError(400, "invalid_grant", "No assertion until the claim ceremony completes.");
      }
      const access = store.issueToken(reg, phase);
      return tokenResponse(access, reg.identityAssertion);
    }
    if (grant === CLAIM_GRANT) {
      const claimToken = str(body, "claim_token");
      if (!claimToken) return oauthError(400, "invalid_request", "claim_token is required.");
      const reg = store.byClaimToken(claimToken);
      if (!reg) return oauthError(400, "invalid_grant", "Unknown claim_token.");
      if (reg.status === "denied") {
        return oauthError(403, "access_denied", "The human denied this claim.");
      }
      if (reg.status !== "claimed") {
        if (reg.claimAttempt && reg.claimAttempt.expiresAt < Date.now()) {
          return oauthError(400, "expired_token", "user_code window closed. Re-call /agent/identity/claim.");
        }
        return oauthError(400, "authorization_pending", "User has not completed the ceremony yet.");
      }
      const access = store.issueToken(reg, "post_claim");
      return tokenResponse(access, reg.identityAssertion);
    }
    return oauthError(400, "unsupported_grant_type", `Use ${JWT_BEARER} or ${CLAIM_GRANT}.`);
  }

  if (method === "POST" && path === "/oauth2/revoke") {
    const body = await parseBody(req);
    const token = str(body, "token");
    if (token) {
      const access = store.tokens.get(token);
      if (access) access.revoked = true;
    }
    return json({ ok: true });
  }

  if (path === "/api/notes") {
    const access = store.lookupBearer(req.headers.get("authorization"));
    if (!access) {
      return json(
        { error: "invalid_token", error_description: "Sign in via auth.md registration." },
        401,
        { "WWW-Authenticate": WWW_AUTH(origin) },
      );
    }
    if (method === "GET") {
      if (!access.scopes.includes("notes.read")) {
        return oauthError(403, "insufficient_scope", "notes.read required.");
      }
      return json({
        registration_id: access.registrationId,
        phase: access.phase,
        scope: access.scopes,
        notes: store.notesFor(access.registrationId),
      });
    }
    if (method === "POST") {
      if (!access.scopes.includes("notes.write")) {
        return oauthError(
          403,
          "insufficient_scope",
          "notes.write is post-claim only. Complete the human claim ceremony.",
        );
      }
      const body = await parseBody(req);
      const text = str(body, "body") ?? "Claimed workspace note";
      const note = store.addNote(access.registrationId, text, "agent");
      return json(note, 201);
    }
  }

  if (method === "POST" && path === "/demo/claim/complete") {
    const body = await parseBody(req);
    const attemptToken = str(body, "claim_attempt_token");
    const userCode = str(body, "user_code")?.replace(/\s/g, "");
    const ownerEmail = str(body, "owner_email") ?? "ada@harbor.local";
    if (!attemptToken || !userCode) {
      return oauthError(400, "invalid_request", "claim_attempt_token and user_code are required.");
    }
    const reg = store.byClaimAttemptToken(attemptToken);
    if (!reg?.claimAttempt) {
      return json({ error: "not_found", error_description: "No pending claim for that token." }, 404);
    }
    if (reg.claimAttempt.expiresAt < Date.now()) {
      return json({ error: "expired_token", error_description: "Code expired. Ask the agent to mint a new one." }, 400);
    }
    if (reg.claimAttempt.userCode !== userCode) {
      return json({ error: "invalid_user_code", error_description: "That code does not match. Try again." }, 400);
    }
    if (reg.loginHint && reg.loginHint !== ownerEmail) {
      return json(
        {
          error: "wrong_user",
          error_description: `This claim is bound to ${reg.loginHint}. Sign in as that user.`,
        },
        403,
      );
    }
    reg.status = "claimed";
    reg.ownerEmail = ownerEmail;
    reg.claimedAt = Date.now();
    store.rememberAssertion(reg, demoAssertion(reg, "post_claim"));
    return json({
      ok: true,
      registration_id: reg.id,
      owner_email: ownerEmail,
      post_claim_scopes: reg.postClaimScopes,
    });
  }

  if (method === "POST" && path === "/demo/claim/deny") {
    const body = await parseBody(req);
    const attemptToken = str(body, "claim_attempt_token");
    const reg = attemptToken ? store.byClaimAttemptToken(attemptToken) : undefined;
    if (!reg) return json({ error: "not_found", error_description: "No pending claim." }, 404);
    reg.status = "denied";
    return json({ ok: true, registration_id: reg.id, status: "denied" });
  }

  return null;
}
