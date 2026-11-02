import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const taxonomySource = read("lib/catalogTaxonomy.ts");
const compiledTaxonomy = ts.transpile(taxonomySource, { module: ts.ModuleKind.CommonJS });
const taxonomyModule = { exports: {} };
vm.runInNewContext(compiledTaxonomy, { module: taxonomyModule, exports: taxonomyModule.exports });
const compiledLabel = ts.transpile(read("lib/productCategoryLabel.ts"), { module: ts.ModuleKind.CommonJS });
const labelModule = { exports: {} };
vm.runInNewContext(compiledLabel, {
  module: labelModule,
  exports: labelModule.exports,
  require: (name) => {
    assert.equal(name, "@/lib/catalogTaxonomy");
    return taxonomyModule.exports;
  },
});
const { getProductCategoryLabel } = labelModule.exports;

test("product detail label uses only validated taxonomy pairs", () => {
  const pairs = [
    ["tops", "t-shirts", "TOPS / T-SHIRTS"],
    ["tops", "hoodies", "TOPS / HOODIES"],
    ["tops", "sweatshirts", "TOPS / SWEATSHIRTS"],
    ["tops", "shirts", "TOPS / SHIRTS"],
    ["tops", "sweaters", "TOPS / SWEATERS"],
    ["outerwear", "jackets", "OUTERWEAR / JACKETS"],
    ["outerwear", "puffers", "OUTERWEAR / PUFFERS"],
    ["outerwear", "coats", "OUTERWEAR / COATS"],
    ["outerwear", "gilets", "OUTERWEAR / GILETS"],
    ["bottoms", "jeans", "BOTTOMS / JEANS"],
    ["bottoms", "trousers", "BOTTOMS / TROUSERS"],
    ["bottoms", "shorts", "BOTTOMS / SHORTS"],
    ["co-ords-sets", "shorts-sets", "CO-ORDS & SETS / SHORTS SETS"],
    ["co-ords-sets", "trouser-sets", "CO-ORDS & SETS / TROUSER SETS"],
  ];
  for (const [category, subcategory, expected] of pairs) {
    assert.equal(getProductCategoryLabel(category, subcategory), expected);
  }
});

test("missing, unknown, duplicate, or conflicting subcategories fall back to the parent", () => {
  assert.equal(getProductCategoryLabel("tops", ""), "TOPS");
  assert.equal(getProductCategoryLabel("tops", "not-a-real-type"), "TOPS");
  assert.equal(getProductCategoryLabel("tops", "puffers"), "TOPS");
  assert.equal(getProductCategoryLabel("tops", "tops"), "TOPS");
  assert.equal(getProductCategoryLabel("uncategorised", "t-shirts"), "UNCATEGORISED");
  assert.equal(getProductCategoryLabel("", "t-shirts"), "");
});

test("product detail keeps the category label in its existing eyebrow position above the H1", () => {
  const component = read("components/ProductDetailClient.tsx");
  assert.match(component, /<p className="eyebrow">\{getProductCategoryLabel\(product\.category, product\.style\)\}<\/p>\s*<h1>\{product\.name\}<\/h1>/);
  assert.match(component, /import \{ getProductCategoryLabel \} from "@\/lib\/productCategoryLabel"/);
});
