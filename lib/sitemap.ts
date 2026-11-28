import { createHash } from "node:crypto";
import { catalogSeoSubcategories, catalogSeoSubcategoryPath } from "@/lib/catalogTaxonomy";
import { PHASE_FOUR_GUIDES } from "@/lib/phaseFourGuides";
import { PHASE_FIVE_PUBLIC_GUIDES } from "@/lib/phaseFiveGuides";
import { PHASE_SIX_GUIDES } from "@/lib/phaseSixGuides";
import { PHASE_EIGHT_GUIDES } from "@/lib/phaseEightGuides";
import { SITE_URL } from "@/lib/site";
import type { SitemapCatalogSnapshot } from "@/lib/sitemapSnapshot";

export const SITEMAP_STATIC_PATHS = [
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
  "/cnfans-status",
  "/cnfans-alternative",
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
] as const;

const SUBCATEGORY_THRESHOLD = 5;

export const SITEMAP_STATIC_MANIFEST_HASH = createHash("sha256")
  .update(JSON.stringify({
    siteUrl: SITE_URL,
    paths: SITEMAP_STATIC_PATHS,
    subcategories: catalogSeoSubcategories.map(({ category, value, h1, title }) => ({ category, value, h1, title })),
    subcategoryThreshold: SUBCATEGORY_THRESHOLD,
  }))
  .digest("hex");

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency: "daily" | "monthly" | "weekly";
  priority: number;
};

export const SITEMAP_PROTOCOL_MAX_URLS = 50_000;
export const SITEMAP_PROTOCOL_MAX_XML_BYTES = 50 * 1024 * 1024;

export class SitemapProtocolError extends Error {
  readonly code: string;
  readonly urlCount: number;
  readonly xmlBytes: number;

  constructor(code: string, urlCount: number, xmlBytes: number) {
    super(code);
    this.name = "SitemapProtocolError";
    this.code = code;
    this.urlCount = urlCount;
    this.xmlBytes = xmlBytes;
  }
}

const SITEMAP_ORIGIN = new URL(SITE_URL).origin;

export function buildSitemapEntries(snapshot: SitemapCatalogSnapshot): SitemapEntry[] {
  const subcategoryCounts = new Map<string, number>();
  for (const product of snapshot.products) {
    if (product.subcategory === null) continue;
    const key = `${product.category}/${product.subcategory}`;
    subcategoryCounts.set(key, (subcategoryCounts.get(key) || 0) + 1);
  }

  const subcategoryPaths = catalogSeoSubcategories
    .filter((item) => (subcategoryCounts.get(`${item.category}/${item.value}`) || 0) >= SUBCATEGORY_THRESHOLD)
    .map((item) => catalogSeoSubcategoryPath(item.category, item.value));
  const publicPaths = [...SITEMAP_STATIC_PATHS, ...subcategoryPaths];
  const entries: SitemapEntry[] = publicPaths.map((path) => ({
    url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`,
    changeFrequency: path.startsWith("/category/") || path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/category/") ? 0.8 : 0.5,
  }));

  for (const product of snapshot.products) {
    entries.push({
      url: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
      ...(product.lastModified ? { lastModified: product.lastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}

export function renderSitemapXml(entries: SitemapEntry[]) {
  const escapeXml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  const rows = entries.map((entry) => [
    "  <url>",
    `    <loc>${escapeXml(entry.url)}</loc>`,
    ...(entry.lastModified ? [`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`] : []),
    `    <changefreq>${entry.changeFrequency}</changefreq>`,
    `    <priority>${entry.priority.toFixed(1)}</priority>`,
    "  </url>",
  ].join("\n"));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>`;
}

export function assertSitemapProtocolLimits(urlCount: number, xmlBytes: number) {
  if (!Number.isSafeInteger(urlCount) || urlCount < 0 || !Number.isSafeInteger(xmlBytes) || xmlBytes < 0) {
    throw new SitemapProtocolError("invalid_sitemap_metrics", urlCount, xmlBytes);
  }
  if (urlCount > SITEMAP_PROTOCOL_MAX_URLS) {
    throw new SitemapProtocolError("sitemap_url_limit_exceeded", urlCount, xmlBytes);
  }
  if (xmlBytes > SITEMAP_PROTOCOL_MAX_XML_BYTES) {
    throw new SitemapProtocolError("sitemap_xml_byte_limit_exceeded", urlCount, xmlBytes);
  }
}

/** Validate the complete, untruncated sitemap and report its actual UTF-8 size. */
export function validateSitemapXml(entries: SitemapEntry[]) {
  const urlCount = entries.length;
  const seenUrls = new Set<string>();
  for (const entry of entries) {
    if (!entry || typeof entry.url !== "string") {
      throw new SitemapProtocolError("invalid_sitemap_url", urlCount, 0);
    }
    let parsed: URL;
    try {
      parsed = new URL(entry.url);
    } catch {
      throw new SitemapProtocolError("invalid_sitemap_url", urlCount, 0);
    }
    if (!entry.url.startsWith(`${SITEMAP_ORIGIN}/`)
      || parsed.protocol !== "https:" || parsed.origin !== SITEMAP_ORIGIN
      || parsed.username || parsed.password || entry.url.includes("?") || entry.url.includes("#")
      || /[\u0000-\u0020\u007f]/.test(entry.url)
      || !parsed.pathname.startsWith("/")) {
      throw new SitemapProtocolError("invalid_sitemap_url", urlCount, 0);
    }
    const canonicalUrl = parsed.href;
    if (seenUrls.has(canonicalUrl)) {
      throw new SitemapProtocolError("duplicate_sitemap_url", urlCount, 0);
    }
    seenUrls.add(canonicalUrl);
    if (!["daily", "weekly", "monthly"].includes(entry.changeFrequency)
      || !Number.isFinite(entry.priority) || entry.priority < 0 || entry.priority > 1) {
      throw new SitemapProtocolError("invalid_sitemap_entry", urlCount, 0);
    }
  }

  const xml = renderSitemapXml(entries);
  const xmlBytes = new TextEncoder().encode(xml).byteLength;
  assertSitemapProtocolLimits(urlCount, xmlBytes);
  return { xml, urlCount, xmlBytes };
}
