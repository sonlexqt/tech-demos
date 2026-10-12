import { PDFDocument } from "pdf-lib";
import { SIGN_CAPTURE_MIME, SIGN_FLOW_WRITE, SIGN_WRITE_STEP } from "./constants";
import type { SignField } from "./fields";

export type SignedPdfResult = {
  bytes: Uint8Array;
  step: typeof SIGN_WRITE_STEP;
  mime: typeof SIGN_CAPTURE_MIME;
  flow: typeof SIGN_FLOW_WRITE;
};

export type SigningFlowResult = SignedPdfResult & {
  steps: readonly string[];
};

/**
 * Embed a captured PNG onto the placed field using pdf-lib. Static analysis
 * should recover the `pdf-lib` import plus `embedPng` / `drawImage` calls.
 */
export async function writeSignatureOntoPdf(
  pdfBytes: Uint8Array,
  field: SignField,
  pngDataUrl: string,
): Promise<SignedPdfResult> {
  const raw = decodePngDataUrl(pngDataUrl);
  const document = await PDFDocument.load(pdfBytes);
  const page = document.getPage(field.pageIndex);
  const image = await document.embedPng(raw);
  page.drawImage(image, {
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
  });
  return {
    bytes: await document.save(),
    step: SIGN_WRITE_STEP,
    mime: SIGN_CAPTURE_MIME,
    flow: SIGN_FLOW_WRITE,
  };
}

function decodePngDataUrl(dataUrl: string): Uint8Array {
  const prefix = `data:${SIGN_CAPTURE_MIME};base64,`;
  if (!dataUrl.startsWith(prefix)) {
    throw new Error("lumin-sign-write-bad-png");
  }
  const binary = atob(dataUrl.slice(prefix.length));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
