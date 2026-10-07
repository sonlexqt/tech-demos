import { expect, test } from "bun:test";
import { evaluate } from "./evaluation";
import { compare, extractBytes } from "./extraction";

test("native fields survive both modes", async () => {
	const r = await compare("native");
	expect(evaluate(r.native.document.content).recovered).toBe(7);
	expect(evaluate(r.automatic.document.content).recovered).toBe(7);
}, 60000);
test("image scan recovers fields beyond disabled OCR baseline", async () => {
	const r = await compare("clean");
	expect(evaluate(r.native.document.content).recovered).toBe(0);
	expect(evaluate(r.automatic.document.content).recovered).toBe(7);
	expect(r.automatic.ocrObservation).toBe("OCR observed");
}, 60000);
test("Bates-only text is not completeness; degraded missing total counted", async () => {
	const r = await compare("degraded");
	expect(evaluate(r.native.document.content).recovered).toBe(1);
	const e = evaluate(r.automatic.document.content);
	expect(e.missing).toBeGreaterThan(0);
	expect(e.fields.find((f) => f.field === "total")?.match).toBe(false);
}, 60000);
test("malformed PDF produces explicit error", async () => {
	await expect(
		extractBytes(new TextEncoder().encode("%PDF-1.7 broken input"), false),
	).rejects.toThrow();
});
test("field evaluation requires exact labeled values", () => {
	expect(evaluate("Subtotal: 1200.00\nTax: 120.00").recovered).toBe(2);
	expect(evaluate("TOTAL: USD 1320.0").missing).toBe(7);
});
