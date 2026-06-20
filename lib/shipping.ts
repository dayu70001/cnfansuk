import { convertGbpFallback } from "./cart";
import type { CurrencyCode } from "./currency";

export const FREE_SHIPPING_THRESHOLD_GBP = 120;

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

export function hasFreeShipping(subtotalGbp: number) {
  return subtotalGbp >= FREE_SHIPPING_THRESHOLD_GBP;
}

export function getShippingPrice(
  methodId: ShippingMethodId,
  subtotalGbp: number,
  currency: CurrencyCode,
) {
  if (hasFreeShipping(subtotalGbp)) return 0;
  return convertGbpFallback(getShippingMethod(methodId).priceGbp, currency);
}
