import type { TaskDef } from "./types";

const WORKSPACE = "68d417dcdeaecfae84872de8";

function hex(n: number, seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return (h + n).toString(16).padStart(8, "0") + (n * 7919).toString(16).padStart(8, "0");
}

function webhookNoise(seed: string, attempt: number) {
  return {
    delivery: {
      attempt,
      retry_count: attempt - 1,
      endpoint: "https://ops.lumin.example/hooks/sign",
      timeout_ms: 30_000,
      result: attempt === 1 ? "timeout" : "200",
      bytes_in: 4800 + attempt * 17,
      bytes_out: 0,
    },
    http: {
      "user-agent": "Lumin Sign API",
      "x-signature": hex(attempt, `${seed}-sig`),
      "x-request-id": `req_${hex(attempt, seed)}`,
      "cf-ray": `${hex(attempt + 9, seed)}-SJC`,
      "x-amzn-trace-id": `Root=1-${hex(attempt, seed)}`,
      tls: "TLSv1.3",
      ja3: hex(attempt + 3, `${seed}-ja3`),
      edge_pop: "sjc01",
      forwarded: "for=203.0.113.44;proto=https",
    },
    debug: {
      geoip: {
        ip: "203.0.113.44",
        city: "San Jose",
        region: "CA",
        asn: "AS13335",
        lat: 37.3382,
        lon: -121.8863,
      },
      raw_headers: {
        accept: "*/*",
        "accept-encoding": "gzip",
        "content-type": "application/json",
        "sec-ch-ua": `"Chromium";v="128"`,
      },
      stack: "WebhookIngress.handle (/srv/hooks/ingress.ts:88:11)",
      health: "ok",
      heartbeat: true,
      empty_probe: "",
    },
    cdn: { cache: "BYPASS", colo: "SJC", http_version: "h2" },
  };
}

function webhookEvent(opts: {
  seed: string;
  type: string;
  time: number;
  attempt?: number;
  request: Record<string, unknown>;
}): string {
  const attempt = opts.attempt ?? 1;
  const body = {
    event: {
      event_time: opts.time,
      event_type: opts.type,
      event_metadata: { workspace_id: WORKSPACE, ingress_id: hex(attempt, opts.seed) },
    },
    signature_request: opts.request,
    details_url: `https://sign.luminpdf.com/auth?mode=view-contract&token=${hex(1, opts.seed)}`,
    ...webhookNoise(opts.seed, attempt),
  };
  return JSON.stringify(body, null, 2);
}

function noisyLog(lines: string[], extras = 18): string {
  const out: string[] = [];
  let t = Date.parse("2026-09-28T14:02:00.000Z");
  for (let i = 0; i < extras; i++) {
    t += 41;
    out.push(
      `${new Date(t).toISOString()} DEBUG webhook-ingress recv bytes=${4100 + i} edge=sjc01 ja3=ok`,
    );
    out.push(`${new Date(t + 2).toISOString()} DEBUG hmac ok tls1.3 health=ok heartbeat=1`);
    if (i % 3 === 0) {
      out.push(`${new Date(t + 3).toISOString()} TRACE edge_pop=sjc01 bytes_in=${4000 + i} ping`);
    }
  }
  for (const line of lines) {
    t += 80;
    out.push(line.includes("T") && line.includes("Z ") ? line : `${new Date(t).toISOString()} ${line}`);
  }
  for (let i = 0; i < 8; i++) {
    t += 20;
    out.push(`${new Date(t).toISOString()} DEBUG hmac ok tls1.3 health=ok heartbeat=1`);
  }
  return out.join("\n");
}

const declineRequest = {
  signature_request_id: "68f1a0c3e7d24b91a4c02e11",
  envelope_id: "ENV-MSA-7F2C91",
  title: "Master Service Agreement — Northwind × Harbor",
  created_at: 1758812378277,
  updated_at: 1759064400122,
  expires_at: 1827510980694,
  status: "REJECTED",
  signing_type: "ORDER",
  document: "Northwind_MSA_v4.pdf",
  signers: [
    {
      name: "Owen Blake",
      email: "owen.blake@harbor.example",
      status: "APPROVED",
      is_approved: true,
      group: 1,
      signed_at: 1758900000000,
    },
    {
      name: "Priya Raman",
      email: "priya.raman@northwind.example",
      status: "REJECTED",
      is_approved: false,
      group: 2,
      declined_at: 1759064400122,
      decline_reason:
        "Clause 8.4 indemnity is unlimited and one-sided; cannot accept without a cap equal to 12 months of fees.",
    },
  ],
};

const declineInput = [
  noisyLog([
    "INFO audit envelope=ENV-MSA-7F2C91 action=created actor=Owen Blake",
    "INFO audit envelope=ENV-MSA-7F2C91 action=sent actor=system",
    "INFO audit envelope=ENV-MSA-7F2C91 action=viewed actor=Owen Blake",
    "INFO audit envelope=ENV-MSA-7F2C91 action=signed actor=Owen Blake",
    "INFO audit envelope=ENV-MSA-7F2C91 action=viewed actor=Priya Raman",
    "WARN audit envelope=ENV-MSA-7F2C91 action=declined actor=Priya Raman reason=\"Clause 8.4 indemnity is unlimited and one-sided; cannot accept without a cap equal to 12 months of fees.\"",
    "INFO webhook-consumer event=signature_request_declined envelope=ENV-MSA-7F2C91 status=REJECTED",
  ]),
  "",
  webhookEvent({
    seed: "msa-created",
    type: "signature_request_created",
    time: 1758812378277,
    request: { ...declineRequest, status: "WAITING_FOR_OTHERS", updated_at: 1758812378277 },
  }),
  "",
  webhookEvent({
    seed: "msa-signed-owen",
    type: "signature_request_signed",
    time: 1758900000000,
    request: { ...declineRequest, status: "WAITING_FOR_OTHERS", updated_at: 1758900000000 },
  }),
  "",
  webhookEvent({
    seed: "msa-decline-timeout",
    type: "signature_request_declined",
    time: 1759064400122,
    attempt: 1,
    request: declineRequest,
  }),
  "",
  webhookEvent({
    seed: "msa-decline-retry",
    type: "signature_request_declined",
    time: 1759064400122,
    attempt: 2,
    request: declineRequest,
  }),
].join("\n");

const ndaRequest = {
  signature_request_id: "68e9bb11c0aa4410b77d3c02",
  envelope_id: "ENV-NDA-A19E04",
  title: "Mutual NDA — Harbor Labs × Northwind",
  created_at: 1758600000000,
  updated_at: 1758724800000,
  expires_at: 1827510980694,
  status: "APPROVED",
  signing_type: "ORDER",
  document: "Mutual_NDA_Harbor_Northwind.pdf",
  signers: [
    {
      name: "Marcus Chen",
      email: "marcus.chen@harbor.example",
      status: "APPROVED",
      is_approved: true,
      group: 1,
      viewed_at: 1758612000000,
      signed_at: 1758615600000,
    },
    {
      name: "Elena Voss",
      email: "elena.voss@northwind.example",
      status: "APPROVED",
      is_approved: true,
      group: 2,
      viewed_at: 1758720000000,
      signed_at: 1758724800000,
    },
  ],
};

const auditInput = [
  noisyLog(
    [
      "INFO audit envelope=ENV-NDA-A19E04 action=created actor=Marcus Chen document=Mutual_NDA_Harbor_Northwind.pdf",
      "INFO audit envelope=ENV-NDA-A19E04 action=sent actor=system recipients=2",
      "INFO audit envelope=ENV-NDA-A19E04 action=viewed actor=Marcus Chen",
      "INFO audit envelope=ENV-NDA-A19E04 action=signed actor=Marcus Chen",
      "INFO audit envelope=ENV-NDA-A19E04 action=reminder actor=system target=Elena Voss",
      "INFO audit envelope=ENV-NDA-A19E04 action=viewed actor=Elena Voss",
      "INFO audit envelope=ENV-NDA-A19E04 action=signed actor=Elena Voss",
      "INFO audit envelope=ENV-NDA-A19E04 action=completed status=APPROVED",
      "INFO webhook-consumer event=signature_request_approved envelope=ENV-NDA-A19E04",
    ],
    22,
  ),
  "",
  webhookEvent({
    seed: "nda-created",
    type: "signature_request_created",
    time: 1758600000000,
    request: { ...ndaRequest, status: "WAITING_FOR_OTHERS", updated_at: 1758600000000 },
  }),
  "",
  webhookEvent({
    seed: "nda-signed-marcus",
    type: "signature_request_signed",
    time: 1758615600000,
    request: { ...ndaRequest, status: "WAITING_FOR_OTHERS", updated_at: 1758615600000 },
  }),
  "",
  webhookEvent({
    seed: "nda-viewed-elena",
    type: "signature_request_viewed",
    time: 1758720000000,
    request: { ...ndaRequest, status: "WAITING_FOR_OTHERS", updated_at: 1758720000000 },
  }),
  "",
  webhookEvent({
    seed: "nda-approved",
    type: "signature_request_approved",
    time: 1758724800000,
    request: ndaRequest,
  }),
  "",
  webhookEvent({
    seed: "nda-downloadable",
    type: "signature_request_downloadable",
    time: 1758724900000,
    request: ndaRequest,
  }),
].join("\n");

function stalledRequest(partial: Record<string, unknown>, status: string) {
  return {
    created_at: 1758000000000,
    updated_at: 1758800000000,
    expires_at: 1827510980694,
    status,
    signing_type: "ORDER",
    ...partial,
  };
}

const stalledInput = [
  noisyLog(
    [
      "INFO queue scan workspace=harbor-ops stalled_threshold_days=5",
      "WARN stall envelope=ENV-SOW-33B1C8 title=\"SOW Addendum — Q4 implementation\" signer=Jordan Hale email=jordan.hale@northwind.example days_stalled=9 last_action=viewed reminder_count=1",
      "WARN stall envelope=ENV-OFFER-91D0AA title=\"Offer letter — Staff engineer\" signer=Mei Tan email=mei.tan@northwind.example days_stalled=14 last_action=sent reminder_count=0",
      "WARN stall envelope=ENV-DPA-C04E77 title=\"Data Processing Addendum\" waiting_on=Dana Okonkwo email=dana.okonkwo@northwind.example days_stalled=6 last_action=signed_by_Alex_Ruiz reminder_count=2",
      "INFO reminder-planner next_window=2026-10-06T15:00:00Z timezone=America/Los_Angeles",
    ],
    16,
  ),
  "",
  webhookEvent({
    seed: "sow",
    type: "signature_request_viewed",
    time: 1758300000000,
    request: stalledRequest(
      {
        signature_request_id: "68d9aa01bb22441090ee1001",
        envelope_id: "ENV-SOW-33B1C8",
        title: "SOW Addendum — Q4 implementation",
        document: "SOW_Addendum_Q4.pdf",
        last_reminder_at: 1758500000000,
        reminder_count: 1,
        days_stalled: 9,
        signers: [
          {
            name: "Jordan Hale",
            email: "jordan.hale@northwind.example",
            status: "NEED_TO_SIGN",
            is_approved: false,
            viewed_at: 1758300000000,
          },
        ],
      },
      "WAITING_FOR_OTHERS",
    ),
  }),
  "",
  webhookEvent({
    seed: "offer",
    type: "signature_request_created",
    time: 1757600000000,
    request: stalledRequest(
      {
        signature_request_id: "68d9aa01bb22441090ee1002",
        envelope_id: "ENV-OFFER-91D0AA",
        title: "Offer letter — Staff engineer",
        document: "Offer_Mei_Tan.pdf",
        reminder_count: 0,
        days_stalled: 14,
        sent_at: 1757600000000,
        signers: [
          {
            name: "Mei Tan",
            email: "mei.tan@northwind.example",
            status: "NEED_TO_SIGN",
            is_approved: false,
          },
        ],
      },
      "WAITING_FOR_OTHERS",
    ),
  }),
  "",
  webhookEvent({
    seed: "dpa",
    type: "signature_request_signed",
    time: 1758400000000,
    request: stalledRequest(
      {
        signature_request_id: "68d9aa01bb22441090ee1003",
        envelope_id: "ENV-DPA-C04E77",
        title: "Data Processing Addendum",
        document: "DPA_Northwind.pdf",
        last_reminder_at: 1758700000000,
        reminder_count: 2,
        days_stalled: 6,
        signers: [
          {
            name: "Alex Ruiz",
            email: "alex.ruiz@harbor.example",
            status: "APPROVED",
            is_approved: true,
            signed_at: 1758400000000,
            group: 1,
          },
          {
            name: "Dana Okonkwo",
            email: "dana.okonkwo@northwind.example",
            status: "NEED_TO_SIGN",
            is_approved: false,
            group: 2,
          },
        ],
      },
      "WAITING_FOR_OTHERS",
    ),
  }),
].join("\n");

export const TASKS: TaskDef[] = [
  {
    id: "decline-msa",
    title: "Why did the signer decline the MSA?",
    blurb: "One declined envelope buried in retries, health checks, and HMAC noise.",
    question:
      "Why did the signer decline the MSA? Name the signer, the envelope ID, and quote the decline reason.",
    rawInput: declineInput,
    facts: [
      { id: "signer", label: "Signer name", needles: ["Priya Raman"] },
      { id: "envelope", label: "Envelope ID", needles: ["ENV-MSA-7F2C91"] },
      {
        id: "reason",
        label: "Decline reason",
        needles: ["Clause 8.4", "unlimited", "12 months of fees"],
      },
    ],
    answers: {
      normal: `Sure — happy to walk through this.

I pulled the Lumin Sign webhook dump plus the audit trail for the Master Service Agreement. There is a fair amount of delivery noise (a timed-out first attempt, then a retry, plus health/heartbeat lines), but the material event is clear.

Owen Blake (owen.blake@harbor.example) signed first. The request then sat with the second signer.

Priya Raman (priya.raman@northwind.example) opened the document and declined it. Envelope ID ENV-MSA-7F2C91 flipped to REJECTED. The decline_reason on the signature_request_declined payload is:

"Clause 8.4 indemnity is unlimited and one-sided; cannot accept without a cap equal to 12 months of fees."

So this is a legal-terms rejection, not a wrong-recipient or expired-link problem. Next step would be to send a revised MSA with a 12-month fee cap on clause 8.4 and reopen the envelope.

Hope this helps — let me know if you want me to draft the reminder to counsel.`,
      caveman: `Priya Raman declined ENV-MSA-7F2C91. Status REJECTED.
Reason: "Clause 8.4 indemnity is unlimited and one-sided; cannot accept without a cap equal to 12 months of fees."
Owen Blake had already signed.
Legal terms, not delivery failure.
Revise clause 8.4 with a 12-month fee cap, then resend.`,
    },
  },
  {
    id: "audit-trail",
    title: "Summarize this audit trail",
    blurb: "A completed NDA, plus downloadable + viewed events wrapped in edge-pop debug.",
    question:
      "Summarize this audit trail. Include both signer names, the envelope ID, and the final status.",
    rawInput: auditInput,
    facts: [
      { id: "signer-a", label: "Signer A", needles: ["Marcus Chen"] },
      { id: "signer-b", label: "Signer B", needles: ["Elena Voss"] },
      { id: "envelope", label: "Envelope ID", needles: ["ENV-NDA-A19E04"] },
    ],
    answers: {
      normal: `Happy to summarize this one.

Envelope ENV-NDA-A19E04 is the Mutual NDA — Harbor Labs × Northwind (Mutual_NDA_Harbor_Northwind.pdf). Two signers, sequential (ORDER).

Timeline from the audit log:

1. Marcus Chen created the request and it was sent to both recipients.
2. Marcus Chen viewed, then signed. The webhook is signature_request_signed; status stayed WAITING_FOR_OTHERS.
3. The system sent a reminder to Elena Voss.
4. Elena Voss viewed, then signed.
5. Lumin emitted signature_request_approved and later signature_request_downloadable.

Final status is APPROVED. Both Marcus Chen and Elena Voss are APPROVED / is_approved true. Certificate and signed PDF are downloadable. There is no decline event on this envelope.

I can pull the file URL next if you want — happy to help with that too.`,
      caveman: `ENV-NDA-A19E04 Mutual NDA completed. Status APPROVED.
Marcus Chen created, viewed, signed.
System reminded Elena Voss.
Elena Voss viewed, signed.
signature_request_approved then signature_request_downloadable.
No decline.`,
    },
  },
  {
    id: "stalled-reminders",
    title: "Plan reminders for the stalled envelopes",
    blurb: "Three open requests: viewed-not-signed, never-opened, waiting on countersign.",
    question:
      "Plan reminders for the stalled envelopes. Name each envelope ID, who is blocking, and what to send.",
    rawInput: stalledInput,
    facts: [
      { id: "sow", label: "SOW envelope", needles: ["ENV-SOW-33B1C8"] },
      { id: "offer", label: "Offer envelope", needles: ["ENV-OFFER-91D0AA"] },
      { id: "dpa", label: "DPA envelope", needles: ["ENV-DPA-C04E77"] },
      { id: "jordan", label: "SOW signer", needles: ["Jordan Hale"] },
      { id: "mei", label: "Offer signer", needles: ["Mei Tan"] },
      { id: "dana", label: "DPA waiter", needles: ["Dana Okonkwo"] },
    ],
    answers: {
      normal: `Of course — here is a reminder plan based on the stalled-envelope scan (threshold 5 days). Three requests are still WAITING_FOR_OTHERS.

1) ENV-SOW-33B1C8 — SOW Addendum — Q4 implementation
Jordan Hale (jordan.hale@northwind.example) viewed the packet but has not signed. days_stalled=9, reminder_count=1. Send a short nudge that references the Q4 start date and offers a 15-minute walkthrough. Do not resend the whole file.

2) ENV-OFFER-91D0AA — Offer letter — Staff engineer
Mei Tan (mei.tan@northwind.example) never viewed it. days_stalled=14, reminder_count=0. Highest urgency: recruiting clock. Send a first reminder with the signing link in the first sentence, plus a note to check spam. If still unopened in 48 hours, escalate to the hiring manager.

3) ENV-DPA-C04E77 — Data Processing Addendum
Alex Ruiz already signed. Waiting on Dana Okonkwo (dana.okonkwo@northwind.example). days_stalled=6, reminder_count=2. This is a countersignature stall. Send a targeted reminder to Dana only; mention that Harbor already signed so the block is on Northwind legal.

Suggested send window: 2026-10-06T15:00:00Z America/Los_Angeles. I would not blast all three with the same template — the never-opened offer and the viewed SOW need different copy.

Let me know if you want me to draft the three emails!`,
      caveman: `Three stalled. Status WAITING_FOR_OTHERS. Send 2026-10-06T15:00:00Z PT. Different copy each.

ENV-SOW-33B1C8: Jordan Hale viewed, not signed. 9 days, 1 reminder. Nudge + walkthrough offer. Do not resend file.

ENV-OFFER-91D0AA: Mei Tan never viewed. 14 days, 0 reminders. First reminder, link first, spam note. Escalate in 48h.

ENV-DPA-C04E77: Alex Ruiz signed. Waiting on Dana Okonkwo. 6 days, 2 reminders. Remind Dana only. Harbor already signed.`,
    },
  },
];

export function getTask(id: string): TaskDef | undefined {
  return TASKS.find((task) => task.id === id);
}
