"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  LOCAL_STRIPE_FALLBACK_STORAGE_KEY,
  parseLocalStripeFallback,
} from "@/lib/stripeCheckoutHandoff";

export function StripeBankTransferFallback({ sessionId }: { sessionId: string | undefined }) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
  }, []);
  const getSnapshot = useCallback(() => {
    if (!sessionId) return "";
    try {
      const serialized = window.sessionStorage.getItem(LOCAL_STRIPE_FALLBACK_STORAGE_KEY);
      return parseLocalStripeFallback(serialized, sessionId) || "";
    } catch {
      // The order status and WhatsApp path remain available if storage is disabled.
      return "";
    }
  }, [sessionId]);
  const checkoutUrl = useSyncExternalStore(subscribe, getSnapshot, () => "");

  if (!checkoutUrl) return null;

  return (
    <section className="stripe-bank-transfer-fallback" aria-live="polite">
      <p>Pop-ups were blocked. Your secure Stripe bank transfer page is ready.</p>
      <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="stripe-bank-transfer-fallback-link">
        Open Bank Transfer
      </a>
    </section>
  );
}
