import { beforeEach, describe, expect, test } from "bun:test";
import { createApp, MockBoxStore } from "../src/server/app";
import { isBoxError } from "../src/server/mock-box";

const env = {};
let store: MockBoxStore;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  store = new MockBoxStore();
  await store.ready();
  app = createApp({ store });
});

async function tokenFor(fileId = "9001"): Promise<string> {
  const code = store.issueAuthCode(fileId);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: "mock_box_client_id",
    client_secret: "mock_box_client_secret",
  });
  const res = await app.request("/oauth2/token", { method: "POST", body }, env);
  expect(res.status).toBe(200);
  const json = (await res.json()) as { access_token: string; token_type: string; restricted_to: unknown[] };
  expect(json.token_type).toBe("bearer");
  expect(json.access_token.startsWith("atok_mock_")).toBe(true);
  expect(json.restricted_to.length).toBe(1);
  return json.access_token;
}

describe("mock Box API contract", () => {
  test("health defaults to mock mode", async () => {
    const res = await app.request("/api/health", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, mode: "mock" });
  });

  test("lists seeded PDFs", async () => {
    const res = await app.request("/folders/0/items", {}, env);
    const json = (await res.json()) as { total_count: number; entries: Array<{ id: string; name: string; etag: string }> };
    expect(json.total_count).toBe(3);
    expect(json.entries.map((e) => e.id).sort()).toEqual(["9001", "9002", "9003"]);
    expect(json.entries[0].etag).toBe("0");
  });

  test("GET /files/:id returns etag and current file_version", async () => {
    const token = await tokenFor();
    const res = await app.request("/files/9001", { headers: { authorization: `Bearer ${token}` } }, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toBe('"0"');
    const file = (await res.json()) as { id: string; etag: string; file_version: { id: string }; name: string };
    expect(file.id).toBe("9001");
    expect(file.etag).toBe("0");
    expect(file.name).toContain("NDA");
    expect(file.file_version.id).toBe("9001v1");
  });

  test("GET /files/:id/content is a PDF", async () => {
    const token = await tokenFor();
    const res = await app.request("/files/9001/content", { headers: { authorization: `Bearer ${token}` } }, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");
  });

  test("upload with matching If-Match increments etag/version", async () => {
    const token = await tokenFor();
    const original = await app.request("/files/9001/content", { headers: { authorization: `Bearer ${token}` } }, env);
    const bytes = new Uint8Array(await original.arrayBuffer());
    const form = new FormData();
    form.append("attributes", JSON.stringify({ name: "Acme-Northwind-NDA.pdf" }));
    form.append("file", new Blob([bytes], { type: "application/pdf" }), "Acme-Northwind-NDA.pdf");
    const res = await app.request(
      "/files/9001/content",
      { method: "POST", headers: { authorization: `Bearer ${token}`, "If-Match": "0" }, body: form },
      env,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { entries: Array<{ etag: string; file_version: { id: string } }> };
    expect(json.entries[0].etag).toBe("1");
    expect(json.entries[0].file_version.id).toBe("9001v2");
  });

  test("upload with stale If-Match returns 412 precondition_failed", async () => {
    const token = await tokenFor();
    const bumped = await store.simulateConcurrentEdit("9001");
    expect(isBoxError(bumped)).toBe(false);
    const form = new FormData();
    form.append("attributes", JSON.stringify({ name: "Acme-Northwind-NDA.pdf" }));
    form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "application/pdf" }), "Acme-Northwind-NDA.pdf");
    const res = await app.request(
      "/files/9001/content",
      { method: "POST", headers: { authorization: `Bearer ${token}`, "If-Match": "0" }, body: form },
      env,
    );
    expect(res.status).toBe(412);
    const json = (await res.json()) as { code: string; status: number };
    expect(json.status).toBe(412);
    expect(json.code).toBe("precondition_failed");
  });

  test("GET /files/:id/versions lists previous versions only", async () => {
    const token = await tokenFor();
    const original = store.getContent("9001");
    if (isBoxError(original)) throw new Error("missing seed");
    await store.uploadVersion("9001", original.bytes, original.name, "0");
    const res = await app.request("/files/9001/versions", { headers: { authorization: `Bearer ${token}` } }, env);
    const json = (await res.json()) as { total_count: number; entries: Array<{ version_number?: string; id: string }> };
    expect(json.total_count).toBe(1);
    expect(json.entries[0].id).toBe("9001v1");
    expect(json.entries[0].version_number).toBe("1");
  });

  test("expired or missing token is 401", async () => {
    const res = await app.request("/files/9001", { headers: { authorization: "Bearer nope" } }, env);
    expect(res.status).toBe(401);
  });
});
