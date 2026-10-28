import { describe, expect, it } from "vitest";
import { statusLabel } from "./format";

describe("statusLabel", () => {
  it("maps envelope statuses to review copy", () => {
    expect(statusLabel("awaiting_signature")).toBe("Awaiting signature");
    expect(statusLabel("completed")).toBe("Completed");
    expect(statusLabel("voided")).toBe("Voided");
  });
});
