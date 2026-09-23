import { createSpecStreamCompiler, type Spec, type UIElement } from "@json-render/core";

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export interface StreamProgress {
  spec: Spec;
  applied: number;
  total: number;
  lastPatch: string;
}

/**
 * Turn a finished Spec into SpecStream JSONL (RFC 6902) and apply it
 * progressively with createSpecStreamCompiler — the same compiler
 * useUIStream uses when talking to a live endpoint.
 */
export async function streamSpecProgressively(
  target: Spec,
  onProgress: (progress: StreamProgress) => void,
  signal?: AbortSignal,
  delayMs = 80,
): Promise<Spec> {
  const patches = specToElementPatches(target);
  const compiler = createSpecStreamCompiler<Spec>();
  let latest: Spec = { root: "", elements: {} };

  for (const [index, patch] of patches.entries()) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const line = `${JSON.stringify(patch)}\n`;
    const { result } = compiler.push(line);
    latest = {
      root: result.root ?? "",
      elements: { ...(result.elements ?? {}) },
      state: result.state,
    };
    onProgress({
      spec: latest,
      applied: index + 1,
      total: patches.length,
      lastPatch: JSON.stringify(patch),
    });
    if (delayMs > 0 && index < patches.length - 1) {
      await wait(delayMs, signal);
    }
  }

  return compiler.getResult();
}

export async function streamFromLiveApi(
  api: string,
  prompt: string,
  onProgress: (progress: StreamProgress) => void,
  signal?: AbortSignal,
): Promise<Spec> {
  const compiler = createSpecStreamCompiler<Spec>();
  const response = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`Live generate failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let applied = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const { result, newPatches } = compiler.push(chunk);
    if (newPatches.length > 0) {
      applied += newPatches.length;
      onProgress({
        spec: {
          root: result.root ?? "",
          elements: { ...(result.elements ?? {}) },
          state: result.state,
        },
        applied,
        total: Math.max(applied, 1),
        lastPatch: JSON.stringify(newPatches[newPatches.length - 1]),
      });
    }
  }

  return compiler.getResult();
}

/** One RFC 6902 line per element so the board paints progressively. */
function specToElementPatches(spec: Spec): Array<{ op: "add"; path: string; value: unknown }> {
  const patches: Array<{ op: "add"; path: string; value: unknown }> = [
    { op: "add", path: "/root", value: spec.root },
    { op: "add", path: "/elements", value: {} },
  ];
  if (spec.state) {
    patches.push({ op: "add", path: "/state", value: spec.state });
  }
  const keys = Object.keys(spec.elements);
  const ordered =
    spec.root && keys.includes(spec.root)
      ? [spec.root, ...keys.filter((key) => key !== spec.root)]
      : keys;
  for (const key of ordered) {
    patches.push({
      op: "add",
      path: `/elements/${key}`,
      value: spec.elements[key] as UIElement,
    });
  }
  return patches;
}
