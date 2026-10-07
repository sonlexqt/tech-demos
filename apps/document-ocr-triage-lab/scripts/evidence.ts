import { evaluate } from "../evaluation";
import { compare } from "../extraction";

const runs = [];
for (const id of ["native", "clean", "degraded"] as const) {
	const r = await compare(id);
	runs.push({
		...r,
		evaluation: {
			native: evaluate(r.native.document.content),
			automatic: evaluate(r.automatic.document.content),
		},
	});
}
await Bun.write(
	"evidence/results.json",
	JSON.stringify(
		{ versions: { bun: Bun.version, xberg: "1.3.5" }, runs },
		null,
		2,
	),
);
