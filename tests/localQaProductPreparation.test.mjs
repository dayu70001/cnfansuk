import assert from "node:assert/strict";
import test from "node:test";
import { buildLocalQaSql, normalizePublicProduct } from "../scripts/prepare-local-qa-product.mjs";

const moncler = {
  product_code: "CNF-QGSV5XA57C6E-066",
  slug: "moncler-letter-logo-pullover-space-sweatshirt-cnf-qgsv5xa57c6e-066",
  title: "Moncler Letter Logo Pullover Space Sweatshirt",
  subtitle: "Space pullover sweatshirt",
  description: "Real product description",
  category: "tops",
  subcategory: "sweatshirts",
  brand: "Moncler",
  price_gbp: 37,
  price_eur: 42,
  price_usd: 48,
  currency: "GBP",
  status: "active",
  source_url: "https://catalog.example/product",
  options: ["M", "L", "XL", "XXL"].map((option_value, index) => ({ option_name: "Size", option_value, position: index + 1 })),
};

test("local QA preparation validates exact active public product and real sizes", () => {
  const product = normalizePublicProduct(moncler, moncler.product_code);
  assert.equal(product.productCode, "CNF-QGSV5XA57C6E-066");
  assert.equal(product.priceGbp, 37);
  assert.equal(product.category, "tops");
  assert.equal(product.subcategory, "sweatshirts");
  assert.deepEqual(product.sizes, ["M", "L", "XL", "XXL"]);
  assert.throws(() => normalizePublicProduct({ ...moncler, status: "draft" }, moncler.product_code), /Only active/);
  assert.throws(() => normalizePublicProduct({ ...moncler, options: [] }, moncler.product_code), /no real size options/);
});

test("local QA SQL only upserts the requested product and its sizes, with sweatshirts allowed locally", () => {
  const sql = buildLocalQaSql(normalizePublicProduct(moncler, moncler.product_code));
  assert.doesNotMatch(sql, /BEGIN IMMEDIATE|COMMIT;/);
  assert.match(sql, /INSERT INTO products/);
  assert.match(sql, /ON CONFLICT\(product_code\) DO UPDATE/);
  assert.match(sql, /'tops' AND NEW\.subcategory IN \('t-shirts', 'hoodies', 'shirts', 'sweaters', 'sweatshirts'\)/);
  assert.match(sql, /DELETE FROM product_options\s+WHERE product_code = 'CNF-QGSV5XA57C6E-066' AND LOWER\(option_name\) = 'size'/);
  assert.match(sql, /'CNF-QGSV5XA57C6E-066', 'Size', 'XXL', 4/);
  assert.doesNotMatch(sql, /product_images|DELETE FROM orders|DROP TABLE/);
});
