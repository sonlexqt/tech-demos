/**
 * Writes a one-page Helvetica MSA fixture to public/contract.pdf.
 * No third-party PDF library — a tiny hand-built PDF-1.4 file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const lines = [
  "BT",
  "/F1 18 Tf",
  "1 0 0 1 72 730 Tm",
  "(ACME CORP  /  HARBOR NOTES) Tj",
  "/F1 14 Tf",
  "1 0 0 1 72 704 Tm",
  "(Master Services Agreement) Tj",
  "/F1 10 Tf",
  "1 0 0 1 72 676 Tm",
  "(Fixture document for the Lumin Sign e2e demo. Not a real contract.) Tj",
  "1 0 0 1 72 650 Tm",
  "(1. Services. Harbor will provide demo tooling to Acme as described here.) Tj",
  "1 0 0 1 72 632 Tm",
  "(2. Term. This fixture lives only in the browser session.) Tj",
  "1 0 0 1 72 614 Tm",
  "(3. Signatures. Two signers: Ada Lovelace, then Bob Signer.) Tj",
  "1 0 0 1 72 580 Tm",
  "(IN WITNESS WHEREOF the parties type their names on this page.) Tj",
  "1 0 0 1 72 430 Tm",
  "(Ada Lovelace, First signer) Tj",
  "1 0 0 1 72 300 Tm",
  "(Bob Signer, Countersigner) Tj",
  "ET",
];

const stream = lines.join("\n") + "\n";
const objects: string[] = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

function build(): Uint8Array {
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefAt = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  body += `startxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "contract.pdf");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, build());
console.log(`wrote ${out}`);
