export type StripePaymentStatus = "paid" | "unpaid" | "no_payment_required";
export type StripeCheckoutStatus = "open" | "complete" | "expired";

export function isStripePaymentStatus(value: unknown): value is StripePaymentStatus {
  return value === "paid" || value === "unpaid" || value === "no_payment_required";
}

export function isStripeCheckoutStatus(value: unknown): value is StripeCheckoutStatus {
  return value === "open" || value === "complete" || value === "expired";
}

export function getStripePaymentStatusPresentation(paymentStatus: StripePaymentStatus) {
  if (paymentStatus === "paid") {
    return {
      label: "Bank transfer received",
      message: "Your transfer has been received. Please confirm your order details with us on WhatsApp.",
      tone: "received" as const,
    };
  }

  if (paymentStatus === "unpaid") {
    return {
      label: "Waiting for bank transfer confirmation",
      message: "Bank transfers can take a little time to appear. Return here after completing the transfer.",
      tone: "waiting" as const,
    };
  }

  return {
    label: "No payment confirmation available",
    message: "This session has not confirmed a bank transfer. Please contact us on WhatsApp so we can check.",
    tone: "neutral" as const,
  };
}
