import { HttpAgent, type AgentSubscriber } from "@ag-ui/client";
import type { BaseEvent, Interrupt } from "@ag-ui/core";
import type { EnvelopeState } from "../shared/types";
import { cloneEnvelope, initialEnvelope } from "../shared/envelope";
import { uid } from "../shared/ids";

export interface SessionHandlers {
  onEvent: (event: BaseEvent) => void;
  onState: (state: EnvelopeState) => void;
  onNarration: (text: string) => void;
  onInterrupt: (interrupt: Interrupt, state: EnvelopeState) => void;
  onFinished: (state: EnvelopeState, result: unknown) => void;
  onError: (message: string) => void;
}

export class EnvelopeSession {
  agent: HttpAgent;
  private handlers: SessionHandlers;
  private narration = "";

  constructor(handlers: SessionHandlers) {
    this.handlers = handlers;
    this.agent = this.createAgent();
  }

  private createAgent(): HttpAgent {
    const agent = new HttpAgent({
      url: "/agui",
      threadId: uid("thread"),
      initialState: initialEnvelope(),
    });
    const subscriber: AgentSubscriber = {
      onEvent: ({ event }) => this.handlers.onEvent(event),
      onStateChanged: ({ state }) => this.handlers.onState(state as EnvelopeState),
      onTextMessageStartEvent: () => {
        this.narration = "";
      },
      onTextMessageContentEvent: ({ textMessageBuffer }) => {
        this.narration = textMessageBuffer;
        this.handlers.onNarration(this.narration);
      },
      onRunFinishedEvent: (params) => {
        const state = this.agent.state as EnvelopeState;
        if (params.outcome === "interrupt") {
          const interrupt = params.interrupts[0] ?? this.agent.pendingInterrupts[0];
          if (interrupt) this.handlers.onInterrupt(interrupt, state);
          return;
        }
        const result = "result" in params ? params.result : undefined;
        this.handlers.onFinished(state, result);
      },
      onRunErrorEvent: ({ event }) => {
        this.handlers.onError(event.message);
      },
    };
    agent.subscribe(subscriber);
    return agent;
  }

  reset(): void {
    this.agent = this.createAgent();
    this.narration = "";
  }

  currentState(): EnvelopeState {
    return (this.agent.state as EnvelopeState) ?? initialEnvelope();
  }

  pushState(state: EnvelopeState): void {
    this.agent.setState(cloneEnvelope(state));
  }

  async prepare(mode: "mock" | "live"): Promise<void> {
    this.agent.messages = [
      {
        id: uid("msg"),
        role: "user",
        content: "Prepare this envelope for me",
      },
    ];
    await this.agent.runAgent({
      forwardedProps: { mode, delayMs: mode === "mock" ? 90 : 20 },
    });
  }

  async resume(
    payload: unknown,
    status: "resolved" | "cancelled" = "resolved",
    mode: "mock" | "live" = "mock",
  ): Promise<void> {
    const interrupt = this.agent.pendingInterrupts[0];
    if (!interrupt) throw new Error("No pending interrupt");
    await this.agent.runAgent({
      forwardedProps: { mode, delayMs: 0 },
      resume: [
        {
          interruptId: interrupt.id,
          status,
          ...(status === "resolved" ? { payload } : {}),
        },
      ],
    });
  }
}
