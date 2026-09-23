import type { Experimental_CompositionCandidate } from "@json-render/core";
import { SIGNATURE_REQUESTS } from "../data/requests";

/**
 * Atomic recipes for experimental_composeSpec / Jev.
 * Jev only selects, places, and orders these — it cannot invent props.
 */
export function buildEsignCandidates(): Experimental_CompositionCandidate[] {
  const candidates: Experimental_CompositionCandidate[] = [
    {
      id: "root-card",
      description:
        "Board root. Use as the only root: a Card wrapping the signature-request ops board.",
      root: true,
      element: {
        type: "Card",
        props: {
          title: "Signature ops board",
          description: "Catalog-guardrailed e-sign queue",
          maxWidth: "full",
          centered: false,
          className: "board-card",
        },
      },
    },
    {
      id: "stack-vertical",
      description: "Vertical stack for card body or request list. Reusable layout.",
      root: false,
      maxUses: 8,
      element: {
        type: "Stack",
        props: {
          direction: "vertical",
          gap: "md",
          align: null,
          justify: null,
          className: null,
        },
      },
    },
    {
      id: "stack-horizontal",
      description: "Horizontal stack for signer chips or status legend. Reusable layout.",
      root: false,
      maxUses: 8,
      element: {
        type: "Stack",
        props: {
          direction: "horizontal",
          gap: "sm",
          align: null,
          justify: null,
          className: null,
        },
      },
    },
    {
      id: "heading-overdue",
      description: "Heading for overdue external-counsel packets that need a remind.",
      root: false,
      resource: "board-heading",
      element: {
        type: "Heading",
        props: { text: "Overdue external-counsel packets", level: "h2" },
      },
    },
    {
      id: "heading-apac",
      description: "Heading for APAC packets waiting on countersign.",
      root: false,
      resource: "board-heading",
      element: {
        type: "Heading",
        props: { text: "APAC waiting on countersign", level: "h2" },
      },
    },
    {
      id: "heading-resent",
      description: "Heading for declined-then-re-sent packets from this week.",
      root: false,
      resource: "board-heading",
      element: {
        type: "Heading",
        props: { text: "Declined, then re-sent this week", level: "h2" },
      },
    },
    {
      id: "heading-generic",
      description: "Generic heading when the prompt does not match a named slice.",
      root: false,
      resource: "board-heading",
      element: {
        type: "Heading",
        props: { text: "Matched signature requests", level: "h2" },
      },
    },
    {
      id: "text-overdue",
      description: "Summary copy for overdue external-counsel reminds.",
      root: false,
      resource: "board-summary",
      element: {
        type: "Text",
        props: {
          text: "Past-due packets waiting on outside counsel. Remind is catalog-bound to remind_signer.",
          variant: "muted",
        },
      },
    },
    {
      id: "text-apac",
      description: "Summary copy for APAC countersign waits.",
      root: false,
      resource: "board-summary",
      element: {
        type: "Text",
        props: {
          text: "Primary signers are done. These APAC packets are blocked on a countersigner.",
          variant: "muted",
        },
      },
    },
    {
      id: "text-resent",
      description: "Summary copy for declined then re-sent this week.",
      root: false,
      resource: "board-summary",
      element: {
        type: "Text",
        props: {
          text: "These packets were declined and a revised envelope went back out this week.",
          variant: "muted",
        },
      },
    },
    {
      id: "text-generic",
      description: "Summary copy for a mixed or keyword-matched slice.",
      root: false,
      resource: "board-summary",
      element: {
        type: "Text",
        props: {
          text: "Catalog-constrained board over the seed ledger. No free-form HTML.",
          variant: "muted",
        },
      },
    },
  ];

  for (const status of [
    "draft",
    "sent",
    "viewed",
    "declined",
    "completed",
    "void",
    "overdue",
  ] as const) {
    candidates.push({
      id: `badge-${status}`,
      description: `StatusBadge for ${status} packets. Include when that status is on the board.`,
      root: false,
      element: { type: "StatusBadge", props: { status } },
    });
  }

  for (const request of SIGNATURE_REQUESTS) {
    candidates.push({
      id: `card-${request.id}`,
      description: [
        `RequestCard ${request.id}: ${request.title} (${request.documentName}).`,
        `Status ${request.status}, ${request.region}, ${request.party}.`,
        request.needsRemind ? "Needs a remind." : "",
        request.waitingOnCountersign ? "Waiting on countersign." : "",
        request.declinedThenResent ? "Declined then re-sent this week." : "",
        `Last action: ${request.lastAction}.`,
      ]
        .filter(Boolean)
        .join(" "),
      root: false,
      element: {
        type: "RequestCard",
        props: {
          title: request.title,
          documentName: request.documentName,
          status: request.status,
          dueHint: request.dueHint,
        },
      },
    });

    request.signers.forEach((signer, index) => {
      candidates.push({
        id: `chip-${request.id}-${index}`,
        description: `SignerChip for ${signer.name} on ${request.id} (${signer.role}, ${signer.region ?? "no region"}, ${signer.status}).`,
        root: false,
        element: {
          type: "SignerChip",
          props: {
            name: signer.name,
            role: signer.role,
            region: signer.region ?? null,
            status: signer.status,
          },
        },
      });
    });

    if (request.needsRemind || request.status === "overdue" || request.status === "sent") {
      const label = `Remind ${request.id}`;
      candidates.push({
        id: `remind-${request.id}`,
        description: `RemindButton for ${request.id}. Bind press to remind_signer. Demo-only, no email.`,
        root: false,
        element: {
          type: "RemindButton",
          props: { requestId: request.id, label },
          on: {
            press: {
              action: "remind_signer",
              params: { requestId: request.id, label },
            },
          },
        },
      });
    }
  }

  return candidates;
}

export function jevContext() {
  return {
    ledger: SIGNATURE_REQUESTS.map((request) => ({
      id: request.id,
      title: request.title,
      status: request.status,
      region: request.region,
      needsRemind: request.needsRemind,
      waitingOnCountersign: request.waitingOnCountersign,
      declinedThenResent: request.declinedThenResent,
      week: request.week,
    })),
  };
}

export const JEV_INSTRUCTIONS = {
  root: "Always choose root-card (the Card board). Never use a RequestCard as the root.",
  next: "Pick the heading/summary that matches the prompt. Include only RequestCards that match the filter. Attach that packet's SignerChips and RemindButton when they apply. Add StatusBadges for statuses that appear.",
  parent:
    "Heading and summary go under the Card first, then a vertical stack of RequestCards. Chips and RemindButton belong under their RequestCard (or a stack inside it).",
};
