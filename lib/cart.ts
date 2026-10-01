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
  return a.productId === b.productId && (a.color || "") === (b.color || "") && (a.size || "") === (b.size || "");
}

export function sameCartLine(a: CartItem, b: CartItem) {
  if (a.cartLineId && b.cartLineId) return a.cartLineId === b.cartLineId;
  return sameCartItem(a, b);
}

export function getCartLineKey(item: CartItem, index = 0) {
  return item.cartLineId || JSON.stringify([item.productId, item.color || "", item.size || "", index]);
}

export function createCartLineId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function ensureCartLineIds(items: CartItem[]) {
  const usedIds = new Set<string>();
  return items.map((item) => {
    let cartLineId = item.cartLineId;
    if (!cartLineId || usedIds.has(cartLineId)) cartLineId = createCartLineId();
    usedIds.add(cartLineId);
    return cartLineId === item.cartLineId ? item : { ...item, cartLineId };
  });
}

export function updateCartItemSize(items: CartItem[], item: CartItem, size: string): CartItem[] {
  const sourceIndex = items.findIndex((cartItem) => sameCartLine(cartItem, item));
  if (sourceIndex < 0 || items[sourceIndex].size === size) return items;

  const sourceItem = items[sourceIndex];
  const resizedItem = { ...sourceItem, size };
  const matchingIndex = items.findIndex(
    (cartItem, index) => index !== sourceIndex && sameCartItem(cartItem, resizedItem),
  );

  if (matchingIndex < 0) {
    return items.map((cartItem, index) => (index === sourceIndex ? resizedItem : cartItem));
  }

  return items.flatMap((cartItem, index) => {
    if (index === sourceIndex) return [];
    if (index === matchingIndex) {
      return [{ ...cartItem, quantity: cartItem.quantity + sourceItem.quantity }];
    }
    return [cartItem];
  });
}

export function convertGbpFallback(amount: number, currency: CurrencyCode) {
  if (currency === "EUR") return amount * 9 / 8;
  if (currency === "USD") return amount * 9 / 7;
  return amount;
}
