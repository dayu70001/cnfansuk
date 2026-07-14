import Link from "next/link";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { JsonLd } from "@/components/JsonLd";
import { buildGuidePageSchemas } from "@/lib/seoPage";
import type { PhaseThreeGuide } from "@/lib/phaseThreeGuides";

export function FindsGuidePage({ guide }: { guide: PhaseThreeGuide }) {
  return (
    <main className="seo-page">
      <JsonLd data={buildGuidePageSchemas({ path: guide.path, name: guide.h1, description: guide.description })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK clothing guide</p>
        <h1>{guide.h1}</h1>
        <p className="seo-lead">{guide.intro}</p>
      </header>

      {guide.sections.map((section) => (
        <section className="seo-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}

      <section className="seo-section">
        <h2>Fit and sizing before you order</h2>
        <p>
          Start with the measurements on the product page rather than relying only on the letter printed in the label. Compare
          the chest, waist, hip or inside-leg measurement with a similar piece you already wear. Our <Link href="/cnfans-size-guide">CNFans
          UK size guide</Link> explains the simplest way to measure at home. Allow a little extra room when a piece is meant to
          layer, and remember that a relaxed cut should still sit properly at the shoulders or waist.
        </p>
        <p>
          Fabric changes how a size feels. Cotton jersey may soften with wear, denim starts firmer, and a brushed sweatshirt
          feels fuller than a light loopback layer. If two sizes look possible, think about the outfit you want rather than
          automatically choosing the larger one. You can also <Link href="/contact">contact us</Link> with the product and your
          usual size before placing an order.
        </p>
      </section>

      <section className="seo-section">
        <h2>Ordering, delivery and everyday support</h2>
        <p>
          Check <Link href="/category/new-in">New In</Link> for recent additions, then use our <Link href="/how-to-order">how to
          order guide</Link> if you want a quick walk-through. Product availability can change between batches, so it is worth
          checking colour and size choices when you are ready to buy. Once an order is on its way, the <Link href="/cnfans-delivery-uk">UK
          delivery guide</Link> covers timings, tracking and the details that help a parcel move smoothly.
        </p>
        <p>
          CNFans UK is an independent clothing store and product discovery site. These pages are written to help you compare
          practical clothing choices, not to promise that one cut will suit everybody. Browse the wider <Link href="/cnfans-finds">CNFans
          finds guide</Link> or return to the <Link href="/guides">guides index</Link> when you want to compare another category,
          season or way of dressing.
        </p>
      </section>

      <GuideCta browseHref={guide.categoryHref} browseLabel={guide.categoryLabel} />
      <GuideRelated links={guide.related} />
    </main>
  );
}
