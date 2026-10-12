import capture from "../fixtures/signer-src/src/capture.ts?raw";
import constants from "../fixtures/signer-src/src/constants.ts?raw";
import fields from "../fixtures/signer-src/src/fields.ts?raw";
import index from "../fixtures/signer-src/src/index.ts?raw";
import pdfWrite from "../fixtures/signer-src/src/pdf-write.ts?raw";
import bundle from "../fixtures/signer-bundle/signer.min.js?raw";

export const SOURCE_FILES = [
  { id: "constants", label: "constants.ts", path: "fixtures/signer-src/src/constants.ts", code: constants },
  { id: "fields", label: "fields.ts", path: "fixtures/signer-src/src/fields.ts", code: fields },
  { id: "capture", label: "capture.ts", path: "fixtures/signer-src/src/capture.ts", code: capture },
  { id: "pdf-write", label: "pdf-write.ts", path: "fixtures/signer-src/src/pdf-write.ts", code: pdfWrite },
  { id: "index", label: "index.ts", path: "fixtures/signer-src/src/index.ts", code: index },
  { id: "bundle", label: "signer.min.js", path: "fixtures/signer-bundle/signer.min.js", code: bundle },
] as const;
