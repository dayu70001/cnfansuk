import type { CurrencyCode } from "@/lib/currency";
import type { CartItem, Product } from "@/lib/types";

export type GoogleAnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

type GoogleAnalyticsEvent = {
  eventName: string;
  params: Record<string, unknown>;
};

export type SubmittedOrderAnalytics = {
  transactionId: string;
  currency: CurrencyCode;
  value: number;
  items: GoogleAnalyticsItem[];
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __cnfansGa4Configured?: boolean;
    __cnfansGa4Queue?: GoogleAnalyticsEvent[];
  }
}

const SUBMITTED_ORDER_KEY = "cnfans-ga4-submitted-order";

export function trackGoogleAnalyticsEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
    return;
  }

  window.__cnfansGa4Queue = window.__cnfansGa4Queue || [];
  window.__cnfansGa4Queue.push({ eventName, params });
}

export function flushGoogleAnalyticsQueue() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const queue = window.__cnfansGa4Queue || [];
  window.__cnfansGa4Queue = [];
  queue.forEach(({ eventName, params }) => window.gtag?.("event", eventName, params));
}

export function productToGoogleAnalyticsItem(product: Product, price: number, quantity = 1): GoogleAnalyticsItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    price,
    quantity,
  };
}

export function cartItemToGoogleAnalyticsItem(item: CartItem, price: number): GoogleAnalyticsItem {
  return {
    item_id: item.productCode || item.productId,
    item_name: item.title || item.name,
    item_variant: [item.color, item.size].filter(Boolean).join(" / ") || undefined,
    price,
    quantity: item.quantity,
  };
}

export function rememberSubmittedOrderAnalytics(payload: SubmittedOrderAnalytics) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SUBMITTED_ORDER_KEY, JSON.stringify(payload));
  } catch {
    // Analytics must never interrupt checkout completion.
  }
}

export function takeSubmittedOrderAnalytics(transactionId: string): SubmittedOrderAnalytics | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(SUBMITTED_ORDER_KEY);
    if (!stored) return null;
    const payload = JSON.parse(stored) as SubmittedOrderAnalytics;
    if (payload.transactionId !== transactionId) return null;
    window.sessionStorage.removeItem(SUBMITTED_ORDER_KEY);
    return payload;
  } catch {
    return null;
  }
}
