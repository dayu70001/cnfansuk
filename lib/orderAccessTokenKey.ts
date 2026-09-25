export const ORDER_ACCESS_TOKEN_STORAGE_PREFIX = "cnfans-order-access:";
export const ORDER_ACCESS_TOKEN_COOKIE_PREFIX = "cnfans-order-access-";
export type OrderAccessTokenCookiePurpose = "stripe" | "confirmation" | "processing";

export function getOrderAccessTokenStorageKey(orderNumber: string) {
  return `${ORDER_ACCESS_TOKEN_STORAGE_PREFIX}${orderNumber}`;
}

export function getOrderAccessTokenCookieName(orderNumber: string, purpose: OrderAccessTokenCookiePurpose = "stripe") {
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return null;
  return `${ORDER_ACCESS_TOKEN_COOKIE_PREFIX}${purpose}-${orderNumber}`;
}

export function getOrderAccessTokenCookiePath(orderNumber: string, purpose: OrderAccessTokenCookiePurpose = "stripe") {
  if (!getOrderAccessTokenCookieName(orderNumber, purpose)) return null;
  if (purpose === "stripe") return "/api/payments/stripe";
  if (purpose === "processing") return `/payments/stripe/processing`;
  return `/api/orders/${encodeURIComponent(orderNumber)}/confirmation`;
}
