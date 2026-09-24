import type { JevElement } from "../src/types";
import { resolveTextModel } from "./keys";
import { TEXT_VALUE } from "./questions";

function extractEmail(goal: string): string | undefined {
  return goal.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function extractName(goal: string): string | undefined {
  const match = goal.match(/to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  return match?.[1];
}

function extractTitle(goal: string): string | undefined {
  const match = goal.match(/for\s+([^,.]+?)(?:\s+to\s+)/i);
  return match?.[1]?.trim();
}

/** Goal-derived TYPE_TEXT when the optional text helper is unset (playground, not Chrome harness). */
export function inferFieldText(goal: string, element: JevElement): string {
  const label = `${element.id} ${element.label}`.toLowerCase();
  if (label.includes("title") || label.includes("document")) {
    return extractTitle(goal) || "Q3 Vendor Agreement";
  }
  if (label.includes("message")) {
    return /friday/i.test(goal)
      ? "Please review and sign by Friday."
      : "Please review and sign this document.";
  }
  if (label.includes("email")) {
    return extractEmail(goal) || "alex@acme.example";
  }
  if (label.includes("name")) {
    return extractName(goal) || "Alex Rivera";
  }
  return element.value || " ";
}

export async function fieldText(
  goal: string,
  element: JevElement,
  pageText: string,
  history: { action?: string; text?: string }[],
): Promise<string> {
  const helper = resolveTextModel();
  if (!helper) return inferFieldText(goal, element);

  const reasoning =
    helper.reasoning === "none"
      ? { reasoning: { enabled: false } }
      : helper.base.includes("api.deepseek.com")
        ? { thinking: { type: "disabled" } }
        : { reasoning: { effort: "low" } };

  const response = await fetch(`${helper.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${helper.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: helper.model,
      max_tokens: 1024,
      response_format: { type: "json_object" },
      ...reasoning,
      messages: [
        { role: "system", content: TEXT_VALUE },
        {
          role: "user",
          content: JSON.stringify({
            goal,
            field: { label: element.label, role: element.role, value: element.value },
            page: { text: pageText.slice(0, 6000) },
            recent_actions: history.slice(-6),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Text helper returned HTTP ${response.status}`);
  }

  const result = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const output = JSON.parse(result.choices?.[0]?.message?.content || "{}") as { text?: unknown };
  if (typeof output.text !== "string" || !output.text.trim() || output.text.length > 2000) {
    throw new Error("Text helper returned no valid field value");
  }
  return output.text;
}
