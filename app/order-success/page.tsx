import Link from "next/link";
import { OrderConfirmationDetails } from "@/components/OrderConfirmationDetails";
import { OrderSuccessLead } from "@/components/OrderSuccessLead";
import { getDirectWhatsappLinkFromSettings } from "@/lib/contactLinks";
import { fetchSiteSettings } from "@/lib/siteSettings";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; payment?: string }>;
}) {
  const { order = "CNF-UK-10023", payment } = await searchParams;
  const useLegacyConfirmationCookie = payment === "stripe_live";
  const settings = await fetchSiteSettings();
  const whatsappUrl = getDirectWhatsappLinkFromSettings(settings);

  return (
    <section className="success-wrap">
      <OrderSuccessLead order={order} />
      <div className="success-check" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </div>
      <h1>Order placed</h1>
      <p className="success-order-number" title={`#${order}`}>Order #{order}</p>
      <p className="success-copy success-order-note">
        We&apos;ll verify your order with you on WhatsApp before processing.
      </p>

      <OrderConfirmationDetails
        orderNumber={order}
        personalWhatsappUrl={whatsappUrl}
        useLegacyConfirmationCookie={useLegacyConfirmationCookie}
      />

      <Link href="/" className="success-link">
        Continue shopping →
      </Link>
    </section>
  );
}
