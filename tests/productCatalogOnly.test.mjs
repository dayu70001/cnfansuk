import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const productPageSource = fs.readFileSync(
  path.join(currentDirectory, "..", "app", "product", "[slug]", "page.tsx"),
  "utf8",
);

test("Product Page uses only the catalog lookup and sends missing products to notFound", () => {
  assert.doesNotMatch(productPageSource, /@\/data\/products|\bgetProduct\s*\(/);
  assert.match(productPageSource, /return fetchCatalogProductBySlug\(slug\);/);
  assert.match(productPageSource, /if \(!product\)\s*\{\s*notFound\(\);/);
});
