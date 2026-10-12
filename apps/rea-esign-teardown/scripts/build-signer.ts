import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "fixtures/signer-src/src/index.ts");
const outfile = resolve(root, "fixtures/signer-bundle/signer.min.js");

await mkdir(dirname(outfile), { recursive: true });

const result = await Bun.build({
  entrypoints: [entry],
  outfile,
  minify: true,
  target: "browser",
  format: "esm",
  external: ["pdf-lib"],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  throw new Error("signer bundle build failed");
}

const artifact = result.outputs[0];
if (!artifact) {
  throw new Error("signer bundle produced no output");
}

await Bun.write(outfile, artifact);
console.log(`wrote ${outfile} (${artifact.size} bytes, minified, pdf-lib external)`);
