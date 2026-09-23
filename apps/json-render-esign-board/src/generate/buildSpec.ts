import type { Spec, UIElement } from "@json-render/core";
import { catalog } from "../catalog";
import { SIGNATURE_REQUESTS } from "../data/requests";
import type { SignatureRequest } from "../types";

type ElementMap = Record<string, UIElement>;

function text(
  value: string,
  variant: "body" | "muted" | "lead" | "caption" | null = "body",
): UIElement {
  return {
    type: "Text",
    props: { text: value, variant },
  };
}

function heading(value: string, level: "h1" | "h2" | "h3" | "h4"): UIElement {
  return {
    type: "Heading",
    props: { text: value, level },
  };
}

function stack(
  children: string[],
  extras?: { direction?: "vertical" | "horizontal"; gap?: "sm" | "md" | "lg" | "xl" },
): UIElement {
  return {
    type: "Stack",
    props: {
      direction: extras?.direction ?? "vertical",
      gap: extras?.gap ?? "md",
      align: null,
      justify: null,
      className: null,
    },
    children,
  };
}

function remindOn(requestId: string, label: string) {
  return {
    press: {
      action: "remind_signer",
      params: { requestId, label },
    },
  };
}

function addRequestBlock(
  elements: ElementMap,
  request: SignatureRequest,
  prefix: string,
): string {
  const cardId = `${prefix}-card`;
  const childIds: string[] = [];

  const chipsId = `${prefix}-chips`;
  const chipIds = request.signers.map((signer, index) => {
    const id = `${prefix}-chip-${index}`;
    elements[id] = {
      type: "SignerChip",
      props: {
        name: signer.name,
        role: signer.role,
        region: signer.region ?? null,
        status: signer.status,
      },
    };
    return id;
  });
  elements[chipsId] = stack(chipIds, { direction: "horizontal", gap: "sm" });
  childIds.push(chipsId);

  if (request.needsRemind || request.status === "overdue" || request.status === "sent") {
    const remindId = `${prefix}-remind`;
    const label = `Remind ${request.id}`;
    elements[remindId] = {
      type: "RemindButton",
      props: { requestId: request.id, label },
      on: remindOn(request.id, label),
    };
    childIds.push(remindId);
  }

  elements[cardId] = {
    type: "RequestCard",
    props: {
      title: request.title,
      documentName: request.documentName,
      status: request.status,
      dueHint: request.dueHint,
    },
    children: childIds,
  };
  return cardId;
}

export interface GenerateResult {
  spec: Spec;
  matchedIds: string[];
  mode: "fixture" | "mock";
  headline: string;
  summary: string;
}

function finish(result: Omit<GenerateResult, "spec"> & { spec: Spec }): GenerateResult {
  const checked = catalog.validate(result.spec);
  if (!checked.success) {
    console.warn("catalog.validate issues", checked.error);
  }
  return result;
}

function buildBoard(
  headline: string,
  summary: string,
  rows: SignatureRequest[],
): Spec {
  const elements: ElementMap = {};
  const cardIds = rows.map((request, index) =>
    addRequestBlock(elements, request, `row-${index}`),
  );

  elements.headline = heading(headline, "h2");
  elements.summary = text(summary, "muted");
  elements.list = stack(cardIds, { direction: "vertical", gap: "md" });
  elements.root = {
    type: "Card",
    props: {
      title: null,
      description: null,
      maxWidth: "full",
      centered: false,
      className: "board-card",
    },
    children: ["headline", "summary", "list"],
  };

  return { root: "root", elements };
}

function normalize(prompt: string): string {
  return prompt.trim().toLowerCase();
}

export function generateSpecFromPrompt(prompt: string): GenerateResult {
  const q = normalize(prompt);

  if (
    q.includes("overdue") &&
    (q.includes("counsel") || q.includes("external")) &&
    (q.includes("remind") || q.includes("need"))
  ) {
    const rows = SIGNATURE_REQUESTS.filter(
      (row) =>
        row.status === "overdue" &&
        row.needsRemind &&
        row.signers.some((signer) => signer.role === "external-counsel"),
    );
    return finish({
      mode: "fixture",
      matchedIds: rows.map((row) => row.id),
      headline: "Overdue external-counsel packets",
      summary: `${rows.length} requests are past due and waiting on outside counsel. Remind is catalog-bound to remind_signer — no email leaves this demo.`,
      spec: buildBoard(
        "Overdue external-counsel packets",
        `${rows.length} requests are past due and waiting on outside counsel. Remind is catalog-bound to remind_signer — no email leaves this demo.`,
        rows,
      ),
    });
  }

  if (q.includes("apac") && (q.includes("countersign") || q.includes("waiting"))) {
    const rows = SIGNATURE_REQUESTS.filter(
      (row) => row.region === "APAC" && row.waitingOnCountersign,
    );
    return finish({
      mode: "fixture",
      matchedIds: rows.map((row) => row.id),
      headline: "APAC waiting on countersign",
      summary: "Primary signers are done. These APAC packets are blocked on a countersigner.",
      spec: buildBoard(
        "APAC waiting on countersign",
        "Primary signers are done. These APAC packets are blocked on a countersigner.",
        rows,
      ),
    });
  }

  if (
    (q.includes("declined") && (q.includes("re-sent") || q.includes("resent") || q.includes("re sent"))) ||
    (q.includes("declined") && q.includes("week"))
  ) {
    const rows = SIGNATURE_REQUESTS.filter(
      (row) => row.declinedThenResent && row.week === "this-week",
    );
    return finish({
      mode: "fixture",
      matchedIds: rows.map((row) => row.id),
      headline: "Declined, then re-sent this week",
      summary: "These packets were declined and a revised envelope went back out this week.",
      spec: buildBoard(
        "Declined, then re-sent this week",
        "These packets were declined and a revised envelope went back out this week.",
        rows,
      ),
    });
  }

  const rows = SIGNATURE_REQUESTS.filter((row) => {
    const hay = [
      row.id,
      row.title,
      row.documentName,
      row.status,
      row.region,
      row.party,
      row.lastAction,
      ...row.signers.map((signer) => `${signer.name} ${signer.role}`),
    ]
      .join(" ")
      .toLowerCase();

    if (q.includes("overdue") && row.status !== "overdue") return false;
    if (q.includes("draft") && row.status !== "draft") return false;
    if (q.includes("void") && row.status !== "void") return false;
    if (q.includes("completed") && row.status !== "completed") return false;
    if (q.includes("apac") && row.region !== "APAC") return false;
    if (q.includes("emea") && row.region !== "EMEA") return false;
    if (q.includes("amer") && row.region !== "AMER") return false;
    if ((q.includes("counsel") || q.includes("external")) &&
      !row.signers.some((signer) => signer.role === "external-counsel")) {
      return false;
    }
    if (q.includes("countersign") && !row.waitingOnCountersign) return false;
    if ((q.includes("re-sent") || q.includes("resent")) && !row.declinedThenResent) {
      return false;
    }
    if (q.includes("this week") && row.week !== "this-week") return false;

    const tokens = q.split(/\s+/).filter((token) => token.length > 3);
    if (tokens.length === 0) return true;
    return tokens.some((token) => hay.includes(token));
  });

  const selected = rows.length > 0 ? rows : SIGNATURE_REQUESTS.slice(0, 4);
  const headline = rows.length > 0 ? "Matched signature requests" : "Sample ops slice";
  const summary =
    rows.length > 0
      ? `Local catalog-constrained mock matched ${selected.length} seed row(s). No free-form HTML was generated.`
      : "No tight keyword match — showing a sample slice still built only from catalog types.";

  return finish({
    mode: "mock",
    matchedIds: selected.map((row) => row.id),
    headline,
    summary,
    spec: buildBoard(headline, summary, selected),
  });
}
