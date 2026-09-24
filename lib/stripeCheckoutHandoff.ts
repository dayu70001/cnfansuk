export const LOCAL_STRIPE_FALLBACK_STORAGE_KEY = "cnfansuk-local-stripe-bank-transfer-fallback";

export type LocalStripeFallback = {
  sessionId: string;
  checkoutUrl: string;
};

export function getLocalStripeTestSessionId(checkoutUrl: string | undefined): string | null {
  if (!checkoutUrl) return null;

  try {
    const url = new URL(checkoutUrl);
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") return null;
    const match = url.pathname.match(/^\/c\/pay\/(cs_test_[A-Za-z0-9]+)$/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function buildLocalStripeSuccessUrl(checkoutUrl: string, origin: string, orderNumber: string): string | null {
  const sessionId = getLocalStripeTestSessionId(checkoutUrl);
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

export function serializeLocalStripeFallback(checkoutUrl: string): string | null {
  const sessionId = getLocalStripeTestSessionId(checkoutUrl);
  return sessionId ? JSON.stringify({ sessionId, checkoutUrl }) : null;
}

export function parseLocalStripeFallback(
  serialized: string | null,
  expectedSessionId: string,
): string | null {
  if (!serialized || !/^cs_test_[A-Za-z0-9]+$/.test(expectedSessionId)) return null;

  try {
    const fallback = JSON.parse(serialized) as Partial<LocalStripeFallback>;
    if (fallback.sessionId !== expectedSessionId || typeof fallback.checkoutUrl !== "string") return null;
    return getLocalStripeTestSessionId(fallback.checkoutUrl) === expectedSessionId
      ? fallback.checkoutUrl
      : null;
  } catch {
    return null;
  }
}
