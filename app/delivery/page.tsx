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

      <section className="support-notice">
        <span>Before ordering</span>
        <p>Please make sure your delivery name, phone number, address, city, postcode and country are complete and correct before submitting your order.</p>
      </section>
    </main>
  );
}
