"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/formatMoney";
import { getOrderAccessTokenStorageKey } from "@/lib/orderAccessTokenKey";

type ConfirmationOrder = {
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: "GBP";
  shippingMethod: string;
  shippingEstimate: string;
  customer: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    countryName: string;
  } | null;
  items: Array<{
    productCode: string;
    title: string;
    size: string;
    color: string | null;
    quantity: number;
    lineTotal: number;
  }>;
};

export function OrderConfirmationDetails({
  orderNumber,
  localMockTotal,
}: {
  orderNumber: string;
  localMockTotal?: number;
}) {
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (localMockTotal !== undefined) return;
    let active = true;
    void Promise.resolve().then(async () => {
      let accessToken = "";
      try {
        accessToken = window.sessionStorage.getItem(getOrderAccessTokenStorageKey(orderNumber)) || "";
      } catch {
        accessToken = "";
      }
      if (!active) return;
      if (!accessToken) {
        setUnavailable(true);
        return;
      }
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/confirmation`, {
          cache: "no-store",
          headers: { "X-Order-Access-Token": accessToken },
        });
        const result = response.ok ? await response.json() as { order?: ConfirmationOrder } : null;
        if (!active) return;
        if (result?.order) setOrder(result.order);
        else setUnavailable(true);
      } catch {
        if (active) setUnavailable(true);
      }
    });
    return () => { active = false; };
  }, [localMockTotal, orderNumber]);

  if (localMockTotal !== undefined) {
    return (
      <div className="order-confirmation-details">
        <section className="confirmation-card" aria-label="Local demo order summary">
          <p className="eyebrow">Local demo summary</p>
          <div className="confirmation-item"><span>Example clothing item · Size M · Qty 1</span><strong>{formatMoney(localMockTotal, "GBP")}</strong></div>
          <div className="confirmation-total-row"><span>Subtotal and delivery</span><strong>{formatMoney(localMockTotal, "GBP")}</strong></div>
          <div className="confirmation-total-row confirmation-grand-total"><span>Demo total</span><strong>{formatMoney(localMockTotal, "GBP")}</strong></div>
        </section>
        <section className="confirmation-card" aria-label="Local demo delivery details">
          <p className="eyebrow">Delivery details</p>
          <p>Fictional local-test details only. No customer address or order has been sent or saved.</p>
        </section>
      </div>
    );
  }

  if (unavailable) {
    return <p className="success-unavailable">Order details are no longer available in this browser. Please use your order number when contacting us.</p>;
  }
  if (!order) return <p className="success-loading">Loading your order summary…</p>;

  return (
    <div className="order-confirmation-details">
      <section className="confirmation-card" aria-label="Order summary">
        <p className="eyebrow">Order summary</p>
        {order.items.map((item) => (
          <div className="confirmation-item" key={`${item.productCode}-${item.size}-${item.color || ""}`}>
            <span>{[item.title, item.color, `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}</span>
            <strong>{formatMoney(item.lineTotal, order.currency)}</strong>
          </div>
        ))}
        <div className="confirmation-total-row"><span>Subtotal</span><strong>{formatMoney(order.subtotal, order.currency)}</strong></div>
        <div className="confirmation-total-row"><span>Delivery</span><strong>{order.shippingFee === 0 ? "Free" : formatMoney(order.shippingFee, order.currency)}</strong></div>
        <div className="confirmation-total-row confirmation-grand-total"><span>Total</span><strong>{formatMoney(order.total, order.currency)}</strong></div>
      </section>
      <section className="confirmation-card" aria-label="Delivery address">
        <p className="eyebrow">Delivery address</p>
        {order.customer ? (
          <>
            <p>{order.customer.name}</p>
            <p>{[order.customer.addressLine1, order.customer.addressLine2, order.customer.city, order.customer.county, order.customer.postcode, order.customer.countryName].filter(Boolean).join(", ")}</p>
          </>
        ) : <p>Delivery details are no longer available in this browser.</p>}
        <p className="confirmation-delivery-note">{[order.shippingMethod, order.shippingEstimate].filter(Boolean).join(" · ")}</p>
      </section>
    </div>
  );
}
