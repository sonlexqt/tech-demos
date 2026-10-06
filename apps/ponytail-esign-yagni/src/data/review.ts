import type { ReviewFinding, ReviewResult } from "../types";

export const OVERBUILT_TITLE = "PR-1844 · Envelope insights + signing date";

export const OVERBUILT_BLURB =
  "A Normal-agent change that bolted a date-picker factory, moment, a one-implementation repository, an unused color wheel, and a retry wrapper onto a one-field ticket.";

export const OVERBUILT_FILES: { path: string; code: string }[] = [
  {
    path: "lib/DatePickerFactory.ts",
    code: `export interface DatePickerAdapter {
  mount(el: HTMLElement): void;
  getValue(): Date | null;
}

export class FlatpickrAdapter implements DatePickerAdapter {
  mount(el: HTMLElement) {
    el.dataset.picker = "flatpickr";
  }
  getValue() {
    return null;
  }
}

export class NativeAdapter implements DatePickerAdapter {
  mount(el: HTMLElement) {
    el.innerHTML = '<input type="date" />';
  }
  getValue() {
    return null;
  }
}

export function createDatePicker(kind: "flatpickr" | "native"): DatePickerAdapter {
  return kind === "native" ? new NativeAdapter() : new FlatpickrAdapter();
}`,
  },
  {
    path: "lib/EnvelopeRepository.ts",
    code: `export abstract class AbstractEnvelopeRepository {
  abstract get(id: string): Promise<{ id: string; expiresAt: string }>;
}

export class MemoryEnvelopeRepository extends AbstractEnvelopeRepository {
  constructor(private rows: { id: string; expiresAt: string }[]) {
    super();
  }
  async get(id: string) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new Error("missing");
    return row;
  }
}`,
  },
  {
    path: "lib/formatExpiry.ts",
    code: `import moment from "moment";

export function formatExpiry(iso: string) {
  return moment(iso).format("MMM D, YYYY");
}

export function withRetry<T>(fn: () => T, attempts = 3): T {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (err) {
      last = err;
    }
  }
  throw last;
}

export function formatExpirySafe(iso: string) {
  return withRetry(() => formatExpiry(iso));
}`,
  },
  {
    path: "components/UnusedColorWheel.tsx",
    code: `export function UnusedColorWheel() {
  return <div className="wheel" data-todo="wire up later" />;
}`,
  },
  {
    path: "lib/EmailValidator.ts",
    code: `export class EmailValidator {
  static isValid(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const at = trimmed.indexOf("@");
    if (at <= 0) return false;
    const host = trimmed.slice(at + 1);
    return host.includes(".");
  }
  static assert(value: string) {
    if (!this.isValid(value)) throw new Error("invalid email");
  }
}`,
  },
];

export const FIXTURE_FINDINGS: ReviewFinding[] = [
  {
    location: "DatePickerFactory.ts:L1-L32",
    tag: "native",
    text: "Adapter factory for a date field. <input type=\"date\">, 1 line.",
  },
  {
    location: "EnvelopeRepository.ts:L1-L16",
    tag: "yagni",
    text: "AbstractRepository with one implementation. Inline Memory get() until a second store exists.",
  },
  {
    location: "formatExpiry.ts:L1-L4",
    tag: "native",
    text: "moment.js imported for one format call. Intl.DateTimeFormat, 0 deps.",
  },
  {
    location: "formatExpiry.ts:L6-L20",
    tag: "delete",
    text: "Retry wrapper around a pure local format. Nothing replaces it.",
  },
  {
    location: "UnusedColorWheel.tsx:L1-L3",
    tag: "delete",
    text: "Dead wheel stub marked 'later'. Replacement: nothing.",
  },
  {
    location: "EmailValidator.ts:L1-L16",
    tag: "stdlib",
    text: "16-line validator class. isEmail() already in lib/email.ts; or includes(\"@\"), 1 line.",
  },
];

export const FIXTURE_REVIEW: ReviewResult = {
  source: "fixture",
  provider: null,
  findings: FIXTURE_FINDINGS,
  netLines: -78,
  leanAlready: false,
};

export const REVIEW_SYSTEM_PROMPT = `Review diffs for unnecessary complexity. One line per finding: location, what to cut, what replaces it. The diff's best outcome is getting shorter.

Format: LOCATION: tag: text

Tags:
- delete: dead code, unused flexibility, speculative feature. Replacement: nothing.
- stdlib: hand-rolled thing the standard library ships. Name the function.
- native: dependency or code doing what the platform already does. Name the feature.
- yagni: abstraction with one implementation, config nobody sets, layer with one caller.
- shrink: same logic, fewer lines. Show the shorter form.

Scope: over-engineering and complexity only. Do not apply fixes, only list them.
End with: net: -N lines possible.
If nothing to cut, say: Lean already. Ship.`;
