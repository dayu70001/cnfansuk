export type StripeHandoffMode = "test" | "live";

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

function isLoopbackHostname(hostname: string) {
  const normalisedHostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalisedHostname);
}
