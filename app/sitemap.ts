import type { MetadataRoute } from "next";
import { products as localProducts } from "@/data/products";
import { fetchCatalogFilters, fetchCatalogPage, fetchSitemapProducts } from "@/lib/catalogApi";
import { catalogSeoSubcategories, catalogSeoSubcategoryPath } from "@/lib/catalogTaxonomy";
import { PHASE_FOUR_GUIDES } from "@/lib/phaseFourGuides";
import { PHASE_FIVE_PUBLIC_GUIDES } from "@/lib/phaseFiveGuides";
import { PHASE_SIX_GUIDES } from "@/lib/phaseSixGuides";
import { PHASE_EIGHT_GUIDES } from "@/lib/phaseEightGuides";
import { SITE_URL } from "@/lib/site";

const PUBLIC_PATHS = [
  "/",
  "/category/new-in",
  "/category/outerwear",
  "/category/tops",
  "/category/bottoms",
  "/category/co-ords-sets",
  "/delivery",
  "/returns",
  "/size-guide",
  "/track-order",
  "/contact",
  "/about",
  "/how-to-order",
  "/privacy-policy",
  "/terms",
  "/payment-security",
  "/bank-transfer-payment-help",
  "/uk-customs-and-import-charges",
  "/guides",
  "/cnfans-spreadsheet",
  "/cnfans-finds",
  "/cnfans-delivery-uk",
  "/cnfans-qc-photos",
  "/cnfans-size-guide",
  "/size-recommender",
  "/cnfans-hoodie-finds",
  "/cnfans-jacket-finds",
  "/cnfans-t-shirt-finds",
  "/cnfans-tracksuit-finds",
  "/cnfans-sweatshirt-finds",
  "/cnfans-trouser-finds",
  "/cnfans-cargo-pants-finds",
  "/cnfans-jeans-finds",
  "/cnfans-co-ord-finds",
  "/cnfans-streetwear-finds",
  "/cnfans-winter-jacket-finds",
  "/cnfans-summer-outfits",
  "/cnfans-men-clothing-finds",
  "/cnfans-uk-new-in",
  ...PHASE_FOUR_GUIDES.map((guide) => guide.path),
  ...PHASE_FIVE_PUBLIC_GUIDES.map((guide) => guide.path),
  ...PHASE_SIX_GUIDES.map((guide) => guide.path),
  ...PHASE_EIGHT_GUIDES.map((guide) => guide.path),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalogProducts, catalogFilters] = await Promise.all([
    fetchSitemapProducts(),
    fetchCatalogFilters(),
  ]);
  const productsBySlug = new Map<string, { slug: string; lastModified?: string | null }>();

  for (const product of catalogProducts || []) {
    if (product.slug) productsBySlug.set(product.slug, product);
  }
  for (const product of localProducts) {
    if (!productsBySlug.has(product.slug)) productsBySlug.set(product.slug, { slug: product.slug });
  }

  const missingSubcategoryCountLookups = catalogFilters
    ? await Promise.all(catalogSeoSubcategories
      .filter((item) => (catalogFilters.counts.subcategories.find(
        (count) => count.category === item.category && count.subcategory === item.value,
      )?.count ?? 0) <= 0)
      .map(async (item) => {
        const page = await fetchCatalogPage(
          { category: item.category, subcategory: item.value, page: 1, limit: 1 },
          { bypassNextCache: true },
        );
        return [`${item.category}/${item.value}`, page?.total ?? 0] as const;
      }))
    : [];
  const missingSubcategoryCounts = new Map(missingSubcategoryCountLookups);

  const indexableSubcategoryPaths = catalogFilters
    ? catalogSeoSubcategories
        .filter((item) => {
          const row = catalogFilters.counts.subcategories.find(
            (count) => count.category === item.category && count.subcategory === item.value,
          );
          const count = row?.count ?? missingSubcategoryCounts.get(`${item.category}/${item.value}`) ?? 0;
          return count >= 5;
        })
        .map((item) => catalogSeoSubcategoryPath(item.category, item.value))
    : [];

  const publicPages: MetadataRoute.Sitemap = [...PUBLIC_PATHS, ...indexableSubcategoryPaths].map((path) => ({
    url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`,
    changeFrequency: path.startsWith("/category/") || path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/category/") ? 0.8 : 0.5,
  }));

  const productPages: MetadataRoute.Sitemap = Array.from(productsBySlug.values()).map((product) => {
    const lastModified = toValidDate(product.lastModified);
    return {
      url: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  return [...publicPages, ...productPages];
}

function toValidDate(value?: string | null) {
  if (!value) return undefined;
  const timestamp = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
