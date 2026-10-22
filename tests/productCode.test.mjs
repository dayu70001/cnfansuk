import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => fs.readFileSync(path.join(rootDirectory, ...parts), "utf8");
const catalogSource = read("lib", "catalogApi.ts");
const productSchema = read("workers", "catalog-api", "migrations", "0001_init.sql");
const workerSource = read("workers", "catalog-api", "src", "index.ts");

test("storefront Product Code comes from the persisted catalog product_code", () => {
  const mapperStart = catalogSource.indexOf("function mapCatalogProduct(");
  const mapperEnd = catalogSource.indexOf("\nfunction toFactList(", mapperStart);
  const mapper = catalogSource.slice(mapperStart, mapperEnd);

  assert.match(mapper, /const productCode = cleanText\(product\.product_code\) \|\| String\(product\.id \|\| "catalog-product"\);/);
  assert.match(mapper, /id:\s*productCode,\s*productCode,/);
  assert.doesNotMatch(mapper, /const productCode\s*=\s*.*(?:title|slug|sort_order)/);
  assert.match(productSchema, /product_code TEXT NOT NULL UNIQUE/);
});

test("catalog product edits preserve product_code instead of deriving it again from title", () => {
  const updateStart = workerSource.indexOf("async function handleAdminProductUpdate(");
  const updateEnd = workerSource.indexOf("\nfunction orderStageSql(", updateStart);
  const updateHandler = workerSource.slice(updateStart, updateEnd);
  assert.match(updateHandler, /UPDATE products SET title = \?, category = \?, subcategory = \?, brand = \?, updated_at = CURRENT_TIMESTAMP WHERE product_code = \?/);
  assert.match(updateHandler, /UPDATE products SET title = \?, brand = \?, updated_at = CURRENT_TIMESTAMP WHERE product_code = \?/);
  assert.doesNotMatch(updateHandler, /UPDATE products SET\s+product_code\s*=/);
  assert.match(updateHandler, /WHERE product_code = \?/);
});

test("separate catalog identities remain separate even when their titles match", () => {
  const repeatedTitleRows = [
    { id: 101, product_code: "CNF-REPEATED-101", title: "Same product title" },
    { id: 202, product_code: "CNF-REPEATED-202", title: "Same product title" },
  ];
  const codesByTitle = new Map();
  for (const row of repeatedTitleRows) {
    const title = row.title.toLocaleLowerCase("en");
    const codes = codesByTitle.get(title) || new Set();
    codes.add(row.product_code);
    codesByTitle.set(title, codes);
  }

  assert.equal(codesByTitle.get("same product title").size, 2);
  assert.notEqual(repeatedTitleRows[0].product_code, repeatedTitleRows[1].product_code);
});
