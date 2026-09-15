import type { PdfViewer } from "./pdf-viewer";
import type { ToolDefinition, ZoomMode } from "./types";

export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<unknown>;

export function createAgentApi(viewer: PdfViewer): {
  tools: ToolDefinition[];
  run: (name: string, args: Record<string, unknown>) => Promise<unknown>;
} {
  const handlers: Record<string, ToolHandler> = {
    go_to_page: async (args) => {
      const page = Number(args.page);
      if (!Number.isFinite(page)) throw new Error("page must be a number");
      return viewer.goToPage(page);
    },
    next_page: async () => viewer.nextPage(),
    prev_page: async () => viewer.prevPage(),
    set_zoom: async (args) => {
      const scale = args.scale as ZoomMode;
      if (
        scale !== "fit-width" &&
        scale !== "fit-page" &&
        (typeof scale !== "number" || scale <= 0)
      ) {
        throw new Error(
          "scale must be a positive number, 'fit-width', or 'fit-page'",
        );
      }
      return viewer.setZoom(scale);
    },
    search_text: async (args) => {
      const query = String(args.query ?? "");
      return viewer.searchText(query);
    },
    get_page_text: async (args) => {
      if (args.page === undefined || args.page === null) {
        return viewer.getPageText();
      }
      const page = Number(args.page);
      if (!Number.isFinite(page)) throw new Error("page must be a number");
      return viewer.getPageText(page);
    },
    get_document_info: async () => viewer.getDocumentInfo(),
  };

  const tools: ToolDefinition[] = [
    {
      name: "go_to_page",
      description: "Navigate to a specific page (1-based).",
      inputSchema: {
        type: "object",
        properties: {
          page: { type: "number", description: "Page number (1-based)" },
        },
        required: ["page"],
      },
      defaultArgs: { page: 2 },
    },
    {
      name: "next_page",
      description: "Go to the next page.",
      inputSchema: { type: "object", properties: {} },
      defaultArgs: {},
    },
    {
      name: "prev_page",
      description: "Go to the previous page.",
      inputSchema: { type: "object", properties: {} },
      defaultArgs: {},
    },
    {
      name: "set_zoom",
      description: "Set zoom scale or fit mode.",
      inputSchema: {
        type: "object",
        properties: {
          scale: {
            description: "Numeric scale (e.g. 1.25) or fit-width / fit-page",
          },
        },
        required: ["scale"],
      },
      defaultArgs: { scale: "fit-width" },
    },
    {
      name: "search_text",
      description: "Search document text; returns snippets with page numbers.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Text to search for" },
        },
        required: ["query"],
      },
      defaultArgs: { query: "Trace" },
    },
    {
      name: "get_page_text",
      description: "Extract plain text for the current page or a given page.",
      inputSchema: {
        type: "object",
        properties: {
          page: {
            type: "number",
            description: "Optional page number; omit for current page",
          },
        },
      },
      defaultArgs: {},
    },
    {
      name: "get_document_info",
      description: "Page count, title if available, current page, and zoom.",
      inputSchema: { type: "object", properties: {} },
      defaultArgs: {},
    },
  ];

  async function run(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const handler = handlers[name];
    if (!handler) throw new Error(`Unknown tool: ${name}`);
    return handler(args);
  }

  return { tools, run };
}
