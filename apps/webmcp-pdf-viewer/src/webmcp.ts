import type { ToolDefinition } from "./types";
import {
  type DocumentWithModelContext,
  type ModelContext,
  type ModelContextTool,
  type NavigatorWithModelContext,
} from "./types";

export function getModelContext(): ModelContext | null {
  const doc = document as DocumentWithModelContext;
  if (doc.modelContext?.registerTool) {
    return doc.modelContext;
  }
  const nav = navigator as NavigatorWithModelContext;
  if (nav.modelContext?.registerTool) {
    return nav.modelContext;
  }
  return null;
}

export function isWebMCPAvailable(): boolean {
  return getModelContext() !== null;
}

export async function registerWebMCPTools(
  tools: ToolDefinition[],
  run: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<string[]> {
  const ctx = getModelContext();
  if (!ctx) return [];

  const registered: string[] = [];
  for (const def of tools) {
    const tool: ModelContextTool = {
      name: def.name,
      title: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const result = await run(def.name, input ?? {});
        return typeof result === "string" ? result : JSON.stringify(result);
      },
    };
    try {
      await ctx.registerTool(tool);
      registered.push(def.name);
    } catch (err) {
      console.warn(`WebMCP registerTool failed for ${def.name}`, err);
    }
  }
  return registered;
}
