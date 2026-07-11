import type { Metadata } from "next";
import Link from "next/link";
import { buildGuideMetadata } from "@/lib/seoPage";

export const metadata: Metadata = buildGuideMetadata({
  path: "/guides",
  title: "CNFans UK Guides | Ordering, Finds, Sizing & Delivery",
  description:
    "Browse CNFans UK guides for clothing finds, ordering, delivery, sizing and product checks before you buy.",
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

export default function GuidesPage() {
  return (
    <main className="seo-page guides-index">
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK guide</p>
        <h1>CNFans UK Guides</h1>
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
    </main>
  );
}
