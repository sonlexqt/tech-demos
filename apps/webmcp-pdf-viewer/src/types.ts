export type ZoomMode = number | "fit-width" | "fit-page";

export interface DocumentInfo {
  pageCount: number;
  title: string | null;
  currentPage: number;
  zoom: ZoomMode;
}

export interface SearchMatch {
  page: number;
  snippet: string;
}

export interface SearchResult {
  query: string;
  matchCount: number;
  matches: SearchMatch[];
}

export interface PageTextResult {
  page: number;
  text: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  defaultArgs: Record<string, unknown>;
  readOnlyHint?: boolean;
}

/** Early-preview WebMCP shapes (not in lib.dom yet). */
export interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
  annotations?: {
    readOnlyHint?: boolean;
  };
}

export interface ModelContext {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
}

export interface NavigatorWithModelContext extends Navigator {
  modelContext?: ModelContext;
}

export interface DocumentWithModelContext extends Document {
  modelContext?: ModelContext;
}
