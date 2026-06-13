import type { CartItem } from "./types";

export const CART_STORAGE_KEY = "cnfansuk-cart";

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.priceGBP * item.quantity, 0);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function sameCartItem(a: CartItem, b: CartItem) {
  return a.productId === b.productId && a.color === b.color && a.size === b.size;
}
