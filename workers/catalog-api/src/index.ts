import { catalogCategories, catalogSubcategories, canUpdateCatalogClassification, isValidCatalogClassification } from "../../../lib/catalogTaxonomy";
import { getOrderPaymentStage, type OrderPaymentStage, type RawOrderStatus } from "../../../lib/orderStatus";
import {
  DEEPSEEK_API_URL,
  KIMI_API_URL,
  buildDeepSeekRequest,
  buildKimiRequest,
  classifyByTitleRules,
  classificationStatus,
  deepSeekNeedsVision,
  isUnsupportedTitle,
  UNSUPPORTED_TAXONOMY_REASON,
  parseDeepSeekClassification,
  parseKimiClassification,
  safeKimiError,
  type ClassificationSource,
  type ClassificationStatus,
} from "./classification";

type WorkerEnv = Env & {
  ADMIN_TOKEN: string;
  KIMI_API_KEY?: string;
  KIMI_MODEL?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_API_BASE?: string;
};
type D1Value = string | number | boolean | null;
type D1QueryResult<T = unknown> = {
  results?: T[];
  meta?: {
    duration?: number;
    rows_read?: number;
    rows_written?: number;
    changes?: number;
  };
};
type D1QueryLogContext = {
  endpoint: string;
  label: string;
  limit?: number;
  offset?: number;
};
type CloudflareCacheStorage = CacheStorage & { default: Cache };

type CatalogStatRow = {
  category: string;
  subcategory: string | null;
  brand: string | null;
  count: number;
};

type CatalogStatFilters = {
  category: string;
  subcategory: string;
  brand: string;
};

type CatalogSizeLabelRow = {
  option_value: string;
  listings: number;
};

type CatalogCategorySizeRow = {
  category: string;
  option_value: string;
  listings: number;
};

type ProductRow = {
  id: number;
  product_code: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  subcategory: string | null;
  brand: string | null;
  price_gbp: number;
  price_eur: number | null;
  price_usd: number | null;
  compare_at_price_gbp: number | null;
  currency: string;
  status: string;
  sort_order: number;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProductImageRow = {
  id: number;
  product_code: string;
  image_key: string;
  image_url: string | null;
  position: number;
  alt: string | null;
  created_at: string;
};

type ProductOptionRow = {
  id: number;
  product_code: string;
  option_name: string;
  option_value: string;
  position: number;
};

type ClassificationSuggestionRow = {
  id: number;
  product_id: number;
  product_code: string;
  old_category: string | null;
  old_subcategory: string | null;
  suggested_category: string | null;
  suggested_subcategory: string | null;
  confidence: number | null;
  reason: string | null;
  status: ClassificationStatus;
  image_available: number;
  model: string | null;
  classification_source: ClassificationSource;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ClassificationProductRow = ProductRow & Pick<ClassificationSuggestionRow,
  "old_category" | "old_subcategory" | "suggested_category" | "suggested_subcategory" | "confidence" | "reason" | "image_available" | "model" | "error_message" | "updated_at"> & {
  image_url: string | null;
  suggestion_status: ClassificationStatus | null;
  classification_source: ClassificationSource;
};

type OrderRow = {
  id: string;
  order_number: string;
  checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  email: string;
  phone: string;
  preferred_contact: string | null;
  whatsapp: string | null;
  telegram: string | null;
  country_code: string;
  country_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  shipping_method_id: string;
  shipping_method_label: string;
  shipping_estimate: string;
  shipping_fee: number;
  subtotal: number;
  total: number;
  currency: "GBP" | "EUR" | "USD";
  payment_method: string;
  payment_fee: number;
  payment_fee_rate: number;
  final_total: number;
  status: RawOrderStatus;
  payment_page_viewed_at: string | null;
  transfer_submitted_at: string | null;
  whatsapp_clicked_at: string | null;
  payment_confirmed_at: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: string;
  product_code: string;
  title: string;
  slug: string;
  product_url: string;
  image_url: string | null;
  size: string;
  color: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  currency: "GBP" | "EUR" | "USD";
};

type OrderStatus = RawOrderStatus;
type CurrencyCode = "GBP" | "EUR" | "USD";

const SERVICE_NAME = "cnfansuk-catalog-api";
const IMAGE_BASE_URL = "https://img.cnfans.co.uk";
const STOREFRONT_BASE_URL = "https://cnfansuk.vercel.app";
const ALLOWED_ORIGINS = new Set([
  "https://cnfansuk.vercel.app",
  "https://cnfans.co.uk",
  "https://www.cnfans.co.uk",
  "http://localhost:4000",
]);
const ORDER_STATUSES = new Set<OrderStatus>(["pending", "awaiting_payment", "payment_submitted", "payment_confirmed", "confirmed", "paid", "processing", "shipped", "completed", "cancelled"]);
const FREE_SHIPPING_THRESHOLD_GBP = 150;
const SHIPPING_METHODS = {
  "royal-mail-tracked": { label: "Royal Mail Tracked", estimate: "7–12 business days", priceGbp: 5 },
  "dhl-express": { label: "DHL Express", estimate: "7–12 business days", priceGbp: 5 },
  "fedex-priority": { label: "FedEx Priority", estimate: "5–9 business days", priceGbp: 15 },
} as const;
const PAYMENT_METHODS = {
  "bank-transfer": { label: "GBP Bank Transfer", feeRate: 0 },
} as const;
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const NEW_IN_COLLECTION = "new-in";
const NEW_IN_LIMIT = 100;
const FILTER_CACHE_SECONDS = 1800;
const PRODUCT_CACHE_SECONDS = 1800;
const SITEMAP_CACHE_SECONDS = 3600;
const CATALOG_CACHE_SECONDS = 300;
const CATALOG_STATS_CACHE_SECONDS = 86400;
const CATALOG_SIZE_STATS_CACHE_SECONDS = 86400;
// Version the cache namespace so the first deployment of this invalidation
// fix cannot reuse entries created by the previous implementation. The
// catalog data version below then changes whenever a product write updates
// the latest indexed updated_at/id pair, regardless of active status.
// Bump the namespace after the 2026-09-15 hard-delete so old edge keys cannot
// re-serve catalog, filter, product, or sitemap responses containing removed
// rows. Future data writes should continue to use the normal version check.
const CATALOG_CACHE_NAMESPACE = "v3-hard-delete-20260915";

function calculateShippingFee(methodId: keyof typeof SHIPPING_METHODS, subtotalGbp: number) {
  return subtotalGbp >= FREE_SHIPPING_THRESHOLD_GBP && methodId !== "fedex-priority"
    ? 0
    : SHIPPING_METHODS[methodId].priceGbp;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(request: Request, body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(body, { status, headers: { ...corsHeaders(request), ...headers } });
}

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normaliseLimit(value: string | null, fallback = DEFAULT_LIST_LIMIT, maximum = MAX_LIST_LIMIT): number {
  const limit = Number.parseInt(value ?? String(fallback), 10);
  if (Number.isNaN(limit)) return fallback;
  return Math.min(Math.max(limit, 1), maximum);
}

function normaliseOffset(value: string | null): number {
  const offset = Number.parseInt(value ?? "0", 10);
  return Number.isNaN(offset) ? 0 : Math.max(offset, 0);
}

function normalisePage(value: string | null): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isNaN(page) ? 1 : Math.max(page, 1);
}

function splitFilterValues(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function priceFilter(value: string): { sql: string; values: D1Value[] } | null {
  const clauses: Array<{ sql: string; values: D1Value[] }> = [];
  for (const item of splitFilterValues(value)) {
    if (item === "under-50") clauses.push({ sql: "price_gbp < ?", values: [50] });
    if (item === "50-100") clauses.push({ sql: "price_gbp >= ? AND price_gbp < ?", values: [50, 100] });
    if (item === "100-150") clauses.push({ sql: "price_gbp >= ? AND price_gbp < ?", values: [100, 150] });
    if (item === "150-plus") clauses.push({ sql: "price_gbp >= ?", values: [150] });
  }
  if (!clauses.length) return null;
  return {
    sql: clauses.length === 1 ? clauses[0].sql : `(${clauses.map((clause) => clause.sql).join(" OR ")})`,
    values: clauses.flatMap((clause) => clause.values),
  };
}

function orderByClause(sort: string): string {
  if (sort === "price-low-high") return "price_gbp ASC, created_at DESC, id DESC";
  if (sort === "price-high-low") return "price_gbp DESC, created_at DESC, id DESC";
  if (sort === "popular") return "sort_order ASC, created_at DESC, id DESC";
  return "created_at DESC, id DESC";
}

function newInOrderByClause(sort: string): string {
  if (sort === "price-low-high") return "price_gbp ASC, created_at DESC";
  if (sort === "price-high-low") return "price_gbp DESC, created_at DESC";
  if (sort === "popular") return "sort_order ASC, created_at DESC";
  return "created_at DESC";
}

function logD1Query(context: D1QueryLogContext, result: D1QueryResult | null, durationMs: number) {
  const meta = result?.meta || {};
  console.log(JSON.stringify({
    event: "d1_query",
    endpoint: context.endpoint,
    label: context.label,
    limit: context.limit ?? null,
    offset: context.offset ?? null,
    duration_ms: Math.round(durationMs),
    rows_read: Number(meta.rows_read || 0),
    rows_written: Number(meta.rows_written || 0),
  }));
}

async function d1All<T>(
  env: WorkerEnv,
  context: D1QueryLogContext,
  sql: string,
  values: D1Value[] = [],
): Promise<D1QueryResult<T>> {
  const started = Date.now();
  const result = await env.DB.prepare(sql).bind(...values).all<T>();
  logD1Query(context, result, Date.now() - started);
  return result;
}

async function d1First<T>(
  env: WorkerEnv,
  context: D1QueryLogContext,
  sql: string,
  values: D1Value[] = [],
): Promise<T | null> {
  const result = await d1All<T>(env, context, sql, values);
  return result.results?.[0] || null;
}

async function d1Run(
  env: WorkerEnv,
  context: D1QueryLogContext,
  sql: string,
  values: D1Value[] = [],
) {
  const started = Date.now();
  const result = await env.DB.prepare(sql).bind(...values).run();
  logD1Query(context, result as D1QueryResult, Date.now() - started);
  return result;
}

function addResponseHeaders(response: Response, headers: Record<string, string>) {
  const nextHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) nextHeaders.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: nextHeaders,
  });
}

function normaliseProductLookup(value: string, field: "slug" | "product_code") {
  const text = cleanText(decodeURIComponent(value), 180);
  return field === "product_code" ? text.toUpperCase() : text.toLowerCase();
}

function publicImageUrl(image: ProductImageRow): string {
  return image.image_url || `${IMAGE_BASE_URL}/${image.image_key.replace(/^\/+/, "")}`;
}

function mapImage(image: ProductImageRow) {
  const url = publicImageUrl(image);
  return { ...image, image_url: url, imageUrl: url, imageKey: image.image_key };
}

function mapProduct(product: ProductRow) {
  const priceGbp = Number(product.price_gbp || 0);
  return {
    ...product,
    productCode: product.product_code,
    productTitle: product.title,
    shortDescription: product.subtitle,
    brand: product.brand || "",
    priceGbp,
    priceEur: product.price_eur ?? priceGbp * 9 / 8,
    priceUsd: product.price_usd ?? priceGbp * 9 / 7,
  };
}

function normalizeCatalogStats(rows: CatalogStatRow[]): CatalogStatRow[] {
  return rows.map((row) => ({
    category: String(row.category || ""),
    subcategory: row.subcategory ? String(row.subcategory) : null,
    brand: row.brand ? String(row.brand) : null,
    count: Math.max(0, Number(row.count) || 0),
  }));
}

function catalogTotalFromStats(rows: CatalogStatRow[], filters: CatalogStatFilters): number {
  const categories = splitFilterValues(filters.category);
  const subcategories = splitFilterValues(filters.subcategory);
  const brands = splitFilterValues(filters.brand).map((value) => value.toLocaleLowerCase("en"));
  return rows.reduce((total, row) => {
    if (categories.length && !categories.includes(row.category)) return total;
    if (subcategories.length && !subcategories.includes(row.subcategory || "")) return total;
    if (brands.length && !brands.includes((row.brand || "").toLocaleLowerCase("en"))) return total;
    return total + row.count;
  }, 0);
}

function catalogFiltersFromStats(rows: CatalogStatRow[]) {
  const categories = new Map<string, number>();
  const subcategories = new Map<string, { category: string; subcategory: string; count: number }>();
  const brands = new Map<string, { brand: string; count: number }>();

  for (const row of rows) {
    if (row.category) categories.set(row.category, (categories.get(row.category) || 0) + row.count);
    if (row.subcategory && row.count > 0 && isValidCatalogClassification(row.category, row.subcategory)) {
      const key = `${row.category}\u0000${row.subcategory}`;
      const current = subcategories.get(key);
      subcategories.set(key, {
        category: row.category,
        subcategory: row.subcategory,
        count: (current?.count || 0) + row.count,
      });
    }
    if (row.brand?.trim()) {
      const key = row.brand.toLocaleLowerCase("en");
      const current = brands.get(key);
      brands.set(key, { brand: current?.brand || row.brand, count: (current?.count || 0) + row.count });
    }
  }

  const categoryCounts = Array.from(categories, ([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
  const subcategoryCounts = Array.from(subcategories.values())
    .sort((a, b) => a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory));
  // Brand filter options are intentionally limited to brands with at least
  // six currently active products. The underlying stats are already scoped to
  // active rows in getCatalogStats(), so this remains dynamic as products are
  // published or unpublished without maintaining a brand allowlist.
  const brandCounts = Array.from(brands.values())
    .filter((row) => row.count >= 6)
    .sort((a, b) => a.brand.localeCompare(b.brand, "en", { sensitivity: "base" }));
  return {
    categories: categoryCounts.map((row) => row.category),
    subcategories: subcategoryCounts.map((row) => row.subcategory),
    brands: brandCounts.map((row) => row.brand),
    counts: { categories: categoryCounts, subcategories: subcategoryCounts, brands: brandCounts },
  };
}

async function catalogDataVersion(env: WorkerEnv, endpoint: string): Promise<string> {
  // Keep this invalidation check cheap: both status branches use the
  // (status, updated_at, id) index and return one row. Looking only at active
  // rows would miss an unpublish, while an unqualified ORDER BY could scan the
  // whole catalogue on every cache miss.
  const [activeRow, inactiveRow] = await Promise.all([
    d1First<{ id: number; updated_at: string }>(
      env,
      { endpoint, label: "catalog_cache_version_active", limit: 1, offset: 0 },
      `SELECT id, updated_at
       FROM products
       WHERE status = ?
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      ["active"],
    ),
    d1First<{ id: number; updated_at: string }>(
      env,
      { endpoint, label: "catalog_cache_version_inactive", limit: 1, offset: 0 },
      `SELECT id, updated_at
       FROM products
       WHERE status = ?
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      ["inactive"],
    ),
  ]);
  const versionRow = [activeRow, inactiveRow]
    .filter((row): row is { id: number; updated_at: string } => Boolean(row))
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || b.id - a.id)[0];
  return `${CATALOG_CACHE_NAMESPACE}:${versionRow ? `${versionRow.updated_at}:${versionRow.id}` : "empty"}`;
}

async function getCatalogStats(env: WorkerEnv, ctx: ExecutionContext): Promise<CatalogStatRow[]> {
  const cache = (caches as CloudflareCacheStorage).default;
  const version = await catalogDataVersion(env, "/catalog-stats");
  const key = new Request(`https://catalog-stats-${CATALOG_CACHE_NAMESPACE}.internal/?version=${encodeURIComponent(version)}`);
  const cached = await cache.match(key);
  if (cached) return normalizeCatalogStats(await cached.json<CatalogStatRow[]>());

  const { results = [] } = await d1All<CatalogStatRow>(
    env,
    { endpoint: "/catalog-stats", label: "catalog_stats" },
    `SELECT category, subcategory, brand, COUNT(*) AS count
     FROM products
     WHERE status = ?
     GROUP BY category, subcategory, brand`,
    ["active"],
  );
  const stats = normalizeCatalogStats(results);
  const response = Response.json(stats, {
    headers: { "Cache-Control": `max-age=${CATALOG_STATS_CACHE_SECONDS}` },
  });
  ctx.waitUntil(cache.put(key, response));
  return stats;
}

async function getCatalogSizeStats(env: WorkerEnv, ctx: ExecutionContext) {
  const cache = (caches as CloudflareCacheStorage).default;
  const version = await catalogDataVersion(env, "/catalog-size-stats");
  const key = new Request(`https://catalog-size-stats-${CATALOG_CACHE_NAMESPACE}.internal/?version=${encodeURIComponent(version)}`);
  const cached = await cache.match(key);
  if (cached) return cached.json();

  const [totalRow, optionsRow, labels, byCategory] = await Promise.all([
    d1First<{ total: number }>(
      env,
      { endpoint: "/catalog-size-stats", label: "catalog_size_total", limit: 1, offset: 0 },
      "SELECT COUNT(*) AS total FROM products WHERE status = ?",
      ["active"],
    ),
    d1First<{ listings: number }>(
      env,
      { endpoint: "/catalog-size-stats", label: "catalog_size_listings", limit: 1, offset: 0 },
      `SELECT COUNT(DISTINCT p.product_code) AS listings
       FROM products p
       INNER JOIN product_options o ON o.product_code = p.product_code
       WHERE p.status = ? AND lower(o.option_name) = 'size'`,
      ["active"],
    ),
    d1All<CatalogSizeLabelRow>(
      env,
      { endpoint: "/catalog-size-stats", label: "catalog_size_labels" },
      `SELECT o.option_value, COUNT(DISTINCT o.product_code) AS listings
       FROM products p
       INNER JOIN product_options o ON o.product_code = p.product_code
       WHERE p.status = ? AND lower(o.option_name) = 'size'
       GROUP BY o.option_value
       ORDER BY listings DESC, o.option_value ASC`,
      ["active"],
    ),
    d1All<CatalogCategorySizeRow>(
      env,
      { endpoint: "/catalog-size-stats", label: "catalog_category_size_labels" },
      `SELECT p.category, o.option_value, COUNT(DISTINCT o.product_code) AS listings
       FROM products p
       INNER JOIN product_options o ON o.product_code = p.product_code
       WHERE p.status = ? AND lower(o.option_name) = 'size'
       GROUP BY p.category, o.option_value
       ORDER BY p.category ASC, listings DESC, o.option_value ASC`,
      ["active"],
    ),
  ]);

  const byCategoryMap = new Map<string, Array<{ size: string; count: number }>>();
  for (const row of byCategory.results || []) {
    const category = String(row.category || "");
    if (!category) continue;
    const current = byCategoryMap.get(category) || [];
    current.push({ size: String(row.option_value || ""), count: Math.max(0, Number(row.listings) || 0) });
    byCategoryMap.set(category, current);
  }
  const payload = {
    totalListings: Math.max(0, Number(totalRow?.total) || 0),
    listingsWithSizeOptions: Math.max(0, Number(optionsRow?.listings) || 0),
    sizeLabels: (labels.results || []).map((row) => ({
      size: String(row.option_value || ""),
      count: Math.max(0, Number(row.listings) || 0),
    })).filter((row) => row.size),
    categories: Array.from(byCategoryMap, ([category, sizes]) => ({ category, sizes })),
  };
  const response = Response.json(payload, {
    headers: { "Cache-Control": `max-age=${CATALOG_SIZE_STATS_CACHE_SECONDS}` },
  });
  ctx.waitUntil(cache.put(key, response.clone()));
  return payload;
}

async function cachedCatalogSizeStats(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const stats = await getCatalogSizeStats(env, ctx);
  return jsonResponse(request, stats, 200, {
    "Cache-Control": `public, max-age=${CATALOG_SIZE_STATS_CACHE_SECONDS}, s-maxage=${CATALOG_SIZE_STATS_CACHE_SECONDS}`,
  });
}

async function imagesForProducts(env: WorkerEnv, endpoint: string, productCodes: string[]) {
  if (productCodes.length === 0) return new Map<string, ReturnType<typeof mapImage>[]>();
  const placeholders = productCodes.map(() => "?").join(", ");
  const { results = [] } = await d1All<ProductImageRow>(
    env,
    { endpoint, label: "product_images_by_codes", limit: productCodes.length },
    `SELECT * FROM product_images WHERE product_code IN (${placeholders}) ORDER BY product_code, position, id`,
    productCodes,
  );
  const grouped = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const image of results) {
    const current = grouped.get(image.product_code) ?? [];
    current.push(mapImage(image));
    grouped.set(image.product_code, current);
  }
  return grouped;
}

async function optionsForProduct(env: WorkerEnv, endpoint: string, productCode: string) {
  const { results = [] } = await d1All<ProductOptionRow>(
    env,
    { endpoint, label: "product_options_by_code" },
    "SELECT * FROM product_options WHERE product_code = ? ORDER BY position, id",
    [productCode],
  );
  if (results.length > 0) return results;
  return ["M", "L", "XL", "XXL"].map((size, index) => ({
    id: index + 1, product_code: productCode, option_name: "Size", option_value: size, position: index + 1,
  }));
}

async function handleCatalog(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const endpoint = url.pathname.replace(/\/+$/, "") || "/catalog";
  const collection = cleanText(url.searchParams.get("collection"), 30);
  const isNewIn = collection === NEW_IN_COLLECTION;
  const filters: string[] = isNewIn ? [] : ["status = ?"];
  const values: D1Value[] = isNewIn ? [] : ["active"];
  const category = cleanText(url.searchParams.get("category"), 100);
  const subcategory = cleanText(url.searchParams.get("subcategory"), 100);
  const brand = cleanText(url.searchParams.get("brand"), 100);
  const price = cleanText(url.searchParams.get("price"), 30);
  const q = cleanText(url.searchParams.get("q"), 100);
  const categoryValues = splitFilterValues(category);
  const subcategoryValues = splitFilterValues(subcategory);
  const brandValues = splitFilterValues(brand);
  if (categoryValues.length) {
    filters.push(`category IN (${categoryValues.map(() => "?").join(", ")})`);
    values.push(...categoryValues);
  }
  if (subcategoryValues.length) {
    filters.push(`subcategory IN (${subcategoryValues.map(() => "?").join(", ")})`);
    values.push(...subcategoryValues);
  }
  if (brandValues.length) {
    filters.push(`brand COLLATE NOCASE IN (${brandValues.map(() => "?").join(", ")})`);
    values.push(...brandValues);
  }
  const priceClause = priceFilter(price);
  if (priceClause) { filters.push(priceClause.sql); values.push(...priceClause.values); }
  if (q) {
    filters.push("(title LIKE ? OR subtitle LIKE ? OR description LIKE ? OR product_code LIKE ? OR brand LIKE ?)");
    const term = `%${q}%`;
    values.push(term, term, term, term, term);
  }
  const limit = normaliseLimit(url.searchParams.get("limit"), DEFAULT_LIST_LIMIT, isNewIn ? NEW_IN_LIMIT : MAX_LIST_LIMIT);
  const page = normalisePage(url.searchParams.get("page"));
  const offset = url.searchParams.has("offset") ? normaliseOffset(url.searchParams.get("offset")) : (page - 1) * limit;
  const source = isNewIn
    ? "WITH new_in AS (SELECT * FROM products WHERE status = ? ORDER BY created_at DESC LIMIT ?) SELECT * FROM new_in"
    : "SELECT * FROM products";
  const countSource = isNewIn
    ? "WITH new_in AS (SELECT * FROM products WHERE status = ? ORDER BY created_at DESC LIMIT ?) SELECT COUNT(*) AS total FROM new_in"
    : "SELECT COUNT(*) AS total FROM products";
  const sourceValues = isNewIn ? ["active", NEW_IN_LIMIT, ...values] : values;
  const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const sort = cleanText(url.searchParams.get("sort"), 30);
  const listSql = `${source}${whereClause} ORDER BY ${isNewIn ? newInOrderByClause(sort) : orderByClause(sort)} LIMIT ? OFFSET ?`;
  const countSql = `${countSource}${whereClause}`;
  const listPromise = d1All<ProductRow>(
    env,
    { endpoint, label: "catalog_page", limit, offset },
    listSql,
    [...sourceValues, limit, offset],
  );
  const totalPromise = isNewIn || q || Boolean(priceClause)
    ? d1First<{ total: number }>(
      env,
      { endpoint, label: "catalog_count_search", limit, offset },
      countSql,
      sourceValues,
    )
    : getCatalogStats(env, ctx);
  const [{ results = [] }, totalSource] = await Promise.all([listPromise, totalPromise]);
  const images = await imagesForProducts(env, endpoint, results.map((product) => product.product_code));
  const total = isNewIn || q || Boolean(priceClause)
    ? Number((totalSource as { total: number } | null)?.total || 0)
    : catalogTotalFromStats(totalSource as CatalogStatRow[], { category, subcategory, brand });
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const items = results.map((product) => ({ ...mapProduct(product), images: images.get(product.product_code) ?? [] }));
  return jsonResponse(request, {
    items,
    products: items,
    total,
    page,
    limit,
    totalPages,
    pagination: { limit, offset, page, total, totalPages },
  });
}

async function catalogCacheKey(request: Request, env: WorkerEnv) {
  const sourceUrl = new URL(request.url);
  const url = new URL(request.url);
  url.pathname = sourceUrl.pathname.replace(/\/+$/, "") || "/catalog";
  url.search = "";
  const collection = cleanText(sourceUrl.searchParams.get("collection"), 30);
  const isNewIn = collection === NEW_IN_COLLECTION;
  url.searchParams.set("page", String(normalisePage(sourceUrl.searchParams.get("page"))));
  url.searchParams.set(
    "limit",
    String(normaliseLimit(sourceUrl.searchParams.get("limit"), DEFAULT_LIST_LIMIT, isNewIn ? NEW_IN_LIMIT : MAX_LIST_LIMIT)),
  );
  if (collection) url.searchParams.set("collection", collection);
  const category = cleanText(sourceUrl.searchParams.get("category"), 100);
  const subcategory = cleanText(sourceUrl.searchParams.get("subcategory"), 100);
  const brand = cleanText(sourceUrl.searchParams.get("brand"), 100);
  const price = cleanText(sourceUrl.searchParams.get("price"), 30);
  const q = cleanText(sourceUrl.searchParams.get("q"), 100);
  const search = cleanText(sourceUrl.searchParams.get("search"), 100);
  const sort = cleanText(sourceUrl.searchParams.get("sort"), 30);
  if (category) url.searchParams.set("category", category);
  if (subcategory) url.searchParams.set("subcategory", subcategory);
  if (brand) url.searchParams.set("brand", brand.toLowerCase());
  if (price) url.searchParams.set("price", price);
  if (q) url.searchParams.set("q", q);
  if (search) url.searchParams.set("search", search);
  if (sort) url.searchParams.set("sort", sort);
  // Keep this version only in the internal cache key. Public API URLs remain
  // unchanged, while category writes create a new key without scanning rows.
  url.searchParams.set("__catalog_version", await catalogDataVersion(env, "/catalog"));
  return new Request(url.toString(), { method: "GET" });
}

async function cachedCatalog(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = await catalogCacheKey(request, env);
  const cached = await cache.match(key);
  if (cached) return addResponseHeaders(cached, { "x-cnfans-cache": "HIT" });

  const response = await handleCatalog(request, env, ctx);
  const responseWithCache = addResponseHeaders(response, {
    "Cache-Control": `public, max-age=${CATALOG_CACHE_SECONDS}, s-maxage=${CATALOG_CACHE_SECONDS}, stale-while-revalidate=${CATALOG_CACHE_SECONDS * 2}`,
    "x-cnfans-cache": "MISS",
  });
  if (responseWithCache.status === 200) ctx.waitUntil(cache.put(key, responseWithCache.clone()));
  return responseWithCache;
}

async function productByField(request: Request, env: WorkerEnv, field: "slug" | "product_code", value: string) {
  const endpoint = field === "slug" ? "/product/:slug" : "/product-code/:product_code";
  const normalizedValue = normaliseProductLookup(value, field);
  const product = await d1First<ProductRow>(
    env,
    { endpoint, label: field === "slug" ? "product_by_slug" : "product_by_code", limit: 1, offset: 0 },
    `SELECT * FROM products WHERE status = ? AND ${field} = ? LIMIT 1`,
    ["active", normalizedValue],
  );
  if (!product) return jsonResponse(request, { error: "Product not found" }, 404);
  const images = await imagesForProducts(env, endpoint, [product.product_code]);
  const options = await optionsForProduct(env, endpoint, product.product_code);
  return jsonResponse(request, { product: { ...mapProduct(product), images: images.get(product.product_code) ?? [], options } });
}

async function productCacheKey(request: Request, env: WorkerEnv, field: "slug" | "product_code", value: string) {
  const url = new URL(request.url);
  url.pathname = field === "slug"
    ? `/product/${encodeURIComponent(normaliseProductLookup(value, field))}`
    : `/product-code/${encodeURIComponent(normaliseProductLookup(value, field))}`;
  url.search = "";
  // Product lookups are cached at the edge. Include the active catalogue
  // version so publishing/unpublishing a product cannot leave a stale PDP
  // available until the normal product cache TTL expires.
  url.searchParams.set("__catalog_version", await catalogDataVersion(env, "/product"));
  return new Request(url.toString(), { method: "GET" });
}

async function cachedProductByField(request: Request, env: WorkerEnv, ctx: ExecutionContext, field: "slug" | "product_code", value: string) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = await productCacheKey(request, env, field, value);
  const cached = await cache.match(key);
  if (cached) return addResponseHeaders(cached, { "x-cnfans-cache": "HIT" });

  const response = await productByField(request, env, field, value);
  const responseWithCache = addResponseHeaders(response, {
    "Cache-Control": `public, max-age=${PRODUCT_CACHE_SECONDS}, s-maxage=${PRODUCT_CACHE_SECONDS}, stale-while-revalidate=${PRODUCT_CACHE_SECONDS * 2}`,
    "x-cnfans-cache": "MISS",
  });
  if (responseWithCache.status === 200) ctx.waitUntil(cache.put(key, responseWithCache.clone()));
  return responseWithCache;
}

async function handleFilters(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const stats = await getCatalogStats(env, ctx);
  return jsonResponse(request, catalogFiltersFromStats(stats));
}

async function filtersCacheKey(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  url.pathname = "/filters";
  url.search = "";
  // A category/subcategory write updates the indexed catalog version, so the
  // next request automatically bypasses the prior filters response globally.
  url.searchParams.set("__catalog_version", await catalogDataVersion(env, "/filters"));
  return new Request(url.toString(), { method: "GET" });
}

async function cachedFilters(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = await filtersCacheKey(request, env);
  const cached = await cache.match(key);
  if (cached) return addResponseHeaders(cached, { "x-cnfans-cache": "HIT" });

  const response = await handleFilters(request, env, ctx);
  const responseWithCache = addResponseHeaders(response, {
    "Cache-Control": `public, max-age=${FILTER_CACHE_SECONDS}, s-maxage=${FILTER_CACHE_SECONDS}, stale-while-revalidate=${FILTER_CACHE_SECONDS * 2}`,
    "x-cnfans-cache": "MISS",
  });
  if (responseWithCache.status === 200) ctx.waitUntil(cache.put(key, responseWithCache.clone()));
  return responseWithCache;
}

async function handleSitemapProducts(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const page = normalisePage(url.searchParams.get("page"));
  const limit = normaliseLimit(url.searchParams.get("limit"), 1000, 1000);
  const offset = url.searchParams.has("offset") ? normaliseOffset(url.searchParams.get("offset")) : (page - 1) * limit;
  const { results = [] } = await d1All<Pick<ProductRow, "slug" | "product_code" | "updated_at" | "created_at">>(
    env,
    { endpoint: "/sitemap-products", label: "sitemap_products_page", limit, offset },
    `SELECT slug, product_code, updated_at, created_at
     FROM products
     WHERE status = ?
     ORDER BY updated_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    ["active", limit + 1, offset],
  );
  const products = results.slice(0, limit).map((product) => ({
    slug: product.slug,
    product_code: product.product_code,
    lastModified: product.updated_at || product.created_at,
  }));
  return jsonResponse(request, {
    products,
    page,
    limit,
    count: products.length,
    hasMore: results.length > limit,
  });
}

async function sitemapCacheKey(request: Request, env: WorkerEnv) {
  const sourceUrl = new URL(request.url);
  const url = new URL(request.url);
  url.pathname = "/sitemap-products";
  url.search = "";
  url.searchParams.set("page", String(normalisePage(sourceUrl.searchParams.get("page"))));
  url.searchParams.set("limit", String(normaliseLimit(sourceUrl.searchParams.get("limit"), 1000, 1000)));
  if (sourceUrl.searchParams.has("offset")) url.searchParams.set("offset", String(normaliseOffset(sourceUrl.searchParams.get("offset"))));
  // Sitemap responses only contain active products. Version the edge key so
  // status changes remove delisted product URLs without waiting for the TTL.
  url.searchParams.set("__catalog_version", await catalogDataVersion(env, "/sitemap-products"));
  return new Request(url.toString(), { method: "GET" });
}

async function cachedSitemapProducts(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = await sitemapCacheKey(request, env);
  const cached = await cache.match(key);
  if (cached) return addResponseHeaders(cached, { "x-cnfans-cache": "HIT" });

  const response = await handleSitemapProducts(request, env);
  const responseWithCache = addResponseHeaders(response, {
    "Cache-Control": `public, max-age=${SITEMAP_CACHE_SECONDS}, s-maxage=${SITEMAP_CACHE_SECONDS}, stale-while-revalidate=${SITEMAP_CACHE_SECONDS * 2}`,
    "x-cnfans-cache": "MISS",
  });
  if (responseWithCache.status === 200) ctx.waitUntil(cache.put(key, responseWithCache.clone()));
  return responseWithCache;
}

async function handleSiteSettings(request: Request, env: WorkerEnv) {
  const row = await d1First<{ settings_json: string }>(
    env,
    { endpoint: "/site-settings", label: "site_settings_storefront", limit: 1, offset: 0 },
    "SELECT settings_json FROM site_settings WHERE settings_key = ? LIMIT 1",
    ["storefront"],
  );
  if (!row) return jsonResponse(request, { settings: null });
  try {
    return jsonResponse(request, { settings: JSON.parse(row.settings_json) });
  } catch {
    return jsonResponse(request, { settings: null });
  }
}

async function handleAdminSiteSettings(request: Request, env: WorkerEnv) {
  const body = await readBoundedJson(request);
  if (!isRecord(body)) return jsonResponse(request, { error: "首页设置数据无效" }, 400);
  const settingsJson = JSON.stringify(body);
  if (settingsJson.length > 60_000) return jsonResponse(request, { error: "首页设置内容过大" }, 413);
  await d1Run(
    env,
    { endpoint: "/admin/site-settings", label: "site_settings_upsert" },
    `INSERT INTO site_settings (settings_key, settings_json) VALUES (?, ?)
     ON CONFLICT(settings_key) DO UPDATE SET settings_json = excluded.settings_json, updated_at = CURRENT_TIMESTAMP`,
    ["storefront", settingsJson],
  );
  return handleSiteSettings(request, env);
}

async function verifyAdmin(request: Request, env: WorkerEnv): Promise<boolean> {
  const provided = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const expected = env.ADMIN_TOKEN || "";
  if (!provided || !expected) return false;
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 64_000) throw new Error("Payload too large");
  return request.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getCurrencyPrice(product: ProductRow, currency: CurrencyCode): number {
  if (currency === "EUR") return Number(product.price_eur ?? product.price_gbp * 9 / 8);
  if (currency === "USD") return Number(product.price_usd ?? product.price_gbp * 9 / 7);
  return Number(product.price_gbp);
}

function createOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return `CNF-${date}-${String(random[0] % 10000).padStart(4, "0")}`;
}

function orderPayload(
  orderNumber: string,
  status: OrderStatus,
  subtotal: number,
  shippingFee: number,
  paymentMethod: string,
  paymentFee: number,
  paymentFeeRate: number,
  finalTotal: number,
  currency: CurrencyCode,
  events: Pick<OrderRow, "payment_page_viewed_at" | "transfer_submitted_at" | "payment_confirmed_at"> = {
    payment_page_viewed_at: null,
    transfer_submitted_at: null,
    payment_confirmed_at: null,
  },
) {
  return {
    orderNumber,
    subtotal,
    shippingFee,
    paymentMethod,
    paymentFee,
    paymentFeeRate,
    finalTotal,
    total: finalTotal,
    currency,
    status,
    paymentStage: getOrderPaymentStage({ status, ...events }),
  };
}

async function handleCreateOrder(request: Request, env: WorkerEnv): Promise<Response> {
  const body = await readBoundedJson(request);
  if (!isRecord(body) || !isRecord(body.customer) || !Array.isArray(body.items)) {
    return jsonResponse(request, { error: "订单数据格式无效" }, 400);
  }
  const checkoutSessionId = cleanText(body.checkoutSessionId, 160) || null;
  const currency: CurrencyCode = "GBP";
  const shippingMethodId = cleanText(body.shippingMethodId, 40) as keyof typeof SHIPPING_METHODS;
  const shippingMethod = SHIPPING_METHODS[shippingMethodId];
  if (!shippingMethod) return jsonResponse(request, { error: "配送方式无效" }, 400);
  const paymentMethodId: keyof typeof PAYMENT_METHODS = "bank-transfer";
  const paymentMethod = PAYMENT_METHODS[paymentMethodId];
  if (body.items.length < 1 || body.items.length > 50) return jsonResponse(request, { error: "商品数量无效" }, 400);

  const customer = body.customer;
  const customerName = cleanText(customer.fullName, 120);
  const email = cleanText(customer.email, 160).toLowerCase();
  const phone = cleanText(customer.phone, 60);
  const addressLine1 = cleanText(customer.addressLine1, 200);
  const city = cleanText(customer.city, 100);
  const postcode = cleanText(customer.postcode, 30);
  const countryCode = cleanText(customer.countryCode, 3).toUpperCase();
  const countryName = cleanText(customer.countryName, 100);
  if (!customerName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !addressLine1 || !city || !postcode || !countryCode || !countryName) {
    return jsonResponse(request, { error: "请填写完整有效的客户与地址信息" }, 400);
  }

  const requestedItems: Array<{ productCode: string; size: string; color: string; quantity: number }> = [];
  for (const rawItem of body.items) {
    if (!isRecord(rawItem)) return jsonResponse(request, { error: "商品数据无效" }, 400);
    const productCode = cleanText(rawItem.productCode, 120);
    const size = cleanText(rawItem.size, 60);
    const color = cleanText(rawItem.color, 60);
    const quantity = Number(rawItem.quantity);
    if (!productCode || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return jsonResponse(request, { error: "商品编号、尺码或数量无效" }, 400);
    }
    requestedItems.push({ productCode, size, color, quantity });
  }

  const uniqueCodes = Array.from(new Set(requestedItems.map((item) => item.productCode)));
  const placeholders = uniqueCodes.map(() => "?").join(", ");
  const { results: products = [] } = await d1All<ProductRow>(
    env,
    { endpoint: "/orders", label: "order_products_by_codes", limit: uniqueCodes.length },
    `SELECT * FROM products WHERE status = 'active' AND product_code IN (${placeholders})`,
    uniqueCodes,
  );
  if (products.length !== uniqueCodes.length) return jsonResponse(request, { error: "订单包含不存在或已下架商品" }, 400);
  const productsByCode = new Map(products.map((product) => [product.product_code, product]));
  const images = await imagesForProducts(env, "/orders", uniqueCodes);

  let subtotal = 0;
  const orderItems = requestedItems.map((item) => {
    const product = productsByCode.get(item.productCode)!;
    const unitPrice = getCurrencyPrice(product, currency);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return { item, product, unitPrice, lineTotal, imageUrl: images.get(item.productCode)?.[0]?.imageUrl || null };
  });
  subtotal = Math.round(subtotal * 100) / 100;
  const shippingFee = calculateShippingFee(shippingMethodId, subtotal);
  const paymentFee = Math.round((subtotal + shippingFee) * paymentMethod.feeRate * 100) / 100;
  const finalTotal = Math.round((subtotal + shippingFee + paymentFee) * 100) / 100;
  const customerValues = [
    customerName, email, phone, cleanText(customer.preferredContact, 30),
    cleanText(customer.whatsapp, 100) || null, cleanText(customer.telegram, 100) || null,
    countryCode, countryName, addressLine1, cleanText(customer.addressLine2, 200) || null,
    city, cleanText(customer.county, 100) || null, postcode,
    shippingMethodId, shippingMethod.label, shippingMethod.estimate, shippingFee,
    subtotal, finalTotal, currency, paymentMethod.label, paymentFee, paymentMethod.feeRate, finalTotal,
  ] as D1Value[];
  const itemStatements = (orderId: string) => orderItems.map(({ item, product, unitPrice, lineTotal, imageUrl }) => env.DB.prepare(
    `INSERT INTO order_items (
      order_id, product_code, title, slug, product_url, image_url, size, color,
      quantity, unit_price, line_total, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    orderId, product.product_code, product.title, product.slug,
    `${STOREFRONT_BASE_URL}/product/${encodeURIComponent(product.slug)}`, imageUrl,
    item.size, item.color || null, item.quantity, unitPrice, lineTotal, currency,
  ));

  if (checkoutSessionId) {
    const existing = await d1First<OrderRow>(
      env,
      { endpoint: "/orders", label: "order_by_checkout_session", limit: 1, offset: 0 },
      "SELECT * FROM orders WHERE checkout_session_id = ? LIMIT 1",
      [checkoutSessionId],
    );
    if (existing && (existing.status === "awaiting_payment" || existing.status === "pending")) {
      const status: OrderStatus = existing.status;
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE orders SET
            customer_name = ?, email = ?, phone = ?, preferred_contact = ?, whatsapp = ?, telegram = ?,
            country_code = ?, country_name = ?, address_line1 = ?, address_line2 = ?, city = ?, county = ?, postcode = ?,
            shipping_method_id = ?, shipping_method_label = ?, shipping_estimate = ?, shipping_fee = ?,
            subtotal = ?, total = ?, currency = ?, payment_method = ?, payment_fee = ?, payment_fee_rate = ?, final_total = ?,
            status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
        ).bind(...customerValues, status, existing.id),
        env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(existing.id),
        ...itemStatements(existing.id),
      ]);
      return jsonResponse(request, {
        order: orderPayload(existing.order_number, status, subtotal, shippingFee, paymentMethod.label, paymentFee, paymentMethod.feeRate, finalTotal, currency, existing),
      });
    }
    if (existing) {
      return jsonResponse(request, {
        order: orderPayload(existing.order_number, existing.status, existing.subtotal, existing.shipping_fee, existing.payment_method, existing.payment_fee, existing.payment_fee_rate, existing.final_total, existing.currency, existing),
      });
    }
  }

  const orderId = crypto.randomUUID();
  const orderNumber = createOrderNumber();
  const statements = [
    env.DB.prepare(
      `INSERT INTO orders (
        id, order_number, checkout_session_id, customer_name, email, phone, preferred_contact, whatsapp, telegram,
        country_code, country_name, address_line1, address_line2, city, county, postcode,
        shipping_method_id, shipping_method_label, shipping_estimate, shipping_fee,
        subtotal, total, currency, payment_method, payment_fee, payment_fee_rate, final_total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      orderId, orderNumber, checkoutSessionId, ...customerValues, "pending",
    ),
    ...itemStatements(orderId),
  ];
  try {
    await env.DB.batch(statements);
  } catch (error) {
    // A double-click can race the session lookup. The unique session index is
    // the final guard; return its existing order instead of creating a second one.
    if (checkoutSessionId && String(error).toLowerCase().includes("unique")) {
      const existing = await d1First<OrderRow>(
        env,
        { endpoint: "/orders", label: "order_by_checkout_session_after_race", limit: 1, offset: 0 },
        "SELECT * FROM orders WHERE checkout_session_id = ? LIMIT 1",
        [checkoutSessionId],
      );
      if (existing) {
        return jsonResponse(request, {
          order: orderPayload(existing.order_number, existing.status, existing.subtotal, existing.shipping_fee, existing.payment_method, existing.payment_fee, existing.payment_fee_rate, existing.final_total, existing.currency, existing),
        });
      }
    }
    throw error;
  }
  return jsonResponse(request, {
    order: orderPayload(orderNumber, "pending", subtotal, shippingFee, paymentMethod.label, paymentFee, paymentMethod.feeRate, finalTotal, currency),
  }, 201);
}

function classificationModel(env: WorkerEnv): string {
  return cleanText(env.KIMI_MODEL, 120);
}

function deepSeekModel(env: WorkerEnv): string {
  return cleanText(env.DEEPSEEK_MODEL, 120);
}

function classificationImageUrl(images: ReturnType<typeof mapImage>[] | undefined): string | null {
  const value = images?.[0]?.imageUrl || images?.[0]?.image_url || "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function callKimiClassification(env: WorkerEnv, title: string, imageUrl: string | null) {
  const apiKey = cleanText(env.KIMI_API_KEY, 300);
  const model = classificationModel(env);
  if (!apiKey || !model) throw new Error("KIMI_API_KEY 和 KIMI_MODEL 尚未配置");
  let lastError = "Kimi request failed";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(KIMI_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildKimiRequest(title, imageUrl, model)),
      });
      if (response.status === 429 || response.status >= 500) {
        lastError = `Kimi returned ${response.status}`;
        if (attempt < 2) {
          const retryAfter = Number(response.headers.get("Retry-After") || 0);
          await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(retryAfter * 1000, 500 * (attempt + 1)), 5000)));
          continue;
        }
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Kimi returned ${response.status}: ${detail.slice(0, 160)}`);
      }
      const parsed = parseKimiClassification(await response.json());
      if (!parsed) throw new Error("Kimi 返回的 JSON 不符合分类格式");
      return { parsed, model };
    } catch (error) {
      lastError = safeKimiError(error);
      if (attempt < 2 && /fetch|network|timeout|returned 5\d\d/i.test(lastError)) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      break;
    }
  }
  throw new Error(lastError);
}

async function callDeepSeekClassification(env: WorkerEnv, title: string) {
  const apiKey = cleanText(env.DEEPSEEK_API_KEY, 300);
  const model = deepSeekModel(env);
  if (!apiKey || !model) throw new Error("DEEPSEEK_API_KEY 和 DEEPSEEK_MODEL 尚未配置");
  const configuredBase = cleanText(env.DEEPSEEK_API_BASE, 300);
  const endpoint = configuredBase
    ? (configuredBase.endsWith("/chat/completions") ? configuredBase : `${configuredBase.replace(/\/$/, "")}/chat/completions`)
    : DEEPSEEK_API_URL;
  let lastError = "DeepSeek request failed";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildDeepSeekRequest(title, model)),
      });
      if (response.status === 429 || response.status >= 500) {
        lastError = `DeepSeek returned ${response.status}`;
        if (attempt < 2) {
          const retryAfter = Number(response.headers.get("Retry-After") || 0);
          await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(retryAfter * 1000, 500 * (attempt + 1)), 5000)));
          continue;
        }
      }
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`DeepSeek returned ${response.status}: ${detail.slice(0, 160)}`);
      }
      const parsed = parseDeepSeekClassification(await response.json());
      if (!parsed) throw new Error("DeepSeek 返回的 JSON 不符合分类格式");
      return { parsed, model };
    } catch (error) {
      lastError = safeKimiError(error);
      if (attempt < 2 && /fetch|network|timeout|returned 5\d\d/i.test(lastError)) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      break;
    }
  }
  throw new Error(lastError);
}

async function imageAsDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`图片读取失败（HTTP ${response.status}）`);
  const contentType = (response.headers.get("Content-Type") || "image/jpeg").split(";", 1)[0].toLowerCase();
  if (!contentType.startsWith("image/")) throw new Error("图片读取失败（内容类型不是图片）");
  const length = Number(response.headers.get("Content-Length") || 0);
  if (length > 8 * 1024 * 1024) throw new Error("图片读取失败（图片过大）");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 8 * 1024 * 1024) throw new Error("图片读取失败（图片为空或过大）");
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

async function saveClassificationSuggestion(
  env: WorkerEnv,
  product: ProductRow,
  input: {
    suggestedCategory: string | null;
    suggestedSubcategory: string | null;
    confidence: number | null;
    reason: string | null;
    status: ClassificationStatus;
    imageAvailable: boolean;
    model: string | null;
    source?: ClassificationSource;
    errorMessage?: string | null;
  },
) {
  await d1Run(
    env,
    { endpoint: "/admin/classification/scan-one", label: "classification_suggestion_upsert", limit: 1 },
    `INSERT INTO product_classification_suggestions (
      product_id, product_code, old_category, old_subcategory,
      suggested_category, suggested_subcategory, confidence, reason,
      status, image_available, model, classification_source, error_message, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id) DO UPDATE SET
      product_code = excluded.product_code,
      old_category = excluded.old_category,
      old_subcategory = excluded.old_subcategory,
      suggested_category = excluded.suggested_category,
      suggested_subcategory = excluded.suggested_subcategory,
      confidence = excluded.confidence,
      reason = excluded.reason,
      status = excluded.status,
      image_available = excluded.image_available,
      model = excluded.model,
      classification_source = excluded.classification_source,
      error_message = excluded.error_message,
      updated_at = CURRENT_TIMESTAMP`,
    [
      product.id, product.product_code, product.category, product.subcategory,
      input.suggestedCategory, input.suggestedSubcategory, input.confidence, input.reason,
      input.status, input.imageAvailable ? 1 : 0, input.model, input.source || null, input.errorMessage || null,
    ],
  );
}

/**
 * Run the image-aware fallback and persist only its staging suggestion. A
 * model uncertainty (including a valid null/null response) is kept as a
 * reviewable result; FAILED is reserved for technical/API/parse failures.
 */
async function runKimiFallback(env: WorkerEnv, product: ProductRow) {
  let imageUrl: string | null = null;
  try {
    if (!cleanText(env.KIMI_API_KEY, 300) || !classificationModel(env)) {
      throw new Error("KIMI_API_KEY 和 KIMI_MODEL 尚未配置");
    }
    const images = await imagesForProducts(env, "/admin/classification/scan-one", [product.product_code]);
    imageUrl = classificationImageUrl(images.get(product.product_code));
    const kimiImage = imageUrl ? await imageAsDataUrl(imageUrl) : null;
    const { parsed, model } = await callKimiClassification(env, product.title, kimiImage);
    const status = classificationStatus({
      result: parsed,
      oldCategory: product.category,
      imageAvailable: Boolean(imageUrl),
      title: product.title,
    });
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: parsed.category,
      suggestedSubcategory: parsed.subcategory,
      confidence: parsed.confidence,
      reason: parsed.reason,
      status,
      imageAvailable: Boolean(imageUrl),
      model,
      source: "kimi-vision",
    });
    return {
      ok: true as const,
      suggestion: {
        productCode: product.product_code,
        status,
        source: "kimi-vision" as const,
        category: parsed.category,
        subcategory: parsed.subcategory,
        confidence: parsed.confidence,
        reason: parsed.reason,
        imageAvailable: Boolean(imageUrl),
      },
    };
  } catch (error) {
    const message = safeKimiError(error);
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: null,
      suggestedSubcategory: null,
      confidence: null,
      reason: null,
      status: "FAILED",
      imageAvailable: Boolean(imageUrl),
      model: classificationModel(env) || null,
      source: "kimi-vision",
      errorMessage: message,
    });
    return {
      ok: false as const,
      error: message,
      suggestion: {
        productCode: product.product_code,
        status: "FAILED" as const,
        source: "kimi-vision" as const,
        imageAvailable: Boolean(imageUrl),
      },
    };
  }
}

async function handleClassificationQueue(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const limit = normaliseLimit(url.searchParams.get("limit"), 50, 50);
  const force = url.searchParams.get("force") === "1";
  const perCategory = Math.max(1, Math.floor(limit / catalogCategories.length));
  const selected = new Map<string, ProductRow>();
  for (const category of catalogCategories.map((item) => item.value)) {
    const { results = [] } = await d1All<ProductRow>(
      env,
      { endpoint: "/admin/classification/queue", label: "classification_queue_by_category", limit: perCategory },
      `SELECT p.*
       FROM products p
       LEFT JOIN product_classification_suggestions s ON s.product_id = p.id
       WHERE p.status = 'active' AND p.category = ?
         AND (? = 1 OR s.product_id IS NULL OR s.status = 'FAILED')
       ORDER BY RANDOM() LIMIT ?`,
      [category, force ? 1 : 0, perCategory],
    );
    for (const product of results) selected.set(product.product_code, product);
  }
  if (selected.size < limit) {
    const { results = [] } = await d1All<ProductRow>(
      env,
      { endpoint: "/admin/classification/queue", label: "classification_queue_fill", limit },
      `SELECT p.*
       FROM products p
       LEFT JOIN product_classification_suggestions s ON s.product_id = p.id
       WHERE p.status = 'active'
         AND (? = 1 OR s.product_id IS NULL OR s.status = 'FAILED')
       ORDER BY RANDOM() LIMIT ?`,
      [force ? 1 : 0, limit],
    );
    for (const product of results) {
      if (selected.size >= limit) break;
      selected.set(product.product_code, product);
    }
  }
  const products = Array.from(selected.values()).slice(0, limit);
  const images = await imagesForProducts(env, "/admin/classification/queue", products.map((product) => product.product_code));
  return jsonResponse(request, {
    limit,
    products: products.map((product) => ({
      ...mapProduct(product),
      imageUrl: classificationImageUrl(images.get(product.product_code)),
    })),
  });
}

async function handleClassificationSummary(request: Request, env: WorkerEnv) {
  const { results = [] } = await d1All<{ status: ClassificationStatus; classification_source: ClassificationSource; count: number }>(
    env,
    { endpoint: "/admin/classification/summary", label: "classification_summary" },
    "SELECT status, classification_source, COUNT(*) AS count FROM product_classification_suggestions GROUP BY status, classification_source",
  );
  const counts = { READY: 0, REVIEW: 0, UNKNOWN: 0, FAILED: 0 } as Record<ClassificationStatus, number>;
  const sourceCounts: Record<Exclude<ClassificationSource, null>, number> = { "title-rule": 0, deepseek: 0, "needs-vision": 0, "kimi-vision": 0 };
  for (const row of results) {
    if (row.status in counts && !(row.status === "REVIEW" && row.classification_source === "needs-vision")) counts[row.status] += Number(row.count) || 0;
    if (row.classification_source && row.classification_source in sourceCounts) sourceCounts[row.classification_source] += Number(row.count) || 0;
  }
  const aggregate = await d1First<{ average_confidence: number | null; parent_changed_count: number }>(
    env,
    { endpoint: "/admin/classification/summary", label: "classification_summary_aggregate" },
    `SELECT AVG(confidence) AS average_confidence,
            SUM(CASE WHEN old_category IS NOT NULL AND suggested_category IS NOT NULL AND old_category != suggested_category THEN 1 ELSE 0 END) AS parent_changed_count
     FROM product_classification_suggestions`,
  );
  const { results: subcategories = [] } = await d1All<{ subcategory: string; count: number }>(
    env,
    { endpoint: "/admin/classification/summary", label: "classification_summary_subcategories" },
    `SELECT suggested_subcategory AS subcategory, COUNT(*) AS count
     FROM product_classification_suggestions
     WHERE suggested_subcategory IS NOT NULL
     GROUP BY suggested_subcategory ORDER BY suggested_subcategory`,
  );
  return jsonResponse(request, {
    counts,
    averageConfidence: aggregate?.average_confidence === null || aggregate?.average_confidence === undefined ? null : Number(aggregate.average_confidence),
    parentChangedCount: Number(aggregate?.parent_changed_count || 0),
    subcategoryCounts: subcategories.map((row) => ({ subcategory: row.subcategory, count: Number(row.count) || 0 })),
    workflow: {
      total: Object.values(sourceCounts).reduce((sum, value) => sum + value, 0),
      titleRule: sourceCounts["title-rule"],
      deepseek: sourceCounts.deepseek,
      needsVision: sourceCounts["needs-vision"],
      failed: counts.FAILED,
    },
    sourceCounts,
    deepseekConfigured: Boolean(cleanText(env.DEEPSEEK_API_KEY, 300) && deepSeekModel(env)),
    kimiConfigured: Boolean(cleanText(env.KIMI_API_KEY, 300) && classificationModel(env)),
  });
}

async function handleClassificationSuggestions(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const status = cleanText(url.searchParams.get("status"), 20);
  const allowed = new Set<ClassificationStatus | "NEEDS_VISION" | "">(["", "READY", "REVIEW", "UNKNOWN", "FAILED", "NEEDS_VISION"]);
  const filter = allowed.has(status as ClassificationStatus | "NEEDS_VISION" | "") && status
    ? status === "NEEDS_VISION" ? "WHERE s.classification_source = ?" : status === "REVIEW" ? "WHERE s.status = ? AND (s.classification_source IS NULL OR s.classification_source != 'needs-vision')" : "WHERE s.status = ?"
    : "";
  const values: D1Value[] = filter ? [status === "NEEDS_VISION" ? "needs-vision" : status] : [];
  const limit = normaliseLimit(url.searchParams.get("limit"), 50, 100);
  const { results = [] } = await d1All<ClassificationProductRow>(
    env,
    { endpoint: "/admin/classification/suggestions", label: "classification_suggestions", limit },
    `SELECT p.*, s.old_category, s.old_subcategory,
            s.suggested_category, s.suggested_subcategory, s.confidence,
            s.reason, s.status AS suggestion_status, s.image_available,
            s.model, s.classification_source, s.error_message, s.updated_at, i.image_url
     FROM product_classification_suggestions s
     INNER JOIN products p ON p.id = s.product_id
     LEFT JOIN product_images i ON i.id = (
       SELECT id FROM product_images WHERE product_code = p.product_code ORDER BY position, id LIMIT 1
     )
     ${filter}
     ORDER BY s.updated_at DESC, s.id DESC LIMIT ?`,
    [...values, limit],
  );
  return jsonResponse(request, {
    suggestions: results.map((row) => ({
      productCode: row.product_code,
      slug: row.slug,
      title: row.title,
      imageUrl: row.image_url || null,
      oldCategory: row.old_category,
      oldSubcategory: row.old_subcategory,
      suggestedCategory: row.suggested_category,
      suggestedSubcategory: row.suggested_subcategory,
      confidence: row.confidence,
      reason: row.reason,
      status: row.classification_source === "needs-vision" ? "NEEDS_VISION" : row.suggestion_status,
      source: row.classification_source || (row.model ? "kimi-vision" : null),
      imageAvailable: Boolean(row.image_available),
      model: row.model,
      errorMessage: row.error_message,
      updatedAt: row.updated_at,
    })),
  });
}

async function handleVisionClassificationScanOne(request: Request, env: WorkerEnv) {
  const body = await readBoundedJson(request);
  const productCode = isRecord(body) ? cleanText(body.productCode, 120).toUpperCase() : "";
  if (!productCode) return jsonResponse(request, { error: "商品编号无效" }, 400);
  if (!cleanText(env.KIMI_API_KEY, 300) || !classificationModel(env)) {
    return jsonResponse(request, { error: "KIMI_API_KEY 和 KIMI_MODEL 尚未配置" }, 503);
  }
  const product = await d1First<ProductRow>(
    env,
    { endpoint: "/admin/classification/scan-one-vision", label: "classification_product", limit: 1 },
    "SELECT * FROM products WHERE product_code = ? LIMIT 1",
    [productCode],
  );
  if (!product) return jsonResponse(request, { error: "未找到商品" }, 404);
  const images = await imagesForProducts(env, "/admin/classification/scan-one-vision", [productCode]);
  const imageUrl = classificationImageUrl(images.get(productCode));
  try {
    const kimiImage = imageUrl ? await imageAsDataUrl(imageUrl) : null;
    const { parsed, model } = await callKimiClassification(env, product.title, kimiImage);
    const status = classificationStatus({ result: parsed, oldCategory: product.category, imageAvailable: Boolean(imageUrl), title: product.title });
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: parsed.category,
      suggestedSubcategory: parsed.subcategory,
      confidence: parsed.confidence,
      reason: parsed.reason,
      status,
      imageAvailable: Boolean(imageUrl),
      model,
      source: "kimi-vision",
    });
    return jsonResponse(request, { suggestion: { productCode, status, category: parsed.category, subcategory: parsed.subcategory, confidence: parsed.confidence, reason: parsed.reason, imageAvailable: Boolean(imageUrl) } });
  } catch (error) {
    const message = safeKimiError(error);
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: null,
      suggestedSubcategory: null,
      confidence: null,
      reason: null,
      status: "FAILED",
      imageAvailable: Boolean(imageUrl),
      model: classificationModel(env) || null,
      source: "kimi-vision",
      errorMessage: message,
    });
    return jsonResponse(request, { error: message, suggestion: { productCode, status: "FAILED", imageAvailable: Boolean(imageUrl) } }, 502);
  }
}

async function handleClassificationScanOne(request: Request, env: WorkerEnv) {
  const body = await readBoundedJson(request);
  const productCode = isRecord(body) ? cleanText(body.productCode, 120).toUpperCase() : "";
  if (!productCode) return jsonResponse(request, { error: "商品编号无效" }, 400);
  const product = await d1First<ProductRow>(
    env,
    { endpoint: "/admin/classification/scan-one", label: "classification_product", limit: 1 },
    "SELECT * FROM products WHERE product_code = ? LIMIT 1",
    [productCode],
  );
  if (!product) return jsonResponse(request, { error: "未找到商品" }, 404);

  if (isUnsupportedTitle(product.title)) {
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: null,
      suggestedSubcategory: null,
      confidence: null,
      reason: UNSUPPORTED_TAXONOMY_REASON,
      status: "REVIEW",
      imageAvailable: false,
      model: "title-rule",
      source: "title-rule",
    });
    return jsonResponse(request, { suggestion: { productCode, status: "REVIEW", source: "title-rule", category: null, subcategory: null, reason: UNSUPPORTED_TAXONOMY_REASON, imageAvailable: false } });
  }

  const rule = classifyByTitleRules(product.title);
  if (rule && isValidCatalogClassification(rule.category, rule.subcategory)) {
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: rule.category,
      suggestedSubcategory: rule.subcategory,
      confidence: 1,
      reason: rule.reason,
      status: "READY",
      imageAvailable: false,
      model: "title-rule",
      source: "title-rule",
    });
    return jsonResponse(request, { suggestion: { productCode, status: "READY", source: "title-rule", category: rule.category, subcategory: rule.subcategory, confidence: 1, reason: rule.reason, imageAvailable: false } });
  }

  if (!cleanText(env.DEEPSEEK_API_KEY, 300) || !deepSeekModel(env)) {
    return jsonResponse(request, { error: "DEEPSEEK_API_KEY 和 DEEPSEEK_MODEL 尚未配置" }, 503);
  }
  try {
    const { parsed, model } = await callDeepSeekClassification(env, product.title);
    if (deepSeekNeedsVision(product.title, parsed)) {
      const fallback = await runKimiFallback(env, product);
      if (!fallback.ok) {
        return jsonResponse(request, { error: fallback.error, suggestion: fallback.suggestion }, 502);
      }
      return jsonResponse(request, { suggestion: fallback.suggestion });
    }
    const status: ClassificationStatus = "READY";
    const source: ClassificationSource = "deepseek";
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: parsed.category,
      suggestedSubcategory: parsed.subcategory,
      confidence: parsed.confidence,
      reason: parsed.reason,
      status,
      imageAvailable: false,
      model,
      source,
    });
    return jsonResponse(request, {
      suggestion: {
        productCode,
        status,
        source,
        category: parsed.category,
        subcategory: parsed.subcategory,
        confidence: parsed.confidence,
        reason: parsed.reason,
        imageAvailable: false,
      },
    });
  } catch (error) {
    const message = safeKimiError(error);
    if (/JSON 不符合分类格式/i.test(message)) {
      const fallback = await runKimiFallback(env, product);
      if (!fallback.ok) {
        return jsonResponse(request, { error: fallback.error, suggestion: fallback.suggestion }, 502);
      }
      return jsonResponse(request, { suggestion: fallback.suggestion });
    }
    await saveClassificationSuggestion(env, product, {
      suggestedCategory: null,
      suggestedSubcategory: null,
      confidence: null,
      reason: null,
      status: "FAILED",
      imageAvailable: false,
      model: deepSeekModel(env) || null,
      source: "deepseek",
      errorMessage: message,
    });
    return jsonResponse(request, { error: message, suggestion: { productCode, status: "FAILED", source: "deepseek", imageAvailable: false } }, 502);
  }
}

async function handleAdminProducts(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const q = cleanText(url.searchParams.get("q"), 100);
  const values: D1Value[] = [];
  let where = "WHERE 1 = 0";
  if (q) {
    where = "WHERE product_code LIKE ? COLLATE NOCASE OR title LIKE ? COLLATE NOCASE OR brand LIKE ? COLLATE NOCASE";
    const term = `%${q}%`;
    values.push(term, term, term);
  }
  const limit = normaliseLimit(url.searchParams.get("limit"), 50, MAX_LIST_LIMIT);
  const { results = [] } = await d1All<ProductRow>(
    env,
    { endpoint: "/admin/products", label: "admin_products_search", limit, offset: 0 },
    `SELECT * FROM products ${where} ORDER BY updated_at DESC, id DESC LIMIT ?`,
    [...values, limit],
  );
  const images = await imagesForProducts(env, "/admin/products", results.map((product) => product.product_code));
  const subcategories = Object.entries(catalogSubcategories).flatMap(([category, values]) =>
    values.map(({ value }) => ({ category, subcategory: value })),
  );
  return jsonResponse(request, {
    products: results.map((product) => ({ ...mapProduct(product), images: images.get(product.product_code) ?? [] })),
    categories: catalogCategories.map(({ value }) => value),
    subcategories,
  });
}

async function handleAdminProductUpdate(request: Request, env: WorkerEnv, productCode: string) {
  const body = await readBoundedJson(request);
  if (!isRecord(body)) return jsonResponse(request, { error: "商品数据无效" }, 400);
  const existing = await d1First<ProductRow>(
    env,
    { endpoint: "/admin/products/:product_code", label: "admin_product_before_update", limit: 1, offset: 0 },
    "SELECT * FROM products WHERE product_code = ? LIMIT 1",
    [productCode],
  );
  if (!existing) return jsonResponse(request, { error: "未找到商品" }, 404);
  if (("category" in body && typeof body.category !== "string") ||
      ("subcategory" in body && body.subcategory !== null && typeof body.subcategory !== "string")) {
    return jsonResponse(request, { error: "分类字段格式无效" }, 400);
  }
  const category = "category" in body ? String(body.category) : existing.category;
  const subcategory = "subcategory" in body ? (body.subcategory === "" || body.subcategory === null ? null : String(body.subcategory)) : existing.subcategory;
  const brand = "brand" in body ? cleanText(body.brand, 120) : existing.brand;
  const title = "title" in body ? cleanText(body.title, 240) : existing.title;
  if (!title) return jsonResponse(request, { error: "商品标题不能为空" }, 400);
  if (!canUpdateCatalogClassification(existing, { category, subcategory })) {
    return jsonResponse(request, { error: "子类目与当前产品分类不匹配" }, 400);
  }
  const classificationChanged = category !== existing.category || subcategory !== existing.subcategory;
  const result = await d1Run(
    env,
    { endpoint: "/admin/products/:product_code", label: "admin_product_update" },
    classificationChanged
      ? "UPDATE products SET title = ?, category = ?, subcategory = ?, brand = ?, updated_at = CURRENT_TIMESTAMP WHERE product_code = ?"
      : "UPDATE products SET title = ?, brand = ?, updated_at = CURRENT_TIMESTAMP WHERE product_code = ?",
    classificationChanged ? [title, category, subcategory, brand, productCode] : [title, brand, productCode],
  );
  if (!result.meta.changes) return jsonResponse(request, { error: "未找到商品" }, 404);
  const updated = await d1First<ProductRow>(
    env,
    { endpoint: "/admin/products/:product_code", label: "admin_product_by_code", limit: 1, offset: 0 },
    "SELECT * FROM products WHERE product_code = ? LIMIT 1",
    [productCode],
  );
  const images = await imagesForProducts(env, "/admin/products/:product_code", [productCode]);
  return jsonResponse(request, { product: updated ? { ...mapProduct(updated), images: images.get(productCode) ?? [] } : null });
}

function orderStageSql() {
  return `CASE
    WHEN status = 'cancelled' THEN 'cancelled'
    WHEN payment_confirmed_at IS NOT NULL OR status IN ('payment_confirmed', 'confirmed', 'paid', 'processing', 'shipped', 'completed') THEN 'payment_confirmed'
    WHEN transfer_submitted_at IS NOT NULL OR status = 'payment_submitted' THEN 'payment_submitted'
    WHEN payment_page_viewed_at IS NOT NULL OR status = 'awaiting_payment' THEN 'awaiting_payment'
    ELSE 'created'
  END`;
}

function adminOrderPayload(order: OrderRow) {
  return {
    ...order,
    payment_stage: getOrderPaymentStage(order),
    whatsapp_clicked: Boolean(order.whatsapp_clicked_at),
  };
}

async function handleAdminOrders(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const filters: string[] = [];
  const values: D1Value[] = [];
  const q = cleanText(url.searchParams.get("q"), 100);
  const status = cleanText(url.searchParams.get("status"), 40);
  if (q) {
    filters.push("(order_number LIKE ? OR customer_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const term = `%${q}%`;
    values.push(term, term, term, term);
  }
  if (status === "whatsapp_not_clicked") {
    filters.push("whatsapp_clicked_at IS NULL");
  } else if (["created", "awaiting_payment", "payment_submitted", "payment_confirmed", "cancelled"].includes(status)) {
    filters.push(`${orderStageSql()} = ?`);
    values.push(status);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const limit = normaliseLimit(url.searchParams.get("limit"), 50, MAX_LIST_LIMIT);
  const { results = [] } = await d1All<OrderRow>(
    env,
    { endpoint: "/admin/orders", label: "admin_orders_page", limit, offset: 0 },
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ?`,
    [...values, limit],
  );
  return jsonResponse(request, { orders: results.map(adminOrderPayload) });
}

async function readOrder(env: WorkerEnv, orderNumber: string) {
  const order = await d1First<OrderRow>(
    env,
    { endpoint: "/admin/orders/:order_number", label: "admin_order_by_number", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!order) return null;
  const { results: items = [] } = await d1All<OrderItemRow>(
    env,
    { endpoint: "/admin/orders/:order_number", label: "admin_order_items" },
    "SELECT * FROM order_items WHERE order_id = ? ORDER BY id",
    [order.id],
  );
  return { ...adminOrderPayload(order), items };
}

function publicOrderPayload(order: OrderRow, items: OrderItemRow[]) {
  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentStage: getOrderPaymentStage(order),
    createdAt: order.created_at,
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    total: order.final_total,
    currency: order.currency,
    shippingMethod: order.shipping_method_label,
    shippingEstimate: order.shipping_estimate,
    customer: {
      name: order.customer_name,
      addressLine1: order.address_line1,
      addressLine2: order.address_line2,
      city: order.city,
      county: order.county,
      postcode: order.postcode,
      countryName: order.country_name,
    },
    items: items.map((item) => ({
      productCode: item.product_code,
      title: item.title,
      slug: item.slug,
      image: item.image_url,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
    })),
  };
}

async function handlePublicOrder(request: Request, env: WorkerEnv, orderNumber: string) {
  const order = await d1First<OrderRow>(
    env,
    { endpoint: "/orders/:order_number", label: "public_order_by_number", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!order) return jsonResponse(request, { error: "未找到订单" }, 404);
  const { results: items = [] } = await d1All<OrderItemRow>(
    env,
    { endpoint: "/orders/:order_number", label: "public_order_items" },
    "SELECT * FROM order_items WHERE order_id = ? ORDER BY id",
    [order.id],
  );
  return jsonResponse(request, { order: publicOrderPayload(order, items) });
}

async function handlePaymentSubmitted(request: Request, env: WorkerEnv, orderNumber: string) {
  const order = await d1First<OrderRow>(
    env,
    { endpoint: "/orders/:order_number/payment-submitted", label: "order_before_payment_submitted", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!order) return jsonResponse(request, { error: "未找到订单" }, 404);
  if (order.status === "awaiting_payment" || order.status === "pending") {
    await d1Run(
      env,
      { endpoint: "/orders/:order_number/payment-submitted", label: "order_payment_submitted" },
      "UPDATE orders SET status = 'payment_submitted', transfer_submitted_at = COALESCE(transfer_submitted_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE order_number = ? AND status IN ('awaiting_payment', 'pending')",
      [orderNumber],
    );
  } else if (order.status === "payment_submitted" && !order.transfer_submitted_at) {
    await d1Run(
      env,
      { endpoint: "/orders/:order_number/payment-submitted", label: "order_payment_submitted_backfill" },
      "UPDATE orders SET transfer_submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE order_number = ? AND transfer_submitted_at IS NULL",
      [orderNumber],
    );
  } else if (order.status !== "payment_submitted") {
    return jsonResponse(request, { error: "订单当前状态不能提交付款" }, 409);
  }
  const updated = await d1First<OrderRow>(
    env,
    { endpoint: "/orders/:order_number/payment-submitted", label: "order_after_payment_submitted", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!updated) return jsonResponse(request, { error: "订单状态更新失败" }, 500);
  return jsonResponse(request, { order: publicOrderPayload(updated, []) });
}

async function handlePaymentPageViewed(request: Request, env: WorkerEnv, orderNumber: string) {
  const order = await d1First<OrderRow>(
    env,
    { endpoint: "/orders/:order_number/payment-viewed", label: "order_before_payment_viewed", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!order) return jsonResponse(request, { error: "未找到订单" }, 404);
  if (order.status === "cancelled") return jsonResponse(request, { error: "订单已取消" }, 409);
  await d1Run(
    env,
    { endpoint: "/orders/:order_number/payment-viewed", label: "order_payment_page_viewed" },
    "UPDATE orders SET payment_page_viewed_at = COALESCE(payment_page_viewed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE order_number = ?",
    [orderNumber],
  );
  const updated = await d1First<OrderRow>(
    env,
    { endpoint: "/orders/:order_number/payment-viewed", label: "order_after_payment_viewed", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!updated) return jsonResponse(request, { error: "付款页事件记录失败" }, 500);
  return jsonResponse(request, { order: publicOrderPayload(updated, []) });
}

async function handleWhatsappClicked(request: Request, env: WorkerEnv, orderNumber: string) {
  const result = await d1Run(
    env,
    { endpoint: "/orders/:order_number/whatsapp-clicked", label: "order_whatsapp_clicked" },
    "UPDATE orders SET whatsapp_clicked_at = COALESCE(whatsapp_clicked_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE order_number = ?",
    [orderNumber],
  );
  if (!result.meta.changes) return jsonResponse(request, { error: "未找到订单" }, 404);
  const updated = await d1First<OrderRow>(
    env,
    { endpoint: "/orders/:order_number/whatsapp-clicked", label: "order_after_whatsapp_clicked", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!updated) return jsonResponse(request, { error: "WhatsApp 点击事件记录失败" }, 500);
  return jsonResponse(request, { order: publicOrderPayload(updated, []) });
}

async function handleAdminOrderDetail(request: Request, env: WorkerEnv, orderNumber: string) {
  const order = await readOrder(env, orderNumber);
  return order ? jsonResponse(request, { order }) : jsonResponse(request, { error: "未找到订单" }, 404);
}

async function handleAdminOrderPaymentConfirmed(request: Request, env: WorkerEnv, orderNumber: string) {
  const existing = await d1First<OrderRow>(
    env,
    { endpoint: "/admin/orders/:order_number/payment-confirmed", label: "admin_order_before_payment_confirmed", limit: 1, offset: 0 },
    "SELECT * FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!existing) return jsonResponse(request, { error: "未找到订单" }, 404);
  if (existing.status === "cancelled") return jsonResponse(request, { error: "已取消订单不能确认到账" }, 409);
  await d1Run(
    env,
    { endpoint: "/admin/orders/:order_number/payment-confirmed", label: "admin_order_payment_confirmed" },
    "UPDATE orders SET status = 'payment_confirmed', payment_confirmed_at = COALESCE(payment_confirmed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE order_number = ? AND status != 'cancelled'",
    [orderNumber],
  );
  return handleAdminOrderDetail(request, env, orderNumber);
}

async function handleAdminOrderStatus(request: Request, env: WorkerEnv, orderNumber: string) {
  const body = await readBoundedJson(request);
  const status = isRecord(body) ? cleanText(body.status, 30) as OrderStatus : "pending";
  if (status !== "cancelled") return jsonResponse(request, { error: "后台仅支持取消订单；确认到账请使用 Confirm payment received" }, 400);
  const result = await d1Run(
    env,
    { endpoint: "/admin/orders/:order_number/status", label: "admin_order_status_update" },
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?",
    [status, orderNumber],
  );
  if (!result.meta.changes) return jsonResponse(request, { error: "未找到订单" }, 404);
  return handleAdminOrderDetail(request, env, orderNumber);
}

async function handleAdminOrderDelete(request: Request, env: WorkerEnv, orderNumber: string) {
  const existing = await d1First<{ id: string }>(
    env,
    { endpoint: "/admin/orders/:order_number", label: "admin_order_id_by_number", limit: 1, offset: 0 },
    "SELECT id FROM orders WHERE order_number = ? LIMIT 1",
    [orderNumber],
  );
  if (!existing) return jsonResponse(request, { error: "未找到订单" }, 404);

  const results = await env.DB.batch([
    env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(existing.id),
    env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(existing.id),
  ]);
  const deleted = results[1]?.meta.changes ?? 0;
  if (!deleted) return jsonResponse(request, { error: "订单删除失败" }, 500);
  return jsonResponse(request, { ok: true, orderNumber });
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (pathname === "/health" && request.method === "GET") return jsonResponse(request, { ok: true, service: SERVICE_NAME });
      if (pathname === "/catalog" && request.method === "GET") return cachedCatalog(request, env, ctx);
      if (pathname === "/latest" && request.method === "GET") return cachedCatalog(request, env, ctx);
      if (pathname === "/filters" && request.method === "GET") return cachedFilters(request, env, ctx);
      if (pathname === "/catalog-size-stats" && request.method === "GET") return cachedCatalogSizeStats(request, env, ctx);
      if (pathname === "/sitemap-products" && request.method === "GET") return cachedSitemapProducts(request, env, ctx);
      if (pathname === "/site-settings" && request.method === "GET") return handleSiteSettings(request, env);
      if (pathname === "/orders" && request.method === "POST") return handleCreateOrder(request, env);
      const paymentViewedMatch = pathname.match(/^\/orders\/([^/]+)\/payment-viewed$/);
      if (paymentViewedMatch && request.method === "POST") {
        return handlePaymentPageViewed(request, env, decodeURIComponent(paymentViewedMatch[1]));
      }
      const paymentSubmittedMatch = pathname.match(/^\/orders\/([^/]+)\/payment-submitted$/);
      if (paymentSubmittedMatch && request.method === "POST") {
        return handlePaymentSubmitted(request, env, decodeURIComponent(paymentSubmittedMatch[1]));
      }
      const whatsappClickedMatch = pathname.match(/^\/orders\/([^/]+)\/whatsapp-clicked$/);
      if (whatsappClickedMatch && request.method === "POST") {
        return handleWhatsappClicked(request, env, decodeURIComponent(whatsappClickedMatch[1]));
      }
      const publicOrderMatch = pathname.match(/^\/orders\/([^/]+)$/);
      if (publicOrderMatch && request.method === "GET") {
        return handlePublicOrder(request, env, decodeURIComponent(publicOrderMatch[1]));
      }
      const productMatch = pathname.match(/^\/product\/([^/]+)$/);
      if (productMatch && request.method === "GET") return cachedProductByField(request, env, ctx, "slug", productMatch[1]);
      const productCodeMatch = pathname.match(/^\/product-code\/([^/]+)$/);
      if (productCodeMatch && request.method === "GET") return cachedProductByField(request, env, ctx, "product_code", productCodeMatch[1]);

      if (pathname.startsWith("/admin/") && !(await verifyAdmin(request, env))) {
        return jsonResponse(request, { error: "未授权" }, 401);
      }
      if (pathname === "/admin/products" && request.method === "GET") return handleAdminProducts(request, env);
      if (pathname === "/admin/classification/queue" && request.method === "GET") return handleClassificationQueue(request, env);
      if (pathname === "/admin/classification/summary" && request.method === "GET") return handleClassificationSummary(request, env);
      if (pathname === "/admin/classification/suggestions" && request.method === "GET") return handleClassificationSuggestions(request, env);
      if (pathname === "/admin/classification/scan-one" && request.method === "POST") return handleClassificationScanOne(request, env);
      if (pathname === "/admin/classification/scan-one-vision" && request.method === "POST") return handleVisionClassificationScanOne(request, env);
      if (pathname === "/admin/site-settings" && request.method === "PUT") return handleAdminSiteSettings(request, env);
      const adminProductMatch = pathname.match(/^\/admin\/products\/([^/]+)$/);
      if (adminProductMatch && request.method === "PATCH") return handleAdminProductUpdate(request, env, decodeURIComponent(adminProductMatch[1]));
      if (pathname === "/admin/orders" && request.method === "GET") return handleAdminOrders(request, env);
      const paymentConfirmedMatch = pathname.match(/^\/admin\/orders\/([^/]+)\/payment-confirmed$/);
      if (paymentConfirmedMatch && request.method === "PATCH") {
        return handleAdminOrderPaymentConfirmed(request, env, decodeURIComponent(paymentConfirmedMatch[1]));
      }
      const orderStatusMatch = pathname.match(/^\/admin\/orders\/([^/]+)\/status$/);
      if (orderStatusMatch && request.method === "PATCH") return handleAdminOrderStatus(request, env, decodeURIComponent(orderStatusMatch[1]));
      const orderMatch = pathname.match(/^\/admin\/orders\/([^/]+)$/);
      if (orderMatch && request.method === "GET") return handleAdminOrderDetail(request, env, decodeURIComponent(orderMatch[1]));
      if (orderMatch && request.method === "DELETE") return handleAdminOrderDelete(request, env, decodeURIComponent(orderMatch[1]));
      return jsonResponse(request, { error: "Not found" }, 404);
    } catch (error) {
      console.error(JSON.stringify({ message: "request failed", path: pathname, error: error instanceof Error ? error.message : String(error) }));
      return jsonResponse(request, { error: "Internal server error" }, 500);
    }
  },
} satisfies ExportedHandler<WorkerEnv>;

export { calculateShippingFee, catalogFiltersFromStats, catalogTotalFromStats, normalizeCatalogStats };
