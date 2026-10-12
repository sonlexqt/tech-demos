import { SignatureCapture } from "./capture";
import {
  SIGN_FLOW_CAPTURE,
  SIGN_FLOW_PLACE,
  SIGN_FLOW_WRITE,
} from "./constants";
import { placeSignatureField, type PageBox, type SignField } from "./fields";
import { writeSignatureOntoPdf, type SigningFlowResult } from "./pdf-write";

export type SigningSession = {
  field: SignField | null;
  pngDataUrl: string | null;
};

export type SigningInput = {
  page: PageBox;
  click: { x: number; y: number };
  canvas: HTMLCanvasElement;
  pdfBytes: Uint8Array;
};

/**
 * Owned fixture flow: place a signature field, capture ink, write the PNG
 * into the PDF. This is the sequence REA is asked to map from the minified
 * bundle — never a third-party product.
 */
export async function runSigningFlow(input: SigningInput): Promise<SigningFlowResult> {
  const steps = [SIGN_FLOW_PLACE, SIGN_FLOW_CAPTURE, SIGN_FLOW_WRITE] as const;
  const field = placeSignatureField(input.page, input.click);
  const capture = new SignatureCapture(input.canvas);
  capture.attach();
  const pngDataUrl = capture.exportPng();
  capture.detach();
  const signed = await writeSignatureOntoPdf(input.pdfBytes, field, pngDataUrl);
  return { ...signed, steps };
}

export {
  placeSignatureField,
  SignatureCapture,
  writeSignatureOntoPdf,
  SIGN_FLOW_CAPTURE,
  SIGN_FLOW_PLACE,
  SIGN_FLOW_WRITE,
};

export type { PageBox, SignField, SigningFlowResult };
