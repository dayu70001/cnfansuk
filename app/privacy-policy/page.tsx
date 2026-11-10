import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | CNFans UK" },
  description: "How CNFans UK uses information provided through the website, checkout and customer support.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="policy-page" aria-labelledby="privacy-policy-title">
      <header className="policy-header">
        <p className="eyebrow">Legal</p>
        <h1 id="privacy-policy-title">Privacy Policy</h1>
        <p className="policy-updated">Last updated: 6 November 2026</p>
      </header>

      <section className="policy-section">
        <h2>1. Information we collect</h2>
        <p>
          When you place an order, the checkout asks for contact and delivery details such as your name, email address,
          phone number and delivery address. We also process the items and options in your order, its total and payment
          status. If you contact support, we receive the information you choose to include in your message.
        </p>
      </section>

      <section className="policy-section">
        <h2>2. How we use information</h2>
        <p>
          We use order and contact information to handle orders, arrange delivery, respond to questions and review order
          and payment status. We also use website activity information as described under Analytics and advertising.
        </p>
      </section>

      <section className="policy-section">
        <h2>3. Payments</h2>
        <p>
          Online payment through the website is temporarily unavailable, and submitting an order does not take payment.
          We retain order information and any payment-status information already associated with an order so we can respond
          to order enquiries and maintain the relevant order record. Contact us with your order number if you have a question.
        </p>
      </section>

      <section className="policy-section">
        <h2>4. Analytics and advertising</h2>
        <p>
          The website includes the Meta Pixel and may use Google Analytics or Google Tag Manager when configured for
          production. These tools help measure page views and interactions, including product, cart, checkout and
          contact or social-link activity. The relevant providers process information under their own privacy terms.
        </p>
      </section>

      <section className="policy-section">
        <h2>5. Service providers</h2>
        <p>
          We use service providers to support website operation, order management, customer contact and website measurement.
          Meta and Google tools are used for advertising or analytics measurement as described above. Delivery and tracking
          information is handled as part of the order process described on our <Link href="/delivery">Delivery</Link> page.
        </p>
      </section>

      <section className="policy-section">
        <h2>6. Newsletter subscriptions</h2>
        <p>
          If you choose to subscribe, we collect your email address and marketing consent. The consent box is not
          pre-ticked, and you must actively select it to subscribe. When you submit the form, your address is added
          directly to the CNFans Newsletter list; we do not send a confirmation email or require a confirmation link.
          We use these details to send occasional emails about new arrivals, real product videos and CNFans updates.
        </p>
        <p>
          Brevo provides the newsletter form and email delivery service and processes subscription details for these
          purposes. Brevo records the consent-field response in the OPT_IN contact attribute and the date a contact is
          added; its form-submission event logs identify the form and submission time. These records help us evidence
          the subscription and consent choice. Brevo states that its database processing and hosting servers are in
          the European Union, including hosting in France, Germany and Belgium. For details about Brevo&apos;s processors
          and applicable international-transfer safeguards, see its{" "}
          <a href="https://www.brevo.com/legal/termsofuse/">Data Processing Agreement</a> and{" "}
          <a href="https://www.brevo.com/legal/privacypolicy/">Privacy Policy</a>.
        </p>
        <p>
          You can unsubscribe at any time using the link in a marketing email. We will stop sending newsletter marketing
          after you unsubscribe. We keep subscription and preference records while needed to operate the newsletter,
          honour your choice and meet legal obligations; a record needed to prevent further marketing may remain after
          unsubscribing. We do not specify a fixed retention period here.
        </p>
        <p>
          You can ask us to access, correct or erase your information, restrict or object to certain processing, and
          exercise any other rights available under data protection law, including data portability where applicable,
          by using our <Link href="/contact">Contact page</Link>. You may withdraw your marketing consent at any time;
          this does not affect processing that took place before withdrawal.
        </p>
      </section>

      <section className="policy-section">
        <h2>7. Your choices and privacy questions</h2>
        <p>
          If you have a question or request about information connected with an order, contact us through the{" "}
          <Link href="/contact">Contact page</Link>. Including your order number can help us locate the relevant order.
        </p>
      </section>

      <section className="policy-section">
        <h2>8. Contact</h2>
        <p>
          For privacy questions, contact CNFANS TRADING LTD at{" "}
          <a href="mailto:support@cnfans.co.uk">support@cnfans.co.uk</a> or use our{" "}
          <Link href="/contact">Contact page</Link>.
        </p>
        <p>
          298 Stattler Attercliffe Rd<br />
          Sheffield<br />
          S4 7WZ<br />
          United Kingdom
        </p>
      </section>
    </article>
  );
}
