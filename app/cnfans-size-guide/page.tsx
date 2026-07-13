import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-size-guide",
  title: "CNFans UK Size Guide | Hoodies, Jackets, T-Shirts & Bottoms",
  description:
    "Check CNFans UK size guidance for hoodies, jackets, t-shirts, trousers and matching sets before placing your order.",
});

export default function CnfansSizeGuidePage() {
  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: "/cnfans-size-guide", name: "CNFans UK Size Guide", description: "Fit and measuring guidance for hoodies, jackets, T-shirts and bottoms from CNFans UK." })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans UK Size Guide</h1>
        <p className="seo-lead">
          Getting the size right is the best way to love what you order. CNFans UK is an independent clothing store and
          product discovery site, and this guide gives simple fit advice for our main clothing types.
        </p>
      </header>

      <section className="seo-section">
        <h2>General sizing advice</h2>
        <p>
          A quick tip that works for almost everything: compare with a garment you already own and love. Lay it flat, measure
          the chest, length and sleeve, and match those numbers to the item you are considering.
        </p>
        <p>
          Think about how you like to wear a piece, too. If you prefer a roomier, relaxed look, stick with your usual size.
          If you like things closer to the body, sizing down often works &mdash; especially on styles with an oversized cut.
        </p>
      </section>

      <section className="seo-section">
        <h2>Fit is personal</h2>
        <p>
          There is no single &ldquo;correct&rdquo; size &mdash; it depends on how you like your clothes to sit. Two people
          with the same measurements might happily wear different sizes of the same hoodie. The notes below describe how each
          type of clothing tends to fit, so you can decide what suits you rather than following a label blindly.
        </p>
      </section>

      <section className="seo-section">
        <h2>Hoodies and sweatshirts</h2>
        <p>
          Hoodies tend to have a relaxed, everyday fit that is easy to layer. If you want that classic loose look, take your
          normal size. If you prefer a neater shape or plan to wear it on its own, consider sizing down. Check the shoulder
          and body length so the hem sits where you like it. Browse hoodie styles on our{" "}
          <Link href="/cnfans-hoodie-finds">hoodie finds</Link> page.
        </p>
      </section>

      <section className="seo-section">
        <h2>Jackets and outerwear</h2>
        <p>
          For jackets, think about what goes underneath. If you will layer over a hoodie or knit, allow a little extra room
          and keep your usual size. For a trimmer look worn over a tee, you may prefer to size down. Sleeve length and
          shoulder fit matter most here. See more on our <Link href="/cnfans-jacket-finds">jacket finds</Link> page.
        </p>
      </section>

      <section className="seo-section">
        <h2>T-shirts and tops</h2>
        <p>
          Tops are usually the easiest to size. Your normal size gives a standard fit; go up one for a boxier, relaxed look.
          Check the body length if you like to tuck, and the chest measurement if you prefer a closer fit. Browse the full{" "}
          <Link href="/category/tops">tops</Link> category.
        </p>
      </section>

      <section className="seo-section">
        <h2>Bottoms and trousers</h2>
        <p>
          For bottoms, the waist and inside leg matter most. Measure a pair you wear often and match the numbers. Joggers and
          relaxed trousers are forgiving; slimmer styles are worth checking more carefully. Browse the full{" "}
          <Link href="/category/bottoms">bottoms</Link> category, and remember that matching{" "}
          <Link href="/category/co-ords-sets">sets</Link> follow the same fit notes.
        </p>
      </section>

      <section className="seo-section">
        <h2>If you are between sizes</h2>
        <p>
          Caught between two sizes? As a rule of thumb, size up for a relaxed fit and down for a closer one. If you would
          rather talk it through, <Link href="/contact">contact us</Link> before ordering with the style and your usual size, and
          we will give you an honest recommendation.
        </p>
      </section>

      <section className="seo-section">
        <h2>How to measure at home</h2>
        <p>
          You do not need anything fancy &mdash; a soft tape measure and a garment you already like are enough. Lay the item
          flat and measure the chest across from armpit to armpit, the length from the top of the shoulder to the hem, and the
          sleeve from shoulder seam to cuff. Note the numbers down.
        </p>
        <p>
          Compare those measurements with the piece you are considering and you will have a far clearer idea of the fit than
          size labels alone can give. Sizing can vary a little between styles, so it is always worth this quick check rather
          than assuming your usual size will be identical every time.
        </p>
      </section>

      <section className="seo-section">
        <h2>Fit after washing</h2>
        <p>
          Natural fabrics like cotton can move a little the first time they are washed, so it is worth washing cooler and
          drying gently to keep a garment true to size. Turning items inside out and avoiding a hot tumble dry protects both
          the fit and any print. Following the care label is the simplest way to keep a piece fitting the way it did on day
          one.
        </p>
        <p>
          If you like a close fit and know you tend to wash warm, bear that in mind when choosing between two sizes. When in
          doubt, a slightly roomier fit gives you more room to play with than one that is already snug. Ask us if you would
          like a steer for a particular style.
        </p>
      </section>

      <GuideCta />

      <GuideRelated
        links={[
          { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Everyday hoodies, sweatshirts and sets." },
          { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "Outerwear, coats and layering pieces." },
          { href: "/how-to-order", title: "How to Order", blurb: "A simple step-by-step ordering guide." },
          { href: "/contact", title: "Contact CNFans UK", blurb: "Ask for a size recommendation before ordering." },
        ]}
      />
    </main>
  );
}
