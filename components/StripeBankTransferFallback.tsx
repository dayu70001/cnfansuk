"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getLocalStripeFallbackStorageKey,
  parseLocalStripeFallback,
  shouldShowLocalStripeFallback,
} from "@/lib/stripeCheckoutHandoff";
import type { StripeHandoffMode } from "@/lib/stripeCheckoutHandoff";

export function StripeBankTransferFallback({
  orderNumber,
  sessionId,
  paymentStatus,
  mode,
}: {
  orderNumber: string;
  sessionId: string;
  paymentStatus: string;
  mode: StripeHandoffMode;
}) {
  const storageKey = getLocalStripeFallbackStorageKey(orderNumber);
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
  }, []);
  const getSnapshot = useCallback(() => {
    if (!storageKey || !sessionId) return "";
    try {
      const serialized = window.sessionStorage.getItem(storageKey);
      return parseLocalStripeFallback(serialized, sessionId, orderNumber, mode) || "";
    } catch {
      // The order status and WhatsApp path remain available if storage is disabled.
      return "";
    }
  }, [mode, orderNumber, sessionId, storageKey]);
  const checkoutUrl = useSyncExternalStore(subscribe, getSnapshot, () => "");

  if (!shouldShowLocalStripeFallback(paymentStatus, checkoutUrl || null)) return null;

  return <div className="stripe-bank-transfer-fallback">
    <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="stripe-bank-transfer-fallback-link">
      Open Bank Transfer
    </a>
  </div>;
}
