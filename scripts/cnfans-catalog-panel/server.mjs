import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const statePath = join(__dirname, "data", "state.json");
const scanRoot = join(__dirname, "tmp", "scans");
const legacyRepoRoot = "/Users/linmuse/Developer/linmuse";
const legacyRequire = createRequire(join(legacyRepoRoot, "package.json"));
const port = Number(process.env.PORT || 5071);
const host = "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

async function readState() {
  if (!existsSync(statePath)) {
    return {};
  }
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function writeState(state) {
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(text);
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(raw, baseUrl) {
  if (!raw || String(raw).startsWith("data:") || String(raw).startsWith("blob:")) return "";
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return "";
  }
}

function getCostFromTitle(title) {
  const match = String(title || "").match(/p\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function cnfansRound(value) {
  if (!Number.isFinite(value)) return null;
  const whole = Math.floor(value);
  const firstDecimal = Math.floor((value - whole) * 10 + 0.000001);
  return firstDecimal >= 6 ? whole + 1 : whole;
}

function calculatePrices(costCny) {
  if (!Number.isFinite(costCny)) {
    return { saleCny: null, GBP: null, EUR: null, USD: null };
  }
  const saleCnyRaw = costCny * 1.8;
  return {
    saleCny: cnfansRound(saleCnyRaw),
    GBP: cnfansRound(saleCnyRaw / 9),
    EUR: cnfansRound(saleCnyRaw / 8),
    USD: cnfansRound(saleCnyRaw / 7),
  };
}

function rawPriceText(title) {
  const match = String(title || "").match(/p\s*(\d+)/i);
  return match ? `p${match[1]}` : "";
}

function hasPriceMarker(title) {
  return /p\s*\d+/i.test(String(title || ""));
}

async function collectListingCandidates(page, sourceUrl, maxScan) {
  const candidates = await page.evaluate((baseUrl) => {
    const absolute = (raw) => {
      if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return "";
      try {
        return new URL(raw, baseUrl).toString();
      } catch {
        return "";
      }
    };
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const textOf = (element) => {
      const ownText = clean(element.textContent);
      const attrText = [
        element.getAttribute("aria-label") || "",
        element.getAttribute("title") || "",
        element.getAttribute("data-title") || "",
        element.getAttribute("data-name") || "",
        ...Array.from(element.querySelectorAll("img"))
          .map((img) => img.alt || img.getAttribute("title") || img.getAttribute("aria-label") || ""),
      ].join(" ").replace(/\s+/g, " ").trim();
      return ownText || attrText;
    };
    const isRealProductImage = (img) => {
      const src = img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original") || "";
      const meta = [src, img.alt || ""].join(" ").toLowerCase();
      const badWords = ["album_bg", "minicode", "avatar", "logo", "qrcode", "wechat", "banner", "background", "icon", "profile", "watermark", "video", "poster", "share", "header"];
      if (badWords.some((word) => meta.includes(word))) return false;
      const rect = img.getBoundingClientRect();
      const width = img.naturalWidth || rect.width || 0;
      const height = img.naturalHeight || rect.height || 0;
      return !(width && height && (width < 80 || height < 80));
    };
    const imageUrlOf = (img) => absolute(img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original") || "");
    const imagesOf = (element) => Array.from(new Set(Array.from(element.querySelectorAll("img"))
      .filter(isRealProductImage)
      .map(imageUrlOf)
      .filter(Boolean)));
    const hrefOf = (element) => {
      const hrefEl = element.matches("a[href]") ? element : element.querySelector("a[href]");
      return absolute(hrefEl ? hrefEl.getAttribute("href") || hrefEl.href || "" : "");
    };
    const isStoreShell = (element, imageUrls = []) => {
      const meta = [
        textOf(element),
        element.className || "",
        element.id || "",
        imageUrls.join(" "),
      ].join(" ").toLowerCase();
      return /瀑布流|商城单图列表|我的店铺|店铺已全新装修|欢迎光临|全部上新|店铺|客服|购物车|layout|navigation|theme|signboard|shopheader/.test(meta);
    };
    const nearestProductCard = (img) => {
      const imgRect = img.getBoundingClientRect();
      let node = img;
      let fallback = null;
      for (let depth = 0; depth < 8 && node; depth += 1, node = node.parentElement) {
        const rect = node.getBoundingClientRect();
        const text = textOf(node);
        const imageUrls = imagesOf(node);
        const widthOk = rect.width >= 80 && rect.width <= Math.min(window.innerWidth, 240);
        const heightOk = rect.height >= 100 && rect.height <= 360;
        const containsImage = imageUrls.includes(imageUrlOf(img));
        if (containsImage && widthOk && heightOk && text.length > 8 && !isStoreShell(node, imageUrls)) {
          return node;
        }
        if (!fallback && containsImage && rect.width >= imgRect.width && rect.height >= imgRect.height && text.length > 8 && !isStoreShell(node, imageUrls)) {
          fallback = node;
        }
      }
      return fallback;
    };

    const preferredSelectors = "[class*=ItemTemplateShop], [class*=item-shop]";
    const fallbackSelectors = "a[href], [onclick], [role=button], li, article, .goods, .product, .item, .card, .album, .pic, div";
    const preferredCards = Array.from(document.querySelectorAll(preferredSelectors));
    const sourceCards = preferredCards.length ? preferredCards : Array.from(document.querySelectorAll(fallbackSelectors));

    const cardCandidates = sourceCards
      .map((element, domIndex) => ({ element, domIndex }))
      .filter(({ element }) => {
        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const imageUrls = imagesOf(element);
        if (top < 80) return false;
        if (isStoreShell(element, imageUrls)) return false;
        if (imageUrls.length > 12) return false;
        return rect.width >= 90 && rect.height >= 90 && imageUrls.length > 0;
      })
      .map(({ element, domIndex }) => {
        const rect = element.getBoundingClientRect();
        return {
          url: hrefOf(element),
          title: textOf(element),
          imageUrls: imagesOf(element),
          domIndex: domIndex + 1,
          x: Math.round(rect.left + window.scrollX),
          y: Math.round(rect.top + window.scrollY),
        };
      });

    const imageCards = Array.from(document.querySelectorAll("img"))
      .filter(isRealProductImage)
      .map((img, domIndex) => ({ img, element: nearestProductCard(img), domIndex }))
      .filter(({ element }) => Boolean(element))
      .map(({ img, element, domIndex }) => {
        const rect = element.getBoundingClientRect();
        const imageUrl = imageUrlOf(img);
        const imageUrls = imagesOf(element);
        return {
          url: hrefOf(element),
          title: textOf(element),
          imageUrls: imageUrls.includes(imageUrl) ? imageUrls : [imageUrl, ...imageUrls].filter(Boolean),
          domIndex: domIndex + 1,
          x: Math.round(rect.left + window.scrollX),
          y: Math.round(rect.top + window.scrollY),
        };
      });

    return [...cardCandidates, ...imageCards]
      .sort((a, b) => {
        const rowA = Math.round(a.y / 12);
        const rowB = Math.round(b.y / 12);
        if (rowA !== rowB) return rowA - rowB;
        if (a.x !== b.x) return a.x - b.x;
        return a.domIndex - b.domIndex;
      });
  }, sourceUrl);

  const seen = new Set();
  const items = [];
  for (const candidate of candidates) {
    const title = cleanText(candidate.title).slice(0, 180);
    if (!hasPriceMarker(title)) continue;
    const imageUrls = Array.from(new Set((candidate.imageUrls || []).map((url) => normalizeUrl(url, sourceUrl)).filter(Boolean)));
    const url = normalizeUrl(candidate.url, sourceUrl) || sourceUrl;
    const key = imageUrls[0] || (url !== sourceUrl ? url : "") || title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ ...candidate, title, url, imageUrls, visualIndex: items.length + 1 });
    if (items.length >= maxScan) break;
  }
  return items;
}

async function scanLatestCandidates({ sourceUrl, sourceName, maxScan, imageLimit }) {
  const safeMaxScan = Math.min(Math.max(Number(maxScan) || 50, 1), 100);
  const safeImageLimit = Math.min(Math.max(Number(imageLimit) || 6, 1), 12);
  const scanId = timestamp();
  const outDir = join(scanRoot, scanId);
  await mkdir(outDir, { recursive: true });

  const { chromium } = legacyRequire("playwright");
  let browser;
  const startedAt = Date.now();
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-crash-reporter", "--disable-crashpad"],
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 CNFans-catalog-panel",
    });
    const freshUrl = new URL(sourceUrl);
    freshUrl.searchParams.set("_lm_fresh", String(Date.now()));
    await page.goto(freshUrl.toString(), { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);

    const merged = [];
    const seen = new Set();
    let stableRounds = 0;
    for (let round = 0; round < 8 && merged.length < safeMaxScan; round += 1) {
      const beforeCount = merged.length;
      const visible = await collectListingCandidates(page, sourceUrl, safeMaxScan);
      for (const candidate of visible) {
        const key = candidate.imageUrls[0] || (candidate.url !== sourceUrl ? candidate.url : "") || candidate.title;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push({ ...candidate, visualIndex: merged.length + 1 });
        if (merged.length >= safeMaxScan) break;
      }
      if (merged.length === beforeCount) stableRounds += 1;
      else stableRounds = 0;
      if (stableRounds >= 2) break;
      await page.evaluate(() => window.scrollBy(0, Math.max(360, Math.round(window.innerHeight * 0.82)))).catch(() => undefined);
      await page.waitForTimeout(900);
    }

    const items = merged.map((candidate, index) => {
      const title = candidate.title || `未命名候选 ${index + 1}`;
      const costCny = getCostFromTitle(title);
      const prices = calculatePrices(costCny);
      return {
        id: `real-${scanId}-${index + 1}`,
        title,
        description: `${title} 的真实来源候选。当前只扫描列表候选，未采集完整详情。`,
        sourceUrl: candidate.url || sourceUrl,
        imageCount: candidate.imageUrls.length,
        imageUrl: candidate.imageUrls[0] || "",
        rawPriceText: rawPriceText(title),
        detectedCostCny: costCny,
        saleCny: prices.saleCny,
        prices: { GBP: prices.GBP, EUR: prices.EUR, USD: prices.USD },
        status: "真实候选",
        imageStatus: "待验图",
        imageCountType: "listing_cover",
        collectStatus: "待采集",
        category: "新品",
        subcategory: "连帽卫衣",
        sizes: ["M", "L", "XL", "XXL"],
        existsInD1: false,
        duplicate: false,
        sourceName: sourceName || "",
      };
    });

    const snapshot = merged.map((candidate, index) => ({
      visualIndex: index + 1,
      domIndex: candidate.domIndex || index + 1,
      x: candidate.x || 0,
      y: candidate.y || 0,
      title: candidate.title,
      source_album_url: sourceUrl,
      source_product_url: candidate.url,
      cover_image: candidate.imageUrls[0] || "",
      image_count: candidate.imageUrls.length,
    }));
    const report = {
      ok: true,
      sourceUrl,
      sourceName,
      maxScan: safeMaxScan,
      imageLimit: safeImageLimit,
      scannedCount: items.length,
      outDir,
      elapsedMs: Date.now() - startedAt,
    };
    await writeFile(join(outDir, "candidate-order-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    await writeFile(join(outDir, "scan-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { ...report, items, message: `扫描完成，发现 ${items.length} 个真实候选商品。` };
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^([.][.][/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    const contentType = contentTypes[extname(filePath)] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch {
    sendText(response, 404, "Not found");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);

  if (url.pathname === "/api/state" && request.method === "GET") {
    try {
      sendJson(response, 200, await readState());
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : "Could not read state" });
    }
    return;
  }

  if (url.pathname === "/api/state" && request.method === "POST") {
    try {
      const state = JSON.parse(await readBody(request));
      sendJson(response, 200, await writeState(state));
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid state payload" });
    }
    return;
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      const startedAt = Date.now();
      const upstream = await fetch("https://api.cnfans.co.uk/health", { method: "GET" });
      const body = await upstream.text();
      sendJson(response, 200, {
        ok: upstream.ok,
        status: upstream.status,
        elapsedMs: Date.now() - startedAt,
        body: body.slice(0, 500),
      });
    } catch (error) {
      sendJson(response, 200, {
        ok: false,
        status: 0,
        elapsedMs: null,
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
    return;
  }

  if (url.pathname === "/api/scan-latest" && request.method === "POST") {
    try {
      const payload = JSON.parse(await readBody(request));
      const sourceUrl = String(payload.sourceUrl || "").trim();
      if (!/^https:\/\/shop\d+\.(wecatalog\.cn|wgstores\.com)\//i.test(sourceUrl)) {
        sendJson(response, 400, { ok: false, error: "请先选择有效的 wecatalog 来源链接。" });
        return;
      }
      const result = await scanLatestCandidates({
        sourceUrl,
        sourceName: String(payload.sourceName || "").trim(),
        maxScan: payload.maxScan,
        imageLimit: payload.imageLimit,
      });
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "真实扫描失败",
      });
    }
    return;
  }

  await serveStatic(request, response, url.pathname);
});

server.listen(port, host, () => {
  console.log(`CNFans UK Catalog Panel running at http://${host}:${port}`);
  console.log("Mode: Local Draft Only — no D1 writes, no R2 uploads, no real collection.");
});
