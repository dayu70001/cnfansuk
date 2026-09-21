import { catalogSubcategories, isValidCatalogClassification } from "../../../lib/catalogTaxonomy";

export type ClassificationStatus = "READY" | "REVIEW" | "UNKNOWN" | "FAILED";

export type ClassificationSource = "title-rule" | "deepseek" | "needs-vision" | "kimi-vision" | null;

// product_code is the source-facing unique identifier and is stable across
// local/production catalog exports. Numeric D1 ids are environment-local.
export const CROSS_ENV_PRODUCT_KEY = "product_code" as const;

export type TitleClassification = {
  category: string;
  subcategory: string;
  reason: string;
  source: "title-rule";
};

export type DeepSeekClassification = {
  category: string | null;
  subcategory: string | null;
  confidence: number;
  reason: string;
};

export type KimiClassification = {
  category: string | null;
  subcategory: string | null;
  confidence: number;
  reason: string;
  image_available: boolean;
};

export const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
export const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const categoryLabels = Object.entries(catalogSubcategories)
  .map(([category, options]) => `${category}: ${options.map((option) => option.value).join(", ")}`)
  .join("\n");

function titleText(title: string): string {
  return title.toLocaleLowerCase("en").replace(/[–—]/g, "-").replace(/[&+]/g, " and ").replace(/\s+/g, " ").trim();
}

function hasWord(title: string, pattern: RegExp): boolean {
  return pattern.test(title);
}

export const UNSUPPORTED_TAXONOMY_REASON = "Product type is outside current clothing taxonomy.";

export function isUnsupportedTitle(title: string): boolean {
  return hasWord(titleText(title), /\b(?:scarf|scarves|hats?|caps?|belts?|bags?|shoes?|socks?|gloves?)\b/);
}

export function classifyByTitleRules(title: string): TitleClassification | null {
  const value = titleText(title);
  if (!value) return null;

  // Sets must win over every top/bottom token. A standalone tracksuit is the
  // one safe exception to the set-length ambiguity: in this catalogue it is
  // a trouser-based co-ord unless the title explicitly says shorts.
  const isSet = hasWord(value, /\b(?:sets?|two[- ]?pieces?|2[- ]?pieces?|matching sets?|co[- ]?ords?|coords?|tracksuits?)\b/);
  if (isSet) {
    if (hasWord(value, /\bshorts?\b/)) return { category: "co-ords-sets", subcategory: "shorts-sets", reason: "Explicit title rule: shorts set.", source: "title-rule" };
    if (hasWord(value, /\b(?:trousers?|pants?|joggers?|sweatpants?|track pants?)\b/)) {
      return { category: "co-ords-sets", subcategory: "trouser-sets", reason: "Explicit title rule: trouser set.", source: "title-rule" };
    }
    if (hasWord(value, /\btracksuits?\b/)) return { category: "co-ords-sets", subcategory: "trouser-sets", reason: "Explicit title rule: tracksuit set.", source: "title-rule" };
    return null;
  }

  // Compound outerwear phrases have priority over their component words.
  if (hasWord(value, /\b(?:gilets?|bodywarmers?|puffer vests?|down vests?)\b/)) return { category: "outerwear", subcategory: "gilets", reason: "Explicit title rule: gilet or vest outerwear.", source: "title-rule" };
  if (hasWord(value, /\b(?:down jackets?|down coats?|puffer jackets?|puffer coats?|puffers?|padded jackets?|padded coats?)\b/)) return { category: "outerwear", subcategory: "puffers", reason: "Explicit title rule: puffer or padded outerwear.", source: "title-rule" };
  if (hasWord(value, /\b(?:trench coats?|overcoats?|wool coats?|long coats?|coats?)\b/)) return { category: "outerwear", subcategory: "coats", reason: "Explicit title rule: coat.", source: "title-rule" };
  if (hasWord(value, /\b(?:jackets?|windbreakers?|bomber jackets?|varsity jackets?|leather jackets?|denim jackets?|shell jackets?|airshells?|track jackets?|shirt jackets?|overshirts?|blousons?)\b/)) {
    return { category: "outerwear", subcategory: "jackets", reason: "Explicit title rule: jacket or overshirt outerwear.", source: "title-rule" };
  }

  if (hasWord(value, /\b(?:t-?shirts?|tees?|short sleeve tees?|long sleeve tees?)\b/)) return { category: "tops", subcategory: "t-shirts", reason: "Explicit title rule: T-shirt or tee.", source: "title-rule" };
  // Cardigan/shirt compounds are genuinely ambiguous and should be reviewed by AI.
  if (hasWord(value, /\b(?:shirt|t-?shirt)\s+cardigans?\b|\bcardigans?\s+(?:shirt|t-?shirt)\b/)) return null;
  // Explicit sweatshirt/hoodie wording wins over the broader pullover/knitwear
  // rule. A pullover on its own remains a sweater; a pullover sweatshirt is a
  // sweatshirt and therefore belongs to Hoodies.
  if (hasWord(value, /\b(?:hoodies?|hooded sweatshirts?|sweatshirts?|crewneck sweatshirts?|crew neck sweatshirts?|zip hoodies?|zip-up hoodies?)\b/)) return { category: "tops", subcategory: "hoodies", reason: "Explicit title rule: hoodie or sweatshirt.", source: "title-rule" };
  if (hasWord(value, /\b(?:sweaters?|jumpers?|cardigans?|knit sweaters?|knitted sweaters?|knit jumpers?|knitted jumpers?|knit cardigans?|knitted cardigans?|round neck knit(?:ted)?|crew neck knit(?:ted)?|crewneck knit(?:ted)?|pullovers?)\b/)) {
    return { category: "tops", subcategory: "sweaters", reason: "Explicit title rule: sweater, jumper or knitwear.", source: "title-rule" };
  }

  if (hasWord(value, /\b(?:shorts|denim shorts|cargo shorts|sweat shorts|track shorts)\b/)) return { category: "bottoms", subcategory: "shorts", reason: "Explicit title rule: shorts.", source: "title-rule" };
  if (hasWord(value, /\b(?:jeans|denim jeans)\b/)) return { category: "bottoms", subcategory: "jeans", reason: "Explicit title rule: jeans.", source: "title-rule" };
  if (hasWord(value, /\b(?:trousers?|pants?|cargo pants?|joggers?|sweatpants?|track pants?|chinos?|casual pants?|dress pants?|suit trousers?|wide leg pants?|wide-leg pants?)\b/)) {
    return { category: "bottoms", subcategory: "trousers", reason: "Explicit title rule: long trousers or pants.", source: "title-rule" };
  }
  if (hasWord(value, /\b(?:shirts?|polo shirts?|polos?)\b/)) return { category: "tops", subcategory: "shirts", reason: "Explicit title rule: shirt or polo.", source: "title-rule" };
  return null;
}

export const DEEPSEEK_SYSTEM_PROMPT = `Classify one clothing product from its English title only. Return one JSON object with exactly category, subcategory, confidence and reason. Allowed taxonomy only:\n${categoryLabels}\nSweater, jumper, cardigan, knit, knitted, pullover, round neck knit and crew neck knit belong to tops/sweaters. Hoodie, hooded sweatshirt, sweatshirt, crewneck sweatshirt, zip hoodie and zip-up hoodie belong to tops/hoodies; ordinary knitwear does not. Products outside this taxonomy, such as scarves, hats, caps, belts, bags, shoes, socks or gloves, must return category and subcategory as null. If the title is not reliable enough, return category and subcategory as null. Never invent a category or force a choice. confidence must be 0 to 1 and reason must be one short sentence. Do not use images, brand history or any existing classification.`;

export function buildDeepSeekRequest(title: string, model: string) {
  return {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DEEPSEEK_SYSTEM_PROMPT },
      { role: "user", content: `Product title: ${title}` },
    ],
  };
}

export function parseDeepSeekClassification(payload: unknown): DeepSeekClassification | null {
  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> } | null)
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  let raw: unknown;
  try { raw = JSON.parse(unwrapJsonText(content)); } catch { return null; }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (!Object.hasOwn(value, "category") || !Object.hasOwn(value, "subcategory")) return null;
  const category = value.category === null ? null : typeof value.category === "string" ? value.category.trim() : null;
  const subcategory = value.subcategory === null ? null : typeof value.subcategory === "string" ? value.subcategory.trim() : null;
  const confidence = Number(value.confidence);
  const reason = typeof value.reason === "string" ? value.reason.trim().slice(0, 240) : "";
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !reason) return null;
  if ((category === null) !== (subcategory === null)) return null;
  if (category !== null && !isValidCatalogClassification(category, subcategory)) return null;
  return { category, subcategory, confidence, reason };
}

export function hasObviousTitleConflict(title: string, result: DeepSeekClassification): boolean {
  if (!result.category || !result.subcategory) return false;
  const value = titleText(title);
  if (/\b(?:sets?|two[- ]?pieces?|2[- ]?pieces?|matching sets?|co[- ]?ords?|coords?|tracksuits?)\b/.test(value) && result.category !== "co-ords-sets") return true;
  if (/\bshorts?\b/.test(value) && /\b(?:sets?|two[- ]?pieces?|2[- ]?pieces?|matching sets?|co[- ]?ords?|coords?|tracksuits?)\b/.test(value) && result.subcategory !== "shorts-sets") return true;
  if (/\b(?:trousers?|pants?|joggers?|sweatpants?|track pants?)\b/.test(value) && /\b(?:sets?|two[- ]?pieces?|2[- ]?pieces?|matching sets?|co[- ]?ords?|coords?|tracksuits?)\b/.test(value) && result.subcategory !== "trouser-sets") return true;
  if (/\bshorts?\b/.test(value) && result.category === "bottoms" && result.subcategory !== "shorts") return true;
  if (/\bjeans\b/.test(value) && (result.category !== "bottoms" || result.subcategory !== "jeans")) return true;
  if (/\b(?:shirt jackets?|overshirts?)\b/.test(value) && (result.category !== "outerwear" || result.subcategory !== "jackets")) return true;
  if (/\b(?:down vests?|puffer vests?)\b/.test(value) && (result.category !== "outerwear" || result.subcategory !== "gilets")) return true;
  if (/\b(?:sweaters?|jumpers?|cardigans?|knit sweaters?|knitted sweaters?|knit jumpers?|knitted jumpers?|knit cardigans?|knitted cardigans?|round neck knit(?:ted)?|crew neck knit(?:ted)?|crewneck knit(?:ted)?|pullovers?)\b/.test(value)
    && !/\b(?:shirt|t-?shirt)\s+cardigans?\b|\bcardigans?\s+(?:shirt|t-?shirt)\b/.test(value)
    && (result.category !== "tops" || result.subcategory !== "sweaters")) return true;
  return false;
}

export function hasUnresolvedSetLength(title: string): boolean {
  const value = titleText(title);
  const isSet = /\b(?:sets?|two[- ]?pieces?|2[- ]?pieces?|matching sets?|co[- ]?ords?|coords?|tracksuits?)\b/.test(value);
  if (!isSet) return false;
  if (/\btracksuits?\b/.test(value) && !/\bshorts?\b/.test(value)) return false;
  return !/\b(?:shorts?|trousers?|pants?|joggers?|sweatpants?|track pants?)\b/.test(value);
}

const DEEPSEEK_UNCERTAIN_REASON = /conflict|unclear|ambiguous|uncertain|cannot|not enough|not state|unknown|unsure|insufficient|unable to determine/i;

/**
 * A valid DeepSeek JSON response can still be too uncertain to use directly.
 * These cases are model uncertainty, not technical failures, and must be
 * escalated to the image-aware Kimi pass.
 */
export function deepSeekNeedsVision(title: string, result: DeepSeekClassification): boolean {
  if (result.category === null || result.subcategory === null) return true;
  if (!isValidCatalogClassification(result.category, result.subcategory)) return true;
  if (hasObviousTitleConflict(title, result) || hasUnresolvedSetLength(title)) return true;
  const value = titleText(title);
  // Technical shell products are often labelled "hoody" but are outerwear;
  // do not let a title-only model place an Airshell/windbreaker into Hoodies.
  if (result.category === "tops" && result.subcategory === "hoodies"
    && /\b(?:airshell|shell jacket|windbreakers?|rain jackets?)\b/.test(value)) return true;
  if (result.confidence < 0.9) return true;
  return DEEPSEEK_UNCERTAIN_REASON.test(result.reason);
}

export const KIMI_SYSTEM_PROMPT = `You classify clothing products for a UK clothing catalogue. Return JSON only with exactly these keys: category, subcategory, confidence, reason, image_available. Use only this taxonomy:\n${categoryLabels}\nA product outside this clothing taxonomy (for example scarf, hat, cap, belt, bag, shoes, socks or gloves), or a product you cannot classify reliably, must return category: null and subcategory: null. Never force an invalid or unrelated category. Rules: title evidence has priority; use the image to validate ambiguous cases. Sweater, jumper, cardigan, knit, knitted, pullover, round neck knit or crew neck knit means tops/sweaters, including zip or hooded cardigans. Hoodie, hooded sweatshirt, sweatshirt, crewneck sweatshirt, zip hoodie or zip-up hoodie means tops/hoodies; do not use hoodies for ordinary sweaters, jumpers, cardigans or knitwear. Shirt or Polo means tops/shirts. Co-ords-sets requires explicit set evidence such as Set, Two Piece, Tracksuit, Matching Set or Co-ord; a model wearing a top and bottom is not a set. Down Jacket, Puffer, Padded Jacket or Down Coat means outerwear/puffers. Vest, Gilet or Bodywarmer means outerwear/gilets. Coat, Overcoat or Trench means outerwear/coats; other outerwear jackets mean outerwear/jackets. Jeans means bottoms/jeans. Shorts means bottoms/shorts. Other long trousers mean bottoms/trousers. A set with shorts means co-ords-sets/shorts-sets; a set with long trousers means co-ords-sets/trouser-sets. If evidence is unclear, return both category and subcategory as null. confidence must be a number from 0 to 1. reason must be one short sentence. image_available must reflect whether an image was supplied.`;

export function buildKimiUserContent(title: string, imageUrl: string | null) {
  const content: Array<Record<string, unknown>> = [
    { type: "text", text: `Product title: ${title}` },
  ];
  if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });
  return content;
}

export function buildKimiRequest(title: string, imageUrl: string | null, model: string) {
  return {
    model,
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: KIMI_SYSTEM_PROMPT },
      { role: "user", content: buildKimiUserContent(title, imageUrl) },
    ],
  };
}

function unwrapJsonText(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseKimiClassification(payload: unknown): KimiClassification | null {
  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> } | null)
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  let value: unknown;
  try {
    value = JSON.parse(unwrapJsonText(content));
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!Object.hasOwn(raw, "category") || !Object.hasOwn(raw, "subcategory")) return null;
  const category = raw.category === null ? null : typeof raw.category === "string" ? raw.category.trim() : null;
  const subcategory = raw.subcategory === null ? null : typeof raw.subcategory === "string" ? raw.subcategory.trim() : null;
  const confidence = Number(raw.confidence);
  const reason = typeof raw.reason === "string" ? raw.reason.trim().slice(0, 240) : "";
  if ((category === null) !== (subcategory === null) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !reason) return null;
  if (category !== null && !isValidCatalogClassification(category, subcategory)) return null;
  return {
    category,
    subcategory,
    confidence,
    reason,
    image_available: Boolean(raw.image_available),
  };
}

export function titleHasClearSignal(title: string): boolean {
  return /\b(t-?shirts?|tees?|hoodies?|sweatshirts?|crewnecks?|shirts?|polos?|sweaters?|jumpers?|cardigans?|knit(?:ted)?|pullovers?|jeans?|shorts?|trousers?|pants?|joggers?|jacket|jackets|puffer|puffers|padded|coat|coats|overcoat|trench|gilet|gilets|vest|bodywarmer|set|sets|two[- ]piece|tracksuit|matching|co-?ord)\b/i.test(title);
}

export function classificationStatus(input: {
  result: KimiClassification;
  oldCategory: string;
  imageAvailable: boolean;
  title: string;
}): ClassificationStatus {
  const { result, oldCategory, imageAvailable, title } = input;
  if (result.category === null && result.subcategory === null) return "UNKNOWN";
  if (result.category === null || result.subcategory === null) return "FAILED";
  if (!isValidCatalogClassification(result.category, result.subcategory)) return "FAILED";
  if (!titleHasClearSignal(title) && !imageAvailable) return "UNKNOWN";
  const reasonConflict = /conflict|unclear|ambiguous|uncertain|cannot|different/i.test(result.reason);
  if (result.confidence < 0.9 || result.category !== oldCategory || reasonConflict || !imageAvailable) return "REVIEW";
  return "READY";
}

export function safeKimiError(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value);
  return message.replace(/bearer\s+\S+/gi, "Bearer [redacted]").replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=[redacted]").slice(0, 240);
}
