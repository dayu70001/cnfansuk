import type { CurrencyCode } from "./currency";

export const FREE_SHIPPING_THRESHOLD = 180;
const FREE_SHIPPING_THRESHOLDS: Record<CurrencyCode, number> = {
  GBP: FREE_SHIPPING_THRESHOLD,
  EUR: FREE_SHIPPING_THRESHOLD,
  USD: FREE_SHIPPING_THRESHOLD,
};

export const courierProviders = [
  { id: "royal-mail", label: "Royal Mail" },
  { id: "dhl", label: "DHL" },
  { id: "fedex-priority", label: "FedEx Priority" },
  { id: "it-post", label: "IT Post" },
  { id: "colis-prive", label: "Colis Privé" },
  { id: "ctt", label: "CTT" },
  { id: "inpost", label: "InPost" },
  { id: "bpost", label: "bpost" },
  { id: "usps", label: "USPS" },
  { id: "postplus", label: "PostPlus" },
] as const;

export type CourierProviderId = (typeof courierProviders)[number]["id"];

export const lastMileCarrierByCountry: Readonly<Record<string, CourierProviderId>> = {
  GB: "royal-mail",
  NL: "dhl",
  DE: "dhl",
  IE: "dhl",
  IT: "it-post",
  FR: "colis-prive",
  ES: "ctt",
  PT: "ctt",
  PL: "inpost",
  BE: "bpost",
  US: "usps",
  EE: "postplus",
  LT: "postplus",
  LV: "postplus",
  CY: "postplus",
  HU: "postplus",
  RO: "postplus",
  GR: "postplus",
  MT: "postplus",
  SI: "postplus",
  SE: "postplus",
  SK: "postplus",
  BG: "postplus",
  HR: "postplus",
  FI: "postplus",
  LU: "postplus",
  AT: "postplus",
  DK: "postplus",
  CZ: "postplus",
};

const EURO_FIXED_RATE_COUNTRIES = new Set(
  Object.keys(lastMileCarrierByCountry).filter((countryCode) => countryCode !== "GB" && countryCode !== "US"),
);

const courierProviderLabels = Object.fromEntries(courierProviders.map(({ id, label }) => [id, label])) as Record<CourierProviderId, string>;

export const shippingMethods = [
  { id: "royal-mail-tracked", label: "Royal Mail Tracked", priceGbp: 5, estimate: "7–12 business days" },
  { id: "dhl-express", label: "DHL Express", priceGbp: 5, estimate: "7–12 business days" },
  { id: "fedex-priority", label: "FedEx Priority", priceGbp: 15, estimate: "5–9 business days" },
] as const;

export type ShippingMethodId = (typeof shippingMethods)[number]["id"];

export function isShippingMethodId(value: string): value is ShippingMethodId {
  return shippingMethods.some((method) => method.id === value);
}

export const DEFAULT_SHIPPING_METHOD_ID: ShippingMethodId = "royal-mail-tracked";

export function getShippingMethod(id: ShippingMethodId) {
  return shippingMethods.find((method) => method.id === id) || shippingMethods[0];
}

export function getLastMileCarrier(countryCode: string) {
  const id = lastMileCarrierByCountry[countryCode.trim().toUpperCase()];
  return id ? { id, label: courierProviderLabels[id] } : null;
}

export function getCheckoutCurrency(countryCode: string, fallbackCurrency: CurrencyCode = "GBP"): CurrencyCode {
  const code = countryCode.trim().toUpperCase();
  if (code === "GB") return "GBP";
  if (code === "US") return "USD";
  if (EURO_FIXED_RATE_COUNTRIES.has(code)) return "EUR";
  return fallbackCurrency;
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
  countryCode = "",
) {
  if (isFreeShippingApplied(methodId, subtotalInEligibilityCurrency, eligibilityCurrency)) return 0;

  const country = countryCode.trim().toUpperCase();
  const currency = country ? getCheckoutCurrency(country, eligibilityCurrency) : eligibilityCurrency;
  const standardMethod = methodId !== "fedex-priority";
  if (standardMethod && country === "GB") return 5;
  if (standardMethod && EURO_FIXED_RATE_COUNTRIES.has(country)) return 5;

  const priceGbp = getShippingMethod(methodId).priceGbp;
  const converted = currency === "EUR"
    ? priceGbp * 9 / 8
    : currency === "USD"
      ? priceGbp * 9 / 7
      : priceGbp;
  return Math.round((converted + Number.EPSILON) * 100) / 100;
}
