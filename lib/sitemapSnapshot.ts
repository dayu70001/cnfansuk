export const SITEMAP_SNAPSHOT_SCHEMA_VERSION = 1;
export const MAX_SITEMAP_PRODUCTS = 100_000;

export type SitemapCatalogProduct = {
  id: number;
  slug: string;
  lastModified: string | null;
  category: string;
  subcategory: string | null;
};

export type SitemapCatalogSnapshot = {
  schemaVersion: typeof SITEMAP_SNAPSHOT_SCHEMA_VERSION;
  complete: true;
  page: 1;
  pageSize: number;
  hasMore: false;
  totalCount: number;
  generatedAt: string;
  staticManifestHash: string;
  catalogVersion: string;
  products: SitemapCatalogProduct[];
  integrityHash: string;
  delivery?: "fresh" | "cached" | "last-known-good";
};

export class SitemapSnapshotError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "SitemapSnapshotError";
    this.code = code;
  }
}

function canonicalProductRows(products: SitemapCatalogProduct[]) {
  return JSON.stringify(products.map((product) => [
    product.id,
    product.slug,
    product.lastModified,
    product.category,
    product.subcategory,
  ]));
}

function canonicalSnapshot(snapshot: Omit<SitemapCatalogSnapshot, "integrityHash" | "delivery">) {
  return JSON.stringify({
    schemaVersion: snapshot.schemaVersion,
    complete: snapshot.complete,
    page: snapshot.page,
    pageSize: snapshot.pageSize,
    hasMore: snapshot.hasMore,
    totalCount: snapshot.totalCount,
    generatedAt: snapshot.generatedAt,
    staticManifestHash: snapshot.staticManifestHash,
    catalogVersion: snapshot.catalogVersion,
    products: snapshot.products,
  });
}

async function sha256Hex(input: string) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSitemapCatalogSnapshot(
  products: SitemapCatalogProduct[],
  generatedAt: string,
  staticManifestHash: string,
): Promise<SitemapCatalogSnapshot> {
  const base = {
    schemaVersion: SITEMAP_SNAPSHOT_SCHEMA_VERSION as typeof SITEMAP_SNAPSHOT_SCHEMA_VERSION,
    complete: true as const,
    page: 1 as const,
    pageSize: products.length,
    hasMore: false as const,
    totalCount: products.length,
    generatedAt,
    staticManifestHash,
    catalogVersion: await sha256Hex(canonicalProductRows(products)),
    products,
  };
  return { ...base, integrityHash: await sha256Hex(canonicalSnapshot(base)) };
}

export async function validateSitemapCatalogSnapshot(value: unknown): Promise<SitemapCatalogSnapshot> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SitemapSnapshotError("invalid_payload");
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== SITEMAP_SNAPSHOT_SCHEMA_VERSION
    || candidate.complete !== true
    || candidate.page !== 1
    || candidate.hasMore !== false
    || !Number.isSafeInteger(candidate.totalCount)
    || !Number.isSafeInteger(candidate.pageSize)
    || (candidate.totalCount as number) < 0
    || (candidate.totalCount as number) > MAX_SITEMAP_PRODUCTS
    || candidate.pageSize !== candidate.totalCount
    || !Array.isArray(candidate.products)
    || candidate.products.length !== candidate.totalCount
    || typeof candidate.generatedAt !== "string"
    || !isCanonicalIsoDate(candidate.generatedAt)
    || typeof candidate.staticManifestHash !== "string"
    || !/^[a-f0-9]{64}$/.test(candidate.staticManifestHash)
    || typeof candidate.catalogVersion !== "string"
    || !/^[a-f0-9]{64}$/.test(candidate.catalogVersion)
    || typeof candidate.integrityHash !== "string"
    || !/^[a-f0-9]{64}$/.test(candidate.integrityHash)) {
    throw new SitemapSnapshotError("invalid_manifest");
  }

  const products: SitemapCatalogProduct[] = [];
  const seenIds = new Set<number>();
  const seenSlugs = new Set<string>();
  let previousId = 0;
  for (const rawProduct of candidate.products as unknown[]) {
    if (!rawProduct || typeof rawProduct !== "object" || Array.isArray(rawProduct)) {
      throw new SitemapSnapshotError("invalid_product_row");
    }
    const product = rawProduct as Record<string, unknown>;
    const id = product.id;
    const slug = product.slug;
    if (typeof id !== "number"
      || !Number.isSafeInteger(id)
      || id <= previousId
      || typeof slug !== "string"
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      || slug.length > 180
      || typeof product.category !== "string"
      || !product.category.trim()
      || product.category.length > 100
      || !(product.subcategory === null || (typeof product.subcategory === "string" && product.subcategory.length <= 100))
      || !(product.lastModified === null || (typeof product.lastModified === "string" && isCanonicalIsoDate(product.lastModified)))
      || seenIds.has(id)
      || seenSlugs.has(slug)) {
      throw new SitemapSnapshotError("invalid_product_row");
    }
    previousId = id;
    seenIds.add(id);
    seenSlugs.add(slug);
    // Rebuild the public record from the explicit sitemap allowlist. Unknown
    // fields (including supplier, cost, order, and admin data) are discarded.
    products.push({
      id,
      slug,
      lastModified: product.lastModified as string | null,
      category: product.category as string,
      subcategory: product.subcategory as string | null,
    });
  }

  if (candidate.delivery !== undefined
    && candidate.delivery !== "fresh"
    && candidate.delivery !== "cached"
    && candidate.delivery !== "last-known-good") {
    throw new SitemapSnapshotError("invalid_delivery_state");
  }

  // Unknown top-level fields are intentionally ignored. The returned value is
  // always a fresh, normalized object and integrity is checked against exactly
  // that structure, preserving the existing v1 on-disk format.
  const snapshotWithoutDelivery = {
    schemaVersion: SITEMAP_SNAPSHOT_SCHEMA_VERSION as typeof SITEMAP_SNAPSHOT_SCHEMA_VERSION,
    complete: true as const,
    page: 1 as const,
    pageSize: candidate.pageSize as number,
    hasMore: false as const,
    totalCount: candidate.totalCount as number,
    generatedAt: candidate.generatedAt as string,
    staticManifestHash: candidate.staticManifestHash as string,
    catalogVersion: candidate.catalogVersion as string,
    products,
  };
  const snapshot: SitemapCatalogSnapshot = {
    ...snapshotWithoutDelivery,
    integrityHash: candidate.integrityHash as string,
    ...(candidate.delivery ? { delivery: candidate.delivery as SitemapCatalogSnapshot["delivery"] } : {}),
  };
  if (await sha256Hex(canonicalProductRows(snapshot.products)) !== snapshot.catalogVersion
    || await sha256Hex(canonicalSnapshot(snapshot)) !== snapshot.integrityHash) {
    throw new SitemapSnapshotError("integrity_check_failed");
  }
  return snapshot;
}

export function isCanonicalIsoDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}
