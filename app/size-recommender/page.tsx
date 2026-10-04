import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SizeRecommenderClient } from "./SizeRecommenderClient";
import { SIZE_REFERENCE } from "@/lib/sizeRecommender";
import { buildGuideMetadata, buildGuidePageSchemas } from "@/lib/seoPage";

const pageDescription =
  "Use height, weight, chest measurement and preferred fit to get an approximate M, L, XL or XXL CNFans clothing size recommendation.";

export const metadata: Metadata = buildGuideMetadata({
  path: "/size-recommender",
  title: "CNFans Size Recommender | M–XXL Men's Clothing",
  description: pageDescription,
});

export default function SizeRecommenderPage() {
  return (
    <main className="seo-page size-recommender-page">
      <JsonLd data={buildGuidePageSchemas({
        path: "/size-recommender",
        name: "CNFans Size Recommender",
        description: pageDescription,
      })} />
      <nav className="category-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Size Recommender</span>
      </nav>
      <header className="seo-hero">
        <p className="eyebrow">CNFans UK sizing tool</p>
        <h1>CNFans Size Recommender</h1>
        <p className="seo-lead">
          Add your measurements and preferred fit for an approximate starting point across M–XXL men&rsquo;s clothing. The
          estimate uses body chest first, with height and weight as secondary references. Treat it as a starting reference, not a promise of fit.
        </p>
      </header>

      <section className="seo-section" aria-labelledby="size-tool-heading">
        <h2 id="size-tool-heading">Get a general size recommendation</h2>
        <p>
          Measure your body chest, rather than using a garment measurement. The figures below are general references;
          individual product measurements should take priority when available.
        </p>
        <SizeRecommenderClient />
      </section>

      <section className="seo-section" aria-labelledby="size-reference-heading">
        <h2 id="size-reference-heading">General Chinese Menswear Reference</h2>
        <p>
          These are approximate general reference measurements; individual garments and cuts can differ. Garment chest is the
          full circumference of a finished garment; flat chest is the width measured across the garment under the arms.
        </p>
        <p className="size-recommender-table-hint">On a small screen, scroll the table horizontally to compare all measurements.</p>
        <div className="first-party-table-wrap size-recommender-table-wrap" role="region" aria-label="Approximate general size reference table" tabIndex={0}>
          <table className="first-party-table size-recommender-table">
            <caption>Approximate general reference — measurements in centimetres unless stated otherwise.</caption>
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Chinese reference</th>
                <th scope="col">Garment chest</th>
                <th scope="col">Flat chest</th>
                <th scope="col">Shoulder</th>
                <th scope="col">Length</th>
                <th scope="col">Sleeve</th>
                <th scope="col">Height</th>
                <th scope="col">Weight</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_REFERENCE.map((row) => (
                <tr key={row.size}>
                  <th scope="row">{row.size}</th>
                  <td>{row.chineseReference}</td>
                  <td>{row.garmentChest} cm <span className="size-recommender-range">({row.garmentChestRange})</span></td>
                  <td>{row.flatChest} cm</td>
                  <td>{row.shoulder}</td>
                  <td>{row.length}</td>
                  <td>{row.sleeve}</td>
                  <td>{row.heightRange}</td>
                  <td>{row.weightRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="seo-section">
        <h2>How the recommendation works</h2>
        <p>
          Your body chest measurement is the primary input. The tool adds 8 cm for a slim fit, 12 cm for regular or 16 cm
          for relaxed, then starts with the smallest available garment chest that meets that target. Height and weight are
          secondary checks and can move the result up by no more than one size when both point higher. They will not lower
          a size required by the chest calculation.
        </p>
        <p>
          If your target is above the XXL reference, the tool shows XXL as the closest available size and advises checking
          the item measurements. When height, weight and chest suggest different ranges, the result is marked low confidence
          rather than presented as exact.
        </p>
      </section>

      <section className="seo-section">
        <h2>Check the individual style</h2>
        <p>
          Different brands and styles can fit differently. Puffer jackets, down jackets, oversized cuts and drop-shoulder
          pieces may measure larger than this general reference. Always compare the product&rsquo;s own measurements when
          they are available.
        </p>
      </section>

      <section className="seo-section size-recommender-related-links" aria-label="Related sizing and ordering guides">
        <p>For measuring advice and broader fit notes, visit the <Link href="/cnfans-size-guide">CNFans size guide</Link>.</p>
        <p>Ready to browse? See <Link href="/how-to-order">how to order from CNFans UK</Link>.</p>
      </section>
    </main>
  );
}
