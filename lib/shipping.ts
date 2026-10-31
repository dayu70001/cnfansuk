import type { CurrencyCode } from "./currency";

export const FREE_SHIPPING_THRESHOLD = 180;
const FREE_SHIPPING_THRESHOLDS: Record<CurrencyCode, number> = {
  GBP: FREE_SHIPPING_THRESHOLD,
  EUR: FREE_SHIPPING_THRESHOLD,
  USD: FREE_SHIPPING_THRESHOLD,
};

export const shippingMethods = [
  { id: "royal-mail-tracked", label: "Royal Mail Tracked", priceGbp: 5, estimate: "7–12 business days" },
  { id: "dhl-express", label: "DHL Express", priceGbp: 5, estimate: "7–12 business days" },
  { id: "fedex-priority", label: "FedEx Priority", priceGbp: 15, estimate: "5–9 business days" },
] as const;

export type ShippingMethodId = (typeof shippingMethods)[number]["id"];

export const DEFAULT_SHIPPING_METHOD_ID: ShippingMethodId = "royal-mail-tracked";

export function getShippingMethod(id: ShippingMethodId) {
  return shippingMethods.find((method) => method.id === id) || shippingMethods[0];
}

export function hasFreeShipping(subtotalInEligibilityCurrency: number, currency: CurrencyCode) {
  // Compare the unrounded product subtotal. Formatting/rounding is display-only
  // and must never turn a value below the threshold into free shipping.
  return subtotalInEligibilityCurrency >= FREE_SHIPPING_THRESHOLDS[currency];
}

export function isFreeShippingApplied(
  methodId: ShippingMethodId,
  subtotalInEligibilityCurrency: number,
  currency: CurrencyCode,
) {
  return hasFreeShipping(subtotalInEligibilityCurrency, currency) && methodId !== "fedex-priority";
}

export function getShippingPrice(
  methodId: ShippingMethodId,
  subtotalInEligibilityCurrency: number,
  eligibilityCurrency: CurrencyCode,
) {
  if (isFreeShippingApplied(methodId, subtotalInEligibilityCurrency, eligibilityCurrency)) return 0;
  // Order settlement and the stored order total remain GBP.
  return getShippingMethod(methodId).priceGbp;
}
