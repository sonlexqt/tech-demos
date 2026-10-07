const $ = (id) => document.getElementById(id);
const descriptions = {
	native: "Selectable text. All seven invoice fields are present.",
	clean: "Image-only page. No native text layer to extract.",
	degraded:
		"Blurred, downsampled scan; total partly masked. Crisp native Bates stamp.",
};
const escapeHtml = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			],
	);
$("fixture").addEventListener("change", () => {
	const id = $("fixture").value;
	$("description").textContent = descriptions[id];
	$("source").href = `/fixtures/${id}.pdf`;
	$("status").textContent =
		"Selection changed. Run to replace the previous results.";
});
function render(mode, r) {
	$("" + mode + "-time").textContent = `${r.elapsedMs} ms`;
	const d = r.document;
	$(mode + "-result").innerHTML =
		`<div class="metrics"><div><strong>${d.content.length}</strong>characters</div><div><strong>${d.qualityScore == null ? "Unknown" : d.qualityScore.toFixed(2)}</strong>retained-text cleanliness</div><div><strong>${d.processingWarnings?.length ?? 0}</strong>engine warnings</div></div><div class="review">${escapeHtml(r.review.status)} · ${escapeHtml(r.ocrObservation)}</div><div class="textlabel">EXTRACTED TEXT / UNEDITED</div><pre>${escapeHtml(d.content || "[No text recovered]")}</pre><details><summary>Warnings & review reasons</summary><p>${escapeHtml(r.review.reasons.join(" • ") || "No rule triggered; correctness remains unknown.")}</p>${(d.processingWarnings || []).map((w) => `<p>${escapeHtml(w.source)}: ${escapeHtml(w.message)}</p>`).join("") || "<p>No engine warnings returned.</p>"}</details><details><summary>Available diagnostics & exact configuration</summary><p>Raw engine telemetry is uncalibrated; confidence is not a correctness probability. Missing values are unknown.</p><pre>${escapeHtml(JSON.stringify({ extractionMethod: d.extractionMethod, qualityScore: d.qualityScore ?? null, extractionConfidence: d.extractionConfidence ?? null, pageOcrConfidence: d.pages?.map((p) => ({ page: p.pageNumber, ocrConfidence: p.ocrConfidence ?? null })), metadata: d.metadata, config: r.config }, null, 2))}</pre></details>`;
}
$("run").addEventListener("click", async () => {
	const fixture = $("fixture").value;
	$("run").disabled = true;
	$("fixture").disabled = true;
	$("status").textContent =
		"Extracting locally… native pass, then automatic OCR. Cache disabled.";
	try {
		const response = await fetch("/api/compare", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ fixture }),
		});
		const r = await response.json();
		if (!response.ok) throw new Error(r.error);
		render("native", r.native);
		render("automatic", r.automatic);
		const e = r.evaluation;
		$("evaluation").innerHTML =
			`<div class="counts"><strong>Native: ${e.native.recovered}/7 recovered · ${e.native.missing} missing</strong><strong>Automatic: ${e.automatic.recovered}/7 recovered · ${e.automatic.missing} missing</strong></div><table><thead><tr><th>FIELD</th><th>KNOWN ANSWER</th><th>NATIVE ONLY</th><th>AUTOMATIC OCR</th></tr></thead><tbody>${e.native.fields.map((f, i) => `<tr><td>${escapeHtml(f.field)}</td><td>${escapeHtml(f.expected)}</td><td class="${f.match ? "ok" : "miss"}">${f.match ? "✓" : "×"} ${escapeHtml(f.actual ?? "Missing")}</td><td class="${e.automatic.fields[i].match ? "ok" : "miss"}">${e.automatic.fields[i].match ? "✓" : "×"} ${escapeHtml(e.automatic.fields[i].actual ?? "Missing")}</td></tr>`).join("")}</tbody></table>`;
		$("status").textContent =
			`Completed: ${descriptions[fixture]} Timings are observations, not benchmarks.`;
		$("versions").textContent =
			`Xberg ${r.versions.xberg} · Bun ${r.versions.bun} · Tesseract / eng · cache off`;
	} catch (error) {
		$("status").textContent = `Extraction error: ${error.message}`;
		$("evaluation").textContent = "Run failed. No new evaluation available.";
	} finally {
		$("run").disabled = false;
		$("fixture").disabled = false;
	}
});
