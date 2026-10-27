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
vm.runInNewContext(compiledTaxonomy, {
  module: taxonomyModule,
  exports: taxonomyModule.exports,
  URL,
});
const taxonomy = taxonomyModule.exports;

test("tops taxonomy places Sweatshirts between Hoodies and Shirts", () => {
  assert.deepEqual(
    Array.from(taxonomy.catalogSubcategories.tops, (item) => `${item.value}:${item.label}`),
    [
      "t-shirts:T-Shirts",
      "hoodies:Hoodies",
      "sweatshirts:Sweatshirts",
      "shirts:Shirts",
      "sweaters:Sweaters",
    ],
  );
});

test("Sweatshirts has an independent SEO landing-page configuration", () => {
  const page = taxonomy.getCatalogSeoSubcategory("tops", "sweatshirts");
  assert.equal(page?.label, "Sweatshirts");
  assert.equal(page?.h1, "Men's Sweatshirts");
  assert.equal(page?.title, "Men's Sweatshirts UK | CNFans UK");
  assert.match(page?.description || "", /sweatshirts/i);
  assert.equal(taxonomy.catalogSeoSubcategoryPath("tops", "sweatshirts"), "/category/tops/sweatshirts");
});

test("verified Worker catalog count restores only the missing Sweatshirts filter facet", () => {
  const initialCounts = [
    { category: "tops", subcategory: "hoodies", count: 348 },
    { category: "tops", subcategory: "sweaters", count: 335 },
  ];
  const merged = taxonomy.mergeCatalogSubcategoryCount(initialCounts, "tops", "sweatshirts", 33);
  assert.deepEqual(Array.from(merged, (row) => `${row.subcategory}:${row.count}`), [
    "hoodies:348",
    "sweaters:335",
    "sweatshirts:33",
  ]);
  assert.equal(taxonomy.availableCatalogSubcategories("tops", merged).map((row) => row.value).join(","), "hoodies,sweatshirts,sweaters");
  assert.equal(taxonomy.mergeCatalogSubcategoryCount(initialCounts, "tops", "sweatshirts", 0).length, 2);
  assert.equal(
    taxonomy.mergeCatalogSubcategoryCount(
      [...initialCounts, { category: "tops", subcategory: "sweatshirts", count: 0 }],
      "tops",
      "sweatshirts",
      33,
    ).find((row) => row.subcategory === "sweatshirts")?.count,
    33,
  );
});

test("New In derives its filters from the complete 100-product New In collection", () => {
  const categoryPage = read("app/category/[slug]/page.tsx");
  assert.match(categoryPage, /collection:\s*"new-in"[^\n]+limit:\s*100/);
  assert.match(categoryPage, /collectionProducts\.some\(\(product\)\s*=>\s*product\.category\s*===\s*parent\.value\s*&&\s*product\.style\s*===\s*option\.value\)/);
  assert.match(categoryPage, /category:\s*"tops",\s*subcategory:\s*"sweatshirts",\s*page:\s*1,\s*limit:\s*1/);
});

test("direct Sweatshirts page uses exact category/subcategory catalog query and keeps pagination and sitemap rules", () => {
  const subcategoryPage = read("app/category/[slug]/[subcategory]/page.tsx");
  const generalCatalogPage = read("app/catalog/page.tsx");
  const sitemap = read("app/sitemap.ts");
  assert.match(subcategoryPage, /category:\s*slug,\s*subcategory,\s*q,\s*brand,\s*price,\s*sort,\s*page,\s*limit:\s*PAGE_SIZE/);
  assert.match(subcategoryPage, /getSubcategoryCount\(filters,\s*slug,\s*subcategory\)[\s\S]*?catalog\?\.total/);
  assert.match(subcategoryPage, /sweatshirtFacetCount\s*\?\?\s*0\)\s*<=\s*0/);
  assert.match(subcategoryPage, /getSweatshirtsCatalogCount\s*=\s*cache\(async\s*\(\)/);
  assert.equal((subcategoryPage.match(/await getSweatshirtsCatalogCount\(\)/g) || []).length, 2);
  assert.match(subcategoryPage, /sweatshirtsCount\s*>\s*0\s*\?\s*sweatshirtsCount\s*:\s*catalog\?\.total/);
  assert.match(subcategoryPage, /PAGE_SIZE\s*=\s*20/);
  assert.match(subcategoryPage, /page\s*>\s*1\s*&&\s*page\s*>\s*totalPages/);
  assert.match(generalCatalogPage, /category:\s*"tops",\s*subcategory:\s*"sweatshirts",\s*page:\s*1,\s*limit:\s*1/);
  assert.match(generalCatalogPage, /mergeCatalogSubcategoryCount\(/);
  assert.match(sitemap, /catalogSeoSubcategories/);
  assert.match(sitemap, /category:\s*item\.category,\s*subcategory:\s*item\.value,\s*page:\s*1,\s*limit:\s*1/);
  assert.match(sitemap, /count\s*>=\s*5/);
});
