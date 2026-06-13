import Link from "next/link";

const careGroups = [
  {
    title: "Before ordering",
    items: [
      {
        title: "How to Order",
        text: "Current order flow and launch-stage checkout guidance.",
        href: "/how-to-order",
      },
      {
        title: "Size Guide",
        text: "Measurement notes to help you choose the right fit.",
        href: "/size-guide",
      },
    ],
  },
  {
    title: "After ordering",
    items: [
      {
        title: "Delivery",
        text: "Information about preparation, dispatch and delivery updates.",
        href: "/delivery",
      },
      {
        title: "Track Your Order",
        text: "Tracking guidance and order update support.",
        href: "/track-order",
      },
    ],
  },
  {
    title: "After-sales",
    items: [
      {
        title: "Returns",
        text: "What to do before sending anything back.",
        href: "/returns",
      },
      {
        title: "Contact",
        text: "Email support for product or order questions.",
        href: "/contact",
      },
    ],
  },
];

export default function CustomerCarePage() {
  return (
    <main className="support-page care-page">
      <section className="support-hero support-hero-compact">
        <p className="support-kicker">Support</p>
        <h1>Customer Care</h1>
        <p>Find help before and after placing an order.</p>
      </section>

      <section className="care-overview">
        <p>Choose the topic that matches what you need. If your question is about an order, please include your CNFans UK order number when contacting support.</p>
      </section>

      <section className="care-groups" aria-label="Customer care sections">
        {careGroups.map((group) => (
          <article key={group.title}>
            <h2>{group.title}</h2>
            <div>
              {group.items.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span>{item.title}</span>
                  <p>{item.text}</p>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
