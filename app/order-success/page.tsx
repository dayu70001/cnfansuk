import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderConfirmationDetails } from "@/components/OrderConfirmationDetails";
import { OrderSuccessLead } from "@/components/OrderSuccessLead";
import { StripeBankTransferFallback } from "@/components/StripeBankTransferFallback";
import { StripePaymentStatus } from "@/components/StripePaymentStatus";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { getDirectWhatsappLinkFromSettings } from "@/lib/contactLinks";
import { getOrderPaymentStage, orderPaymentStageLabel } from "@/lib/orderStatus";
import { fetchSiteSettings } from "@/lib/siteSettings";
import {
  isLocalStripeBankTransferMockEnabled,
  isLocalStripeBankTransferTestEnabled,
} from "@/lib/payments/stripeBankTransfer";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; payment?: string; amount?: string; session_id?: string }>;
}) {
  const { order = "CNF-UK-10023", payment, amount, session_id: sessionId } = await searchParams;
  if (payment === "mock" && !isLocalStripeBankTransferMockEnabled()) notFound();
  const isStripeTestReturn = payment === "stripe_test";
  if (isStripeTestReturn && (
    !isLocalStripeBankTransferTestEnabled()
    || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(order)
    || !/^cs_test_[A-Za-z0-9]+$/.test(sessionId || "")
  )) notFound();

  const amountMinor = Number(amount);
  const localMockTotal = isLocalStripeBankTransferMockEnabled()
    && payment === "mock"
    && order === "LOCAL-CNF-TEST"
    && Number.isSafeInteger(amountMinor)
    && amountMinor > 0
    ? amountMinor / 100
    : undefined;
  const settings = await fetchSiteSettings();
  const whatsappUrl = getOrderConfirmationWhatsappUrl(settings, order);

  return (
    <section className="success-wrap">
      {localMockTotal === undefined ? <OrderSuccessLead order={order} /> : null}
      <div className="success-check" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </div>
      <h1>{localMockTotal === undefined ? "Order placed" : "Returned to CNFANS"}</h1>
      <p className="success-order-number" title={`#${order}`}>Order #{order}</p>
      {isStripeTestReturn ? (
        <StripePaymentStatus
          order={order}
          sessionId={sessionId!}
          initialPaymentStatus="unpaid"
        />
      ) : (
        <p className="success-payment-status">
          {localMockTotal === undefined
            ? orderPaymentStageLabel(getOrderPaymentStage({ status: "payment_submitted" }), "en")
            : "Bank transfer pending — waiting for payment confirmation"}
        </p>
      )}
      <p className="success-copy success-order-note">
        We&apos;ll verify your order with you on WhatsApp before processing.
      </p>

      <div className="success-actions">
        <MetaPixelEventLink
          className="chan success-whatsapp"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          eventName="CheckoutWhatsAppContact"
          eventParams={{
            source_page: "order_success",
            placement: "order_success_whatsapp",
            button_label: "Confirm order on WhatsApp",
            destination: "whatsapp_personal",
            order_number: order,
          }}
          {...(localMockTotal === undefined ? { recordWhatsappClickForOrder: order } : {})}
        >
          <span className="success-whatsapp-icon" aria-hidden="true">
            <WhatsappIcon />
          </span>
          Confirm order on WhatsApp
        </MetaPixelEventLink>
        <Link className="chan success-track" href="/track-order">Track order →</Link>
      </div>

      <StripeBankTransferFallback sessionId={isStripeTestReturn ? sessionId : undefined} />

      <OrderConfirmationDetails orderNumber={order} localMockTotal={localMockTotal} />

      <Link href="/" className="success-link">
        Continue shopping →
      </Link>
    </section>
  );
}

function WhatsappIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.52 15.27L2 22l4.86-1.27A10 10 0 1 0 12 2Zm0 18.13a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-2.88.76.77-2.81-.19-.29A8.13 8.13 0 1 1 12 20.13Zm4.46-6.09c-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.24-.01-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2.01 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function getOrderConfirmationWhatsappUrl(settings: Awaited<ReturnType<typeof fetchSiteSettings>>, orderNumber: string) {
  const baseUrl = getDirectWhatsappLinkFromSettings(settings);
  const message = `Hi, I'd like to confirm my order #${orderNumber}.`;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("text", message);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
  }
}
