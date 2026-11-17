import type {
  BBox,
  EnvelopeField,
  EnvelopeState,
  HumanCorrection,
  Recipient,
} from "./types";
import { EMPTY_ENVELOPE } from "./types";

export function cloneEnvelope(state: EnvelopeState): EnvelopeState {
  return structuredClone(state);
}

export function initialEnvelope(overrides?: Partial<EnvelopeState>): EnvelopeState {
  return {
    ...cloneEnvelope(EMPTY_ENVELOPE),
    ...overrides,
    document: { ...EMPTY_ENVELOPE.document, ...overrides?.document },
  };
}

export function setRecipients(
  state: EnvelopeState,
  recipients: Recipient[],
): EnvelopeState {
  const signingOrder = [...recipients]
    .sort((a, b) => a.order - b.order)
    .map((r) => r.id);
  return { ...state, recipients, signingOrder };
}

export function upsertField(state: EnvelopeState, field: EnvelopeField): EnvelopeState {
  const index = state.fields.findIndex((f) => f.id === field.id);
  if (index === -1) {
    return { ...state, fields: [...state.fields, field] };
  }
  const fields = state.fields.slice();
  fields[index] = field;
  return { ...state, fields };
}

export function removeField(state: EnvelopeState, fieldId: string): EnvelopeState {
  return { ...state, fields: state.fields.filter((f) => f.id !== fieldId) };
}

export function updateField(
  state: EnvelopeState,
  fieldId: string,
  patch: Partial<EnvelopeField>,
): EnvelopeState {
  return {
    ...state,
    fields: state.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
  };
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function clampBBox(bbox: BBox): BBox {
  const width = clamp01(bbox.width);
  const height = clamp01(bbox.height);
  return {
    x: clamp01(bbox.x),
    y: clamp01(bbox.y),
    width: Math.min(width, 1 - clamp01(bbox.x)),
    height: Math.min(height, 1 - clamp01(bbox.y)),
  };
}

export function lowestConfidenceFields(state: EnvelopeState, n = 2): EnvelopeField[] {
  return [...state.fields].sort((a, b) => a.confidence - b.confidence).slice(0, n);
}

export function describeCorrections(
  before: EnvelopeState,
  after: EnvelopeState,
): HumanCorrection[] {
  const corrections: HumanCorrection[] = [];
  const beforeMap = new Map(before.fields.map((f) => [f.id, f]));
  const afterMap = new Map(after.fields.map((f) => [f.id, f]));

  for (const [id, prev] of beforeMap) {
    const next = afterMap.get(id);
    if (!next) {
      corrections.push({
        fieldId: id,
        kind: "deleted",
        detail: `Removed ${prev.label} (${prev.type})`,
      });
      continue;
    }
    if (prev.page !== next.page) {
      corrections.push({
        fieldId: id,
        kind: "page-changed",
        detail: `Moved ${prev.label} from page ${prev.page} to page ${next.page}`,
      });
    }
    const moved =
      Math.abs(prev.bbox.x - next.bbox.x) > 0.004 ||
      Math.abs(prev.bbox.y - next.bbox.y) > 0.004;
    const resized =
      Math.abs(prev.bbox.width - next.bbox.width) > 0.004 ||
      Math.abs(prev.bbox.height - next.bbox.height) > 0.004;
    if (moved && prev.page === next.page) {
      corrections.push({
        fieldId: id,
        kind: "moved",
        detail: `Dragged ${prev.label} on page ${next.page}`,
      });
    }
    if (resized) {
      corrections.push({
        fieldId: id,
        kind: "resized",
        detail: `Resized ${prev.label}`,
      });
    }
  }

  for (const [id, next] of afterMap) {
    if (!beforeMap.has(id)) {
      corrections.push({
        fieldId: id,
        kind: "added",
        detail: `Added ${next.label} (${next.type}) on page ${next.page}`,
      });
    }
  }

  return corrections;
}

export function formatSigningOrder(state: EnvelopeState): string {
  return state.signingOrder
    .map((id, i) => {
      const r = state.recipients.find((x) => x.id === id);
      return r ? `${i + 1}. ${r.name} (${r.company})` : `${i + 1}. ${id}`;
    })
    .join(" → ");
}
