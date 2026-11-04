export type ChannelPopupTrigger =
  | "product_engaged"
  | "second_product"
  | "post_add_to_cart"
  | "home_engaged";

export type ChannelPopupPageType = "home" | "product";

export type ChannelPopupEligibility = {
  pageType: ChannelPopupPageType;
  productVisitIndex?: number;
  activeMs: number;
  productEngaged?: boolean;
  homeScrolledProductArea?: boolean;
  postAddToCartElapsedMs?: number | null;
};

export type ChannelPopupOutcome = "shown" | "closed" | "clicked";

export const CHANNEL_POPUP_CART_ADD_EVENT = "cnfans:channel-popup-cart-add";
export const CHANNEL_POPUP_OUTCOME_KEY = "cnfans-channel-popup-outcome-v1";
export const CHANNEL_POPUP_SESSION_SHOWN_KEY = "cnfans-channel-popup-shown-v1";
export const CHANNEL_POPUP_SEEN_PRODUCTS_KEY = "cnfans-channel-popup-products-v1";

export const CHANNEL_POPUP_COOLDOWNS: Record<ChannelPopupOutcome, number> = {
  shown: 7 * 24 * 60 * 60 * 1000,
  closed: 14 * 24 * 60 * 60 * 1000,
  clicked: 30 * 24 * 60 * 60 * 1000,
};

const FIRST_PRODUCT_DWELL_MS = 15_000;
const SECOND_PRODUCT_DWELL_MS = 8_000;
const POST_ADD_TO_CART_DWELL_MS = 8_000;
const HOME_DWELL_MS = 30_000;

export function isValidWhatsAppChannelUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "whatsapp.com" || url.hostname === "www.whatsapp.com") &&
      /^\/channel\/[A-Za-z0-9_-]{6,}\/?$/.test(url.pathname) &&
      !/placeholder|example|dummy|your-channel/i.test(url.pathname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function getEligibleChannelPopupTrigger(input: ChannelPopupEligibility): ChannelPopupTrigger | null {
  if (!Number.isFinite(input.activeMs) || input.activeMs < 0) return null;

  if (input.postAddToCartElapsedMs != null && input.postAddToCartElapsedMs >= POST_ADD_TO_CART_DWELL_MS) {
    return "post_add_to_cart";
  }

  if (input.pageType === "home") {
    return input.activeMs >= HOME_DWELL_MS && input.homeScrolledProductArea ? "home_engaged" : null;
  }

  if (input.pageType !== "product") return null;
  if (input.productVisitIndex === 1 && input.activeMs >= SECOND_PRODUCT_DWELL_MS) return "second_product";
  if (input.productVisitIndex === 0 && input.activeMs >= FIRST_PRODUCT_DWELL_MS && input.productEngaged) {
    return "product_engaged";
  }
  return null;
}

export function isChannelPopupCoolingDown(
  outcome: unknown,
  now = Date.now(),
): boolean {
  if (!outcome || typeof outcome !== "object") return false;
  const record = outcome as { outcome?: unknown; at?: unknown };
  if (typeof record.outcome !== "string" || typeof record.at !== "number" || !Number.isFinite(record.at)) return false;
  if (!(record.outcome in CHANNEL_POPUP_COOLDOWNS)) return false;
  const elapsed = now - record.at;
  if (elapsed < 0) return false;
  return elapsed < CHANNEL_POPUP_COOLDOWNS[record.outcome as ChannelPopupOutcome];
}

export function shouldRenderChannelPopup(hasBeenShown: boolean, temporarilySuppressed: boolean): boolean {
  return hasBeenShown && !temporarilySuppressed;
}

export function getChannelPopupPage(pathname: string | null): ChannelPopupPageType | null {
  if (pathname === "/") return "home";
  if (pathname && /^\/product\/[^/]+\/?$/.test(pathname)) return "product";
  return null;
}
