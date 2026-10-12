import { SIGN_FIELD_KIND, SIGN_FLOW_PLACE, SIGN_PAGE_POINTS } from "./constants";

export type SignFieldKind = typeof SIGN_FIELD_KIND;

export type SignField = {
  id: string;
  kind: SignFieldKind;
  pageIndex: number;
  /** PDF user-space points. Origin is the lower-left of the page. */
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
  flow: typeof SIGN_FLOW_PLACE;
  units: typeof SIGN_PAGE_POINTS;
};

export type PageBox = {
  pageIndex: number;
  width: number;
  height: number;
};

/**
 * Convert a click on a rendered page (top-left CSS pixels) into a PDF-space
 * signature field. The page unit tag is kept as a literal so REA can seed it.
 */
export function placeSignatureField(
  page: PageBox,
  click: { x: number; y: number },
  size: { width: number; height: number } = { width: 180, height: 56 },
): SignField {
  const width = clamp(size.width, 48, page.width);
  const height = clamp(size.height, 24, page.height);
  const cssX = clamp(click.x - width / 2, 0, page.width - width);
  const cssY = clamp(click.y - height / 2, 0, page.height - height);

  return {
    id: `field-${page.pageIndex}-${Math.round(cssX)}-${Math.round(cssY)}`,
    kind: SIGN_FIELD_KIND,
    pageIndex: page.pageIndex,
    x: cssX,
    y: page.height - cssY - height,
    width,
    height,
    pageWidth: page.width,
    pageHeight: page.height,
    flow: SIGN_FLOW_PLACE,
    units: SIGN_PAGE_POINTS,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
