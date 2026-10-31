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

for (const currency of ["GBP", "EUR", "USD"]) {
  test(`${currency} free-delivery threshold applies at 180 without rounding up`, () => {
    assert.equal(shipping.getShippingPrice("royal-mail-tracked", 179.99, currency), 5);
    assert.equal(shipping.getShippingPrice("dhl-express", 179.99, currency), 5);
    assert.equal(shipping.getShippingPrice("royal-mail-tracked", 180, currency), 0);
    assert.equal(shipping.getShippingPrice("dhl-express", 180.01, currency), 0);
    assert.equal(shipping.getShippingPrice("fedex-priority", 180, currency), 15);
    assert.equal(shipping.getShippingPrice("royal-mail-tracked", 179.999, currency), 5);
  });
}
