import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `About ${SITE_NAME} | Clothing & Production Experience` },
  description: "Learn about CNFans UK, our garment production background and our approach to practical everyday clothing.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const trustCards = [
  {
    title: "Production experience",
    text: "Built by a Guangzhou-based clothing team with more than ten years of garment-making experience.",
  },
  {
    title: "Practical daily wear",
    text: "Hoodies, jackets, trousers and sets selected for repeat styling and everyday use.",
  },
  {
    title: "Simpler sourcing route",
    text: "A cleaner path from production to customer, with fewer unnecessary layers in between.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div>
          <p className="about-kicker">ABOUT CNFANS UK</p>
          <h1>Everyday clothing shaped by real production experience.</h1>
        </div>
        <p>
          CNFans UK is an online apparel store shaped by garment-making experience, focused on practical wardrobe pieces and a simpler route from production to customer.
        </p>
      </section>

      <section className="about-story-card">
        <h2>Our background</h2>
        <div className="about-story-copy">
          <p>Behind CNFans UK is a Guangzhou-based clothing team with over a decade of apparel production experience.</p>
          <p>
            We have worked with clothing partners in China and overseas, developing everyday pieces, improving finishing details and understanding what makes a garment feel better in real wear.
          </p>
          <p>Our aim is to offer better wardrobe essentials with practical fits, fairer pricing and clothing that feels right in daily use.</p>
        </div>
      </section>

      <section className="about-trust-grid" aria-label="CNFans UK brand principles">
        {trustCards.map((card) => (
          <article key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="about-story-card">
        <h2>Explore the collection</h2>
        <div className="about-story-copy">
          <p>
            Browse our <Link href="/category/new-in">latest clothing arrivals</Link>, compare practical fits in the
            <Link href="/guides"> CNFans UK guides</Link>, or read our <Link href="/how-to-order">ordering guide</Link> before you buy.
          </p>
        </div>
      </section>
    </main>
  );
}
