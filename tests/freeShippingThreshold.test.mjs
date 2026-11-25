import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "lib/shipping.ts"), "utf8");
const loadedModule = { exports: {} };
vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), {
  module: loadedModule,
  exports: loadedModule.exports,
});
const shipping = loadedModule.exports;

const routeByCurrency = { GBP: "GB", EUR: "FR", USD: "US" };
const standardFeeByCurrency = { GBP: 5, EUR: 5, USD: 6.43 };
const priorityFeeByCurrency = { GBP: 15, EUR: 16.88, USD: 19.29 };

for (const currency of ["GBP", "EUR", "USD"]) {
  const countryCode = routeByCurrency[currency];
  test(`${currency} delivery threshold applies at 180 without rounding up for ${countryCode}`, () => {
    assert.equal(shipping.getShippingPrice("royal-mail-tracked", 179.99, currency, countryCode), standardFeeByCurrency[currency]);
    assert.equal(shipping.getShippingPrice("dhl-express", 179.99, currency, countryCode), standardFeeByCurrency[currency]);
    assert.equal(shipping.getShippingPrice("royal-mail-tracked", 180, currency, countryCode), 0);
    assert.equal(shipping.getShippingPrice("dhl-express", 180.01, currency, countryCode), 0);
    assert.equal(shipping.getShippingPrice("fedex-priority", 180, currency, countryCode), priorityFeeByCurrency[currency]);
    assert.equal(shipping.getShippingPrice("royal-mail-tracked", 179.999, currency, countryCode), standardFeeByCurrency[currency]);
  });
}

test("all ten courier providers and all 29 destination mappings resolve without inventing other carriers", () => {
  const expected = {
    GB: "Royal Mail", NL: "DHL", DE: "DHL", IE: "DHL", IT: "IT Post", FR: "Colis Privé",
    ES: "CTT", PT: "CTT", PL: "InPost", BE: "bpost", US: "USPS", EE: "PostPlus",
    LT: "PostPlus", LV: "PostPlus", CY: "PostPlus", HU: "PostPlus", RO: "PostPlus",
    GR: "PostPlus", MT: "PostPlus", SI: "PostPlus", SE: "PostPlus", SK: "PostPlus",
    BG: "PostPlus", HR: "PostPlus", FI: "PostPlus", LU: "PostPlus", AT: "PostPlus",
    DK: "PostPlus", CZ: "PostPlus",
  };
  assert.equal(shipping.courierProviders.length, 10);
  assert.equal(shipping.courierProviders.find(({ id }) => id === "dhl")?.label, "DHL");
  assert.equal(shipping.shippingMethods.length, 3, "legacy customer-facing service levels stay separate from last-mile providers");
  assert.equal(shipping.getShippingMethod("dhl-express").label, "DHL Express");
  assert.doesNotMatch(JSON.stringify(shipping.courierProviders), /DHL \(NL\)/);
  assert.equal(Object.keys(shipping.lastMileCarrierByCountry).length, 29);
  for (const [countryCode, label] of Object.entries(expected)) {
    assert.equal(shipping.getLastMileCarrier(countryCode).label, label);
  }
  assert.equal(shipping.getLastMileCarrier("CH"), null);
  assert.equal(shipping.getCheckoutCurrency("GB", "USD"), "GBP");
  assert.equal(shipping.getCheckoutCurrency("FR", "GBP"), "EUR");
  assert.equal(shipping.getCheckoutCurrency("SE", "USD"), "EUR");
  assert.equal(shipping.getCheckoutCurrency("US", "GBP"), "USD");
  assert.equal(shipping.getCheckoutCurrency("CH", "EUR"), "EUR");
});

test("Checkout offers all mapped destinations while retaining its previous country choices", async () => {
  const checkoutSource = await import("node:fs/promises").then(({ readFile }) => readFile(path.join(root, "components/CheckoutFlow.tsx"), "utf8"));
  const countriesBlock = checkoutSource.match(/const countries = \[([\s\S]*?)\] as const;/)?.[1] || "";
  const offeredCodes = [...countriesBlock.matchAll(/\["([A-Z]{2})",/g)].map(([, code]) => code);
  for (const code of Object.keys(shipping.lastMileCarrierByCountry)) assert.ok(offeredCodes.includes(code), `${code} is selectable in Checkout`);
  for (const legacyCode of ["CH", "NO", "MC"]) assert.ok(offeredCodes.includes(legacyCode), `${legacyCode} remains selectable`);
  assert.equal(new Set(offeredCodes).size, offeredCodes.length, "country options have no duplicate codes");
  assert.match(countriesBlock, /\["CZ", "Czechia"\]/);
});

test("European flat shipping is a fixed EUR 5 rather than a converted GBP 5", () => {
  assert.equal(shipping.getShippingPrice("royal-mail-tracked", 20, "EUR", "SE"), 5);
  assert.equal(shipping.getShippingPrice("dhl-express", 20, "EUR", "DE"), 5);
});
