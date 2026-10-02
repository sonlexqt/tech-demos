import type { ComponentType, Variant } from "./types";

export const TYPE_COLOR: Record<ComponentType, string> = {
  frontend: "#5ce1e6",
  backend: "#7aa2ff",
  database: "#c9a46a",
  cloud: "#9b8cff",
  security: "#ff6b8a",
  messagebus: "#f5c16c",
  external: "#8b97b2",
};

export const VARIANT_COLOR: Record<Variant, string> = {
  default: "#6d7c9a",
  emphasis: "#5ce1e6",
  security: "#ff6b8a",
  dashed: "#8b97b2",
  return: "#3ee0a2",
};

export function typeLabel(type: ComponentType): string {
  return type;
}
