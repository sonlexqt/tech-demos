import { describe, expect, test } from "bun:test";

describe("README", () => {
  test("README names Superpowers methodology and companion PR 9", async () => {
    const text = await Bun.file(new URL("../README.md", import.meta.url)).text();
    expect(text).toContain("bun install && bun run dev");
    expect(text).toContain("obra/superpowers");
    expect(text).toContain("PR #9");
    expect(text).toContain("the pdf I just downloaded");
    expect(text).toContain("Fixture mode");
  });
});
