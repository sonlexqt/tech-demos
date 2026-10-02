export type ScenarioStep = {
  caption: string;
  node?: string;
  message?: string;
  pathNodes: string[];
  pathRelations: string[];
  pathMessages: string[];
  pathParticipants: string[];
};

export type Scenario = {
  id: "complete" | "decline";
  title: string;
  blurb: string;
  steps: ScenarioStep[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "complete",
    title: "Send → view → sign order → complete",
    blurb: "Acme signs first; Vendor is unlocked; the MSA seals.",
    steps: [
      {
        caption: "Acme contract ops drafts the MSA (Acme × Northwind) in Lumin Sign.",
        node: "draft",
        message: "open-composer",
        pathNodes: ["draft"],
        pathRelations: [],
        pathMessages: ["open-composer"],
        pathParticipants: ["sender", "api"],
      },
      {
        caption: "Signature fields + sequential order: Acme GC first, Vendor counsel countersigns.",
        node: "fields",
        message: "place-fields",
        pathNodes: ["draft", "fields"],
        pathRelations: ["draft-fields"],
        pathMessages: ["open-composer", "place-fields"],
        pathParticipants: ["sender", "api"],
      },
      {
        caption: "Send creates the envelope and notifies signer #1 only.",
        node: "send",
        message: "create-envelope",
        pathNodes: ["draft", "fields", "send"],
        pathRelations: ["draft-fields", "fields-send"],
        pathMessages: ["open-composer", "place-fields", "create-envelope", "notify-acme"],
        pathParticipants: ["sender", "api", "mail"],
      },
      {
        caption: "Acme GC opens the packet and reviews the MSA + fields.",
        node: "viewAcme",
        message: "acme-opens",
        pathNodes: ["draft", "fields", "send", "viewAcme"],
        pathRelations: ["draft-fields", "fields-send", "send-view"],
        pathMessages: ["create-envelope", "notify-acme", "acme-opens", "packet-acme"],
        pathParticipants: ["sender", "api", "mail", "acme"],
      },
      {
        caption: "Order 1 binds: Acme applies /s/ + consent. Vendor is still locked.",
        node: "signAcme",
        message: "acme-signs",
        pathNodes: ["draft", "fields", "send", "viewAcme", "signAcme"],
        pathRelations: ["draft-fields", "fields-send", "send-view", "view-sign-acme"],
        pathMessages: ["acme-opens", "packet-acme", "acme-signs", "record-acme"],
        pathParticipants: ["acme", "api", "store"],
      },
      {
        caption: "Unlock #2 — an authored edge, not a guessed hop — notifies Vendor counsel.",
        node: "viewVendor",
        message: "notify-vendor",
        pathNodes: ["draft", "fields", "send", "viewAcme", "signAcme", "viewVendor"],
        pathRelations: ["draft-fields", "fields-send", "send-view", "view-sign-acme", "unlock-vendor"],
        pathMessages: ["acme-signs", "record-acme", "notify-vendor"],
        pathParticipants: ["acme", "api", "mail", "store"],
      },
      {
        caption: "Vendor countersigns. Both binding marks now exist on the packet.",
        node: "signVendor",
        message: "vendor-signs",
        pathNodes: ["draft", "fields", "send", "viewAcme", "signAcme", "viewVendor", "signVendor"],
        pathRelations: [
          "draft-fields",
          "fields-send",
          "send-view",
          "view-sign-acme",
          "unlock-vendor",
          "view-sign-vendor",
        ],
        pathMessages: ["notify-vendor", "vendor-opens", "packet-vendor", "vendor-signs"],
        pathParticipants: ["api", "mail", "vendor"],
      },
      {
        caption: "Completed MSA: sealed PDF + certificate of completion. Terminal node.",
        node: "complete",
        message: "status-done",
        pathNodes: ["draft", "fields", "send", "viewAcme", "signAcme", "viewVendor", "signVendor", "complete"],
        pathRelations: [
          "draft-fields",
          "fields-send",
          "send-view",
          "view-sign-acme",
          "unlock-vendor",
          "view-sign-vendor",
          "vendor-complete",
        ],
        pathMessages: ["vendor-signs", "record-vendor", "seal-complete", "status-done"],
        pathParticipants: ["vendor", "api", "store", "sender"],
      },
    ],
  },
  {
    id: "decline",
    title: "Decline → recover",
    blurb: "Acme declines after view; sender revises fields and the request can complete again.",
    steps: [
      {
        caption: "Same send: envelope exists, Acme is notified, Vendor is not.",
        node: "send",
        message: "notify-acme",
        pathNodes: ["draft", "fields", "send"],
        pathRelations: ["draft-fields", "fields-send"],
        pathMessages: ["create-envelope", "notify-acme"],
        pathParticipants: ["sender", "api", "mail"],
      },
      {
        caption: "Acme views the packet — the authored fork: sign or decline.",
        node: "viewAcme",
        message: "packet-acme",
        pathNodes: ["draft", "fields", "send", "viewAcme"],
        pathRelations: ["draft-fields", "fields-send", "send-view"],
        pathMessages: ["notify-acme", "acme-opens", "packet-acme"],
        pathParticipants: ["api", "mail", "acme"],
      },
      {
        caption: "Decline is an error-role edge. No route is invented to Vendor.",
        node: "decline",
        message: "acme-declines",
        pathNodes: ["draft", "fields", "send", "viewAcme", "decline"],
        pathRelations: ["draft-fields", "fields-send", "send-view", "view-decline"],
        pathMessages: ["packet-acme", "acme-declines", "record-decline", "notify-sender"],
        pathParticipants: ["acme", "api", "store", "mail"],
      },
      {
        caption: "Recovery: revise & resend is authored. Path-probe can leave decline.",
        node: "revise",
        message: "sender-revise",
        pathNodes: ["draft", "fields", "send", "viewAcme", "decline", "revise"],
        pathRelations: ["draft-fields", "fields-send", "send-view", "view-decline", "decline-revise"],
        pathMessages: ["notify-sender", "sender-revise"],
        pathParticipants: ["api", "mail", "sender"],
      },
      {
        caption: "Revise returns to fields (edit packet). The complete path is reachable again.",
        node: "fields",
        message: "resend-notify",
        pathNodes: ["viewAcme", "decline", "revise", "fields"],
        pathRelations: ["view-decline", "decline-revise", "revise-fields"],
        pathMessages: ["sender-revise", "resend-notify"],
        pathParticipants: ["sender", "api", "mail"],
      },
    ],
  },
];

export const PROBE_PRESETS = {
  workflow: [
    { id: "happy", label: "send → complete", from: "send", to: "complete" },
    { id: "recover", label: "decline → complete", from: "decline", to: "complete" },
    { id: "miss", label: "signVendor → draft (miss)", from: "signVendor", to: "draft" },
  ],
  sequence: [
    { id: "happy", label: "sender → vendor", from: "sender", to: "vendor" },
    { id: "audit", label: "acme → store", from: "acme", to: "store" },
    { id: "miss", label: "store → acme (miss)", from: "store", to: "acme" },
  ],
} as const;
