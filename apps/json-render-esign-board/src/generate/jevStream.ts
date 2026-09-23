import type { Spec } from "@json-render/core";

export interface ComposeStatus {
  available: boolean;
  engine: "jev" | "fixture";
  model: string | null;
}

export async function fetchComposeStatus(): Promise<ComposeStatus> {
  try {
    const response = await fetch("/api/compose/status");
    if (!response.ok) {
      return { available: false, engine: "fixture", model: null };
    }
    const data = (await response.json()) as Partial<ComposeStatus>;
    if (data.available && data.engine === "jev") {
      return { available: true, engine: "jev", model: data.model ?? "typesafe-ai/jev" };
    }
    return { available: false, engine: "fixture", model: null };
  } catch {
    return { available: false, engine: "fixture", model: null };
  }
}

export interface JevProgress {
  spec: Spec;
  step: number;
  stopReason?: string;
}

export async function streamJevCompose(
  prompt: string,
  onProgress: (progress: JevProgress) => void,
  signal?: AbortSignal,
): Promise<Spec | null> {
  const response = await fetch("/api/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!response.ok) {
    let detail = `Jev compose failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) detail = payload.error;
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  if (!response.body) {
    throw new Error("Jev compose returned an empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let latest: Spec | null = null;
  let step = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as {
        type?: string;
        spec?: Spec | null;
        stopReason?: string;
        error?: string;
      };
      if (event.error) {
        throw new Error(event.error);
      }
      if (event.spec) {
        step += 1;
        latest = event.spec;
        onProgress({
          spec: event.spec,
          step,
          stopReason: event.stopReason,
        });
      }
    }
  }

  return latest;
}
