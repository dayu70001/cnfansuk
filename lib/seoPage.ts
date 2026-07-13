import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Shared metadata builder for the CNFans UK guide / landing pages.
// Mirrors the canonical + OpenGraph + Twitter shape used on category pages,
// so every guide page is indexable with a self-referencing canonical URL.
export function buildGuideMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const canonical = `${SITE_URL}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const GUIDE_INDEX_ITEMS = [
  { path: "/cnfans-finds", name: "CNFans Finds UK" },
  { path: "/cnfans-spreadsheet", name: "CNFans Spreadsheet UK" },
  { path: "/cnfans-hoodie-finds", name: "CNFans Hoodie Finds UK" },
  { path: "/cnfans-jacket-finds", name: "CNFans Jacket Finds UK" },
  { path: "/how-to-order", name: "How to Order" },
  { path: "/cnfans-delivery-uk", name: "CNFans UK Delivery Guide" },
  { path: "/cnfans-size-guide", name: "CNFans UK Size Guide" },
  { path: "/cnfans-qc-photos", name: "CNFans QC Photos Guide" },
] as const;

function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildGuidePageSchemas({ path, name, description }: { path: string; name: string; description: string }) {
  const url = `${SITE_URL}${path}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    },
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Guides", url: `${SITE_URL}/guides` },
      { name, url },
    ]),
  ];
}

export function buildGuideIndexSchemas({ name, description }: { name: string; description: string }) {
  const url = `${SITE_URL}/guides`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      description,
      url,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    },
    breadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Guides", url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "CNFans UK guides",
      numberOfItems: GUIDE_INDEX_ITEMS.length,
      itemListElement: GUIDE_INDEX_ITEMS.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.name,
        url: `${SITE_URL}${guide.path}`,
      })),
    },
  ];
}
