export const ORDER_ACCESS_TOKEN_STORAGE_PREFIX = "cnfans-order-access:";
export const ORDER_ACCESS_TOKEN_COOKIE_PREFIX = "cnfans-order-access-";
export type OrderAccessTokenCookiePurpose = "stripe" | "confirmation";

export function getOrderAccessTokenStorageKey(orderNumber: string) {
  return `${ORDER_ACCESS_TOKEN_STORAGE_PREFIX}${orderNumber}`;
}

export function getOrderAccessTokenCookieName(orderNumber: string, purpose: OrderAccessTokenCookiePurpose = "stripe") {
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return null;
  return `${ORDER_ACCESS_TOKEN_COOKIE_PREFIX}${purpose}-${orderNumber}`;
}

export function getOrderAccessTokenCookiePath(orderNumber: string, purpose: OrderAccessTokenCookiePurpose = "stripe") {
  if (!getOrderAccessTokenCookieName(orderNumber, purpose)) return null;
  return purpose === "stripe"
    ? "/api/payments/stripe"
    : `/api/orders/${encodeURIComponent(orderNumber)}/confirmation`;
}
