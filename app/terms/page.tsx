import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Terms & Conditions | CNFans UK" },
  description: "Terms for using the CNFans UK website and placing an order.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <article className="policy-page" aria-labelledby="terms-title">
      <header className="policy-header">
        <p className="eyebrow">Legal</p>
        <h1 id="terms-title">Terms &amp; Conditions</h1>
        <p className="policy-updated">Last updated: 15 October 2026</p>
      </header>

      <section className="policy-section">
        <h2>1. About these terms</h2>
        <p>
          These terms describe use of the CNFans UK website and the information that applies when you place an order.
          If you have a question about an order or these terms, please <Link href="/contact">contact us</Link>.
        </p>
      </section>

      <section className="policy-section">
        <h2>2. Products and availability</h2>
        <p>
          Product descriptions, images, size information and availability are shown on the relevant product page and may
          change as the catalogue is updated. Please check the current listing before placing an order.
        </p>
      </section>

      <section className="policy-section">
        <h2>3. Prices and payment</h2>
        <p>
          Your order total is shown during checkout before you continue to payment. Payment is completed through the
          payment options made available during checkout. Where Stripe Checkout is used, available payment methods may
          vary depending on factors such as location, device and transaction.
        </p>
      </section>

      <section className="policy-section">
        <h2>4. Orders</h2>
        <p>
          Keep the order number shown after checkout when contacting us. A payment-submitted or processing status is not
          confirmation that funds have been received. We review payment status separately and may ask you to confirm
          order details with us on WhatsApp before processing.
        </p>
      </section>

      <section className="policy-section">
        <h2>5. Delivery</h2>
        <p>
          Orders are reviewed and prepared before dispatch. Delivery timing and tracking depend on the destination,
          courier route and local processing. Read our <Link href="/delivery">Delivery information</Link> for the current process.
        </p>
      </section>

      <section className="policy-section">
        <h2>6. Returns</h2>
        <p>
          Please contact us before sending an item back so we can confirm the correct next step. See our{" "}
          <Link href="/returns">Returns information</Link> for the current guidance.
        </p>
      </section>

      <section className="policy-section">
        <h2>7. Product information and sizing</h2>
        <p>
          Sizing can vary by style, cut and fabric. Use the measurements on each product page as the main reference and
          read our <Link href="/size-guide">Size Guide</Link> before ordering if you are unsure.
        </p>
      </section>

      <section className="policy-section">
        <h2>8. Website use</h2>
        <p>
          Please use the website lawfully and do not interfere with its operation or attempt to access parts of the
          service that are not intended for public use.
        </p>
      </section>

      <section className="policy-section">
        <h2>9. Contact</h2>
        <p>
          For questions about these terms, a product or an existing order, use our <Link href="/contact">Contact page</Link>.
        </p>
      </section>
    </article>
  );
}
