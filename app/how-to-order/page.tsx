export default function HowToOrderPage() {
  const steps = [
    {
      number: "01",
      title: "Choose your items",
      body: "Select the styles, sizes, colours and quantities you want.",
    },
    {
      number: "02",
      title: "Submit your order",
      body: "Enter your contact and delivery details through checkout.",
    },
    {
      number: "03",
      title: "Receive your order number",
      body: "Your CNFans UK order number is shown after checkout for support and updates.",
    },
    {
      number: "04",
      title: "Confirm details if needed",
      body: "If needed, our team may confirm stock, sizing or delivery details through an official support channel.",
    },
  ];

  return (
    <section className="page-shell order-guide-page">
      <div className="order-guide-head">
        <p className="eyebrow">Guide</p>
        <h1>How ordering works</h1>
        <p>
          Follow the steps below to place your CNFans UK order. After checkout, you’ll receive an order number for support and updates.
        </p>
      </div>
      <div className="order-steps-grid">
        {steps.map((step) => (
          <article key={step.number}>
            <span>{step.number}</span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
      <p className="order-guide-note">
        Keep your order number after checkout. It helps us find your details faster if you contact support.
      </p>
    </section>
  );
}
