/**
 * Faithful approximation of Understand Anything's /understand output.
 * Walks fixture-codebase (tree-sitter-like extract) and merges authored
 * summaries, layers, tour, and extra edges the LLM agents would add.
 *
 * Real plugin: install Egonex-AI/Understand-Anything, cd fixture-codebase, /understand
 * then copy .ua/knowledge-graph.json → public/ua/knowledge-graph.json
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = join(root, "fixture-codebase");
const outFile = join(root, "public/ua/knowledge-graph.json");

type NodeType = "file" | "function" | "class" | "module" | "document" | "endpoint" | "config";
type EdgeType =
  | "imports"
  | "contains"
  | "calls"
  | "depends_on"
  | "tested_by"
  | "routes"
  | "documents"
  | "triggers";

interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  filePath?: string;
  lineRange?: [number, number];
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
  languageNotes?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  direction: "forward" | "backward" | "bidirectional";
  description?: string;
  weight: number;
}

const FILE_META: Record<
  string,
  { summary: string; tags: string[]; complexity: GraphNode["complexity"]; languageNotes?: string }
> = {
  "README.md": {
    summary: "Map of the fixture Lumin Sign e-sign core: create request, signer order, fields, reminders, webhooks, audit.",
    tags: ["docs", "onboarding"],
    complexity: "simple",
  },
  "src/types.ts": {
    summary: "Shared e-sign types: SignatureRequest, Signer, Field, WebhookEvent, AuditEvent.",
    tags: ["types", "domain"],
    complexity: "simple",
    languageNotes: "Type-only module — no runtime exports besides interfaces/aliases.",
  },
  "src/store.ts": {
    summary: "In-memory maps for requests, audit rows, and webhook deliveries. Reset between tests.",
    tags: ["data", "store"],
    complexity: "simple",
  },
  "src/requests/create-request.ts": {
    summary: "Validates a send payload and orchestrates routing, field prep, persist, reminders, audit, and the sent webhook.",
    tags: ["create", "orchestrator", "send"],
    complexity: "complex",
  },
  "src/signers/routing.ts": {
    summary: "ORDER unlocks the lowest unsigned group; PARALLEL marks every signer awaiting.",
    tags: ["signers", "order", "routing"],
    complexity: "moderate",
  },
  "src/fields/prep.ts": {
    summary: "Places signature/date/initials per signer and binds each field to a real signer id.",
    tags: ["fields", "prep"],
    complexity: "moderate",
  },
  "src/reminders/scheduler.ts": {
    summary: "Day 1 / 3 / 7 cadence. Due-scan emits reminder.sent audit + webhook.",
    tags: ["reminders", "cadence"],
    complexity: "moderate",
  },
  "src/webhooks/dispatch.ts": {
    summary: "Emits signature_request.* deliveries, retries failed rows, and applies inbound viewed/signed/declined.",
    tags: ["webhooks", "events"],
    complexity: "moderate",
  },
  "src/audit/trail.ts": {
    summary: "Append-only audit API used by every state change in the send pipeline.",
    tags: ["audit", "compliance"],
    complexity: "simple",
  },
  "src/http/routes.ts": {
    summary: "HTTP-shaped entry: POST send, GET audit, POST inbound webhook.",
    tags: ["api", "http"],
    complexity: "simple",
  },
  "tests/create-request.test.ts": {
    summary: "Pins validatePayload errors and ORDER create → awaiting group 1 + placed fields.",
    tags: ["test", "create"],
    complexity: "simple",
  },
  "tests/routing.test.ts": {
    summary: "Pins ORDER handoff after markSigned and PARALLEL unlock-all.",
    tags: ["test", "routing"],
    complexity: "simple",
  },
  "tests/fields.test.ts": {
    summary: "Pins placeFields + required signature/date vs optional initials.",
    tags: ["test", "fields"],
    complexity: "simple",
  },
  "tests/reminders.test.ts": {
    summary: "Pins cadence 1/3/7 and due count after four days.",
    tags: ["test", "reminders"],
    complexity: "simple",
  },
  "tests/webhooks.test.ts": {
    summary: "Pins inbound viewed → in_progress and retryFailed.",
    tags: ["test", "webhooks"],
    complexity: "simple",
  },
  "tests/audit.test.ts": {
    summary: "Pins append-only listAudit and findAudit by action.",
    tags: ["test", "audit"],
    complexity: "simple",
  },
};

const FN_META: Record<string, { summary: string; tags: string[]; complexity: GraphNode["complexity"] }> = {
  "src/store.ts:insertRequest": {
    summary: "Persist a new SignatureRequest in the in-memory map.",
    tags: ["store", "write"],
    complexity: "simple",
  },
  "src/store.ts:getRequest": {
    summary: "Fetch a request by id, or undefined.",
    tags: ["store", "read"],
    complexity: "simple",
  },
  "src/store.ts:updateRequest": {
    summary: "Overwrite a stored request after routing or inbound events.",
    tags: ["store", "write"],
    complexity: "simple",
  },
  "src/store.ts:listRequests": {
    summary: "Return every stored request (used by reminder due-scans in a fuller system).",
    tags: ["store", "read"],
    complexity: "simple",
  },
  "src/store.ts:appendAuditRow": {
    summary: "Push one audit event onto the per-request list.",
    tags: ["store", "audit"],
    complexity: "simple",
  },
  "src/store.ts:listAuditRows": {
    summary: "Read the append-only audit list for a request.",
    tags: ["store", "audit"],
    complexity: "simple",
  },
  "src/store.ts:appendWebhookRow": {
    summary: "Record a webhook delivery attempt.",
    tags: ["store", "webhooks"],
    complexity: "simple",
  },
  "src/store.ts:listWebhookRows": {
    summary: "List deliveries so retryFailed can find failed rows.",
    tags: ["store", "webhooks"],
    complexity: "simple",
  },
  "src/store.ts:resetStore": {
    summary: "Clear maps between fixture tests.",
    tags: ["store", "test"],
    complexity: "simple",
  },
  "src/requests/create-request.ts:validatePayload": {
    summary: "Collect title, signer, expiry, and ORDER group errors before send.",
    tags: ["validation", "create"],
    complexity: "simple",
  },
  "src/requests/create-request.ts:createSignatureRequest": {
    summary: "Happy-path send: route → place fields → persist → schedule reminders → audit → sent webhook.",
    tags: ["create", "orchestrator"],
    complexity: "complex",
  },
  "src/signers/routing.ts:resolveSigningOrder": {
    summary: "Set awaiting vs pending from signingType and group numbers.",
    tags: ["routing", "order"],
    complexity: "moderate",
  },
  "src/signers/routing.ts:nextEligibleSigner": {
    summary: "After a signature, unlock the next ORDER group or remaining PARALLEL signers.",
    tags: ["routing", "handoff"],
    complexity: "moderate",
  },
  "src/signers/routing.ts:markSigned": {
    summary: "Record a signature; complete the request or advance ORDER.",
    tags: ["routing", "sign"],
    complexity: "moderate",
  },
  "src/fields/prep.ts:placeFields": {
    summary: "Create signature, date, and initials fields stacked per signer on page 1.",
    tags: ["fields"],
    complexity: "simple",
  },
  "src/fields/prep.ts:bindFieldsToSigners": {
    summary: "Fail closed if a field points at a missing signer id.",
    tags: ["fields", "validation"],
    complexity: "simple",
  },
  "src/fields/prep.ts:requiredFieldsFor": {
    summary: "Required fields a signer must fill before their turn completes.",
    tags: ["fields"],
    complexity: "simple",
  },
  "src/fields/prep.ts:applyFieldValue": {
    summary: "Write a captured signature / date / initials value onto a field.",
    tags: ["fields"],
    complexity: "simple",
  },
  "src/reminders/scheduler.ts:scheduleReminders": {
    summary: "Write reminder.scheduled audit with the 1/3/7 cadence.",
    tags: ["reminders"],
    complexity: "simple",
  },
  "src/reminders/scheduler.ts:dueReminders": {
    summary: "Cadence timestamps that are due and not completed/declined.",
    tags: ["reminders"],
    complexity: "simple",
  },
  "src/reminders/scheduler.ts:sendDueReminders": {
    summary: "For each due slot, append reminder.sent and emit the reminder webhook.",
    tags: ["reminders", "webhooks"],
    complexity: "moderate",
  },
  "src/webhooks/dispatch.ts:emitWebhook": {
    summary: "Create a delivered delivery row and webhook.delivered audit.",
    tags: ["webhooks"],
    complexity: "simple",
  },
  "src/webhooks/dispatch.ts:retryFailed": {
    summary: "Retry failed deliveries up to three attempts.",
    tags: ["webhooks", "retry"],
    complexity: "moderate",
  },
  "src/webhooks/dispatch.ts:handleInboundWebhook": {
    summary: "Apply viewed/signed/declined to request status, then re-emit.",
    tags: ["webhooks", "inbound"],
    complexity: "moderate",
  },
  "src/audit/trail.ts:appendAudit": {
    summary: "Stable wrapper that stamps id/at and writes the store.",
    tags: ["audit"],
    complexity: "simple",
  },
  "src/audit/trail.ts:listAudit": {
    summary: "Return the full trail for GET /v1/signature_request/:id/audit.",
    tags: ["audit"],
    complexity: "simple",
  },
  "src/audit/trail.ts:findAudit": {
    summary: "Filter the trail by action name (request.created, reminder.sent, …).",
    tags: ["audit"],
    complexity: "simple",
  },
  "src/http/routes.ts:sendSignatureRequest": {
    summary: "POST /v1/signature_request/send — thin wrap of createSignatureRequest.",
    tags: ["api", "send"],
    complexity: "simple",
  },
  "src/http/routes.ts:getAuditTrail": {
    summary: "GET /v1/signature_request/:id/audit — 404-shaped throw if missing.",
    tags: ["api", "audit"],
    complexity: "simple",
  },
  "src/http/routes.ts:receiveInboundWebhook": {
    summary: "POST /v1/webhooks/inbound — load request and apply signer event.",
    tags: ["api", "webhooks"],
    complexity: "simple",
  },
  "tests/create-request.test.ts:runCreateRequestTests": {
    summary: "Assert invalid payload errors and ORDER create side effects.",
    tags: ["test"],
    complexity: "simple",
  },
  "tests/routing.test.ts:runRoutingTests": {
    summary: "Assert ORDER handoff and PARALLEL unlock.",
    tags: ["test"],
    complexity: "simple",
  },
  "tests/fields.test.ts:runFieldTests": {
    summary: "Assert required vs optional fields after placeFields.",
    tags: ["test"],
    complexity: "simple",
  },
  "tests/reminders.test.ts:runReminderTests": {
    summary: "Assert cadence constants and due count after four days.",
    tags: ["test"],
    complexity: "simple",
  },
  "tests/webhooks.test.ts:runWebhookTests": {
    summary: "Assert inbound viewed and retryFailed.",
    tags: ["test"],
    complexity: "simple",
  },
  "tests/audit.test.ts:runAuditTests": {
    summary: "Assert append-only trail and action filter.",
    tags: ["test"],
    complexity: "simple",
  },
};

const CLASS_META: Record<
  string,
  { summary: string; tags: string[]; complexity: GraphNode["complexity"]; languageNotes?: string }
> = {
  "src/reminders/scheduler.ts:ReminderScheduler": {
    summary: "Holds cadence days and computes due timestamps from createdAt.",
    tags: ["reminders", "class"],
    complexity: "moderate",
    languageNotes: "Class + module-level singleton — typical scheduler wrapper.",
  },
  "src/webhooks/dispatch.ts:WebhookDispatcher": {
    summary: "Stateful emit/retry helper sitting under the function exports.",
    tags: ["webhooks", "class"],
    complexity: "moderate",
  },
};

const MODULES: Array<{ id: string; name: string; filePath: string; summary: string; tags: string[] }> = [
  {
    id: "module:src/requests",
    name: "requests",
    filePath: "src/requests",
    summary: "Create-and-send orchestration for a signature request.",
    tags: ["module", "create"],
  },
  {
    id: "module:src/signers",
    name: "signers",
    filePath: "src/signers",
    summary: "Signing order and handoff.",
    tags: ["module", "routing"],
  },
  {
    id: "module:src/fields",
    name: "fields",
    filePath: "src/fields",
    summary: "Field placement and signer binding.",
    tags: ["module", "fields"],
  },
  {
    id: "module:src/reminders",
    name: "reminders",
    filePath: "src/reminders",
    summary: "Reminder cadence and due-scan.",
    tags: ["module", "reminders"],
  },
  {
    id: "module:src/webhooks",
    name: "webhooks",
    filePath: "src/webhooks",
    summary: "Outbound emit/retry and inbound signer events.",
    tags: ["module", "webhooks"],
  },
  {
    id: "module:src/audit",
    name: "audit",
    filePath: "src/audit",
    summary: "Append-only compliance trail.",
    tags: ["module", "audit"],
  },
  {
    id: "module:src/http",
    name: "http",
    filePath: "src/http",
    summary: "HTTP-shaped API surface.",
    tags: ["module", "api"],
  },
];

const ENDPOINTS: GraphNode[] = [
  {
    id: "endpoint:src/http/routes.ts:POST /v1/signature_request/send",
    type: "endpoint",
    name: "POST /v1/signature_request/send",
    filePath: "src/http/routes.ts",
    lineRange: [7, 9],
    summary: "Requester send. Creates the request and fans out to routing, fields, reminders, audit, webhook.",
    tags: ["api", "send"],
    complexity: "moderate",
  },
  {
    id: "endpoint:src/http/routes.ts:GET /v1/signature_request/:id/audit",
    type: "endpoint",
    name: "GET /v1/signature_request/:id/audit",
    filePath: "src/http/routes.ts",
    lineRange: [11, 15],
    summary: "Read the append-only trail for a request.",
    tags: ["api", "audit"],
    complexity: "simple",
  },
  {
    id: "endpoint:src/http/routes.ts:POST /v1/webhooks/inbound",
    type: "endpoint",
    name: "POST /v1/webhooks/inbound",
    filePath: "src/http/routes.ts",
    lineRange: [17, 24],
    summary: "Signer-side viewed / signed / declined callbacks.",
    tags: ["api", "webhooks"],
    complexity: "moderate",
  },
];

const EXTRA_CALLS: Array<{ source: string; target: string; description: string }> = [
  {
    source: "function:src/http/routes.ts:sendSignatureRequest",
    target: "function:src/requests/create-request.ts:createSignatureRequest",
    description: "Send route delegates to the create orchestrator.",
  },
  {
    source: "function:src/http/routes.ts:getAuditTrail",
    target: "function:src/audit/trail.ts:listAudit",
    description: "Audit route reads the trail.",
  },
  {
    source: "function:src/http/routes.ts:getAuditTrail",
    target: "function:src/store.ts:getRequest",
    description: "404-shaped lookup before listing audit.",
  },
  {
    source: "function:src/http/routes.ts:receiveInboundWebhook",
    target: "function:src/webhooks/dispatch.ts:handleInboundWebhook",
    description: "Inbound route applies the signer event.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/requests/create-request.ts:validatePayload",
    description: "Reject invalid title / signers / expiry before side effects.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/signers/routing.ts:resolveSigningOrder",
    description: "Unlock the first ORDER group or every PARALLEL signer.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/fields/prep.ts:placeFields",
    description: "Stamp default fields onto each signer.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/store.ts:insertRequest",
    description: "Persist the request before reminders fire.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/reminders/scheduler.ts:scheduleReminders",
    description: "Schedule 1/3/7 cadence after send.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/audit/trail.ts:appendAudit",
    description: "Write request.created.",
  },
  {
    source: "function:src/requests/create-request.ts:createSignatureRequest",
    target: "function:src/webhooks/dispatch.ts:emitWebhook",
    description: "Fan out signature_request.sent.",
  },
  {
    source: "function:src/signers/routing.ts:markSigned",
    target: "function:src/signers/routing.ts:nextEligibleSigner",
    description: "Advance ORDER after a completed signature.",
  },
  {
    source: "function:src/reminders/scheduler.ts:sendDueReminders",
    target: "function:src/reminders/scheduler.ts:dueReminders",
    description: "Due-scan before emit.",
  },
  {
    source: "function:src/reminders/scheduler.ts:sendDueReminders",
    target: "function:src/audit/trail.ts:appendAudit",
    description: "Each due slot writes reminder.sent.",
  },
  {
    source: "function:src/reminders/scheduler.ts:sendDueReminders",
    target: "function:src/webhooks/dispatch.ts:emitWebhook",
    description: "Each due slot emits signature_request.reminder.sent.",
  },
  {
    source: "function:src/reminders/scheduler.ts:scheduleReminders",
    target: "function:src/audit/trail.ts:appendAudit",
    description: "Cadence is recorded as reminder.scheduled.",
  },
  {
    source: "function:src/webhooks/dispatch.ts:emitWebhook",
    target: "class:src/webhooks/dispatch.ts:WebhookDispatcher",
    description: "Function export forwards to the dispatcher singleton.",
  },
  {
    source: "function:src/webhooks/dispatch.ts:retryFailed",
    target: "class:src/webhooks/dispatch.ts:WebhookDispatcher",
    description: "Retry export forwards to the dispatcher.",
  },
  {
    source: "function:src/webhooks/dispatch.ts:handleInboundWebhook",
    target: "function:src/webhooks/dispatch.ts:emitWebhook",
    description: "Inbound events are re-emitted to subscribers.",
  },
  {
    source: "function:src/webhooks/dispatch.ts:handleInboundWebhook",
    target: "function:src/audit/trail.ts:appendAudit",
    description: "Inbound events are audited as the signer.",
  },
  {
    source: "function:src/audit/trail.ts:appendAudit",
    target: "function:src/store.ts:appendAuditRow",
    description: "Trail writes through the store.",
  },
  {
    source: "function:src/audit/trail.ts:listAudit",
    target: "function:src/store.ts:listAuditRows",
    description: "Trail reads through the store.",
  },
  {
    source: "function:src/audit/trail.ts:findAudit",
    target: "function:src/store.ts:listAuditRows",
    description: "Filter is applied on the stored rows.",
  },
  {
    source: "endpoint:src/http/routes.ts:POST /v1/signature_request/send",
    target: "function:src/http/routes.ts:sendSignatureRequest",
    description: "Route handler for send.",
  },
  {
    source: "endpoint:src/http/routes.ts:GET /v1/signature_request/:id/audit",
    target: "function:src/http/routes.ts:getAuditTrail",
    description: "Route handler for audit GET.",
  },
  {
    source: "endpoint:src/http/routes.ts:POST /v1/webhooks/inbound",
    target: "function:src/http/routes.ts:receiveInboundWebhook",
    description: "Route handler for inbound webhooks.",
  },
];

const TESTED_BY: Array<{ source: string; target: string }> = [
  { source: "file:src/requests/create-request.ts", target: "file:tests/create-request.test.ts" },
  { source: "function:src/requests/create-request.ts:createSignatureRequest", target: "file:tests/create-request.test.ts" },
  { source: "function:src/requests/create-request.ts:validatePayload", target: "file:tests/create-request.test.ts" },
  { source: "file:src/signers/routing.ts", target: "file:tests/routing.test.ts" },
  { source: "function:src/signers/routing.ts:resolveSigningOrder", target: "file:tests/routing.test.ts" },
  { source: "function:src/signers/routing.ts:nextEligibleSigner", target: "file:tests/routing.test.ts" },
  { source: "function:src/signers/routing.ts:markSigned", target: "file:tests/routing.test.ts" },
  { source: "file:src/fields/prep.ts", target: "file:tests/fields.test.ts" },
  { source: "function:src/fields/prep.ts:placeFields", target: "file:tests/fields.test.ts" },
  { source: "file:src/reminders/scheduler.ts", target: "file:tests/reminders.test.ts" },
  { source: "function:src/reminders/scheduler.ts:dueReminders", target: "file:tests/reminders.test.ts" },
  { source: "function:src/reminders/scheduler.ts:sendDueReminders", target: "file:tests/reminders.test.ts" },
  { source: "file:src/webhooks/dispatch.ts", target: "file:tests/webhooks.test.ts" },
  { source: "function:src/webhooks/dispatch.ts:handleInboundWebhook", target: "file:tests/webhooks.test.ts" },
  { source: "function:src/webhooks/dispatch.ts:retryFailed", target: "file:tests/webhooks.test.ts" },
  { source: "file:src/audit/trail.ts", target: "file:tests/audit.test.ts" },
  { source: "function:src/audit/trail.ts:appendAudit", target: "file:tests/audit.test.ts" },
];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function extractSymbols(source: string) {
  const functions: Array<{ name: string; line: number }> = [];
  const classes: Array<{ name: string; line: number }> = [];
  const imports: string[] = [];
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    const fn = /export function ([A-Za-z0-9_]+)/.exec(line);
    if (fn?.[1]) functions.push({ name: fn[1], line: index + 1 });
    const cls = /export class ([A-Za-z0-9_]+)/.exec(line);
    if (cls?.[1]) classes.push({ name: cls[1], line: index + 1 });
    const imp = /from ["'](\.\.?\/[^"']+)["']/.exec(line);
    if (imp?.[1]) imports.push(imp[1]);
  });
  return { functions, classes, imports };
}

function resolveImport(fromFile: string, spec: string): string | null {
  const dir = dirname(fromFile);
  let resolved = join(dir, spec).replace(/\\/g, "/");
  if (resolved.endsWith(".ts")) return resolved;
  return `${resolved}.ts`;
}

async function main() {
  const files = (await walk(fixtureRoot)).filter((file) => file.endsWith(".ts") || file.endsWith(".md"));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  const addEdge = (edge: GraphEdge) => {
    const key = `${edge.type}|${edge.source}|${edge.target}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push(edge);
  };

  for (const abs of files.sort()) {
    const filePath = relative(fixtureRoot, abs).replace(/\\/g, "/");
    const source = await readFile(abs, "utf8");
    const meta = FILE_META[filePath];
    const isDoc = filePath.endsWith(".md");
    const fileId = isDoc ? `document:${filePath}` : `file:${filePath}`;
    nodes.push({
      id: fileId,
      type: isDoc ? "document" : "file",
      name: filePath.split("/").pop() ?? filePath,
      filePath,
      lineRange: [1, source.split("\n").length],
      summary: meta?.summary ?? `${filePath} in the Lumin Sign fixture.`,
      tags: meta?.tags ?? [],
      complexity: meta?.complexity ?? "simple",
      languageNotes: meta?.languageNotes,
    });

    if (isDoc) continue;

    const { functions, classes, imports } = extractSymbols(source);
    for (const fn of functions) {
      const key = `${filePath}:${fn.name}`;
      const extra = FN_META[key];
      const id = `function:${filePath}:${fn.name}`;
      nodes.push({
        id,
        type: "function",
        name: fn.name,
        filePath,
        lineRange: [fn.line, fn.line + 12],
        summary: extra?.summary ?? `${fn.name} in ${filePath}.`,
        tags: extra?.tags ?? [],
        complexity: extra?.complexity ?? "simple",
      });
      addEdge({
        source: fileId,
        target: id,
        type: "contains",
        direction: "forward",
        weight: 1,
      });
    }
    for (const cls of classes) {
      const key = `${filePath}:${cls.name}`;
      const extra = CLASS_META[key];
      const id = `class:${filePath}:${cls.name}`;
      nodes.push({
        id,
        type: "class",
        name: cls.name,
        filePath,
        lineRange: [cls.line, cls.line + 20],
        summary: extra?.summary ?? `${cls.name} in ${filePath}.`,
        tags: extra?.tags ?? [],
        complexity: extra?.complexity ?? "moderate",
        languageNotes: extra && "languageNotes" in extra ? extra.languageNotes : undefined,
      });
      addEdge({
        source: fileId,
        target: id,
        type: "contains",
        direction: "forward",
        weight: 1,
      });
    }
    for (const spec of imports) {
      const resolved = resolveImport(filePath, spec);
      if (!resolved || resolved.includes("types.ts")) {
        if (resolved?.includes("types.ts")) {
          addEdge({
            source: fileId,
            target: "file:src/types.ts",
            type: "imports",
            direction: "forward",
            weight: 0.5,
            description: "Shared e-sign types.",
          });
        }
        continue;
      }
      addEdge({
        source: fileId,
        target: `file:${resolved}`,
        type: "imports",
        direction: "forward",
        weight: 0.7,
      });
    }
  }

  for (const mod of MODULES) {
    nodes.push({
      id: mod.id,
      type: "module",
      name: mod.name,
      filePath: mod.filePath,
      summary: mod.summary,
      tags: mod.tags,
      complexity: "moderate",
    });
    for (const node of nodes) {
      if (node.type === "file" && node.filePath?.startsWith(`${mod.filePath}/`)) {
        addEdge({
          source: mod.id,
          target: node.id,
          type: "contains",
          direction: "forward",
          weight: 0.9,
        });
      }
    }
  }

  for (const endpoint of ENDPOINTS) {
    nodes.push(endpoint);
    addEdge({
      source: "file:src/http/routes.ts",
      target: endpoint.id,
      type: "contains",
      direction: "forward",
      weight: 1,
    });
    addEdge({
      source: endpoint.id,
      target: "file:src/http/routes.ts",
      type: "routes",
      direction: "forward",
      weight: 0.8,
    });
  }

  addEdge({
    source: "document:README.md",
    target: "file:src/http/routes.ts",
    type: "documents",
    direction: "forward",
    weight: 0.4,
    description: "README points at the HTTP entry as the place to start.",
  });

  for (const call of EXTRA_CALLS) {
    addEdge({
      source: call.source,
      target: call.target,
      type: call.target.startsWith("class:") ? "depends_on" : "calls",
      direction: "forward",
      weight: 0.85,
      description: call.description,
    });
  }

  for (const link of TESTED_BY) {
    addEdge({
      source: link.source,
      target: link.target,
      type: "tested_by",
      direction: "forward",
      weight: 0.9,
      description: "Fixture test pins this node.",
    });
  }

  addEdge({
    source: "function:src/reminders/scheduler.ts:sendDueReminders",
    target: "function:src/webhooks/dispatch.ts:emitWebhook",
    type: "triggers",
    direction: "forward",
    weight: 0.7,
    description: "Due reminders trigger reminder.sent webhooks.",
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const layers = [
    {
      id: "layer:api",
      name: "API",
      description: "HTTP-shaped entry points a requester or signer hits.",
      nodeIds: nodes
        .filter((node) => node.filePath?.startsWith("src/http") || node.type === "endpoint")
        .map((node) => node.id),
    },
    {
      id: "layer:service",
      name: "Service",
      description: "Create, routing, fields, reminders, and webhook orchestration.",
      nodeIds: nodes
        .filter((node) =>
          ["src/requests", "src/signers", "src/fields", "src/reminders", "src/webhooks"].some((prefix) =>
            node.filePath?.startsWith(prefix),
          ),
        )
        .map((node) => node.id),
    },
    {
      id: "layer:data",
      name: "Data",
      description: "In-memory store and append-only audit trail.",
      nodeIds: nodes
        .filter((node) => node.filePath?.startsWith("src/store") || node.filePath?.startsWith("src/audit"))
        .map((node) => node.id),
    },
    {
      id: "layer:utility",
      name: "Utility",
      description: "Shared types and the fixture README.",
      nodeIds: nodes
        .filter((node) => node.filePath === "src/types.ts" || node.filePath === "README.md")
        .map((node) => node.id),
    },
    {
      id: "layer:test",
      name: "Test",
      description: "Fixture tests that /understand-diff would flag as the blast-radius suite.",
      nodeIds: nodes.filter((node) => node.filePath?.startsWith("tests/")).map((node) => node.id),
    },
  ];

  const tour = [
    {
      order: 1,
      title: "Start at the map",
      description:
        "The fixture README and shared types name the six e-sign modules. Understand Anything always starts a tour at the documents and domain types so you learn vocabulary before call graphs.",
      nodeIds: ["document:README.md", "file:src/types.ts"],
    },
    {
      order: 2,
      title: "HTTP entry — send a request",
      description:
        "POST /v1/signature_request/send is the requester door. The route is a thin wrap; the interesting work lives one hop down in createSignatureRequest.",
      nodeIds: [
        "file:src/http/routes.ts",
        "endpoint:src/http/routes.ts:POST /v1/signature_request/send",
        "function:src/http/routes.ts:sendSignatureRequest",
      ],
    },
    {
      order: 3,
      title: "Create request orchestrates the send",
      description:
        "createSignatureRequest validates, then fans out to routing, field prep, the store, reminders, audit, and the sent webhook. This is the hub of the graph — change it and almost every layer lights up.",
      nodeIds: [
        "file:src/requests/create-request.ts",
        "function:src/requests/create-request.ts:createSignatureRequest",
        "function:src/requests/create-request.ts:validatePayload",
      ],
      languageLesson: "The function is an orchestrator: it calls collaborators instead of embedding their rules.",
    },
    {
      order: 4,
      title: "Signer routing / order",
      description:
        "ORDER keeps group 2 pending until group 1 signs. PARALLEL marks every signer awaiting. nextEligibleSigner is what a countersign ceremony depends on.",
      nodeIds: [
        "file:src/signers/routing.ts",
        "function:src/signers/routing.ts:resolveSigningOrder",
        "function:src/signers/routing.ts:nextEligibleSigner",
      ],
    },
    {
      order: 5,
      title: "Field prep",
      description:
        "Each signer gets signature, date, and initials. bindFieldsToSigners fail-closes if a field points at a missing signer — important when routing ids change.",
      nodeIds: [
        "file:src/fields/prep.ts",
        "function:src/fields/prep.ts:placeFields",
        "function:src/fields/prep.ts:bindFieldsToSigners",
      ],
    },
    {
      order: 6,
      title: "Reminders",
      description:
        "Cadence is [1, 3, 7] days. sendDueReminders writes reminder.sent audit rows and triggers signature_request.reminder.sent webhooks. This is the sample change with the widest cross-layer blast radius.",
      nodeIds: [
        "file:src/reminders/scheduler.ts",
        "class:src/reminders/scheduler.ts:ReminderScheduler",
        "function:src/reminders/scheduler.ts:sendDueReminders",
      ],
    },
    {
      order: 7,
      title: "Webhooks",
      description:
        "Outbound emit + retry, plus inbound viewed/signed/declined. Completing a reminder or a sign always leaves a delivery row the audit trail can cite.",
      nodeIds: [
        "file:src/webhooks/dispatch.ts",
        "class:src/webhooks/dispatch.ts:WebhookDispatcher",
        "function:src/webhooks/dispatch.ts:handleInboundWebhook",
      ],
    },
    {
      order: 8,
      title: "Audit trail",
      description:
        "Every state change appends. GET audit is how ops and compliance reconstruct who did what. If a send-path module stops calling appendAudit, this layer goes quiet — and the test suite should fail.",
      nodeIds: [
        "file:src/audit/trail.ts",
        "function:src/audit/trail.ts:appendAudit",
        "endpoint:src/http/routes.ts:GET /v1/signature_request/:id/audit",
      ],
    },
    {
      order: 9,
      title: "Tests pin the blast radius",
      description:
        "/understand-diff follows tested_by edges from a changed file. The six fixture tests are the suite a reviewer should re-run after a reminder, routing, or webhook change.",
      nodeIds: [
        "file:tests/create-request.test.ts",
        "file:tests/routing.test.ts",
        "file:tests/reminders.test.ts",
        "file:tests/webhooks.test.ts",
      ],
    },
  ];

  for (const layer of layers) {
    layer.nodeIds = layer.nodeIds.filter((id) => nodeIds.has(id));
  }
  for (const step of tour) {
    step.nodeIds = step.nodeIds.filter((id) => nodeIds.has(id));
  }

  const graph = {
    version: "1.0.0",
    kind: "codebase",
    project: {
      name: "lumin-sign-fixture",
      languages: ["TypeScript"],
      frameworks: ["Bun"],
      description:
        "Mini Lumin Sign e-sign core: create request, signer routing/order, field prep, reminders, webhooks, audit trail.",
      analyzedAt: "2026-10-09T00:00:00.000Z",
      gitCommitHash: "fixture-lumin-sign-ua-1",
    },
    nodes,
    edges: edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
    layers,
    tour,
  };

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(graph, null, 2)}\n`);
  console.log(`wrote ${graph.nodes.length} nodes / ${graph.edges.length} edges → ${relative(root, outFile)}`);
}

await main();
