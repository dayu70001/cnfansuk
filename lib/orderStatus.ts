export type RawOrderStatus =
  | "pending"
  | "awaiting_payment"
  | "payment_submitted"
  | "payment_confirmed"
  | "confirmed"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export type OrderPaymentStage =
  | "created"
  | "awaiting_payment"
  | "payment_submitted"
  | "payment_confirmed"
  | "cancelled";

export type OrderPaymentEvents = {
  status?: string | null;
  payment_page_viewed_at?: string | null;
  transfer_submitted_at?: string | null;
  payment_confirmed_at?: string | null;
};

const CONFIRMED_STATUSES = new Set([
  "payment_confirmed",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "completed",
]);

/**
 * Derive the customer-facing payment stage from immutable event timestamps
 * first, with legacy status values retained as a compatibility fallback.
 */
export function getOrderPaymentStage(order: OrderPaymentEvents): OrderPaymentStage {
  const status = order.status || "";
  if (status === "cancelled") return "cancelled";
  if (order.payment_confirmed_at || CONFIRMED_STATUSES.has(status)) return "payment_confirmed";
  if (order.transfer_submitted_at || status === "payment_submitted") return "payment_submitted";
  if (order.payment_page_viewed_at || status === "awaiting_payment") return "awaiting_payment";
  return "created";
}

export const orderPaymentStageLabels = {
  en: {
    created: "Order created",
    awaiting_payment: "Awaiting payment",
    payment_submitted: "Payment submitted",
    payment_confirmed: "Payment confirmed",
    cancelled: "Cancelled",
  },
  zh: {
    created: "未进入付款页",
    awaiting_payment: "待付款",
    payment_submitted: "已提交转账",
    payment_confirmed: "已确认到账",
    cancelled: "已取消",
  },
} as const;

export function orderPaymentStageLabel(stage: OrderPaymentStage, locale: "en" | "zh" = "en") {
  return orderPaymentStageLabels[locale][stage];
}
