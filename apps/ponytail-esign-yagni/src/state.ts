import { FIXTURE_REVIEW } from "./data/review";
import { TICKETS } from "./data/tickets";
import type { LlmStatus, ReviewResult } from "./types";

export type Tab = "tickets" | "review";

export type WidgetState = {
  signedOn: string;
  initials: string;
  color: string;
  remindersOn: boolean;
  cc: string[];
  ccDraft: string;
};

export type AppState = {
  tab: Tab;
  ticketId: string;
  widgets: WidgetState;
  llm: LlmStatus;
  review: ReviewResult | null;
  reviewBusy: boolean;
  reviewError: string | null;
};

const expiry = new Date();
expiry.setDate(expiry.getDate() + 4);

export const ENVELOPE = {
  id: "MSA-1042",
  title: "Mutual NDA",
  parties: "Acme × Harbor",
  signer: "Ada Lovelace",
  expiresAt: expiry.toISOString(),
};

export function createState(): AppState {
  return {
    tab: "tickets",
    ticketId: TICKETS[0].id,
    widgets: {
      signedOn: "",
      initials: "AL",
      color: "#5c3d12",
      remindersOn: false,
      cc: [],
      ccDraft: "",
    },
    llm: { live: false, provider: null },
    review: FIXTURE_REVIEW,
    reviewBusy: false,
    reviewError: null,
  };
}
