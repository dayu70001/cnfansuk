import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerDirectory = path.join(projectRoot, "workers/catalog-api");
const localPersistDirectory = path.join(workerDirectory, ".wrangler/local-order-qa-state");
const publicCatalogBase = "https://cnfansuk-catalog-api.dayu70001.workers.dev";

export function normalizePublicProduct(product, requestedProductCode) {
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    throw new Error("The public catalog returned an invalid product record.");
  }

  const productCode = String(product.product_code ?? product.productCode ?? "").trim();
  if (productCode.toUpperCase() !== requestedProductCode.toUpperCase()) {
    throw new Error("The public catalog did not return the requested product code.");
  }
  if (String(product.status ?? "").toLowerCase() !== "active") {
    throw new Error("Only active public products can be prepared for local QA.");
  }

  const priceGbp = Number(product.price_gbp ?? product.priceGbp);
  if (!Number.isFinite(priceGbp) || priceGbp <= 0) {
    throw new Error("The public catalog product has no valid GBP price.");
  }

  const sizes = Array.isArray(product.options)
    ? product.options
      .filter((option) => option && typeof option === "object"
        && String(option.option_name ?? option.name ?? "").toLowerCase() === "size")
      .map((option) => String(option.option_value ?? option.value ?? "").trim())
      .filter(Boolean)
    : [];
  if (sizes.length === 0) throw new Error("The public catalog product has no real size options.");

  const category = String(product.category ?? "").trim();
  const subcategory = String(product.subcategory ?? "").trim();
  if (!category || !subcategory) throw new Error("The public catalog product has no classification.");

  return {
    productCode,
    slug: requiredText(product.slug, "slug"),
    title: requiredText(product.title, "title"),
    subtitle: nullableText(product.subtitle),
    description: nullableText(product.description),
    category,
    subcategory,
    brand: String(product.brand ?? ""),
    priceGbp,
    priceEur: nullableMoney(product.price_eur ?? product.priceEur),
    priceUsd: nullableMoney(product.price_usd ?? product.priceUsd),
    currency: String(product.currency ?? "GBP"),
    status: "active",
    sourceUrl: nullableText(product.source_url ?? product.sourceUrl),
    sizes: [...new Set(sizes)],
  };
}

export function buildLocalQaSql(product) {
  const sizeRows = product.sizes.map((size, index) => `
INSERT INTO product_options (product_code, option_name, option_value, position)
VALUES (${sqlText(product.productCode)}, 'Size', ${sqlText(size)}, ${index + 1});`).join("");

  return `-- This local-only trigger update mirrors the approved category pair and adds
-- the live tops/sweatshirts pair without touching any production migration.
DROP TRIGGER IF EXISTS products_classification_insert;
DROP TRIGGER IF EXISTS products_classification_update;

CREATE TRIGGER products_classification_insert
BEFORE INSERT ON products
WHEN NOT (
  NEW.category IN ('outerwear', 'tops', 'bottoms', 'co-ords-sets')
  AND (
    NEW.subcategory IS NULL
    OR (NEW.category = 'outerwear' AND NEW.subcategory IN ('jackets', 'puffers', 'coats', 'gilets'))
    OR (NEW.category = 'tops' AND NEW.subcategory IN ('t-shirts', 'hoodies', 'shirts', 'sweaters', 'sweatshirts'))
    OR (NEW.category = 'bottoms' AND NEW.subcategory IN ('jeans', 'trousers', 'shorts'))
    OR (NEW.category = 'co-ords-sets' AND NEW.subcategory IN ('shorts-sets', 'trouser-sets'))
  )
)
BEGIN
  SELECT RAISE(ABORT, 'Invalid category/subcategory pair');
END;

CREATE TRIGGER products_classification_update
BEFORE UPDATE OF category, subcategory ON products
WHEN (NEW.category IS NOT OLD.category OR NEW.subcategory IS NOT OLD.subcategory)
AND NOT (
  NEW.category IN ('outerwear', 'tops', 'bottoms', 'co-ords-sets')
  AND (
    NEW.subcategory IS NULL
    OR (NEW.category = 'outerwear' AND NEW.subcategory IN ('jackets', 'puffers', 'coats', 'gilets'))
    OR (NEW.category = 'tops' AND NEW.subcategory IN ('t-shirts', 'hoodies', 'shirts', 'sweaters', 'sweatshirts'))
    OR (NEW.category = 'bottoms' AND NEW.subcategory IN ('jeans', 'trousers', 'shorts'))
    OR (NEW.category = 'co-ords-sets' AND NEW.subcategory IN ('shorts-sets', 'trouser-sets'))
  )
)
BEGIN
  SELECT RAISE(ABORT, 'Invalid category/subcategory pair');
END;

INSERT INTO products (
  product_code, slug, title, subtitle, description, category, subcategory,
  brand, price_gbp, price_eur, price_usd, currency, status, source_url
) VALUES (
  ${sqlText(product.productCode)}, ${sqlText(product.slug)}, ${sqlText(product.title)},
  ${sqlText(product.subtitle)}, ${sqlText(product.description)}, ${sqlText(product.category)},
  ${sqlText(product.subcategory)}, ${sqlText(product.brand)}, ${product.priceGbp},
  ${sqlNumber(product.priceEur)}, ${sqlNumber(product.priceUsd)}, ${sqlText(product.currency)},
  ${sqlText(product.status)}, ${sqlText(product.sourceUrl)}
)
ON CONFLICT(product_code) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  category = excluded.category,
  subcategory = excluded.subcategory,
  brand = excluded.brand,
  price_gbp = excluded.price_gbp,
  price_eur = excluded.price_eur,
  price_usd = excluded.price_usd,
  currency = excluded.currency,
  status = excluded.status,
  source_url = excluded.source_url,
  updated_at = CURRENT_TIMESTAMP;

DELETE FROM product_options
WHERE product_code = ${sqlText(product.productCode)} AND LOWER(option_name) = 'size';
${sizeRows}
`;
}

async function prepareProduct(productCode) {
  if (!/^CNF-[A-Z0-9-]{5,100}$/i.test(productCode)) {
    throw new Error("Pass one explicit CNF product code, for example CNF-QGSV5XA57C6E-066.");
  }

  const response = await fetch(`${publicCatalogBase}/product-code/${encodeURIComponent(productCode)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Public catalog read failed with HTTP ${response.status}.`);
  const result = await response.json();
  const product = normalizePublicProduct(result?.product, productCode);
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), "cnfans-local-qa-product-"));
  const sqlFile = path.join(tempDirectory, "prepare-local-qa-product.sql");

  try {
    writeFileSync(sqlFile, buildLocalQaSql(product), { encoding: "utf8", mode: 0o600 });
    const run = spawnSync("npx", [
      "--yes",
      "wrangler@4.156.0",
      "d1",
      "execute",
      "cnfansuk-db",
      "--local",
      "--persist-to",
      localPersistDirectory,
      "--file",
      sqlFile,
    ], { cwd: workerDirectory, encoding: "utf8", maxBuffer: 2_000_000 });

    if (run.error) throw run.error;
    if (run.status !== 0) {
      throw new Error(`Local D1 preparation failed. ${String(run.stderr || run.stdout || "").trim()}`);
    }
    process.stdout.write(`Prepared ${product.productCode} (${product.title}) in the isolated local D1.\n`);
    process.stdout.write(`Real GBP price: £${product.priceGbp}; sizes: ${product.sizes.join(" / ")}.\n`);
    process.stdout.write(`Persistent local D1 directory: ${localPersistDirectory}\n`);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

function requiredText(value, name) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`The public catalog product is missing ${name}.`);
  return text;
}

function nullableText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function nullableMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error("The public catalog returned an invalid currency price.");
  return number;
}

function sqlText(value) {
  if (value === null || value === undefined) return "NULL";
  const text = String(value);
  if (text.includes("\u0000")) throw new Error("The public catalog returned unsupported text data.");
  return `'${text.replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  return value === null || value === undefined ? "NULL" : String(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const productCode = process.argv[2];
  if (process.argv.length !== 3) {
    process.stderr.write("Usage: node scripts/prepare-local-qa-product.mjs <one-product-code>\n");
    process.exitCode = 2;
  } else {
    prepareProduct(productCode).catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : "Local QA product preparation failed."}\n`);
      process.exitCode = 1;
    });
  }
}
