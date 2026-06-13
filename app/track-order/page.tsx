const trackingNotes = [
  {
    title: "Tracking updates",
    text: "Tracking information is shared after your order has been confirmed and dispatched.",
  },
  {
    title: "Order number",
    text: "Your CNFans UK order number is shown after checkout. Keep it safe for support and delivery updates.",
  },
  {
    title: "Need help?",
    text: "If tracking is not available yet, email us with your CNFans UK order number.",
  },
];

export default function TrackOrderPage() {
  return (
    <main className="support-page track-page">
      <section className="support-hero support-hero-centered">
        <p className="support-kicker">Support</p>
        <h1>Track Your Order</h1>
        <p>Tracking details are shared after your order has been confirmed and dispatched. If tracking is not available yet, please contact us with your CNFans UK order number.</p>
      </section>

      <section className="tracking-panel tracking-panel-primary">
        <div className="tracking-panel-head">
          <span>Order tracking</span>
          <h2>Enter your order number or tracking number.</h2>
          <p>Enter your order number or tracking number to check for available updates.</p>
        </div>
        <form className="tracking-form" action="/track-order">
          <input aria-label="Order number or tracking number" name="q" placeholder="Order number or tracking number" type="text" />
          <button type="submit">Track Order</button>
        </form>
        <p className="tracking-note">For delivery support, email us with your CNFans UK order number.</p>
      </section>

      <section className="tracking-support-notes" aria-label="Tracking guidance">
        {trackingNotes.map((item) => (
          <article key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
