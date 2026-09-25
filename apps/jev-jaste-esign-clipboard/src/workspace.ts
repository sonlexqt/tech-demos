import type { Proposal, Signer, Workspace } from "./types";

export function emptyWorkspace(): Workspace {
  return {
    title: "Master Services Agreement — Acme × Harbor",
    company: "",
    address: "",
    email: "",
    clause: "",
    signers: [],
  };
}

function signerId(email: string) {
  return email.trim().toLowerCase();
}

export function applyProposal(workspace: Workspace, proposal: Proposal): Workspace {
  if (proposal.target === "signer") {
    const email = proposal.value.trim();
    if (!email) return workspace;
    const id = signerId(email);
    const next: Signer = {
      id,
      name: proposal.name?.trim() || email.split("@")[0] || "Signer",
      email,
      role: proposal.role === "cc" ? "cc" : "signer",
    };
    const exists = workspace.signers.some((s) => s.id === id);
    return {
      ...workspace,
      signers: exists
        ? workspace.signers.map((s) => (s.id === id ? { ...s, ...next } : s))
        : [...workspace.signers, next],
    };
  }

  if (proposal.target === "company") return { ...workspace, company: proposal.value };
  if (proposal.target === "address") return { ...workspace, address: proposal.value };
  if (proposal.target === "email") return { ...workspace, email: proposal.value };
  return { ...workspace, clause: proposal.value };
}

export function applyProposals(workspace: Workspace, proposals: Proposal[]): Workspace {
  return proposals.reduce(applyProposal, workspace);
}

export const TARGET_LABELS: Record<Proposal["target"], string> = {
  signer: "Signer chip",
  company: "Company / legal name",
  address: "Notice address",
  email: "Notice email",
  clause: "Clause block",
};
