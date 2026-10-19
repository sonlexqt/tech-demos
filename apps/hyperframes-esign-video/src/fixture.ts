export type FixtureStep = "upload" | "place" | "sign" | "countersign" | "audit";

const ORDER: FixtureStep[] = ["upload", "place", "sign", "countersign", "audit"];

const LABELS: Record<FixtureStep, string> = {
  upload: "Upload MSA",
  place: "Place field",
  sign: "Sign",
  countersign: "Countersign",
  audit: "Audit trail",
};

const EVENTS = [
  { t: "09:02:11", a: "MSA uploaded", who: "Avery Chen" },
  { t: "09:06:44", a: "Signature field placed · p.12", who: "Avery Chen" },
  { t: "09:14:02", a: "Signed", who: "Avery Chen" },
  { t: "09:21:18", a: "Countersigned", who: "Jordan Hale" },
  { t: "09:21:19", a: "Envelope complete", who: "Lumin Sign" },
];

export function mountFixture(root: HTMLElement): void {
  let step: FixtureStep = "upload";
  let uploaded = false;
  let fieldPlaced = false;
  let signed = false;
  let countersigned = false;

  const render = () => {
    const idx = ORDER.indexOf(step);
    root.innerHTML = `
      <header class="fx-top">
        <div>
          <div class="fx-mark">Lumin Sign</div>
          <div class="fx-env">ENV-MSA-7F2C91 · Harbor MSA v2</div>
        </div>
        <span class="fx-badge">Fixture — not the real Lumin app</span>
      </header>
      <ol class="fx-steps">
        ${ORDER.map((s, i) => {
          const done =
            (s === "upload" && uploaded) ||
            (s === "place" && fieldPlaced) ||
            (s === "sign" && signed) ||
            (s === "countersign" && countersigned) ||
            (s === "audit" && countersigned);
          return `<li class="${s === step ? "is-on" : ""} ${done ? "is-done" : ""}">${i + 1}. ${LABELS[s]}</li>`;
        }).join("")}
      </ol>
      <section class="fx-body">${body()}</section>
      <footer class="fx-nav">
        <button type="button" data-act="back" ${idx === 0 ? "disabled" : ""}>Back</button>
        <button type="button" class="primary" data-act="next" ${canAdvance() ? "" : "disabled"}>${idx === ORDER.length - 1 ? "Reset desk" : "Next"}</button>
      </footer>
    `;

    root.querySelector("[data-act=back]")?.addEventListener("click", () => {
      if (idx > 0) step = ORDER[idx - 1]!;
      render();
    });
    root.querySelector("[data-act=next]")?.addEventListener("click", () => {
      if (idx === ORDER.length - 1) {
        uploaded = fieldPlaced = signed = countersigned = false;
        step = "upload";
      } else if (canAdvance()) {
        step = ORDER[idx + 1]!;
      }
      render();
    });
    root.querySelector("[data-act=upload]")?.addEventListener("click", () => {
      uploaded = true;
      render();
    });
    root.querySelector("[data-act=place]")?.addEventListener("click", () => {
      if (!uploaded) return;
      fieldPlaced = true;
      render();
    });
    root.querySelector("[data-act=sign]")?.addEventListener("click", () => {
      if (!fieldPlaced) return;
      signed = true;
      render();
    });
    root.querySelector("[data-act=countersign]")?.addEventListener("click", () => {
      if (!signed) return;
      countersigned = true;
      render();
    });
  };

  const canAdvance = (): boolean => {
    if (step === "upload") return uploaded;
    if (step === "place") return fieldPlaced;
    if (step === "sign") return signed;
    if (step === "countersign") return countersigned;
    return true;
  };

  const body = (): string => {
    if (step === "upload") {
      return `
        <div class="drop ${uploaded ? "is-in" : ""}">
          <p>${uploaded ? "Harbor MSA v2.pdf is on the envelope." : "Drop the MSA onto this envelope."}</p>
          <button type="button" class="primary" data-act="upload">${uploaded ? "Uploaded" : "Use Harbor MSA v2.pdf"}</button>
        </div>`;
    }
    if (step === "place") {
      return `
        <article class="page">
          <p class="page-copy">IN WITNESS WHEREOF the parties have executed this Agreement as of the Effective Date. Page 12 of 24.</p>
          <button type="button" class="sig-field ${fieldPlaced ? "is-on" : ""}" data-act="place">
            ${fieldPlaced ? "<strong>Avery Chen</strong><span>Harbor Legal · Signer</span>" : "Click to place signature field"}
          </button>
        </article>`;
    }
    if (step === "sign") {
      return `
        <div class="pad">
          <div class="who">Harbor Legal · Signer</div>
          <div class="ink ${signed ? "is-on" : ""}">Avery Chen</div>
          <button type="button" class="primary" data-act="sign" ${!fieldPlaced ? "disabled" : ""}>${signed ? "Signed 14 Oct 2026" : "Adopt signature"}</button>
        </div>`;
    }
    if (step === "countersign") {
      return `
        <div class="pads">
          <div class="pad"><div class="who">Avery Chen</div><div class="ink is-on">Avery Chen</div></div>
          <div class="pad">
            <div class="who">Northwind · Countersigner</div>
            <div class="ink ${countersigned ? "is-on" : ""}">Jordan Hale</div>
            <button type="button" class="primary" data-act="countersign" ${!signed ? "disabled" : ""}>${countersigned ? "Complete" : "Countersign"}</button>
          </div>
        </div>`;
    }
    const rows = countersigned ? EVENTS : EVENTS.slice(0, 2);
    return `
      <table class="trail">
        <thead><tr><th>Time (UTC)</th><th>Event</th><th>Actor</th></tr></thead>
        <tbody>${rows.map((e) => `<tr><td>${e.t}</td><td>${e.a}</td><td>${e.who}</td></tr>`).join("")}</tbody>
      </table>
      <p class="trail-note">${countersigned ? "Envelope complete. Trail is append-only in this fixture." : "Finish sign + countersign to fill the remaining rows."}</p>`;
  };

  render();
}
