import type { Field, FieldKind, SignatureRequest } from "../types";

const DEFAULT_KINDS: FieldKind[] = ["signature", "date", "initials"];

export function placeFields(request: SignatureRequest): Field[] {
  const fields: Field[] = [];
  request.signers.forEach((signer, signerIndex) => {
    DEFAULT_KINDS.forEach((kind, kindIndex) => {
      fields.push({
        id: `fld_${signer.id}_${kind}`,
        kind,
        signerId: signer.id,
        page: 1,
        x: 72,
        y: 640 - signerIndex * 96 - kindIndex * 28,
        required: kind !== "initials",
      });
    });
  });
  request.fields = fields;
  return fields;
}

export function bindFieldsToSigners(request: SignatureRequest): Field[] {
  const signerIds = new Set(request.signers.map((signer) => signer.id));
  for (const field of request.fields) {
    if (!signerIds.has(field.signerId)) {
      throw new Error(`field ${field.id} points at missing signer ${field.signerId}`);
    }
  }
  return request.fields;
}

export function requiredFieldsFor(request: SignatureRequest, signerId: string): Field[] {
  return request.fields.filter((field) => field.signerId === signerId && field.required);
}

export function applyFieldValue(request: SignatureRequest, fieldId: string, value: string): Field {
  const field = request.fields.find((item) => item.id === fieldId);
  if (!field) throw new Error(`unknown field ${fieldId}`);
  field.value = value;
  return field;
}
