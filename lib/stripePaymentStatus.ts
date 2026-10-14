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
      label: "Payment received",
      message: "Your payment has been confirmed. Please confirm your order details with us on WhatsApp.",
      tone: "received" as const,
    };
  }

  if (paymentStatus === "unpaid") {
    return {
      label: "Payment not yet confirmed",
      message: "Stripe has not confirmed this payment yet. If you have just completed payment, please wait a moment and check again.",
      tone: "waiting" as const,
    };
  }

  return {
    label: "No payment required",
    message: "No payment is required for this Stripe session.",
    tone: "neutral" as const,
  };
}
