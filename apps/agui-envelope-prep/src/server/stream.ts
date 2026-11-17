import { EventEncoder } from "@ag-ui/encoder";
import type { BaseEvent } from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import { uid } from "../shared/ids";

export type EventSink = (event: BaseEvent) => void | Promise<void>;

export function createEncoder(accept: string | undefined): EventEncoder {
  return new EventEncoder({ accept });
}

export function sseResponse(
  encoder: EventEncoder,
  produce: (send: EventSink) => Promise<void>,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send: EventSink = (event) => {
        controller.enqueue(encoder.encodeBinary(event));
      };
      try {
        await produce(send);
      } catch (error) {
        send({
          type: EventType.RUN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": encoder.getContentType(),
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function emitText(
  send: EventSink,
  text: string,
  options?: { delayMs?: number; messageId?: string },
): Promise<string> {
  const messageId = options?.messageId ?? uid("msg");
  const delayMs = options?.delayMs ?? 0;
  await send({
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: "assistant",
  });
  const chunks = chunkText(text, 42);
  for (const delta of chunks) {
    await send({
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta,
    });
    if (delayMs > 0) await sleep(delayMs);
  }
  await send({
    type: EventType.TEXT_MESSAGE_END,
    messageId,
  });
  return messageId;
}

export async function emitToolCall(
  send: EventSink,
  name: string,
  args: unknown,
  result: unknown,
  options?: { delayMs?: number; parentMessageId?: string },
): Promise<string> {
  const toolCallId = uid("tc");
  const parentMessageId = options?.parentMessageId ?? uid("msg");
  await send({
    type: EventType.TOOL_CALL_START,
    toolCallId,
    toolCallName: name,
    parentMessageId,
  });
  const json = JSON.stringify(args);
  const parts = chunkText(json, 80);
  for (const delta of parts) {
    await send({
      type: EventType.TOOL_CALL_ARGS,
      toolCallId,
      delta,
    });
    if (options?.delayMs) await sleep(options.delayMs);
  }
  await send({
    type: EventType.TOOL_CALL_END,
    toolCallId,
  });
  await send({
    type: EventType.TOOL_CALL_RESULT,
    messageId: uid("toolmsg"),
    toolCallId,
    content: JSON.stringify(result),
    role: "tool",
  });
  return toolCallId;
}

export function chunkText(text: string, size: number): string[] {
  if (!text) return [" "];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
