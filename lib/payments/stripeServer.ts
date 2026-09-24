import "server-only";

import Stripe from "stripe";
import { isLocalStripeBankTransferTestEnabled } from "@/lib/payments/stripeBankTransfer";
import type { AuthorizedWorkerOrder } from "@/lib/authorizedOrder";

let stripeClient: Stripe | null = null;

function getStripeTestClient(): Stripe {
  if (!isLocalStripeBankTransferTestEnabled()) throw new Error("Stripe Test Mode is disabled.");

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) throw new Error("Stripe Test Mode is not configured.");

  stripeClient ??= new Stripe(secretKey, { maxNetworkRetries: 0, timeout: 15_000 });
  return stripeClient;
}

function getOrderAmountMinor(order: Pick<AuthorizedWorkerOrder, "final_total" | "currency">) {
  if (!Number.isFinite(order.final_total) || order.final_total <= 0) {
    throw new Error("The saved order total is invalid.");
  }
  const amountMinor = Math.round(order.final_total * 100);
  if (!Number.isSafeInteger(amountMinor) || Math.abs(order.final_total * 100 - amountMinor) > 0.00001) {
    throw new Error("The saved order total cannot be represented in the order currency.");
  }
  if (!(order.currency === "GBP" || order.currency === "EUR" || order.currency === "USD")) {
    throw new Error("The saved order currency is unsupported.");
  }
  return amountMinor;
}

function buildLocalReturnUrls(origin: string, orderNumber: string) {
  const baseUrl = new URL(origin);
  if (baseUrl.protocol !== "http:" || !isLoopbackHostname(baseUrl.hostname)) {
    throw new Error("Stripe Test Mode only supports a local return URL.");
  }

  const successUrl = new URL("/order-success", baseUrl);
  successUrl.searchParams.set("order", orderNumber);
  successUrl.searchParams.set("payment", "stripe_test");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL("/checkout", baseUrl);
  cancelUrl.searchParams.set("payment", "stripe_cancelled");
  return {
    successUrl: successUrl.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}"),
    cancelUrl: cancelUrl.toString(),
  };
}

export function stripeCustomerIdempotencyKey(orderNumber: string) {
  return `cnfans-stripe-customer:${orderNumber}`;
}

export function stripeCheckoutIdempotencyKey(orderNumber: string) {
  return `cnfans-stripe-checkout:${orderNumber}`;
}

export async function createLocalStripeTestCheckout(order: AuthorizedWorkerOrder, origin: string) {
  const stripe = getStripeTestClient();
  const orderNumber = order.order_number.trim();
  const email = order.email.trim().toLowerCase();
  const amountMinor = getOrderAmountMinor(order);
  if (!/^CNF-[A-Za-z0-9-]{1,72}$/.test(orderNumber) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("The saved order reference or email is invalid.");
  }

  // Stripe receives the order email only. Deterministic idempotency means a
  // retry after a lost response reuses this same test Customer.
  const customer = await stripe.customers.create(
    { email },
    { idempotencyKey: stripeCustomerIdempotencyKey(orderNumber) },
  );
  if (customer.livemode !== false) throw new Error("Stripe returned a non-test customer.");

  const returnUrls = buildLocalReturnUrls(origin, orderNumber);
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

  // No payment method override is passed: Stripe uses the Dashboard's
  // Dynamic Payment Methods configuration for this Sandbox account.
  const session = await stripe.checkout.sessions.create(sessionParams, {
    idempotencyKey: stripeCheckoutIdempotencyKey(orderNumber),
  });

  if (
    session.livemode !== false
    || session.mode !== "payment"
    || session.amount_total !== amountMinor
    || session.currency !== order.currency.toLowerCase()
    || session.client_reference_id !== orderNumber
    || !session.url
    || !isStripeHostedCheckoutUrl(session.url)
    || !/^cs_test_[A-Za-z0-9]+$/.test(session.id)
  ) {
    throw new Error("Stripe returned a Checkout Session that does not match the saved local order.");
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    livemode: session.livemode,
    amountTotal: session.amount_total,
    currency: session.currency,
    clientReferenceId: session.client_reference_id,
    paymentMethodTypes: session.payment_method_types,
  };
}

export type StripeTestSessionSummary = {
  id: string;
  livemode: false;
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

export async function retrieveLocalStripeTestSessionSummary(
  sessionId: string,
  order: AuthorizedWorkerOrder,
): Promise<StripeTestSessionSummary> {
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) throw new StripeSessionOrderMismatchError();
  const amountMinor = getOrderAmountMinor(order);
  const session = await getStripeTestClient().checkout.sessions.retrieve(sessionId);

  if (
    session.livemode !== false
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
    livemode: false,
    mode: "payment",
    currency: session.currency,
    amountTotal: session.amount_total,
    clientReferenceId: session.client_reference_id,
    paymentStatus: session.payment_status,
    status: session.status,
  };
}

function isStripePaymentStatus(value: string): value is StripeTestSessionSummary["paymentStatus"] {
  return value === "paid" || value === "unpaid" || value === "no_payment_required";
}

function isStripeCheckoutStatus(value: Stripe.Checkout.Session.Status | null): value is StripeTestSessionSummary["status"] {
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
