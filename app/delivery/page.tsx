import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";
import { getLastMileCarrier } from "@/lib/shipping";

const pageDescription =
  "Check CNFANS UK delivery preparation, transit estimates and shipping costs for UK and European orders, including tracking and destination-specific carrier information.";

export const metadata: Metadata = buildGuideMetadata({
  path: "/delivery",
  title: "Delivery & Shipping Information | CNFans UK",
  description: pageDescription,
});

const deliveryQuestions = [
  {
    question: "Does CNFANS UK ship to Europe?",
    answer: "Yes. CNFANS.co.uk offers delivery routes for the UK and listed European destinations. Available countries, service, currency and the exact charge are shown for your order at checkout; contact support if your destination is not listed.",
  },
  {
    question: "How long does preparation or production take?",
    answer: "Normal preparation or production usually takes 2–3 working days. This is separate from transit time, which starts after dispatch.",
  },
  {
    question: "How long does delivery take after dispatch?",
    answer: "Typical standard transit is 7–12 working days after dispatch. An occasional carrier delay can add a further 2–3 working days.",
  },
  {
    question: "How much is shipping?",
    answer: "Standard delivery starts from £5 in the UK and €5 across eligible European destinations. Free standard delivery applies at a GBP merchandise subtotal of £180 or more in the UK, and a EUR merchandise subtotal of €180 or more on eligible European routes. FedEx Priority is priced separately and does not qualify for free standard delivery.",
  },
  {
    question: "Are VAT and customs duties included for Europe?",
    answer: "VAT and customs duties are included on eligible European delivery routes. The route available for your destination and selected service is shown at checkout.",
  },
  {
    question: "When will I receive photos of my actual item?",
    answer: "Actual photos or video, and measurements where needed, are shared after the specific item has been made or prepared. Listing or supplier reference images are not presented as photos of a customer's finished item.",
  },
  {
    question: "What should I do if a parcel appears to be lost?",
    answer: "If the carrier confirms that your parcel is lost, contact support with your order number. We will arrange a replacement or another appropriate solution.",
  },
];

const schemas = [
  ...buildGuidePageSchemas({ path: "/delivery", name: "Delivery & Shipping Information", description: pageDescription }),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: deliveryQuestions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
];

const deliverySteps = [
  {
    number: "01",
    title: "Order review",
    text: "We check product details, sizing and delivery information before preparation.",
  },
  {
    number: "02",
    title: "Preparation",
    text: "Your order is prepared through an international fulfilment route before dispatch.",
  },
  {
    number: "03",
    title: "Dispatch",
    text: "Tracking information is shared when it becomes available from the carrier.",
  },
  {
    number: "04",
    title: "Delivery updates",
    text: "Delivery times depend on destination, courier route and local processing.",
  },
];

const lastMileDestinations = [
  ["United Kingdom", "GB"], ["Netherlands", "NL"], ["Germany", "DE"], ["Ireland", "IE"],
  ["Italy", "IT"], ["France", "FR"], ["Spain", "ES"], ["Portugal", "PT"], ["Poland", "PL"],
  ["Belgium", "BE"], ["United States", "US"], ["Estonia", "EE"], ["Lithuania", "LT"], ["Latvia", "LV"],
  ["Cyprus", "CY"], ["Hungary", "HU"], ["Romania", "RO"], ["Greece", "GR"], ["Malta", "MT"],
  ["Slovenia", "SI"], ["Sweden", "SE"], ["Slovakia", "SK"], ["Bulgaria", "BG"], ["Croatia", "HR"],
  ["Finland", "FI"], ["Luxembourg", "LU"], ["Austria", "AT"], ["Denmark", "DK"], ["Czechia", "CZ"],
] as const;

export default function DeliveryPage() {
  return (
    <main className="support-page support-page-flow">
      <JsonLd data={schemas} />
      <section className="support-hero support-hero-compact">
        <div className="support-hero-title">
          <p className="support-kicker">Support</p>
          <h1>Delivery</h1>
        </div>
        <p>
          Allow 2–3 working days for product preparation or production, followed by a typical 7–12 working days in transit
          after dispatch. The normal overall estimate is 9–15 working days; an occasional carrier delay can add a further
          2–3 working days. These are estimates, and tracking is shared when available.
        </p>
      </section>

      <section className="seo-section">
        <h2>UK and European shipping costs</h2>
        <p>
          Standard delivery starts from £5 in the UK and €5 across eligible European destinations. Free standard delivery
          applies to eligible UK orders with a GBP merchandise subtotal of £180 or more, and eligible European orders with
          a EUR merchandise subtotal of €180 or more. FedEx Priority is priced separately and does not qualify for free
          standard delivery. Checkout shows the service, currency and charge for your order.
        </p>
        <p>
          VAT and customs duties are included on eligible European delivery routes. The available route for your destination
          and selected service is shown at checkout.
        </p>
      </section>

      <section className="seo-section">
        <h2>Preparation, production and transit are separate</h2>
        <p>
          Normal preparation or production is usually 2–3 working days. The typical transit estimate for standard routes is
          usually 7–12 working days after dispatch. Carrier processing or local events can occasionally add 2–3 working days;
          these are estimates rather than guaranteed arrival dates.
        </p>
        <p>
          After the specific item is made or prepared, we provide actual photos or video and relevant measurements where needed
          for review before dispatch. These are not promised before production or preparation, and a supplier reference image
          is not described as the customer&rsquo;s finished item.
        </p>
      </section>

      <section className="seo-section">
        <h2>Destination last-mile delivery partners</h2>
        <p>These are destination last-mile service mappings. The international service can differ; follow the carrier shown in your order and tracking information.</p>
        <div className="first-party-table-wrap">
          <table className="first-party-table delivery-carrier-table">
            <caption>Last-mile service by destination</caption>
            <thead><tr><th scope="col">Destination</th><th scope="col">Last-mile service</th></tr></thead>
            <tbody>
              {lastMileDestinations.map(([destination, countryCode]) => (
                <tr key={countryCode}>
                  <th scope="row">{destination}</th>
                  <td>{getLastMileCarrier(countryCode)?.label ?? "Shown in tracking"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="delivery-flow" aria-label="Delivery process">
        {deliverySteps.map((step) => (
          <article key={step.number}>
            <span>{step.number}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="delivery-flow" aria-label="Delivery and tracking problems">
        <article>
          <span>01</span>
          <div>
            <h2>Tracking has not updated</h2>
            <p>
              Tracking can take time to show a new scan. Check the latest available details on the{" "}
              <Link href="/track-order">Track Your Order</Link> page. If you still need help, contact us with your order number.
            </p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h2>Address problem or returned parcel</h2>
            <p>
              Check the delivery details saved with your order. If you spot an address issue or tracking shows that a parcel
              is being returned, <Link href="/contact">contact support</Link> with your order number so we can review it.
            </p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h2>Marked delivered but not received</h2>
            <p>
              If tracking says delivered but you do not have the parcel, contact us with your order number and the latest
              tracking details. We can review the information available for your order.
            </p>
          </div>
        </article>
      </section>

      <section className="support-notice">
        <span>Before ordering</span>
        <p>Please make sure your delivery name, phone number, address, city, postcode and country are complete and correct before submitting your order.</p>
      </section>

      <section className="support-notice">
        <span>Payment question?</span>
        <p>
          For help with an existing order or payment question, see our{" "}
          <Link href="/bank-transfer-payment-help">order and payment help</Link>.
        </p>
      </section>

      <section className="support-notice">
        <span>UK customs and import charges</span>
        <p>
          For information about customs and import charges under our current UK delivery arrangement, read our{" "}
          <Link href="/uk-customs-and-import-charges">customs and import charges guidance</Link>.
        </p>
      </section>

      <section className="seo-section" id="frequently-asked-questions">
        <h2>Delivery FAQs</h2>
        {deliveryQuestions.map(({ question, answer }) => (
          <article key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
        <p>
          For further help, use the existing <Link href="/connect">customer service channels</Link> or read our{" "}
          <Link href="/cnfans-alternative#frequently-asked-questions">shopping FAQs</Link>.
        </p>
      </section>
    </main>
  );
}
