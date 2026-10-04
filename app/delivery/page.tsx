import Link from "next/link";

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

export default function DeliveryPage() {
  return (
    <main className="support-page support-page-flow">
      <section className="support-hero support-hero-compact">
        <p className="support-kicker">Support</p>
        <h1>Delivery</h1>
        <p>Orders are reviewed and prepared before dispatch. Delivery times vary depending on destination, courier route and local processing. Tracking details will be shared when available.</p>
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
          For help with a bank transfer or a payment status that is still pending, see our{" "}
          <Link href="/bank-transfer-payment-help">bank transfer payment help</Link>.
        </p>
      </section>

      <section className="support-notice">
        <span>UK customs and import charges</span>
        <p>
          For information about customs and import charges under our current UK delivery arrangement, read our{" "}
          <Link href="/uk-customs-and-import-charges">customs and import charges guidance</Link>.
        </p>
      </section>
    </main>
  );
}
