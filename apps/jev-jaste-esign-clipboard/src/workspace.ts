import type { ApiSigner, Proposal, Workspace } from "./types";

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

function displayName(proposal: Proposal, email: string) {
  return proposal.name?.trim() || email.split("@")[0] || "Unknown";
}

function upsertSigner(workspace: Workspace, next: ApiSigner): Workspace {
  const key = emailKey(next.email_address);
  const exists = workspace.signers.some((s) => emailKey(s.email_address) === key);
  return {
    ...workspace,
    viewers: workspace.viewers.filter((v) => emailKey(v.email_address) !== key),
    signers: exists
      ? workspace.signers.map((s) =>
          emailKey(s.email_address) === key
            ? {
                ...s,
                ...next,
                verification: next.verification ?? s.verification,
              }
            : s,
        )
      : [...workspace.signers, next],
  };
}

export function applyProposal(workspace: Workspace, proposal: Proposal): Workspace {
  if (proposal.target === "title") {
    return { ...workspace, title: proposal.value.trim() };
  }

  if (proposal.target === "signer") {
    const email = proposal.value.trim();
    if (!email) return workspace;
    return upsertSigner(workspace, {
      name: displayName(proposal, email),
      email_address: email,
      group: proposal.group,
    });
  }

  if (proposal.target === "verification") {
    const email = proposal.value.trim();
    if (!email || !proposal.verification) return workspace;
    const existing = workspace.signers.find((s) => emailKey(s.email_address) === emailKey(email));
    return upsertSigner(workspace, {
      name: existing?.name || displayName(proposal, email),
      email_address: existing?.email_address || email,
      group: existing?.group ?? proposal.group,
      verification: proposal.verification,
    });
  }

  if (proposal.target === "viewer") {
    const email = proposal.value.trim();
    if (!email) return workspace;
    const key = emailKey(email);
    const row = { name: displayName(proposal, email), email_address: email };
    const exists = workspace.viewers.some((v) => emailKey(v.email_address) === key);
    return {
      ...workspace,
      signers: workspace.signers.filter((s) => emailKey(s.email_address) !== key),
      viewers: exists
        ? workspace.viewers.map((v) => (emailKey(v.email_address) === key ? row : v))
        : [...workspace.viewers, row],
    };
  }

  if (proposal.target === "expires_at") {
    const ms = Number(proposal.value);
    if (!Number.isFinite(ms)) return workspace;
    return { ...workspace, expires_at: ms };
  }

  if (proposal.target === "signing_type") {
    if (proposal.value !== "ORDER" && proposal.value !== "SAME_TIME") return workspace;
    return { ...workspace, signing_type: proposal.value };
  }

  if (proposal.target === "use_text_tags") {
    return { ...workspace, use_text_tags: proposal.value === "true" };
  }

  if (proposal.target === "custom_email.subject_name") {
    return { ...workspace, custom_email: { ...workspace.custom_email, subject_name: proposal.value } };
  }
  if (proposal.target === "custom_email.title") {
    return { ...workspace, custom_email: { ...workspace.custom_email, title: proposal.value } };
  }
  if (proposal.target === "custom_email.sender_email") {
    return { ...workspace, custom_email: { ...workspace.custom_email, sender_email: proposal.value } };
  }

  return workspace;
}

export function applyProposals(workspace: Workspace, proposals: Proposal[]): Workspace {
  return proposals.reduce(applyProposal, workspace);
}

export const TARGET_LABELS: Record<Proposal["target"], string> = {
  title: "title",
  signer: "signers[]",
  viewer: "viewers[]",
  expires_at: "expires_at",
  signing_type: "signing_type",
  "custom_email.subject_name": "custom_email.subject_name",
  "custom_email.title": "custom_email.title",
  "custom_email.sender_email": "custom_email.sender_email",
  use_text_tags: "use_text_tags",
  verification: "signers[].verification",
};
