import { describe, expect, test } from "bun:test";
import { detectIntent } from "./intents";

describe("detectIntent", () => {
  test("maps each preset query to its intent", () => {
    expect(detectIntent("the pdf I just downloaded")).toBe("newest_download");
    expect(detectIntent("waiting on legal to sign")).toBe("waiting_legal");
    expect(detectIntent("MSA countersign")).toBe("msa_countersign");
    expect(detectIntent("expired signature requests")).toBe("expired_signature");
  });

  test("detectIntent is case-insensitive and trims whitespace", () => {
    expect(detectIntent("  THE PDF I JUST DOWNLOADED  ")).toBe("newest_download");
  });

  test("unrelated and empty queries are generic", () => {
    expect(detectIntent("")).toBe("generic");
    expect(detectIntent("brand guidelines")).toBe("generic");
  });
});
