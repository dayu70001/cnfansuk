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
const helperSource = fs.readFileSync(path.join(root, "lib/productGallery.ts"), "utf8");
const detailSource = fs.readFileSync(path.join(root, "components/ProductDetailClient.tsx"), "utf8");
const cssSource = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const compiledHelper = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
runInNewContext(compiledHelper, { exports: helperModule.exports, module: helperModule });
const { clampGalleryIndex, getAdjacentGalleryIndex, getNearestGalleryIndex } = helperModule.exports;

test("gallery indexes clamp at first and last images instead of looping", () => {
  assert.equal(getAdjacentGalleryIndex(0, -1, 4), 0);
  assert.equal(getAdjacentGalleryIndex(3, 1, 4), 3);
  assert.equal(getAdjacentGalleryIndex(1, -1, 4), 0);
  assert.equal(getAdjacentGalleryIndex(1, 1, 4), 2);
  assert.equal(clampGalleryIndex(9, 4), 3);
  assert.equal(clampGalleryIndex(-4, 4), 0);
  assert.equal(clampGalleryIndex(3, 0), 0);
});

test("mobile carousel resolves the closest measured snap offset", () => {
  assert.equal(getNearestGalleryIndex(0, [0, 368, 736]), 0);
  assert.equal(getNearestGalleryIndex(353, [0, 368, 736]), 1);
  assert.equal(getNearestGalleryIndex(736, [0, 368, 736]), 2);
  assert.equal(getNearestGalleryIndex(999, [0, 368, 736]), 2);
  assert.equal(getNearestGalleryIndex(100, []), 0);
  assert.equal(getNearestGalleryIndex(Number.NaN, [0, 368]), 0);
});

test("product gallery hides single-image controls and exposes bounded, synchronized controls", () => {
  assert.match(detailSource, /galleryItems\.length > 1/);
  assert.match(detailSource, /currentIndex > 0 \? \(\s*<button className="pdp-gallery-arrow previous"/);
  assert.match(detailSource, /currentIndex < galleryItems\.length - 1 \? \(\s*<button className="pdp-gallery-arrow next"/);
  assert.match(detailSource, /onClick=\{showPrevious\}/);
  assert.match(detailSource, /onClick=\{showNext\}/);
  assert.match(detailSource, /getNearestGalleryIndex\(target\.scrollLeft, snapOffsets\)/);
  assert.doesNotMatch(detailSource, /scrollLeft\s*\/\s*target\.clientWidth/);
  assert.doesNotMatch(detailSource, /\.slice\(0,\s*9\)/);
  assert.doesNotMatch(detailSource, /galleryLabels|>Front<|>Back</);
});

test("main image arrows remain visible on mobile without adding image width", () => {
  assert.match(detailSource, /className="pdp-gallery-arrow previous"[\s\S]*<svg/);
  assert.match(detailSource, /className="pdp-gallery-arrow next"[\s\S]*<svg/);
  assert.match(cssSource, /\.pdp-gallery-arrow\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/);
  assert.match(cssSource, /\.pdp-gallery-arrow::before\s*\{[\s\S]*inset:\s*4px;/);
  assert.match(cssSource, /\.pdp-gallery-arrow\.previous\s*\{\s*left:\s*12px;/);
  assert.match(cssSource, /\.pdp-gallery-arrow\.next\s*\{\s*right:\s*12px;/);
  assert.doesNotMatch(cssSource, /\.pdp-gallery-arrow\s*\{\s*display:\s*none/);
  assert.match(detailSource, /event\.stopPropagation\(\);\s*setActiveIndex\(\(index\) => getAdjacentGalleryIndex/);
  assert.doesNotMatch(detailSource, /pdp-thumbs|pdp-thumb/);
  assert.doesNotMatch(cssSource, /\.pdp-thumbs|\.pdp-thumb/);
});

test("image preview has native dialog semantics, keyboard controls, and touch-swipe handling", () => {
  assert.match(detailSource, /<dialog[\s\S]*className="pdp-lightbox"/);
  assert.match(detailSource, /dialog\.showModal\(\)/);
  assert.match(detailSource, /event\.key === "Escape"|onCancel=/);
  assert.match(detailSource, /event\.key === "ArrowLeft"/);
  assert.match(detailSource, /event\.key === "ArrowRight"/);
  assert.match(detailSource, /handleLightboxTouchStart/);
  assert.match(detailSource, /handleLightboxTouchEnd/);
  assert.match(detailSource, /suppressMainImageClickRef/);
  assert.match(detailSource, /zoomReturnFocusRef\.current\.focus\(\{ preventScroll: true \}\)/);
  assert.match(detailSource, /document\.body\.style\.overflow = "hidden"/);
});

test("product detail imagery uses a square cropped viewport while the lightbox contains the full source image", () => {
  assert.match(cssSource, /\.pdp-main-track \.pdp-image img\s*\{\s*object-fit:\s*cover;/);
  assert.match(cssSource, /\.pdp-lightbox-stage img\s*\{[\s\S]*object-fit:\s*contain;/);
  assert.match(cssSource, /\.pdp-main-viewport\s*\{[\s\S]*aspect-ratio:\s*1 \/ 1;[\s\S]*background:\s*var\(--paper\);/);
  assert.match(cssSource, /\.pdp-main-viewport\s*\{\s*width:\s*100%;\s*aspect-ratio:\s*1 \/ 1;/);
  assert.doesNotMatch(detailSource, /imageAspectRatios|pdp-image-ratio|setGalleryImageAspectRatio/);
  assert.doesNotMatch(cssSource, /\.pdp-image-1\s*\{\s*background:\s*linear-gradient/);
  assert.doesNotMatch(cssSource, /\.pdp-image span\s*\{/);
  assert.doesNotMatch(cssSource, /max-height:\s*min\(760px,\s*calc\(100vh - 180px\)\)/);
  assert.match(cssSource, /overflow:\s*hidden;[\s\S]*scroll-snap-type:\s*x mandatory/);
});

test("confirmed Off-White detail styling is shared by all products and mobile dots are removed", () => {
  assert.doesNotMatch(detailSource, /isOffWhiteVisualTest|pdp-experiment-offwhite/);
  assert.doesNotMatch(cssSource, /pdp-experiment-offwhite|\.pdp-dots/);
  assert.doesNotMatch(detailSource, /pdp-dots/);
  assert.match(detailSource, /<section className="pdp wrap">/);
  assert.match(detailSource, /title="Product details"/);
  assert.match(detailSource, /title="Size & fit"/);
  assert.match(cssSource, /\.pdp-info h1\s*\{[\s\S]*font-size:\s*25px;[\s\S]*font-weight:\s*500;[\s\S]*line-height:\s*1\.3;/);
  assert.match(cssSource, /\.pdp-info h1\s*\{\s*margin-bottom:\s*12px;\s*font-size:\s*19px;\s*line-height:\s*1\.35;/);
});

test("all product detail purchase buttons share one responsive layout and keep existing handlers", () => {
  assert.match(detailSource, /const purchaseActions = \([\s\S]*?<button className="btn btn-solid pdp-action" type="button" onClick=\{handleAddToCart\}>\s*Add to cart\s*<\/button>[\s\S]*?<button className="btn pdp-action" type="button" onClick=\{orderNow\}>\s*Order now\s*<\/button>[\s\S]*?\);/);
  assert.match(detailSource, /<div className="pdp-purchase-actions">\{purchaseActions\}<\/div>/);
  assert.match(cssSource, /\.pdp-purchase-actions\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*8px;/);
  assert.match(cssSource, /\.pdp-purchase-actions\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);\s*gap:\s*10px;/);
  assert.match(cssSource, /\.pdp-action\s*\{[\s\S]*?height:\s*50px;[\s\S]*?font-size:\s*15px;[\s\S]*?font-weight:\s*600;/);
  assert.match(cssSource, /\.pdp-action\s*\{[\s\S]*?white-space:\s*nowrap;/);
  assert.match(detailSource, /if \(!size\)\s*\{\s*setSizeError\(true\);\s*return false;/);
});

test("desktop product gallery is square, capped at 540px, thumbnail-free, and keeps purchase actions in two columns", () => {
  const desktopRules = [...cssSource.matchAll(/@media \(min-width: 861px\) \{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((rules) => rules.includes(".pdp-gallery")) || "";
  assert.match(desktopRules, /\.pdp-gallery\s*\{\s*width:\s*min\(100%,\s*540px\);\s*justify-self:\s*center;\s*align-self:\s*start;/);
  assert.match(cssSource, /\.pdp-main-viewport\s*\{\s*width:\s*100%;\s*aspect-ratio:\s*1 \/ 1;/);
  assert.doesNotMatch(detailSource, /pdp-thumbs|pdp-thumb/);
  assert.doesNotMatch(cssSource, /\.pdp-thumbs|\.pdp-thumb/);
  assert.match(desktopRules, /\.pdp-purchase-actions\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);\s*gap:\s*10px;/);
  assert.match(desktopRules, /\.pdp-action\s*\{\s*min-width:\s*0;\s*padding-inline:\s*6px;\s*white-space:\s*nowrap;/);
});

test("desktop image progress segments follow the valid gallery images and current index only", () => {
  assert.match(detailSource, /galleryItems\.length > 1 \? \(\s*<div className="pdp-gallery-progress" role="img"/);
  assert.match(detailSource, /galleryItems\.map\(\(_, index\) => \(\s*<span\s*className=\{index === currentIndex \? "pdp-gallery-progress-segment is-active" : "pdp-gallery-progress-segment"\}/);
  assert.match(detailSource, /aria-label=\{`Image \$\{currentIndex \+ 1\} of \$\{galleryItems\.length\}`\}/);
  assert.doesNotMatch(detailSource, /progressIndex|setProgress|progressState/);
  assert.match(cssSource, /\.pdp \.pdp-gallery-progress\s*\{\s*display:\s*none;/);
  const desktopRules = [...cssSource.matchAll(/@media \(min-width: 861px\) \{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((rules) => rules.includes(".pdp-gallery")) || "";
  assert.match(desktopRules, /\.pdp \.pdp-gallery-progress\s*\{\s*display:\s*flex;\s*width:\s*100%;\s*gap:\s*6px;\s*margin-top:\s*12px;/);
  assert.match(desktopRules, /\.pdp-gallery-progress-segment\s*\{[\s\S]*height:\s*3px;[\s\S]*border-radius:\s*3px;[\s\S]*background:\s*#dedad4;/);
  assert.match(desktopRules, /\.pdp-gallery-progress-segment\.is-active\s*\{\s*background:\s*#272623;/);
});

test("mobile PDP spacing follows the compact sample rhythm and accordions stay 48–52px tall", () => {
  assert.match(cssSource, /\.pdp\s*\{[\s\S]*--pdp-line:\s*#dfdbd4;[\s\S]*padding-top:\s*48px;[\s\S]*padding-bottom:\s*72px;/);
  assert.match(cssSource, /\.pdp\s*\{\s*display:\s*block;\s*padding-top:\s*12px;\s*padding-bottom:\s*24px;/);
  assert.match(cssSource, /\.pdp-gallery\s*\{\s*margin:\s*0 0 12px;/);
  assert.match(cssSource, /\.pdp-info \.eyebrow\s*\{\s*margin:\s*0 0 6px;/);
  assert.match(cssSource, /\.pdp-info h1\s*\{\s*margin-bottom:\s*12px;/);
  assert.match(cssSource, /\.pdp-price\s*\{\s*margin-bottom:\s*18px;/);
  assert.match(cssSource, /\.pdp-size-grid\s*\{[\s\S]*?gap:\s*6px;\s*margin-top:\s*8px;/);
  assert.match(cssSource, /\.pdp-quantity\s*\{[\s\S]*?margin-bottom:\s*12px;/);
  assert.match(cssSource, /\.pdp-accordion-item > button\s*\{[\s\S]*?min-height:\s*50px;/);
});
