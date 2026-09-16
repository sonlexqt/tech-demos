const $ = (id) => document.getElementById(id);

const state = {
  authMd: "",
  registration: null,
  claimToken: null,
  assertion: null,
  accessToken: null,
  scope: "",
  phase: "",
  polling: false,
  steps: new Set(),
};

const logEl = $("agent-log");
const claimMsg = $("claim-msg");

function method() {
  return document.querySelector('input[name="method"]:checked').value;
}

function scopes() {
  return [...document.querySelectorAll('input[name="scope"]:checked')].map((el) => el.value);
}

function mark(step, kind = "done") {
  if (kind === "done") state.steps.add(step);
  for (const li of document.querySelectorAll(".rail li")) {
    li.classList.remove("is-done", "is-now");
    const name = li.dataset.step;
    if (name === step && kind === "now") li.classList.add("is-now");
    else if (state.steps.has(name)) li.classList.add("is-done");
  }
}

function log(title, ok, detail) {
  const li = document.createElement("li");
  li.innerHTML = `<div class="${ok ? "ok" : "err"}">${title}</div>`;
  if (detail) {
    const pre = document.createElement("div");
    pre.className = "meta";
    pre.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    li.appendChild(pre);
  }
  logEl.prepend(li);
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof URLSearchParams)) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(path, { ...options, headers, body });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { res, data };
}

function showCode(claim) {
  const card = $("user-code-card");
  if (!claim?.user_code) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  $("user-code").textContent = claim.user_code;
  $("verify-link").href = claim.verification_uri;
  $("verify-link").textContent = claim.verification_uri;
  $("claim-code").value = "";
}

function setCreds(token, scope, phase) {
  state.accessToken = token ?? null;
  state.scope = scope ?? "";
  state.phase = phase ?? "";
  $("access-token").textContent = token || "—";
  $("access-scope").textContent = scope || "—";
  $("access-phase").textContent = phase || "—";
  if (token) mark("token");
}

async function discover() {
  mark("discover", "now");
  const md = await api("/auth.md");
  state.authMd = typeof md.data === "string" ? md.data : String(md.data);
  $("auth-md-preview").textContent = state.authMd;
  const prm = await api("/.well-known/oauth-protected-resource");
  const as = await api("/.well-known/oauth-authorization-server");
  log("GET /auth.md + well-known metadata", md.res.ok && prm.res.ok && as.res.ok, {
    resource_name: prm.data.resource_name,
    scopes_supported: prm.data.scopes_supported,
    identity_types_supported: as.data.agent_auth?.identity_types_supported,
    identity_endpoint: as.data.agent_auth?.identity_endpoint,
  });
  mark("discover");
}

async function register() {
  mark("register", "now");
  const body = {
    type: method(),
    source: $("agent-name").value.trim() || "intern-agent",
    scopes: scopes(),
  };
  if (body.type === "service_auth") body.login_hint = $("login-hint").value.trim();
  const { res, data } = await api("/agent/identity", { method: "POST", body });
  log(`POST /agent/identity (${body.type})`, res.ok, data);
  if (!res.ok) return;
  state.registration = data;
  state.claimToken = data.claim_token;
  state.assertion = data.identity_assertion ?? null;
  mark("register");
  mark("scopes");
  if (data.claim) showCode(data.claim);
  else showCode(null);
}

async function exchange() {
  if (!state.assertion) {
    log("Exchange skipped", false, "No identity_assertion yet (service_auth waits for claim).");
    return;
  }
  const form = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: state.assertion,
    resource: `${location.origin}/`,
  });
  const { res, data } = await api("/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  log("POST /oauth2/token (jwt-bearer)", res.ok, data);
  if (res.ok) setCreds(data.access_token, data.scope, method() === "anonymous" && !state.steps.has("claim") ? "pre_claim" : "post_claim");
}

async function getNotes() {
  if (!state.accessToken) {
    log("GET /api/notes", false, "No access_token. Register + exchange first.");
    return;
  }
  const { res, data } = await api("/api/notes", {
    headers: { authorization: `Bearer ${state.accessToken}` },
  });
  log("GET /api/notes", res.ok, data);
}

async function postNote() {
  if (!state.accessToken) {
    log("POST /api/notes", false, "No access_token.");
    return;
  }
  const { res, data } = await api("/api/notes", {
    method: "POST",
    headers: { authorization: `Bearer ${state.accessToken}` },
    body: { body: `Hello from ${$("agent-name").value || "agent"} at ${new Date().toLocaleTimeString()}` },
  });
  log("POST /api/notes (needs notes.write)", res.ok, data);
}

async function startClaim() {
  mark("claim", "now");
  if (!state.claimToken) {
    log("Start claim", false, "Register first.");
    return;
  }
  if (method() === "service_auth" && state.registration?.claim) {
    showCode(state.registration.claim);
    log("Claim materials already on the registration response", true, state.registration.claim);
    mark("claim");
    return;
  }
  const { res, data } = await api("/agent/identity/claim", {
    method: "POST",
    body: {
      claim_token: state.claimToken,
      email: $("login-hint").value.trim(),
    },
  });
  log("POST /agent/identity/claim", res.ok, data);
  if (res.ok) {
    showCode(data.claim_attempt);
    mark("claim");
  }
}

async function pollOnce() {
  if (!state.claimToken) {
    log("Poll", false, "No claim_token.");
    return { pending: true };
  }
  const form = new URLSearchParams({
    grant_type: "urn:workos:agent-auth:grant-type:claim",
    claim_token: state.claimToken,
  });
  const { res, data } = await api("/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const pending = data?.error === "authorization_pending";
  log("POST /oauth2/token (claim grant)", res.ok && !pending, data);
  if (res.ok && data.access_token) {
    state.assertion = data.identity_assertion ?? state.assertion;
    setCreds(data.access_token, data.scope, "post_claim");
    mark("claim");
    mark("token");
    return { pending: false, ok: true };
  }
  return { pending: pending || !res.ok, ok: false, data };
}

async function playWalkthrough() {
  logEl.replaceChildren();
  state.steps = new Set();
  setCreds(null, "", "");
  await discover();
  await register();
  if (method() === "anonymous") {
    await exchange();
    await getNotes();
    await postNote();
    await startClaim();
  } else {
    await startClaim();
  }
  log("Waiting on the human claim desk…", true, "Approve the 6-digit code, then this agent will pick up the token.");
  state.polling = true;
  for (let i = 0; i < 30 && state.polling; i += 1) {
    const result = await pollOnce();
    if (result.ok) {
      await getNotes();
      await postNote();
      state.polling = false;
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  state.polling = false;
}

async function refreshStatus() {
  const { data } = await api("/api/demo/state");
  renderRegs(data.registrations ?? []);
  renderTokens(data.tokens ?? []);
  renderNotes(data.notes ?? []);
  renderPending(data.registrations ?? []);
}

function renderRegs(regs) {
  const root = $("reg-list");
  if (!regs.length) {
    root.innerHTML = `<p class="empty">No agents yet. Play the mock agent walkthrough.</p>`;
    return;
  }
  root.replaceChildren(
    ...regs
      .slice()
      .reverse()
      .map((r) => {
        const el = document.createElement("article");
        el.className = "card";
        el.innerHTML = `
          <h3>${escapeHtml(r.agentName)} <span class="badge ${r.status}">${r.status}</span></h3>
          <p class="muted">${r.type} · ${r.id}</p>
          <p class="muted">pre: ${r.preClaimScopes.join(" ") || "—"}</p>
          <p class="muted">post: ${r.postClaimScopes.join(" ") || "—"}</p>
          ${r.ownerEmail ? `<p class="muted">owner ${escapeHtml(r.ownerEmail)}</p>` : ""}
        `;
        return el;
      }),
  );
}

function renderTokens(tokens) {
  const root = $("token-list");
  if (!tokens.length) {
    root.innerHTML = `<p class="empty">No tokens issued.</p>`;
    return;
  }
  root.replaceChildren(
    ...tokens
      .slice()
      .reverse()
      .map((t) => {
        const el = document.createElement("article");
        el.className = "card";
        const badge = t.revoked ? "revoked" : t.phase === "post_claim" ? "claimed" : "pending";
        el.innerHTML = `
          <h3><span class="badge ${badge}">${t.revoked ? "revoked" : t.phase}</span></h3>
          <p class="muted">${escapeHtml(t.token)}</p>
          <p class="muted">${escapeHtml(t.scopes.join(" "))}</p>
        `;
        return el;
      }),
  );
}

function renderNotes(notes) {
  const root = $("note-list");
  if (!notes.length) {
    root.innerHTML = `<p class="empty">Writes need post-claim <code>notes.write</code>.</p>`;
    return;
  }
  root.replaceChildren(
    ...notes
      .slice()
      .reverse()
      .map((n) => {
        const el = document.createElement("article");
        el.className = "card";
        el.innerHTML = `<p>${escapeHtml(n.body)}</p><p class="muted">${n.author} · ${n.registrationId}</p>`;
        return el;
      }),
  );
}

function renderPending(regs) {
  const pending = regs.filter((r) => r.status === "pending" && r.claimAttempt);
  const root = $("pending-claims");
  const focus = new URLSearchParams(location.search).get("claim_attempt_token");
  if (!pending.length) {
    root.innerHTML = `<p class="empty">No pending ceremony. Start a claim from the mock agent.</p>`;
    return;
  }
  root.replaceChildren(
    ...pending.map((r) => {
      const el = document.createElement("article");
      el.className = "card";
      if (focus && r.claimAttempt.claimAttemptToken === focus) el.classList.add("is-target");
      el.dataset.attempt = r.claimAttempt.claimAttemptToken;
      el.innerHTML = `
        <h3>${escapeHtml(r.agentName)} wants this workspace</h3>
        <p class="muted">${r.type} · requested ${escapeHtml(r.postClaimScopes.join(", "))}</p>
        <p class="muted">Currently holding ${escapeHtml(r.preClaimScopes.join(", ") || "no token yet")}</p>
        ${r.loginHint ? `<p class="muted">Bound to ${escapeHtml(r.loginHint)}</p>` : ""}
        <button type="button" data-pick="${r.claimAttempt.claimAttemptToken}">Use this claim</button>
      `;
      el.querySelector("button").addEventListener("click", () => {
        state.activeAttempt = r.claimAttempt.claimAttemptToken;
        $("claim-msg").textContent = `Selected ${r.agentName}. Enter the code the agent is showing.`;
      });
      return el;
    }),
  );
  if (focus) state.activeAttempt = focus;
  if (!state.activeAttempt && pending[0]) state.activeAttempt = pending[0].claimAttempt.claimAttemptToken;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function activeAttemptToken() {
  if (state.activeAttempt) return state.activeAttempt;
  const focus = new URLSearchParams(location.search).get("claim_attempt_token");
  return focus;
}

$("btn-discover").addEventListener("click", () => discover().then(refreshStatus));
$("btn-register").addEventListener("click", () => register().then(refreshStatus));
$("btn-exchange").addEventListener("click", () => exchange().then(refreshStatus));
$("btn-get-notes").addEventListener("click", () => getNotes().then(refreshStatus));
$("btn-write").addEventListener("click", () => postNote().then(refreshStatus));
$("btn-claim").addEventListener("click", () => startClaim().then(refreshStatus));
$("btn-poll").addEventListener("click", () => pollOnce().then(refreshStatus));
$("btn-walk").addEventListener("click", () => playWalkthrough().then(refreshStatus));

$("btn-reset").addEventListener("click", async () => {
  state.polling = false;
  state.registration = null;
  state.claimToken = null;
  state.assertion = null;
  state.steps = new Set();
  state.activeAttempt = null;
  setCreds(null, "", "");
  showCode(null);
  logEl.replaceChildren();
  await api("/api/demo/reset", { method: "POST" });
  mark("discover", "now");
  await refreshStatus();
});

$("claim-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const attempt = activeAttemptToken();
  if (!attempt) {
    claimMsg.className = "form-msg err";
    claimMsg.textContent = "No pending claim selected.";
    return;
  }
  const { res, data } = await api("/demo/claim/complete", {
    method: "POST",
    body: {
      claim_attempt_token: attempt,
      user_code: $("claim-code").value.trim(),
      owner_email: $("owner-email").value,
    },
  });
  claimMsg.className = `form-msg ${res.ok ? "ok" : "err"}`;
  claimMsg.textContent = res.ok
    ? `Claimed. The mock agent can poll for post-claim credentials.`
    : data.error_description || data.error || "Claim failed";
  await refreshStatus();
});

$("btn-deny").addEventListener("click", async () => {
  const attempt = activeAttemptToken();
  if (!attempt) return;
  const { res, data } = await api("/demo/claim/deny", {
    method: "POST",
    body: { claim_attempt_token: attempt },
  });
  claimMsg.className = `form-msg ${res.ok ? "ok" : "err"}`;
  claimMsg.textContent = res.ok ? "Denied." : data.error_description || "Deny failed";
  await refreshStatus();
});

mark("discover", "now");
discover();
refreshStatus();
setInterval(refreshStatus, 1500);
