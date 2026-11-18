import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadProjectTypeScript } from "../workers/catalog-api/src/test-support/loadWorker.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const invalidated = [];
const routeModule = loadProjectTypeScript(path.join(root, "app/api/admin/[...path]/route.ts"), {
  "next/server": {
    NextResponse: class extends Response {
      static json(body, init = {}) { return Response.json(body, init); }
    },
  },
  "next/cache": { revalidatePath: (route) => invalidated.push(route) },
  "@/lib/adminAuth": {
    getAdminWorkerToken: () => "test-worker-token",
    isAdminAuthenticated: async () => true,
  },
  "@/lib/catalogApiBase": { getCatalogApiBase: () => "http://127.0.0.1:8788" },
});

test("successful title, remove and restore writes invalidate storefront, category, product and sitemap caches", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return Response.json({ product: { id: 17, slug: "current-product-slug" }, softDeleted: true });
  };
  try {
    for (const operation of [
      { method: "PATCH", path: ["products", "by-id", "17"] },
      { method: "DELETE", path: ["products", "by-id", "17"] },
      { method: "POST", path: ["products", "by-id", "17", "restore"] },
    ]) {
      const response = await routeModule[operation.method](new Request(`https://site.test/api/admin/${operation.path.join("/")}`, { method: operation.method, body: "{}" }), {
        params: Promise.resolve({ path: operation.path }),
      });
      assert.equal(response.status, 200);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(requests.length, 3);
  assert.equal(requests[0].url, "http://127.0.0.1:8788/admin/products/by-id/17");
  assert.match(requests[0].init.headers.Authorization, /^Bearer /);
  for (const path of ["/product/current-product-slug", "/", "/catalog", "/category/[slug]", "/category/[slug]/[subcategory]", "/sitemap.xml"]) {
    assert.ok(invalidated.includes(path), `expected cache invalidation for ${path}`);
  }
});

test("failed product writes do not invalidate storefront paths", async () => {
  const originalFetch = globalThis.fetch;
  invalidated.length = 0;
  globalThis.fetch = async () => Response.json({ error: "conflict" }, { status: 409 });
  try {
    const response = await routeModule.PATCH(new Request("https://site.test/api/admin/products/by-id/17", { method: "PATCH", body: "{}" }), {
      params: Promise.resolve({ path: ["products", "by-id", "17"] }),
    });
    assert.equal(response.status, 409);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(invalidated.length, 0);
});
