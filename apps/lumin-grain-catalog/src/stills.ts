const stills: Record<string, (accent: string) => string> = {
  sign: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-sign" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#14201e"/>
          <stop offset="100%" stop-color="#0a1211"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-sign)"/>
      <rect x="58" y="72" width="196" height="268" rx="3" fill="#1b2c29" stroke="${accent}" stroke-opacity="0.35"/>
      <rect x="86" y="118" width="196" height="268" rx="3" fill="#203632" stroke="${accent}" stroke-opacity="0.55"/>
      <circle cx="248" cy="340" r="34" fill="none" stroke="${accent}" stroke-width="1.4"/>
      <circle cx="248" cy="340" r="18" fill="none" stroke="${accent}" stroke-width="0.7" stroke-dasharray="3 4"/>
      <path d="M236 340c8 10 16 10 24 0" fill="none" stroke="${accent}" stroke-width="1.2"/>
    </svg>
  `,
  msa: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-msa" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a1712"/>
          <stop offset="100%" stop-color="#0c0b09"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-msa)"/>
      <rect x="48" y="96" width="148" height="210" fill="#2a2418" stroke="${accent}" stroke-opacity="0.4"/>
      <rect x="164" y="164" width="148" height="210" fill="#1f1b14" stroke="${accent}" stroke-opacity="0.7"/>
      <circle cx="196" cy="340" r="22" fill="none" stroke="${accent}"/>
      <circle cx="164" cy="196" r="22" fill="none" stroke="${accent}" stroke-opacity="0.5"/>
    </svg>
  `,
  redact: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-redact" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1c1414"/>
          <stop offset="100%" stop-color="#0b0808"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-redact)"/>
      <rect x="54" y="88" width="252" height="18" fill="${accent}" opacity="0.18"/>
      <rect x="54" y="128" width="188" height="18" fill="${accent}" opacity="0.72"/>
      <rect x="54" y="168" width="252" height="18" fill="${accent}" opacity="0.18"/>
      <rect x="54" y="208" width="220" height="18" fill="${accent}" opacity="0.72"/>
      <rect x="54" y="248" width="140" height="18" fill="${accent}" opacity="0.18"/>
      <rect x="54" y="288" width="252" height="18" fill="${accent}" opacity="0.72"/>
      <rect x="54" y="328" width="96" height="18" fill="${accent}" opacity="0.18"/>
    </svg>
  `,
  id: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="g-id" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stop-color="#16302e"/>
          <stop offset="100%" stop-color="#081110"/>
        </radialGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-id)"/>
      <circle cx="180" cy="210" r="108" fill="none" stroke="${accent}" stroke-opacity="0.25"/>
      <circle cx="180" cy="210" r="72" fill="none" stroke="${accent}" stroke-opacity="0.5"/>
      <circle cx="180" cy="210" r="36" fill="none" stroke="${accent}"/>
      <rect x="126" y="330" width="108" height="8" fill="${accent}" opacity="0.55"/>
      <rect x="148" y="350" width="64" height="4" fill="${accent}" opacity="0.28"/>
    </svg>
  `,
  clause: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-clause" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#12161c"/>
          <stop offset="100%" stop-color="#080a0e"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-clause)"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => {
          const y = 90 + i * 38;
          const w = i === 3 ? 248 : 180 + ((i * 37) % 70);
          const o = i === 3 ? 0.85 : 0.22;
          return `<rect x="52" y="${y}" width="${w}" height="8" fill="${accent}" opacity="${o}"/>`;
        })
        .join("")}
    </svg>
  `,
  markup: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-markup" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#161410"/>
          <stop offset="100%" stop-color="#0a0907"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-markup)"/>
      <rect x="64" y="70" width="176" height="250" fill="#221e16" stroke="${accent}" stroke-opacity="0.3"/>
      <rect x="200" y="168" width="96" height="54" rx="4" fill="#2c261b" stroke="${accent}"/>
      <rect x="212" y="182" width="56" height="6" fill="${accent}" opacity="0.7"/>
      <rect x="212" y="196" width="72" height="4" fill="${accent}" opacity="0.3"/>
      <rect x="176" y="280" width="88" height="46" rx="4" fill="#2c261b" stroke="${accent}" stroke-opacity="0.5"/>
    </svg>
  `,
  audit: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-audit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#141816"/>
          <stop offset="100%" stop-color="#090b0a"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-audit)"/>
      <line x1="120" y1="70" x2="120" y2="410" stroke="${accent}" stroke-opacity="0.35"/>
      ${[0, 1, 2, 3, 4, 5]
        .map((i) => {
          const y = 92 + i * 52;
          return `<circle cx="120" cy="${y}" r="5" fill="${accent}"/><rect x="144" y="${y - 4}" width="${90 + i * 12}" height="8" fill="${accent}" opacity="${i === 4 ? 0.8 : 0.28}"/>`;
        })
        .join("")}
    </svg>
  `,
  form: (accent) => `
    <svg class="still-svg" viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-form" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#151c1b"/>
          <stop offset="100%" stop-color="#0a0e0d"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g-form)"/>
      ${[0, 1, 2, 3]
        .map((row) =>
          [0, 1]
            .map((col) => {
              const x = 52 + col * 134;
              const y = 86 + row * 82;
              return `<rect x="${x}" y="${y}" width="118" height="58" fill="none" stroke="${accent}" stroke-opacity="${row === 1 && col === 0 ? 0.9 : 0.28}"/><rect x="${x + 10}" y="${y + 14}" width="64" height="5" fill="${accent}" opacity="0.25"/>`;
            })
            .join(""),
        )
        .join("")}
    </svg>
  `,
};

const accents: Record<string, string> = {
  sign: "#7ec9bb",
  msa: "#d4b27a",
  redact: "#c9897a",
  id: "#7ec9bb",
  clause: "#9aa7c2",
  markup: "#d4b27a",
  audit: "#8fbea8",
  form: "#7ec9bb",
};

export function renderStill(kind: string): string {
  const draw = stills[kind] ?? stills.sign;
  return draw(accents[kind] ?? "#7ec9bb");
}
