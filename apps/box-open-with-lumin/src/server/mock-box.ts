import type {
  BoxClientError,
  BoxFileFull,
  BoxFileVersion,
  BoxFileVersionMini,
  BoxFiles,
  BoxFileVersions,
  BoxFolderItems,
  BoxTokenResponse,
  BoxUser,
} from "../shared/types";
import { requestId, sha1Hex } from "./sha1";
import { buildInvoicePdf, buildNdaPdf, buildSowPdf } from "./seed-pdfs";

export const MOCK_USER: BoxUser = {
  type: "user",
  id: "1001",
  name: "Avery Chen",
  login: "avery@acme.demo",
};

export const MOCK_CLIENT_ID = "mock_box_client_id";
export const MOCK_CLIENT_SECRET = "mock_box_client_secret";

type StoredVersion = {
  meta: BoxFileVersion;
  bytes: Uint8Array;
};

type StoredFile = {
  id: string;
  name: string;
  description: string;
  parent: { type: "folder"; id: string; name: string };
  versions: StoredVersion[];
};

type IssuedCode = {
  code: string;
  userId: string;
  fileId: string | null;
  expiresAt: number;
};

type IssuedToken = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  fileId: string | null;
  expiresAt: number;
};

function iso(ms = Date.now()): string {
  return new Date(ms).toISOString();
}

function error(status: number, code: string, message: string): BoxClientError {
  return {
    type: "error",
    status,
    code,
    help_url: "https://developer.box.com/guides/api-calls/permissions-and-errors/common-errors/",
    message,
    request_id: requestId(),
  };
}

export class MockBoxStore {
  files = new Map<string, StoredFile>();
  codes = new Map<string, IssuedCode>();
  tokens = new Map<string, IssuedToken>();
  user: BoxUser = { ...MOCK_USER };
  private seedPromise: Promise<void> | null = null;

  constructor() {
    this.seedPromise = this.seed();
  }

  async ready(): Promise<void> {
    await this.seedPromise;
  }

  async reset(): Promise<void> {
    this.files.clear();
    this.codes.clear();
    this.tokens.clear();
    this.user = { ...MOCK_USER };
    this.seedPromise = this.seed();
    await this.seedPromise;
  }

  private async seed(): Promise<void> {
    const now = Date.now();
    const specs: Array<{
      id: string;
      name: string;
      description: string;
      bytes: Uint8Array;
      created: number;
    }> = [
      {
        id: "9001",
        name: "Acme-Northwind-NDA.pdf",
        description: "Mutual NDA — sign on page 2 and save back as a new version.",
        bytes: await buildNdaPdf(),
        created: now - 86_400_000,
      },
      {
        id: "9002",
        name: "SOW-2026-014-Box-Open-with.pdf",
        description: "Statement of work for the Box Open-with channel spike.",
        bytes: await buildSowPdf(),
        created: now - 43_200_000,
      },
      {
        id: "9003",
        name: "Invoice-INV-1042.pdf",
        description: "Invoice — annotate approved/paid and version it.",
        bytes: await buildInvoicePdf(),
        created: now - 7_200_000,
      },
    ];

    for (const spec of specs) {
      const sha1 = await sha1Hex(spec.bytes);
      const version: StoredVersion = {
        bytes: spec.bytes,
        meta: {
          type: "file_version",
          id: `${spec.id}v1`,
          sha1,
          name: spec.name,
          size: spec.bytes.byteLength,
          created_at: iso(spec.created),
          modified_at: iso(spec.created),
          modified_by: this.user,
          version_number: "1",
        },
      };
      this.files.set(spec.id, {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        parent: { type: "folder", id: "0", name: "All Files" },
        versions: [version],
      });
    }
  }

  issueAuthCode(fileId: string | null = null, userId = this.user.id): string {
    const code = `acode_mock_${fileId ?? "none"}_${userId}_${requestId()}`;
    this.codes.set(code, {
      code,
      userId,
      fileId,
      expiresAt: Date.now() + 60_000,
    });
    return code;
  }

  exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
  ): BoxTokenResponse | BoxClientError {
    if (clientId && clientId !== MOCK_CLIENT_ID && !clientId.startsWith("mock")) {
      // Allow any mock-ish client so the demo UI does not need secrets.
    }
    if (clientSecret && clientSecret !== MOCK_CLIENT_SECRET && clientSecret.length > 0 && !clientSecret.startsWith("mock")) {
      // Same: mock mode accepts demo clients. Reject only clearly empty pairs when required.
    }
    const issued = this.codes.get(code);
    if (!issued || issued.expiresAt < Date.now()) {
      return error(400, "invalid_grant", "The authorization code is invalid or has expired.");
    }
    this.codes.delete(code);
    const accessToken = `atok_mock_${issued.userId}_${requestId()}`;
    const refreshToken = `rtok_mock_${requestId()}`;
    this.tokens.set(accessToken, {
      accessToken,
      refreshToken,
      userId: issued.userId,
      fileId: issued.fileId,
      expiresAt: Date.now() + 3600_000,
    });
    const file = issued.fileId ? this.files.get(issued.fileId) : undefined;
    const restricted_to = issued.fileId
      ? [
          {
            scope: "item_readwrite",
            object: file
              ? {
                  type: "file",
                  id: file.id,
                  sequence_id: String(file.versions.length - 1),
                  etag: String(file.versions.length - 1),
                  name: file.name,
                }
              : { type: "file", id: issued.fileId },
          },
        ]
      : [];
    return {
      access_token: accessToken,
      expires_in: 3600,
      token_type: "bearer",
      refresh_token: refreshToken,
      restricted_to,
    };
  }

  token(authHeader: string | undefined): IssuedToken | BoxClientError {
    const raw = authHeader?.replace(/^Bearer\s+/i, "").trim() ?? "";
    if (!raw) return error(401, "unauthorized", "A valid access token is required.");
    const tok = this.tokens.get(raw);
    if (!tok || tok.expiresAt < Date.now()) {
      return error(401, "unauthorized", "The access token is invalid or has expired.");
    }
    return tok;
  }

  listFolder(): BoxFolderItems {
    const entries = [...this.files.values()].map((f) => this.toFile(f));
    return { total_count: entries.length, entries, offset: 0, limit: 100 };
  }

  getFile(id: string): BoxFileFull | BoxClientError {
    const file = this.files.get(id);
    if (!file) return error(404, "not_found", `File ${id} not found.`);
    return this.toFile(file);
  }

  getContent(id: string): { bytes: Uint8Array; name: string } | BoxClientError {
    const file = this.files.get(id);
    if (!file) return error(404, "not_found", `File ${id} not found.`);
    const current = file.versions[file.versions.length - 1];
    return { bytes: current.bytes, name: file.name };
  }

  listVersions(id: string): BoxFileVersions | BoxClientError {
    const file = this.files.get(id);
    if (!file) return error(404, "not_found", `File ${id} not found.`);
    // Box returns previous versions only; current lives on the file object.
    const previous = file.versions.slice(0, -1).slice().reverse();
    return {
      total_count: previous.length,
      entries: previous.map((v) => v.meta),
      offset: 0,
      limit: 1000,
    };
  }

  async uploadVersion(
    id: string,
    bytes: Uint8Array,
    name: string | undefined,
    ifMatch: string | undefined,
  ): Promise<BoxFiles | BoxClientError> {
    const file = this.files.get(id);
    if (!file) return error(404, "not_found", `File ${id} not found.`);
    const currentEtag = String(file.versions.length - 1);
    if (ifMatch !== undefined && ifMatch !== "" && normalizeEtag(ifMatch) !== currentEtag) {
      return error(
        412,
        "precondition_failed",
        "The resource has been modified. Please retrieve the resource again and retry",
      );
    }
    if (name) file.name = name;
    const sha1 = await sha1Hex(bytes);
    const n = file.versions.length + 1;
    const now = iso();
    file.versions.push({
      bytes,
      meta: {
        type: "file_version",
        id: `${file.id}v${n}`,
        sha1,
        name: file.name,
        size: bytes.byteLength,
        created_at: now,
        modified_at: now,
        modified_by: this.user,
        version_number: String(n),
      },
    });
    return { total_count: 1, entries: [this.toFile(file)] };
  }

  /** Bump etag without going through the editor — demo 412 path. Re-uploads current bytes. */
  async simulateConcurrentEdit(id: string): Promise<BoxFileFull | BoxClientError> {
    const file = this.files.get(id);
    if (!file) return error(404, "not_found", `File ${id} not found.`);
    const current = file.versions[file.versions.length - 1];
    const result = await this.uploadVersion(id, current.bytes, file.name, String(file.versions.length - 1));
    if (isBoxError(result)) return result;
    return result.entries[0];
  }

  private toFile(file: StoredFile): BoxFileFull {
    const current = file.versions[file.versions.length - 1];
    const etag = String(file.versions.length - 1);
    const mini: BoxFileVersionMini = {
      type: "file_version",
      id: current.meta.id,
      sha1: current.meta.sha1,
    };
    return {
      type: "file",
      id: file.id,
      etag,
      name: file.name,
      sequence_id: etag,
      sha1: current.meta.sha1,
      file_version: mini,
      size: current.meta.size,
      created_at: file.versions[0].meta.created_at,
      modified_at: current.meta.modified_at,
      modified_by: this.user,
      parent: file.parent,
      description: file.description,
      extension: "pdf",
    };
  }
}

export function isBoxError(value: unknown): value is BoxClientError {
  return Boolean(value && typeof value === "object" && "type" in value && (value as BoxClientError).type === "error");
}

export function normalizeEtag(value: string): string {
  return value.replaceAll('"', "").trim();
}

export function errorStatus(err: BoxClientError): number {
  return err.status;
}
