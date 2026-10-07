export const svg = {
  pen: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" stroke="currentColor" stroke-width="1.7"/></svg>`,
  doc: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.7"/><path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  shield: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3z" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 12.2l2.3 2.3 4.7-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  clock: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.2L15 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  user: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.5" r="3.1" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 18.5c1.3-2.6 3.6-4 6.5-4s5.2 1.4 6.5 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  check: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  alert: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.5l8.5 15h-17L12 4.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4.2M12 16.8v.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
};

export function icon(kind: keyof typeof svg, emoji: string): string {
  return `${svg[kind]}<span class="icon-emoji" aria-hidden="true">${emoji}</span>`;
}
