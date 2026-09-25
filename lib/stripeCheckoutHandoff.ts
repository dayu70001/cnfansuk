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

export function getStripeSessionId(sessionId: string | undefined, mode: StripeHandoffMode): string | null {
  if (!sessionId) return null;
  const prefix = mode === "test" ? "cs_test_" : "cs_live_";
  return new RegExp(`^${prefix}[A-Za-z0-9]+$`).test(sessionId) ? sessionId : null;
}

export function isStripeCheckoutUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

export function getLocalStripeTestSessionId(sessionId: string | undefined): string | null {
  return getStripeSessionId(sessionId, "test");
}

export function getLiveStripeSessionId(sessionId: string | undefined): string | null {
  return getStripeSessionId(sessionId, "live");
}

export function isStripeTestSuccessReturnUrl(
  value: string | undefined,
  sessionId: string,
  orderNumber: string,
  expectedOrigin: string,
): boolean {
  if (!getStripeSessionId(sessionId, "test") || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return false;
  try {
    const expected = new URL(expectedOrigin);
    const url = new URL(value || "");
    if (
      expected.protocol !== "http:"
      || !isLoopbackHostname(expected.hostname)
      || expected.username
      || expected.password
      || url.origin !== expected.origin
      || url.pathname !== "/order-success"
      || url.username
      || url.password
      || url.hash
      || url.searchParams.size !== 3
      || url.searchParams.get("order") !== orderNumber
      || url.searchParams.get("payment") !== "stripe_test"
      || url.searchParams.get("session_id") !== sessionId
    ) return false;
    return true;
  } catch {
    return false;
  }
}

/** Validate the server-provided Live return URL; never construct it from browser host data. */
export function isStripeLiveSuccessReturnUrl(value: string | undefined, sessionId: string, orderNumber: string): boolean {
  if (!value || !getStripeSessionId(sessionId, "live") || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber)) return false;
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
  sessionId: string,
  orderNumber: string,
  mode: StripeHandoffMode = "test",
): string | null {
  if (!getStripeSessionId(sessionId, mode) || !isStripeCheckoutUrl(checkoutUrl) || !getLocalStripeFallbackStorageKey(orderNumber)) return null;
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
      || !isStripeCheckoutUrl(fallback.checkoutUrl)
    ) return null;
    return fallback.checkoutUrl;
  } catch {
    return null;
  }
}

export function shouldShowLocalStripeFallback(paymentStatus: string, checkoutUrl: string | null): boolean {
  return paymentStatus !== "paid" && checkoutUrl !== null;
}

function isLoopbackHostname(hostname: string) {
  const normalisedHostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalisedHostname);
}
