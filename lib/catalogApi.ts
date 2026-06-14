import type { Product } from "@/lib/types";

export function catalogApiUrl(path: string): string {
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCatalogApiBase().replace(/\/+$/, "")}${normalisedPath}`;
}

type CatalogImage = {
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
  price_gbp?: number | string | null;
  status?: string | null;
  sort_order?: number | null;
  images?: CatalogImage[] | null;
  options?: CatalogOption[] | null;
};

type CatalogResponse = {
  products?: CatalogProduct[];
};

type ProductResponse = {
  product?: CatalogProduct;
};

export type CatalogFilters = {
  categories: string[];
  subcategories: string[];
  counts: {
    categories: Array<{ category: string; count: number }>;
    subcategories: Array<{ subcategory: string; count: number }>;
  };
};

type CatalogQuery = {
  category?: string;
  subcategory?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export async function fetchCatalogProducts(query: CatalogQuery = {}): Promise<Product[] | null> {
  const response = await requestCatalog<CatalogResponse>("/catalog", query);
  if (!response?.products) return response ? [] : null;
  return response.products.map(mapCatalogProduct);
}

export async function fetchCatalogProductBySlug(slug: string): Promise<Product | null> {
  const response = await requestCatalog<ProductResponse>(`/product/${encodeURIComponent(slug)}`);
  return response?.product ? mapCatalogProduct(response.product) : null;
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
  return process.env.NEXT_PUBLIC_CATALOG_API_BASE || "";
}

function mapCatalogProduct(product: CatalogProduct): Product {
  const productCode = cleanText(product.product_code) || String(product.id || "catalog-product");
  const title = cleanText(product.title) || productCode;
  const category = toSlug(product.category) || "uncategorised";
  const style = toSlug(product.subcategory) || category;
  const images = (product.images || [])
    .map((image) => cleanText(image.image_url) || cleanText(image.image_key))
    .filter((image): image is string => Boolean(image));

  return {
    id: productCode,
    slug: cleanText(product.slug) || toSlug(title) || productCode.toLowerCase(),
    name: title,
    category,
    style,
    brand: "CNFans UK",
    priceGBP: toPrice(product.price_gbp),
    images: images.length ? images : ["placeholder"],
    colors: ["Default"],
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
    .filter((value): value is string => Boolean(value));

  return sizes.length ? Array.from(new Set(sizes)) : ["S", "M", "L", "XL"];
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
