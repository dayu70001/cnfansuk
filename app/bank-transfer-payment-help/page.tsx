import type { Metadata } from "next";
import Link from "next/link";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/bank-transfer-payment-help",
  title: "Order and Payment Help | CNFans UK",
  description:
    "Find out what happens after placing a CNFans UK order, how to contact us on WhatsApp and how to ask about an existing order safely.",
});

export default function BankTransferPaymentHelpPage() {
  return (
    <main className="support-page support-page-flow">
      <section className="support-hero support-hero-compact">
        <div className="support-hero-title">
          <p className="support-kicker">Order support</p>
          <h1>Order and Payment Help</h1>
        </div>
        <p>
          Online payment through the website is temporarily unavailable. Placing an order records your request but does not
          take payment. Contact us on WhatsApp from the Payment step to confirm your order and receive the next steps.
        </p>
      </section>

      <section className="support-notice">
        <span>Keep your order number</span>
        <p>
          Your order number helps us find the right order. Do not send full card details, bank login information, passwords
          or one-time verification codes when asking for help.
        </p>
      </section>

      <section className="delivery-flow" aria-label="Order and payment guidance">
        <article>
          <span>01</span>
          <div>
            <h2>When you place an order</h2>
            <p>
              Review your items, delivery details and total in checkout before submitting. The website currently does not
              take online payment when an order is created.
            </p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h2>After your order is created</h2>
            <p>
              Keep the order number shown in checkout, then use the WhatsApp button on the Payment step. We will confirm
              your order details with you and provide the next steps.
            </p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h2>For an existing order</h2>
            <p>
              If you have a question about an order or a payment made previously, contact us with the order number so we can
              check its recorded status. Do not send another payment while you are waiting for us to review it.
            </p>
          </div>
        </article>
        <article>
          <span>04</span>
          <div>
            <h2>Protect your information</h2>
            <p>
              Share your order number and a short description of the issue. Never send passwords, bank logins, full card
              details or verification codes. You can also use our <Link href="/contact">Contact page</Link>.
            </p>
          </div>
        </article>
      </section>

      <section className="policy-list" aria-label="Order and payment questions">
        <article>
          <span>Order payment</span>
          <div>
            <h2>Does placing an order take payment?</h2>
            <p>No. Online payment is temporarily unavailable, so no payment is taken by the website when you submit an order.</p>
          </div>
        </article>
        <article>
          <span>Contacting us</span>
          <div>
            <h2>How do I confirm my order?</h2>
            <p>Use the WhatsApp button shown on the Payment step after checkout. Your order number is included in the pre-filled message.</p>
          </div>
        </article>
        <article>
          <span>Existing orders</span>
          <div>
            <h2>What if I have already made a payment?</h2>
            <p>Contact us with the order number so we can review the order record. Do not send another payment while we check it.</p>
          </div>
        </article>
      </section>

      <section className="support-notice">
        <span>More order help</span>
        <p>
          For the full order flow, read <Link href="/how-to-order">How to Order</Link>. For parcel updates, use{" "}
          <Link href="/track-order">Track Your Order</Link> or read the <Link href="/delivery">delivery guidance</Link>.
        </p>
      </section>
    </main>
  );
}
