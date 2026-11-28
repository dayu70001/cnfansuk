import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationSource = fs.readFileSync(path.join(root, "lib/firstPartyCatalogueValidation.ts"), "utf8");
const catalogApiSource = fs.readFileSync(path.join(root, "lib/catalogApi.ts"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "lib/firstPartyData.ts"), "utf8");
const componentSource = fs.readFileSync(path.join(root, "components/FirstPartyCatalogueSnapshot.tsx"), "utf8");

const compiled = ts.transpileModule(validationSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const validationModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const { validateFirstPartyCatalogueState } = validationModule;

const nonEmptyFilters = {
  categories: ["tops"],
  subcategories: ["hoodies"],
  brands: [],
  counts: {
    categories: [{ category: "tops", count: 4 }],
    subcategories: [{ category: "tops", subcategory: "hoodies", count: 4 }],
    brands: [],
  },
};

const nonEmptyPage = {
  products: [{ id: "CNF-1", slug: "example-hoodie" }],
  total: 4,
  page: 1,
  limit: 1,
  totalPages: 4,
};

test("a consistent non-empty public catalogue reports its cross-checked total", () => {
  assert.equal(validateFirstPartyCatalogueState(nonEmptyFilters, nonEmptyPage), 4);
});

test("a complete empty catalogue is distinct from an unavailable response", () => {
  const emptyFilters = {
    categories: [], subcategories: [], brands: [],
    counts: { categories: [], subcategories: [], brands: [] },
  };
  const emptyPage = { products: [], total: 0, page: 1, limit: 1, totalPages: 0 };
  assert.equal(validateFirstPartyCatalogueState(emptyFilters, emptyPage), 0);
  assert.equal(validateFirstPartyCatalogueState(null, emptyPage), null);
  assert.equal(validateFirstPartyCatalogueState(emptyFilters, null), null);
});

test("a partial or inconsistent catalogue snapshot is rejected instead of shown as zero", () => {
  assert.equal(validateFirstPartyCatalogueState({ ...nonEmptyFilters, counts: { categories: [], subcategories: [], brands: [] } }, nonEmptyPage), null);
  assert.equal(validateFirstPartyCatalogueState(nonEmptyFilters, { ...nonEmptyPage, total: 5, totalPages: 5 }), null);
  assert.equal(validateFirstPartyCatalogueState(nonEmptyFilters, { ...nonEmptyPage, products: [] }), null);
  assert.equal(validateFirstPartyCatalogueState({ ...nonEmptyFilters, categories: ["tops", "bottoms"] }, nonEmptyPage), null);
});

test("catalogue page parsing does not turn a malformed Worker response into an empty catalogue", () => {
  assert.match(catalogApiSource, /if \(!response \|\| !Array\.isArray\(catalogItems\)\) return null/);
  assert.match(dataSource, /fetchCatalogPage\(\{ sort: "newest", page: 1, limit: 1 \}/);
  assert.match(componentSource, /Live catalogue figures are temporarily unavailable, so a product count is not shown/);
  assert.match(componentSource, /There are currently no active product listings in the catalogue/);
});
