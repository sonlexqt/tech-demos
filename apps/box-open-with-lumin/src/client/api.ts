import type {
  BoxFileFull,
  BoxFileVersions,
  BoxFolderItems,
  BoxTokenResponse,
  ModeResponse,
} from "../shared/types";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: string }).message)
        : `${res.status} ${res.statusText}`;
    const err = new Error(message) as Error & { status: number; body: unknown };
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as T;
}

export async function getMode(): Promise<ModeResponse> {
  return parseJson(await fetch("/api/mode"));
}

export async function listFiles(): Promise<BoxFolderItems> {
  return parseJson(await fetch("/api/files"));
}

export async function mintOpenWith(fileId: string): Promise<{
  file_id: string;
  auth_code: string;
  user_id: string;
  file_name: string;
  callback_path: string;
}> {
  return parseJson(
    await fetch("/api/demo/open-with-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    }),
  );
}

export async function resetDemo(): Promise<void> {
  await parseJson(await fetch("/api/demo/reset", { method: "POST" }));
}

export async function exchangeCode(code: string): Promise<BoxTokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", "mock_box_client_id");
  body.set("client_secret", "mock_box_client_secret");
  return parseJson(
    await fetch("/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }),
  );
}

function authHeaders(token: string, extra?: Record<string, string>): HeadersInit {
  return { authorization: `Bearer ${token}`, ...extra };
}

export async function getFile(token: string, fileId: string): Promise<BoxFileFull> {
  return parseJson(await fetch(`/files/${encodeURIComponent(fileId)}`, { headers: authHeaders(token) }));
}

export async function downloadFile(token: string, fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(`/files/${encodeURIComponent(fileId)}/content`, { headers: authHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Download failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.arrayBuffer();
}

export async function listVersions(token: string, fileId: string): Promise<BoxFileVersions> {
  return parseJson(
    await fetch(`/files/${encodeURIComponent(fileId)}/versions`, { headers: authHeaders(token) }),
  );
}

export async function uploadVersion(
  token: string,
  fileId: string,
  name: string,
  bytes: Uint8Array,
  etag: string,
): Promise<{ status: number; file?: BoxFileFull; conflict?: boolean; message?: string }> {
  const form = new FormData();
  form.append("attributes", JSON.stringify({ name }));
  form.append("file", new Blob([bytes], { type: "application/pdf" }), name);
  const res = await fetch(`/files/${encodeURIComponent(fileId)}/content`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "If-Match": etag },
    body: form,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (res.status === 412) {
    return { status: 412, conflict: true, message: (data as { message?: string })?.message };
  }
  if (!res.ok) {
    const message = (data as { message?: string })?.message ?? `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  const entries = (data as { entries?: BoxFileFull[] })?.entries;
  return { status: res.status, file: entries?.[0] };
}

export async function simulateConflict(token: string, fileId: string): Promise<BoxFileFull> {
  return parseJson(
    await fetch(`/files/${encodeURIComponent(fileId)}/demo-conflict`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  );
}
