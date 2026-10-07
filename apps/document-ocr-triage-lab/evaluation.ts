import truth from "./fixtures/truth.json";
// Known answers never enter extraction configuration or production review rules.
export function evaluate(text: string) {
	const patterns: Record<keyof typeof truth, RegExp> = {
		invoice: /^INVOICE:\s*(.+)$/im,
		date: /^DATE:\s*(.+)$/im,
		customer: /^CUSTOMER:\s*(.+)$/im,
		subtotal: /^Subtotal:\s*(.+)$/im,
		tax: /^Tax:\s*(.+)$/im,
		total: /^TOTAL:\s*(.+)$/im,
		bates: /^BATES:\s*(.+)$/im,
	};
	const fields = Object.entries(truth).map(([field, expected]) => {
		const actual =
			text.match(patterns[field as keyof typeof truth])?.[1]?.trim() || null;
		return { field, expected, actual, match: actual === expected };
	});
	return {
		fields,
		recovered: fields.filter((f) => f.match).length,
		missing: fields.filter((f) => !f.match).length,
		total: fields.length,
	};
}
