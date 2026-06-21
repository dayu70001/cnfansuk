import Link from "next/link";
import { getTelegramLink, getWhatsappLink } from "@/lib/contactLinks";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order = "CNF-UK-10023" } = await searchParams;

  return (
    <section className="success-wrap">
      <div className="success-check" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </div>
      <p className="eyebrow">Order received</p>
      <h1>
        Thank you — we&apos;ve received your order.
      </h1>
      <p className="success-copy">We&apos;ll confirm your sizing and order details, then let you know how to complete payment.</p>

      <div className="ticket">
        <span className="eyebrow">Order Number</span>
        <p className="order-no" title={`#${order}`}>#{order}</p>
        <div className="ticket-tear" />
        <div className="ticket-note">Keep this for your records</div>
      </div>

      <p className="success-copy">Send us your order number on WhatsApp or Telegram. We&apos;ll confirm sizing, order details and how to complete payment.</p>

      <div className="success-actions">
        <a className="chan success-whatsapp" href={getWhatsappLink(order)} target="_blank" rel="noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.52 15.27L2 22l4.86-1.27A10 10 0 1 0 12 2Zm0 18.13a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-2.88.76.77-2.81-.19-.29A8.13 8.13 0 1 1 12 20.13Zm4.46-6.09c-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.24-.01-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2.01 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
          </svg>
          WhatsApp
        </a>
        <a className="chan success-telegram" href={getTelegramLink(order)} target="_blank" rel="noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M21.9 4.27 18.6 19.78c-.25 1.1-.9 1.37-1.83.85l-5.04-3.72-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.13 9.34-8.44c.4-.36-.09-.56-.63-.2L5.5 13.07l-4.96-1.55c-1.08-.33-1.1-1.07.23-1.59L20.48 2.4c.9-.33 1.69.21 1.42 1.87Z" />
          </svg>
          Telegram
        </a>
      </div>
      <p className="success-hint">Please keep your order number for support and payment confirmation.</p>

      <Link href="/" className="success-link">
        Continue shopping →
      </Link>
    </section>
  );
}
