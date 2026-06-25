import type { MetadataRoute } from "next";
import { fetchSitemapProducts } from "@/lib/catalogApi";
import { products as fallbackProducts } from "@/data/products";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const CATEGORY_SLUGS = ["new-in", "outerwear", "tops", "bottoms", "co-ords-sets"];
const SUPPORT_PAGES = [
  "/delivery",
  "/returns",
  "/size-guide",
  "/track-order",
  "/contact",
  "/about",
  "/how-to-order",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...SUPPORT_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  // Product pages from the live catalog (read-only GET). Fall back to the
  // static product list if the catalog API is unavailable. No D1 / Worker
  // writes occur here.
  let catalogProducts: Awaited<ReturnType<typeof fetchSitemapProducts>> = null;
  try {
    catalogProducts = await fetchSitemapProducts();
  } catch {
    catalogProducts = null;
  }
  const productSource = catalogProducts ?? fallbackProducts;
  const seenSlugs = new Set<string>();
  for (const product of productSource) {
    if (!product?.slug || seenSlugs.has(product.slug)) continue;
    seenSlugs.add(product.slug);
    const lastModified = "lastModified" in product && product.lastModified ? new Date(product.lastModified) : now;
    entries.push({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
