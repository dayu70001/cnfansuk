export type CurrencyCode = "GBP" | "EUR" | "USD";

export const CURRENCY_STORAGE_KEY = "cnfans_currency";

export const currencySymbols: Record<CurrencyCode, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

export const currencies: CurrencyCode[] = ["GBP", "EUR", "USD"];

export function normaliseCurrency(value: string | null | undefined): CurrencyCode {
  if (value === "EUR" || value === "€") return "EUR";
  if (value === "USD" || value === "$") return "USD";
  return "GBP";
}
