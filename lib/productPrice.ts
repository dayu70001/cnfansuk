import type { CurrencyCode } from "./currency";
import type { Product } from "./types";

export function getProductPrice(product: Product, currency: CurrencyCode = "GBP") {
  if (currency === "EUR") return product.priceEUR || product.priceGBP * 9 / 8;
  if (currency === "USD") return product.priceUSD || product.priceGBP * 9 / 7;
  return product.priceGBP;
}
