import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Payment & Security | CNFans UK" },
  description: "How Stripe Hosted Checkout and CNFans order review work when you pay.",
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
        <h2>Secure payment</h2>
        <p>
          Payments are processed using Stripe Hosted Checkout. Available payment methods are shown during the Stripe
          payment step and may vary by country, device and transaction.
        </p>
        <p>
          When card payment is available, card details are entered on Stripe&apos;s hosted payment page, not in the CNFans
          checkout form. For more information, see the{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
            Stripe Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="policy-section">
        <h2>Order review</h2>
        <p>
          A successful Stripe payment does not replace CNFans order review and confirmation. After payment, we&apos;ll verify
          your order details with you on WhatsApp before processing. Payment submitted and payment confirmed are separate
          order states.
        </p>
      </section>

      <section className="policy-section">
        <h2>Payment issues</h2>
        <p>
          If a payment status is unclear, check your order status and contact us before trying to pay again. You can reach
          support through the <Link href="/contact">Contact page</Link>; include your order number, but do not send full
          card details, bank login information or passwords.
        </p>
      </section>
    </article>
  );
}
