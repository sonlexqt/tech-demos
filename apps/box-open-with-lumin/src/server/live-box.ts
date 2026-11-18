import {
  BoxClient,
  BoxDeveloperTokenAuth,
  BoxOAuth,
  OAuthConfig,
} from "box-node-sdk";
import type { Bindings } from "./env";

export function authorizeUrl(env: Bindings, redirectUri: string, state: string): string {
  const auth = new BoxOAuth({
    config: new OAuthConfig({
      clientId: env.BOX_CLIENT_ID!,
      clientSecret: env.BOX_CLIENT_SECRET!,
    }),
  });
  return auth.getAuthorizeUrl({
    redirectUri,
    state,
  });
}

export async function exchangeAuthorizationCode(
  env: Bindings,
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const auth = new BoxOAuth({
    config: new OAuthConfig({
      clientId: env.BOX_CLIENT_ID!,
      clientSecret: env.BOX_CLIENT_SECRET!,
    }),
  });
  void redirectUri;
  const token = await auth.getTokensAuthorizationCodeGrant(code);
  const accessToken = token.accessToken;
  if (!accessToken) {
    throw new Error("Box token response did not include access_token");
  }
  return {
    accessToken,
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn ?? 3600,
  };
}

export function clientForToken(accessToken: string): BoxClient {
  return new BoxClient({
    auth: new BoxDeveloperTokenAuth({ token: accessToken }),
  });
}

export async function liveGetFile(accessToken: string, fileId: string) {
  const client = clientForToken(accessToken);
  return client.files.getFileById(fileId, {
    queryParams: {
      fields: [
        "id",
        "type",
        "name",
        "etag",
        "sequence_id",
        "sha1",
        "size",
        "created_at",
        "modified_at",
        "modified_by",
        "file_version",
        "parent",
        "description",
        "extension",
      ],
    },
  });
}

export async function liveDownload(accessToken: string, fileId: string): Promise<Uint8Array> {
  const client = clientForToken(accessToken);
  const stream = await client.downloads.downloadFile(fileId);
  if (!stream) throw new Error("Box download returned empty body");
  const chunks: Uint8Array[] = [];
  const web = stream as unknown as ReadableStream<Uint8Array>;
  if (typeof web.getReader === "function") {
    const reader = web.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } else {
    for await (const chunk of stream as AsyncIterable<Uint8Array | string>) {
      chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk));
    }
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function liveListVersions(accessToken: string, fileId: string) {
  const client = clientForToken(accessToken);
  return client.fileVersions.getFileVersions(fileId);
}

export async function liveUploadVersion(
  accessToken: string,
  fileId: string,
  name: string,
  bytes: Uint8Array,
  ifMatch: string | undefined,
) {
  const client = clientForToken(accessToken);
  const file = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return client.uploads.uploadFileVersion(
    fileId,
    {
      attributes: { name },
      file: file as never,
      fileFileName: name,
      fileContentType: "application/pdf",
    },
    {
      headers: ifMatch ? { ifMatch } : {},
    },
  );
}

export async function liveFolderItems(accessToken: string, folderId = "0") {
  const client = clientForToken(accessToken);
  return client.folders.getFolderItems(folderId, {
    queryParams: {
      fields: ["id", "type", "name", "etag", "size", "modified_at", "extension", "sha1", "file_version"],
    },
  });
}

export async function liveMe(accessToken: string) {
  const client = clientForToken(accessToken);
  return client.users.getUserMe();
}
