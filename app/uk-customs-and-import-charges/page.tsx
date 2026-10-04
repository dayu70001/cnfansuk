import type { Metadata } from "next";
import Link from "next/link";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/uk-customs-and-import-charges",
  title: "UK Customs & Import Charges | CNFans UK",
  description:
    "Learn what to expect about customs and import charges on CNFans UK orders delivered in the UK under our current delivery arrangement.",
});

export default function UkCustomsAndImportChargesPage() {
  return (
    <main className="support-page support-page-flow">
      <section className="support-hero support-hero-compact">
        <p className="support-kicker">UK delivery support</p>
        <h1>UK Customs &amp; Import Charges</h1>
        <p>
          For UK orders, CNFans UK uses a dedicated delivery arrangement. Under our current delivery process, customers are
          not asked to pay additional customs or import charges when their order is delivered.
        </p>
      </section>

      <section className="delivery-flow" aria-label="UK customs and import charge information">
        <article>
          <span>01</span>
          <div>
            <h2>Do I need to pay extra customs charges on delivery?</h2>
            <p>
              Under the current CNFans UK delivery arrangement, customers are not asked to pay an additional customs or import
              charge when their order is delivered.
            </p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h2>What does the price at checkout cover?</h2>
            <p>
              The order amount is shown before payment. This page does not break that amount down into tax or duty components;
              it explains the current UK delivery experience. Customers are not asked for a separate customs or import payment
              when the parcel is delivered under this arrangement.
            </p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h2>What if I receive an unexpected customs payment request?</h2>
            <p>
              If you are unsure, do not pay immediately. Check that the message is genuinely connected to the delivery, keep
              your CNFans order number and <Link href="/contact">contact our support team</Link> so we can check the
              order-specific situation. Do not share passwords, bank login details or full card details.
            </p>
          </div>
        </article>
        <article>
          <span>04</span>
          <div>
            <h2>Where does this guidance apply?</h2>
            <p>
              This page describes the current CNFans UK delivery arrangement for orders delivered in the UK. It does not make
              a promise about delivery arrangements in other countries.
            </p>
          </div>
        </article>
      </section>

      <section className="policy-list" aria-label="Customs and import charge questions">
        <article>
          <span>UK deliveries</span>
          <div>
            <h2>Will I be charged customs when my CNFans UK order arrives?</h2>
            <p>Under our current UK delivery arrangement, customers are not asked to pay a separate customs or import charge on delivery.</p>
          </div>
        </article>
        <article>
          <span>Courier requests</span>
          <div>
            <h2>Do I need to pay the courier extra money for customs?</h2>
            <p>A separate customs or import payment is not normally requested from customers at delivery under the current arrangement.</p>
          </div>
        </article>
        <article>
          <span>Unexpected requests</span>
          <div>
            <h2>What should I do if I receive an unexpected payment request?</h2>
            <p>Verify the delivery message, keep your order number and contact CNFans UK through the <Link href="/contact">official contact page</Link> if you are unsure.</p>
          </div>
        </article>
        <article>
          <span>Coverage</span>
          <div>
            <h2>Does this page apply outside the UK?</h2>
            <p>No. It describes the current delivery experience for UK orders only. Check with support about another destination.</p>
          </div>
        </article>
        <article>
          <span>Information</span>
          <div>
            <h2>Is this general UK tax advice?</h2>
            <p>No. This page describes the current CNFans UK delivery arrangement and customer experience, not general tax or customs advice.</p>
          </div>
        </article>
      </section>

      <section className="support-notice">
        <span>More delivery information</span>
        <p>
          Read our <Link href="/delivery">delivery information</Link>, or visit{" "}
          <Link href="/how-to-order">How to Order</Link> for the steps before and after checkout.
        </p>
      </section>
    </main>
  );
}
