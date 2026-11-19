/** Pure quote math mirroring the Univer formulas (nested IF discount + 8.5% tax). */

export const UNIT_PRICE = 120;
export const SUPPORT_PRICE = 2400;
export const SSO_PRICE = 1800;
export const TAX_RATE = 0.085;

export interface QuoteInput {
  seats: number;
  termYears: number;
  premiumSupport: boolean;
  sso: boolean;
}

export interface QuoteTotals {
  platform: number;
  support: number;
  sso: number;
  subtotal: number;
  discountRate: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export function volumeDiscountRate(seats: number): number {
  if (seats >= 100) return 0.25;
  if (seats >= 50) return 0.18;
  if (seats >= 20) return 0.1;
  return 0;
}

export function computeQuote(input: QuoteInput): QuoteTotals {
  const platform = input.seats * UNIT_PRICE * input.termYears;
  const support = (input.premiumSupport ? SUPPORT_PRICE : 0) * input.termYears;
  const sso = (input.sso ? SSO_PRICE : 0) * input.termYears;
  const subtotal = platform + support + sso;
  const discountRate = volumeDiscountRate(input.seats);
  const discount = subtotal * discountRate;
  const taxable = subtotal - discount;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;
  return {
    platform,
    support,
    sso,
    subtotal,
    discountRate,
    discount,
    taxable,
    tax,
    total,
  };
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
