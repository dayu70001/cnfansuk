import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flow = fs.readFileSync(path.join(root, "components/CheckoutFlow.tsx"), "utf8");

test("Mapbox suggestions remain restricted to the selected supported country", () => {
  const retrieve = flow.slice(flow.indexOf("function handleAddressRetrieve("), flow.indexOf("function updateCountry("));
  assert.match(flow, /options=\{\{ language: "en", limit: 5, country: shipping\.countryCode\.toLowerCase\(\) \}\}/);
  assert.match(retrieve, /countryCode !== shipping\.countryCode\.toUpperCase\(\)/);
  assert.match(retrieve, /!countries\.some\(\(\[code\]\) => code === countryCode\)/);
  assert.match(retrieve, /setAutofillUnavailable\(true\)/);
});

test("changing delivery country clears address fields tied to the previous country", () => {
  const updateCountry = flow.slice(flow.indexOf("function updateCountry("), flow.indexOf("return (\n    <form", flow.indexOf("function updateCountry(")));
  for (const field of ["addressLine1", "addressLine2", "city", "county", "postcode"]) {
    assert.match(updateCountry, new RegExp(`${field}: ""`));
  }
  assert.match(updateCountry, /setAddressQuery\(""\)/);
  assert.match(updateCountry, /setAutofillUnavailable\(false\)/);
});

test("manual address entry remains available when Mapbox is missing or unavailable", () => {
  assert.match(flow, /Address lookup is not configured in this local preview\. Enter your address manually below\./);
  assert.match(flow, /Address suggestions are unavailable\. Enter the address manually below\./);
  assert.match(flow, /onSuggestError=\{\(\) => setAutofillUnavailable\(true\)\}/);
  assert.match(flow, /<CheckoutInput[\s\S]*?label="Address line 1"[\s\S]*?onChange=\{\(value\) => update\("addressLine1", value\)\}/);
});
