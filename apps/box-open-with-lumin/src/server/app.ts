import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import type { BoxClientError } from "../shared/types";
import { type Bindings, isLiveConfigured, redirectUri } from "./env";
import {
  errorStatus,
  isBoxError,
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MockBoxStore,
  normalizeEtag,
} from "./mock-box";
import {
  authorizeUrl,
  exchangeAuthorizationCode,
  liveDownload,
  liveFolderItems,
  liveGetFile,
  liveListVersions,
  liveMe,
  liveUploadVersion,
} from "./live-box";

export type AppOptions = {
  store?: MockBoxStore;
};

type C = Context<{ Bindings: Bindings }>;

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function boxError(err: BoxClientError): Response {
  return json(err, errorStatus(err));
}

function bearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  return header.replace(/^Bearer\s+/i, "").trim() || undefined;
}

async function readUpload(req: Request): Promise<{ bytes: Uint8Array; name?: string; ifMatch?: string }> {
  const ifMatchRaw = req.headers.get("if-match") ?? req.headers.get("If-Match") ?? undefined;
  const ifMatch = ifMatchRaw ? normalizeEtag(ifMatchRaw) : undefined;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const attributesRaw = form.get("attributes");
    let name: string | undefined;
    if (typeof attributesRaw === "string") {
      try {
        const parsed = JSON.parse(attributesRaw) as { name?: string };
        name = parsed.name;
      } catch {
        name = undefined;
      }
    }
    const file = form.get("file");
    if (!file || typeof file === "string" || typeof (file as Blob).arrayBuffer !== "function") {
      throw Object.assign(new Error("missing file part"), { status: 400 });
    }
    const blob = file as Blob & { name?: string };
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!name && blob.name) name = blob.name;
    return { bytes, name, ifMatch };
  }
  const bytes = new Uint8Array(await req.arrayBuffer());
  return { bytes, ifMatch };
}

export function createApp(options: AppOptions = {}) {
  const store = options.store ?? new MockBoxStore();
  const app = new Hono<{ Bindings: Bindings }>();

  app.use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Authorization", "Content-Type", "If-Match", "if-match"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      exposeHeaders: ["ETag", "etag"],
    }),
  );

  app.use("*", async (_c, next) => {
    await store.ready();
    await next();
  });

  const handleToken = async (c: C) => {
    const env = c.env;
    const contentType = c.req.header("content-type") ?? "";
    let grantType = "";
    let code = "";
    let clientId = "";
    let clientSecret = "";
    let redirect = "";
    if (contentType.includes("application/json")) {
      const body = (await c.req.json()) as Record<string, string>;
      grantType = body.grant_type ?? "";
      code = body.code ?? "";
      clientId = body.client_id ?? "";
      clientSecret = body.client_secret ?? "";
      redirect = body.redirect_uri ?? "";
    } else {
      const body = await c.req.parseBody();
      grantType = String(body.grant_type ?? "");
      code = String(body.code ?? "");
      clientId = String(body.client_id ?? env.BOX_CLIENT_ID ?? MOCK_CLIENT_ID);
      clientSecret = String(body.client_secret ?? env.BOX_CLIENT_SECRET ?? MOCK_CLIENT_SECRET);
      redirect = String(body.redirect_uri ?? "");
    }

    if (grantType !== "authorization_code") {
      return json(
        {
          type: "error",
          status: 400,
          code: "unsupported_grant_type",
          help_url: "https://developer.box.com/reference/post-oauth2-token",
          message: "grant_type must be authorization_code",
          request_id: crypto.randomUUID(),
        } satisfies BoxClientError,
        400,
      );
    }

    if (isLiveConfigured(env) && !code.startsWith("acode_mock_")) {
      try {
        const origin = new URL(c.req.url).origin;
        const token = await exchangeAuthorizationCode(env, code, redirect || redirectUri(env, origin));
        return json({
          access_token: token.accessToken,
          expires_in: token.expiresIn,
          token_type: "bearer",
          refresh_token: token.refreshToken ?? "",
          restricted_to: [],
        });
      } catch (err) {
        return json(
          {
            type: "error",
            status: 400,
            code: "invalid_grant",
            help_url: "https://developer.box.com/reference/post-oauth2-token",
            message: err instanceof Error ? err.message : "Token exchange failed",
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          400,
        );
      }
    }

    const result = store.exchangeCode(code, clientId || MOCK_CLIENT_ID, clientSecret || MOCK_CLIENT_SECRET);
    if (isBoxError(result)) return boxError(result);
    return json(result);
  };

  app.post("/oauth2/token", (c) => handleToken(c));
  app.post("/2.0/oauth2/token", (c) => handleToken(c));

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      mode: isLiveConfigured(c.env) ? "live" : "mock",
    }),
  );

  app.get("/api/mode", (c) =>
    c.json({
      mode: isLiveConfigured(c.env) ? "live" : "mock",
      liveConfigured: isLiveConfigured(c.env),
      user: isLiveConfigured(c.env) ? null : store.user,
    }),
  );

  app.post("/api/demo/reset", async (c) => {
    if (isLiveConfigured(c.env)) {
      return c.json({ ok: false, message: "Reset is mock-only" }, 400);
    }
    await store.reset();
    return c.json({ ok: true });
  });

  app.post("/api/demo/open-with-code", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { file_id?: string };
    const fileId = body.file_id;
    if (!fileId) return c.json({ message: "file_id required" }, 400);
    const file = store.getFile(fileId);
    if (isBoxError(file)) return boxError(file);
    const auth_code = store.issueAuthCode(fileId);
    return c.json({
      file_id: fileId,
      auth_code,
      user_id: store.user.id,
      file_name: file.name,
      file_extension: "pdf",
      callback_path: `/open-with?file_id=${encodeURIComponent(fileId)}&auth_code=${encodeURIComponent(auth_code)}&user_id=${encodeURIComponent(store.user.id)}`,
    });
  });

  app.get("/api/auth/login", (c) => {
    const env = c.env;
    const origin = new URL(c.req.url).origin;
    const fileId = c.req.query("file_id") ?? "";
    if (!isLiveConfigured(env)) {
      const code = store.issueAuthCode(fileId || null);
      const dest = fileId
        ? `/open-with?file_id=${encodeURIComponent(fileId)}&auth_code=${encodeURIComponent(code)}&user_id=${encodeURIComponent(store.user.id)}`
        : `/?auth_code=${encodeURIComponent(code)}`;
      return c.redirect(dest);
    }
    const url = authorizeUrl(env, redirectUri(env, origin), fileId);
    return c.redirect(url);
  });

  app.get("/api/auth/callback", async (c) => {
    const code = c.req.query("code") ?? "";
    const fileId = c.req.query("state") ?? "";
    const dest = fileId
      ? `/editor.html?file_id=${encodeURIComponent(fileId)}&auth_code=${encodeURIComponent(code)}`
      : `/editor.html?auth_code=${encodeURIComponent(code)}`;
    return c.redirect(dest);
  });

  const openWith = async (c: C) => {
    const query = new URL(c.req.url).searchParams;
    let fileId = query.get("file_id") ?? "";
    let authCode = query.get("auth_code") ?? "";
    let userId = query.get("user_id") ?? "";
    let fileName = query.get("file_name") ?? "";
    if (c.req.method === "POST") {
      const body = await c.req.parseBody();
      fileId = fileId || String(body.file_id ?? body["#file_id#"] ?? "");
      authCode = authCode || String(body.auth_code ?? body["#auth_code#"] ?? "");
      userId = userId || String(body.user_id ?? body["#user_id#"] ?? "");
      fileName = fileName || String(body.file_name ?? "");
    }
    const dest = new URLSearchParams();
    if (fileId) dest.set("file_id", fileId);
    if (authCode) dest.set("auth_code", authCode);
    if (userId) dest.set("user_id", userId);
    if (fileName) dest.set("file_name", fileName);
    // Relative Location so Vite's proxy (and Pages) keep the browser on the UI origin.
    return new Response(null, {
      status: 302,
      headers: { Location: `/editor.html?${dest.toString()}` },
    });
  };

  app.get("/open-with", (c) => openWith(c));
  app.post("/open-with", (c) => openWith(c));

  const requireToken = (c: C) => {
    const token = bearer(c.req.header("authorization") ?? c.req.header("Authorization"));
    if (isLiveConfigured(c.env) && token && !token.startsWith("atok_mock_")) {
      return { live: true as const, token };
    }
    const mock = store.token(c.req.header("authorization") ?? c.req.header("Authorization"));
    if (isBoxError(mock)) return mock;
    return { live: false as const, token: mock.accessToken, fileId: mock.fileId };
  };

  app.get("/users/me", async (c) => {
    const auth = requireToken(c);
    if (isBoxError(auth)) return boxError(auth);
    if (auth.live) {
      try {
        const me = await liveMe(auth.token);
        return json(me);
      } catch (err) {
        return json(
          {
            type: "error",
            status: 401,
            code: "unauthorized",
            help_url: "https://developer.box.com/reference",
            message: err instanceof Error ? err.message : "users/me failed",
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          401,
        );
      }
    }
    return json(store.user);
  });

  const listItems = async (c: C) => {
    const env = c.env;
    const header = c.req.header("authorization") ?? c.req.header("Authorization");
    if (isLiveConfigured(env) && bearer(header) && !bearer(header)!.startsWith("atok_mock_")) {
      try {
        const items = await liveFolderItems(bearer(header)!, "0");
        return json(items);
      } catch (err) {
        return json(
          {
            type: "error",
            status: 400,
            code: "bad_request",
            help_url: "https://developer.box.com/reference",
            message: err instanceof Error ? err.message : "folder items failed",
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          400,
        );
      }
    }
    return json(store.listFolder());
  };

  app.get("/folders/:id/items", (c) => listItems(c));
  app.get("/2.0/folders/:id/items", (c) => listItems(c));
  app.get("/api/files", (_c) => json(store.listFolder()));

  const getFile = async (c: C) => {
    const id = c.req.param("id") ?? "";
    const auth = requireToken(c);
    if (isBoxError(auth)) return boxError(auth);
    if (auth.live) {
      try {
        const file = await liveGetFile(auth.token, id);
        const res = json(file);
        if (file.etag) res.headers.set("ETag", `"${file.etag}"`);
        return res;
      } catch (err) {
        return json(
          {
            type: "error",
            status: 404,
            code: "not_found",
            help_url: "https://developer.box.com/reference/get-files-id",
            message: err instanceof Error ? err.message : "get file failed",
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          404,
        );
      }
    }
    const file = store.getFile(id);
    if (isBoxError(file)) return boxError(file);
    const res = json(file);
    res.headers.set("ETag", `"${file.etag}"`);
    return res;
  };

  app.get("/files/:id", (c) => getFile(c));
  app.get("/2.0/files/:id", (c) => getFile(c));

  const getContent = async (c: C) => {
    const id = c.req.param("id") ?? "";
    const auth = requireToken(c);
    if (isBoxError(auth)) return boxError(auth);
    if (auth.live) {
      try {
        const bytes = await liveDownload(auth.token, id);
        return new Response(bytes, {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="${id}.pdf"`,
          },
        });
      } catch (err) {
        return json(
          {
            type: "error",
            status: 404,
            code: "not_found",
            help_url: "https://developer.box.com/reference/get-files-id-content",
            message: err instanceof Error ? err.message : "download failed",
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          404,
        );
      }
    }
    const content = store.getContent(id);
    if (isBoxError(content)) return boxError(content);
    return new Response(content.bytes, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${content.name}"`,
      },
    });
  };

  app.get("/files/:id/content", (c) => getContent(c));
  app.get("/2.0/files/:id/content", (c) => getContent(c));

  const postContent = async (c: C) => {
    const id = c.req.param("id") ?? "";
    const auth = requireToken(c);
    if (isBoxError(auth)) return boxError(auth);
    let upload: { bytes: Uint8Array; name?: string; ifMatch?: string };
    try {
      upload = await readUpload(c.req.raw);
    } catch {
      return json(
        {
          type: "error",
          status: 400,
          code: "bad_request",
          help_url: "https://developer.box.com/reference/post-files-id-content",
          message: "Expected multipart attributes + file parts",
          request_id: crypto.randomUUID(),
        } satisfies BoxClientError,
        400,
      );
    }
    if (auth.live) {
      try {
        const result = await liveUploadVersion(
          auth.token,
          id,
          upload.name ?? `${id}.pdf`,
          upload.bytes,
          upload.ifMatch,
        );
        return json(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "upload failed";
        const precondition = /412|precondition|etag|if-match/i.test(message);
        return json(
          {
            type: "error",
            status: precondition ? 412 : 400,
            code: precondition ? "precondition_failed" : "bad_request",
            help_url: "https://developer.box.com/guides/api-calls/ensure-consistency/",
            message: precondition
              ? "The resource has been modified. Please retrieve the resource again and retry"
              : message,
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          precondition ? 412 : 400,
        );
      }
    }
    const result = await store.uploadVersion(id, upload.bytes, upload.name, upload.ifMatch);
    if (isBoxError(result)) return boxError(result);
    const res = json(result);
    res.headers.set("ETag", `"${result.entries[0].etag}"`);
    return res;
  };

  app.post("/files/:id/content", (c) => postContent(c));
  app.post("/2.0/files/:id/content", (c) => postContent(c));

  const getVersions = async (c: C) => {
    const id = c.req.param("id") ?? "";
    const auth = requireToken(c);
    if (isBoxError(auth)) return boxError(auth);
    if (auth.live) {
      try {
        const versions = await liveListVersions(auth.token, id);
        return json(versions);
      } catch (err) {
        return json(
          {
            type: "error",
            status: 400,
            code: "bad_request",
            help_url: "https://developer.box.com/reference/get-files-id-versions",
            message: err instanceof Error ? err.message : "versions failed",
            request_id: crypto.randomUUID(),
          } satisfies BoxClientError,
          400,
        );
      }
    }
    const versions = store.listVersions(id);
    if (isBoxError(versions)) return boxError(versions);
    return json(versions);
  };

  app.get("/files/:id/versions", (c) => getVersions(c));
  app.get("/2.0/files/:id/versions", (c) => getVersions(c));

  app.post("/files/:id/demo-conflict", async (c) => {
    if (isLiveConfigured(c.env)) {
      return c.json({ message: "Simulate conflict is mock-only" }, 400);
    }
    const auth = store.token(c.req.header("authorization") ?? c.req.header("Authorization"));
    if (isBoxError(auth)) return boxError(auth);
    const result = await store.simulateConcurrentEdit(c.req.param("id") ?? "");
    if (isBoxError(result)) return boxError(result);
    return json(result);
  });

  return app;
}

export { MockBoxStore };
