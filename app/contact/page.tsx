const emailPrep = [
  "Your order number, if you have one",
  "Product name or link",
  "Size and colour details",
  "Clear photos if the item is damaged or incorrect",
];

export default function ContactPage() {
  return (
    <main className="support-page contact-page">
      <section className="contact-hero">
        <p className="support-kicker">Support</p>
        <h1>Contact CNFans UK</h1>
        <p>For product questions, sizing help or order support, contact us by email and include your order number if you have one.</p>
      </section>

      <section className="contact-email">
        <span>Email support</span>
        <a href="mailto:support@cnfans.co.uk">support@cnfans.co.uk</a>
        <p>We aim to respond as soon as possible. If your message is about an existing order, please include your order number.</p>
      </section>

      <section className="email-prep-list" aria-label="What to include in your email">
        <h2>What to include</h2>
        <ul>
          {emailPrep.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
