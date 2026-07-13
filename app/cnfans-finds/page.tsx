import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-finds",
  title: "CNFans Finds UK | Hoodies, Jackets, T-Shirts & Everyday Apparel",
  description:
    "Browse CNFans UK finds across hoodies, jackets, t-shirts, trousers and matching sets. Simple clothing discovery for UK buyers.",
});

export default function CnfansFindsPage() {
  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: "/cnfans-finds", name: "CNFans Finds UK", description: "Browse practical notes on CNFans finds for hoodies, jackets, T-shirts and everyday apparel for UK shoppers." })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans Finds UK</h1>
        <p className="seo-lead">
          A starting point for clothing discovery. CNFans UK is an independent clothing store and product discovery site, so
          this page pulls together our main styles &mdash; hoodies, jackets, t-shirts, bottoms and sets &mdash; in one easy list.
        </p>
      </header>

      <section className="seo-section">
        <h2>Finds, without the guesswork</h2>
        <p>
          &ldquo;Finds&rdquo; is just a friendly word for the pieces worth picking up. Rather than sending you down a rabbit
          hole of lists and screenshots, we keep our everyday clothing grouped into clear categories you can browse in a
          minute or two.
        </p>
        <p>
          Every style has its own page with photos and details, so you can see what you are getting before you decide. Use
          the sections below to jump straight to what you are after.
        </p>
      </section>

      <section className="seo-section">
        <h2>Hoodies</h2>
        <p>
          Relaxed hoodies and sweatshirts for daily wear and easy layering. They work on their own in milder weather or
          under a jacket when it turns cold.
        </p>
        <p>
          See our dedicated <Link href="/cnfans-hoodie-finds">hoodie finds</Link> page, or browse the full{" "}
          <Link href="/category/tops">tops</Link> category.
        </p>
      </section>

      <section className="seo-section">
        <h2>Jackets</h2>
        <p>
          Everyday outerwear for cooler days, light rain and layering over a hoodie or tee. Practical shapes that suit a
          normal week rather than one big occasion.
        </p>
        <p>
          Have a look at our <Link href="/cnfans-jacket-finds">jacket finds</Link> page, or the full{" "}
          <Link href="/category/outerwear">outerwear</Link> category.
        </p>
      </section>

      <section className="seo-section">
        <h2>T-Shirts</h2>
        <p>
          Plain, wearable tees that anchor the rest of your outfit. Good for building a simple daily rotation you never have
          to think too hard about. Browse them within our <Link href="/category/tops">tops</Link> category.
        </p>
      </section>

      <section className="seo-section">
        <h2>Bottoms</h2>
        <p>
          Trousers, joggers and shorts cut for comfort and everyday styling. See the full{" "}
          <Link href="/category/bottoms">bottoms</Link> category to match them with your tops.
        </p>
      </section>

      <section className="seo-section">
        <h2>Co-ords &amp; Sets</h2>
        <p>
          When you would rather not think about matching, a set does the work for you. Browse{" "}
          <Link href="/category/co-ords-sets">co-ords and sets</Link> for a complete look in one go.
        </p>
      </section>

      <section className="seo-section">
        <h2>Building outfits from your finds</h2>
        <p>
          The nice thing about keeping to a few core categories is that everything works together. A hoodie, a plain tee, a
          pair of relaxed trousers and a jacket will cover most of what a normal week throws at you. Add a set for the days
          you would rather not think about it.
        </p>
        <p>
          Start with neutral colours if you are building from scratch &mdash; they mix easily and stop your wardrobe feeling
          like a pile of one-off pieces. From there you can add a bolder colour or two once you know what you reach for.
        </p>
      </section>

      <section className="seo-section">
        <h2>Quality worth keeping</h2>
        <p>
          A find is only a good one if you still like it a few months later. That is why we lean towards simple, well-made
          everyday pieces rather than throwaway trends. Neat stitching, a comfortable weight of fabric and a fit that suits
          real life go a lot further than a design you will be bored of by next season.
        </p>
        <p>
          Each product page gives you what you need to judge that for yourself. Have a proper look at the photos and details
          before you decide &mdash; our <Link href="/cnfans-qc-photos">guide to checking products</Link> shows exactly what to look
          for.
        </p>
      </section>

      <section className="seo-section">
        <h2>Made for UK buyers</h2>
        <p>
          Everything here is written with UK shoppers in mind: UK English, familiar fit language and delivery notes that make
          sense for orders coming to the UK. Prices are clear and the checkout is simple. If you are comparing what you found
          on a shared list elsewhere, our shop is an easy, tidy place to browse the same kinds of styles.
        </p>
      </section>

      <section className="seo-section">
        <h2>New arrivals first</h2>
        <p>
          Styles are added in batches, so the quickest way to see what is fresh is the{" "}
          <Link href="/category/new-in">New In</Link> page. Check the <Link href="/cnfans-size-guide">size guide</Link> before you order,
          and see the <Link href="/cnfans-delivery-uk">delivery guide</Link> for timings.
        </p>
      </section>

      <section className="seo-section">
        <h2>How we choose what to stock</h2>
        <p>
          We keep the range focused rather than endless. The aim is a tidy set of everyday pieces that work together, so you
          are not wading through hundreds of near-identical items to find something wearable. New styles are added in batches,
          which keeps things fresh without turning the shop into a maze.
        </p>
        <p>
          If you cannot see exactly what you had in mind, it is worth checking back, as the line-up changes over time. You can
          also <Link href="/contact">get in touch</Link> and tell us what you are after &mdash; it helps us understand what UK
          shoppers are looking for. Between the categories above and the latest arrivals, most people find an everyday piece
          that fits the bill.
        </p>
      </section>

      <GuideCta />

      <GuideRelated
        links={[
          { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Everyday hoodies, sweatshirts and sets." },
          { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "Outerwear, coats and layering pieces." },
          { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "What a finds spreadsheet is and how we simplify it." },
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Fit notes before you choose a size." },
        ]}
      />
    </main>
  );
}
