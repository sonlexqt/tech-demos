import type { Ticket } from "../types";

export const TICKETS: Ticket[] = [
  {
    id: "signing-date",
    number: 1,
    title: "Signing-date field",
    request:
      "Add a signing-date field so the signer records the day they signed the envelope.",
    alreadyInRepo: [
      "lib/dates.ts → formatDate",
      "Envelope.signedOn?: string (ISO date)",
    ],
    neverCut: ["required", "reject a future date", "labelled control"],
    normal: {
      deps: ["react-datepicker", "date-fns-tz"],
      note: "Installed a calendar widget, then a timezone wrapper, then a context so every form can share locale.",
      files: [
        {
          path: "components/SigningDatePicker.tsx",
          code: `import DatePicker from "react-datepicker";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";
import "react-datepicker/dist/react-datepicker.css";
import { useMemo, useState } from "react";
import { DatePickerProvider, useDatePicker } from "./DatePickerContext";

type Props = {
  timeZone?: string;
  locale?: string;
  onChange: (iso: string) => void;
};

export function SigningDatePicker(props: Props) {
  return (
    <DatePickerProvider>
      <SigningDatePickerInner {...props} />
    </DatePickerProvider>
  );
}

function SigningDatePickerInner({
  timeZone,
  locale = "en-US",
  onChange,
}: Props) {
  const ctx = useDatePicker();
  const zone = timeZone ?? ctx.timeZone;
  const [value, setValue] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const today = useMemo(() => utcToZonedTime(new Date(), zone), [zone]);

  function handle(next: Date | null) {
    if (!next) return;
    onChange(zonedTimeToUtc(next, zone).toISOString());
    setValue(next);
    setOpen(false);
  }

  return (
    <div className="sdp-wrap">
      <button type="button" onClick={() => setOpen((o) => !o)}>
        {value ? value.toLocaleDateString(locale) : "Pick signing date"}
      </button>
      {open && (
        <DatePicker
          inline
          selected={value}
          onChange={handle}
          minDate={today}
          showMonthDropdown
          showYearDropdown
        />
      )}
    </div>
  );
}`,
        },
        {
          path: "components/DatePickerContext.tsx",
          code: `import { createContext, useContext, useMemo, useState } from "react";

type Ctx = {
  timeZone: string;
  setTimeZone: (z: string) => void;
};

const DatePickerContext = createContext<Ctx | null>(null);

export function DatePickerProvider({ children }: { children: React.ReactNode }) {
  const [timeZone, setTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const value = useMemo(() => ({ timeZone, setTimeZone }), [timeZone]);
  return (
    <DatePickerContext.Provider value={value}>
      {children}
    </DatePickerContext.Provider>
  );
}

export function useDatePicker() {
  const ctx = useContext(DatePickerContext);
  if (!ctx) throw new Error("DatePickerProvider missing");
  return ctx;
}`,
        },
      ],
    },
    ponytail: {
      deps: [],
      stopRung: 4,
      stopLabel: "Native platform feature",
      skipped: "react-datepicker, date-fns-tz, DatePickerContext",
      addWhen: "you need a locale the native picker cannot express",
      note: "Browser already ships a date control. formatDate stays for display.",
      files: [
        {
          path: "components/SigningDateField.tsx",
          code: `import { formatDate } from "../lib/dates";

export function SigningDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <label>
      Signing date
      <input
        type="date"
        required
        max={today}
        aria-label="Signing date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? <span>{formatDate(value)}</span> : null}
    </label>
  );
}`,
        },
      ],
    },
  },
  {
    id: "initials-color",
    number: 2,
    title: "Signer initials + color",
    request:
      "Let the signer set initials and pick the stroke color used on their mark.",
    alreadyInRepo: ["Signer.name", "no color helper yet"],
    neverCut: ["required initials", "max 4 characters", "contrast warning"],
    normal: {
      deps: ["react-colorful", "tinycolor2"],
      note: "Built an HSV wheel, hex/RGB fields, and a token store for 'brand colors later'.",
      files: [
        {
          path: "components/ColorWheel.tsx",
          code: `import { HexColorPicker } from "react-colorful";
import tinycolor from "tinycolor2";
import { useMemo, useState } from "react";

type Token = { name: string; hex: string };

export function ColorWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [tab, setTab] = useState<"wheel" | "hex" | "rgb">("wheel");
  const [tokens] = useState<Token[]>([
    { name: "Lumin", hex: "#6b4cff" },
    { name: "Ink", hex: "#14110d" },
  ]);
  const rgb = useMemo(() => tinycolor(value).toRgb(), [value]);

  return (
    <div className="wheel">
      <nav>
        <button onClick={() => setTab("wheel")}>Wheel</button>
        <button onClick={() => setTab("hex")}>Hex</button>
        <button onClick={() => setTab("rgb")}>RGB</button>
      </nav>
      {tab === "wheel" && <HexColorPicker color={value} onChange={onChange} />}
      {tab === "hex" && (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {tab === "rgb" && (
        <div>
          <input type="number" value={rgb.r} readOnly />
          <input type="number" value={rgb.g} readOnly />
          <input type="number" value={rgb.b} readOnly />
        </div>
      )}
      <ul>
        {tokens.map((t) => (
          <li key={t.name}>
            <button onClick={() => onChange(t.hex)}>{t.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        },
        {
          path: "components/InitialsMark.tsx",
          code: `import { ColorWheel } from "./ColorWheel";
import { useState } from "react";

export function InitialsMark() {
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState("#6b4cff");
  return (
    <div>
      <input
        placeholder="AL"
        value={initials}
        onChange={(e) => setInitials(e.target.value)}
      />
      <ColorWheel value={color} onChange={setColor} />
    </div>
  );
}`,
        },
      ],
    },
    ponytail: {
      deps: [],
      stopRung: 4,
      stopLabel: "Native platform feature",
      skipped: "react-colorful, tinycolor2, ColorWheel, token store",
      addWhen: "you need a palette that native color cannot express",
      note: "Native color input + a 4-char initials field. Contrast stays — a11y is not optional.",
      files: [
        {
          path: "components/InitialsMark.tsx",
          code: `function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function InitialsMark({
  initials,
  color,
  onChange,
}: {
  initials: string;
  color: string;
  onChange: (next: { initials: string; color: string }) => void;
}) {
  const low = luminance(color) < 0.28;
  return (
    <fieldset>
      <legend>Signer mark</legend>
      <label>
        Initials
        <input
          required
          maxLength={4}
          aria-label="Signer initials"
          value={initials}
          onChange={(e) => onChange({ initials: e.target.value, color })}
        />
      </label>
      <label>
        Color
        <input
          type="color"
          aria-label="Initials color"
          value={color}
          onChange={(e) => onChange({ initials, color: e.target.value })}
        />
      </label>
      {low ? <p role="status">Low contrast on white paper — pick a darker ink.</p> : null}
    </fieldset>
  );
}`,
        },
      ],
    },
  },
  {
    id: "reminders",
    number: 3,
    title: "Reminder schedule",
    request:
      "Remind unsigned recipients at 1, 3, and 7 days after the envelope is sent.",
    alreadyInRepo: [
      "lib/reminders.ts → scheduleReminders(envelopeId, days[])",
      "REMINDER_PRESETS.standard = [1, 3, 7]",
    ],
    neverCut: [],
    normal: {
      deps: ["croner"],
      note: "Invented a cron builder and a ReminderEngine, then mapped 1/3/7 onto cron strings.",
      files: [
        {
          path: "lib/ReminderEngine.ts",
          code: `import { Cron } from "croner";

export type ReminderJob = {
  id: string;
  cron: string;
  task: () => Promise<void>;
};

export class ReminderEngine {
  private jobs = new Map<string, Cron>();

  register(job: ReminderJob) {
    const cron = new Cron(job.cron, { timezone: "UTC" }, job.task);
    this.jobs.set(job.id, cron);
    return cron;
  }

  stop(id: string) {
    this.jobs.get(id)?.stop();
    this.jobs.delete(id);
  }
}

export function daysToCron(days: number[]) {
  return days.map((d) => \`0 9 */\${d} * *\`);
}`,
        },
        {
          path: "components/CronBuilder.tsx",
          code: `import { daysToCron, ReminderEngine } from "../lib/ReminderEngine";
import { useState } from "react";

const engine = new ReminderEngine();

export function CronBuilder({ envelopeId }: { envelopeId: string }) {
  const [days, setDays] = useState("1,3,7");
  const parsed = days.split(",").map(Number);

  function save() {
    daysToCron(parsed).forEach((cron, i) => {
      engine.register({
        id: \`\${envelopeId}-\${i}\`,
        cron,
        task: async () => fetch(\`/api/remind/\${envelopeId}\`),
      });
    });
  }

  return (
    <div>
      <label>
        Cron days
        <input value={days} onChange={(e) => setDays(e.target.value)} />
      </label>
      <pre>{daysToCron(parsed).join("\\n")}</pre>
      <button onClick={save}>Schedule</button>
    </div>
  );
}`,
        },
      ],
    },
    ponytail: {
      deps: [],
      stopRung: 2,
      stopLabel: "Already in this codebase",
      skipped: "croner, ReminderEngine, CronBuilder",
      addWhen: "you need a schedule the existing presets cannot express",
      note: "The ticket is the standard preset. Call the helper that already exists.",
      files: [
        {
          path: "pages/EnvelopeSettings.tsx",
          code: `import { REMINDER_PRESETS, scheduleReminders } from "../lib/reminders";

export function enableStandardReminders(envelopeId: string) {
  return scheduleReminders(envelopeId, REMINDER_PRESETS.standard);
}`,
        },
      ],
    },
  },
  {
    id: "cc-list",
    number: 4,
    title: "CC list",
    request:
      "Allow carbon-copy recipients who receive the completed envelope but do not sign.",
    alreadyInRepo: [
      'RecipientList already accepts role: "signer" | "approver" | "cc"',
      "lib/email.ts → isEmail (used at the trust boundary)",
    ],
    neverCut: ["reject non-emails before save"],
    normal: {
      deps: ["email-validator"],
      note: "New chip widget, RFC-shaped parser, and a second validator even though isEmail already sits on the save path.",
      files: [
        {
          path: "lib/Rfc5322.ts",
          code: `import emailValidator from "email-validator";

export function parseAddressList(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const angled = part.match(/<([^>]+)>/);
      return (angled ? angled[1] : part).toLowerCase();
    })
    .filter((addr) => emailValidator.validate(addr));
}`,
        },
        {
          path: "components/CcChipInput.tsx",
          code: `import { parseAddressList } from "../lib/Rfc5322";
import { useState } from "react";

export function CcChipInput({ onSave }: { onSave: (emails: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [chips, setChips] = useState<string[]>([]);

  function add() {
    const next = parseAddressList(draft);
    setChips([...new Set([...chips, ...next])]);
    setDraft("");
  }

  return (
    <div className="chips">
      <ul>
        {chips.map((c) => (
          <li key={c}>
            {c}
            <button onClick={() => setChips(chips.filter((x) => x !== c))}>x</button>
          </li>
        ))}
      </ul>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="cc@example.com"
      />
      <button onClick={add}>Add CC</button>
      <button onClick={() => onSave(chips)}>Save list</button>
    </div>
  );
}`,
        },
      ],
    },
    ponytail: {
      deps: [],
      stopRung: 2,
      stopLabel: "Already in this codebase",
      skipped: "email-validator, Rfc5322, CcChipInput",
      addWhen: "CC needs a different UX than every other recipient list",
      note: "RecipientList already has role=cc. isEmail already guards save. Flip the role.",
      files: [
        {
          path: "pages/EnvelopeRecipients.tsx",
          code: `import { RecipientList } from "../components/RecipientList";

export function EnvelopeRecipients({ envelopeId }: { envelopeId: string }) {
  return (
    <>
      <RecipientList envelopeId={envelopeId} role="signer" />
      <RecipientList envelopeId={envelopeId} role="cc" label="CC" />
    </>
  );
}`,
        },
      ],
    },
  },
  {
    id: "expiry",
    number: 5,
    title: "Expiry countdown",
    request: "Show how long until the envelope expires so senders chase late signers.",
    alreadyInRepo: ["Envelope.expiresAt: string (ISO) — stored, not rendered"],
    neverCut: ["aria-live status", "expired state"],
    normal: {
      deps: ["react-countdown", "moment-timezone"],
      note: "Flip-clock widget plus moment-timezone for a single remaining-days number.",
      files: [
        {
          path: "components/ExpiryFlipClock.tsx",
          code: `import Countdown from "react-countdown";
import moment from "moment-timezone";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ExpiryFlipClock({ expiresAt }: { expiresAt: string }) {
  const target = moment.tz(expiresAt, "UTC").toDate();
  return (
    <Countdown
      date={target}
      renderer={({ days, hours, minutes, seconds, completed }) =>
        completed ? (
          <strong>Expired</strong>
        ) : (
          <div className="flip">
            <span>{pad(days)}d</span>
            <span>{pad(hours)}h</span>
            <span>{pad(minutes)}m</span>
            <span>{pad(seconds)}s</span>
          </div>
        )
      }
    />
  );
}`,
        },
      ],
    },
    ponytail: {
      deps: [],
      stopRung: 3,
      stopLabel: "Stdlib does it",
      skipped: "react-countdown, moment-timezone, flip-clock markup",
      addWhen: "product asks for a ticking second display",
      note: "Intl.RelativeTimeFormat plus one day-delta. Expired is a real state, so it stays.",
      files: [
        {
          path: "components/ExpiryLabel.tsx",
          code: `const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function ExpiryLabel({ expiresAt }: { expiresAt: string }) {
  const days = Math.ceil((Date.parse(expiresAt) - Date.now()) / 86_400_000);
  const text = days < 0 ? "Expired" : rtf.format(days, "day");
  return <p aria-live="polite">Expires {text}</p>;
}`,
        },
      ],
    },
  },
];
