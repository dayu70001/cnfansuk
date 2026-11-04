import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const helperSource = fs.readFileSync(path.join(root, "lib/whatsappChannelPopup.ts"), "utf8");
const popupSource = fs.readFileSync(path.join(root, "components/WhatsAppChannelPopup.tsx"), "utf8");
const popupCss = fs.readFileSync(path.join(root, "components/WhatsAppChannelPopup.module.css"), "utf8");
const detailSource = fs.readFileSync(path.join(root, "components/ProductDetailClient.tsx"), "utf8");
const channelSource = fs.readFileSync(path.join(root, "components/channel/ChannelLandingPage.tsx"), "utf8");
const channelCss = fs.readFileSync(path.join(root, "app/channel/channel.module.css"), "utf8");
const layoutSource = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
const globalCss = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const settingsSource = fs.readFileSync(path.join(root, "data/site-settings.json"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const compiledHelper = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
runInNewContext(compiledHelper, { exports: helperModule.exports, module: helperModule, URL });
const {
  CHANNEL_POPUP_COOLDOWNS,
  getChannelPopupPage,
  getEligibleChannelPopupTrigger,
  isChannelPopupCoolingDown,
  shouldRenderChannelPopup,
  isValidWhatsAppChannelUrl,
} = helperModule.exports;

test("first product requires 15 seconds and real engagement", () => {
  const base = { pageType: "product", productVisitIndex: 0, activeMs: 14_999, productEngaged: true };
  assert.equal(getEligibleChannelPopupTrigger(base), null);
  assert.equal(getEligibleChannelPopupTrigger({ ...base, activeMs: 15_000, productEngaged: false }), null);
  assert.equal(getEligibleChannelPopupTrigger({ ...base, activeMs: 15_000 }), "product_engaged");
});

test("second distinct product triggers after 8 seconds, not immediately", () => {
  assert.equal(getEligibleChannelPopupTrigger({ pageType: "product", productVisitIndex: 1, activeMs: 7_999 }), null);
  assert.equal(getEligibleChannelPopupTrigger({ pageType: "product", productVisitIndex: 1, activeMs: 8_000 }), "second_product");
  assert.equal(getEligibleChannelPopupTrigger({ pageType: "product", productVisitIndex: 0, activeMs: 60_000 }), null);
});

test("successful add-to-cart eligibility waits 8 seconds and takes precedence", () => {
  const base = { pageType: "product", productVisitIndex: 0, activeMs: 90_000, productEngaged: true };
  assert.equal(getEligibleChannelPopupTrigger({ ...base, postAddToCartElapsedMs: 7_999 }), "product_engaged");
  assert.equal(getEligibleChannelPopupTrigger({ ...base, postAddToCartElapsedMs: 8_000 }), "post_add_to_cart");
  assert.equal(getEligibleChannelPopupTrigger({ ...base, productVisitIndex: 1, postAddToCartElapsedMs: 8_000 }), "post_add_to_cart");
});

test("homepage requires 30 active seconds and an actual product-area browse", () => {
  assert.equal(getEligibleChannelPopupTrigger({ pageType: "home", activeMs: 29_999, homeScrolledProductArea: true }), null);
  assert.equal(getEligibleChannelPopupTrigger({ pageType: "home", activeMs: 30_000, homeScrolledProductArea: false }), null);
  assert.equal(getEligibleChannelPopupTrigger({ pageType: "home", activeMs: 30_000, homeScrolledProductArea: true }), "home_engaged");
});

test("only home and a single product route are eligible; checkout/cart/admin are excluded", () => {
  assert.equal(getChannelPopupPage("/"), "home");
  assert.equal(getChannelPopupPage("/product/example-item"), "product");
  for (const route of ["/checkout", "/cart", "/admin/orders", "/login", "/channel", "/product"]) {
    assert.equal(getChannelPopupPage(route), null);
  }
});

test("channel URL validation accepts the configured public channel and rejects private or placeholder URLs", () => {
  const configured = JSON.parse(settingsSource).links.whatsappChannelUrl;
  assert.equal(isValidWhatsAppChannelUrl(configured), true);
  assert.equal(isValidWhatsAppChannelUrl("https://whatsapp.com/channel/PLACEHOLDER"), false);
  assert.equal(isValidWhatsAppChannelUrl("https://wa.me/447700900000"), false);
  assert.equal(isValidWhatsAppChannelUrl("http://whatsapp.com/channel/0029Vb7eg1jDZ4LU1XMbt630"), false);
  assert.equal(isValidWhatsAppChannelUrl("https://example.com/channel/0029Vb7eg1jDZ4LU1XMbt630"), false);
});

test("shown, closed, and clicked outcomes have 7, 14, and 30 day cooldowns", () => {
  const day = 24 * 60 * 60 * 1000;
  assert.equal(CHANNEL_POPUP_COOLDOWNS.shown, 7 * day);
  assert.equal(CHANNEL_POPUP_COOLDOWNS.closed, 14 * day);
  assert.equal(CHANNEL_POPUP_COOLDOWNS.clicked, 30 * day);
  assert.equal(isChannelPopupCoolingDown({ outcome: "shown", at: 1_000 }, 1_000 + 7 * day - 1), true);
  assert.equal(isChannelPopupCoolingDown({ outcome: "closed", at: 1_000 }, 1_000 + 14 * day), false);
  assert.equal(isChannelPopupCoolingDown({ outcome: "clicked", at: 1_000 }, 1_000 + 30 * day - 1), true);
  assert.equal(isChannelPopupCoolingDown({ outcome: "unknown", at: 1_000 }, 1_001), false);
});

test("a shown popup is temporarily hidden by a real blocker and restores without dismissing", () => {
  assert.equal(shouldRenderChannelPopup(false, false), false);
  assert.equal(shouldRenderChannelPopup(true, false), true);
  assert.equal(shouldRenderChannelPopup(true, true), false);
  assert.equal(shouldRenderChannelPopup(true, false), true);
  assert.match(popupSource, /const nextSuppressed = isOpen \|\| hasOpenBlocker\(\)/);
  assert.doesNotMatch(popupSource, /setPopupVisible\(false\);\s*\n\s*trackPopupEvent\("channel_popup_close"/);
});

test("buying-control overlap no longer delays or hides a triggered popup", () => {
  assert.doesNotMatch(popupSource, /overlapsBuyingControls|BUYING_CONTROL_SELECTOR|popupRectsOverlap|rectIntersectsViewport/);
  assert.doesNotMatch(popupSource, /recentBuyingAction|lastBuyingActionAt/);
  assert.match(popupSource, /if \(isOpen \|\| hasOpenBlocker\(\)\) return/);
  assert.match(popupSource, /const nextSuppressed = isOpen \|\| hasOpenBlocker\(\)/);
  assert.match(popupSource, /focused\.closest\("\.pdp-size-grid, \.pdp-quantity, \.pdp-purchase-actions"\)/);
});

test("the popup only waits for real blockers and scrolling cannot hide or repeatedly expose it", () => {
  assert.match(popupSource, /if \(isOpen \|\| hasOpenBlocker\(\)\) return/);
  assert.match(popupSource, /const nextSuppressed = isOpen \|\| hasOpenBlocker\(\)/);
  assert.doesNotMatch(popupSource, /addEventListener\("scroll", update/);
  assert.doesNotMatch(popupSource, /removeEventListener\("scroll", update/);
  assert.match(popupSource, /if \(nextSuppressed !== suppressionRef\.current\)/);
  assert.match(popupSource, /if \(clockFrame !== null \|\| sessionShownRef\.current\) return/);
  assert.match(popupSource, /requestAnimationFrame\(\(\) => \{/);
  assert.match(popupSource, /setTemporarilySuppressed\(nextSuppressed\)/);
  assert.equal((popupSource.match(/trackPopupEvent\("channel_popup_view"/g) || []).length, 1);
  assert.match(popupSource, /setTemporarilySuppressed\(false\);\s*setPopupVisible\(true\);\s*trackPopupEvent\("channel_popup_view"/);
});

test("popup body contains the approved subtitle and three concise feature rows", () => {
  assert.match(popupSource, /Explore our WhatsApp Channel/);
  assert.match(popupSource, /Daily real-product videos/);
  assert.match(popupSource, /Real customer feedback/);
  assert.match(popupSource, /Fresh updates every day/);
  assert.equal((popupSource.match(/className=\{styles\.features\}/g) || []).length, 1);
  assert.equal((popupSource.match(/<li>/g) || []).length, 3);
  assert.match(popupSource, /Watch on WhatsApp/);
  assert.doesNotMatch(popupSource, /Chat on Whatsapp|Chat on WhatsApp/);
  assert.match(popupCss, /\.features\s*\{/);
  assert.match(popupCss, /\.features li\s*\{/);
  assert.match(popupCss, /\.features svg\s*\{/);
});

test("active time uses Page Visibility, and route timers/listeners are cleaned up", () => {
  assert.match(popupSource, /document\.visibilityState === "visible"/);
  assert.match(popupSource, /document\.addEventListener\("visibilitychange"/);
  assert.match(popupSource, /window\.setInterval\(advanceClock, 1_000\)/);
  assert.match(popupSource, /window\.clearInterval\(timer\)/);
  assert.match(popupSource, /document\.removeEventListener\("visibilitychange"/);
  assert.match(popupSource, /window\.removeEventListener\(CHANNEL_POPUP_CART_ADD_EVENT/);
});

test("the default local dev script uses the stable Webpack compiler", () => {
  assert.match(packageJson.scripts.dev, /next dev --webpack/);
});

test("channel page body styling remains scoped through its local CSS module class", () => {
  assert.match(channelCss, /:global\(body\):has\(\.channelPage\)\s*\{[^}]*background:\s*#f5f7fb/);
  assert.match(channelCss, /:global\(body\):has\(\.channelPage\) :global\(main\)/);
  assert.doesNotMatch(channelCss, /:global\(body:has\(/);
});

test("the product visit list prevents refresh or browser history on the same slug counting as another product", () => {
  assert.match(popupSource, /seenProducts\.indexOf\(productSlug\)/);
  assert.match(popupSource, /seenProducts\.push\(productSlug\)/);
  assert.match(popupSource, /CHANNEL_POPUP_SEEN_PRODUCTS_KEY/);
  assert.match(popupSource, /CHANNEL_POPUP_SESSION_SHOWN_KEY/);
  assert.match(popupSource, /setItem\(CHANNEL_POPUP_SESSION_SHOWN_KEY, "1"\)/);
});

test("only successful Add to cart emits the local trigger; Order now remains unchanged", () => {
  const addHandler = detailSource.match(/function handleAddToCart\(event\?: MouseEvent<HTMLButtonElement>\) \{[\s\S]*?\n  \}\n\n  function orderNow/);
  assert.ok(addHandler);
  assert.match(addHandler[0], /if \(addSelectedItem\(true\)\)/);
  assert.match(addHandler[0], /window\.dispatchEvent\(new CustomEvent\(CHANNEL_POPUP_CART_ADD_EVENT/);
  const orderNow = detailSource.match(/function orderNow\(event: MouseEvent<HTMLButtonElement>\) \{[\s\S]*?\n  \}/);
  assert.ok(orderNow);
  assert.doesNotMatch(orderNow[0], /CHANNEL_POPUP_CART_ADD_EVENT/);
  assert.match(popupSource, /customEvent\.detail\.productSlug === visit\.productSlug/);
});

test("blocking drawers, lightbox, and active form fields postpone display, not product controls", () => {
  assert.match(popupSource, /\.cart-drawer\.open, \.desktop-filter-drawer\.open, \.pdp-lightbox\[open\]/);
  assert.match(popupSource, /HTMLInputElement \|\| focused instanceof HTMLTextAreaElement \|\| focused instanceof HTMLSelectElement/);
  assert.match(popupSource, /focused\.closest\("\.pdp-size-grid, \.pdp-quantity, \.pdp-purchase-actions"\)/);
  assert.match(popupSource, /if \(isOpen \|\| hasOpenBlocker\(\)\) return/);
  assert.match(popupSource, /popup\.pathname !== pathname/);
});

test("the CTA reuses the existing WhatsApp logo path and matches the reference button design", () => {
  const existingPath = channelSource.match(/function WhatsAppIcon\(\) \{[\s\S]*?<path d="([^"]+)" \/>/)?.[1];
  const cta = popupSource.match(/className=\{styles\.cta\}[\s\S]*?<\/a>/)?.[0];
  const ctaPath = cta?.match(/<path d="([^"]+)" \/>/)?.[1];
  assert.ok(existingPath, "expected the existing WhatsApp logo in the channel landing page");
  assert.equal(ctaPath, existingPath);
  assert.match(cta || "", /<span>Watch on WhatsApp<\/span>/);
  assert.match(popupCss, /linear-gradient\(135deg,\s*#25d366\s+0%,\s*#128c7e\s+100%\)/);
  assert.match(popupCss, /border-radius:\s*8px/);
  assert.match(popupCss, /min-height:\s*42px/);
  assert.match(popupCss, /gap:\s*8px/);
  assert.match(popupCss, /width:\s*20px/);
  assert.match(popupCss, /box-shadow:\s*0 4px 12px rgba\(37, 211, 102, 0\.3\)/);
});

test("mobile CTA keeps its existing size and holds the full label on one line", () => {
  const mobileStart = popupCss.indexOf("@media (max-width: 860px)");
  assert.notEqual(mobileStart, -1);
  const desktopCss = popupCss.slice(0, mobileStart);
  const mobileCss = popupCss.slice(mobileStart).split("@media (prefers-reduced-motion")[0];
  const mobileCta = mobileCss.match(/\.cta\s*\{([^}]*)\}/)?.[1];
  assert.ok(mobileCta, "expected a mobile-only CTA rule");
  assert.match(mobileCta, /flex-wrap:\s*nowrap/);
  assert.match(mobileCta, /white-space:\s*nowrap/);
  assert.match(mobileCta, /min-height:\s*42px/);
  assert.doesNotMatch(mobileCta, /(^|\n)\s*(font-size|gap|padding|width|height):/);
  assert.doesNotMatch(desktopCss.match(/\.cta\s*\{([^}]*)\}/)?.[1] || "", /white-space:|flex-wrap:/);
  assert.match(popupSource, /<span>Watch on WhatsApp<\/span>/);
  assert.match(mobileCss, /width:\s*min\(220px, calc\(100vw - 24px\)\)/);
  assert.match(mobileCss, /height:\s*293px/);
});

test("popup links use the configured channel and analytics helper without loading another GA tag", () => {
  assert.match(layoutSource, /fetchSiteSettings\(\)/);
  assert.match(layoutSource, /<WhatsAppChannelPopup channelUrl=\{links\.whatsappChannelUrl\}/);
  assert.match(layoutSource, /<CartProvider>[\s\S]*<WhatsAppChannelPopup/);
  assert.match(popupSource, /trackGoogleAnalyticsEvent\(eventName, \{/);
  for (const event of ["channel_popup_view", "channel_popup_click", "channel_popup_close", "channel_popup_to_whatsapp"]) {
    assert.ok(popupSource.includes(`"${event}"`), `missing ${event}`);
  }
  assert.match(popupSource, /click_target: clickTarget/);
  assert.match(popupSource, /page_type: popup\.pageType/);
  assert.match(popupSource, /device_type: getDeviceType\(\)/);
  assert.doesNotMatch(popupSource, /googletagmanager\.com|from ['"]next\/script['"]/);
  assert.equal((popupSource.match(/href=\{channelUrl\}/g) || []).length, 2);
});

test("unverified video duration is omitted while the channel cover keeps its play affordance", () => {
  assert.doesNotMatch(popupSource, /0:25|styles\.duration/);
  assert.match(popupSource, /className=\{styles\.play\}/);
});

test("desktop/mobile dimensions, safe-area placement, and reduced-motion behavior are scoped to the popup", () => {
  assert.match(popupCss, /width:\s*240px/);
  assert.match(popupCss, /height:\s*320px/);
  assert.match(popupCss, /right:\s*16px/);
  assert.match(popupCss, /bottom:\s*16px/);
  assert.match(popupCss, /@media \(max-width: 860px\)/);
  assert.match(popupCss, /width:\s*min\(220px, calc\(100vw - 24px\)\)/);
  assert.match(popupCss, /height:\s*293px/);
  assert.match(popupCss, /right:\s*calc\(12px \+ env\(safe-area-inset-right, 0px\)\)/);
  assert.match(popupCss, /left:\s*auto/);
  assert.match(popupCss, /env\(safe-area-inset-bottom/);
  assert.match(popupCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(globalCss, /scroll-behavior:\s*auto/);
});

test("storage denial suppresses the popup without throwing into shopping", () => {
  assert.match(popupSource, /function canUseLocalStorage\(\): boolean/);
  assert.match(popupSource, /catch \{\s*return false;/);
  assert.match(popupSource, /if \(!storageReady \|\| !validChannelUrl \|\| !pageType \|\| !popup/);
  assert.match(popupSource, /A storage failure must never interrupt shopping or opening WhatsApp/);
});
