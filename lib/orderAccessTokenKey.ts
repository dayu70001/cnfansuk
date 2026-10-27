export const ORDER_ACCESS_TOKEN_STORAGE_PREFIX = "cnfans-order-access:";
export const ORDER_ACCESS_TOKEN_COOKIE_PREFIX = "cnfans-order-access-";
export type OrderAccessTokenCookiePurpose = "confirmation";

export function getOrderAccessTokenStorageKey(orderNumber: string) {
  return `${ORDER_ACCESS_TOKEN_STORAGE_PREFIX}${orderNumber}`;
}

export function getOrderAccessTokenCookieName(orderNumber: string, purpose: OrderAccessTokenCookiePurpose = "confirmation") {
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return null;
  return `${ORDER_ACCESS_TOKEN_COOKIE_PREFIX}${purpose}-${orderNumber}`;
}
