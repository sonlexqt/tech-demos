import {
	ExtractInputKind,
	type ExtractionConfig,
	extract,
} from "@xberg-io/xberg";
export const ids = ["native", "clean", "degraded"] as const;
export type Fixture = (typeof ids)[number];
export function config(nativeOnly: boolean): ExtractionConfig {
	return {
		useCache: false,
		enableQualityProcessing: true,
		disableOcr: nativeOnly,
		forceOcr: false,
		pages: { extractPages: true },
		extractionTimeoutSecs: 60,
		ocr: {
			backend: "tesseract",
			language: ["eng"],
			tessdataPath:
				process.env.TESSDATA_PREFIX || "/usr/share/tesseract-ocr/5/tessdata",
			vlmFallback: { mode: "disabled" },
		},
	};
}
export async function extractBytes(bytes: Uint8Array, nativeOnly: boolean) {
	const start = performance.now();
	const result = await extract(
		{
			kind: ExtractInputKind.Bytes,
			bytes,
			mimeType: "application/pdf",
			filename: "synthetic.pdf",
		},
		config(nativeOnly),
	);
	if (result.errors?.length) throw new Error(JSON.stringify(result.errors));
	const document = result.results?.[0];
	if (!document) throw new Error("Xberg returned no document");
	const reasons: string[] = [];
	if (!document.content?.trim()) reasons.push("No text recovered");
	if (document.processingWarnings?.length)
		reasons.push("Engine warnings require inspection");
	const observed =
		document.pages?.some((p) => p.ocrConfidence != null) ?? false;
	if (observed) reasons.push("OCR observed: inspect critical values");
	if ((document.content?.length ?? 0) < 80)
		reasons.push("Sparse text (demo threshold: 80 characters)");
	return {
		elapsedMs: Math.round((performance.now() - start) * 10) / 10,
		document: { ...document, content: document.content ?? "" },
		ocrObservation: observed
			? "OCR observed"
			: "Unknown — no page OCR confidence",
		review: {
			status: reasons.length ? "Review suggested" : "No heuristic triggered",
			reasons,
		},
		config: config(nativeOnly),
	};
}
export async function compare(id: Fixture) {
	const bytes = new Uint8Array(
		await Bun.file(
			new URL(`fixtures/${id}.pdf`, import.meta.url),
		).arrayBuffer(),
	);
	// Sequential for interpretable per-call elapsed times, without app or extraction caching.
	return {
		fixture: id,
		native: await extractBytes(bytes, true),
		automatic: await extractBytes(bytes, false),
	};
}
