import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDirectory, "..", "lib", "catalogApiBase.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const resolverModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: resolverModule,
  exports: resolverModule.exports,
  process: { env: {} },
  URL,
});
const { resolveCatalogApiBase } = resolverModule.exports;

test("development catalog isolation uses an explicitly configured local upstream", () => {
  assert.equal(resolveCatalogApiBase({
    NODE_ENV: "development",
    LOCAL_CATALOG_ISOLATION: "true",
    CATALOG_API_BASE: " http://127.0.0.1:9/// ",
  }), "http://127.0.0.1:9");
});

test("development catalog isolation blocks a Production Worker upstream", () => {
  assert.throws(() => resolveCatalogApiBase({
    NODE_ENV: "development",
    LOCAL_CATALOG_ISOLATION: "true",
    CATALOG_API_BASE: "https://cnfansuk-catalog-api.dayu70001.workers.dev",
  }), /Production fallback is blocked/);
});

test("development catalog isolation never falls back when local upstreams are unset", () => {
  assert.throws(() => resolveCatalogApiBase({
    NODE_ENV: "development",
    LOCAL_CATALOG_ISOLATION: "true",
  }), /Production fallback is blocked/);
});

test("development catalog isolation supports a local test upstream", () => {
  assert.equal(resolveCatalogApiBase({
    NODE_ENV: "development",
    LOCAL_CATALOG_ISOLATION: "true",
    CATALOG_API_BASE: "http://localhost:4001/catalog///",
  }), "http://localhost:4001/catalog");
});

test("development catalog isolation blocks a remote upstream", () => {
  assert.throws(() => resolveCatalogApiBase({
    NODE_ENV: "development",
    LOCAL_CATALOG_ISOLATION: "true",
    CATALOG_API_BASE: "https://cnfansuk-catalog-api.dayu70001.workers.dev",
  }), /Production fallback is blocked/);
});

test("development catalog isolation never falls back when local upstreams are unset", () => {
  assert.throws(() => resolveCatalogApiBase({
    NODE_ENV: "development",
    LOCAL_CATALOG_ISOLATION: "true",
  }), /Production fallback is blocked/);
});

test("development uses the existing Production Catalog fallback when isolation is not requested", () => {
  assert.equal(resolveCatalogApiBase({ NODE_ENV: "development" }),
    "https://cnfansuk-catalog-api.dayu70001.workers.dev");
});

test("Production retains the existing Worker fallback", () => {
  assert.equal(resolveCatalogApiBase({ NODE_ENV: "production" }),
    "https://cnfansuk-catalog-api.dayu70001.workers.dev");
});

test("Production retains the existing private-before-public override order", () => {
  assert.equal(resolveCatalogApiBase({
    NODE_ENV: "production",
    CATALOG_API_BASE: "https://private.example.test///",
    NEXT_PUBLIC_CATALOG_API_BASE: "https://public.example.test",
  }), "https://private.example.test");
});
