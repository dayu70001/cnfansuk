import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-jacket-finds",
  title: "CNFans Jacket Finds UK | Outerwear, Coats & Layering Pieces",
  description:
    "Browse CNFans jacket finds in the UK, including outerwear, coats and layering pieces for everyday outfits.",
});

export default function CnfansJacketFindsPage() {
  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: "/cnfans-jacket-finds", name: "CNFans Jacket Finds UK", description: "Explore jacket, coat and everyday layering finds with practical fit notes for UK shoppers." })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans Jacket Finds UK</h1>
        <p className="seo-lead">
          A round-up of everyday outerwear. CNFans UK is an independent clothing store and product discovery site, and this
          page brings together jackets, coats and layering pieces made for a normal British week.
        </p>
      </header>

      <section className="seo-section">
        <h2>Outerwear for everyday wear</h2>
        <p>
          A jacket does a lot of work: it sets the tone of an outfit and keeps you comfortable when the weather turns. We
          lean towards practical shapes and easy colours that suit day-to-day life rather than one big occasion.
        </p>
        <p>
          Browse the full range in our <Link href="/category/outerwear">outerwear</Link> category, where jackets, overshirts and
          coats sit together.
        </p>
      </section>

      <section className="seo-section">
        <h2>Layering pieces</h2>
        <p>
          The best jackets play well with the rest of your wardrobe. Wear one over a{" "}
          <Link href="/cnfans-hoodie-finds">hoodie</Link> for cold mornings, or over a plain tee when it is milder. Leaving a
          little room underneath makes layering easy &mdash; our <Link href="/cnfans-size-guide">size guide</Link> covers how to
          size a jacket for the layers you actually wear.
        </p>
      </section>

      <section className="seo-section">
        <h2>One jacket or a few?</h2>
        <p>
          If you are starting out, one versatile jacket in a neutral colour will do more work than several specialist ones. A
          mid-weight style you can layer over a hoodie covers spring, autumn and mild winter days, and goes with almost any
          outfit. Once you have that, a heavier coat for the cold months and a lighter layer for warmer days round things off
          nicely.
        </p>
        <p>
          Think about what you actually do day to day rather than buying for a one-off occasion. The jackets you reach for
          most are usually the plain, practical ones that fit into a normal week.
        </p>
      </section>

      <section className="seo-section">
        <h2>Practical styling</h2>
        <p>
          Keep it simple and a jacket will go with almost anything. Pair outerwear with{" "}
          <Link href="/category/bottoms">relaxed trousers or joggers</Link> and a neutral top for a look that works for errands,
          work or travel. The aim is pieces you can throw on without thinking.
        </p>
      </section>

      <section className="seo-section">
        <h2>Coats and warmer options</h2>
        <p>
          When the temperature drops, a heavier coat or padded jacket makes all the difference. Check the fabric and weight
          on each product page so you know how warm a piece will be before you order &mdash; our{" "}
          <Link href="/cnfans-qc-photos">guide to checking products</Link> shows what to look for.
        </p>
      </section>

      <section className="seo-section">
        <h2>Jackets for the British weather</h2>
        <p>
          Our climate asks a lot of a jacket. Most days it is not about extreme cold so much as damp, wind and the odd
          shower, so a mid-weight layer you can wear from morning to evening tends to be the most useful thing to own. Look
          for something you can pop on over a hoodie without feeling bulky.
        </p>
        <p>
          If you cycle, walk or catch the bus, a jacket that moves with you and shrugs off light rain earns its place fast.
          For deep winter, layer a coat over your usual pieces rather than relying on one item to do everything.
        </p>
      </section>

      <section className="seo-section">
        <h2>Looking after outerwear</h2>
        <p>
          Jackets last longer with a little care. Follow the label, do up zips before washing, and avoid over-washing &mdash;
          outerwear rarely needs it. Air a jacket out between wears and it will stay fresh far longer than you might expect.
        </p>
      </section>

      <section className="seo-section">
        <h2>Ready to browse?</h2>
        <p>
          New outerwear is added in batches, so check <Link href="/category/new-in">New In</Link> for the latest jackets. Not sure
          on sizing for layering? <Link href="/contact">Contact us</Link> before ordering and we will point you to the right fit for
          the layers you actually wear.
        </p>
      </section>

      <section className="seo-section">
        <h2>Matching a jacket to your wardrobe</h2>
        <p>
          The easiest jackets to own are the ones that already go with what you wear. Before adding a new piece, picture it
          over the tops and bottoms you reach for most. A neutral overshirt or coat will sit happily with jeans, joggers and
          plain tees, while a bolder colour or pattern works best when the rest of the outfit stays simple.
        </p>
        <p>
          It also helps to think about the gap in your wardrobe rather than the jacket in isolation. If you already have a
          warm winter coat, a lighter layer for spring might be the more useful buy &mdash; and the other way round. Building
          up a small, practical rotation beats owning several jackets that all do the same job.
        </p>
        <p>
          If you are unsure which layer fills that gap, tell us what you already own and how you plan to wear it, and we will
          suggest something that works with the rest of your wardrobe rather than against it.
        </p>
      </section>

      <GuideCta browseHref="/category/outerwear" browseLabel="Browse Outerwear" />

      <GuideRelated
        links={[
          { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Hoodies to layer under your jacket." },
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Jacket fit notes for easy layering." },
          { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "How to check fabric and finish before ordering." },
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "See finds across every clothing type." },
        ]}
      />
    </main>
  );
}
