import type { CurrencyCode } from "./currency";

// Both boundaries fall in GMT in Europe/London; the end is exclusive.
export const BLACK_FRIDAY = {
  id: "black-friday-week-2026",
  enabled: true,
  startMs: Date.parse("2026-11-24T00:00:00Z"),
  endMs: Date.parse("2026-12-01T00:00:00Z"),
  baseDiscount: 5,
  tiers: [
    { spend: 100, extra: 5 },
    { spend: 200, extra: 10 },
    { spend: 300, extra: 20 },
  ],
  currencies: ["GBP", "EUR"] as const,
} as const;

export function isBlackFridayActiveAt(nowMs: number): boolean {
  return BLACK_FRIDAY.enabled && nowMs >= BLACK_FRIDAY.startMs && nowMs < BLACK_FRIDAY.endMs;
}

export function parseOrderCreatedAt(value: string | null | undefined): number | null {
  if (!value) return null;
  // D1 CURRENT_TIMESTAMP uses a UTC SQLite timestamp without a zone suffix.
  const normalized = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

export function isBlackFridayOrderEligible(order: {
  createdAt?: string | null;
  currency?: CurrencyCode | null;
  status?: string | null;
  paymentStage?: string | null;
}): boolean {
  const createdMs = parseOrderCreatedAt(order.createdAt);
  return createdMs !== null
    && isBlackFridayActiveAt(createdMs)
    && (order.currency === "GBP" || order.currency === "EUR")
    && (!order.status || order.status === "pending" || order.status === "awaiting_payment")
    && (order.paymentStage === "created" || order.paymentStage === "awaiting_payment"
      || (!order.paymentStage && (order.status === "pending" || order.status === "awaiting_payment")));
}

export function blackFridayDiscount(merchandiseSubtotal: number, currency: CurrencyCode): number {
  if (!BLACK_FRIDAY.currencies.includes(currency as "GBP" | "EUR") || merchandiseSubtotal <= 0) return 0;
  const highestTier = [...BLACK_FRIDAY.tiers].reverse().find(({ spend }) => merchandiseSubtotal >= spend);
  return Math.min(merchandiseSubtotal, BLACK_FRIDAY.baseDiscount + (highestTier?.extra || 0));
}

export function blackFridayClaimMessage(orderNumber: string): string {
  const normalizedOrderNumber = orderNumber.replace(/^#+/, "");
  return `Hi, I've just placed order #${normalizedOrderNumber} and would like to claim my Black Friday discount. Could you please confirm my final total before payment? Thank you!`;
}
