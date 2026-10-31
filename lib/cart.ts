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

export function getCartItemSizeOptions(item: CartItem) {
  return Array.isArray(item.availableSizes)
    ? Array.from(new Set(item.availableSizes.map((size) => String(size || "").trim()).filter(Boolean)))
    : [];
}

export function mergeCartItemSizeOptions(item: CartItem, productSizes: string[]): CartItem {
  const availableSizes = Array.from(new Set(productSizes.map((size) => String(size || "").trim()).filter(Boolean)));
  // Keep the saved selection on the cart row, but never advertise a stale size
  // as currently purchasable. The drawer renders it as a disabled option.
  return { ...item, availableSizes, sizeOptionsResolved: true, sizeOptionsFailed: false };
}

export function getCartItemSizeLookupKey(item: CartItem) {
  return item.productId || item.slug;
}

export function getCartItemLookupSlug(item: CartItem) {
  if (item.slug?.trim()) return item.slug.trim();
  const match = item.productUrl?.match(/\/product\/([^/?#]+)/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

export function hasValidCartItemSize(item: CartItem) {
  return Boolean(item.size) && getCartItemSizeOptions(item).includes(item.size);
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

export type SubmittedCartItem = Pick<CartItem, "cartLineId" | "productId" | "productCode" | "color" | "size" | "quantity">;

export function removeSubmittedCartItems(current: CartItem[], submitted: SubmittedCartItem[]) {
  if (submitted.length === 0 || current.length === 0) return current;
  const remainingSnapshots = [...submitted];
  let changed = false;
  const next = current.flatMap((item) => {
    const snapshotIndex = remainingSnapshots.findIndex((snapshot) => (
      (item.cartLineId && snapshot.cartLineId
        ? item.cartLineId === snapshot.cartLineId
        : item.productId === snapshot.productId
          && (item.color || "") === (snapshot.color || "")
          && (item.size || "") === (snapshot.size || ""))
      && item.productId === snapshot.productId
      && (item.productCode || item.productId) === (snapshot.productCode || snapshot.productId)
      && (item.color || "") === (snapshot.color || "")
      && (item.size || "") === (snapshot.size || "")
    ));
    if (snapshotIndex < 0) return [item];

    const [snapshot] = remainingSnapshots.splice(snapshotIndex, 1);
    const quantity = item.quantity - snapshot.quantity;
    changed = true;
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
  return changed ? next : current;
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
  if (sourceIndex < 0 || items[sourceIndex].size === size || !getCartItemSizeOptions(items[sourceIndex]).includes(size)) return items;

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
      return [{
        ...cartItem,
        quantity: cartItem.quantity + sourceItem.quantity,
        availableSizes: cartItem.availableSizes?.length ? cartItem.availableSizes : sourceItem.availableSizes,
      }];
    }
    return [cartItem];
  });
}

export function convertGbpFallback(amount: number, currency: CurrencyCode) {
  if (currency === "EUR") return amount * 9 / 8;
  if (currency === "USD") return amount * 9 / 7;
  return amount;
}
