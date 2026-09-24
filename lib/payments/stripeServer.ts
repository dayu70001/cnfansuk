import "server-only";

import Stripe from "stripe";
import {
  getStripeBankTransferMode,
  getStripeLiveSiteOrigin,
  type StripeRealMode,
} from "@/lib/payments/stripeBankTransfer";
import type { AuthorizedWorkerOrder } from "@/lib/authorizedOrder";

const stripeClients = new Map<StripeRealMode, { secretKey: string; client: Stripe }>();

function getStripeClient(mode: StripeRealMode): Stripe {
  if (getStripeBankTransferMode() !== mode) throw new Error(`Stripe ${mode} mode is disabled.`);

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const expectedPrefix = mode === "test" ? "sk_test_" : "sk_live_";
  if (!secretKey?.startsWith(expectedPrefix)) throw new Error(`Stripe ${mode} mode is not configured.`);

  const cached = stripeClients.get(mode);
  if (cached?.secretKey === secretKey) return cached.client;

  const client = new Stripe(secretKey, { maxNetworkRetries: 0, timeout: 15_000 });
  stripeClients.set(mode, { secretKey, client });
  return client;
}

function getOrderAmountMinor(order: Pick<AuthorizedWorkerOrder, "final_total" | "currency">, mode: StripeRealMode) {
  if (!Number.isFinite(order.final_total) || order.final_total <= 0) {
    throw new Error("The saved order total is invalid.");
  }
  const amountMinor = Math.round(order.final_total * 100);
  if (!Number.isSafeInteger(amountMinor) || Math.abs(order.final_total * 100 - amountMinor) > 0.00001) {
    throw new Error("The saved order total cannot be represented in the order currency.");
  }
  if (mode === "live" && order.currency !== "GBP") {
    throw new Error("Stripe Live Mode only supports GBP orders.");
  }
  if (!(order.currency === "GBP" || order.currency === "EUR" || order.currency === "USD")) {
    throw new Error("The saved order currency is unsupported.");
  }
  return amountMinor;
}

function buildReturnUrls(mode: StripeRealMode, orderNumber: string, localOrigin?: string) {
  let origin: string;
  if (mode === "test") {
    if (!localOrigin) throw new Error("Stripe Test Mode requires a local return URL.");
    const baseUrl = new URL(localOrigin);
    if (baseUrl.protocol !== "http:" || !isLoopbackHostname(baseUrl.hostname) || baseUrl.username || baseUrl.password || baseUrl.port && !/^\d+$/.test(baseUrl.port)) {
      throw new Error("Stripe Test Mode only supports a local return URL.");
    }
    origin = baseUrl.origin;
  } else {
    const liveOrigin = getStripeLiveSiteOrigin();
    if (getStripeBankTransferMode() !== "live" || !liveOrigin) {
      throw new Error("Stripe Live Mode return origin is invalid.");
    }
    origin = liveOrigin;
  }

  const successUrl = new URL("/order-success", origin);
  successUrl.searchParams.set("order", orderNumber);
  successUrl.searchParams.set("payment", mode === "live" ? "stripe_live" : "stripe_test");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL("/checkout", origin);
  cancelUrl.searchParams.set("payment", "stripe_cancelled");
  return {
    successUrl: successUrl.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}"),
    cancelUrl: cancelUrl.toString(),
  };
}

export function stripeCustomerIdempotencyKey(orderNumber: string, mode: StripeRealMode = "test") {
  return mode === "test"
    ? `cnfans-stripe-customer:${orderNumber}`
    : `cnfans-stripe-live-customer:${orderNumber}`;
}

export function stripeCheckoutIdempotencyKey(orderNumber: string, mode: StripeRealMode = "test") {
  return mode === "test"
    ? `cnfans-stripe-checkout:${orderNumber}`
    : `cnfans-stripe-live-checkout:${orderNumber}`;
}

/** Create a minimal, server-authorized Hosted Checkout Session for Test or Live mode. */
export async function createStripeBankTransferCheckout(
  order: AuthorizedWorkerOrder,
  mode: StripeRealMode,
  localOrigin?: string,
) {
  const stripe = getStripeClient(mode);
  const orderNumber = order.order_number.trim();
  const email = order.email.trim().toLowerCase();
  const amountMinor = getOrderAmountMinor(order, mode);
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("The saved order reference or email is invalid.");
  }

  // Stripe receives only the saved order email. Test and Live Customers use
  // separate deterministic keys and are isolated by Stripe's account mode.
  const customer = await stripe.customers.create(
    { email },
    { idempotencyKey: stripeCustomerIdempotencyKey(orderNumber, mode) },
  );
  const expectedLivemode = mode === "live";
  if (customer.livemode !== expectedLivemode) throw new Error(`Stripe returned a Customer outside ${mode} mode.`);

  const returnUrls = buildReturnUrls(mode, orderNumber, localOrigin);
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer: customer.id,
    line_items: [{
      price_data: {
        currency: order.currency.toLowerCase(),
        product_data: { name: "Order payment" },
        unit_amount: amountMinor,
      },
      quantity: 1,
    }],
    client_reference_id: orderNumber,
    success_url: returnUrls.successUrl,
    cancel_url: returnUrls.cancelUrl,
  };

  // Do not pass payment-method overrides: Stripe uses Dashboard Dynamic
  // Payment Methods for both Sandbox and Live.
  const session = await stripe.checkout.sessions.create(sessionParams, {
    idempotencyKey: stripeCheckoutIdempotencyKey(orderNumber, mode),
  });

  if (
    session.livemode !== expectedLivemode
    || session.mode !== "payment"
    || session.amount_total !== amountMinor
    || session.currency !== order.currency.toLowerCase()
    || session.client_reference_id !== orderNumber
    || !session.url
    || !isStripeHostedCheckoutUrl(session.url)
    || !isStripeSessionIdForMode(session.id, mode)
  ) {
    throw new Error(`Stripe returned a Checkout Session that does not match the saved ${mode} order.`);
  }

  const successReturnUrl = new URL(returnUrls.successUrl);
  successReturnUrl.searchParams.set("session_id", session.id);
  return {
    checkoutUrl: session.url,
    successReturnUrl: successReturnUrl.toString(),
    sessionId: session.id,
    livemode: session.livemode,
    amountTotal: session.amount_total,
    currency: session.currency,
    clientReferenceId: session.client_reference_id,
    paymentMethodTypes: session.payment_method_types,
  };
}

/** Existing local Sandbox entry point retained to keep callers and test flow stable. */
export function createLocalStripeTestCheckout(order: AuthorizedWorkerOrder, origin: string) {
  return createStripeBankTransferCheckout(order, "test", origin);
}

export type StripeSessionSummary = {
  id: string;
  livemode: boolean;
  mode: "payment";
  currency: string;
  amountTotal: number;
  clientReferenceId: string;
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
};

export class StripeSessionOrderMismatchError extends Error {
  constructor() {
    super("Stripe session does not match the saved order.");
    this.name = "StripeSessionOrderMismatchError";
  }
}

export async function retrieveStripeSessionSummary(
  sessionId: string,
  order: AuthorizedWorkerOrder,
  mode: StripeRealMode,
): Promise<StripeSessionSummary> {
  if (!isStripeSessionIdForMode(sessionId, mode)) throw new StripeSessionOrderMismatchError();
  let amountMinor: number;
  try {
    amountMinor = getOrderAmountMinor(order, mode);
  } catch {
    throw new StripeSessionOrderMismatchError();
  }
  const session = await getStripeClient(mode).checkout.sessions.retrieve(sessionId);
  const expectedLivemode = mode === "live";

  if (
    session.id !== sessionId
    || session.livemode !== expectedLivemode
    || session.mode !== "payment"
    || session.currency !== order.currency.toLowerCase()
    || session.amount_total !== amountMinor
    || session.client_reference_id !== order.order_number
    || !isStripePaymentStatus(session.payment_status)
    || !isStripeCheckoutStatus(session.status)
  ) {
    throw new StripeSessionOrderMismatchError();
  }

  return {
    id: session.id,
    livemode: expectedLivemode,
    mode: "payment",
    currency: session.currency,
    amountTotal: session.amount_total,
    clientReferenceId: session.client_reference_id,
    paymentStatus: session.payment_status,
    status: session.status,
  };
}

/** Existing local Sandbox entry point retained for current tests and callers. */
export function retrieveLocalStripeTestSessionSummary(sessionId: string, order: AuthorizedWorkerOrder) {
  return retrieveStripeSessionSummary(sessionId, order, "test");
}

function isStripeSessionIdForMode(sessionId: string, mode: StripeRealMode) {
  return mode === "test"
    ? /^cs_test_[A-Za-z0-9]+$/.test(sessionId)
    : /^cs_live_[A-Za-z0-9]+$/.test(sessionId);
}

function isStripePaymentStatus(value: string): value is StripeSessionSummary["paymentStatus"] {
  return value === "paid" || value === "unpaid" || value === "no_payment_required";
}

function isStripeCheckoutStatus(value: Stripe.Checkout.Session.Status | null): value is StripeSessionSummary["status"] {
  return value === "open" || value === "complete" || value === "expired";
}

function isLoopbackHostname(hostname: string) {
  const normalisedHostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return new Set(["localhost", "127.0.0.1", "::1"]).has(normalisedHostname);
}

export function isStripeHostedCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com" && url.pathname.startsWith("/c/");
  } catch {
    return false;
  }
}
