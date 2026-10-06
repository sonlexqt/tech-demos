/** What the fixture Lumin Sign envelope app already ships. */
export const CODEBASE = {
  product: "Lumin Sign",
  envelope: "MSA-1042 · Mutual NDA · Acme × Harbor",
  signer: "Ada Lovelace",
  files: [
    {
      path: "lib/dates.ts",
      exports: ["formatDate"],
      blurb: "ISO → locale date. No picker.",
    },
    {
      path: "lib/reminders.ts",
      exports: ["scheduleReminders", "REMINDER_PRESETS"],
      blurb: "Days-after-send scheduler. standard = [1, 3, 7].",
    },
    {
      path: "components/RecipientList.tsx",
      exports: ["RecipientList"],
      blurb: 'Already accepts role: "signer" | "approver" | "cc".',
    },
    {
      path: "lib/email.ts",
      exports: ["isEmail"],
      blurb: "Trust-boundary check used by RecipientList.",
    },
    {
      path: "types/envelope.ts",
      exports: ["Envelope", "expiresAt", "signedOn"],
      blurb: "expiresAt is stored; nothing renders a countdown yet.",
    },
  ],
};
