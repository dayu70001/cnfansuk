import "server-only";
import Stripe from "stripe";
import {
  isLocalStripeBankTransferTestEnabled,
  LOCAL_STRIPE_TEST_FIXTURE,
} from "@/lib/payments/stripeBankTransfer";

let stripeClient: Stripe | null = null;

function getStripeTestClient(): Stripe {
  if (!isLocalStripeBankTransferTestEnabled()) throw new Error("Stripe Test Mode is disabled.");

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) throw new Error("Stripe Test Mode is not configured.");

  stripeClient ??= new Stripe(secretKey, { maxNetworkRetries: 0, timeout: 15_000 });
  return stripeClient;
}

const LOCAL_SUCCESS_URL =
  "http://localhost:4000/order-success?order=LOCAL-CNF-TEST&payment=stripe_test&session_id={CHECKOUT_SESSION_ID}";
const LOCAL_CANCEL_URL = "http://localhost:4000/checkout?payment=stripe_cancelled";

export async function createLocalStripeTestCheckout() {
  const stripe = getStripeTestClient();

  const matchingCustomers = await stripe.customers.list({
    email: LOCAL_STRIPE_TEST_FIXTURE.customerEmail,
    limit: 100,
  });
  const customer = matchingCustomers.data.find((candidate) => candidate.livemode === false)
    ?? await stripe.customers.create({ email: LOCAL_STRIPE_TEST_FIXTURE.customerEmail });
  if (customer.livemode !== false) throw new Error("Stripe returned a non-test customer.");

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer: customer.id,
    line_items: [{
      price_data: {
        currency: "gbp",
        product_data: { name: LOCAL_STRIPE_TEST_FIXTURE.lineItemName },
        unit_amount: LOCAL_STRIPE_TEST_FIXTURE.amountMinor,
      },
      quantity: 1,
    }],
    client_reference_id: LOCAL_STRIPE_TEST_FIXTURE.orderNumber,
    success_url: LOCAL_SUCCESS_URL,
    cancel_url: LOCAL_CANCEL_URL,
  };
  const session = await stripe.checkout.sessions.create(sessionParams);

  if (
    session.livemode !== false
    || session.amount_total !== LOCAL_STRIPE_TEST_FIXTURE.amountMinor
    || session.currency !== "gbp"
    || session.client_reference_id !== LOCAL_STRIPE_TEST_FIXTURE.orderNumber
    || !session.url
    || !isStripeHostedCheckoutUrl(session.url)
  ) {
    throw new Error("Stripe returned a Checkout Session outside the approved test fixture.");
  }

  return {
    checkoutUrl: session.url,
    livemode: session.livemode,
    paymentMethodTypes: session.payment_method_types,
  };
}

export type StripeTestSessionSummary = {
  id: string;
  livemode: false;
  mode: "payment";
  currency: "gbp";
  amountTotal: 5700;
  clientReferenceId: "LOCAL-CNF-TEST";
  paymentStatus: string;
  status: string;
  hasCustomer: boolean;
  hasCustomerBalance: boolean;
};

export async function retrieveLocalStripeTestSessionSummary(sessionId: string): Promise<StripeTestSessionSummary> {
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) throw new Error("Invalid Stripe Test Checkout Session id.");
  const session = await getStripeTestClient().checkout.sessions.retrieve(sessionId);

  if (
    session.livemode !== false
    || session.mode !== "payment"
    || session.currency !== "gbp"
    || session.amount_total !== LOCAL_STRIPE_TEST_FIXTURE.amountMinor
    || session.client_reference_id !== LOCAL_STRIPE_TEST_FIXTURE.orderNumber
  ) {
    throw new Error("Stripe session does not match the local test fixture.");
  }

  return {
    id: session.id,
    livemode: false,
    mode: "payment",
    currency: "gbp",
    amountTotal: 5700,
    clientReferenceId: "LOCAL-CNF-TEST",
    paymentStatus: session.payment_status,
    status: session.status || "unknown",
    hasCustomer: Boolean(session.customer),
    hasCustomerBalance: session.payment_method_types.includes("customer_balance"),
  };
}

export function isStripeHostedCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com" && url.pathname.startsWith("/c/");
  } catch {
    return false;
  }
}
