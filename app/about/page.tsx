import type { Metadata } from "next";
import Link from "next/link";
import { buildGuideMetadata } from "@/lib/seoPage";

const pageDescription =
  "Meet CNFANS UK, an independent clothing retailer with its own clothing factory, retail from one item, wholesale, custom requests and UK and European delivery.";

export const metadata: Metadata = buildGuideMetadata({
  path: "/about",
  title: "About CNFANS UK | Clothing & Production Experience",
  description: pageDescription,
});

const trustCards = [
  {
    title: "Our own clothing factory",
    text: "Our factory focuses mainly on clothing, with preparation and production arranged around each order.",
  },
  {
    title: "A wider partner network",
    text: "Family factories and manufacturing partners support our clothing supply network.",
  },
  {
    title: "Direct retail and wholesale",
    text: "Order from one item, ask about quantity-based wholesale discounts or discuss a custom clothing request.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div>
          <p className="about-kicker">ABOUT CNFANS UK</p>
          <h1>Factory-Direct Clothing for the UK &amp; Europe</h1>
        </div>
        <p>
          CNFANS UK is an independent clothing retailer serving customers across the UK and Europe. With our own clothing
          factory and a network of manufacturing partners, we offer direct retail, wholesale and custom clothing services,
          with orders starting from just one item.
        </p>
      </section>

      <section className="about-story-card">
        <h2>Our production and supply network</h2>
        <div className="about-story-copy">
          <p>
            Our own factory mainly produces clothing, supported by a network of family factories and manufacturing partners.
            CNFANS UK focuses on clothing, with new products added to the catalogue each week.
          </p>
          <p>
            Order one item for retail, ask about wholesale and quantity-based discounts, or discuss a custom clothing request.
            You can also send a reference image and ask us to look for a similar style; available options and terms depend on
            the request.
          </p>
        </div>
      </section>

      <section className="about-trust-grid" aria-label="CNFANS UK brand principles">
        {trustCards.map((card) => (
          <article key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="about-story-card">
        <h2>How we prepare an order</h2>
        <div className="about-story-copy">
          <p>
            Normal product preparation or production usually takes 2–3 working days. After your item has been made or
            prepared, we provide actual photos or video and relevant measurements where needed for you to review before
            dispatch.
          </p>
          <p>
            Customers can discuss sizing using their height, weight, preferred fit and the measurements of a garment that
            already fits them well. Read the <Link href="/cnfans-size-guide">CNFANS size guide</Link>, browse{" "}
            <Link href="/category/new-in">new clothing arrivals</Link>, or learn about our{" "}
            <Link href="/cnfans-alternative">direct-shopping service</Link> and <Link href="/delivery">delivery arrangements</Link>.
          </p>
        </div>
      </section>

      <section className="about-story-card">
        <h2>An independent clothing business</h2>
        <div className="about-story-copy">
          <p>
            CNFANS.co.uk is an independent clothing retailer, not CNFans.com or an official replacement. Orders, balances
            and account records held by CNFans.com remain with that service; we cannot access or transfer them.
          </p>
          <p>
            For common questions, read our <Link href="/cnfans-alternative#frequently-asked-questions">shopping FAQs</Link>.
            For help with a product or an existing CNFANS.co.uk order, use our <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
