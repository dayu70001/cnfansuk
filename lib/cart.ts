import type { CartItem } from "./types";
import type { CurrencyCode } from "./currency";

export const CART_STORAGE_KEY = "cnfansuk-cart";

export function getCartItemPrice(item: CartItem, currency: CurrencyCode = "GBP") {
  if (currency === "EUR") return item.priceEUR || convertGbpFallback(item.priceGBP, "EUR");
  if (currency === "USD") return item.priceUSD || convertGbpFallback(item.priceGBP, "USD");
  return item.priceGBP;
}

export function getCartSubtotal(items: CartItem[], currency: CurrencyCode = "GBP") {
  return items.reduce((sum, item) => sum + getCartItemPrice(item, currency) * item.quantity, 0);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function sameCartItem(a: CartItem, b: CartItem) {
  return a.productId === b.productId && a.color === b.color && a.size === b.size;
}

export function convertGbpFallback(amount: number, currency: CurrencyCode) {
  if (currency === "EUR") return amount * 9 / 8;
  if (currency === "USD") return amount * 9 / 7;
  return amount;
}
