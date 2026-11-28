import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

const pageDescription =
  "Looking for a CNFans alternative in the UK or Europe? Learn how CNFANS.co.uk sells clothing directly, helps with sizing and offers retail, wholesale and custom requests.";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-alternative",
  title: "CNFans Alternative for Clothing Shoppers in the UK & Europe",
  description: pageDescription,
});

const questions = [
  {
    question: "What is CNFANS.co.uk?",
    answer:
      "CNFANS.co.uk is an independent clothing retailer with its own product catalogue, ordering process and customer support.",
  },
  {
    question: "Can I shop directly without a purchasing agent?",
    answer:
      "Yes. Browse our clothing catalogue, place your order here and contact our team for product or sizing help.",
  },
  {
    question: "Can I order just one item?",
    answer:
      "Yes. Retail orders start from one item. Wholesale orders and quantity-based discounts can be discussed with the team before ordering.",
  },
  {
    question: "How long does preparation or production take?",
    answer:
      "Normal preparation or production is usually 2–3 working days. Transit time is separate and starts after dispatch; see the delivery page for current estimates and destination details.",
  },
  {
    question: "Can I review actual photos of my item before dispatch?",
    answer:
      "Yes. After your item has been made or prepared, we share actual photos or video and relevant measurements where needed for you to review before dispatch.",
  },
  {
    question: "Can you help me choose a clothing size?",
    answer:
      "Yes. Share your height, weight, fit preference and the measurements of a similar garment that fits you well. Our team can discuss the available product measurements; sizing guidance is not a guarantee of fit.",
  },
  {
    question: "Can you find a similar product from a reference photo?",
    answer:
      "You can send a reference image through our existing support channels. We can check the current catalogue and supply network for a similar option, but cannot guarantee an identical match or availability.",
  },
  {
    question: "Can I request wholesale or custom clothing?",
    answer:
      "Wholesale quantities, quantity-based discounts and custom clothing requests can be discussed with the team. Options, pricing and lead time depend on the request and must be confirmed before an order is placed.",
  },
  {
    question: "Can I cancel an order before it is dispatched?",
    answer:
      "If your order has not been dispatched, contact us with your order number and we will arrange cancellation and a refund. Applicable consumer rights continue to apply.",
  },
  {
    question: "Can I exchange an item for another size?",
    answer:
      "Contact support before sending anything back. If you selected the wrong size, you would usually cover the exchange postage; if we sent the wrong size, we cover the relevant postage. Applicable consumer rights continue to apply.",
  },
  {
    question: "What if my item arrives damaged or has a quality problem?",
    answer:
      "Contact us with your order number and clear photos. Once we have reviewed and verified the issue, we will arrange a refund or another appropriate solution.",
  },
  {
    question: "What happens if the carrier confirms my parcel is lost?",
    answer:
      "Once the carrier confirms a parcel is lost, contact us with your order number. We will arrange a replacement or another appropriate solution.",
  },
  {
    question: "How do change-of-mind returns work?",
    answer:
      "Change-of-mind returns are handled under applicable consumer law and the conditions on our Returns page. Contact support before posting anything so we can provide the correct return address.",
  },
];

const schemas = [
  ...buildGuidePageSchemas({
    path: "/cnfans-alternative",
    name: "A CNFans Alternative for Direct Clothing Shopping",
    description: pageDescription,
  }),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

export default function CnfansAlternativePage() {
  return (
    <main className="seo-page">
      <JsonLd data={schemas} />
      <header className="seo-hero">
        <p className="eyebrow">Independent UK clothing store</p>
        <h1>A CNFans Alternative for Direct Clothing Shopping</h1>
        <p className="seo-lead">
          Shop clothing directly from our factory and manufacturing network, without the need for a separate purchasing
          agent. Order from just one item, get personal sizing assistance and review your actual item before dispatch.
        </p>
      </header>

      <section className="seo-section">
        <h2>Looking for a CNFans alternative?</h2>
        <p>
          CNFANS.co.uk is an independent clothing retailer, not CNFans.com or an official replacement. Accounts, balances
          and order history with CNFans.com remain with that service and cannot be accessed here.
        </p>
        <p>
          If you are checking an access issue or an old product link, see the dated <Link href="/cnfans-status">CNFans status note</Link>
          and <Link href="/cnfans-dead-links">link troubleshooting guide</Link>.
        </p>
      </section>

      <section className="seo-section">
        <h2>Shopping directly without a purchasing agent</h2>
        <p>
          Browse our live clothing catalogue and order through CNFANS.co.uk. Our team can help with measurements, product
          questions and orders placed with us.
        </p>
        <ul>
          <li>Browse clothing by category or start with <Link href="/category/new-in">New In</Link>.</li>
          <li>Check the current listing, available sizes and product information before ordering.</li>
          <li>Ask our team about measurements, order details or a product question through the <Link href="/contact">contact page</Link>.</li>
          <li>Check the delivery service, currency and charge shown for your destination at checkout.</li>
        </ul>
        <div className="first-party-table-wrap">
          <table className="first-party-table direct-shopping-comparison">
            <caption>Direct shopping and purchasing-agent services have different order processes</caption>
            <thead>
              <tr><th scope="col">What you are comparing</th><th scope="col">CNFANS.co.uk direct retail</th><th scope="col">A purchasing-agent service</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Where you order</th><td>Through our own clothing catalogue and checkout.</td><td>Through the agent service you choose.</td></tr>
              <tr><th scope="row">Product and sizing help</th><td>Ask our team about our listings and available measurements.</td><td>Ask that service about its own buying process.</td></tr>
              <tr><th scope="row">Order history</th><td>For orders placed with CNFANS.co.uk.</td><td>Held by the relevant agent service.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="seo-section">
        <h2>Our clothing factory and manufacturing partners</h2>
        <p>
          CNFANS.co.uk has its own clothing factory and works with a network of family factories and manufacturing partners.
          Our own factory mainly produces clothing, and this website focuses on apparel.
        </p>
        <p>
          New arrivals are added weekly. Retail orders start from one item; we also offer wholesale with quantity-based
          discounts and discuss custom clothing requests. Share a reference photo if you would like us to look for a similar
          product in our current range or supply network. Availability, options and price are confirmed on the live product page.
        </p>
      </section>

      <section className="seo-section" id="how-cnfans-uk-works">
        <h2>How CNFANS UK works</h2>
        <ol>
          <li>Choose a product from the live catalogue and submit your order through CNFANS.co.uk.</li>
          <li>Contact the team if you want to discuss the product, size or order details.</li>
          <li>Normal product preparation or production usually takes 2–3 working days.</li>
          <li>After the item has been made or prepared, we provide actual product photos or video and relevant measurements where needed for your review.</li>
          <li>Once the item is confirmed for dispatch, the selected delivery route and tracking updates are handled for the order.</li>
        </ol>
        <p>
          Preparation or production normally takes 2–3 working days, followed by typical transit of 7–12 working days after
          dispatch. The usual overall estimate is 9–15 working days; an occasional carrier delay can add 2–3 working days.
          These are estimates, not guaranteed delivery dates. See the <Link href="/delivery">delivery information</Link> for destination details.
        </p>
      </section>

      <section className="seo-section">
        <h2>Personal sizing assistance</h2>
        <p>
          Clothing labels can vary by garment and cut. For a more useful conversation, share your height, weight, preferred
          fit and the flat measurements of a similar item that fits you well. We can discuss the product&rsquo;s available
          measurements without treating a size label as a universal standard.
        </p>
        <p>
          Use the <Link href="/cnfans-size-guide">CNFANS size guide</Link> to measure a reference garment. Our team can help
          interpret the information, but an online size discussion cannot guarantee how a garment will fit every person.
        </p>
      </section>

      <section className="seo-section" id="delivery">
        <h2>UK and European delivery</h2>
        <p>
          Standard delivery starts from £5 in the UK and €5 across eligible European destinations. Free standard delivery
          applies to eligible UK orders with a GBP merchandise subtotal of £180 or more, and eligible European orders with
          a EUR merchandise subtotal of €180 or more. FedEx Priority is priced separately and does not qualify for free
          standard delivery. Checkout shows the service, currency and charge for your order.
        </p>
        <p>
          VAT and customs duties are included on eligible European delivery routes. The route available for your destination
          and selected service is shown at checkout.
        </p>
      </section>

      <section className="seo-section">
        <h2>Retail, wholesale and custom requests</h2>
        <p>
          Retail orders start from one item. Customers planning a larger quantity can ask about wholesale pricing and
          quantity-based discounts. Custom clothing is also available for discussion; the design, minimum details, price and
          timing depend on the request and must be confirmed with the team.
        </p>
        <p>
          If you have a reference image, send it through our existing <Link href="/connect">customer service channels</Link>.
          We can look for a similar option in the current product range or supply network, but cannot guarantee an identical
          product, exact match or continuing availability.
        </p>
      </section>

      <section className="seo-section">
        <h2>Returns and customer support</h2>
        <p>
          If you need to cancel or return an order, or report a damaged, faulty or incorrect item, contact us before sending
          anything back. Read the <Link href="/returns">returns information</Link> and ask support for the correct return
          address. You can reach us through the existing WhatsApp, Telegram and email links on our{" "}
          <Link href="/connect">contact channels page</Link>.
        </p>
      </section>

      <section className="seo-section" id="frequently-asked-questions">
        <h2>Frequently Asked Questions</h2>
        {questions.map(({ question, answer }) => (
          <article key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </section>

      <GuideCta browseHref="/category/new-in" browseLabel="Browse New In" />
      <GuideRelated
        links={[
          { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "Understand shared clothing lists and current product links." },
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse clothing by product type." },
          { href: "/about", title: "About CNFANS UK", blurb: "Learn about the independent clothing business and supply network." },
          { href: "/delivery", title: "Delivery & Shipping", blurb: "Check preparation, transit estimates and destination details." },
        ]}
      />
    </main>
  );
}
