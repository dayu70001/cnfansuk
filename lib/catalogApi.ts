import type { Product } from "@/lib/types";
import { getCustomerPurchaseSizes } from "@/lib/productSizes";

const DEFAULT_CATALOG_API_BASE = "https://cnfansuk-catalog-api.dayu70001.workers.dev";

export function catalogApiUrl(path: string): string {
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCatalogApiBase()}${normalisedPath}`;
}

type CatalogImage = {
  imageUrl?: string | null;
  imageKey?: string | null;
  image_key?: string | null;
  image_url?: string | null;
  position?: number | null;
  alt?: string | null;
};

type CatalogOption = {
  option_name?: string | null;
  option_value?: string | null;
  position?: number | null;
};

type CatalogProduct = {
  id?: number | string;
  product_code?: string | null;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  productDetails?: string[] | string | null;
  product_details?: string[] | string | null;
  sizeFit?: string[] | string | null;
  size_fit?: string[] | string | null;
  material?: string | null;
  priceGbp?: number | string | null;
  priceEur?: number | string | null;
  priceUsd?: number | string | null;
  price_gbp?: number | string | null;
  price_eur?: number | string | null;
  price_usd?: number | string | null;
  status?: string | null;
  sort_order?: number | null;
  images?: CatalogImage[] | null;
  options?: CatalogOption[] | null;
};

type CatalogResponse = {
  items?: CatalogProduct[];
  products?: CatalogProduct[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    total?: number;
    totalPages?: number;
  };
};

type ProductResponse = {
  product?: CatalogProduct;
};

type SitemapProductsResponse = {
  products?: Array<{
    slug?: string | null;
    product_code?: string | null;
    lastModified?: string | null;
  }>;
  hasMore?: boolean;
  page?: number;
  limit?: number;
};

export type CatalogFilters = {
  categories: string[];
  subcategories: string[];
  brands: string[];
  counts: {
    categories: Array<{ category: string; count: number }>;
    subcategories: Array<{ category: string; subcategory: string; count: number }>;
    brands: Array<{ brand: string; count: number }>;
  };
};

export type CatalogSizeStats = {
  totalListings: number;
  listingsWithSizeOptions: number;
  sizeLabels: Array<{ size: string; count: number }>;
  categories: Array<{
    category: string;
    sizes: Array<{ size: string; count: number }>;
  }>;
};

type CatalogQuery = {
  collection?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  price?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  offset?: number;
};

export async function fetchCatalogProducts(query: CatalogQuery = {}): Promise<Product[] | null> {
  // Homepage product data must reflect status changes promptly. The Worker
  // still serves its versioned edge cache, so this bypasses only Next's own
  // long-lived Data Cache copy.
  const response = await requestCatalog<CatalogResponse>("/catalog", query, 3600, true);
  if (!response?.products) return response ? [] : null;
  return response.products.map(mapCatalogProduct);
}

export async function fetchCatalogPage(
  query: CatalogQuery = {},
  options: { bypassNextCache?: boolean } = {},
): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number } | null> {
  const response = await requestCatalog<CatalogResponse>("/catalog", query, 3600, options.bypassNextCache);
  const catalogItems = response?.products || response?.items;
  if (!catalogItems) return response ? { products: [], total: 0, page: query.page || 1, limit: query.limit || 20, totalPages: 0 } : null;
  const total = Number(response.total ?? response.pagination?.total ?? catalogItems.length);
  const limit = Number(response.limit ?? response.pagination?.limit ?? query.limit ?? 20);
  const totalPages = Number(response.totalPages ?? response.pagination?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 0));
  return {
    products: catalogItems.map(mapCatalogProduct),
    total,
    page: Number(response.page ?? response.pagination?.page ?? query.page ?? 1),
    limit,
    totalPages,
  };
}

export async function fetchCatalogProductBySlug(slug: string): Promise<Product | null> {
  const response = await requestCatalog<ProductResponse>(`/product/${encodeURIComponent(slug)}`, {}, 21600, true);
  return response?.product ? mapCatalogProduct(response.product) : null;
}

export async function fetchSitemapProducts(): Promise<Array<{ slug: string; lastModified?: string | null }> | null> {
  const pageSize = 1000;
  const products: Array<{ slug: string; lastModified?: string | null }> = [];

  // The Worker caps sitemap responses at 1,000 rows. Fetch every page so the
  // storefront sitemap covers the full active catalogue instead of silently
  // omitting products after the first page.
  for (let page = 1; page <= 50; page += 1) {
    const response = await requestCatalog<SitemapProductsResponse>(
      "/sitemap-products",
      { limit: pageSize, page },
      3600,
      true,
    );
    if (!response?.products) return products.length ? products : response ? [] : null;

    products.push(
      ...response.products
        .map((product) => ({
          slug: cleanText(product.slug),
          lastModified: cleanText(product.lastModified) || null,
        }))
        .filter((product) => product.slug),
    );

    if (!response.hasMore && response.products.length < pageSize) break;
  }

  return products;
}

export async function fetchCatalogFilters(): Promise<CatalogFilters | null> {
  // The Worker owns the catalog cache and versions it from the indexed D1
  // catalog version. Avoid a second, long-lived Next Data Cache copy here so
  // category edits become visible as soon as the Worker cache version rolls.
  return requestCatalog<CatalogFilters>("/filters", {}, 21600, true);
}

export async function fetchCatalogSizeStats(): Promise<CatalogSizeStats | null> {
  // Size distribution is aggregated once at the Worker and served from its
  // versioned cache. This keeps guide requests from scanning product options.
  return requestCatalog<CatalogSizeStats>("/catalog-size-stats", {}, 21600, true);
}

async function requestCatalog<T>(path: string, query: CatalogQuery = {}, revalidate = 3600, bypassNextCache = false): Promise<T | null> {
  const catalogApiBase = getCatalogApiBase();
  if (!catalogApiBase) return null;

  const url = new URL(catalogApiUrl(path));
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const init: RequestInit & { next?: { revalidate: number } } = {
      headers: { Accept: "application/json" },
    };
    if (bypassNextCache) {
      // This bypasses only Next's duplicate response cache. The Worker still
      // serves its versioned edge cache, so requests do not scan the catalog.
      init.cache = "no-store";
    } else {
      // Public read-only catalog data. Cached in the Next.js Data Cache and
      // revalidated on a timer so repeated visits do not hit D1 every request.
      init.next = { revalidate };
    }
    const response = await fetch(url, init);

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function getCatalogApiBase(): string {
  return (process.env.NEXT_PUBLIC_CATALOG_API_BASE?.trim() || DEFAULT_CATALOG_API_BASE).replace(/\/+$/, "");
}

function mapCatalogProduct(product: CatalogProduct): Product {
  const productCode = cleanText(product.product_code) || String(product.id || "catalog-product");
  const title = cleanText(product.title) || productCode;
  const category = toSlug(product.category) || "uncategorised";
  const style = toSlug(product.subcategory) || category;
  const images = (product.images || [])
    .map((image) => cleanText(image.imageUrl) || cleanText(image.image_url) || imageFromKey(image.imageKey || image.image_key))
    .filter((image): image is string => Boolean(image));
  const priceGBP = toPrice(product.priceGbp ?? product.price_gbp);
  const priceEUR = toPrice(product.priceEur ?? product.price_eur) || priceGBP * 9 / 8;
  const priceUSD = toPrice(product.priceUsd ?? product.price_usd) || priceGBP * 9 / 7;
  const productDetails = toFactList(product.productDetails ?? product.product_details);
  const sizeFit = toFactList(product.sizeFit ?? product.size_fit);

  return {
    id: productCode,
    slug: cleanText(product.slug) || toSlug(title) || productCode.toLowerCase(),
    name: title,
    category,
    style,
    // Keep missing source brands empty so Product JSON-LD can omit `brand`
    // instead of mislabelling the storefront as the item's manufacturer.
    brand: cleanText(product.brand),
    priceGBP,
    priceEUR,
    priceUSD,
    images,
    colors: [],
    sizes: getCustomerPurchaseSizes(category, getSupplierSizes(product.options)),
    shortDescription: cleanText(product.subtitle) || cleanText(product.description) || title,
    description: cleanText(product.description) || cleanText(product.subtitle) || title,
    ...(productDetails.length ? { productDetails } : {}),
    ...(sizeFit.length ? { sizeFit } : {}),
    ...(cleanText(product.material) ? { material: cleanText(product.material) } : {}),
    featured: Number(product.sort_order || 0) <= 10,
    newIn: true,
  };
}

function toFactList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n|[•·;]/) : [];
  return Array.from(new Set(raw.map((item) => cleanText(item).replace(/^[•·*\-–—]\s*/, "")).filter(Boolean)));
}

function getSupplierSizes(options: CatalogOption[] | null | undefined) {
  const sizes = (options || [])
    .filter((option) => cleanText(option.option_name).toLowerCase() === "size")
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((option) => cleanText(option.option_value))
    .filter(Boolean);
  return Array.from(new Set(sizes.length ? sizes : ["M", "L", "XL", "XXL"]));
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPrice(value: unknown): number {
  const price = typeof value === "number" ? value : Number(value);
  return Number.isFinite(price) ? price : 0;
}

function toSlug(value: unknown): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function imageFromKey(value: unknown): string {
  const key = cleanText(value);
  if (!key) return "";
  if (/^https?:\/\//i.test(key)) return key;
  return `https://img.cnfans.co.uk/${key.replace(/^\/+/, "")}`;
}
