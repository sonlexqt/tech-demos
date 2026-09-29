import { describe, expect, test } from "bun:test";
import {
  MISSING_SIGNER_ERROR,
  applyAction,
  assertionHolds,
  canSend,
  createInitialState,
} from "../src/core/sign-state";

describe("sign fixture state", () => {
  test("send without a signer blocks and sets an error", () => {
    const titled = applyAction(createInitialState(), {
      id: "t",
      kind: "type",
      target: "title",
      value: "NDA",
      label: "title",
    });
    const sent = applyAction(titled, {
      id: "s",
      kind: "click",
      target: "send",
      label: "send",
    });
    expect(sent.status).toBe("blocked");
    expect(sent.error).toBe(MISSING_SIGNER_ERROR);
    expect(
      assertionHolds(sent, {
        id: "e",
        kind: "expect-error",
        match: "signer",
        target: "error-banner",
        label: "err",
      }),
    ).toBe(true);
  });

  test("complete fields become ready, then sent", () => {
    let state = createInitialState();
    state = applyAction(state, {
      id: "t",
      kind: "type",
      target: "title",
      value: "MSA",
      label: "title",
    });
    state = applyAction(state, {
      id: "n",
      kind: "type",
      target: "signer-name",
      value: "Ada Lovelace",
      label: "name",
    });
    state = applyAction(state, {
      id: "e",
      kind: "type",
      target: "signer-email",
      value: "ada@lumin.example",
      label: "email",
    });
    expect(canSend(state)).toBe(true);
    expect(state.status).toBe("ready");
    state = applyAction(state, {
      id: "s",
      kind: "click",
      target: "send",
      label: "send",
    });
    expect(state.status).toBe("sent");
    expect(state.error).toBeNull();
  });

  test("decline then send recovers", () => {
    let state = createInitialState();
    state = applyAction(state, {
      id: "t",
      kind: "type",
      target: "title",
      value: "Offer",
      label: "title",
    });
    state = applyAction(state, {
      id: "n",
      kind: "type",
      target: "signer-name",
      value: "Katherine Johnson",
      label: "name",
    });
    state = applyAction(state, {
      id: "e",
      kind: "type",
      target: "signer-email",
      value: "kj@lumin.example",
      label: "email",
    });
    state = applyAction(state, {
      id: "d",
      kind: "click",
      target: "decline",
      label: "decline",
    });
    expect(state.status).toBe("declined");
    state = applyAction(state, {
      id: "s",
      kind: "click",
      target: "send",
      label: "send",
    });
    expect(state.status).toBe("sent");
  });
});
