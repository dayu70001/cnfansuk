/**
 * Minimal, server-side shape for a future Stripe-hosted bank transfer session.
 * This module deliberately makes no network requests and contains no secrets.
 */
export type StripeBankTransferCheckoutInput = {
  orderNumber: string;
  amountMinor: number;
  currency: "GBP";
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
};

export type StripeBankTransferMode = "mock" | "test" | "live" | "disabled";
export type StripeRealMode = "test" | "live";

const LIVE_SITE_ORIGIN = "https://www.cnfans.co.uk";

export type StripeBankTransferSessionDraft = {
  amountMinor: number;
  currency: "GBP";
  description: "Order payment";
  clientReferenceId: string;
  metadata: { cnf_order_number: string };
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
};

export function getStripeLiveSiteOrigin(env: NodeJS.ProcessEnv = process.env): string | null {
  const configuredOrigin = env.STRIPE_LIVE_SITE_ORIGIN?.trim();
  if (!configuredOrigin || !/^https:\/\/www\.cnfans\.co\.uk\/?$/.test(configuredOrigin)) return null;

  try {
    const url = new URL(configuredOrigin);
    if (
      url.protocol !== "https:"
      || url.hostname !== "www.cnfans.co.uk"
      || url.port
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) return null;
    return LIVE_SITE_ORIGIN;
  } catch {
    return null;
  }
}

/** Fail closed unless an explicit mode matches its environment and key family. */
export function getStripeBankTransferMode(env: NodeJS.ProcessEnv = process.env): StripeBankTransferMode {
  if (env.STRIPE_BANK_TRANSFER_MODE === "mock" && env.NODE_ENV === "development") return "mock";
  if (
    env.STRIPE_BANK_TRANSFER_MODE === "test"
    && env.NODE_ENV === "development"
    && env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
  ) return "test";
  if (
    env.STRIPE_BANK_TRANSFER_MODE === "live"
    && env.NODE_ENV === "production"
    && env.VERCEL === "1"
    && env.VERCEL_ENV === "production"
    && env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    && getStripeLiveSiteOrigin(env) !== null
  ) return "live";
  return "disabled";
}

/** Backwards-compatible name retained for existing local callers and tests. */
export function getLocalStripeBankTransferMode(env: NodeJS.ProcessEnv = process.env): StripeBankTransferMode {
  return getStripeBankTransferMode(env);
}

/** Verify the production deployment and canonical request host without using it to build return URLs. */
export function isStripeLiveProductionRequest(request: Request, env: NodeJS.ProcessEnv = process.env): boolean {
  const siteOrigin = getStripeLiveSiteOrigin(env);
  if (getStripeBankTransferMode(env) !== "live" || !siteOrigin) return false;

  try {
    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== siteOrigin || request.headers.get("host")?.toLowerCase() !== "www.cnfans.co.uk") return false;

    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && requestOrigin !== siteOrigin) return false;
    return true;
  } catch {
    return false;
  }
}

export function isLocalStripeBankTransferMockEnabled() {
  return getStripeBankTransferMode() === "mock";
}

export function isLocalStripeBankTransferTestEnabled() {
  return getStripeBankTransferMode() === "test";
}

export function isStripeLiveBankTransferEnabled() {
  return getStripeBankTransferMode() === "live";
}

/** Whitelist only payment-reference and amount data; never copy order/cart fields. */
export function buildStripeBankTransferSessionDraft(
  input: StripeBankTransferCheckoutInput,
): StripeBankTransferSessionDraft {
  const orderNumber = input.orderNumber.trim();
  if (!/^[A-Za-z0-9-]{1,80}$/.test(orderNumber)) throw new Error("Invalid order reference.");
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) throw new Error("Invalid payment amount.");
  if (input.currency !== "GBP") throw new Error("Unsupported payment currency.");

  const draft: StripeBankTransferSessionDraft = {
    amountMinor: input.amountMinor,
    currency: "GBP",
    description: "Order payment",
    clientReferenceId: orderNumber,
    metadata: { cnf_order_number: orderNumber },
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  };
  if (input.customerId?.trim()) draft.customerId = input.customerId.trim();
  if (input.customerEmail?.trim()) draft.customerEmail = input.customerEmail.trim();
  return draft;
}
