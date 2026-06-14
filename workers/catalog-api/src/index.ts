type D1Value = string | number | boolean | null;

interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface R2Bucket {}

interface Env {
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
}

interface ProductRow {
  id: number;
  product_code: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  subcategory: string | null;
  price_gbp: number;
  compare_at_price_gbp: number | null;
  currency: string;
  status: string;
  sort_order: number;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductImageRow {
  id: number;
  product_code: string;
  image_key: string;
  image_url: string | null;
  position: number;
  alt: string | null;
  created_at: string;
}

interface ProductOptionRow {
  id: number;
  product_code: string;
  option_name: string;
  option_value: string;
  position: number;
}

const SERVICE_NAME = "cnfansuk-catalog-api";
const IMAGE_BASE_URL = "https://img.cnfans.co.uk";
const ALLOWED_ORIGINS = new Set([
  "https://cnfansuk.vercel.app",
  "https://cnfans.co.uk",
  "https://www.cnfans.co.uk",
  "http://localhost:4000",
]);

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
    },
  });
}

function normaliseLimit(value: string | null): number {
  const limit = Number.parseInt(value ?? "24", 10);
  if (Number.isNaN(limit)) return 24;
  return Math.min(Math.max(limit, 1), 100);
}

function normaliseOffset(value: string | null): number {
  const offset = Number.parseInt(value ?? "0", 10);
  if (Number.isNaN(offset)) return 0;
  return Math.max(offset, 0);
}

function publicImageUrl(image: ProductImageRow): string {
  return image.image_url || `${IMAGE_BASE_URL}/${image.image_key}`;
}

function mapImage(image: ProductImageRow) {
  return {
    ...image,
    image_url: publicImageUrl(image),
  };
}

async function imagesForProducts(db: D1Database, productCodes: string[]) {
  if (productCodes.length === 0) return new Map<string, ReturnType<typeof mapImage>[]>();

  const placeholders = productCodes.map(() => "?").join(", ");
  const { results = [] } = await db
    .prepare(
      `SELECT * FROM product_images
       WHERE product_code IN (${placeholders})
       ORDER BY product_code ASC, position ASC, id ASC`,
    )
    .bind(...productCodes)
    .all<ProductImageRow>();

  const grouped = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const image of results) {
    const current = grouped.get(image.product_code) ?? [];
    current.push(mapImage(image));
    grouped.set(image.product_code, current);
  }

  return grouped;
}

async function optionsForProduct(db: D1Database, productCode: string) {
  const { results = [] } = await db
    .prepare(
      `SELECT * FROM product_options
       WHERE product_code = ?
       ORDER BY position ASC, id ASC`,
    )
    .bind(productCode)
    .all<ProductOptionRow>();

  return results;
}

async function handleCatalog(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const filters: string[] = ["status = ?"];
  const values: D1Value[] = ["active"];

  const category = url.searchParams.get("category");
  const subcategory = url.searchParams.get("subcategory");
  const q = url.searchParams.get("q");

  if (category) {
    filters.push("category = ?");
    values.push(category);
  }

  if (subcategory) {
    filters.push("subcategory = ?");
    values.push(subcategory);
  }

  if (q) {
    filters.push("(title LIKE ? OR subtitle LIKE ? OR description LIKE ? OR product_code LIKE ?)");
    const term = `%${q}%`;
    values.push(term, term, term, term);
  }

  const limit = normaliseLimit(url.searchParams.get("limit"));
  const offset = normaliseOffset(url.searchParams.get("offset"));

  const { results = [] } = await env.DB
    .prepare(
      `SELECT * FROM products
       WHERE ${filters.join(" AND ")}
       ORDER BY sort_order ASC, created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...values, limit, offset)
    .all<ProductRow>();

  const images = await imagesForProducts(
    env.DB,
    results.map((product) => product.product_code),
  );

  return jsonResponse(request, {
    products: results.map((product) => ({
      ...product,
      images: images.get(product.product_code) ?? [],
    })),
    pagination: { limit, offset },
  });
}

async function productByField(
  request: Request,
  env: Env,
  field: "slug" | "product_code",
  value: string,
): Promise<Response> {
  const product = await env.DB
    .prepare(`SELECT * FROM products WHERE status = ? AND ${field} = ? LIMIT 1`)
    .bind("active", value)
    .first<ProductRow>();

  if (!product) {
    return jsonResponse(request, { error: "Product not found" }, 404);
  }

  const images = await imagesForProducts(env.DB, [product.product_code]);
  const options = await optionsForProduct(env.DB, product.product_code);

  return jsonResponse(request, {
    product: {
      ...product,
      images: images.get(product.product_code) ?? [],
      options,
    },
  });
}

async function handleFilters(request: Request, env: Env): Promise<Response> {
  const [{ results: categories = [] }, { results: subcategories = [] }] = await Promise.all([
    env.DB
      .prepare(
        `SELECT category, COUNT(*) AS count
         FROM products
         WHERE status = ? AND category IS NOT NULL
         GROUP BY category
         ORDER BY category ASC`,
      )
      .bind("active")
      .all<{ category: string; count: number }>(),
    env.DB
      .prepare(
        `SELECT subcategory, COUNT(*) AS count
         FROM products
         WHERE status = ? AND subcategory IS NOT NULL AND subcategory != ''
         GROUP BY subcategory
         ORDER BY subcategory ASC`,
      )
      .bind("active")
      .all<{ subcategory: string; count: number }>(),
  ]);

  return jsonResponse(request, {
    categories: categories.map((row) => row.category),
    subcategories: subcategories.map((row) => row.subcategory),
    counts: {
      categories,
      subcategories,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method !== "GET") {
      return jsonResponse(request, { error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    try {
      if (pathname === "/health") {
        return jsonResponse(request, { ok: true, service: SERVICE_NAME });
      }

      if (pathname === "/catalog") {
        return handleCatalog(request, env);
      }

      if (pathname === "/filters") {
        return handleFilters(request, env);
      }

      const productMatch = pathname.match(/^\/product\/([^/]+)$/);
      if (productMatch) {
        return productByField(request, env, "slug", decodeURIComponent(productMatch[1]));
      }

      const productCodeMatch = pathname.match(/^\/product-code\/([^/]+)$/);
      if (productCodeMatch) {
        return productByField(
          request,
          env,
          "product_code",
          decodeURIComponent(productCodeMatch[1]),
        );
      }

      return jsonResponse(request, { error: "Not found" }, 404);
    } catch {
      return jsonResponse(request, { error: "Internal server error" }, 500);
    }
  },
};
