import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { FirstPartyCatalogueSnapshot } from "@/components/FirstPartyCatalogueSnapshot";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";
import { fetchFirstPartyCatalogueData } from "@/lib/firstPartyData";

export const metadata: Metadata = buildGuideMetadata({
  path: "/cnfans-spreadsheet",
  title: "CNFans Spreadsheet 2026 UK | Clothing Finds & Product Links",
  description:
    "Looking for a CNFans spreadsheet in 2026? Understand shared clothing lists, check product links and browse the independent CNFANS UK clothing catalogue.",
});

export default async function CnfansSpreadsheetPage() {
  const catalogueData = await fetchFirstPartyCatalogueData();

  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: "/cnfans-spreadsheet", name: "CNFans Spreadsheet UK", description: "A practical guide to shared CNFans clothing spreadsheets, product links and the independent CNFANS UK catalogue." })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFANS UK guide</p>
        <h1>CNFANS Spreadsheet UK</h1>
        <p className="seo-lead">
          A plain-English guide to shared &ldquo;CNFANS spreadsheet&rdquo; lists, product links and clothing finds. CNFANS.co.uk
          is an independent clothing shop, not a spreadsheet or the same service as CNFans.com.
        </p>
      </header>

      <section className="seo-section">
        <h2>What is a CNFANS spreadsheet?</h2>
        <p>
          A CNFANS spreadsheet usually means a shared list of clothing finds, often with an image, a short note and a product
          link. It can help someone collect ideas, compare styles or keep a personal shortlist.
        </p>
        <p>
          A shared sheet can become outdated: listings move, details change and a saved link may stop opening. CNFANS.co.uk
          is independently operated and sells clothing directly through its own product pages. It is separate from CNFans.com
          and does not transfer or access another service&rsquo;s accounts, orders or balances. Browse our current{" "}
          <Link href="/category/new-in">clothing catalogue</Link> or read about this{" "}
          <Link href="/cnfans-alternative">direct-shopping alternative</Link>.
        </p>
      </section>

      <section className="seo-section">
        <h2>Clothing finds for UK buyers</h2>
        <p>
          If you have been searching a CNFans clothing spreadsheet for hoodies, jackets, tops, trousers or sets, use the live
          catalogue to open current product pages and review their listed options. New products are added weekly; availability
          and product details can change.
        </p>
        <p>
          Start with <Link href="/category/new-in">New In</Link> or browse <Link href="/category/tops">Tops</Link>,{" "}
          <Link href="/category/outerwear">Outerwear</Link>, <Link href="/category/bottoms">Bottoms</Link> and{" "}
          <Link href="/category/co-ords-sets">Co-ords &amp; Sets</Link>. Product pages show the current listing details and price.
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
          Each CNFANS.co.uk product link opens a page with the available listing information, images and options. Check the
          current page before ordering rather than relying on a copied row from an older spreadsheet.
        </p>
        <p>
          If a third-party product link no longer works, the original listing may have moved or become unavailable. You can
          browse the <Link href="/cnfans-finds">CNFANS clothing finds</Link> or read our guide to{" "}
          <Link href="/cnfans-dead-links">CNFans links that stop working</Link>. We can review a reference image and suggest
          a similar item from the available catalogue, but cannot promise an identical match.
        </p>
      </section>

      <FirstPartyCatalogueSnapshot data={catalogueData} />

      <section className="seo-section">
        <h2>Size and delivery notes</h2>
        <p>
          Fit matters more than anything when you are buying online. Have a quick read of our{" "}
          <Link href="/cnfans-size-guide">size guide</Link> before ordering, especially for hoodies and jackets where the fit can
          be relaxed. If you are between sizes, get in touch and we will talk it through.
        </p>
        <p>
          For preparation, transit, tracking and shipping prices, see <Link href="/delivery">UK &amp; Europe delivery information</Link>.
          For sizing help, use our <Link href="/cnfans-size-guide">clothing size guide</Link> or ask the team before ordering.
        </p>
      </section>

      <section className="seo-section">
        <h2>Spreadsheet links and current availability</h2>
        <p>
          A third-party spreadsheet is not controlled by CNFANS.co.uk, and we cannot repair or guarantee its links. If a link
          fails, check whether the destination is temporarily unavailable, has moved or is no longer listed before assuming the
          entire site is offline. See the <Link href="/cnfans-status">CNFans website status update</Link> for what we could verify.
        </p>
        <p>
          For a separate way to discover clothing, use our live catalogue or browse the <Link href="/cnfans-finds">finds pages</Link>.
          Read each current product page for price, size options and availability.
        </p>
      </section>

      <section className="seo-section">
        <h2>Keeping track of styles you like</h2>
        <p>
          A spreadsheet can still be useful for personal research. If you prefer a direct shop, CNFANS.co.uk sells through its
          own catalogue and handles customer questions through its existing support channels.
        </p>
        <p>
          We are an independent clothing business, not an official CNFans.com channel or replacement. For more about how we
          operate, read <Link href="/about">About CNFANS UK</Link>; for questions about direct shopping, see{" "}
          <Link href="/cnfans-alternative">CNFANS as a clothing alternative</Link>.
        </p>
      </section>

      <GuideCta />

      <GuideRelated
        links={[
          { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Browse finds across hoodies, jackets, tops and sets." },
          { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Fit notes for hoodies, jackets, tops and bottoms." },
          { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Timings, tracking and order updates for UK buyers." },
          { href: "/how-to-order", title: "How to Order", blurb: "A simple step-by-step guide to placing an order." },
          { href: "/cnfans-alternative", title: "CNFans Alternative", blurb: "How direct clothing shopping with an independent UK store works." },
          { href: "/cnfans-dead-links", title: "CNFans Dead Links", blurb: "Troubleshoot a moved or unavailable spreadsheet link." },
        ]}
      />
    </main>
  );
}
