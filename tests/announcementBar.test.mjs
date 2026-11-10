import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const component = fs.readFileSync(path.join(root, "components/AnnouncementBar.tsx"), "utf8");
const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const settings = JSON.parse(fs.readFileSync(path.join(root, "data/site-settings.json"), "utf8"));

test("homepage announcement uses channel content while other routes keep the existing message", () => {
  assert.match(component, /const isHomepage = pathname === "\/"/);
  assert.match(component, /Real product videos &amp; daily updates/);
  assert.match(component, /Daily product videos ·/);
  assert.match(component, /Join WhatsApp Channel ↗/);
  assert.match(component, /Join Channel ↗/);
  assert.match(component, /New season styles now in/);
  assert.match(layout, /<AnnouncementBar channelUrl=\{links\.whatsappChannelUrl\} \/>/);
});

test("announcement links to the configured WhatsApp Channel without nesting interactive elements", () => {
  assert.equal(settings.links.whatsappChannelUrl, "https://whatsapp.com/channel/0029Vb7eg1jDZ4LU1XMbt630");
  assert.match(component, /href=\{channelUrl\}/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /aria-label="Join the CNFans WhatsApp Channel"/);
  assert.doesNotMatch(component, /<a[\s\S]*?<a/);
});

test("homepage announcement keeps the compact black bar and adapts its copy at the mobile breakpoint", () => {
  assert.match(css, /\.announce-home\s*\{[^}]*display:\s*flex;[^}]*white-space:\s*nowrap;/s);
  assert.match(css, /\.announce-home\s*\{[^}]*color:\s*#fff;/s);
  assert.match(css, /\.announce-channel-link\s*\{[^}]*color:\s*#4ade80/s);
  assert.match(css, /\.announce-channel-link:focus-visible\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*860px\)[\s\S]*?\.announce-copy-desktop\s*\{\s*display:\s*none/s);
  assert.match(css, /\.announce-channel-link::after\s*\{[^}]*inset:\s*0;/s);
  assert.match(css, /\.announce\s*\{\s*padding:\s*calc\(10px \+ env\(safe-area-inset-top\)\) 16px 10px;/);
});
