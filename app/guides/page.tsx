import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PHASE_FOUR_GUIDES } from "@/lib/phaseFourGuides";
import { PHASE_THREE_GUIDES } from "@/lib/phaseThreeGuides";
import { PHASE_FIVE_PUBLIC_GUIDES } from "@/lib/phaseFiveGuides";
import { PHASE_SIX_GUIDES } from "@/lib/phaseSixGuides";
import { PHASE_EIGHT_GUIDES } from "@/lib/phaseEightGuides";
import { buildGuideIndexSchemas, buildGuideMetadata } from "@/lib/seoPage";

const PAGE_TITLE = "Men's Clothing Guides UK | CNFans UK";
const PAGE_DESCRIPTION =
  "Browse men's clothing guides for UK shoppers, covering T-shirts, hoodies, jackets, trousers, tracksuits, sizing, delivery and product checks.";

export const metadata: Metadata = buildGuideMetadata({
  path: "/guides",
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
});

const guides = [
  { href: "/cnfans-finds", title: "CNFans Finds UK", blurb: "Everyday finds across hoodies, jackets, tops, bottoms and sets." },
  { href: "/cnfans-spreadsheet", title: "CNFans Spreadsheet UK", blurb: "What a finds spreadsheet is, and a simpler way to browse styles." },
  { href: "/cnfans-hoodie-finds", title: "CNFans Hoodie Finds UK", blurb: "Everyday hoodies, sweatshirts and matching sets." },
  { href: "/cnfans-jacket-finds", title: "CNFans Jacket Finds UK", blurb: "Outerwear, coats and layering pieces for daily wear." },
  { href: "/how-to-order", title: "How to Order", blurb: "A simple step-by-step guide from browsing to tracking." },
  { href: "/cnfans-delivery-uk", title: "CNFans UK Delivery Guide", blurb: "Timings, tracking and order updates for UK buyers." },
  { href: "/cnfans-size-guide", title: "CNFans UK Size Guide", blurb: "Fit notes for hoodies, jackets, t-shirts and bottoms." },
  { href: "/cnfans-qc-photos", title: "CNFans QC Photos Guide", blurb: "How to check size, fabric, colour and finish before ordering." },
];

const phaseFourSections = [
  {
    heading: "CNFans Sizing & Fit",
    paths: [
      "/cnfans-size-up-or-true-to-size",
      "/cnfans-hoodie-sizing",
      "/cnfans-jacket-sizing",
      "/cnfans-puffer-jacket-sizing",
      "/cnfans-tracksuit-sizing",
      "/cnfans-jeans-sizing",
      "/cnfans-size-labels-vs-measurements",
      "/cnfans-same-size-different-fit",
      "/cnfans-hoodie-fabric-weight",
    ],
  },
  {
    heading: "CNFans QC",
    paths: [
      "/cnfans-qc-photos-fit",
      "/cnfans-hoodie-qc",
      "/cnfans-jacket-qc",
      "/cnfans-puffer-qc",
      "/cnfans-product-photos-vs-qc-photos",
    ],
  },
  {
    heading: "CNFans Shipping & Weight",
    paths: [
      "/cnfans-estimated-weight-vs-actual-weight",
      "/cnfans-volumetric-weight",
      "/cnfans-rehearsal-shipping",
      "/cnfans-haul-weight",
      "/cnfans-puffer-weight",
      "/cnfans-packaging-weight",
    ],
  },
  {
    heading: "CNFans Finds & Spreadsheet",
    paths: [
      "/cnfans-dead-links",
      "/cnfans-spreadsheet-search-tips",
      "/cnfans-finds-vs-spreadsheet",
      "/cnfans-reddit",
    ],
  },
];

export default function GuidesPage() {
  return (
    <main className="seo-page guides-index">
      <JsonLd data={buildGuideIndexSchemas({ name: "Men's Clothing Guides UK", description: PAGE_DESCRIPTION })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>Men&apos;s Clothing Guides UK</h1>
        <p className="seo-lead">
          Short, practical guides to help you shop with confidence. Find clothing picks, sizing and delivery notes, and a few
          tips on checking a piece before you order.
        </p>
      </header>

      <div className="guides-index-grid">
        {guides.map((guide) => (
          <Link href={guide.href} key={guide.href}>
            <strong>{guide.title}</strong>
            <span>{guide.blurb}</span>
          </Link>
        ))}
      </div>

      <section className="guides-index-section" aria-labelledby="clothing-finds-heading">
        <h2 id="clothing-finds-heading">Clothing Finds</h2>
        <div className="guides-index-grid guides-index-grid-compact">
          {PHASE_THREE_GUIDES.map((guide) => (
            <Link href={guide.path} key={guide.path}>
              <strong>{guide.h1}</strong>
              <span>{guide.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="guides-index-section" aria-labelledby="global-clothing-finds-heading">
        <h2 id="global-clothing-finds-heading">Global Clothing Finds · 2026</h2>
        <div className="guides-index-grid guides-index-grid-compact">
          {PHASE_FIVE_PUBLIC_GUIDES.map((guide) => (
            <Link href={guide.path} key={guide.path}>
              <strong>{guide.h1}</strong>
              <span>{guide.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="guides-index-section" aria-labelledby="phase-six-clothing-finds-heading">
        <h2 id="phase-six-clothing-finds-heading">More Global Clothing Finds · 2026</h2>
        <div className="guides-index-grid guides-index-grid-compact">
          {PHASE_SIX_GUIDES.map((guide) => (
            <Link href={guide.path} key={guide.path}>
              <strong>{guide.h1}</strong>
              <span>{guide.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="guides-index-section" aria-labelledby="phase-eight-clothing-finds-heading">
        <h2 id="phase-eight-clothing-finds-heading">New Global Clothing Finds · 2026</h2>
        <div className="guides-index-grid guides-index-grid-compact">
          {PHASE_EIGHT_GUIDES.map((guide) => (
            <Link href={guide.path} key={guide.path}>
              <strong>{guide.h1}</strong>
              <span>{guide.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {phaseFourSections.map((section) => {
        const sectionGuides = PHASE_FOUR_GUIDES.filter((guide) => section.paths.includes(guide.path));
        return (
          <section className="guides-index-section" aria-labelledby={`${section.heading}-heading`} key={section.heading}>
            <h2 id={`${section.heading}-heading`}>{section.heading}</h2>
            <div className="guides-index-grid guides-index-grid-compact">
              {sectionGuides.map((guide) => (
                <Link href={guide.path} key={guide.path}>
                  <strong>{guide.h1}</strong>
                  <span>{guide.description}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
