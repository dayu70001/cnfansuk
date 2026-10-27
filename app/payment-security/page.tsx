import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Payment & Security | CNFans UK" },
  description: "Current CNFans UK order and payment information, including WhatsApp confirmation and ways to protect your details.",
  alternates: { canonical: `${SITE_URL}/payment-security` },
};

export default function PaymentSecurityPage() {
  return (
    <article className="policy-page" aria-labelledby="payment-security-title">
      <header className="policy-header">
        <p className="eyebrow">Payment information</p>
        <h1 id="payment-security-title">Payment &amp; Security</h1>
      </header>

      <section className="policy-section">
        <h2>Current payment arrangements</h2>
        <p>
          Online payment through the website is temporarily unavailable. Submitting an order records your request but does
          not take payment. Please use the WhatsApp button shown on the Payment step to confirm your order and receive the next steps.
        </p>
        <p>
          Do not send passwords, bank login information, full card details or one-time verification codes in a message.
        </p>
      </section>

      <section className="policy-section">
        <h2>Order review</h2>
        <p>
          We review order details with you on WhatsApp before processing. An order number confirms that an order request was
          recorded; it does not mean that payment was taken or that the order has been confirmed.
        </p>
      </section>

      <section className="policy-section">
        <h2>Payment issues</h2>
        <p>
          For questions about a new or existing order, contact us through the <Link href="/contact">Contact page</Link> and
          include your order number. If you have already made a payment for an existing order, contact us before making any
          further payment.
        </p>
      </section>
    </article>
  );
}
