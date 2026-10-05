import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const componentPath = path.join(rootDirectory, "components", "ProductDetailClient.tsx");
const componentSource = fs.readFileSync(componentPath, "utf8");
const cssSource = fs.readFileSync(path.join(rootDirectory, "app", "globals.css"), "utf8");
const React = require("react");
const { renderToString } = require("react-dom/server");

function loadProductDetailClient() {
  const compiled = ts.transpileModule(componentSource, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  });
  const link = ({ children, ...props }) => React.createElement("a", props, children);
  const mocks = {
    react: React,
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/link": { __esModule: true, default: link },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/lib/formatMoney": { formatMoney: (value) => `£${value}` },
    "@/lib/productPrice": { getProductPrice: (product) => product.priceGBP },
    "@/lib/googleAnalytics": {
      productToGoogleAnalyticsItem: () => ({}),
      trackGoogleAnalyticsEvent() {},
    },
    "@/lib/metaPixel": {
      trackAddToCart() {},
      trackInitiateCheckout() {},
      trackViewContent() {},
    },
    "@/lib/useCurrency": { useCurrency: () => ({ currency: "GBP" }) },
    "@/lib/productSizes": { getCustomerPurchaseSizes: () => ["M", "L", "XL", "XXL"] },
    "./CartProvider": { useCart: () => ({ addItem() {} }) },
  };
  const loadedModule = { exports: {} };
  const localRequire = (name) => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected ProductDetailClient dependency: ${name}`);
    return mocks[name];
  };
  new Function("require", "module", "exports", compiled.outputText)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports.ProductDetailClient;
}

const fixtureProduct = {
  id: "test-product",
  slug: "test-product",
  name: "SSR Accordion Test Product",
  category: "Outerwear",
  priceGBP: 25,
  priceEUR: 30,
  priceUSD: 35,
  colors: [],
  sizes: ["M", "L", "XL", "XXL"],
  images: ["https://example.test/product.jpg"],
  description: "Description fallback copy.",
  productDetails: ["SSR Product Details fixture text."],
  sizeFit: ["SSR Size & Fit fixture text."],
  material: "SSR Material fixture text.",
};

test("Product page accordion content is present in initial server HTML while all sections start closed", () => {
  const ProductDetailClient = loadProductDetailClient();
  const html = renderToString(React.createElement(ProductDetailClient, { product: fixtureProduct }));

  assert.match(html, /SSR Product Details fixture text\./);
  assert.match(html, /SSR Size &amp; Fit fixture text\./);
  assert.match(html, /Not sure which size to choose\?/);
  assert.match(html, /<a class="pdp-accordion-link" href="\/size-recommender">Use our Size Recommender →<\/a>/);
  assert.match(html, /SSR Material fixture text\./);
  assert.match(html, /Tracked delivery across the UK and Europe\./);
  assert.match(html, /View returns information/);
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 5);
  assert.equal((html.match(/class="pdp-accordion-content" hidden=""/g) || []).length, 5);

  const sizeFitStart = componentSource.indexOf('title="Size & Fit"');
  const materialStart = componentSource.indexOf('title="Material"', sizeFitStart);
  const sizeFitSource = componentSource.slice(sizeFitStart, materialStart);
  assert.match(sizeFitSource, /Not sure which size to choose\?/);
  assert.match(sizeFitSource, /href="\/size-recommender"/);
});

test("accordion keeps children mounted and uses native hidden for closed content", () => {
  assert.match(componentSource, /useState<AccordionKey\s*\|\s*null>\(null\)/);
  assert.match(componentSource, /aria-expanded=\{open\}/);
  assert.match(componentSource, /<div className="pdp-accordion-content" hidden=\{!open\}>\{children\}<\/div>/);
  assert.doesNotMatch(componentSource, /\{\s*open\s*\?\s*\([\s\S]*?\{children\}[\s\S]*?:\s*null\s*\}/);
  assert.doesNotMatch(componentSource, /open\s*&&\s*<[^>]*>\s*\{children\}/);
  assert.doesNotMatch(componentSource, /aria-hidden=\{!open\}/);
  const accordionRules = Array.from(cssSource.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selector]) => selector.includes(".pdp-accordion-content"));
  assert.ok(accordionRules.length > 0);
  assert.doesNotMatch(accordionRules.map(([, , declarations]) => declarations).join("\n"), /display\s*:/);
  assert.doesNotMatch(cssSource, /\.pdp-accordion-panel/);
  assert.doesNotMatch(cssSource, /\.pdp-accordion-content\s*\[hidden\]\s*\{[^}]*display\s*:/s);
  assert.doesNotMatch(accordionRules.map(([, , declarations]) => declarations).join("\n"), /grid-template-rows|max-height|visibility|opacity|overflow|pointer-events/);
});
