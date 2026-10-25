import Link from "next/link";
import { buildPersonalWhatsAppLink } from "@/lib/personalWhatsAppLink";
import { fetchSiteSettings } from "@/lib/siteSettings";

export default async function CheckoutPage() {
  const settings = await fetchSiteSettings();
  const whatsappHref = buildPersonalWhatsAppLink(
    settings.links,
    "Hi CNFans UK, I'd like help placing an order.",
  );

  return (
    <main className="wrap checkout-paused">
      <section aria-labelledby="checkout-paused-title">
        <p className="eyebrow">Customer support</p>
        <h1 id="checkout-paused-title">Online checkout is temporarily paused</h1>
        <p>To place an order or ask about an item, contact us on WhatsApp. We’ll help with the next steps.</p>
        {whatsappHref ? (
          <a className="btn btn-solid" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            Contact on WhatsApp
          </a>
        ) : (
          <p role="status">WhatsApp contact is temporarily unavailable. Please try again later.</p>
        )}
        <Link className="checkout-paused-browse" href="/">Continue browsing</Link>
      </section>
    </main>
  );
}
