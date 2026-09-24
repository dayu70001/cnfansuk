"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOrderAccessTokenStorageKey } from "@/lib/orderAccessTokenKey";
import {
  getStripePaymentStatusPresentation,
  isStripeCheckoutStatus,
  isStripePaymentStatus,
  type StripePaymentStatus as PaymentStatus,
} from "@/lib/stripePaymentStatus";

export function StripePaymentStatus({
  order,
  sessionId,
  initialPaymentStatus,
}: {
  order: string;
  sessionId: string;
  initialPaymentStatus: PaymentStatus;
}) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialPaymentStatus);
  const [refreshError, setRefreshError] = useState("");
  const orderAccessToken = readOrderAccessToken(order);
  const lastRequestAt = useRef(0);
  const requestInFlight = useRef(false);

  const refreshStatus = useCallback(async () => {
    if (requestInFlight.current) return;
    if (!orderAccessToken) {
      setRefreshError("Order access is unavailable in this browser. Please use your order number when contacting us.");
      return;
    }
    const now = Date.now();
    if (now - lastRequestAt.current < 750) return;

    requestInFlight.current = true;
    lastRequestAt.current = now;
    setRefreshError("");
    try {
      const query = new URLSearchParams({ order, session_id: sessionId });
      const response = await fetch(`/api/payments/stripe/session-status?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json", "X-Order-Access-Token": orderAccessToken },
      });
      const result = response.ok
        ? await response.json() as { paymentStatus?: unknown; checkoutStatus?: unknown }
        : null;
      if (!result || !isStripePaymentStatus(result.paymentStatus) || !isStripeCheckoutStatus(result.checkoutStatus)) {
        throw new Error("Payment status could not be refreshed.");
      }
      setPaymentStatus(result.paymentStatus);
    } catch {
      setRefreshError("Unable to check the latest status. Please try again.");
    } finally {
      requestInFlight.current = false;
    }
  }, [order, orderAccessToken, sessionId]);

  useEffect(() => {
    if (!orderAccessToken) return;
    const initialRefresh = window.setTimeout(() => void refreshStatus(), 0);
    return () => window.clearTimeout(initialRefresh);
  }, [orderAccessToken, refreshStatus]);

  useEffect(() => {
    const onFocus = () => { void refreshStatus(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshStatus();
    };
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshStatus();
    }, 10_000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshStatus]);

  const presentation = getStripePaymentStatusPresentation(paymentStatus);

  return (
    <section className={`stripe-payment-status stripe-payment-status-${presentation.tone}`} aria-live="polite" aria-atomic="true">
      <p className="success-payment-status">{presentation.label}</p>
      {refreshError ? <p className="stripe-payment-status-error" role="status">{refreshError}</p> : null}
    </section>
  );
}

function readOrderAccessToken(order: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(getOrderAccessTokenStorageKey(order)) || "";
  } catch {
    return "";
  }
}
