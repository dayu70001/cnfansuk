import assert from "node:assert/strict";
import test from "node:test";
import { loadWorker } from "./test-support/loadWorker.mjs";

const productCache = new Map();
globalThis.caches = { default: {
  async match(request) { return productCache.get(typeof request === "string" ? request : request.url)?.clone() || undefined; },
  async put(request, response) { productCache.set(typeof request === "string" ? request : request.url, response.clone()); },
} };
const workerModule = loadWorker();
const worker = workerModule.default ?? workerModule;
const products = [
  { id: 1, product_code: "CNF-TEST-001", slug: "classic-jacket-1", title: "Classic Jacket", category: "outerwear", subcategory: "jackets", brand: "Test", price_gbp: 45, status: "active", updated_at: "2026-11-17 10:00:00", created_at: "2026-11-01", currency: "GBP", sort_order: 1 },
  { id: 2, product_code: "CNF-TEST-002", slug: "classic-jacket-2", title: "Classic Jacket", category: "outerwear", subcategory: "jackets", brand: "Test", price_gbp: 47, status: "active", updated_at: "2026-11-17 10:01:00", created_at: "2026-11-02", currency: "GBP", sort_order: 2 },
  { id: 3, product_code: "CNF-TEST-003", slug: "classic-jacket-3", title: "CLASSIC—JACKET", category: "outerwear", subcategory: "jackets", brand: "Test", price_gbp: 46, status: "active", updated_at: "2026-11-17 10:02:00", created_at: "2026-11-03", currency: "GBP", sort_order: 3 },
  { id: 4, product_code: "CNF-TEST-004", slug: "trousers", title: "Test Trousers", category: "bottoms", subcategory: "trousers", brand: "Test", price_gbp: 38, status: "active", updated_at: "2026-11-17 10:03:00", created_at: "2026-11-04", currency: "GBP", sort_order: 4 },
  { id: 5, product_code: "CNF-TEST-005", slug: "inactive-jacket", title: "Classic Jacket", category: "outerwear", subcategory: "jackets", brand: "Test", price_gbp: 44, status: "inactive", updated_at: "2026-11-17 10:04:00", created_at: "2026-11-05", currency: "GBP", sort_order: 5 },
];
const images = products.flatMap((product) => [1, 2].map((position) => ({
  id: product.id * 10 + position,
  product_code: product.product_code,
  image_key: `products/${product.product_code}/${position}.webp`,
  image_url: `https://images.test/${product.product_code}/${position}.webp`,
  position,
  alt: product.title,
})));
const options = products.flatMap((product) => ["M", "L"].map((size, index) => ({
  id: product.id * 10 + index,
  product_code: product.product_code,
  option_name: "Size",
  option_value: size,
  position: index + 1,
})));

function makeEnv() {
  const queries = [];
  const dbProducts = products.map((product) => ({ ...product }));
  const dbImages = images.map((image) => ({ ...image }));
  const dbOptions = options.map((option) => ({ ...option }));
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async all() {
              queries.push({ sql, values, method: "all" });
              if (/SELECT id, updated_at\s+FROM products\s+WHERE status = \?/i.test(sql)) {
                const selected = dbProducts.filter((product) => product.status === values[0]).sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id);
                return { results: selected.slice(0, 1).map(({ id, updated_at }) => ({ id, updated_at })), meta: { rows_read: selected.length, rows_written: 0 } };
              }
              if (/FROM products\s+WHERE status = \? AND slug = \?/i.test(sql)) {
                const row = dbProducts.find((product) => product.status === values[0] && product.slug === values[1]);
                return { results: row ? [{ ...row }] : [], meta: { rows_read: row ? 1 : 0, rows_written: 0 } };
              }
              if (/FROM products\s+WHERE id = \?/i.test(sql)) {
                const row = dbProducts.find((product) => product.id === Number(values[0]) && product.product_code === values[1]);
                return { results: row ? [{ ...row }] : [], meta: { rows_read: 1, rows_written: 0 } };
              }
              if (/COUNT\(\*\) AS total FROM products/i.test(sql)) {
                const status = values[0];
                const term = String(values[1] || "").replaceAll("%", "").toLowerCase();
                const hasSearch = /CAST\(id AS TEXT\) LIKE/i.test(sql);
                const found = dbProducts.filter((product) => product.status === status && (!hasSearch || (String(product.id).includes(term)
                  || product.product_code.toLowerCase().includes(term)
                  || product.title.toLowerCase().includes(term)
                  || product.brand.toLowerCase().includes(term))));
                return { results: [{ total: found.length }], meta: { rows_read: found.length, rows_written: 0 } };
              }
              if (/FROM products\s+WHERE status = \?.*ORDER BY updated_at DESC, id DESC LIMIT \? OFFSET \?/i.test(sql)) {
                let selected = dbProducts.filter((product) => product.status === values[0]);
                if (/CAST\(id AS TEXT\) LIKE/i.test(sql)) {
                  const term = String(values[1] || "").replaceAll("%", "").toLowerCase();
                  selected = selected.filter((product) => String(product.id).includes(term)
                    || product.product_code.toLowerCase().includes(term)
                    || product.title.toLowerCase().includes(term)
                    || product.brand.toLowerCase().includes(term));
                }
                const limit = Number(values.at(-2));
                const offset = Number(values.at(-1));
                return { results: selected.slice(offset, offset + limit).map((row) => ({ ...row })), meta: { rows_read: selected.length, rows_written: 0 } };
              }
              if (/FROM products(?:\s+WHERE status = \?)?\s+ORDER BY id/i.test(sql)) {
                const selected = sql.includes("WHERE status = ?") ? dbProducts.filter((product) => product.status === values[0]) : dbProducts;
                return { results: selected.map((row) => ({ ...row })), meta: { rows_read: selected.length, rows_written: 0 } };
              }
              if (/FROM products\s+WHERE status = \?/i.test(sql)) {
                let rows = dbProducts.filter((product) => product.status === values[0]);
                const queryValues = values.slice(1);
                if (queryValues.length) {
                  const term = String(queryValues[0]).replaceAll("%", "").toLowerCase();
                  rows = rows.filter((product) => String(product.id).includes(term)
                    || product.product_code.toLowerCase().includes(term)
                    || product.title.toLowerCase().includes(term)
                    || product.brand.toLowerCase().includes(term));
                }
                const limit = Number(values.at(-2));
                const offset = Number(values.at(-1));
                return { results: rows.slice(offset, offset + limit).map((row) => ({ ...row })), meta: { rows_read: rows.length, rows_written: 0 } };
              }
              if (/FROM product_images/i.test(sql)) {
                const codes = new Set(values.map(String));
                return { results: dbImages.filter((image) => codes.has(image.product_code)), meta: { rows_read: codes.size, rows_written: 0 } };
              }
              if (/FROM product_options/i.test(sql)) {
                const codes = new Set(values.map(String));
                return { results: dbOptions.filter((option) => codes.has(option.product_code)), meta: { rows_read: codes.size, rows_written: 0 } };
              }
              throw new Error(`Unexpected read query: ${sql}`);
            },
            async run() {
              queries.push({ sql, values, method: "run" });
              const isTitleUpdate = /SET title = \?/i.test(sql);
              const id = Number(isTitleUpdate ? values[1] : values[0]);
              const code = String(isTitleUpdate ? values[2] : values[1]);
              const expectedTitle = String(isTitleUpdate ? values[3] : values[2]);
              const expectedUpdatedAt = String(isTitleUpdate ? values[4] : values[3]);
              const product = dbProducts.find((row) => row.id === id && row.product_code === code);
              if (!product || product.title !== expectedTitle || product.updated_at !== expectedUpdatedAt) return { meta: { changes: 0, rows_written: 0 } };
              if (isTitleUpdate) product.title = values[0];
              else if (/SET status = 'inactive'/i.test(sql) && product.status === "active") product.status = "inactive";
              else if (/SET status = 'active'/i.test(sql) && product.status === "inactive") product.status = "active";
              else return { meta: { changes: 0, rows_written: 0 } };
              product.updated_at = "2026-11-17 10:10:00.123";
              return { meta: { changes: 1, rows_written: 1 } };
            },
          };
        },
      };
    },
  };
  return { env: { DB: db, ADMIN_TOKEN: "test-admin-token" }, queries, products: dbProducts, images: dbImages, options: dbOptions };
}

function adminRequest(path, init = {}, token = "test-admin-token") {
  return new Request(`https://worker.test${path}`, {
    ...init,
    headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

test("duplicate groups use all active rows by default and preserve title format differences", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(adminRequest("/admin/products/duplicates"), env, {});
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.totalProducts, 4);
  assert.equal(result.duplicateGroupCount, 1);
  assert.equal(result.exactDuplicateGroupCount, 1);
  assert.equal(result.normalizedVariantGroupCount, 1);
  assert.equal(result.affectedProductCount, 3);
  assert.equal(result.groups[0].count, 3);
  assert.deepEqual(Array.from(result.groups[0].rawTitles), ["Classic Jacket", "CLASSIC—JACKET"]);
  assert.ok(!JSON.stringify(result).includes("inactive-jacket"));
});

test("all-status duplicate grouping and item pagination return complete group metadata", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(adminRequest("/admin/products/duplicates?status=all"), env, {});
  const result = await response.json();
  assert.equal(result.totalProducts, 5);
  assert.equal(result.groups[0].count, 4);

  const detailResponse = await worker.fetch(adminRequest(`/admin/products/duplicate-items?status=all&key=${encodeURIComponent("classic jacket")}&page=2&limit=2`), env, {});
  const detail = await detailResponse.json();
  assert.equal(detail.total, 4);
  assert.equal(detail.totalPages, 2);
  assert.equal(detail.products.length, 2);
  assert.equal(detail.products[0].images.length, 2);
  assert.equal(detail.products[0].options.length, 2);
});

test("duplicate group search finds a group by any member ID or product code", async () => {
  const { env } = makeEnv();
  const byId = await worker.fetch(adminRequest("/admin/products/duplicates?q=3"), env, {});
  const byCode = await worker.fetch(adminRequest("/admin/products/duplicates?q=CNF-TEST-002"), env, {});
  const byIdResult = await byId.json();
  const byCodeResult = await byCode.json();
  assert.equal(byIdResult.groups[0].count, 3);
  assert.equal(byIdResult.filteredGroupCount, 1);
  assert.equal(byCodeResult.groups[0].count, 3);
  assert.equal(byCodeResult.filteredGroupCount, 1);

  const punctuationOnly = await worker.fetch(adminRequest("/admin/products/duplicates?q=%21"), env, {});
  assert.equal((await punctuationOnly.json()).groups.length, 0);
});

test("admin product search paginates every matching result by title, ID or code", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(adminRequest("/admin/products?q=CNF-TEST-00&status=active&page=1&limit=2"), env, {});
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.total, 4);
  assert.equal(result.products.length, 2);
  assert.equal(result.totalPages, 2);
  assert.equal(result.products[0].images.length, 2);
  assert.equal(result.products[0].options.length, 2);
});

test("all-products view returns active products by default and paginates without a search term", async () => {
  const { env } = makeEnv();
  const response = await worker.fetch(adminRequest("/admin/products?page=1&limit=2"), env, {});
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.total, 4);
  assert.equal(result.products.length, 2);
  assert.equal(result.totalPages, 2);
  assert.equal(result.products[0].status, "active");
  const secondPage = await worker.fetch(adminRequest("/admin/products?page=2&limit=2"), env, {});
  assert.equal((await secondPage.json()).products.length, 2);
});

test("title update is scoped to one ID and rejects stale edits", async () => {
  const { env, queries, products: dbProducts } = makeEnv();
  const response = await worker.fetch(adminRequest("/admin/products/by-id/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-001", expectedTitle: "Classic Jacket", expectedUpdatedAt: dbProducts[0].updated_at, title: "Classic Coat" }),
  }), env, {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).product.title, "Classic Coat");
  assert.equal(dbProducts[1].title, "Classic Jacket");
  assert.ok(queries.some((query) => query.method === "run" && /WHERE id = \? AND product_code = \? AND title = \? AND updated_at = \?/i.test(query.sql)));

  const stale = await worker.fetch(adminRequest("/admin/products/by-id/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-001", expectedTitle: "Classic Jacket", expectedUpdatedAt: "stale", title: "Should Not Save" }),
  }), env, {});
  assert.equal(stale.status, 409);
});

test("delete only soft-unpublishes the confirmed ID and leaves related product records intact", async () => {
  const { env, queries, products: dbProducts, images: dbImages, options: dbOptions } = makeEnv();
  const imageCountBefore = dbImages.length;
  const optionsCountBefore = dbOptions.length;
  const response = await worker.fetch(adminRequest("/admin/products/by-id/2", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-002", expectedTitle: "Classic Jacket", expectedUpdatedAt: dbProducts[1].updated_at }),
  }), env, {});
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.softDeleted, true);
  assert.equal(result.product.id, 2);
  assert.equal(dbProducts[1].status, "inactive");
  assert.equal(dbProducts[0].status, "active");
  assert.equal(dbProducts[2].status, "active");
  assert.equal(dbImages.length, imageCountBefore);
  assert.equal(dbOptions.length, optionsCountBefore);
  assert.ok(queries.some((query) => query.method === "run" && /SET status = 'inactive'/i.test(query.sql)));
  assert.ok(!queries.some((query) => query.method === "run" && /DELETE FROM (products|product_images|product_options)/i.test(query.sql)));
});

test("undo delete restores only the specified inactive product and rejects stale versions", async () => {
  const { env, products: dbProducts } = makeEnv();
  const deleted = await worker.fetch(adminRequest("/admin/products/by-id/2", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-002", expectedTitle: "Classic Jacket", expectedUpdatedAt: dbProducts[1].updated_at }),
  }), env, {});
  const deletedResult = await deleted.json();
  assert.equal(deleted.status, 200);

  const restore = await worker.fetch(adminRequest("/admin/products/by-id/2/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-002", expectedTitle: "Classic Jacket", expectedUpdatedAt: deletedResult.product.updated_at }),
  }), env, {});
  const restoredResult = await restore.json();
  assert.equal(restore.status, 200);
  assert.equal(restoredResult.restored, true);
  assert.equal(dbProducts[1].status, "active");
  assert.equal(dbProducts[0].status, "active");

  const stale = await worker.fetch(adminRequest("/admin/products/by-id/2/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-002", expectedTitle: "Classic Jacket", expectedUpdatedAt: deletedResult.product.updated_at }),
  }), env, {});
  assert.equal(stale.status, 409);
});

test("soft delete hides the product from public detail reads and restore makes it readable again", async () => {
  productCache.clear();
  const { env, products: dbProducts } = makeEnv();
  const context = { waitUntil(promise) { void promise; } };
  const before = await worker.fetch(adminRequest("/product/classic-jacket-2"), env, context);
  assert.equal(before.status, 200);

  const deleted = await worker.fetch(adminRequest("/admin/products/by-id/2", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-002", expectedTitle: dbProducts[1].title, expectedUpdatedAt: dbProducts[1].updated_at }),
  }), env, context);
  const deletedResult = await deleted.json();
  assert.equal(deleted.status, 200);
  const hidden = await worker.fetch(adminRequest("/product/classic-jacket-2"), env, context);
  assert.equal(hidden.status, 404);

  const restored = await worker.fetch(adminRequest("/admin/products/by-id/2/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode: "CNF-TEST-002", expectedTitle: deletedResult.product.title, expectedUpdatedAt: deletedResult.product.updated_at }),
  }), env, context);
  assert.equal(restored.status, 200);
  const visibleAgain = await worker.fetch(adminRequest("/product/classic-jacket-2"), env, context);
  assert.equal(visibleAgain.status, 200);
});

test("duplicate and product write endpoints remain protected by Worker admin auth", async () => {
  const { env, queries } = makeEnv();
  const response = await worker.fetch(adminRequest("/admin/products/duplicates", {}, ""), env, {});
  assert.equal(response.status, 401);
  const updateResponse = await worker.fetch(adminRequest("/admin/products/by-id/1", { method: "DELETE", body: "{}" }, ""), env, {});
  assert.equal(updateResponse.status, 401);
  assert.equal(queries.length, 0);
});
