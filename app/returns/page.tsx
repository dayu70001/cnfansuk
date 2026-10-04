import Link from "next/link";

const policyItems = [
  {
    label: "Return window",
    title: "Change of mind",
    text: "Contact us within 14 days of delivery if you need help with a change-of-mind return.",
  },
  {
    label: "Condition",
    title: "Item condition",
    text: "Items should be unworn, unused, clean and in their original condition.",
  },
  {
    label: "Issue review",
    title: "Wrong, damaged or faulty items",
    text: "If an item arrives damaged, faulty or incorrect, contact us with your order number and clear photos so we can review the issue.",
  },
  {
    label: "Return shipping",
    title: "Return steps",
    text: "For change-of-mind returns, return shipping may be the customer's responsibility. We will confirm the correct return steps before anything is sent back.",
  },
];

export default function ReturnsPage() {
  return (
    <main className="support-page">
      <section className="support-hero support-hero-compact">
        <p className="support-kicker">Support</p>
        <h1>Returns</h1>
        <p>If you need help with a return, please contact us before sending anything back so we can confirm the correct next step.</p>
      </section>

      <section className="returns-priority">
        <span>Before returning an item</span>
        <p>If you need help with an order, contact us first so we can guide you through the correct next step and confirm the available options.</p>
      </section>

      <section className="policy-list" aria-label="Returns policy">
        {policyItems.map((item) => (
          <article key={item.title}>
            <span>{item.label}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="support-notice">
        <span>Before contacting us</span>
        <p>
          For a wrong size, incorrect or damaged item, or something missing from your delivery, keep your order number and
          identify the affected item and issue. <Link href="/contact">Contact support</Link> before sending anything back. For a
          parcel marked delivered but not received, see our <Link href="/delivery">delivery guidance</Link>. Do not send full
          bank or card details with your first message.
        </p>
      </section>
    </main>
  );
}
