import { describe, expect, test } from "bun:test";
import { isStaleEpoch } from "../lib/request-epoch";

describe("isStaleEpoch", () => {
  test("isStaleEpoch rejects older request ids", () => {
    expect(isStaleEpoch(3, 4)).toBe(true);
    expect(isStaleEpoch(4, 4)).toBe(false);
  });
});
