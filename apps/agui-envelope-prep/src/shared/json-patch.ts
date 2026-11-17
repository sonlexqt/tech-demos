import { applyPatch, compare, type Operation } from "fast-json-patch";

export type JsonPatch = Operation[];

export function diffState<T>(from: T, to: T): JsonPatch {
  return compare(from as object, to as object);
}

export function applyStatePatch<T>(state: T, delta: JsonPatch): T {
  const result = applyPatch(structuredClone(state), delta, true, false);
  return result.newDocument as T;
}

export function hasPatchOps(delta: JsonPatch): boolean {
  return delta.length > 0;
}
