import { beforeEach, describe, expect, test } from "bun:test";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createApp, MockBoxStore } from "../src/server/app";

const env = {};
let store: MockBoxStore;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  store = new MockBoxStore();
  await store.ready();
  app = createApp({ store });
});

describe("open-with save-back flow", () => {
  test("callback maps #file_id# / #auth_code# / #user_id# onto editor.html", async () => {
    const code = store.issueAuthCode("9001");
    const res = await app.request(
      `/open-with?file_id=9001&auth_code=${encodeURIComponent(code)}&user_id=1001`,
      { redirect: "manual" },
      env,
    );
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/editor.html");
    expect(location).toContain("file_id=9001");
    expect(location).toContain("user_id=1001");
    expect(location).toContain("auth_code=");
  });

  test("POST open-with form body is accepted (Box POST callback params)", async () => {
    const code = store.issueAuthCode("9002");
    const body = new URLSearchParams({
      file_id: "9002",
      auth_code: code,
      user_id: "1001",
      file_name: "SOW-2026-014-Box-Open-with.pdf",
    });
    const res = await app.request(
      "/open-with",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        redirect: "manual",
      },
      env,
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("file_id=9002");
  });

  test("auth_code → download → flatten-like upload → versions show v1 then v2", async () => {
    const minted = await app.request(
      "/api/demo/open-with-code",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file_id: "9001" }) },
      env,
    );
    const payload = (await minted.json()) as { auth_code: string; file_id: string; user_id: string };
    expect(payload.file_id).toBe("9001");
    expect(payload.user_id).toBe("1001");

    const tokenRes = await app.request(
      "/oauth2/token",
      {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: payload.auth_code,
          client_id: "mock_box_client_id",
          client_secret: "mock_box_client_secret",
        }),
      },
      env,
    );
    const token = (await tokenRes.json()) as { access_token: string };
    const headers = { authorization: `Bearer ${token.access_token}` };

    const fileRes = await app.request("/files/9001", { headers }, env);
    const file = (await fileRes.json()) as { etag: string; name: string; file_version: { id: string } };
    expect(file.etag).toBe("0");
    expect(file.file_version.id).toBe("9001v1");

    const pdfRes = await app.request("/files/9001/content", { headers }, env);
    const original = new Uint8Array(await pdfRes.arrayBuffer());

    const pdf = await PDFDocument.load(original);
    const page = pdf.getPages()[0];
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawText("SIGNED-IN-TEST", {
      x: 72,
      y: 120,
      size: 18,
      font,
      color: rgb(0.05, 0.55, 0.52),
    });
    const signed = await pdf.save();

    const form = new FormData();
    form.append("attributes", JSON.stringify({ name: file.name }));
    form.append("file", new Blob([signed], { type: "application/pdf" }), file.name);
    const upload = await app.request(
      "/files/9001/content",
      { method: "POST", headers: { ...headers, "If-Match": file.etag }, body: form },
      env,
    );
    expect(upload.status).toBe(200);
    const saved = (await upload.json()) as { entries: Array<{ etag: string; file_version: { id: string } }> };
    expect(saved.entries[0].etag).toBe("1");
    expect(saved.entries[0].file_version.id).toBe("9001v2");

    const versions = (await (
      await app.request("/files/9001/versions", { headers }, env)
    ).json()) as { total_count: number; entries: Array<{ id: string; version_number?: string }> };
    expect(versions.total_count).toBe(1);
    expect(versions.entries[0].id).toBe("9001v1");

    const latest = (await (await app.request("/files/9001", { headers }, env)).json()) as {
      etag: string;
      file_version: { id: string };
    };
    expect(latest.etag).toBe("1");
    expect(latest.file_version.id).toBe("9001v2");

    const stale = new FormData();
    stale.append("attributes", JSON.stringify({ name: file.name }));
    stale.append("file", new Blob([signed], { type: "application/pdf" }), file.name);
    const conflict = await app.request(
      "/files/9001/content",
      { method: "POST", headers: { ...headers, "If-Match": "0" }, body: stale },
      env,
    );
    expect(conflict.status).toBe(412);
  });

  test("demo-conflict then save with held etag is 412; retry with fresh etag succeeds", async () => {
    const code = store.issueAuthCode("9003");
    const tokenRes = await app.request(
      "/oauth2/token",
      {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: "mock_box_client_id",
          client_secret: "mock_box_client_secret",
        }),
      },
      env,
    );
    const token = (await tokenRes.json()) as { access_token: string };
    const headers = { authorization: `Bearer ${token.access_token}` };
    const file = (await (await app.request("/files/9003", { headers }, env)).json()) as {
      etag: string;
      name: string;
    };
    const held = file.etag;
    const sim = await app.request("/files/9003/demo-conflict", { method: "POST", headers }, env);
    expect(sim.status).toBe(200);

    const bytes = new Uint8Array(await (await app.request("/files/9003/content", { headers }, env)).arrayBuffer());
    const form = new FormData();
    form.append("attributes", JSON.stringify({ name: file.name }));
    form.append("file", new Blob([bytes], { type: "application/pdf" }), file.name);
    const first = await app.request(
      "/files/9003/content",
      { method: "POST", headers: { ...headers, "If-Match": held }, body: form },
      env,
    );
    expect(first.status).toBe(412);

    const latest = (await (await app.request("/files/9003", { headers }, env)).json()) as { etag: string };
    const form2 = new FormData();
    form2.append("attributes", JSON.stringify({ name: file.name }));
    form2.append("file", new Blob([bytes], { type: "application/pdf" }), file.name);
    const second = await app.request(
      "/files/9003/content",
      { method: "POST", headers: { ...headers, "If-Match": latest.etag }, body: form2 },
      env,
    );
    expect(second.status).toBe(200);
    const json = (await second.json()) as { entries: Array<{ etag: string }> };
    expect(Number(json.entries[0].etag)).toBeGreaterThan(Number(held));
  });
});
