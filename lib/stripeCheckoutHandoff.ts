export const LOCAL_STRIPE_FALLBACK_STORAGE_KEY = "cnfansuk-local-stripe-bank-transfer-fallback";
export type StripeHandoffMode = "test" | "live";

export function getLocalStripeFallbackStorageKey(orderNumber: string): string | null {
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return null;
  return `${LOCAL_STRIPE_FALLBACK_STORAGE_KEY}:${orderNumber}`;
}

export type LocalStripeFallback = {
  orderNumber: string;
  sessionId: string;
  checkoutUrl: string;
  mode: StripeHandoffMode;
};

export function getStripeSessionId(checkoutUrl: string | undefined, mode: StripeHandoffMode): string | null {
  if (!checkoutUrl) return null;

  try {
    const url = new URL(checkoutUrl);
    if (
      url.protocol !== "https:"
      || url.hostname !== "checkout.stripe.com"
      || url.port
      || url.username
      || url.password
    ) return null;
    const prefix = mode === "test" ? "cs_test_" : "cs_live_";
    const match = url.pathname.match(new RegExp(`^/c/pay/(${prefix}[A-Za-z0-9]+)$`));
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function getLocalStripeTestSessionId(checkoutUrl: string | undefined): string | null {
  return getStripeSessionId(checkoutUrl, "test");
}

export function getLiveStripeSessionId(checkoutUrl: string | undefined): string | null {
  return getStripeSessionId(checkoutUrl, "live");
}

export function buildLocalStripeSuccessUrl(checkoutUrl: string, origin: string, orderNumber: string): string | null {
  const sessionId = getStripeSessionId(checkoutUrl, "test");
  if (!sessionId || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return null;

  try {
    const localOrigin = new URL(origin);
    const hostname = localOrigin.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const isLoopback = hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname === "::1"
      || hostname.endsWith(".localhost");
    if (localOrigin.protocol !== "http:" || !isLoopback) return null;

    const successUrl = new URL("/order-success", localOrigin);
    successUrl.searchParams.set("order", orderNumber);
    successUrl.searchParams.set("payment", "stripe_test");
    successUrl.searchParams.set("session_id", sessionId);
    return successUrl.toString();
  } catch {
    return null;
  }
}

/** Validate the server-provided Live return URL; never construct it from browser host data. */
export function isStripeLiveSuccessReturnUrl(value: string | undefined, sessionId: string, orderNumber: string): boolean {
  if (!value || !/^cs_live_[A-Za-z0-9]+$/.test(sessionId) || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return false;
  try {
    const url = new URL(value);
    return value.startsWith("https://www.cnfans.co.uk/")
      && url.origin === "https://www.cnfans.co.uk"
      && !url.username
      && !url.password
      && !url.port
      && url.pathname === "/order-success"
      && !url.hash
      && url.searchParams.size === 3
      && url.searchParams.get("order") === orderNumber
      && url.searchParams.get("payment") === "stripe_live"
      && url.searchParams.get("session_id") === sessionId;
  } catch {
    return false;
  }
}

export function serializeLocalStripeFallback(
  checkoutUrl: string,
  orderNumber: string,
  mode: StripeHandoffMode = "test",
): string | null {
  const sessionId = getStripeSessionId(checkoutUrl, mode);
  if (!sessionId || !getLocalStripeFallbackStorageKey(orderNumber)) return null;
  return JSON.stringify({ orderNumber, sessionId, checkoutUrl, mode });
}

export function parseLocalStripeFallback(
  serialized: string | null,
  expectedSessionId: string,
  expectedOrderNumber: string,
  mode: StripeHandoffMode = "test",
): string | null {
  const prefix = mode === "test" ? "cs_test_" : "cs_live_";
  if (
    !serialized
    || !new RegExp(`^${prefix}[A-Za-z0-9]+$`).test(expectedSessionId)
    || !getLocalStripeFallbackStorageKey(expectedOrderNumber)
  ) return null;

  try {
    const fallback = JSON.parse(serialized) as Partial<LocalStripeFallback>;
    if (
      fallback.orderNumber !== expectedOrderNumber
      || fallback.sessionId !== expectedSessionId
      || fallback.mode !== mode
      || typeof fallback.checkoutUrl !== "string"
    ) return null;
    return getStripeSessionId(fallback.checkoutUrl, mode) === expectedSessionId
      ? fallback.checkoutUrl
      : null;
  } catch {
    return null;
  }
}

export function shouldShowLocalStripeFallback(paymentStatus: string, checkoutUrl: string | null): boolean {
  return paymentStatus !== "paid" && checkoutUrl !== null;
}
