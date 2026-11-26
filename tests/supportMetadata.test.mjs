import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const pages = [
  {
    file: "app/delivery/page.tsx",
    title: "Delivery & Shipping Information",
    description: "Information on order preparation, dispatch, tracking updates and delivery timing by destination.",
    canonical: "/delivery",
    h1: "Delivery",
  },
  {
    file: "app/returns/page.tsx",
    title: "Returns & Refunds",
    description: "Information about return requests, item condition and steps for incorrect, damaged or faulty items.",
    canonical: "/returns",
    h1: "Returns",
  },
  {
    file: "app/size-guide/page.tsx",
    title: "Clothing Size Guide",
    description: "Find sizing guidance and learn how to compare garment measurements with clothing you already own.",
    canonical: "/size-guide",
    h1: "Size Guide",
  },
  {
    file: "app/track-order/layout.tsx",
    title: "Track Your Order",
    description: "Check available order or parcel tracking updates using your CNFANS UK order number or tracking number.",
    canonical: "/track-order",
  },
  {
    file: "app/contact/page.tsx",
    title: "Contact Us",
    description: "Contact CNFANS UK about product questions, sizing help or an existing order.",
    canonical: "/contact",
    h1: "Contact CNFANS UK",
  },
];

test("five approved support pages define page-level title, description and self-canonical metadata", () => {
  for (const page of pages) {
    const source = read(page.file);
    assert.match(source, new RegExp(`title: "${page.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), page.file);
    assert.ok(source.includes(`description: "${page.description}"`), `${page.file} description`);
    assert.ok(source.includes(`canonical: \u0060\u0024{SITE_URL}${page.canonical}\u0060`), `${page.file} canonical`);
    if (page.h1) assert.ok(source.includes(`<h1>${page.h1}</h1>`) || source.includes(`<h1>${page.h1}`), `${page.file} H1 remains in markup`);
    assert.doesNotMatch(source, /robots:\s*\{/);
  }
});

test("Track Order keeps its client form implementation and receives metadata only from a server layout", () => {
  const page = read("app/track-order/page.tsx");
  const layout = read("app/track-order/layout.tsx");
  assert.match(page, /^"use client";/);
  assert.match(page, /fetch\(`\/api\/track\?number=/);
  assert.match(layout, /export const metadata/);
  assert.match(layout, /return children/);
  assert.doesNotMatch(layout, /fetch\s*\(|<form|handleSubmit/);
});

test("root title template remains unchanged for page-level metadata", () => {
  const rootLayout = read("app/layout.tsx");
  assert.match(rootLayout, /template:\s*`%s \| \$\{SITE_NAME\}`/);
  assert.match(rootLayout, /default:\s*`\$\{SITE_NAME\} \| Everyday Apparel/);
});
