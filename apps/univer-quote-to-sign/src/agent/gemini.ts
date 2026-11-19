import type { AgentToolCall } from "./tools";

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "set_cell",
        description:
          "Set an allowed input cell. B6=seats, D6=term years, B7=premium support 0/1, B8=SSO 0/1. Other cells are locked.",
        parameters: {
          type: "OBJECT",
          properties: {
            cell: { type: "STRING" },
            value: { type: "NUMBER" },
          },
          required: ["cell", "value"],
        },
      },
      {
        name: "get_totals",
        description: "Read seats, term, add-ons, and the recalculated totals.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "undo",
        description: "Undo the last Univer command (same stack as human edits).",
        parameters: { type: "OBJECT", properties: {} },
      },
    ],
  },
];

const SYSTEM = `You edit a live MSA pricing sheet through tools.
Allowed cells: B6 seats, D6 term years, B7 premium support 0/1, B8 SSO 0/1.
Prefer set_cell then get_totals. Use undo when asked. Do not invent other cells.`;

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: unknown };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

function extractCalls(parts: GeminiPart[]): AgentToolCall[] {
  const calls: AgentToolCall[] = [];
  for (const part of parts) {
    const fc = part.functionCall;
    if (!fc) continue;
    if (fc.name === "set_cell" || fc.name === "get_totals" || fc.name === "undo") {
      calls.push({
        name: fc.name,
        args: {
          cell: typeof fc.args?.cell === "string" ? fc.args.cell : undefined,
          value: typeof fc.args?.value === "number" ? fc.args.value : Number(fc.args?.value),
        },
      });
    }
  }
  return calls;
}

export async function planWithGemini(prompt: string): Promise<{ calls: AgentToolCall[]; text: string }> {
  const contents: GeminiContent[] = [
    { role: "user", parts: [{ text: `${SYSTEM}\n\nUser: ${prompt}` }] },
  ];
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      tools: TOOLS,
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${body.slice(0, 400)}`);
  }
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: GeminiPart[] } }[];
    error?: { message?: string };
  };
  if (json.error?.message) throw new Error(json.error.message);
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("").trim();
  return { calls: extractCalls(parts), text };
}
