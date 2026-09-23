import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { recordRemind } from "./action-log";
import { catalog } from "./catalog";
import {
  RemindButtonView,
  RequestCardView,
  SignerChipView,
  StatusBadgeView,
} from "./components/esign";

export const { registry, handlers, executeAction } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Button: shadcnComponents.Button,
    Text: shadcnComponents.Text,
    RequestCard: ({ props, children }) => (
      <RequestCardView
        title={props.title}
        documentName={props.documentName}
        status={props.status}
        dueHint={props.dueHint}
      >
        {children}
      </RequestCardView>
    ),
    SignerChip: ({ props }) => (
      <SignerChipView
        name={props.name}
        role={props.role}
        region={props.region}
        status={props.status}
      />
    ),
    StatusBadge: ({ props }) => <StatusBadgeView status={props.status} />,
    RemindButton: ({ props, emit }) => (
      <RemindButtonView
        label={props.label}
        requestId={props.requestId}
        onPress={() => emit("press")}
      />
    ),
  },
  actions: {
    remind_signer: async (params) => {
      recordRemind(params?.requestId ?? "unknown", params?.label ?? null);
    },
  },
});
