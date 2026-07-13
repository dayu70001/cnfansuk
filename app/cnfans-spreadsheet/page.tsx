import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-spreadsheet",
  title: "CNFans Spreadsheet UK | Clothing Finds, QC Photos & Product Links",
  description:
    "Explore CNFans UK clothing finds, everyday apparel picks, size notes and product links for UK buyers looking for a simpler way to browse styles.",
});

export default function CnfansSpreadsheetPage() {
  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: "/cnfans-spreadsheet", name: "CNFans Spreadsheet UK", description: "A practical guide to CNFans spreadsheets, clothing finds, product links and the checks UK shoppers can make before ordering." })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans Spreadsheet UK</h1>
        <p className="seo-lead">
          A plain-English look at what people mean by a &ldquo;CNFans spreadsheet&rdquo;, and how CNFans UK keeps things
          simpler with a proper clothing shop, clear product links and honest size notes.
        </p>
      </header>

      <section className="seo-section">
        <h2>What is a CNFans spreadsheet?</h2>
        <p>
          A CNFans spreadsheet is usually a shared list of clothing finds &mdash; hoodies, jackets, tops and bottoms &mdash;
          with a photo, a short note and a link for each item. People pass these lists around so friends can browse the
          same styles without starting from scratch.
        </p>
        <p>
          The idea is handy, but spreadsheets get out of date fast. Links break, sizes go missing and it&rsquo;s hard to
          tell what is actually available. CNFans UK is an independent clothing store and product discovery site, so
          instead of a loose list you get a tidy shop where every style has its own page, photos and details in one place.
        </p>
      </section>

      <section className="seo-section">
        <h2>Clothing finds for UK buyers</h2>
        <p>
          If you have been scrolling through spreadsheets looking for everyday pieces, our shop covers the same ground in a
          cleaner way. We focus on wardrobe staples that are easy to wear on repeat rather than one-off novelty items.
        </p>
        <p>
          Everything is written for UK shoppers: UK English, familiar sizing language and delivery notes that make sense for
          orders coming to the UK. You can browse by category or start with the latest arrivals.
        </p>
      </section>

      <section className="seo-section">
        <h2>Hoodies, jackets, tops, bottoms and sets</h2>
        <p>Our clothing sits in a handful of simple groups so you can find a style quickly:</p>
        <ul>
          <li>
            <Link href="/cnfans-hoodie-finds">Hoodies and sweatshirts</Link> for everyday layering.
          </li>
          <li>
            <Link href="/cnfans-jacket-finds">Jackets and outerwear</Link> for cooler days and light rain.
          </li>
          <li>
            <Link href="/category/tops">Tops and t-shirts</Link> to build a plain daily rotation.
          </li>
          <li>
            <Link href="/category/bottoms">Trousers, joggers and shorts</Link> cut for relaxed wear.
          </li>
          <li>
            <Link href="/category/co-ords-sets">Co-ords and matching sets</Link> when you want a full look with no effort.
          </li>
        </ul>
      </section>

      <section className="seo-section">
        <h2>How to use product links</h2>
        <p>
          Each product link opens a single page with photos, a description and the details you need before choosing a size.
          Rather than copying rows from a spreadsheet, you can add an item to your bag straight from its page.
        </p>
        <p>
          If you found a style on a shared list somewhere else, search our shop for something similar &mdash; there is a good
          chance we carry a comparable everyday piece. When you are unsure which page matches, our team is happy to point you
          in the right direction.
        </p>
      </section>

      <section className="seo-section">
        <h2>Size and delivery notes</h2>
        <p>
          Fit matters more than anything when you are buying online. Have a quick read of our{" "}
          <Link href="/cnfans-size-guide">size guide</Link> before ordering, especially for hoodies and jackets where the fit can
          be relaxed. If you are between sizes, get in touch and we will talk it through.
        </p>
        <p>
          For timings, tracking and what happens after you order, see our{" "}
          <Link href="/cnfans-delivery-uk">UK delivery guide</Link>. It covers processing, updates and what to do if a parcel is
          running late.
        </p>
      </section>

      <section className="seo-section">
        <h2>Why a shop beats a spreadsheet</h2>
        <p>
          Shared lists are a nice idea, but they age quickly. A shop keeps everything current: if a style is on the page, you
          can see it, read the details and order it in one place. There is no chasing broken links or wondering whether a row
          is still accurate.
        </p>
        <p>
          It is also simpler to trust. Every product page shows the same clear information, so you always know what you are
          looking at. That is the whole idea behind CNFans UK &mdash; the convenience of a good finds list, with none of the
          guesswork.
        </p>
      </section>

      <section className="seo-section">
        <h2>Keeping track of styles you like</h2>
        <p>
          One reason people build spreadsheets is simply to remember the styles they like. A shop makes that easier: you can
          browse a category, open anything that catches your eye and come back to it later without keeping a separate list.
          Because every item lives on its own page, there is nothing to copy across or keep updated.
        </p>
        <p>
          It is also worth being clear about who we are. CNFans UK is an independent clothing store and product discovery
          site &mdash; not an official channel for anyone else. What you see is our own everyday apparel, described honestly,
          so you can decide what is right for you. If you want a second opinion before ordering, our team is happy to help
          rather than leaving you to guess from a list.
        </p>
      </section>

      <GuideCta />

      <GuideRelated
        links={[
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse finds across hoodies, jackets, tops and sets." },
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Fit notes for hoodies, jackets, tops and bottoms." },
          { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Timings, tracking and order updates for UK buyers." },
          { href: "/how-to-order", title: "How to Order", blurb: "A simple step-by-step guide to placing an order." },
        ]}
      />
    </main>
  );
}
