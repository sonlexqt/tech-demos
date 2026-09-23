import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

export const requestStatusSchema = z.enum([
  "draft",
  "sent",
  "viewed",
  "declined",
  "completed",
  "void",
  "overdue",
]);

export const signerRoleSchema = z.enum([
  "signer",
  "countersigner",
  "external-counsel",
  "internal-legal",
]);

export const catalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Button: shadcnComponentDefinitions.Button,
    Text: shadcnComponentDefinitions.Text,
    RequestCard: {
      props: z.object({
        title: z.string(),
        documentName: z.string(),
        status: requestStatusSchema,
        dueHint: z.string().nullable(),
      }),
      slots: ["default"],
      description:
        "Signature-request card. Use as the primary row on the ops board. Put SignerChip, StatusBadge, and RemindButton in children.",
    },
    SignerChip: {
      props: z.object({
        name: z.string(),
        role: signerRoleSchema,
        region: z.enum(["APAC", "EMEA", "AMER"]).nullable(),
        status: requestStatusSchema,
      }),
      description:
        "One person on a signature packet: name, role, optional region, and their current status.",
    },
    StatusBadge: {
      props: z.object({
        status: requestStatusSchema,
      }),
      description:
        "Compact status pill. Allowed values: draft, sent, viewed, declined, completed, void, overdue.",
    },
    RemindButton: {
      props: z.object({
        requestId: z.string(),
        label: z.string(),
      }),
      description:
        "Safe remind control. Bind on.press to the remind_signer action with the same requestId. Never send real email.",
    },
  },
  actions: {
    remind_signer: {
      params: z.object({
        requestId: z.string(),
        label: z.string().nullable(),
      }),
      description:
        "Queue a reminder for a waiting signer. Demo-only: writes an action log, does not send email.",
    },
  },
});

export const CATALOG_COMPONENT_NAMES = catalog.componentNames;
export const CATALOG_ACTION_NAMES = catalog.actionNames;
