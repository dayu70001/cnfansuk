import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const statePath = join(__dirname, "data", "state.json");
const configPath = join(__dirname, "data", "config.local.json");
const brandAliasPath = join(__dirname, "data", "brand-aliases.json");
const scanRoot = join(__dirname, "tmp", "scans");
const publishRoot = join(__dirname, "tmp", "publish");
const projectRoot = "/Users/linmuse/Developer/cnfansuk";
const legacyRepoRoot = "/Users/linmuse/Developer/linmuse";
const legacyRequire = createRequire(join(legacyRepoRoot, "package.json"));
const port = Number(process.env.PORT || 5071);
const host = "127.0.0.1";
const execFileAsync = promisify(execFile);

let codeCounter = 0;
function productCode() {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rnd = randomBytes(3).toString("hex").toUpperCase();
  const seq = String(++codeCounter).padStart(3, "0");
  return `CNF-${ts}${rnd}-${seq}`;
}

const DEFAULT_CONFIG = {
  deepseekApiKey: "",
  deepseekApiBase: "https://api.deepseek.com",
  deepseekModel: "deepseek-v4-pro",
  cloudflareApiToken: "",
  cloudflareAccountId: "",
  d1DatabaseName: "cnfansuk-db",
  r2BucketName: "cnfansuk-products",
  r2ImageBase: "https://img.cnfans.co.uk",
  catalogApiBase: "https://api.cnfans.co.uk",
};

const DEFAULT_SIZES = ["M", "L", "XL", "XXL"];

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
  const current = await readState().catch(() => ({}));
  const next = { ...state };
  if (current.scanHistory && next.scanHistory === undefined) next.scanHistory = current.scanHistory;
  await writeFile(statePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

async function readConfig() {
  if (!existsSync(configPath)) return { ...DEFAULT_CONFIG };
  return { ...DEFAULT_CONFIG, ...JSON.parse(await readFile(configPath, "utf8")) };
}

async function writeConfig(next) {
  const current = await readConfig();
  const config = {
    ...current,
    ...next,
    deepseekApiBase: DEFAULT_CONFIG.deepseekApiBase,
    deepseekModel: DEFAULT_CONFIG.deepseekModel,
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return config;
}

async function writeDeepseekConfig(apiKey) {
  return writeConfig({
    deepseekApiKey: String(apiKey || "").trim(),
    deepseekApiBase: DEFAULT_CONFIG.deepseekApiBase,
    deepseekModel: DEFAULT_CONFIG.deepseekModel,
  });
}

function maskSecret(value) {
  const secret = String(value || "");
  if (!secret) return "";
  if (secret.length <= 8) return "********";
  return `${secret.slice(0, 3)}••••${secret.slice(-4)}`;
}

function publicConfig(config) {
  const hasCloudflareToken = Boolean(config.cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN);
  return {
    ...config,
    deepseekApiKey: "",
    deepseekKeyMasked: maskSecret(config.deepseekApiKey),
    cloudflareApiToken: hasCloudflareToken ? "********" : "",
    hasDeepseekKey: Boolean(config.deepseekApiKey),
    hasCloudflareToken,
  };
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSizes(sizes, fallback = DEFAULT_SIZES) {
  const values = Array.isArray(sizes) ? sizes : String(sizes || "").split(/[/,]/);
  const cleaned = values.map((size) => cleanText(size).toUpperCase()).filter(Boolean);
  return Array.from(new Set(cleaned.length ? cleaned : fallback));
}

async function readDefaultSizes() {
  try {
    const state = await readState();
    return normalizeSizes(state?.settings?.defaultSizes);
  } catch {
    return [...DEFAULT_SIZES];
  }
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
  const match = String(title || "").match(/(?:p|💰|¥|￥)\s*(\d+)|(\d+)\s*(?:p|💰|¥|￥)/i);
  return match ? Number(match[1] || match[2]) : null;
}

function getCostCode(title) {
  const match = String(title || "").match(/(p|💰|¥|￥)\s*(\d+)|(\d+)\s*(p|💰|¥|￥)/i);
  if (!match) return "";
  if (match[1]) return match[1].toLowerCase() === "p" ? `p${match[2]}` : `￥${match[2]}`;
  return `${match[4].toLowerCase() === "p" ? "p" : "￥"}${match[3]}`;
}

function cleanProductTitle(title) {
  return cleanText(String(title || "")
    .replace(/(?:p|💰|¥|￥)\s*\d+/gi, " ")
    .replace(/\d+\s*(?:p|💰|¥|￥)/gi, " ")
    .replace(/[¥￥]\s*\d+(?:\.\d+)?/g, " ")
    .replace(/[|｜]+/g, " ")
    .replace(/\s+([,，。.!！?？;；:：])/g, "$1")
    .replace(/^[\s,，。.!！?？;；:：\-–—]+|[\s,，。.!！?？;；:：\-–—]+$/g, ""));
}

const DEFAULT_BRAND_ALIASES = {
  Nike: { aliases: ["nike", "耐克"], reviewAliases: [] },
  Adidas: { aliases: ["adidas", "阿迪达斯", "阿迪"], reviewAliases: [] },
  Puma: { aliases: ["puma", "彪马"], reviewAliases: [] },
  "New Balance": { aliases: ["new balance", "新百伦"], reviewAliases: [] },
  "The North Face": { aliases: ["the north face", "north face", "thenorthface", "北面"], reviewAliases: [] },
  Burberry: { aliases: ["burberry", "巴宝莉"], reviewAliases: [] },
  Balenciaga: { aliases: ["balenciaga", "巴黎世家"], reviewAliases: [] },
  Gucci: { aliases: ["gucci", "gucc", "古驰", "古奇"], reviewAliases: [] },
  Prada: { aliases: ["prada", "普拉达"], reviewAliases: [] },
  "Louis Vuitton": { aliases: ["louis vuitton", "lv", "1v", "路易威登"], reviewAliases: [] },
  Dior: { aliases: ["dior", "dio", "迪奥"], reviewAliases: [] },
  Chanel: { aliases: ["chanel", "香奈儿"], reviewAliases: [] },
  Fendi: { aliases: ["fendi", "芬迪"], reviewAliases: [] },
  Versace: { aliases: ["versace", "范思哲"], reviewAliases: [] },
  Givenchy: { aliases: ["givenchy", "纪梵希"], reviewAliases: [] },
  Moncler: { aliases: ["moncler", "蒙口", "盟可睐"], reviewAliases: [] },
  "Stone Island": { aliases: ["stone island", "石头岛"], reviewAliases: [] },
  "C.P. Company": { aliases: ["c.p. company", "cp company"], reviewAliases: [] },
  "Ralph Lauren": { aliases: ["ralph lauren", "polo ralph lauren", "拉夫劳伦"], reviewAliases: [] },
  Lacoste: { aliases: ["lacoste", "鳄鱼"], reviewAliases: [] },
  "Canada Goose": { aliases: ["canada goose", "加拿大鹅"], reviewAliases: [] },
  "Fear of God": { aliases: ["fear of god", "fog"], reviewAliases: [] },
  Essentials: { aliases: ["essentials"], reviewAliases: [] },
  Supreme: { aliases: ["supreme"], reviewAliases: [] },
  "Off-White": { aliases: ["off-white", "off white"], reviewAliases: ["off"] },
  "Palm Angels": { aliases: ["palm angels"], reviewAliases: [] },
  "Chrome Hearts": { aliases: ["chrome hearts", "克罗心"], reviewAliases: [] },
  "Arc'teryx": { aliases: ["arc'teryx", "arcteryx", "始祖鸟"], reviewAliases: ["鸟家"] },
  Armani: { aliases: ["armani", "阿玛尼"], reviewAliases: [] },
  Descente: { aliases: ["descente", "迪桑特"], reviewAliases: [] },
};

function brandAliasStore() {
  if (!existsSync(brandAliasPath)) return DEFAULT_BRAND_ALIASES;
  try {
    const fileStore = JSON.parse(readFileSync(brandAliasPath, "utf8"));
    const merged = { ...DEFAULT_BRAND_ALIASES };
    for (const [brand, config] of Object.entries(fileStore || {})) {
      merged[brand] = {
        aliases: Array.from(new Set([...(merged[brand]?.aliases || []), ...(config.aliases || [])])),
        reviewAliases: Array.from(new Set([...(merged[brand]?.reviewAliases || []), ...(config.reviewAliases || [])])),
      };
    }
    return merged;
  } catch {
    return DEFAULT_BRAND_ALIASES;
  }
}

async function writeBrandAlias(brand, alias) {
  const cleanBrand = cleanText(brand);
  const cleanAlias = cleanText(alias);
  if (!cleanBrand) throw new Error("请输入确认后的品牌");
  const store = brandAliasStore();
  const next = { ...store };
  next[cleanBrand] = next[cleanBrand] || { aliases: [], reviewAliases: [] };
  next[cleanBrand].aliases = Array.from(new Set([...(next[cleanBrand].aliases || []), cleanBrand, cleanAlias].filter(Boolean)));
  if (cleanAlias) {
    next[cleanBrand].reviewAliases = (next[cleanBrand].reviewAliases || []).filter((item) => item !== cleanAlias);
  }
  await writeFile(brandAliasPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

function normalizeBrandText(value) {
  return cleanText(String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[’‘`]/g, "'")
    .toLowerCase());
}

function containsBrandAlias(text, alias) {
  const source = normalizeBrandText(text);
  const needle = normalizeBrandText(alias);
  if (!needle) return false;
  if (/^[a-z0-9 .'-]+$/i.test(needle)) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(source);
  }
  return source.includes(needle);
}

function titleContainsConfirmedBrand(title, brand) {
  return containsBrandAlias(title, brand);
}

function detectBrandDetails(cleanTitle) {
  const store = brandAliasStore();
  for (const [brand, config] of Object.entries(store)) {
    const alias = (config.aliases || []).find((item) => containsBrandAlias(cleanTitle, item));
    if (alias) {
      return {
        detectedBrand: brand,
        brandEvidence: `命中别名：${alias}`,
        brandConfidence: "confirmed",
        brandNeedsReview: false,
        brandCandidates: [],
      };
    }
  }
  for (const [brand, config] of Object.entries(store)) {
    const alias = (config.reviewAliases || []).find((item) => containsBrandAlias(cleanTitle, item));
    if (alias) {
      return {
        detectedBrand: "",
        brandEvidence: `命中待确认别名：${alias} → ${brand}`,
        brandConfidence: "review",
        brandNeedsReview: true,
        brandCandidates: [{ rawText: alias, suggestedBrand: brand, confidence: "medium", reason: "本地待确认别名" }],
      };
    }
  }
  return { detectedBrand: "", brandEvidence: "未发现明确品牌", brandConfidence: "none", brandNeedsReview: false, brandCandidates: [] };
}

function detectBrand(cleanTitle) {
  return detectBrandDetails(cleanTitle).detectedBrand;
}

function productCopyFields(product) {
  const rawTitle = String(product.rawTitle || product.title || "").trim();
  const cleanTitle = cleanProductTitle(product.cleanTitle || rawTitle);
  const costCode = getCostCode(rawTitle);
  const costCny = Number.isFinite(product.costCny) ? product.costCny : Number.isFinite(product.detectedCostCny) ? product.detectedCostCny : getCostFromTitle(rawTitle);
  const detected = detectBrandDetails(cleanTitle);
  if (["manual", "confirmed", "ai_confirmed", "none_confirmed"].includes(product.brandConfidence)) {
    return {
      rawTitle,
      costCode,
      costCny,
      cleanTitle,
      detectedBrand: product.detectedBrand,
      brandEvidence: product.brandEvidence || "人工确认品牌",
      brandConfidence: product.brandConfidence,
      brandNeedsReview: false,
      brandCandidates: product.brandCandidates || [],
    };
  }
  return { rawTitle, costCode, costCny, cleanTitle, ...detected };
}

function hasChinese(value) {
  return /[\u3400-\u9fff]/.test(String(value || ""));
}

function cleanGeneratedCopy(value) {
  return cleanText(String(value || "").replace(/(?:p|💰|¥|￥)\s*\d+|\d+\s*(?:p|💰|¥|￥)/gi, " "));
}

function validateFinalCopy(product) {
  const fields = [product.productTitle, product.shortDescription, product.description];
  if (fields.some((value) => !cleanText(value))) throw new Error("请先生成并确认英文标题、短描述和详情描述");
  if (fields.some((value) => /(?:p|💰|¥|￥)\s*\d+|\d+\s*(?:p|💰|¥|￥)/i.test(String(value)))) throw new Error("最终英文文案仍包含价格代码");
  if (fields.some(hasChinese)) throw new Error("最终英文文案仍包含中文");
  const banned = /高端原单|顶级版本|原单|批发|wholesale|top\s*version|original\s*version/i;
  if (fields.some((value) => banned.test(String(value)))) throw new Error("最终英文文案包含禁止的批发或版本用语");
  const copyBrand = detectBrand(fields.join(" "));
  if (product.detectedBrand && copyBrand && copyBrand !== product.detectedBrand) throw new Error(`最终文案出现未识别品牌：${copyBrand}`);
  if (product.detectedBrand && !titleContainsConfirmedBrand(product.productTitle, product.detectedBrand)) throw new Error("最终英文标题未保留已识别品牌");
}

function assertBrandDecision(product) {
  if (product.brandNeedsReview) throw new Error("还有商品品牌待人工确认");
  if (!cleanText(product.detectedBrand) && !["manual", "none_confirmed"].includes(product.brandConfidence)) {
    throw new Error("未识别品牌的商品必须先手动保存品牌，或保存为空品牌");
  }
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
  return getCostCode(title);
}

function hasPriceMarker(title) {
  return /(?:p|💰|¥|￥)\s*\d+|\d+\s*(?:p|💰|¥|￥)/i.test(String(title || ""));
}

function collectImageUrlsFromJson(value, baseUrl, output = new Set()) {
  if (typeof value === "string") {
    const normalized = normalizeUrl(value, baseUrl);
    if (normalized && isProductImageUrl(normalized)) output.add(normalized);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrlsFromJson(item, baseUrl, output);
    return output;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectImageUrlsFromJson(item, baseUrl, output);
  }
  return output;
}

function collectCandidateImageUrls(obj, baseUrl) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  const images = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const isImageField = /(?:^|goods|product|item|main|detail|cover|thumb|show)(?:img|image|pic|photo)(?:url|urls|src|srcs|list|s)?$/.test(normalizedKey)
      || /^(?:img|image|pic|photo)(?:url|urls|src|srcs|list|s)?$/.test(normalizedKey)
      || detailImageKeys.has(normalizedKey);
    if (isImageField) collectImageUrlsStrict(value, baseUrl, images);
  }
  return uniqueProductImages(Array.from(images), 9);
}

const detailImageKeys = new Set([
  "imgssrc",
  "imgs_src",
  "images",
  "imageurls",
  "image_urls",
  "pics",
  "picurls",
  "pic_urls",
  "gallery",
  "galleryimages",
  "gallery_images",
  "albumimgs",
  "album_imgs",
  "detailimgs",
  "detail_imgs",
]);

function collectImageUrlsStrict(value, baseUrl, output = new Set()) {
  if (typeof value === "string") {
    const normalized = normalizeUrl(value, baseUrl);
    if (normalized && isProductImageUrl(normalized)) output.add(normalized);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrlsStrict(item, baseUrl, output);
    return output;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectImageUrlsStrict(item, baseUrl, output);
  }
  return output;
}

function collectImageArraysByKey(value, baseUrl, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) collectImageArraysByKey(item, baseUrl, output);
    return output;
  }
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (detailImageKeys.has(normalizedKey)) {
      const images = uniqueProductImages(Array.from(collectImageUrlsStrict(child, baseUrl)), 9);
      if (images.length) output.push(images);
    }
    collectImageArraysByKey(child, baseUrl, output);
  }
  return output;
}

function pickJsonString(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "string" && cleanText(value)) return cleanText(value);
    if (typeof value === "number") return String(value);
  }
  return "";
}

function collectNetworkCandidates(records, sourceUrl, maxScan) {
  const titleKeys = ["title", "name", "goodsName", "productName", "itemName", "goods_name", "product_name", "item_name"];
  const descKeys = ["desc", "description", "detail", "content", "goodsDesc", "goodsDetail", "productDesc", "memo", "remark"];
  const idKeys = ["id", "goodsId", "itemId", "productId", "goods_id", "item_id", "product_id", "spuId", "skuId"];
  const urlKeys = ["url", "href", "link", "detailUrl", "detail_url", "shareUrl"];
  const candidates = [];
  const seen = new Set();

  function visit(value, responseUrl) {
    if (candidates.length >= maxScan) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, responseUrl);
      return;
    }
    if (!value || typeof value !== "object") return;

    const obj = value;
    const title = pickJsonString(obj, titleKeys);
    const description = pickJsonString(obj, descKeys);
    const id = pickJsonString(obj, idKeys);
    const detailUrl = normalizeUrl(pickJsonString(obj, urlKeys), responseUrl);
    const imageUrls = collectCandidateImageUrls(obj, responseUrl);
    const keys = Object.keys(obj).join(" ").toLowerCase();
    const sourceText = `${responseUrl} ${keys}`.toLowerCase();
    const looksLikeProduct = /goods|product|item|sku|spu|detail/i.test(sourceText) || id;

    if (title && imageUrls.length && looksLikeProduct && !isNonProductListingTitle(title)) {
      const key = candidateProductKey({ id, url: detailUrl, title, imageUrls }, sourceUrl);
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push({
          id,
          url: detailUrl || sourceUrl,
          title: cleanText(`${title} ${description}`).slice(0, 500),
          imageUrls,
          detailImages: [],
          detailOpened: false,
          domIndex: candidates.length + 1,
          visualIndex: candidates.length + 1,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          source: "network_api",
        });
      }
    }

    for (const child of Object.values(obj)) visit(child, responseUrl);
  }

  for (const record of records) visit(record.json, record.url || sourceUrl);
  return candidates.slice(0, maxScan);
}

function collectDetailImagesFromNetwork(records, sourceUrl) {
  const detailRecords = records.filter((record) => /commodity\/view|goods|product|detail|item/i.test(record.url || ""));
  const candidates = [];
  for (const record of detailRecords.length ? detailRecords : records) {
    const baseUrl = record.url || sourceUrl;
    const keyedImageSets = collectImageArraysByKey(record.json, baseUrl);
    for (const images of keyedImageSets) {
      if (images.length) candidates.push(images);
    }
  }
  return candidates.sort((a, b) => b.length - a.length)[0] || [];
}

function normalizedImageKey(rawUrl) {
  try {
    const url = new URL(upscaleImageUrl(rawUrl));
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return String(rawUrl || "").split("?")[0].split("#")[0];
  }
}

function candidateProductKey(candidate, sourceUrl = "") {
  const rawUrl = normalizeUrl(candidate?.url || candidate?.detailUrl || candidate?.sourceUrl || "", sourceUrl);
  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      const hashMatch = url.hash.match(/(?:theme_detail|goods|product)\/([^/?#]+)\/([^/?#]+)/i);
      if (hashMatch) return `product:${hashMatch[1]}:${hashMatch[2]}`;
      const parts = url.pathname.split("/").filter(Boolean);
      const productIndex = parts.findIndex((part) => /^(?:product|goods|item)$/i.test(part));
      if (productIndex >= 0 && parts[productIndex + 2]) return `product:${parts[productIndex + 1]}:${parts[productIndex + 2]}`;
      if (productIndex >= 0 && parts[productIndex + 1]) return `product:${parts[productIndex + 1]}`;
      const lastToken = [...parts].reverse().find((part) => /^_[A-Za-z0-9_-]{8,}$/.test(part));
      if (lastToken) return `product-token:${lastToken}`;
      url.searchParams.delete("_lm_fresh");
      return `url:${url.toString()}`;
    } catch {
      return `url:${rawUrl}`;
    }
  }
  const id = cleanText(candidate?.id || candidate?.productId || candidate?.goodsId || "");
  if (id) return `id:${id}`;
  const imageKey = normalizedImageKey(candidate?.imageUrls?.[0] || candidate?.detailImages?.[0] || "");
  if (imageKey) return `image:${imageKey}`;
  const title = cleanProductTitle(candidate?.title || candidate?.rawTitle || "").toLowerCase().replace(/\s+/g, " ").slice(0, 180);
  return title ? `title:${title}` : "";
}

function sourceUrlKey(rawUrl, baseUrl = "") {
  return candidateProductKey({ url: rawUrl }, baseUrl) || normalizeUrl(rawUrl, baseUrl) || String(rawUrl || "");
}

function isNonProductListingTitle(title) {
  const value = cleanText(title);
  const meaningfulText = value.replace(/[\p{P}\p{S}\s_]+/gu, "");
  if (meaningfulText.length < 2) return true;
  if (/搜款方法|使用指南|教程|公告|说明|操作指引|购物须知|关注本店|店铺介绍|关于我们|联系方式|价格表|尺码表|代理须知|批发须知|批发相册|高端系列批发相册|相册$|店铺$/.test(value)) return true;
  if (!hasPriceMarker(value) && /供货|档口价|货源齐全|量大可谈|拿货|批发/i.test(value)) return true;
  return false;
}

function candidateContentKey(title) {
  const normalizedTitle = cleanProductTitle(title)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s_]+/gu, "")
    .slice(0, 260);
  return normalizedTitle ? `content:${normalizedTitle}` : "";
}

function collectLocalSourceKeys(state, sourceUrl = "") {
  const keys = new Set();
  const add = (rawUrl) => {
    const key = sourceUrlKey(rawUrl, sourceUrl);
    if (key) keys.add(key);
  };
  for (const item of state?.candidates || []) add(item.sourceUrl || item.url);
  for (const item of state?.publishDrafts || []) add(item.sourceUrl || item.url);
  const historyKey = normalizeUrl(sourceUrl, sourceUrl) || sourceUrl;
  const history = state?.scanHistory?.[historyKey]?.seenProductKeys;
  if (Array.isArray(history)) for (const key of history) if (key) keys.add(key);
  return keys;
}

function isProductImageUrl(rawUrl) {
  const lower = String(rawUrl || "").toLowerCase();
  if (!/^https?:\/\//i.test(lower)) return false;
  if (/avatar|logo|qrcode|qr|wechat|banner|background|watermark|video|poster|share|header|minicode|album_bg|album\/personal|template|规格|spec|shopicon|shop_icon/.test(lower)) return false;
  if (/\.(mp4|mov|webm|m3u8)(?:$|[?#])/i.test(lower)) return false;
  if (/(xcimg\.szwego\.com|newimg\.szwego\.com)/i.test(lower)) return true;
  if (/szwego\.com/i.test(lower) && /\.(jpe?g|png|webp)(?:$|[?#])/i.test(lower)) return true;
  if (/wecatalog\.cn/i.test(lower) && /\.(jpe?g|png|webp)(?:$|[?#])/i.test(lower)) return true;
  return false;
}

function upscaleImageUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const lower = url.toString().toLowerCase();
    const resizeHints = [
      "x-oss-process",
      "imageview",
      "imagemogr",
      "thumbnail",
      "resize",
      "/w/",
      "w_",
      "width",
      "height",
      "quality",
      "format,webp",
    ];
    if (resizeHints.some((hint) => lower.includes(hint))) {
      url.search = "";
    }
    url.pathname = url.pathname
      .replace(/\/(?:thumb|thumbnail|small|middle|resize|crop)\//gi, "/")
      .replace(/([/_-])(?:w|width|h|height)[_-]?\d{2,4}(?=[/_-])/gi, "$1")
      .replace(/([/_-])(?:320|480|640|720)x(?:320|480|640|720)(?=[._/-])/gi, "$1");
    return url.toString();
  } catch {
    return value;
  }
}

function uniqueProductImages(imageUrls, limit = 9) {
  const seen = new Set();
  const result = [];
  for (const imageUrl of imageUrls) {
    const upgraded = upscaleImageUrl(imageUrl);
    if (!isProductImageUrl(upgraded)) continue;
    const key = normalizedImageKey(upgraded);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(upgraded);
    if (result.length >= limit) break;
  }
  return result;
}

function extractSizes(text) {
  const value = String(text || "").toUpperCase();
  const range = value.match(/(?:SIZE|码数|尺码)\s*[:：]?\s*([0-9A-Z\-–—/ ]{3,30})/i)?.[1] || "";
  const sizes = range.match(/(?:[2-9]?X{0,3}L|XS|S|M|L|XL|XXL|XXXL|[2-5]XL|\d{2,3})/g) || [];
  return normalizeSizes(sizes);
}

function normalizeCategory(value) {
  const map = { "新品": "tops", "上衣": "tops", "外套": "outerwear", "下装": "bottoms", "套装": "co-ords-sets" };
  const normalized = map[value] || String(value || "").trim();
  return ["tops", "outerwear", "bottoms", "co-ords-sets"].includes(normalized) ? normalized : "tops";
}

function normalizeSubcategory(value, category = "tops") {
  const map = { "连帽卫衣": "hoodies", "卫衣": "sweatshirts", "拉链卫衣": "zip-hoodies", "短袖": "t-shirts", "背心": "tank-tops", "衬衫": "shirts", "针织": "knitwear", "夹克": "jackets", "连帽夹克": "hooded-jackets", "棒球夹克": "varsity-jackets", "羽绒服": "puffer-jackets", "马甲": "vests", "大衣": "coats", "运动套装": "tracksuits", "连帽套装": "hoodie-sets", "短袖短裤套装": "t-shirt-shorts-sets", "针织套装": "knit-sets", "夹克长裤套装": "jacket-pants-sets", "长裤": "trousers", "运动裤": "joggers", "工装裤": "cargo-pants", "牛仔裤": "jeans", "短裤": "shorts", "半裙": "skirts", "成套搭配": "casual-sets", "hoodies-sweatshirts": "hoodies", "jeans-denim": "jeans" };
  const normalized = map[value] || String(value || "").trim();
  const allowed = ["jackets", "hooded-jackets", "varsity-jackets", "puffer-jackets", "vests", "coats", "t-shirts", "tank-tops", "hoodies", "sweatshirts", "zip-hoodies", "shirts", "knitwear", "trousers", "joggers", "cargo-pants", "jeans", "shorts", "skirts", "tracksuits", "hoodie-sets", "t-shirt-shorts-sets", "knit-sets", "casual-sets", "jacket-pants-sets"];
  if (allowed.includes(normalized)) return normalized;
  return { outerwear: "jackets", bottoms: "trousers", "co-ords-sets": "tracksuits", tops: "t-shirts" }[category];
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildD1Sql(product) {
  assertBrandDecision(product);
  validateFinalCopy(product);
  if (!Array.isArray(product.r2Images) || product.r2Images.length === 0) {
    throw new Error("生成 D1 数据前必须先上传 R2 图片");
  }
  const validImages = product.r2Images.filter((image) => image?.imageKey && image?.imageUrl).slice(0, 9);
  if (validImages.length === 0) {
    throw new Error("R2 图片缺少 imageKey 或 imageUrl，不能写入 D1");
  }
  const images = validImages.map((image, index) =>
    `INSERT INTO product_images (product_code, image_key, image_url, position, alt) VALUES (${sqlString(product.productCode)}, ${sqlString(image.imageKey)}, ${sqlString(image.imageUrl)}, ${index + 1}, ${sqlString(product.productTitle)});`,
  );
  const options = (product.sizes || []).map((size, index) =>
    `INSERT INTO product_options (product_code, option_name, option_value, position) VALUES (${sqlString(product.productCode)}, 'Size', ${sqlString(size)}, ${index + 1});`,
  );
  return [
    `DELETE FROM product_options WHERE product_code = ${sqlString(product.productCode)};`,
    `DELETE FROM product_images WHERE product_code = ${sqlString(product.productCode)};`,
    `DELETE FROM products WHERE product_code = ${sqlString(product.productCode)};`,
    `INSERT INTO products (product_code, slug, title, subtitle, description, category, subcategory, price_gbp, price_eur, price_usd, brand, compare_at_price_gbp, currency, status, sort_order, source_url) VALUES (${sqlString(product.productCode)}, ${sqlString(product.slug)}, ${sqlString(product.productTitle)}, ${sqlString(product.shortDescription)}, ${sqlString(product.description)}, ${sqlString(product.category)}, ${sqlString(product.subcategory)}, ${Number(product.prices?.GBP || 0)}, ${Number(product.prices?.EUR || 0)}, ${Number(product.prices?.USD || 0)}, ${sqlString(product.detectedBrand || "")}, NULL, 'GBP', 'active', 0, ${sqlString(product.sourceUrl)});`,
    ...images,
    ...options,
  ].join("\n");
}

async function deepseekRequest(config, product) {
  if (!config.deepseekApiKey) throw new Error("请先保存 DeepSeek API");
  const copyFields = productCopyFields(product);
  const response = await fetch(`${config.deepseekApiBase.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.deepseekApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.deepseekModel,
      temperature: 0.2,
      max_tokens: 1200,
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Translate the supplied Chinese product information into restrained UK English ecommerce copy. Return exactly one valid JSON object with keys: detectedBrand, productTitle, shortDescription, description, category, tags. Every output string must be English; do not copy any Chinese characters from the input. productTitle must be a natural English product name built from the supplied cleanTitle and confirmed detectedBrand. If detectedBrand is empty, return detectedBrand as an empty string and do not invent or infer any brand. shortDescription must be one concise English sentence. description must be 2 to 4 natural English sentences. Never include p-price codes, supplier/source references, wholesale language, authenticity claims, high-end original, top version, or exaggerated marketing. category must be one of tops, outerwear, bottoms, co-ords-sets. tags must be an array of short English strings. JSON only, no markdown." },
        { role: "user", content: JSON.stringify({ cleanTitle: copyFields.cleanTitle, detectedBrand: copyFields.detectedBrand, category: normalizeCategory(product.category), subcategory: normalizeSubcategory(product.subcategory, normalizeCategory(product.category)), sizes: product.sizes, imageCount: product.imageCount, coverImage: product.imageUrl || "", imageUrls: (product.galleryImages || []).slice(0, 9), priceGbp: product.prices?.GBP }) },
      ],
    }),
  });
  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`DeepSeek 返回无法解析 (${response.status})：${responseText.slice(0, 300) || "空响应"}`);
  }
  if (!response.ok) {
    const reason = payload?.error?.message || payload?.message || response.statusText || "未知错误";
    throw new Error(`DeepSeek 请求失败 (${response.status})：${reason}`);
  }
  const content = payload?.choices?.[0]?.message?.content || "";
  let translated;
  try {
    translated = JSON.parse(content);
  } catch {
    throw new Error("DeepSeek 返回的商品内容不是有效 JSON");
  }

  try {
    const required = ["detectedBrand", "productTitle", "shortDescription", "description", "category", "tags"];
    const missing = required.filter((key) => !(key in translated));
    if (missing.length) throw new Error(`缺少字段：${missing.join(", ")}`);
    if (!Array.isArray(translated.tags)) throw new Error("tags 必须是数组");
    const generated = {
      detectedBrand: copyFields.detectedBrand,
      productTitle: cleanGeneratedCopy(translated.productTitle),
      shortDescription: cleanGeneratedCopy(translated.shortDescription),
      description: cleanGeneratedCopy(translated.description),
      category: normalizeCategory(product.category),
      aiSuggestedCategory: normalizeCategory(translated.category),
      tags: translated.tags.map(cleanGeneratedCopy).filter(Boolean),
    };
    if (!generated.productTitle || !generated.shortDescription || !generated.description) throw new Error("英文标题或描述为空");
    if ([generated.productTitle, generated.shortDescription, generated.description].some(hasChinese)) throw new Error("生成内容包含中文");
    if (copyFields.detectedBrand && !titleContainsConfirmedBrand(generated.productTitle, copyFields.detectedBrand)) {
      generated.productTitle = `${copyFields.detectedBrand} ${generated.productTitle}`;
    }
    validateFinalCopy(generated);
    const generatedBrand = detectBrand(`${generated.productTitle} ${generated.shortDescription} ${generated.description}`);
    if (generatedBrand && generatedBrand !== copyFields.detectedBrand) throw new Error(`生成内容出现未识别品牌：${generatedBrand}`);
    return generated;
  } catch (error) {
    throw new Error(`DeepSeek 商品内容校验失败：${error instanceof Error ? error.message : "校验失败"}`);
  }
}

async function deepseekBrandCandidates(config, product) {
  if (!config.deepseekApiKey) throw new Error("请先保存 DeepSeek API");
  const rawTitle = String(product.rawTitle || product.title || "");
  const cleanTitle = cleanProductTitle(product.cleanTitle || rawTitle);
  const knownBrands = Object.keys(brandAliasStore());
  const response = await fetch(`${config.deepseekApiBase.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.deepseekApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.deepseekModel,
      temperature: 0,
      max_tokens: 700,
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You extract possible brand text evidence from supplier product titles. Return exactly one JSON object with key brandCandidates. brandCandidates must be an array of objects: rawText, suggestedBrand, confidence, reason. rawText must be copied exactly from the supplied title. Only use textual evidence present in the title. Do not infer a brand from product appearance, category, logo image, or style. confidence must be high, medium, or low. If no explicit brand-like text appears, return an empty array." },
        { role: "user", content: JSON.stringify({ rawTitle, cleanTitle, knownBrands }) },
      ],
    }),
  });
  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`DeepSeek 品牌识别返回无法解析 (${response.status})`);
  }
  if (!response.ok) {
    const reason = payload?.error?.message || payload?.message || response.statusText || "未知错误";
    throw new Error(`DeepSeek 品牌识别失败 (${response.status})：${reason}`);
  }
  const content = payload?.choices?.[0]?.message?.content || "";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("DeepSeek 品牌识别不是有效 JSON");
  }
  const candidates = Array.isArray(parsed.brandCandidates) ? parsed.brandCandidates : [];
  return candidates
    .map((candidate) => ({
      rawText: cleanText(candidate.rawText),
      suggestedBrand: cleanText(candidate.suggestedBrand),
      confidence: ["high", "medium", "low"].includes(String(candidate.confidence || "").toLowerCase()) ? String(candidate.confidence).toLowerCase() : "low",
      reason: cleanText(candidate.reason),
    }))
    .filter((candidate) => candidate.rawText && candidate.suggestedBrand && cleanTitle.includes(candidate.rawText));
}

async function resolveBrandBeforeTranslation(config, product) {
  const copyFields = productCopyFields(product);
  if (copyFields.detectedBrand || copyFields.brandNeedsReview || copyFields.brandConfidence === "none_confirmed") return copyFields;
  const candidates = await deepseekBrandCandidates(config, { ...product, ...copyFields });
  const knownBrands = Object.keys(brandAliasStore());
  const knownCandidate = candidates.find((candidate) => knownBrands.includes(candidate.suggestedBrand));
  if (!candidates.length) {
    return {
      ...copyFields,
      detectedBrand: "",
      brandCandidates: [],
      brandEvidence: "未发现明确品牌，按无品牌商品继续翻译",
      brandConfidence: "none_confirmed",
      brandNeedsReview: false,
    };
  }
  if (!knownCandidate) {
    return {
      ...copyFields,
      brandCandidates: candidates,
      brandEvidence: candidates.length ? "AI 找到未知品牌候选，待人工确认" : "未发现明确品牌，请人工确认品牌或保存为无品牌",
      brandConfidence: "review",
      brandNeedsReview: true,
    };
  }
  if (knownCandidate.confidence === "high") {
    return {
      ...copyFields,
      detectedBrand: knownCandidate.suggestedBrand,
      brandEvidence: `AI 高置信文本线索：${knownCandidate.rawText} → ${knownCandidate.suggestedBrand}`,
      brandConfidence: "ai_confirmed",
      brandNeedsReview: false,
      brandCandidates: candidates,
    };
  }
  return {
    ...copyFields,
    detectedBrand: "",
    brandEvidence: `AI 候选待人工确认：${knownCandidate.rawText} → ${knownCandidate.suggestedBrand}`,
    brandConfidence: "review",
    brandNeedsReview: true,
    brandCandidates: candidates,
  };
}

async function runWrangler(args, config) {
  if (!config.cloudflareAccountId) throw new Error("Cloudflare Account ID 未配置");
  const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: config.cloudflareAccountId };
  if (config.cloudflareApiToken) env.CLOUDFLARE_API_TOKEN = config.cloudflareApiToken;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const result = await execFileAsync("npx", ["wrangler", ...args], { cwd: projectRoot, env, timeout: 120000, maxBuffer: 1024 * 1024 * 5 });
      return `${result.stdout || ""}${result.stderr || ""}`.trim();
    } catch (error) {
      lastError = error;
      const message = `${error?.message || ""}\n${error?.stderr || ""}`;
      const retryable = /EAGAIN|ETIMEDOUT|ECONNRESET|fetch failed|network/i.test(message);
      if (!retryable || attempt === 4) break;
      await delay(2500 * attempt);
    }
  }
  throw lastError;
}

async function readD1PublishedSourceKeys(config, sourceUrl = "") {
  if (!config?.cloudflareAccountId || !config?.d1DatabaseName) return new Set();
  try {
    const output = await runWrangler([
      "d1",
      "execute",
      config.d1DatabaseName,
      "--remote",
      "--command",
      "SELECT source_url FROM products WHERE source_url IS NOT NULL AND source_url <> '';",
      "--json",
    ], config);
    const payload = JSON.parse(output);
    const rows = Array.isArray(payload)
      ? payload.flatMap((entry) => entry?.results || entry?.result?.results || [])
      : (payload?.results || payload?.result?.results || []);
    const keys = new Set();
    for (const row of rows) {
      const key = sourceUrlKey(row?.source_url, sourceUrl);
      if (key) keys.add(key);
    }
    return keys;
  } catch {
    return new Set();
  }
}

async function rememberScannedProduct(sourceUrl, sourceName, productUrl) {
  const key = sourceUrlKey(productUrl, sourceUrl);
  if (!key) return;
  const state = await readState().catch(() => ({}));
  const scanHistory = state?.scanHistory && typeof state.scanHistory === "object" ? state.scanHistory : {};
  const historyKey = normalizeUrl(sourceUrl, sourceUrl) || sourceUrl || "manual";
  const previous = Array.isArray(scanHistory[historyKey]?.seenProductKeys) ? scanHistory[historyKey].seenProductKeys : [];
  await writeState({
    ...(state || {}),
    scanHistory: {
      ...scanHistory,
      [historyKey]: {
        sourceName: sourceName || scanHistory[historyKey]?.sourceName || "",
        sourceUrl: sourceUrl || scanHistory[historyKey]?.sourceUrl || "",
        updatedAt: new Date().toISOString(),
        seenProductKeys: Array.from(new Set([...previous, key])).slice(-1000),
      },
    },
  }).catch(() => undefined);
}

async function processProductImages(product) {
  const sharp = legacyRequire("sharp");
  const code = product.productCode || productCode();
  const dir = join(publishRoot, code);
  await mkdir(dir, { recursive: true });
  const processed = [];
  const skipped = [];
  for (const [index, imageUrl] of (product.galleryImages || []).slice(0, 9).entries()) {
    const sourceImageUrl = upscaleImageUrl(imageUrl);
    try {
      const response = await fetch(sourceImageUrl, { headers: { Referer: product.sourceUrl || "https://www.wecatalog.cn/", "User-Agent": "Mozilla/5.0 CNFans Catalog Panel" } });
      if (!response.ok) {
        skipped.push({ index: index + 1, reason: `下载失败 (${response.status})`, url: sourceImageUrl });
        continue;
      }
      const input = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(input).metadata();
      const width = Number(metadata.width || 0);
      const height = Number(metadata.height || 0);
      if (Math.min(width, height) < 300) {
        skipped.push({ index: index + 1, reason: `分辨率过低 ${width}x${height}`, url: sourceImageUrl });
        continue;
      }
      const filePath = join(dir, `${String(index + 1).padStart(2, "0")}.webp`);
      await sharp(input).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: false }).webp({ quality: 88 }).toFile(filePath);
      processed.push({ filePath, imageKey: `products/${code}/${String(index + 1).padStart(2, "0")}.webp`, position: index + 1, sourceImageUrl, sourceWidth: width, sourceHeight: height });
    } catch (error) {
      skipped.push({ index: index + 1, reason: error instanceof Error ? error.message : String(error), url: sourceImageUrl });
    }
  }
  if (!processed.length) {
    const reasons = skipped.map((s) => `图片${s.index}: ${s.reason}`).join("; ");
    throw new Error(`没有可处理的商品图片${skipped.length ? "（" + reasons + "）" : ""}`);
  }
  return { productCode: code, processed, skipped };
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
    const parseSrcset = (value) => String(value || "")
      .split(",")
      .map((part) => {
        const [url, descriptor = ""] = part.trim().split(/\s+/);
        const score = Number.parseInt(descriptor.replace(/\D/g, "") || "0", 10) || 0;
        return { url, score };
      })
      .filter((item) => item.url)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.url);
    const backgroundUrls = (element) => {
      const urls = [];
      for (let node = element; node && urls.length < 3; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundImage || "";
        for (const match of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.push(match[1]);
      }
      return urls;
    };
    const imageCandidatesOf = (img) => [
      ...parseSrcset(img.getAttribute("srcset")),
      img.getAttribute("data-original"),
      img.getAttribute("data-origin"),
      img.getAttribute("data-full"),
      img.getAttribute("data-large"),
      img.getAttribute("data-big"),
      img.getAttribute("data-zoom"),
      img.getAttribute("data-url"),
      img.getAttribute("data-image"),
      img.getAttribute("data-img"),
      img.getAttribute("data-src"),
      img.getAttribute("data-lazy"),
      img.currentSrc,
      img.getAttribute("src"),
      ...backgroundUrls(img),
    ].map(absolute).filter(Boolean);
    const imageUrlOf = (img) => imageCandidatesOf(img)[0] || "";
    const imagesOf = (element) => Array.from(new Set(Array.from(element.querySelectorAll("img"))
      .filter(isRealProductImage)
      .flatMap(imageCandidatesOf)
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
        if (preferredCards.length && (rect.width > 180 || rect.height > 420)) return false;
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
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

    const imageCards = preferredCards.length ? [] : Array.from(document.querySelectorAll("img"))
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
          width: Math.round(rect.width),
          height: Math.round(rect.height),
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
    if (isNonProductListingTitle(title)) continue;
    const imageUrls = Array.from(new Set((candidate.imageUrls || []).map((url) => normalizeUrl(url, sourceUrl)).filter(Boolean)));
    const url = normalizeUrl(candidate.url, sourceUrl) || sourceUrl;
    const key = candidateProductKey({ ...candidate, title, url, imageUrls }, sourceUrl);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ ...candidate, title, url, imageUrls, visualIndex: items.length + 1 });
    if (items.length >= maxScan) break;
  }
  return items;
}

async function collectCarouselImages(page) {
  for (let index = 0; index < 8; index += 1) {
    await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 8 && rect.height > 8 && style.display !== "none" && style.visibility !== "hidden";
      };
      const next = Array.from(document.querySelectorAll("button,.next,.swiper-button-next,[class*=next],[aria-label*=next],[aria-label*=Next]")).find(visible);
      if (next) {
        next.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        return;
      }
      const gallery = document.querySelector("[class*=swiper], [class*=carousel], [class*=gallery], [class*=album]");
      if (gallery) {
        gallery.dispatchEvent(new TouchEvent("touchstart", { bubbles: true }));
        gallery.dispatchEvent(new TouchEvent("touchend", { bubbles: true }));
      }
    }).catch(() => undefined);
    await page.waitForTimeout(250);
  }
}

async function extractDetailImages(page, sourceUrl) {
  const imageUrls = await page.evaluate((baseUrl) => {
    const absolute = (raw) => {
      if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return "";
      try {
        return new URL(raw, baseUrl).toString();
      } catch {
        return "";
      }
    };
    const isRealProductImage = (img) => {
      const src = img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy") || "";
      const meta = [
        src,
        img.alt || "",
        img.className || "",
        img.id || "",
        img.closest("[class]") ? img.closest("[class]").className : "",
      ].join(" ").toLowerCase();
      if (/avatar|logo|qrcode|qr|wechat|banner|background|bg|icon|shop|store|profile|watermark|video|poster|share|header|minicode|album_bg/.test(meta)) return false;
      const rect = img.getBoundingClientRect();
      const width = img.naturalWidth || rect.width || 0;
      const height = img.naturalHeight || rect.height || 0;
      return !(width && height && (width < 180 || height < 180));
    };
    const parseSrcset = (value) => String(value || "")
      .split(",")
      .map((part) => {
        const [url, descriptor = ""] = part.trim().split(/\s+/);
        const score = Number.parseInt(descriptor.replace(/\D/g, "") || "0", 10) || 0;
        return { url, score };
      })
      .filter((item) => item.url)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.url);
    const backgroundUrls = (element) => {
      const urls = [];
      for (let node = element; node && urls.length < 4; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundImage || "";
        for (const match of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.push(match[1]);
      }
      return urls;
    };
    const imageCandidatesOf = (img) => [
      ...parseSrcset(img.getAttribute("srcset")),
      img.getAttribute("data-original"),
      img.getAttribute("data-origin"),
      img.getAttribute("data-full"),
      img.getAttribute("data-large"),
      img.getAttribute("data-big"),
      img.getAttribute("data-zoom"),
      img.getAttribute("data-url"),
      img.getAttribute("data-image"),
      img.getAttribute("data-img"),
      img.getAttribute("data-src"),
      img.getAttribute("data-lazy"),
      img.currentSrc,
      img.getAttribute("src"),
      ...backgroundUrls(img),
    ].map(absolute).filter(Boolean);
    return Array.from(document.querySelectorAll("img"))
      .filter(isRealProductImage)
      .flatMap(imageCandidatesOf)
      .filter(Boolean);
  }, sourceUrl);
  return uniqueProductImages(imageUrls, 9);
}

async function openCandidateDetail(page, candidate, sourceUrl) {
  const urlBefore = page.url();
  if (candidate.url && candidate.url !== sourceUrl && candidate.url !== urlBefore) {
    await page.goto(candidate.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(800);
    return { opened: true, urlBefore, urlAfter: page.url() };
  }

  await page.evaluate((y) => window.scrollTo(0, Math.max(0, Number(y) - 260)), candidate.y || 0).catch(() => undefined);
  await page.waitForTimeout(600);
  const x = Math.max(20, Math.min(370, Number(candidate.x || 0) + Math.max(20, Number(candidate.width || 100) / 2)));
  const y = Math.max(100, Math.min(760, Number(candidate.y || 0) - await page.evaluate(() => window.scrollY).catch(() => 0) + Math.max(20, Number(candidate.height || 100) / 2)));
  await page.mouse.click(x, y);
  await page.waitForTimeout(900);
  return { opened: page.url() !== urlBefore, urlBefore, urlAfter: page.url() };
}

async function closeCandidateDetail(page, sourceUrl, urlBefore) {
  if (page.url() !== urlBefore) {
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45000 }));
    await page.waitForTimeout(350);
    return;
  }
  await page.keyboard.press("Escape").catch(() => undefined);
  await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 8 && rect.height > 8 && style.display !== "none" && style.visibility !== "hidden";
    };
    const close = Array.from(document.querySelectorAll("button,[class*=close],[aria-label*=close],[aria-label*=Close]")).find(visible);
    if (close) close.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }).catch(() => undefined);
  await page.waitForTimeout(300);
}

async function enrichCandidatesWithDetailImages(page, candidates, sourceUrl, targetCount = 50) {
  const enriched = [];
  const maxToVerify = Math.min(candidates.length, Math.max(Number(targetCount) * 8, 40));
  for (const candidate of candidates.slice(0, maxToVerify)) {
    let detailImages = [];
    let detailOpened = false;
    const detailRecords = [];
    let detailIndex = 0;
    const detailResponseHandler = async (res) => {
      if (detailRecords.length >= 30) return;
      const contentType = res.headers()["content-type"] || "";
      const resourceType = res.request().resourceType();
      if (!/json/i.test(contentType) && !["xhr", "fetch"].includes(resourceType)) return;
      try {
        const text = await res.text();
        const trimmed = text.trim();
        if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return;
        detailRecords.push({
          index: detailIndex,
          url: res.url(),
          status: res.status(),
          contentType,
          resourceType,
          json: JSON.parse(trimmed),
        });
        detailIndex += 1;
      } catch {
        // Ignore non-JSON or unavailable response bodies.
      }
    };
    page.on("response", detailResponseHandler);
    try {
      const opened = await openCandidateDetail(page, candidate, sourceUrl);
      detailOpened = opened.opened || page.url() !== opened.urlBefore;
      await page.waitForTimeout(600);
      const networkImages = collectDetailImagesFromNetwork(detailRecords, sourceUrl);
      if (networkImages.length) {
        detailImages = networkImages;
      } else {
        await collectCarouselImages(page);
        await page.waitForTimeout(400);
        detailImages = await extractDetailImages(page, sourceUrl);
      }
      if (opened.urlAfter && opened.urlAfter !== opened.urlBefore && opened.urlAfter !== sourceUrl) {
        candidate.url = opened.urlAfter;
      }
      await closeCandidateDetail(page, sourceUrl, opened.urlBefore);
      await page.evaluate((y) => window.scrollTo(0, Math.max(0, Number(y) - 260)), candidate.y || 0).catch(() => undefined);
      await page.waitForTimeout(250);
    } catch {
      await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
    } finally {
      page.off("response", detailResponseHandler);
    }
    const images = detailImages.length ? detailImages : uniqueProductImages(candidate.detailImages?.length ? candidate.detailImages : candidate.imageUrls || [], 9);
    enriched.push({
      ...candidate,
      detailOpened,
      detailImages: images,
    });
  }
  return enriched;
}

async function scanLatestCandidates({ sourceUrl, sourceName, maxScan, imageLimit, defaultSizes }) {
  const safeMaxScan = Math.min(Math.max(Number(maxScan) || 50, 1), 100);
  const rawCandidateLimit = Math.min(Math.max(safeMaxScan * 8, 40), 800);
  const safeImageLimit = Math.min(Math.max(Number(imageLimit) || 6, 1), 12);
  const fixedSizes = normalizeSizes(defaultSizes);
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
    const networkRecords = [];
    let networkIndex = 0;
    page.on("response", async (res) => {
      if (networkRecords.length >= 300) return;
      const contentType = res.headers()["content-type"] || "";
      const resourceType = res.request().resourceType();
      if (!/json|javascript|text/i.test(contentType) && !["xhr", "fetch"].includes(resourceType)) return;
      try {
        const text = await res.text();
        const trimmed = text.trim();
        if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return;
        networkRecords.push({
          index: networkIndex,
          url: res.url(),
          status: res.status(),
          contentType,
          resourceType,
          json: JSON.parse(trimmed),
        });
        networkIndex += 1;
      } catch {
        // Ignore non-JSON or unavailable response bodies.
      }
    });
    const freshUrl = new URL(sourceUrl);
    freshUrl.searchParams.set("_lm_fresh", String(Date.now()));
    await page.goto(freshUrl.toString(), { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);

    const merged = [];
    const seen = new Set();
    let stableRounds = 0;
    let lastScrollSignature = "";
    const initialNetworkCandidates = collectNetworkCandidates(networkRecords, sourceUrl, rawCandidateLimit);
    for (const candidate of initialNetworkCandidates) {
      const key = candidateProductKey(candidate, sourceUrl);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({ ...candidate, visualIndex: merged.length + 1 });
      if (merged.length >= rawCandidateLimit) break;
    }
    const shouldScrollListing = merged.length < safeMaxScan;
    for (let round = 0; shouldScrollListing && round < 90 && merged.length < rawCandidateLimit; round += 1) {
      const beforeCount = merged.length;
      const visible = await collectListingCandidates(page, sourceUrl, rawCandidateLimit);
      for (const candidate of visible) {
        const key = candidateProductKey(candidate, sourceUrl);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push({ ...candidate, visualIndex: merged.length + 1 });
        if (merged.length >= rawCandidateLimit) break;
      }
      const beforeScroll = await page.evaluate(() => ({
        y: window.scrollY,
        height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        images: document.querySelectorAll("img").length,
      })).catch(() => ({ y: 0, height: 0, images: 0 }));
      await page.evaluate(() => window.scrollBy(0, Math.max(520, Math.round(window.innerHeight * 1.25)))).catch(() => undefined);
      await page.waitForTimeout(900);
      const afterScroll = await page.evaluate(() => ({
        y: window.scrollY,
        height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        images: document.querySelectorAll("img").length,
      })).catch(() => ({ y: 0, height: 0, images: 0 }));
      const scrollSignature = `${afterScroll.y}|${afterScroll.height}|${afterScroll.images}|${merged.length}`;
      if (merged.length === beforeCount && scrollSignature === lastScrollSignature) stableRounds += 1;
      else stableRounds = 0;
      lastScrollSignature = scrollSignature;
      const nearBottom = Number(afterScroll.y) + 1200 >= Number(afterScroll.height || beforeScroll.height || 0);
      if (stableRounds >= 6 && nearBottom) break;
    }

    const domCandidateCount = shouldScrollListing ? merged.length : 0;
    const networkCandidates = collectNetworkCandidates(networkRecords, sourceUrl, rawCandidateLimit);
    for (const candidate of networkCandidates) {
      const key = candidateProductKey(candidate, sourceUrl);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({ ...candidate, visualIndex: merged.length + 1 });
      if (merged.length >= rawCandidateLimit) break;
    }

    const detailCandidates = merged;

    const itemSeen = new Set();
    const contentSeen = new Set();
    let skippedPreviouslyScanned = 0;
    let skippedExistingPublished = 0;
    let skippedDuplicateCandidates = 0;
    let skippedNonProductCandidates = 0;
    const scanState = await readState().catch(() => ({}));
    const config = await readConfig().catch(() => ({}));
    const scanHistory = scanState?.scanHistory && typeof scanState.scanHistory === "object" ? scanState.scanHistory : {};
    const historyKey = normalizeUrl(sourceUrl, sourceUrl) || sourceUrl;
    const previousKeys = collectLocalSourceKeys(scanState, sourceUrl);
    const publishedKeys = await readD1PublishedSourceKeys(config, sourceUrl);
    const returnedKeys = [];
    const items = [];
    for (const [index, candidate] of detailCandidates.entries()) {
      const title = candidate.title || `未命名候选 ${index + 1}`;
      const rawTitle = title;
      const costCode = getCostCode(rawTitle);
      const costCny = getCostFromTitle(rawTitle);
      const cleanTitle = cleanProductTitle(rawTitle);
      const brandFields = detectBrandDetails(cleanTitle);
      const prices = calculatePrices(costCny);
      const productImages = uniqueProductImages(candidate.imageUrls || candidate.detailImages || [], 9);
      const itemKey = candidateProductKey(candidate, sourceUrl) || normalizedImageKey(productImages[0] || "") || cleanTitle.toLowerCase().replace(/\s+/g, " ").slice(0, 180);
      const contentKey = candidateContentKey(rawTitle);
      const normalizedCandidateUrl = normalizeUrl(candidate.url, sourceUrl);
      const isSourceShell = normalizedCandidateUrl === normalizeUrl(sourceUrl, sourceUrl)
        && (!hasPriceMarker(rawTitle) || cleanText(rawTitle) === cleanText(sourceName));
      if (isNonProductListingTitle(rawTitle) || isSourceShell || (!hasPriceMarker(rawTitle) && cleanText(rawTitle) === cleanText(sourceName))) {
        skippedNonProductCandidates += 1;
        continue;
      }
      if (!itemKey || itemSeen.has(itemKey) || (contentKey && contentSeen.has(contentKey))) {
        skippedDuplicateCandidates += 1;
        continue;
      }
      if (previousKeys.has(itemKey)) {
        skippedPreviouslyScanned += 1;
        itemSeen.add(itemKey);
        continue;
      }
      if (publishedKeys.has(itemKey)) {
        skippedExistingPublished += 1;
        itemSeen.add(itemKey);
        continue;
      }
      itemSeen.add(itemKey);
      if (contentKey) contentSeen.add(contentKey);
      returnedKeys.push(itemKey);
      const imageIssue = productImages.length >= safeImageLimit ? "" : `图片不足：实际 ${productImages.length} 张`;
      const priceIssue = costCode ? "" : "未识别价格";
      items.push({
        id: `real-${scanId}-${index + 1}`,
        title: rawTitle,
        rawTitle,
        costCode,
        costCny,
        cleanTitle,
        ...brandFields,
        productTitle: "",
        shortDescription: "",
        description: "",
        sourceUrl: candidate.url || sourceUrl,
        sourceAlbumUrl: sourceUrl,
        imageCount: productImages.length,
        imageUrl: productImages[0] || candidate.imageUrls[0] || "",
        galleryImages: productImages,
        imageIssue,
        priceIssue,
        sizes: fixedSizes,
        sizesSource: "settings",
        rawPriceText: costCode,
        detectedCostCny: costCny,
        saleCny: prices.saleCny,
        prices: { GBP: prices.GBP, EUR: prices.EUR, USD: prices.USD },
        status: priceIssue || imageIssue ? "需确认" : "真实候选",
        stage: "scanned",
        workflowStatus: "scanned",
        errors: [],
        imageStatus: imageIssue || "列表候选",
        imageCountType: "listing_images",
        imageStatuses: productImages.map((_, i) => ({ index: i, status: "pending", url: productImages[i], error: null, retryable: true })),
        r2UploadStatus: "pending",
        collectStatus: "待采集",
        category: "tops",
        subcategory: "t-shirts",
        categorySource: "default",
        categoryConfirmed: false,
        existsInD1: false,
        duplicate: false,
        sourceName: sourceName || "",
      });
      if (items.length >= safeMaxScan) break;
    }

    let nextHistory = scanHistory;
    if (returnedKeys.length) {
      nextHistory = {
        ...scanHistory,
        [historyKey]: {
          sourceName: sourceName || "",
          sourceUrl,
          updatedAt: new Date().toISOString(),
          seenProductKeys: Array.from(new Set([...previousKeys, ...returnedKeys])).slice(-1000),
        },
      };
      await writeState({ ...(scanState || {}), scanHistory: nextHistory }).catch(() => undefined);
    }

    const snapshot = detailCandidates.map((candidate, index) => ({
      visualIndex: index + 1,
      domIndex: candidate.domIndex || index + 1,
      x: candidate.x || 0,
      y: candidate.y || 0,
      title: candidate.title,
      source_album_url: sourceUrl,
      source_product_url: candidate.url,
      cover_image: candidate.imageUrls[0] || "",
      detail_opened: false,
      image_count: candidate.imageUrls.length,
      detail_images: [],
      listing_images: candidate.imageUrls || [],
    }));
    const report = {
      ok: true,
      sourceUrl,
      sourceName,
      maxScan: safeMaxScan,
      imageLimit: safeImageLimit,
      scannedCount: items.length,
      domCandidateCount,
      networkCandidateCount: networkCandidates.length,
      skippedPreviouslyScanned,
      skippedExistingPublished,
      skippedDuplicateCandidates,
      skippedNonProductCandidates,
      scanHistory: nextHistory,
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

const ALLOWED_HOSTNAMES = new Set([
  "shop00128866.wecatalog.cn",
  "shop20459435.wecatalog.cn",
  "shop00246489.wecatalog.cn",
  "shop00242636.wecatalog.cn",
  "shop15552286.wecatalog.cn",
  "shop00128866.wgstores.com",
  "shop20459435.wgstores.com",
  "shop00246489.wgstores.com",
  "shop00242636.wgstores.com",
  "shop15552286.wgstores.com",
]);

function isAllowedSourceUrl(sourceUrl) {
  try {
    const parsed = new URL(sourceUrl);
    return parsed.protocol === "https:" && ALLOWED_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
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

  if (url.pathname === "/api/config" && request.method === "GET") {
    sendJson(response, 200, publicConfig(await readConfig()));
    return;
  }

  if (url.pathname === "/api/config" && request.method === "POST") {
    try {
      const payload = JSON.parse(await readBody(request));
      if (payload.deepseekApiKey === "********") delete payload.deepseekApiKey;
      if (payload.cloudflareApiToken === "********") delete payload.cloudflareApiToken;
      sendJson(response, 200, publicConfig(await writeConfig(payload)));
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "配置保存失败" });
    }
    return;
  }

  if (url.pathname === "/api/config/deepseek" && request.method === "POST") {
    try {
      const payload = JSON.parse(await readBody(request));
      const apiKey = String(payload.apiKey || "").trim();
      if (!apiKey) throw new Error("请输入 DeepSeek API Key");
      sendJson(response, 200, { ok: true, config: publicConfig(await writeDeepseekConfig(apiKey)), message: "DeepSeek API 已保存" });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "DeepSeek API 保存失败" });
    }
    return;
  }

  if (url.pathname === "/api/config/deepseek" && request.method === "DELETE") {
    try {
      sendJson(response, 200, { ok: true, config: publicConfig(await writeDeepseekConfig("")), message: "DeepSeek API 已删除" });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "DeepSeek API 删除失败" });
    }
    return;
  }

  if (url.pathname === "/api/test-deepseek" && request.method === "POST") {
    try {
      const config = await readConfig();
      const translated = await deepseekRequest(config, { rawTitle: "P100 cotton T-shirt", cleanTitle: "cotton T-shirt", sizes: ["M"], category: "tops", subcategory: "t-shirts", prices: { GBP: 20 } });
      sendJson(response, 200, { ok: true, model: config.deepseekModel, sample: translated.productTitle || "Connected", message: `DeepSeek 连接成功（${config.deepseekModel}）` });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "DeepSeek 连接失败" });
    }
    return;
  }

  if (url.pathname === "/api/prepare-product" && request.method === "POST") {
    try {
      const { product } = JSON.parse(await readBody(request));
      const code = product.productCode || productCode();
      const copyFields = productCopyFields(product);
      const defaultSizes = await readDefaultSizes();
      const prepared = {
        ...product,
        ...copyFields,
        title: copyFields.rawTitle,
        detectedCostCny: copyFields.costCny,
        rawPriceText: copyFields.costCode,
        productCode: code,
        slug: product.slug || `${slugify(product.productTitle || copyFields.cleanTitle) || "product"}-${code.toLowerCase()}`,
        sizes: product.sizesSource === "manual" ? normalizeSizes(product.sizes, defaultSizes) : defaultSizes,
        sizesSource: product.sizesSource === "manual" ? "manual" : "settings",
        category: normalizeCategory(product.category),
        subcategory: normalizeSubcategory(product.subcategory, normalizeCategory(product.category)),
        status: product.status || "candidate",
        stage: "details_ready",
        workflowStatus: "details_ready",
        errors: product.errors || [],
        imageStatuses: product.imageStatuses || [],
        r2UploadStatus: product.r2UploadStatus || "pending",
      };
      sendJson(response, 200, { ok: true, product: prepared });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "详情整理失败" });
    }
    return;
  }

  if (url.pathname === "/api/translate-product" && request.method === "POST") {
    try {
      const { product } = JSON.parse(await readBody(request));
      const config = await readConfig();
      const copyFields = await resolveBrandBeforeTranslation(config, product);
      if (copyFields.brandNeedsReview) {
        sendJson(response, 200, {
          ok: true,
          product: {
            ...product,
            ...copyFields,
            stage: "brand_review",
            workflowStatus: "brand_review",
          },
          message: "品牌需要人工确认后再翻译",
        });
        return;
      }
      const translated = await deepseekRequest(config, { ...product, ...copyFields });
      const category = normalizeCategory(product.category);
      const code = product.productCode || productCode();
      sendJson(response, 200, { ok: true, product: { ...product, ...copyFields, ...translated, productCode: code, category, subcategory: normalizeSubcategory(product.subcategory, category), categorySource: product.categorySource || "manual", categoryConfirmed: product.categoryConfirmed !== false, slug: `${slugify(translated.productTitle) || "product"}-${code.toLowerCase()}`, stage: "translated", workflowStatus: "translated" } });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "翻译失败" });
    }
    return;
  }

  if (url.pathname === "/api/brand/confirm" && request.method === "POST") {
    try {
      const { product, brand, alias } = JSON.parse(await readBody(request));
      const rawTitle = String(product?.rawTitle || product?.title || "");
      const cleanTitle = cleanProductTitle(product?.cleanTitle || rawTitle);
      const candidateAlias = cleanText(alias) || cleanText(product?.brandCandidates?.[0]?.rawText) || cleanText(brand);
      await writeBrandAlias(brand, candidateAlias);
      sendJson(response, 200, {
        ok: true,
        product: {
          ...product,
          rawTitle,
          cleanTitle,
          detectedBrand: cleanText(brand),
          brandEvidence: candidateAlias ? `人工确认：${candidateAlias} → ${cleanText(brand)}` : "人工确认品牌",
          brandConfidence: "manual",
          brandNeedsReview: false,
          brandCandidates: product?.brandCandidates || [],
          workflowStatus: product?.workflowStatus === "brand_review" ? "details_ready" : product?.workflowStatus,
        },
      });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "品牌确认失败" });
    }
    return;
  }

  if (url.pathname === "/api/process-images" && request.method === "POST") {
    try {
      const { product } = JSON.parse(await readBody(request));
      const result = await processProductImages(product);
      sendJson(response, 200, { ok: true, product: { ...product, productCode: result.productCode, processedImages: result.processed, skippedImages: result.skipped, stage: "images_processed", workflowStatus: "images_processed" } });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "图片处理失败" });
    }
    return;
  }

  if (url.pathname === "/api/upload-r2" && request.method === "POST") {
    try {
      const { product, confirm } = JSON.parse(await readBody(request));
      if (confirm !== true) throw new Error("上传 R2 前必须明确确认");
      if (!product.processedImages?.length) throw new Error("请先完成本地图片处理");
      const config = await readConfig();
      const r2Images = [];
      for (const image of product.processedImages || []) {
        await runWrangler(["r2", "object", "put", `${config.r2BucketName}/${image.imageKey}`, "--file", image.filePath, "--content-type", "image/webp", "--remote", "--force"], config);
        r2Images.push({ ...image, imageUrl: `${config.r2ImageBase.replace(/\/+$/, "")}/${image.imageKey}` });
      }
      sendJson(response, 200, { ok: true, product: { ...product, r2Images, d1Sql: "", r2UploadStatus: "uploaded", stage: "r2_uploaded", workflowStatus: "r2_uploaded" } });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "R2 上传失败" });
    }
    return;
  }

  if (url.pathname === "/api/generate-d1" && request.method === "POST") {
    try {
      const { product } = JSON.parse(await readBody(request));
      const sql = buildD1Sql(product);
      sendJson(response, 200, { ok: true, product: { ...product, d1Sql: sql, stage: "d1_ready", workflowStatus: "d1_ready" }, sql });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "D1 数据生成失败" });
    }
    return;
  }

  if (url.pathname === "/api/write-d1" && request.method === "POST") {
    try {
      const { product, confirm } = JSON.parse(await readBody(request));
      if (confirm !== true) throw new Error("写入 D1 前必须明确确认");
      if (!product.r2Images?.length) throw new Error("请先上传图片到 R2");
      const config = await readConfig();
      const sql = buildD1Sql(product);
      const sqlPath = join(publishRoot, `${product.productCode}-d1.sql`);
      await mkdir(publishRoot, { recursive: true });
      await writeFile(sqlPath, `${sql}\n`, "utf8");
      const output = await runWrangler(["d1", "execute", config.d1DatabaseName, "--remote", "--file", sqlPath, "--yes"], config);
      await rememberScannedProduct(product.sourceAlbumUrl || product.source_album_url || product.sourceUrl, product.sourceName || "", product.sourceUrl);
      sendJson(response, 200, { ok: true, output, product: { ...product, d1Sql: sql, stage: "d1_written", workflowStatus: "d1_written" } });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "D1 写入失败" });
    }
    return;
  }

  if (url.pathname === "/api/verify-product" && request.method === "POST") {
    try {
      const payloadBody = JSON.parse(await readBody(request));
      const product = payloadBody.product || {};
      const code = payloadBody.productCode || product.productCode;
      if (!code) throw new Error("缺少商品编号");
      const config = await readConfig();
      const upstream = await fetch(`${config.catalogApiBase.replace(/\/+$/, "")}/product-code/${encodeURIComponent(code)}`);
      const payload = await upstream.json();
      if (!upstream.ok) throw new Error(payload?.error || `前台接口返回 ${upstream.status}`);
      const p = payload.product;
      if (!p) throw new Error("前台接口未返回商品数据");
      const missing = [];
      if (!p.title || !String(p.title).trim()) missing.push("title");
      if (!p.subtitle || !String(p.subtitle).trim()) missing.push("subtitle");
      if (!p.description || !String(p.description).trim()) missing.push("description");
      if (!p.images || !Array.isArray(p.images) || p.images.length === 0) missing.push("images");
      if (!Number.isFinite(p.priceGbp) || p.priceGbp <= 0) missing.push("priceGbp");
      if (!p.options || !Array.isArray(p.options) || p.options.length === 0) missing.push("options/sizes");
      if (missing.length) throw new Error(`前台商品数据字段缺失: ${missing.join(", ")}`);
      sendJson(response, 200, { ok: true, product: { ...product, frontendProduct: payload.product, stage: "frontend_verified", workflowStatus: "frontend_verified" } });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : "前台验证失败" });
    }
    return;
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      const startedAt = Date.now();
      const config = await readConfig();
      const healthUrl = `${config.catalogApiBase.replace(/\/+$/, "")}/catalog?limit=1`;
      const upstream = await fetch(healthUrl, { method: "GET" });
      const body = await upstream.text();
      sendJson(response, 200, {
        ok: upstream.ok,
        status: upstream.status,
        elapsedMs: Date.now() - startedAt,
        url: healthUrl,
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
      if (!isAllowedSourceUrl(sourceUrl)) {
        sendJson(response, 400, { ok: false, error: "请输入当前来源店铺下的 wecatalog 首页或分类链接。" });
        return;
      }
      const result = await scanLatestCandidates({
        sourceUrl,
        sourceName: String(payload.sourceName || "").trim(),
        maxScan: payload.maxScan,
        imageLimit: payload.imageLimit,
        defaultSizes: payload.defaultSizes,
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
  console.log("Mode: Real scan with manually confirmed translation, R2 upload, and D1 publish steps.");
});
