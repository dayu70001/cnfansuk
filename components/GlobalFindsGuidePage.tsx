import Link from "next/link";
import type { ReactNode } from "react";
import { GuideCta } from "@/components/GuideCta";
import { GuideRelated } from "@/components/GuideRelated";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { getProductsByCategory } from "@/data/products";
import { fetchCatalogPage } from "@/lib/catalogApi";
import { buildGuidePageSchemas } from "@/lib/seoPage";
import type { GlobalFindsGuide } from "@/lib/phaseFiveGuides";

/**
 * Product-discovery guide renderer for the global 2026 expansion. Product
 * cards come from the live catalogue and are filtered by explicit title
 * signals; an empty narrow result is left empty rather than padded with an
 * unrelated item.
 */
export async function GlobalFindsGuidePage({ guide }: { guide: GlobalFindsGuide }) {
  const catalog = await fetchCatalogPage(
    {
      category: guide.catalogCategory,
      subcategory: guide.catalogSubcategory,
      ...(guide.catalogQuery ? { q: guide.catalogQuery } : {}),
      page: 1,
      limit: 50,
    },
    { bypassNextCache: true },
  );
  const localProducts = getProductsByCategory(guide.catalogCategory)
    .filter((product) => !guide.catalogSubcategory || product.style === guide.catalogSubcategory);
  const sourceProducts = catalog?.products || localProducts;
  const relatedProducts = sourceProducts
    // Use the stored product title as the primary signal. Descriptions often
    // contain generic fit language (for example “relaxed”), which should not
    // relabel a slim or unrelated item as a narrow discovery intent.
    .filter((product) => guide.productPattern ? guide.productPattern.test(product.name) : true)
    .filter((product) => guide.productExcludePattern ? !guide.productExcludePattern.test(product.name) : true)
    .slice(0, 4);

  return (
    <main className="seo-page seo-global-finds-page">
      <JsonLd data={buildGuidePageSchemas({ path: guide.path, name: guide.h1, description: guide.description })} />
      <header className="seo-hero">
        <p className="eyebrow">CNFans clothing discovery · 2026</p>
        <h1>{guide.h1}</h1>
        <p className="seo-lead">{guide.intro}</p>
      </header>

      {guide.sections.map((section) => (
        <section className="seo-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{renderGuideText(paragraph)}</p>)}
          {section.items ? (
            <ul>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </section>
      ))}

      {relatedProducts.length ? (
        <section className="seo-section" aria-labelledby="global-finds-products-heading">
          <h2 id="global-finds-products-heading">{guide.productHeading}</h2>
          <p>These links are drawn from the live catalogue and give the editorial notes a real product reference. Stock, options and prices can change between batches.</p>
          <div className="category-product-grid">
            {relatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ) : (
        <section className="seo-section" aria-labelledby="global-finds-products-heading">
          <h2 id="global-finds-products-heading">{guide.productHeading}</h2>
          <p>No live product currently carries a clear {guide.primaryKeyword.replace("cnfans ", "")} signal in its stored title. The page stays useful as a buying guide, and the catalogue link below remains the honest place to check when new matching items are added.</p>
        </section>
      )}

      <section className="seo-section seo-longtail-note">
        <h2>{guide.closingHeading}</h2>
        <p>{renderGuideText(guide.closing)}</p>
      </section>

      <GuideCta browseHref={guide.browseHref} browseLabel={guide.browseLabel} />
      <GuideRelated heading="Related clothing guides" links={guide.related} />
    </main>
  );
}

function renderGuideText(text: string) {
  const parts: ReactNode[] = [];
  const linkPattern = /<a href="(\/[^\"]+)">([^<]+)<\/a>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text))) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(<Link href={match[1]} key={`${match[1]}-${match.index}`}>{match[2]}</Link>);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
