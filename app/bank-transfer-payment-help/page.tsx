import type { Metadata } from "next";
import Link from "next/link";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/bank-transfer-payment-help",
  title: "Bank Transfer Payment Help | CNFans UK",
  description:
    "Understand CNFans UK bank transfer payment statuses, what to do if a payment is pending, and how to contact support safely.",
});

export default function BankTransferPaymentHelpPage() {
  return (
    <main className="support-page support-page-flow">
      <section className="support-hero support-hero-compact">
        <p className="support-kicker">Payment support</p>
        <h1>Bank Transfer Payment Help</h1>
        <p>
          If you have started a bank transfer for a CNFans order and its payment status is still pending, this page explains
          what the status means and where to get help. A CNFans &ldquo;Payment submitted&rdquo; status is not confirmation that funds arrived.
        </p>
      </section>

      <section className="support-notice">
        <span>Keep your order number</span>
        <p>
          Your order number helps support find the right order. Do not send your full card details, bank login information or
          passwords when asking us about a payment.
        </p>
      </section>

      <section className="delivery-flow" aria-label="Bank transfer payment guidance">
        <article>
          <span>01</span>
          <div>
            <h2>Before you pay</h2>
            <p>
              Check the order number and total shown in CNFans checkout. Continue from the checkout payment step to Stripe&rsquo;s
              secure hosted page and follow the instructions shown there. Use the payment details presented in that flow, not
              details copied from an old message or screenshot.
            </p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h2>After you start the bank transfer</h2>
            <p>
              After the Stripe payment step starts, CNFans may show &ldquo;Payment submitted&rdquo; or a processing message. This records
              the payment step; it does not mean that funds have arrived. CNFans confirms payment after the receipt has been checked.
            </p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h2>If the payment is still pending</h2>
            <p>
              A status that has not changed is not, by itself, proof that a transfer failed. Check the order using{" "}
              <Link href="/track-order">Track Your Order</Link>. Do not pay again just because the status has not changed. If you
              are unsure whether the transfer was sent, contact support first.
            </p>
          </div>
        </article>
        <article>
          <span>04</span>
          <div>
            <h2>If money has left your bank</h2>
            <p>
              If your bank shows that money has left but CNFans has not confirmed the order, do not send another transfer.
              Keep your order number and <Link href="/contact">contact support</Link> so the payment can be checked. Do not send
              full banking credentials or account details.
            </p>
          </div>
        </article>
        <article>
          <span>05</span>
          <div>
            <h2>If you closed the Stripe page</h2>
            <p>
              Check the order status on CNFans using your order number, for example on the{" "}
              <Link href="/track-order">Track Your Order</Link> page. This help page does not reopen a Stripe payment session,
              and closing the payment page does not confirm that a transfer was received. If you are unsure what to do next,
              contact support before making another payment attempt.
            </p>
          </div>
        </article>
        <article>
          <span>06</span>
          <div>
            <h2>When to contact us</h2>
            <p>
              Get in touch if a payment is still not confirmed, you are unsure whether it was sent, you closed the payment flow,
              or you need order-specific help. Include your order number and a short description. See{" "}
              <Link href="/how-to-order">How to Order</Link> for the purchase steps or use our <Link href="/contact">contact page</Link>.
            </p>
          </div>
        </article>
      </section>

      <section className="policy-list" aria-label="Bank transfer payment questions">
        <article>
          <span>Payment status</span>
          <div>
            <h2>Is a submitted bank transfer the same as a confirmed payment?</h2>
            <p>No. A CNFans &ldquo;Payment submitted&rdquo; status records the payment step; CNFans still needs to check and confirm receipt of the funds.</p>
          </div>
        </article>
        <article>
          <span>Payment status</span>
          <div>
            <h2>Should I pay again if my order still says payment is processing?</h2>
            <p>Do not make another payment only because the status has not changed. Check the order and contact support if you are unsure whether the first transfer was sent.</p>
          </div>
        </article>
        <article>
          <span>Contacting support</span>
          <div>
            <h2>What should I send when contacting support?</h2>
            <p>Include your order number and a short explanation of the issue. Do not send passwords, bank logins or full card details.</p>
          </div>
        </article>
        <article>
          <span>Timing</span>
          <div>
            <h2>Does bank transfer confirmation happen instantly?</h2>
            <p>Not necessarily. Confirmation timing can vary, so CNFans does not promise a fixed update time. The order is confirmed after the payment is checked.</p>
          </div>
        </article>
        <article>
          <span>Payment status</span>
          <div>
            <h2>What should I do if my bank shows the money has left?</h2>
            <p>Do not send another transfer. Keep your order number and contact support so the payment can be checked.</p>
          </div>
        </article>
        <article>
          <span>Stripe checkout</span>
          <div>
            <h2>Do I need to stay on the Stripe page?</h2>
            <p>Follow the instructions shown on Stripe&rsquo;s secure page. Do not assume that closing it confirms payment or that it can be reopened here. If you closed it, check your CNFans order status or contact support.</p>
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
