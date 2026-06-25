// Meta Pixel event mapping for cnfans.co.uk
//
// One real action maps to exactly one event:
//   Standard events  -> fbq("track", ...)      PageView, ViewContent, AddToCart,
//                                               InitiateCheckout, Lead, Search
//   Custom events    -> fbq("trackCustom", ...) JoinWhatsAppChannel,
//                                               JoinTelegramChannel, ContactWhatsApp,
//                                               ContactTelegram, CheckoutWhatsAppContact,
//                                               CheckoutTelegramContact, ContactEmail
//
// No Conversions/Quality API tokens are used. No Purchase / AddPaymentInfo /
// CompleteRegistration events are sent. Meta auto button events are disabled in
// components/FacebookPixel.tsx (autoConfig false).

export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Lead"
  | "Search";

export type MetaCustomEvent =
  | "JoinWhatsAppChannel"
  | "JoinTelegramChannel"
  | "ContactWhatsApp"
  | "ContactTelegram"
  | "CheckoutWhatsAppContact"
  | "CheckoutTelegramContact"
  | "ContactEmail";

export type MetaPixelEventName = MetaStandardEvent | MetaCustomEvent;

// Suggested params for every event. All fields are optional so each call site
// only passes what it knows.
export type MetaPixelParams = {
  source_page?: string;
  placement?: string;
  button_label?: string;
  destination?: string;
  product_slug?: string;
  product_code?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  content_category?: string;
  num_items?: number;
  search_string?: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | boolean | string[] | undefined;
};

declare global {
  interface Window {
    fbq?: (
      method: "track" | "trackCustom" | "init" | "set",
      eventName: string,
      params?: MetaPixelParams,
    ) => void;
  }
}

const CUSTOM_EVENTS: ReadonlySet<MetaPixelEventName> = new Set<MetaCustomEvent>([
  "JoinWhatsAppChannel",
  "JoinTelegramChannel",
  "ContactWhatsApp",
  "ContactTelegram",
  "CheckoutWhatsAppContact",
  "CheckoutTelegramContact",
  "ContactEmail",
]);

// Low-level dispatcher. Browser-only, silent if fbq is missing, never throws,
// never blocks the original button/link behaviour.
export function trackMetaEvent(eventName: MetaPixelEventName, params?: MetaPixelParams) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  const method = CUSTOM_EVENTS.has(eventName) ? "trackCustom" : "track";
  try {
    window.fbq(method, eventName, params);
  } catch {
    // Never let analytics break the page.
  }
}

// PageView (standard) — full-site page views, used on initial load and SPA
// route changes.
export function trackPageView(params?: MetaPixelParams) {
  trackMetaEvent("PageView", params);
}

// ViewContent (standard) — a product detail page opened.
export function trackViewContent(params: MetaPixelParams = {}) {
  trackMetaEvent("ViewContent", { currency: "GBP", ...params });
}

// AddToCart (standard) — Add to cart on a product card or product detail page.
export function trackAddToCart(params: MetaPixelParams = {}) {
  trackMetaEvent("AddToCart", { currency: "GBP", ...params });
}

// InitiateCheckout (standard) — Order now, cart Checkout, Continue to payment.
export function trackInitiateCheckout(params: MetaPixelParams = {}) {
  trackMetaEvent("InitiateCheckout", { currency: "GBP", ...params });
}

// Lead (standard) — order submitted. Fired once, only on the order-success page.
export function trackLead(params: MetaPixelParams = {}) {
  trackMetaEvent("Lead", { currency: "GBP", ...params });
}

// Search (standard) — catalog search submitted.
export function trackSearch(params: MetaPixelParams = {}) {
  trackMetaEvent("Search", params);
}

// JoinWhatsAppChannel (custom) — WhatsApp channel/group entry point.
export function trackJoinWhatsAppChannel(params: MetaPixelParams = {}) {
  trackMetaEvent("JoinWhatsAppChannel", params);
}

// JoinTelegramChannel (custom) — Telegram channel/group entry point.
export function trackJoinTelegramChannel(params: MetaPixelParams = {}) {
  trackMetaEvent("JoinTelegramChannel", params);
}

// ContactWhatsApp (custom) — personal WhatsApp contact (non-checkout context).
export function trackContactWhatsApp(params: MetaPixelParams = {}) {
  trackMetaEvent("ContactWhatsApp", params);
}

// ContactTelegram (custom) — personal Telegram contact (non-checkout context).
export function trackContactTelegram(params: MetaPixelParams = {}) {
  trackMetaEvent("ContactTelegram", params);
}

// CheckoutWhatsAppContact (custom) — personal WhatsApp after an order is placed.
export function trackCheckoutWhatsAppContact(params: MetaPixelParams = {}) {
  trackMetaEvent("CheckoutWhatsAppContact", params);
}

// CheckoutTelegramContact (custom) — personal Telegram after an order is placed.
export function trackCheckoutTelegramContact(params: MetaPixelParams = {}) {
  trackMetaEvent("CheckoutTelegramContact", params);
}

// ContactEmail (custom) — email support link.
export function trackContactEmail(params: MetaPixelParams = {}) {
  trackMetaEvent("ContactEmail", params);
}
