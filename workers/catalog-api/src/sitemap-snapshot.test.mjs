import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { loadWorker } from "./test-support/loadWorker.mjs";
import { loadProjectTypeScript } from "./test-support/loadWorker.mjs";

const projectRoot = new URL("../../../", import.meta.url).pathname;
const require = createRequire(import.meta.url);
const snapshotModule = loadProjectTypeScript(`${projectRoot}/lib/sitemapSnapshot.ts`);
const { createSitemapCatalogSnapshot } = snapshotModule;
const manifestHash = "a".repeat(64);
const workerMocks = { "node:crypto": require("node:crypto") };
const workerModule = loadWorker(workerMocks);
const worker = workerModule.default ?? workerModule;
const SITEMAP_SNAPSHOT_KEY = "__cnfans/system/sitemap/catalog-snapshot-v1.json";

function makeEnv(rows, { failD1 = false, incomplete = false, failPut = false, forceConflict = false, conflictValue } = {}) {
  const state = { rows: [...rows], queries: 0, writes: 0, putCalls: 0, objects: new Map(), failD1, incomplete, failPut, forceConflict, conflictValue, queryOverrides: [] };
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async all() {
              state.queries += 1;
              assert.match(sql, /COUNT\(\*\).*FROM products/i);
              assert.match(sql, /LEFT JOIN products/);
              assert.deepEqual(values, ["active", "active"]);
              if (state.failD1) throw new Error("fixture_d1_error");
              const override = state.queryOverrides.shift();
              if (override) return { results: override };
              const active = state.rows.filter((row) => row.status === "active");
              if (active.length === 0) {
                return { results: [{ active_count: 0, id: null, slug: null, updated_at: null, created_at: null, category: null, subcategory: null }] };
              }
              const selected = state.incomplete ? active.slice(1) : active;
              return { results: selected.map((row) => ({
                active_count: active.length,
                id: row.id,
                slug: row.slug,
                updated_at: row.updated_at,
                created_at: row.created_at,
                category: row.category,
                subcategory: row.subcategory,
              })) };
            },
          };
        },
      };
    },
  };
  const PRODUCT_IMAGES = {
    async get(key) {
      const stored = state.objects.get(key);
      if (!stored) return null;
      return {
        etag: stored.etag,
        size: Buffer.byteLength(stored.value),
        async text() { return stored.value; },
      };
    },
    async put(key, value, options = {}) {
      state.putCalls += 1;
      const current = state.objects.get(key);
      const conditional = options.onlyIf || {};
      if (state.failPut) throw new Error("fixture_r2_write_error");
      if (state.forceConflict) {
        if (state.conflictValue) state.objects.set(key, { value: state.conflictValue, etag: "concurrent-object-etag" });
        return null;
      }
      if (conditional.etagMatches && current?.etag !== conditional.etagMatches) return null;
      if (conditional.etagDoesNotMatch === "*" && current) return null;
      state.writes += 1;
      const etag = `etag-${state.writes}`;
      state.objects.set(key, { value: String(value), etag });
      return { etag };
    },
  };
  return { env: { DB, PRODUCT_IMAGES }, state };
}

function product(id, slug = `item-${id}`, status = "active") {
  return {
    id,
    slug,
    status,
    updated_at: "2026-11-26 12:00:00",
    created_at: "2026-11-20 12:00:00",
    category: "tops",
    subcategory: "sweaters",
  };
}

const getSnapshot = (env, ctx = {}, manifest = manifestHash) => worker.fetch(new Request(`https://worker.test/sitemap-snapshot?manifest=${manifest}`), env, ctx);

test("sitemap snapshot reads all rows in one D1 statement and stores an R2 LKG", async () => {
  const rows = Array.from({ length: 1201 }, (_, index) => product(index + 1));
  const { env, state } = makeEnv(rows);
  const response = await getSnapshot(env);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.delivery, "fresh");
  assert.equal(payload.totalCount, 1201);
  assert.equal(payload.products.length, 1201);
  assert.equal(state.queries, 1);
  assert.equal(state.writes, 1);
  assert.equal(state.objects.size, 1);

  const cached = await getSnapshot(env);
  const cachedPayload = await cached.json();
  assert.equal(cachedPayload.delivery, "cached");
  assert.equal(state.queries, 1);
});

test("Worker snapshot generation, R2 round-trip, and cached read preserve a historical consecutive-hyphen slug", async () => {
  const { env, state } = makeEnv([product(1, "historical--double--hyphen")]);
  const first = await getSnapshot(env);
  const generated = await first.json();
  assert.equal(first.status, 200);
  assert.equal(generated.products[0].slug, "historical--double--hyphen");
  assert.equal(state.writes, 1);

  const second = await getSnapshot(env);
  const cached = await second.json();
  assert.equal(second.status, 200);
  assert.equal(cached.delivery, "cached");
  assert.equal(cached.products[0].slug, "historical--double--hyphen");
  const stored = JSON.parse(state.objects.get(SITEMAP_SNAPSHOT_KEY).value).snapshot;
  assert.equal(stored.products[0].slug, "historical--double--hyphen");
});

test("zero active products never creates or stores an empty sitemap", async () => {
  const { env, state } = makeEnv([]);
  const response = await getSnapshot(env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(state.writes, 0);
  assert.equal(state.objects.size, 0);
});

test("zero D1 products falls back to a recent non-empty LKG without overwriting it", async () => {
  const { env, state } = makeEnv([product(1)]);
  const current = await getSnapshot(env);
  assert.equal(current.status, 200);
  const lkg = await createSitemapCatalogSnapshot([
    { id: 1, slug: "item-1", lastModified: "2026-11-26T12:00:00.000Z", category: "tops", subcategory: "sweaters" },
  ], new Date(Date.now() - 10 * 60 * 1000).toISOString(), manifestHash);
  const originalValue = JSON.stringify({ snapshot: lkg });
  state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: originalValue, etag: "good-lkg-etag" });
  state.rows = [];
  state.writes = 0;

  const response = await getSnapshot(env);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.delivery, "last-known-good");
  assert.equal(payload.totalCount, 1);
  assert.equal(state.writes, 0);
  assert.deepEqual(state.objects.get(SITEMAP_SNAPSHOT_KEY), { value: originalValue, etag: "good-lkg-etag" });
});

test("zero D1 products with expired LKG returns 503 and preserves the expired diagnostic object", async () => {
  const { env, state } = makeEnv([]);
  const expired = await createSitemapCatalogSnapshot([
    { id: 1, slug: "item-1", lastModified: null, category: "tops", subcategory: null },
  ], new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), manifestHash);
  const originalValue = JSON.stringify({ snapshot: expired });
  state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: originalValue, etag: "expired-etag" });
  const response = await getSnapshot(env);
  assert.equal(response.status, 503);
  assert.equal(state.writes, 0);
  assert.deepEqual(state.objects.get(SITEMAP_SNAPSHOT_KEY), { value: originalValue, etag: "expired-etag" });
});

test("a historical empty R2 snapshot is not served as LKG and remains untouched until catalogue recovery", async () => {
  const { env, state } = makeEnv([]);
  const empty = await createSitemapCatalogSnapshot([], new Date().toISOString(), manifestHash);
  const emptyValue = JSON.stringify({ snapshot: empty });
  state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: emptyValue, etag: "historical-empty-etag" });
  const unavailable = await getSnapshot(env);
  assert.equal(unavailable.status, 503);
  assert.equal(state.writes, 0);
  assert.deepEqual(state.objects.get(SITEMAP_SNAPSHOT_KEY), { value: emptyValue, etag: "historical-empty-etag" });

  state.rows = [product(1)];
  const recovered = await getSnapshot(env);
  assert.equal(recovered.status, 200);
  assert.equal((await recovered.json()).totalCount, 1);
  assert.equal(state.writes, 1);
  const stored = JSON.parse(state.objects.get(SITEMAP_SNAPSHOT_KEY).value).snapshot;
  assert.equal(stored.totalCount, 1);
});

test("an empty catalogue refresh racing a valid refresh cannot overwrite the non-empty snapshot", async () => {
  const { env, state } = makeEnv([product(1)]);
  await getSnapshot(env);
  const oldLkg = await createSitemapCatalogSnapshot([
    { id: 1, slug: "item-1", lastModified: null, category: "tops", subcategory: null },
  ], new Date(Date.now() - 10 * 60 * 1000).toISOString(), manifestHash);
  state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: JSON.stringify({ snapshot: oldLkg }), etag: "race-lkg-etag" });
  const emptyRows = [{ active_count: 0, id: null, slug: null, updated_at: null, created_at: null, category: null, subcategory: null }];
  const validRows = [{ active_count: 1, id: 1, slug: "item-1", updated_at: "2026-11-26 12:00:00", created_at: null, category: "tops", subcategory: "sweaters" }];
  state.queryOverrides = [emptyRows, validRows];
  const responses = await Promise.all([getSnapshot(env), getSnapshot(env)]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  const delivered = await Promise.all(responses.map((response) => response.json()));
  assert.ok(delivered.some((payload) => payload.delivery === "last-known-good"));
  assert.ok(delivered.some((payload) => payload.delivery === "fresh"));
  const stored = JSON.parse(state.objects.get(SITEMAP_SNAPSHOT_KEY).value).snapshot;
  assert.ok(stored.totalCount > 0);
});

test("a partial D1 result is rejected", async () => {

  const partial = makeEnv([product(1), product(2)], { incomplete: true }).env;
  const rejected = await getSnapshot(partial);
  assert.equal(rejected.status, 503);
});

test("D1 failure uses an intact R2 last-known-good snapshot only within 24 hours", async () => {
  const { env, state } = makeEnv([product(1)]);
  const first = await getSnapshot(env);
  assert.equal(first.status, 200);
  const key = [...state.objects.keys()][0];
  const oldSnapshot = await createSitemapCatalogSnapshot([
    { id: 1, slug: "item-1", lastModified: "2026-11-26T12:00:00.000Z", category: "tops", subcategory: "sweaters" },
  ], new Date(Date.now() - 10 * 60 * 1000).toISOString(), manifestHash);
  state.objects.set(key, { value: JSON.stringify({ snapshot: oldSnapshot }), etag: "older-valid-etag" });
  state.failD1 = true;

  const fallback = await getSnapshot(env);
  assert.equal(fallback.status, 200);
  assert.equal((await fallback.json()).delivery, "last-known-good");

  const expired = await createSitemapCatalogSnapshot([
    { id: 1, slug: "item-1", lastModified: "2026-11-26T12:00:00.000Z", category: "tops", subcategory: "sweaters" },
  ], new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), manifestHash);
  state.objects.set(key, { value: JSON.stringify({ snapshot: expired }), etag: "expired-etag" });
  const expiredResponse = await getSnapshot(env);
  assert.equal(expiredResponse.status, 503);
  assert.equal(expiredResponse.headers.get("Retry-After"), "60");
});

test("a changed static sitemap manifest cannot reuse an incompatible R2 last-known-good snapshot", async () => {
  const { env } = makeEnv([product(1)]);
  assert.equal((await getSnapshot(env)).status, 200);
  env.DB.prepare = () => ({ bind: () => ({ all: async () => { throw new Error("fixture_d1_error"); } }) });
  const changedManifest = "b".repeat(64);
  const response = await getSnapshot(env, {}, changedManifest);
  assert.equal(response.status, 503);
});

test("Worker refuses to persist a candidate whose complete Sitemap exceeds 50,000 URLs", async () => {
  const oversizedRows = Array.from({ length: 50_000 }, (_, index) => product(index + 1, `capacity-${index + 1}`));
  const { env, state } = makeEnv(oversizedRows);
  const response = await getSnapshot(env);
  assert.equal(response.status, 503);
  assert.equal(state.writes, 0);
  assert.equal(state.objects.size, 0);

  const withLkg = makeEnv([product(1)]);
  const previous = await createSitemapCatalogSnapshot([
    { id: 1, slug: "old-valid-product", lastModified: null, category: "tops", subcategory: null },
  ], new Date(Date.now() - 10 * 60 * 1000).toISOString(), manifestHash);
  const oldValue = JSON.stringify({ snapshot: previous });
  withLkg.state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: oldValue, etag: "protocol-lkg-etag" });
  withLkg.state.rows = oversizedRows;
  const fallback = await getSnapshot(withLkg.env);
  assert.equal(fallback.status, 200);
  assert.equal((await fallback.json()).delivery, "last-known-good");
  assert.equal(withLkg.state.writes, 0);
  assert.deepEqual(withLkg.state.objects.get(SITEMAP_SNAPSHOT_KEY), { value: oldValue, etag: "protocol-lkg-etag" });
});

test("R2 write failures and ETag conflicts preserve the previous complete object", async () => {
  for (const option of [{ failPut: true }, { forceConflict: true }]) {
    const { env, state } = makeEnv([product(1)], option);
    const oldSnapshot = await createSitemapCatalogSnapshot([
      { id: 1, slug: "old-lkg", lastModified: null, category: "tops", subcategory: null },
    ], new Date(Date.now() - 10 * 60 * 1000).toISOString(), manifestHash);
    const originalValue = JSON.stringify({ snapshot: oldSnapshot });
    state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: originalValue, etag: "existing-good-etag" });
    const response = await getSnapshot(env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).delivery, "fresh");
    assert.deepEqual(state.objects.get(SITEMAP_SNAPSHOT_KEY), { value: originalValue, etag: "existing-good-etag" });
  }
});

test("an object observed after ETag conflict is revalidated before it can serve as LKG", async () => {
  const { env, state } = makeEnv([product(1)], { forceConflict: true, conflictValue: JSON.stringify({ snapshot: { schemaVersion: 1, products: [] } }) });
  const response = await getSnapshot(env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).delivery, "fresh");
  state.failD1 = true;
  const later = await getSnapshot(env);
  assert.equal(later.status, 503);
});

test("a new Worker instance can cold-read a valid existing R2 LKG and rejects a damaged one", async () => {
  const { env, state } = makeEnv([product(1)]);
  await getSnapshot(env);
  const oldSnapshot = await createSitemapCatalogSnapshot([
    { id: 1, slug: "item-1", lastModified: null, category: "tops", subcategory: "sweaters" },
  ], new Date(Date.now() - 10 * 60 * 1000).toISOString(), manifestHash);
  state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: JSON.stringify({ snapshot: oldSnapshot }), etag: "cold-valid-etag" });
  state.failD1 = true;
  const coldModule = loadWorker(workerMocks);
  const coldWorker = coldModule.default ?? coldModule;
  const cached = await coldWorker.fetch(new Request(`https://worker.test/sitemap-snapshot?manifest=${manifestHash}`), env, {});
  assert.equal(cached.status, 200);
  assert.equal((await cached.json()).delivery, "last-known-good");

  state.objects.set(SITEMAP_SNAPSHOT_KEY, { value: JSON.stringify({ snapshot: { schemaVersion: 1, products: [] } }), etag: "damaged-etag" });
  const damaged = await coldWorker.fetch(new Request(`https://worker.test/sitemap-snapshot?manifest=${manifestHash}`), env, {});
  assert.equal(damaged.status, 503);
});

test("cold start and invalid duplicate-slug snapshots fail closed rather than return partial XML data", async () => {
  const unavailable = makeEnv([], { failD1: true }).env;
  assert.equal((await getSnapshot(unavailable)).status, 503);

  const duplicates = makeEnv([product(1, "same-slug"), product(2, "same-slug")]).env;
  assert.equal((await getSnapshot(duplicates)).status, 503);
});
