import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const source = read("lib/sizeRecommender.ts");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleShim = { exports: {} };
new Function("exports", "require", "module", "__filename", "__dirname", compiled)(
  moduleShim.exports,
  require,
  moduleShim,
  path.join(root, "lib/sizeRecommender.ts"),
  path.join(root, "lib"),
);
const { FIT_EASE, SIZE_REFERENCE, isValidSizeInput, recommendSize } = moduleShim.exports;
const page = read("app/size-recommender/page.tsx");
const client = read("app/size-recommender/SizeRecommenderClient.tsx");
const sizeGuide = read("app/cnfans-size-guide/page.tsx");
const sitemap = read("app/sitemap.ts");

const recommend = (height, weight, bodyChest, fit) => recommendSize({ height, weight, bodyChest, fit });

test("fixed general reference rows contain only M, L, XL and XXL with approved measurements", () => {
  assert.deepEqual(SIZE_REFERENCE.map((row) => row.size), ["M", "L", "XL", "XXL"]);
  assert.deepEqual(SIZE_REFERENCE.map((row) => [row.garmentChest, row.flatChest]), [[106, 53], [110, 55], [114, 57], [118, 59]]);
  assert.deepEqual(SIZE_REFERENCE.map((row) => row.chineseReference), ["170/88A", "175/92A", "180/96A", "185/100A"]);
  assert.deepEqual(SIZE_REFERENCE.map((row) => row.heightRange), ["165–175 cm", "170–180 cm", "175–185 cm", "180–190 cm"]);
  assert.deepEqual(SIZE_REFERENCE.map((row) => row.weightRange), ["55–65 kg", "62.5–72.5 kg", "70–80 kg", "77.5–90 kg"]);
});

test("fit ease values are exact and required as an explicit choice", () => {
  assert.deepEqual(FIT_EASE, { slim: 8, regular: 12, relaxed: 16 });
  assert.match(client, /checked=\{values\.fit === fit\}/);
  assert.match(client, /Preferred fit <span>\(required\)<\/span>/);
  assert.equal(recommend(178, 70, 98, "regular").targetGarmentChest, 110);
});

test("approved chest-first examples return the expected sizes", () => {
  assert.equal(recommend(178, 70, 98, "regular").size, "L");
  assert.equal(recommend(180, 78, 102, "regular").size, "XL");
  assert.equal(recommend(175, 68, 102, "slim").size, "L");
  assert.equal(recommend(180, 75, 98, "relaxed").size, "XL");
});

test("targets above XXL return XXL with an explicit product-measurement warning", () => {
  const result = recommend(185, 83.75, 140, "regular");
  assert.equal(result.targetGarmentChest, 152);
  assert.equal(result.size, "XXL");
  assert.equal(result.confidence, "LOW");
  assert.ok(result.warnings.some((warning) => /above the general reference range for XXL/i.test(warning)));
  assert.ok(result.warnings.some((warning) => /check the individual product measurements/i.test(warning)));
});

test("a very tall customer with a small chest receives a low-confidence chest-first result", () => {
  const result = recommend(205, 60, 86, "slim");
  assert.equal(result.chestSize, "M");
  assert.equal(result.heightReferenceSize, "XXL");
  assert.equal(result.size, "M");
  assert.equal(result.confidence, "LOW");
  assert.ok(result.warnings.some((warning) => /different general size ranges/i.test(warning)));
});

test("height and weight together can move the result up at most one size", () => {
  const result = recommend(175, 67.5, 90, "regular");
  assert.equal(result.chestSize, "M");
  assert.equal(result.heightReferenceSize, "L");
  assert.equal(result.weightReferenceSize, "L");
  assert.equal(result.size, "L");

  const farAbove = recommend(205, 100, 90, "regular");
  assert.equal(farAbove.chestSize, "M");
  assert.equal(farAbove.size, "L");
  assert.equal(farAbove.confidence, "LOW");
});

test("lower secondary references never downgrade a chest-required size", () => {
  const result = recommend(165, 60, 102, "regular");
  assert.equal(result.chestSize, "XL");
  assert.equal(result.heightReferenceSize, "M");
  assert.equal(result.weightReferenceSize, "M");
  assert.equal(result.size, "XL");
});

test("below-minimum chest starts from M and input ranges are guarded", () => {
  const result = recommend(170, 60, 70, "slim");
  assert.equal(result.chestSize, "M");
  assert.ok(result.warnings.some((warning) => /M is the smallest CNFans clothing size/i.test(warning)));
  assert.equal(isValidSizeInput({ height: 139, weight: 60, bodyChest: 90 }), false);
  assert.equal(isValidSizeInput({ height: 170, weight: 161, bodyChest: 90 }), false);
  assert.equal(isValidSizeInput({ height: 170, weight: 60, bodyChest: 151 }), false);
  assert.throws(() => recommend(139, 60, 90, "regular"), /Please check your measurement/);
});

test("SSR page exposes self-canonical metadata, content, and the full reference table", () => {
  assert.match(page, /path:\s*"\/size-recommender"/);
  assert.match(page, /title:\s*"CNFans Size Recommender \| M–XXL Men's Clothing"/);
  assert.match(page, /name:\s*"CNFans Size Recommender"/);
  assert.match(page, /<h1>CNFans Size Recommender<\/h1>/);
  assert.match(page, /approximate general reference/i);
  assert.match(page, /Garment chest/);
  assert.match(page, /Flat chest/);
  assert.match(page, /<table className="first-party-table size-recommender-table">/);
  assert.match(page, /href="\/cnfans-size-guide"/);
  assert.match(page, /href="\/how-to-order"/);
  assert.doesNotMatch(page, /noindex|robots:\s*\{\s*index:\s*false/i);
  assert.doesNotMatch(page, /FAQPage|AggregateRating/);
});

test("size guide links to the tool once and sitemap lists its route exactly once", () => {
  assert.match(sizeGuide, /Not sure which size to start with\? Use the <Link href="\/size-recommender">Size Recommender<\/Link>/);
  assert.equal((sizeGuide.match(/href="\/size-recommender"/g) || []).length, 1);
  assert.equal((sitemap.match(/"\/size-recommender"/g) || []).length, 1);
});

test("page copy distinguishes body and garment measurements and avoids fit guarantees", () => {
  assert.match(page, /body chest first/i);
  assert.match(page, /body chest, rather than using a garment measurement/i);
  assert.match(page, /full circumference of a finished garment/i);
  assert.match(page, /flat chest is the width measured across the garment/i);
  assert.match(page, /Different brands and styles can fit differently/i);
  assert.match(page, /Puffer jackets, down jackets, oversized cuts and drop-shoulder/i);
  assert.doesNotMatch(`${page}\n${client}`, /guaranteed fit|perfect fit|accurate for every brand|official universal Chinese size|100% accurate|one size fits all brands/i);
});

test("measurement state stays client-local and is not persisted or transmitted", () => {
  assert.match(client, /"use client"/);
  assert.match(client, /aria-live="polite"/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|document\.cookie|sendBeacon|gtag\s*\(|fetch\s*\(|XMLHttpRequest|URLSearchParams|searchParams/i);
  assert.doesNotMatch(client, /action=/i);
});
