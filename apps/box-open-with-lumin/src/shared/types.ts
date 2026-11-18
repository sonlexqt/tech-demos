export type BoxUser = {
  type: "user";
  id: string;
  name: string;
  login: string;
};

export type BoxFileVersionMini = {
  type: "file_version";
  id: string;
  sha1: string;
};

export type BoxFileVersion = BoxFileVersionMini & {
  name: string;
  size: number;
  created_at: string;
  modified_at: string;
  modified_by: BoxUser;
  version_number?: string;
};

export type BoxFileMini = {
  type: "file";
  id: string;
  etag: string;
  name: string;
  sequence_id: string;
  sha1: string;
  file_version: BoxFileVersionMini;
};

export type BoxFileFull = BoxFileMini & {
  size: number;
  created_at: string;
  modified_at: string;
  modified_by: BoxUser;
  parent: { type: "folder"; id: string; name: string };
  description?: string;
  extension?: string;
};

export type BoxFiles = {
  total_count: number;
  entries: BoxFileFull[];
};

export type BoxFileVersions = {
  total_count: number;
  entries: BoxFileVersion[];
  offset?: number;
  limit?: number;
};

export type BoxFolderItems = {
  total_count: number;
  entries: BoxFileFull[];
  offset?: number;
  limit?: number;
};

export type BoxTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: "bearer";
  refresh_token: string;
  restricted_to: Array<{
    scope: string;
    object?: { type: string; id: string; sequence_id?: string; etag?: string; name?: string };
  }>;
};

export type BoxClientError = {
  type: "error";
  status: number;
  code: string;
  help_url: string;
  message: string;
  request_id: string;
};

export type AppMode = "mock" | "live";

export type ModeResponse = {
  mode: AppMode;
  liveConfigured: boolean;
  user: BoxUser | null;
};
