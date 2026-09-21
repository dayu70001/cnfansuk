"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/formatMoney";

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
  };
  items: Array<{
    productCode: string;
    title: string;
    size: string;
    color: string | null;
    quantity: number;
    lineTotal: number;
  }>;
};

export function OrderConfirmationDetails({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, { cache: "no-store" })
      .then((response) => response.ok
        ? response.json() as Promise<{ order?: ConfirmationOrder }>
        : null)
      .then((result) => {
        if (active && result?.order) setOrder(result.order);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [orderNumber]);

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
        <p>{order.customer.name}</p>
        <p>{[order.customer.addressLine1, order.customer.addressLine2, order.customer.city, order.customer.county, order.customer.postcode, order.customer.countryName].filter(Boolean).join(", ")}</p>
        <p className="confirmation-delivery-note">{order.shippingMethod} · {order.shippingEstimate}</p>
      </section>
    </div>
  );
}
