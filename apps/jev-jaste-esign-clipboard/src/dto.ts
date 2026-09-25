import type { CustomEmail, SignatureRequestDTO, Workspace } from "./types";

/** Public sample PDF — not uploaded; `file_url` is mutually exclusive with file/files/file_urls. */
export const SAMPLE_FILE_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function defaultExpiresAt(now = Date.now()): number {
  return now + THIRTY_DAYS_MS;
}

export function emptyWorkspace(now = Date.now()): Workspace {
  return {
    file_url: SAMPLE_FILE_URL,
    title: "",
    signers: [],
    viewers: [],
    expires_at: defaultExpiresAt(now),
    signing_type: "ORDER",
    use_text_tags: false,
    custom_email: {},
  };
}

function compactEmail(email: CustomEmail): CustomEmail | undefined {
  const next: CustomEmail = {};
  if (email.sender_email?.trim()) next.sender_email = email.sender_email.trim();
  if (email.subject_name?.trim()) next.subject_name = email.subject_name.trim();
  if (email.title?.trim()) next.title = email.title.trim();
  return Object.keys(next).length ? next : undefined;
}

/** Outgoing body for POST /v1/signature_request/send (not transmitted). */
export function toSignatureRequestDTO(workspace: Workspace): SignatureRequestDTO {
  const signers = [...workspace.signers]
    .sort((a, b) => (a.group ?? 99) - (b.group ?? 99))
    .map((signer) => {
      const row: SignatureRequestDTO["signers"][number] = {
        name: signer.name,
        email_address: signer.email_address,
      };
      if (workspace.signing_type === "ORDER" && signer.group != null) {
        row.group = signer.group;
      }
      if (signer.verification) row.verification = signer.verification;
      return row;
    });

  const dto: SignatureRequestDTO = {
    file_url: workspace.file_url,
    title: workspace.title,
    signers,
    expires_at: workspace.expires_at,
    signing_type: workspace.signing_type,
    use_text_tags: workspace.use_text_tags,
  };

  if (workspace.viewers.length) dto.viewers = workspace.viewers;
  const custom = compactEmail(workspace.custom_email);
  if (custom) dto.custom_email = custom;
  return dto;
}

export function dtoIssues(workspace: Workspace): string[] {
  const issues: string[] = [];
  if (!workspace.title.trim()) issues.push("title");
  if (!workspace.signers.length) issues.push("signers[]");
  if (!workspace.expires_at || workspace.expires_at <= Date.now()) issues.push("expires_at");
  if (workspace.signing_type === "ORDER" && workspace.signers.some((s) => s.group == null)) {
    issues.push("signers[].group (required when signing_type is ORDER)");
  }
  return issues;
}

export function formatExpires(ms: number): string {
  try {
    return new Date(ms).toISOString();
  } catch {
    return String(ms);
  }
}
