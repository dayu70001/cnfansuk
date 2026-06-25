type WorkerEnv = Env & { ADMIN_TOKEN: string };
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

type OrderRow = {
  id: string;
  order_number: string;
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
  status: OrderStatus;
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

type OrderStatus = "pending" | "confirmed" | "paid" | "processing" | "shipped" | "completed" | "cancelled";
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
const ALLOWED_CATEGORIES = new Set(["outerwear", "tops", "bottoms", "co-ords-sets"]);
const ALLOWED_SUBCATEGORIES: Record<string, Set<string>> = {
  outerwear: new Set(["jackets", "hooded-jackets", "varsity-jackets", "puffer-jackets", "vests", "coats"]),
  tops: new Set(["t-shirts", "tank-tops", "hoodies", "sweatshirts", "zip-hoodies", "shirts", "knitwear"]),
  bottoms: new Set(["trousers", "joggers", "cargo-pants", "jeans", "shorts", "skirts"]),
  "co-ords-sets": new Set(["tracksuits", "hoodie-sets", "t-shirt-shorts-sets", "knit-sets", "casual-sets", "jacket-pants-sets"]),
};
const ORDER_STATUSES = new Set<OrderStatus>(["pending", "confirmed", "paid", "processing", "shipped", "completed", "cancelled"]);
const CURRENCIES = new Set<CurrencyCode>(["GBP", "EUR", "USD"]);
const SHIPPING_METHODS = {
  "royal-mail-tracked": { label: "Royal Mail Tracked", estimate: "7–12 business days", priceGbp: 5 },
  "dhl-express": { label: "DHL Express", estimate: "7–12 business days", priceGbp: 5 },
  "fedex-priority": { label: "FedEx Priority", estimate: "5–9 business days", priceGbp: 15 },
} as const;
const PAYMENT_METHODS = {
  paypal: { label: "PayPal", feeRate: 0.05 },
  "bank-transfer": { label: "Bank Transfer", feeRate: 0 },
  "crypto-payment": { label: "Crypto Payment", feeRate: 0 },
} as const;
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const FILTER_CACHE_SECONDS = 1800;
const PRODUCT_CACHE_SECONDS = 1800;
const SITEMAP_CACHE_SECONDS = 3600;

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

function orderByClause(sort: string): string {
  if (sort === "price-low-high") return "price_gbp ASC, created_at DESC, id DESC";
  if (sort === "price-high-low") return "price_gbp DESC, created_at DESC, id DESC";
  if (sort === "popular") return "sort_order ASC, created_at DESC, id DESC";
  return "created_at DESC, id DESC";
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

async function handleCatalog(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const endpoint = url.pathname.replace(/\/+$/, "") || "/catalog";
  const filters = ["status = ?"];
  const values: D1Value[] = ["active"];
  const category = cleanText(url.searchParams.get("category"), 100);
  const subcategory = cleanText(url.searchParams.get("subcategory"), 100);
  const brand = cleanText(url.searchParams.get("brand"), 100);
  const q = cleanText(url.searchParams.get("q"), 100);
  if (category) { filters.push("category = ?"); values.push(category); }
  if (subcategory) { filters.push("subcategory = ?"); values.push(subcategory); }
  if (brand) { filters.push("LOWER(brand) = LOWER(?)"); values.push(brand); }
  if (q) {
    filters.push("(title LIKE ? OR subtitle LIKE ? OR description LIKE ? OR product_code LIKE ? OR brand LIKE ?)");
    const term = `%${q}%`;
    values.push(term, term, term, term, term);
  }
  const limit = normaliseLimit(url.searchParams.get("limit"));
  const page = normalisePage(url.searchParams.get("page"));
  const offset = url.searchParams.has("offset") ? normaliseOffset(url.searchParams.get("offset")) : (page - 1) * limit;
  const countRow = await d1First<{ total: number }>(
    env,
    { endpoint, label: "catalog_count", limit, offset },
    `SELECT COUNT(*) AS total FROM products WHERE ${filters.join(" AND ")} LIMIT 1`,
    values,
  );
  const { results = [] } = await d1All<ProductRow>(
    env,
    { endpoint, label: "catalog_page", limit, offset },
    `SELECT * FROM products WHERE ${filters.join(" AND ")} ORDER BY ${orderByClause(cleanText(url.searchParams.get("sort"), 30))} LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const images = await imagesForProducts(env, endpoint, results.map((product) => product.product_code));
  const total = Number(countRow?.total || 0);
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

function productCacheKey(request: Request, field: "slug" | "product_code", value: string) {
  const url = new URL(request.url);
  url.pathname = field === "slug"
    ? `/product/${encodeURIComponent(normaliseProductLookup(value, field))}`
    : `/product-code/${encodeURIComponent(normaliseProductLookup(value, field))}`;
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

async function cachedProductByField(request: Request, env: WorkerEnv, ctx: ExecutionContext, field: "slug" | "product_code", value: string) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = productCacheKey(request, field, value);
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

async function handleFilters(request: Request, env: WorkerEnv) {
  const [{ results: categories = [] }, { results: subcategories = [] }, { results: brands = [] }] = await Promise.all([
    d1All<{ category: string; count: number }>(env, { endpoint: "/filters", label: "filters_categories" }, "SELECT category, COUNT(*) AS count FROM products WHERE status = ? AND category IS NOT NULL GROUP BY category ORDER BY category", ["active"]),
    d1All<{ category: string; subcategory: string; count: number }>(env, { endpoint: "/filters", label: "filters_subcategories" }, "SELECT subcategory, category, COUNT(*) AS count FROM products WHERE status = ? AND subcategory IS NOT NULL AND subcategory != '' GROUP BY category, subcategory ORDER BY category, subcategory", ["active"]),
    d1All<{ brand: string; count: number }>(env, { endpoint: "/filters", label: "filters_brands" }, "SELECT brand, COUNT(*) AS count FROM products WHERE status = ? AND brand IS NOT NULL AND brand != '' GROUP BY brand ORDER BY brand", ["active"]),
  ]);
  return jsonResponse(request, {
    categories: categories.map((row) => row.category),
    subcategories: subcategories.map((row) => row.subcategory),
    brands: brands.map((row) => row.brand),
    counts: { categories, subcategories, brands },
  });
}

function filtersCacheKey(request: Request) {
  const sourceUrl = new URL(request.url);
  const url = new URL(request.url);
  url.pathname = "/filters";
  url.search = "";
  const category = cleanText(sourceUrl.searchParams.get("category"), 100);
  if (category) url.searchParams.set("category", category);
  return new Request(url.toString(), { method: "GET" });
}

async function cachedFilters(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = filtersCacheKey(request);
  const cached = await cache.match(key);
  if (cached) return addResponseHeaders(cached, { "x-cnfans-cache": "HIT" });

  const response = await handleFilters(request, env);
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

function sitemapCacheKey(request: Request) {
  const sourceUrl = new URL(request.url);
  const url = new URL(request.url);
  url.pathname = "/sitemap-products";
  url.search = "";
  url.searchParams.set("page", String(normalisePage(sourceUrl.searchParams.get("page"))));
  url.searchParams.set("limit", String(normaliseLimit(sourceUrl.searchParams.get("limit"), 1000, 1000)));
  if (sourceUrl.searchParams.has("offset")) url.searchParams.set("offset", String(normaliseOffset(sourceUrl.searchParams.get("offset"))));
  return new Request(url.toString(), { method: "GET" });
}

async function cachedSitemapProducts(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
  const cache = (caches as CloudflareCacheStorage).default;
  const key = sitemapCacheKey(request);
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

function convertGbp(amount: number, currency: CurrencyCode) {
  if (currency === "EUR") return amount * 9 / 8;
  if (currency === "USD") return amount * 9 / 7;
  return amount;
}

async function handleCreateOrder(request: Request, env: WorkerEnv): Promise<Response> {
  const body = await readBoundedJson(request);
  if (!isRecord(body) || !isRecord(body.customer) || !Array.isArray(body.items)) {
    return jsonResponse(request, { error: "订单数据格式无效" }, 400);
  }
  const currencyText = cleanText(body.currency, 3).toUpperCase();
  if (!CURRENCIES.has(currencyText as CurrencyCode)) return jsonResponse(request, { error: "币种无效" }, 400);
  const currency = currencyText as CurrencyCode;
  const shippingMethodId = cleanText(body.shippingMethodId, 40) as keyof typeof SHIPPING_METHODS;
  const shippingMethod = SHIPPING_METHODS[shippingMethodId];
  if (!shippingMethod) return jsonResponse(request, { error: "配送方式无效" }, 400);
  const paymentMethodId = cleanText(body.paymentMethod, 40) as keyof typeof PAYMENT_METHODS;
  const paymentMethod = PAYMENT_METHODS[paymentMethodId];
  if (!paymentMethod) return jsonResponse(request, { error: "请选择有效的付款方式" }, 400);
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
  let subtotalGbp = 0;
  const orderItems = requestedItems.map((item) => {
    const product = productsByCode.get(item.productCode)!;
    const unitPrice = getCurrencyPrice(product, currency);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    subtotalGbp += Number(product.price_gbp) * item.quantity;
    return { item, product, unitPrice, lineTotal, imageUrl: images.get(item.productCode)?.[0]?.imageUrl || null };
  });
  const shippingFee = subtotalGbp >= 120 && shippingMethodId !== "fedex-priority"
    ? 0
    : convertGbp(shippingMethod.priceGbp, currency);
  const paymentFee = Math.round((subtotal + shippingFee) * paymentMethod.feeRate * 100) / 100;
  const finalTotal = Math.round((subtotal + shippingFee + paymentFee) * 100) / 100;
  const orderId = crypto.randomUUID();
  const orderNumber = `CNF-UK-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const statements = [
    env.DB.prepare(
      `INSERT INTO orders (
        id, order_number, customer_name, email, phone, preferred_contact, whatsapp, telegram,
        country_code, country_name, address_line1, address_line2, city, county, postcode,
        shipping_method_id, shipping_method_label, shipping_estimate, shipping_fee,
        subtotal, total, currency, payment_method, payment_fee, payment_fee_rate, final_total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      orderId, orderNumber, customerName, email, phone, cleanText(customer.preferredContact, 30),
      cleanText(customer.whatsapp, 100) || null, cleanText(customer.telegram, 100) || null,
      countryCode, countryName, addressLine1, cleanText(customer.addressLine2, 200) || null,
      city, cleanText(customer.county, 100) || null, postcode,
      shippingMethodId, shippingMethod.label, shippingMethod.estimate, shippingFee,
      subtotal, finalTotal, currency, paymentMethod.label, paymentFee, paymentMethod.feeRate, finalTotal, "pending",
    ),
    ...orderItems.map(({ item, product, unitPrice, lineTotal, imageUrl }) => env.DB.prepare(
      `INSERT INTO order_items (
        order_id, product_code, title, slug, product_url, image_url, size, color,
        quantity, unit_price, line_total, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      orderId, product.product_code, product.title, product.slug,
      `${STOREFRONT_BASE_URL}/product/${encodeURIComponent(product.slug)}`, imageUrl,
      item.size, item.color || null, item.quantity, unitPrice, lineTotal, currency,
    )),
  ];
  await env.DB.batch(statements);
  return jsonResponse(request, {
    order: {
      orderNumber, subtotal, shippingFee, paymentMethod: paymentMethod.label,
      paymentFee, paymentFeeRate: paymentMethod.feeRate, finalTotal, total: finalTotal, currency, status: "pending",
    },
  }, 201);
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
  const subcategories = Object.entries(ALLOWED_SUBCATEGORIES).flatMap(([category, values]) =>
    Array.from(values, (subcategory) => ({ category, subcategory })),
  );
  return jsonResponse(request, {
    products: results.map((product) => ({ ...mapProduct(product), images: images.get(product.product_code) ?? [] })),
    categories: Array.from(ALLOWED_CATEGORIES),
    subcategories,
  });
}

async function handleAdminProductUpdate(request: Request, env: WorkerEnv, productCode: string) {
  const body = await readBoundedJson(request);
  if (!isRecord(body)) return jsonResponse(request, { error: "商品数据无效" }, 400);
  const category = cleanText(body.category, 60);
  const subcategory = cleanText(body.subcategory, 100);
  const brand = cleanText(body.brand, 120);
  const title = cleanText(body.title, 240);
  if (!title) return jsonResponse(request, { error: "商品标题不能为空" }, 400);
  if (!ALLOWED_CATEGORIES.has(category)) return jsonResponse(request, { error: "产品分类无效" }, 400);
  if (subcategory && !ALLOWED_SUBCATEGORIES[category]?.has(subcategory)) {
    return jsonResponse(request, { error: "子类目与当前产品分类不匹配" }, 400);
  }
  const result = await d1Run(
    env,
    { endpoint: "/admin/products/:product_code", label: "admin_product_update" },
    "UPDATE products SET title = ?, category = ?, subcategory = ?, brand = ?, updated_at = CURRENT_TIMESTAMP WHERE product_code = ?",
    [title, category, subcategory || null, brand, productCode],
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

async function handleAdminOrders(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const filters: string[] = [];
  const values: D1Value[] = [];
  const q = cleanText(url.searchParams.get("q"), 100);
  const status = cleanText(url.searchParams.get("status"), 30) as OrderStatus;
  if (q) {
    filters.push("(order_number LIKE ? OR customer_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const term = `%${q}%`;
    values.push(term, term, term, term);
  }
  if (status && ORDER_STATUSES.has(status)) { filters.push("status = ?"); values.push(status); }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const limit = normaliseLimit(url.searchParams.get("limit"), 50, MAX_LIST_LIMIT);
  const { results = [] } = await d1All<OrderRow>(
    env,
    { endpoint: "/admin/orders", label: "admin_orders_page", limit, offset: 0 },
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ?`,
    [...values, limit],
  );
  return jsonResponse(request, { orders: results });
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
  return { ...order, items };
}

async function handleAdminOrderDetail(request: Request, env: WorkerEnv, orderNumber: string) {
  const order = await readOrder(env, orderNumber);
  return order ? jsonResponse(request, { order }) : jsonResponse(request, { error: "未找到订单" }, 404);
}

async function handleAdminOrderStatus(request: Request, env: WorkerEnv, orderNumber: string) {
  const body = await readBoundedJson(request);
  const status = isRecord(body) ? cleanText(body.status, 30) as OrderStatus : "pending";
  if (!ORDER_STATUSES.has(status)) return jsonResponse(request, { error: "订单状态无效" }, 400);
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
      if (pathname === "/catalog" && request.method === "GET") return handleCatalog(request, env);
      if (pathname === "/latest" && request.method === "GET") return handleCatalog(request, env);
      if (pathname === "/filters" && request.method === "GET") return cachedFilters(request, env, ctx);
      if (pathname === "/sitemap-products" && request.method === "GET") return cachedSitemapProducts(request, env, ctx);
      if (pathname === "/site-settings" && request.method === "GET") return handleSiteSettings(request, env);
      if (pathname === "/orders" && request.method === "POST") return handleCreateOrder(request, env);
      const productMatch = pathname.match(/^\/product\/([^/]+)$/);
      if (productMatch && request.method === "GET") return cachedProductByField(request, env, ctx, "slug", productMatch[1]);
      const productCodeMatch = pathname.match(/^\/product-code\/([^/]+)$/);
      if (productCodeMatch && request.method === "GET") return cachedProductByField(request, env, ctx, "product_code", productCodeMatch[1]);

      if (pathname.startsWith("/admin/") && !(await verifyAdmin(request, env))) {
        return jsonResponse(request, { error: "未授权" }, 401);
      }
      if (pathname === "/admin/products" && request.method === "GET") return handleAdminProducts(request, env);
      if (pathname === "/admin/site-settings" && request.method === "PUT") return handleAdminSiteSettings(request, env);
      const adminProductMatch = pathname.match(/^\/admin\/products\/([^/]+)$/);
      if (adminProductMatch && request.method === "PATCH") return handleAdminProductUpdate(request, env, decodeURIComponent(adminProductMatch[1]));
      if (pathname === "/admin/orders" && request.method === "GET") return handleAdminOrders(request, env);
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
