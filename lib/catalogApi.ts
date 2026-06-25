import type { Product } from "@/lib/types";

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
};

export type CatalogFilters = {
  categories: string[];
  subcategories: string[];
  brands: string[];
  counts: {
    categories: Array<{ category: string; count: number }>;
    subcategories: Array<{ subcategory: string; count: number }>;
    brands: Array<{ brand: string; count: number }>;
  };
};

type CatalogQuery = {
  category?: string;
  subcategory?: string;
  brand?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  offset?: number;
};

export async function fetchCatalogProducts(query: CatalogQuery = {}): Promise<Product[] | null> {
  const response = await requestCatalog<CatalogResponse>("/catalog", query);
  if (!response?.products) return response ? [] : null;
  return response.products.map(mapCatalogProduct);
}

export async function fetchCatalogPage(query: CatalogQuery = {}): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number } | null> {
  const response = await requestCatalog<CatalogResponse>("/catalog", query);
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
  const response = await requestCatalog<ProductResponse>(`/product/${encodeURIComponent(slug)}`);
  return response?.product ? mapCatalogProduct(response.product) : null;
}

export async function fetchSitemapProducts(): Promise<Array<{ slug: string; lastModified?: string | null }> | null> {
  const response = await requestCatalog<SitemapProductsResponse>("/sitemap-products", { limit: 1000 });
  if (!response?.products) return response ? [] : null;
  return response.products
    .map((product) => ({
      slug: cleanText(product.slug),
      lastModified: cleanText(product.lastModified) || null,
    }))
    .filter((product) => product.slug);
}

export async function fetchCatalogFilters(): Promise<CatalogFilters | null> {
  return requestCatalog<CatalogFilters>("/filters");
}

async function requestCatalog<T>(path: string, query: CatalogQuery = {}): Promise<T | null> {
  const catalogApiBase = getCatalogApiBase();
  if (!catalogApiBase) return null;

  const url = new URL(catalogApiUrl(path));
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

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

  return {
    id: productCode,
    slug: cleanText(product.slug) || toSlug(title) || productCode.toLowerCase(),
    name: title,
    category,
    style,
    brand: cleanText(product.brand) || "CNFans UK",
    priceGBP,
    priceEUR,
    priceUSD,
    images,
    colors: [],
    sizes: getSizes(product.options),
    shortDescription: cleanText(product.subtitle) || cleanText(product.description) || title,
    description: cleanText(product.description) || cleanText(product.subtitle) || title,
    featured: Number(product.sort_order || 0) <= 10,
    newIn: true,
  };
}

function getSizes(options: CatalogOption[] | null | undefined) {
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
