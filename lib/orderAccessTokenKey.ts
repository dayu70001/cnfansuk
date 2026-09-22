export const ORDER_ACCESS_TOKEN_STORAGE_PREFIX = "cnfans-order-access:";

export function getOrderAccessTokenStorageKey(orderNumber: string) {
  return `${ORDER_ACCESS_TOKEN_STORAGE_PREFIX}${orderNumber}`;
}
