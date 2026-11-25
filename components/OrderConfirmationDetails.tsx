"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { BlackFridayOrderOffer } from "@/components/BlackFridayOrderOffer";
import { blackFridayClaimMessage, isBlackFridayOrderEligible } from "@/lib/blackFriday";
import { formatMoney } from "@/lib/formatMoney";
import type { CurrencyCode } from "@/lib/currency";
import { getOrderAccessTokenStorageKey } from "@/lib/orderAccessTokenKey";
import { getOrderPaymentStage, orderPaymentStageLabel } from "@/lib/orderStatus";
import { buildPersonalWhatsAppLink } from "@/lib/personalWhatsAppLink";

type ConfirmationOrder = {
  orderNumber: string;
  createdAt?: string | null;
  status: string;
  paymentStage?: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: CurrencyCode;
  shippingMethod: string;
  shippingEstimate: string;
  lastMileCarrier?: string | null;
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
  personalWhatsappUrl,
  useLegacyConfirmationCookie = false,
}: {
  orderNumber: string;
  personalWhatsappUrl: string;
  useLegacyConfirmationCookie?: boolean;
}) {
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      let accessToken = "";
      if (!useLegacyConfirmationCookie) {
        try {
          accessToken = window.sessionStorage.getItem(getOrderAccessTokenStorageKey(orderNumber)) || "";
        } catch {
          accessToken = "";
        }
      }
      if (!active) return;
      if (!useLegacyConfirmationCookie && !accessToken) {
        setUnavailable(true);
        return;
      }
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/confirmation`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: useLegacyConfirmationCookie ? {} : { "X-Order-Access-Token": accessToken },
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
  }, [orderNumber, useLegacyConfirmationCookie]);

  const eligible = order !== null && isBlackFridayOrderEligible(order);
  const message = eligible
    ? blackFridayClaimMessage(orderNumber)
    : `Hi, I'd like to confirm my order #${orderNumber}.`;
  const whatsappHref = buildPersonalWhatsAppLink({ personalWhatsappUrl }, message);
  const whatsappAction = whatsappHref ? (
    <MetaPixelEventLink
      className={eligible ? "bf-claim-button" : "chan success-whatsapp"}
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      eventName="CheckoutWhatsAppContact"
      eventParams={{
        source_page: "order_success",
        placement: eligible ? "black_friday_discount_claim" : "order_success_whatsapp",
        button_label: eligible ? "Claim My Discount" : "Confirm order on WhatsApp",
        destination: "whatsapp_personal",
        order_number: orderNumber,
      }}
      recordWhatsappClickForOrder={orderNumber}
    >
      {eligible ? "Claim My Discount" : "Confirm order on WhatsApp"}
    </MetaPixelEventLink>
  ) : null;

  if (unavailable) {
    return <>
      <div className="success-actions">{whatsappAction}<Link className="chan success-track" href="/track-order">Track order →</Link></div>
      <p className="success-unavailable">Order details are no longer available in this browser. Please use your order number when contacting us.</p>
    </>;
  }
  if (!order) return <p className="success-loading">Loading your order summary…</p>;

  return (
    <div className="order-confirmation-details">
      <p className="success-payment-status">{order.paymentStage
        ? orderPaymentStageLabel(order.paymentStage as ReturnType<typeof getOrderPaymentStage>, "en")
        : orderPaymentStageLabel(getOrderPaymentStage({ status: order.status }), "en")}</p>
      {eligible ? <BlackFridayOrderOffer>{whatsappAction}</BlackFridayOrderOffer>
        : <div className="success-actions">{whatsappAction}</div>}
      <div className="success-actions bf-order-track"><Link className="chan success-track" href="/track-order">Track order →</Link></div>
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
        <p className="confirmation-delivery-note">{[order.shippingMethod, order.shippingEstimate, order.lastMileCarrier ? `Last-mile carrier: ${order.lastMileCarrier}` : ""].filter(Boolean).join(" · ")}</p>
      </section>
    </div>
  );
}
