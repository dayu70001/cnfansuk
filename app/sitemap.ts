import type { MetadataRoute } from "next";
import { products as localProducts } from "@/data/products";
import { fetchSitemapProducts } from "@/lib/catalogApi";
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
  "/guides",
  "/cnfans-spreadsheet",
  "/cnfans-finds",
  "/cnfans-delivery-uk",
  "/cnfans-qc-photos",
  "/cnfans-size-guide",
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogProducts = await fetchSitemapProducts();
  const productsBySlug = new Map<string, { slug: string; lastModified?: string | null }>();

  for (const product of catalogProducts || []) {
    if (product.slug) productsBySlug.set(product.slug, product);
  }
  for (const product of localProducts) {
    if (!productsBySlug.has(product.slug)) productsBySlug.set(product.slug, { slug: product.slug });
  }

  const publicPages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => ({
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
