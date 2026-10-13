import type { StepExecutor } from "e2e";

/**
 * Offline stand-in for the built-in model loop.
 *
 * Uses the documented StepExecutor contract (`runStep`, `ctx.observe`,
 * `ctx.actions`) so `agent.act` still records into the replay cache.
 * When a later locator assertion passes, the next run replays those
 * actions with no model and never calls this file.
 *
 * Live model runs replace this executor when E2E_LIVE_AGENT=1 and a key
 * is present — see e2e.config.ts.
 */
type NodeHit = { id: string; role: string; name: string };

function walkTree(node: { id?: string; role?: string; name?: string; children?: readonly unknown[] } | undefined, out: NodeHit[]): void {
  if (!node) return;
  if (node.id && node.role) {
    out.push({ id: node.id, role: node.role, name: node.name ?? "" });
  }
  for (const child of node.children ?? []) {
    walkTree(child as { id?: string; role?: string; name?: string; children?: readonly unknown[] }, out);
  }
}

function parseNodes(text: string, tree?: { id?: string; role?: string; name?: string; children?: readonly unknown[] }): NodeHit[] {
  const nodes: NodeHit[] = [];
  walkTree(tree, nodes);
  const lineRe = /#(\S+)\s+(\S+)\s+"([^"]*)"/g;
  for (const line of text.split("\n")) {
    lineRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(line))) {
      if (!nodes.some((n) => n.id === m![1])) {
        nodes.push({ id: m[1], role: m[2], name: m[3] });
      }
    }
  }
  return nodes;
}

function find(
  nodes: NodeHit[],
  role: string,
  names: string[],
): NodeHit | undefined {
  const want = names.map((n) => n.toLowerCase());
  const roleHits = nodes.filter((n) => n.role.toLowerCase() === role.toLowerCase());
  for (const w of want) {
    const exact = roleHits.find((n) => n.name.toLowerCase() === w);
    if (exact) return exact;
  }
  for (const w of want) {
    const part = roleHits.find((n) => n.name.toLowerCase().includes(w));
    if (part) return part;
  }
  return undefined;
}

function findInput(nodes: NodeHit[]): NodeHit | undefined {
  return (
    nodes.find((n) => /textbox|input|searchbox/i.test(n.role)) ??
    nodes.find((n) => /signature|adopted name/i.test(n.name))
  );
}

async function tapName(
  actions: {
    tap: (target: { id: string }) => Promise<unknown>;
  },
  nodes: NodeHit[],
  role: string,
  names: string[],
): Promise<boolean> {
  const hit = find(nodes, role, names);
  if (!hit) return false;
  await actions.tap({ id: hit.id });
  return true;
}

export const scriptedSigner: StepExecutor = {
  name: "lumin-scripted",
  version: "1",
  cache: "inherit",
  async runStep(ctx) {
    if (ctx.step.kind === "assert") {
      const screen = await ctx.observe();
      const instruction = ctx.step.instruction.toLowerCase();
      const holds = screen.text.toLowerCase().includes(
        instruction.replace(/^the screen (shows|says|contains)\s+/i, ""),
      );
      return {
        status: holds ? "passed" : "failed",
        summary: holds
          ? "Assertion holds on the text snapshot."
          : "Assertion text was not on screen.",
      };
    }

    if (ctx.step.kind !== "act") {
      return {
        status: "blocked",
        errorCode: "AUTOMATION_UNSUPPORTED",
        summary: "This executor only implements act and assert.",
      };
    }

    const goal = ctx.step.instruction.toLowerCase();
    const params = (ctx.step.params ?? {}) as Record<string, string>;

    if (ctx.replayedPrefix) {
      // Replay stopped (UI drift). Continue from the current screen.
    }

    const observe = async () => {
      const shot = await ctx.observe({ tree: true });
      return { text: shot.text, nodes: parseNodes(shot.text, shot.tree) };
    };

    const prepareNames = ["add signature field", "drop an ink stamp"];
    const sendNames = ["send for signing", "dispatch envelope"];
    const finishNames = ["finish", "apply signature"];
    const openNames = ["open envelope"];
    const adaNames = ["sign as ada lovelace"];
    const bobNames = ["countersign as bob signer"];

    const runPrepare = async () => {
      let { nodes, text } = await observe();
      await tapName(ctx.actions, nodes, "button", openNames);
      ({ nodes, text } = await observe());
      if (!(await tapName(ctx.actions, nodes, "button", prepareNames))) {
        throw new Error(`No place-field button on screen:\n${text}`);
      }
      ({ nodes, text } = await observe());
      if (!(await tapName(ctx.actions, nodes, "button", sendNames))) {
        throw new Error(`No send button on screen:\n${text}`);
      }
      ({ text } = await observe());
      if (/place ada/i.test(text) && /before sending/i.test(text)) {
        throw new Error("Send was rejected; a signature field was not placed.");
      }
      if (/\bDraft\b/.test(text) && !/Awaiting/i.test(text)) {
        throw new Error("Prepare finished but the envelope is still Draft.");
      }
    };

    const runSign = async (who: "ada" | "bob") => {
      const typed =
        (who === "ada"
          ? params.name ?? params.signer ?? "Ada Lovelace"
          : params.name ?? params.signer ?? "Bob Signer") ||
        (who === "ada" ? "Ada Lovelace" : "Bob Signer");
      let { nodes } = await observe();
      const jump = who === "ada" ? adaNames : bobNames;
      await tapName(ctx.actions, nodes, "button", jump);
      ({ nodes } = await observe());
      const box = findInput(nodes);
      if (box) {
        await ctx.actions.type({ id: box.id }, typed);
      }
      ({ nodes } = await observe());
      await tapName(ctx.actions, nodes, "button", finishNames);
    };

    try {
      if (
        /place|prepare|field|send for signing|open the envelope|ink stamp/.test(
          goal,
        )
      ) {
        await runPrepare();
        return { status: "passed", summary: "Prepared the envelope and sent it." };
      }
      if (/countersign|bob/.test(goal)) {
        await runSign("bob");
        return { status: "passed", summary: "Countersigned as Bob Signer." };
      }
      if (/sign|ada/.test(goal)) {
        await runSign("ada");
        return { status: "passed", summary: "Signed as Ada Lovelace." };
      }
      return {
        status: "blocked",
        errorCode: "AUTOMATION_UNSUPPORTED",
        summary: `No scripted plan for: ${ctx.step.instruction}`,
      };
    } catch (err) {
      return {
        status: "failed",
        summary: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
