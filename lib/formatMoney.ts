import type { CurrencyCode } from "./currency";

export function formatMoney(amount: number, currency: CurrencyCode = "GBP") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}
