import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadProjectTypeScript } from "../workers/catalog-api/src/test-support/loadWorker.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const snapshotModule = loadProjectTypeScript(path.join(root, "lib/sitemapSnapshot.ts"));
const sitemapModule = loadProjectTypeScript(path.join(root, "lib/sitemap.ts"), {
  "node:crypto": require("node:crypto"),
});
const {
  createSitemapCatalogSnapshot,
  validateSitemapCatalogSnapshot,
  SitemapSnapshotError,
} = snapshotModule;
const {
  assertSitemapProtocolLimits,
  buildSitemapEntries,
  renderSitemapXml,
  SITEMAP_PROTOCOL_MAX_URLS,
  SITEMAP_PROTOCOL_MAX_XML_BYTES,
  SITEMAP_STATIC_PATHS,
  SitemapProtocolError,
  validateSitemapXml,
} = sitemapModule;
const manifestHash = "a".repeat(64);

const product = (id, slug, category = "tops", subcategory = "sweaters") => ({
  id,
  slug,
  lastModified: "2026-11-26T12:00:00.000Z",
  category,
  subcategory,
});

test("complete production catalogue snapshot validates and creates one URL per product", async () => {
  const snapshot = await createSitemapCatalogSnapshot([
    product(1, "verified-sweater-1"),
    product(2, "verified-sweater-2"),
    product(3, "verified-sweater-3"),
    product(4, "verified-sweater-4"),
    product(5, "verified-sweater-5"),
    product(6, "verified-jacket", "outerwear", "jackets"),
  ], "2026-11-26T12:30:00.000Z", manifestHash);
  const validated = await validateSitemapCatalogSnapshot(snapshot);
  const entries = buildSitemapEntries(validated);
  assert.equal(entries.filter((entry) => entry.url.includes("/product/")).length, 6);
  assert.ok(entries.some((entry) => entry.url.endsWith("/product/verified-sweater-1")));
  assert.ok(entries.some((entry) => entry.url.endsWith("/product/verified-jacket")));
  assert.ok(entries.some((entry) => entry.url.endsWith("/category/tops/sweaters")));
  assert.equal(entries.filter((entry) => entry.url.endsWith("/category/tops/sweaters")).length, 1);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  assert.ok(SITEMAP_STATIC_PATHS.includes("/"));
  assert.ok(SITEMAP_STATIC_PATHS.includes("/delivery"));
  assert.equal(entries.some((entry) => entry.url.includes("richmond-heavyweight-hoodie")), false);
});

test("a structurally complete zero-active-products v1 snapshot remains parseable but is not a publishable sitemap", async () => {
  const empty = await createSitemapCatalogSnapshot([], "2026-11-26T12:30:00.000Z", manifestHash);
  assert.equal((await validateSitemapCatalogSnapshot(empty)).totalCount, 0);
  assert.equal(buildSitemapEntries(empty).filter((entry) => entry.url.includes("/product/")).length, 0);
  await assert.rejects(() => validateSitemapCatalogSnapshot(null), SitemapSnapshotError);
  await assert.rejects(() => validateSitemapCatalogSnapshot({ ...empty, totalCount: 1 }), SitemapSnapshotError);
  await assert.rejects(() => validateSitemapCatalogSnapshot({ ...empty, hasMore: true }), SitemapSnapshotError);
});

test("snapshot validation rebuilds only allowlisted public fields and preserves schema v1", async () => {
  const source = await createSitemapCatalogSnapshot([product(1, "clean-sweater")], "2026-11-26T12:30:00.000Z", manifestHash);
  const normalized = await validateSitemapCatalogSnapshot({
    ...source,
    internalCost: 99,
    supplier: { name: "private supplier" },
    products: [{ ...source.products[0], orderData: "private", vendorSecret: "private" }],
  });
  assert.equal(normalized.internalCost, undefined);
  assert.equal(normalized.supplier, undefined);
  assert.deepEqual(Object.keys(normalized.products[0]), ["id", "slug", "lastModified", "category", "subcategory"]);
  assert.equal(normalized.products[0].orderData, undefined);
  assert.equal(normalized.schemaVersion, 1);
  assert.equal(normalized.integrityHash, source.integrityHash);
});

test("duplicate IDs/slugs, invalid slugs, malformed timestamps and altered integrity data are rejected", async () => {
  const good = await createSitemapCatalogSnapshot([product(1, "clean-sweater")], "2026-11-26T12:30:00.000Z", manifestHash);
  const duplicateSlug = await createSitemapCatalogSnapshot([product(1, "duplicate"), product(2, "duplicate")], "2026-11-26T12:30:00.000Z", manifestHash);
  const duplicateId = await createSitemapCatalogSnapshot([product(1, "first"), product(1, "second")], "2026-11-26T12:30:00.000Z", manifestHash);
  const invalidSlug = await createSitemapCatalogSnapshot([product(1, "not a slug")], "2026-11-26T12:30:00.000Z", manifestHash);
  const badTimestamp = await createSitemapCatalogSnapshot([product(1, "clean-sweater")], "not-a-date", manifestHash);
  for (const candidate of [duplicateSlug, duplicateId, invalidSlug, badTimestamp, { ...good, products: [product(1, "changed-sweater")] }]) {
    await assert.rejects(() => validateSitemapCatalogSnapshot(candidate), SitemapSnapshotError);
  }
});

test("XML output escapes values and preserves the Sitemap protocol structure", () => {
  const xml = renderSitemapXml([{
    url: "https://www.cnfans.co.uk/product/a&b",
    lastModified: "2026-11-26T12:00:00.000Z",
    changeFrequency: "weekly",
    priority: 0.7,
  }]);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<loc>https:\/\/www\.cnfans\.co\.uk\/product\/a&amp;b<\/loc>/);
  assert.match(xml, /<lastmod>2026-11-26T12:00:00\.000Z<\/lastmod>/);
});

test("XML protocol accepts exactly 49,999 and 50,000 complete URLs and rejects 50,001 without truncation", () => {
  const makeEntries = (count) => Array.from({ length: count }, (_, index) => ({
    url: `https://www.cnfans.co.uk/protocol-boundary-${index}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  for (const count of [49_999, 50_000]) {
    const validated = validateSitemapXml(makeEntries(count));
    assert.equal(validated.urlCount, count);
    assert.ok(validated.xml.includes(`/protocol-boundary-${count - 1}</loc>`));
  }
  assert.throws(() => validateSitemapXml(makeEntries(50_001)), (error) => {
    assert.ok(error instanceof SitemapProtocolError);
    assert.equal(error.code, "sitemap_url_limit_exceeded");
    assert.equal(error.urlCount, 50_001);
    assert.ok(error.xmlBytes > 0);
    return true;
  });
});

test("static and category URLs count toward the final limit even when product count is below it", () => {
  const productCount = SITEMAP_PROTOCOL_MAX_URLS - SITEMAP_STATIC_PATHS.length + 1;
  const snapshot = {
    products: Array.from({ length: productCount }, (_, index) => ({
      id: index + 1,
      slug: `capacity-product-${index + 1}`,
      lastModified: null,
      category: "other",
      subcategory: null,
    })),
  };
  assert.ok(snapshot.products.length < SITEMAP_PROTOCOL_MAX_URLS);
  const entries = buildSitemapEntries(snapshot);
  assert.equal(entries.length, SITEMAP_PROTOCOL_MAX_URLS + 1);
  assert.throws(() => validateSitemapXml(entries), (error) => error.code === "sitemap_url_limit_exceeded");
});

test("XML byte checks are inclusive at 50 MiB and fail at one byte over", () => {
  assert.doesNotThrow(() => assertSitemapProtocolLimits(50_000, SITEMAP_PROTOCOL_MAX_XML_BYTES));
  assert.throws(
    () => assertSitemapProtocolLimits(50_000, SITEMAP_PROTOCOL_MAX_XML_BYTES + 1),
    (error) => error.code === "sitemap_xml_byte_limit_exceeded" && error.xmlBytes === SITEMAP_PROTOCOL_MAX_XML_BYTES + 1,
  );
  assert.throws(
    () => assertSitemapProtocolLimits(50_001, 1),
    (error) => error.code === "sitemap_url_limit_exceeded",
  );
});

test("the serialized Sitemap XML accepts exactly 50 MiB and rejects one byte over", () => {
  const urlPrefix = "https://www.cnfans.co.uk/";
  const entryFor = (url) => ({ url, changeFrequency: "weekly", priority: 0.7 });
  const baseline = validateSitemapXml([entryFor(urlPrefix)]);
  const fixedXmlBytes = baseline.xmlBytes - new TextEncoder().encode(urlPrefix).byteLength;
  const exactUrl = urlPrefix + "a".repeat(SITEMAP_PROTOCOL_MAX_XML_BYTES - fixedXmlBytes - urlPrefix.length);
  let exact = validateSitemapXml([entryFor(exactUrl)]);
  assert.equal(exact.xmlBytes, SITEMAP_PROTOCOL_MAX_XML_BYTES);
  exact = null;

  const overUrl = `${exactUrl}a`;
  assert.throws(() => validateSitemapXml([entryFor(overUrl)]), (error) => {
    assert.equal(error.code, "sitemap_xml_byte_limit_exceeded");
    assert.equal(error.urlCount, 1);
    assert.equal(error.xmlBytes, SITEMAP_PROTOCOL_MAX_XML_BYTES + 1);
    return true;
  });
});

test("XML size uses actual UTF-8 bytes for multibyte content and rejects duplicate or invalid URLs", () => {
  const multibyte = validateSitemapXml([{
    url: "https://www.cnfans.co.uk/product/étoile",
    changeFrequency: "weekly",
    priority: 0.7,
  }]);
  assert.equal(multibyte.xmlBytes, new TextEncoder().encode(multibyte.xml).byteLength);
  assert.ok(multibyte.xmlBytes > multibyte.xml.length);
  assert.throws(() => validateSitemapXml([
    { url: "https://www.cnfans.co.uk/a", changeFrequency: "weekly", priority: 0.7 },
    { url: "https://www.cnfans.co.uk/a", changeFrequency: "weekly", priority: 0.7 },
  ]), (error) => error.code === "duplicate_sitemap_url");
  assert.throws(() => validateSitemapXml([
    { url: "https://example.com/not-cnfans", changeFrequency: "weekly", priority: 0.7 },
  ]), (error) => error.code === "invalid_sitemap_url");
});

test("sitemap route serves complete XML and fails closed on upstream or expired snapshots", async () => {
  const failures = [];
  let generatedAt = new Date().toISOString();
  let products = [product(1, "route-test-product")];
  const routeModule = loadProjectTypeScript(path.join(root, "app/sitemap.xml/route.ts"), {
    "@/lib/catalogApi": { fetchSitemapCatalogSnapshot: async () => {
      if (failures.length) throw failures.shift();
      return await createSitemapCatalogSnapshot(products, generatedAt, manifestHash);
    } },
    "@/lib/sitemap": { ...sitemapModule, SITEMAP_STATIC_MANIFEST_HASH: manifestHash },
    "@/lib/sitemapSnapshot": snapshotModule,
  });
  const route = routeModule;
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /application\/xml/);
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.match(await response.text(), /route-test-product/);

  products = [];
  const emptyCatalog = await route.GET();
  assert.equal(emptyCatalog.status, 503);

  products = Array.from({ length: SITEMAP_PROTOCOL_MAX_URLS - SITEMAP_STATIC_PATHS.length + 1 }, (_, index) =>
    product(index + 1, `overflow-product-${index + 1}`, "other", null));
  const overflow = await route.GET();
  assert.equal(overflow.status, 503);
  assert.equal(overflow.headers.get("Cache-Control"), "no-store");
  assert.equal(overflow.headers.get("Retry-After"), "60");
  assert.match(await overflow.text(), /Temporarily unavailable/);

  products = [product(1, "route-test-product")];
  generatedAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const unavailable = await route.GET();
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("Retry-After"), "60");
  assert.match(await unavailable.text(), /Temporarily unavailable/);

  failures.push(new SitemapSnapshotError("upstream_error"));
  const upstreamFailure = await route.GET();
  assert.equal(upstreamFailure.status, 503);

  failures.push(new Error("sitemap_catalog_upstream_rejected"));
  const oldWorker = await route.GET();
  assert.equal(oldWorker.status, 503);
  assert.equal(oldWorker.headers.get("Cache-Control"), "no-store");
  assert.equal(oldWorker.headers.get("Retry-After"), "60");
});
