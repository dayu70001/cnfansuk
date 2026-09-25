import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { getOrderAccessTokenFromCookieHeader } from "@/lib/orderAccessTokenCookie";
import { getDirectWhatsappLinkFromSettings } from "@/lib/contactLinks";
import { loadAuthorizedOrder } from "@/lib/authorizedOrder";
import {
  getStripeBankTransferMode,
  isLocalStripeBankTransferTestEnabled,
  isStripeLiveBankTransferEnabled,
} from "@/lib/payments/stripeBankTransfer";
import { fetchSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StripePaymentProcessingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  if (typeof order !== "string" || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(order)) notFound();

  const mode = getStripeBankTransferMode();
  const requestHeaders = await headers();
  if (!isAllowedProcessingRequest(mode, requestHeaders.get("host"), requestHeaders.get("x-forwarded-proto"))) {
    notFound();
  }

  const accessToken = getOrderAccessTokenFromCookieHeader(requestHeaders.get("cookie"), order, "processing");
  if (!accessToken) notFound();

  const loadedOrder = await loadAuthorizedOrder(order, accessToken);
  if (!loadedOrder.ok || loadedOrder.order.order_number !== order) notFound();

  const settings = await fetchSiteSettings();
  const whatsappUrl = getOrderConfirmationWhatsappUrl(settings, order);

  return (
    <section className="success-wrap payment-processing-wrap">
      <h1>Payment processing</h1>
      <p className="success-order-number" title={"#" + order}>Order #{order}</p>
      <p className="success-payment-status payment-processing-status">Waiting for payment confirmation.</p>
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
          recordWhatsappClickForOrder={order}
        >
          Confirm order on WhatsApp
        </MetaPixelEventLink>
      </div>
    </section>
  );
}

function isAllowedProcessingRequest(
  mode: ReturnType<typeof getStripeBankTransferMode>,
  host: string | null,
  protocol: string | null,
) {
  if (mode === "live") {
    return isStripeLiveBankTransferEnabled()
      && host?.toLowerCase() === "www.cnfans.co.uk"
      && protocol?.split(",")[0].trim().toLowerCase() === "https";
  }
  if (mode === "test") {
    return isLocalStripeBankTransferTestEnabled() && isLoopbackHost(host);
  }
  return false;
}

function isLoopbackHost(host: string | null) {
  if (!host) return false;
  try {
    const hostname = new URL("http://" + host).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return new Set(["localhost", "127.0.0.1", "::1"]).has(hostname);
  } catch {
    return false;
  }
}

function getOrderConfirmationWhatsappUrl(settings: Awaited<ReturnType<typeof fetchSiteSettings>>, orderNumber: string) {
  const baseUrl = getDirectWhatsappLinkFromSettings(settings);
  const message = "Hi, I'd like to confirm my order #" + orderNumber + ".";
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("text", message);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return baseUrl + separator + "text=" + encodeURIComponent(message);
  }
}
