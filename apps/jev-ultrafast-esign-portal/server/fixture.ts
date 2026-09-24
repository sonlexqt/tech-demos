import type { Decision, DecideRequest, JevElement, Operation } from "../src/types";
import { inferFieldText } from "./text";

const FIXTURE_OPS: Operation[] = ["CLICK", "TYPE_TEXT", "SELECT", "WAIT", "DONE"];

function peaked(keys: string[], winner: string): Record<string, number> {
  if (!keys.length) return {};
  const unique = [...new Set(keys)];
  const win = unique.includes(winner) ? winner : unique[0];
  const rest = unique.filter((k) => k !== win);
  const winP = 0.88;
  const each = rest.length ? (1 - winP) / rest.length : 0;
  const out: Record<string, number> = { [win]: rest.length ? winP : 1 };
  for (const key of rest) out[key] = each;
  return out;
}

function el(elements: JevElement[], id: string): JevElement | undefined {
  return elements.find((item) => item.id === id);
}

function decide(
  operation: Operation,
  target: string | null,
  elements: JevElement[],
  extra?: { text?: string },
): Decision {
  const clickable = elements.filter((item) => item.operations.includes("CLICK")).map((item) => String(item.index));
  const typable = elements.filter((item) => item.operations.includes("TYPE_TEXT")).map((item) => String(item.index));
  const selectable = elements.flatMap((item) => item.options?.map((opt) => opt.index) ?? []);

  let target_probabilities: Record<string, number> = {};
  if (operation === "CLICK") target_probabilities = peaked(clickable, target ?? "");
  if (operation === "TYPE_TEXT") target_probabilities = peaked(typable, target ?? "");
  if (operation === "SELECT") target_probabilities = peaked(selectable, target ?? "");

  return {
    operation,
    target,
    text: extra?.text,
    confidence: 0.91,
    operation_probabilities: peaked(FIXTURE_OPS, operation),
    target_probabilities,
    latency_ms: 42,
    source: "fixture",
    model: "fixture",
  };
}

/**
 * Deterministic, state-driven walk to "sent". Matches by element id so indices
 * can shift if the reviewer clicks around before running the agent.
 */
export function fixtureDecide(req: DecideRequest): Decision {
  const { portal, elements, goal } = req;
  const type = (id: string) => {
    const item = el(elements, id);
    if (!item) return decide("WAIT", null, elements);
    return decide("TYPE_TEXT", String(item.index), elements, {
      text: inferFieldText(goal, item),
    });
  };
  const select = (id: string, value: string) => {
    const item = el(elements, id);
    const opt = item?.options?.find((o) => o.value === value);
    return decide("SELECT", opt?.index ?? String(item?.index ?? ""), elements);
  };
  const click = (id: string) => {
    const item = el(elements, id);
    return decide("CLICK", item ? String(item.index) : null, elements);
  };

  if (portal.step === "sent") {
    return decide("DONE", null, elements);
  }

  if (portal.step === "request") {
    if (!portal.title.trim()) return type("title");
    if (!portal.message.trim()) return type("message");
    if (portal.signingOrder !== "sequential") return select("signing-order", "sequential");
    return click("continue-signers");
  }

  if (portal.step === "signers") {
    const hasAlex = portal.signers.some((s) => /alex/i.test(s.name) && s.role === "signer");
    if (!hasAlex) {
      if (!/alex/i.test(portal.draftName)) return type("draft-name");
      if (!portal.draftEmail.includes("@")) return type("draft-email");
      if (portal.draftRole !== "signer") return select("draft-role", "signer");
      return click("add-signer");
    }
    if (portal.awaitingPreview) return decide("WAIT", null, elements);
    return click("continue-fields");
  }

  if (portal.step === "fields") {
    if (!portal.fields.some((f) => f.kind === "signature")) return click("place-signature");
    if (!portal.fields.some((f) => f.kind === "date")) return click("place-date");
    return click("continue-review");
  }

  if (portal.step === "review") {
    return click("send-request");
  }

  return decide("DONE", null, elements);
}
