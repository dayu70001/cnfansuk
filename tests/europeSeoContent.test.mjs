import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const compact = (value) => value.replace(/\s+/g, " ");
const status = read("app/cnfans-status/page.tsx");
const alternative = read("app/cnfans-alternative/page.tsx");
const delivery = read("app/delivery/page.tsx");
const about = read("app/about/page.tsx");
const spreadsheet = read("app/cnfans-spreadsheet/page.tsx");
const guides = read("app/guides/page.tsx");
const seoPage = read("lib/seoPage.ts");
const sitemap = read("lib/sitemap.ts");
const phaseFour = read("lib/phaseFourGuides.ts");

const routes = ["/cnfans-status", "/cnfans-alternative"];

test("new status and alternative routes use unique metadata, self-canonicals and sitemap/index entries", () => {
  assert.match(status, /path:\s*"\/cnfans-status"/);
  assert.match(status, /title:\s*"Is CNFans Down\? Website Status & Updates"/);
  assert.match(status, /<h1>Is CNFans Down\? What We Know About the Website Status<\/h1>/);
  assert.match(alternative, /path:\s*"\/cnfans-alternative"/);
  assert.match(alternative, /title:\s*"CNFans Alternative for Clothing Shoppers in the UK & Europe"/);
  assert.match(alternative, /<h1>A CNFans Alternative for Direct Clothing Shopping<\/h1>/);
  assert.match(seoPage, /function buildGuideMetadata/);
  assert.match(seoPage, /const canonical = `\$\{SITE_URL\}\$\{path\}`/);

  for (const route of routes) {
    assert.equal((sitemap.match(new RegExp(`"${route}"`, "g")) || []).length, 1, `${route} appears once in the sitemap manifest`);
    assert.ok(seoPage.includes(`path: "${route}"`), `${route} is included in the Guides schema index`);
    assert.ok(guides.includes(`href: "${route}"`), `${route} is visible in the Guides index`);
  }
});

test("status copy is dated, source-qualified and does not infer shutdown or official succession", () => {
  assert.match(status, /const checkedDate = "2026-11-28"/);
  assert.match(status, /Last checked:/);
  assert.match(status, /https:\/\/cnfans\.com\//);
  assert.match(compact(status), /returned a 502 Bad Gateway/);
  assert.match(compact(status), /does not establish whether other visitors can connect/);
  assert.match(status, /We could not verify an official status announcement/);
  assert.match(status, /is not an official replacement or successor/);
  assert.doesNotMatch(status, /CNFans\.com (?:has|is) (?:permanently )?shut down\./i);
  assert.doesNotMatch(status, /The New Official CNFans Website|Authorised Successor/);
});

test("alternative page states the independent clothing model and qualified order facts", () => {
  const alternativeText = compact(alternative);
  for (const phrase of [
    "independent clothing retailer",
    "own factory",
    "family factories",
    "manufacturing partners",
    "Retail orders start from one item",
    "added weekly",
    "2–3 working days",
    "item has been made or prepared",
    "cannot guarantee an identical",
    "starts from £5",
    "€5 across eligible European destinations",
    "not guaranteed delivery dates",
    "discounts and discuss custom clothing requests",
    "review before dispatch",
  ]) assert.ok(alternativeText.includes(phrase), `alternative page contains: ${phrase}`);

  assert.match(alternative, /<h2>Frequently Asked Questions<\/h2>/);
  assert.match(alternative, /@type": "FAQPage"/);
  assert.match(alternative, /<caption>Direct shopping and purchasing-agent services have different order processes<\/caption>/);
  assert.match(alternativeText, /Can I order just one item/i);
  assert.match(alternativeText, /Can I cancel an order before it is dispatched/i);
  assert.match(alternativeText, /Can I exchange an item for another size/i);
  assert.match(alternativeText, /carrier confirms my parcel is lost/i);
  assert.match(alternativeText, /correct return address/i);
  assert.match(alternativeText, /independent clothing retailer, not CNFans\.com or an official replacement/);
});

test("delivery FAQ is visible, schema-backed and keeps costs, transit and tax scope qualified", () => {
  assert.match(delivery, /const deliveryQuestions = \[/);
  assert.match(delivery, /@type": "FAQPage"/);
  assert.match(delivery, /What should I do if a parcel appears to be lost\?/);
  assert.match(delivery, /Does CNFANS UK ship to Europe\?/);
  assert.match(delivery, /Standard delivery starts from £5 in the UK and €5 across eligible European destinations/);
  assert.match(delivery, /GBP merchandise subtotal of £180 or more/);
  assert.match(delivery, /EUR merchandise subtotal of €180 or more/);
  assert.match(delivery, /FedEx Priority is priced separately and does not qualify/);
  assert.match(delivery, /7–12 working days after dispatch/);
  assert.match(delivery, /9–15 working days/);
  assert.match(compact(delivery), /VAT and customs duties are included on eligible European delivery routes/);
  assert.match(delivery, /getLastMileCarrier\(countryCode\)/);
  assert.match(delivery, /lastMileDestinations = \[/);
  assert.equal((delivery.match(/\["(?:United Kingdom|Netherlands|Germany|Ireland|Italy|France|Spain|Portugal|Poland|Belgium|United States|Estonia|Lithuania|Latvia|Cyprus|Hungary|Romania|Greece|Malta|Slovenia|Sweden|Slovakia|Bulgaria|Croatia|Finland|Luxembourg|Austria|Denmark|Czechia)", "[A-Z]{2}"\]/g) || []).length, 29);
});

test("spreadsheet, dead-link, Reddit and About copy connect the topic cluster without invented community claims", () => {
  for (const route of ["/cnfans-alternative", "/cnfans-status", "/cnfans-dead-links", "/cnfans-finds", "/delivery"]) {
    assert.ok(spreadsheet.includes(`href="${route}"`), `spreadsheet links to ${route}`);
  }
  assert.match(phaseFour, /CNFans Links Not Working\? Spreadsheet & Product Link Help/);
  assert.match(phaseFour, /href=\\"\/cnfans-status\\"/);
  assert.match(phaseFour, /href=\\"\/cnfans-alternative\\"/);
  assert.match(phaseFour, /Reddit replies are individual experiences/);
  assert.doesNotMatch(phaseFour, /This guide does not quote Reddit users or claim community consensus/);
  assert.match(about, /independent clothing retailer serving customers across the UK and Europe/);
  assert.match(about, /Factory-Direct Clothing for the UK &amp; Europe/);
  assert.match(compact(about), /not CNFans\.com or an official replacement/);
  assert.match(compact(about), /after your item has been made or prepared/i);
});
