import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectTypeScript } from "../workers/catalog-api/src/test-support/loadWorker.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const duplicates = loadProjectTypeScript(path.join(root, "lib/productDuplicates.ts"));

test("product title normalization ignores case, repeated whitespace and punctuation only", () => {
  assert.equal(duplicates.normalizeProductTitle("  Moncler  Hooded Down Jacket "), "moncler hooded down jacket");
  assert.equal(duplicates.normalizeProductTitle("MONCLER Hooded—Down Jacket"), "moncler hooded down jacket");
  assert.notEqual(duplicates.normalizeProductTitle("Moncler Black Hooded Down Jacket"), duplicates.normalizeProductTitle("Moncler Hooded Down Jacket"));
  assert.notEqual(duplicates.normalizeProductTitle("Moncler 2025 Hooded Down Jacket"), duplicates.normalizeProductTitle("Moncler 2026 Hooded Down Jacket"));
  assert.notEqual(duplicates.normalizeProductTitle("Wool Jacket"), duplicates.normalizeProductTitle("Leather Jacket"));
});

test("duplicate groups merge formatting variants, preserve raw variants and sort largest first", () => {
  const products = [
    { id: 1, product_code: "A", title: "Gucci Logo Sweatshirt" },
    { id: 2, product_code: "B", title: "Gucci Logo Sweatshirt" },
    { id: 3, product_code: "C", title: "GUCCI Logo—Sweatshirt" },
    { id: 4, product_code: "D", title: "Prada Jacket" },
    { id: 5, product_code: "E", title: "Prada Jacket" },
    { id: 6, product_code: "F", title: "Prada Leather Jacket" },
  ];
  const groups = duplicates.buildDuplicateTitleGroups(products);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].count, 3);
  assert.equal(groups[0].kind, "normalized");
  assert.equal(groups[0].rawTitles.length, 2);
  assert.deepEqual(Array.from(groups[0].productIds), [1, 2, 3]);
  assert.equal(groups[1].kind, "exact");
  assert.equal(duplicates.countExactTitleGroups(products), 2);
});

test("admin product gallery gives a readable fallback when an image fails to load", () => {
  const component = fs.readFileSync(path.join(root, "components/ProductDuplicateManager.tsx"), "utf8");
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
  assert.match(component, /function ManagedProductImage\([\s\S]*?onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(component, /failed \? "图片加载失败" : "暂无图片"/);
  assert.match(css, /\.admin-duplicate-image-fallback\s*\{/);
});
