export function renderAuthMd(origin: string): string {
  return `# auth.md

You are an agent. **Harbor Notes** supports **agentic registration**: discover → register → (claim if needed) → exchange for an access_token → call API.

This is a **local demo** of the [auth.md](https://workos.com/auth-md) protocol shape. Hosts below are this process, not a production identity provider.

- Resource server / API: \`${origin}/\`
- Authorization server: \`${origin}/\`
- This file: \`${origin}/auth.md\`

Do not skip steps. Treat Protected Resource Metadata as authoritative if it conflicts with this prose.

## Step 1 — Discover

A 401 on the notes API carries:

\`\`\`http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"
\`\`\`

### 1a. Fetch Protected Resource Metadata

\`\`\`http
GET ${origin}/.well-known/oauth-protected-resource
\`\`\`

\`\`\`json
{
  "resource": "${origin}/",
  "resource_name": "Harbor Notes",
  "authorization_servers": ["${origin}/"],
  "scopes_supported": ["notes.read", "notes.write"],
  "bearer_methods_supported": ["header"]
}
\`\`\`

### 1b. Fetch Authorization Server metadata

\`\`\`http
GET ${origin}/.well-known/oauth-authorization-server
\`\`\`

Read \`issuer\`, \`token_endpoint\`, \`revocation_endpoint\`, \`grant_types_supported\`, and the \`agent_auth\` block (\`skill\`, \`identity_endpoint\`, \`claim_endpoint\`, \`identity_types_supported\`).

This demo implements **anonymous** and **service_auth** only. There is no ID-JAG / \`identity_assertion\` provider.

## Step 2 — Pick a method

1. You have only the user's email → \`service_auth\` (claim ceremony required before any token).
2. You have neither a session nor an email → \`anonymous\`. Limited \`pre_claim_scopes\` now; a human claims later to unlock \`post_claim_scopes\`.

## Step 3 — Register

\`POST ${origin}/agent/identity\` with JSON. Optional demo fields: \`source\` (agent display name) and \`scopes\` (requested; the service decides what is granted).

### anonymous

\`\`\`http
POST ${origin}/agent/identity
Content-Type: application/json

{
  "type": "anonymous",
  "source": "intern-agent",
  "scopes": ["notes.read", "notes.write"]
}
\`\`\`

Success includes a pre-claim \`identity_assertion\`, \`pre_claim_scopes\` (always \`notes.read\` in this demo), \`claim_token\`, and \`post_claim_scopes\` (\`notes.read notes.write\` if requested). Exchange the assertion immediately (Step 5). Start a claim (Step 4) when a human is ready to take ownership.

### service_auth

\`\`\`http
POST ${origin}/agent/identity
Content-Type: application/json

{
  "type": "service_auth",
  "login_hint": "ada@harbor.local",
  "source": "intern-agent",
  "scopes": ["notes.read", "notes.write"]
}
\`\`\`

No assertion yet. The response carries a \`claim\` block (\`user_code\`, \`verification_uri\`, \`expires_in\`, \`interval\`) borrowed from [RFC 8628](https://datatracker.ietf.org/rfc/rfc8628) device authorization. Surface those to the user and poll (Step 4c).

## Step 4 — Claim ceremony

The user types a 6-digit \`user_code\` **you show them** on a page **this service owns**. The service never emails the code.

### 4a. Ceremony materials

- \`service_auth\`: already in the register response \`claim\` object.
- \`anonymous\`: mint an attempt:

\`\`\`http
POST ${origin}/agent/identity/claim
Content-Type: application/json

{ "claim_token": "clm_…", "email": "ada@harbor.local" }
\`\`\`

### 4b. Hand off to the user

> Open this link and enter this 6-digit code: **123456**
> ${origin}/claim?claim_attempt_token=…

They sign in on the Harbor claim desk (this demo uses an editable mock email) and submit the code there — not back to you.

### 4c. Poll for completion

\`\`\`http
POST ${origin}/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:workos:agent-auth:grant-type:claim
&claim_token=<clm_…>
\`\`\`

Pending: \`{ "error": "authorization_pending" }\`. Success: OAuth token envelope plus \`identity_assertion\`. Completing an anonymous claim **revokes** pre-claim access tokens.

## Step 5 — Exchange the assertion

\`\`\`http
POST ${origin}/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=<identity_assertion>
&resource=${origin}/
\`\`\`

Tokens in this demo are prefixed \`at_demo_\` and assertions \`demo-jag.\` — they are fake, unsigned, and never leave this process.

## Step 6 — Use the access_token

\`\`\`http
GET ${origin}/api/notes
Authorization: Bearer at_demo_…
\`\`\`

\`notes.read\` lists notes for this registration. \`notes.write\` (post-claim only) can \`POST /api/notes\` with \`{ "body": "…" }\`. When the access token expires, re-exchange the assertion. There is no refresh_token.

## Errors (demo subset)

| Code | Where | What to do |
| --- | --- | --- |
| \`service_auth_not_enabled\` / \`anonymous_not_enabled\` | \`/agent/identity\` | Pick the other method. |
| \`invalid_request\` | register / claim | Fix the JSON body. |
| \`invalid_claim_token\` | claim | Restart at Step 3. |
| \`claimed_or_in_flight\` | claim | Already claimed, or ceremony already open. |
| \`authorization_pending\` | token (claim grant) | Honor \`interval\`; retry. |
| \`access_denied\` | token (claim grant) | Human denied the claim. |
| \`expired_token\` | token (claim grant) | Re-call \`/agent/identity/claim\`. |
| \`invalid_grant\` | token | Assertion expired or revoked; re-register. |
| \`insufficient_scope\` | \`/api/notes\` | Wait for post-claim scopes. |

## Revocation

\`POST ${origin}/oauth2/revoke\` with \`token=<access_token>\` kills that credential. Re-exchange the assertion for a new one. This demo does not implement provider SET delivery.

## Demo notes

Harbor Notes is educational. Credentials are in-memory only. Restarting the server wipes registrations. This process never calls production identity APIs.
`;
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/`,
    resource_name: "Harbor Notes",
    resource_logo_uri: `${origin}/favicon.svg`,
    authorization_servers: [`${origin}/`],
    scopes_supported: ["notes.read", "notes.write"],
    bearer_methods_supported: ["header"],
  };
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    token_endpoint: `${origin}/oauth2/token`,
    revocation_endpoint: `${origin}/oauth2/revoke`,
    grant_types_supported: [
      "urn:ietf:params:oauth:grant-type:jwt-bearer",
      "urn:workos:agent-auth:grant-type:claim",
    ],
    agent_auth: {
      skill: `${origin}/auth.md`,
      identity_endpoint: `${origin}/agent/identity`,
      claim_endpoint: `${origin}/agent/identity/claim`,
      identity_types_supported: ["anonymous", "service_auth"],
      identity_assertion: {
        assertion_types_supported: [],
      },
      events_supported: [],
    },
  };
}
