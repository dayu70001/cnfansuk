"use client";

import { useCurrency } from "@/lib/useCurrency";
import { useBlackFridayActive } from "./useBlackFridayActive";

export function BlackFridayCartNotice() {
  const active = useBlackFridayActive();
  const { currency, ready } = useCurrency();
  if (!active || !ready || currency === "USD") return null;

  return (
    <div className="bf-cart-notice">
      <strong>Black Friday Savings</strong>
      <p>Get {currency === "EUR" ? "€" : "£"}5 off with no minimum spend, plus extra savings on larger orders.</p>
      <small>Submit your order and claim your discount on WhatsApp before payment.</small>
    </div>
  );
}
