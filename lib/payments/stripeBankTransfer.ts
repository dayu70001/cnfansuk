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

export type StripeBankTransferMode = "mock" | "test" | "disabled";

export const LOCAL_STRIPE_TEST_FIXTURE = {
  orderNumber: "LOCAL-CNF-TEST",
  amountMinor: 5700,
  currency: "GBP",
  customerEmail: "stripe-test@example.com",
  lineItemName: "Order payment",
} as const;

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

export const stripeBankTransferAsyncEvents = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
] as const;

export function getLocalStripeBankTransferMode(env: NodeJS.ProcessEnv = process.env): StripeBankTransferMode {
  if (env.NODE_ENV !== "development") return "disabled";
  if (env.STRIPE_BANK_TRANSFER_MODE === "mock") return "mock";
  if (env.STRIPE_BANK_TRANSFER_MODE === "test" && env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) return "test";
  return "disabled";
}

export function isLocalStripeBankTransferMockEnabled() {
  return getLocalStripeBankTransferMode() === "mock";
}

export function isLocalStripeBankTransferTestEnabled() {
  return getLocalStripeBankTransferMode() === "test";
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
