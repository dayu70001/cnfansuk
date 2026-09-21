// Shared by the storefront, manual editor and Worker. No inferred mappings.
export const catalogCategories = [
  { value: "outerwear", label: "Outerwear" },
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "co-ords-sets", label: "Co-ords & Sets" },
] as const;

export const catalogSubcategories: Record<string, Array<{ value: string; label: string }>> = {
  outerwear: [
    { value: "jackets", label: "Jackets" },
    { value: "puffers", label: "Puffers" },
    { value: "coats", label: "Coats" },
    { value: "gilets", label: "Gilets" },
  ],
  tops: [
    { value: "t-shirts", label: "T-Shirts" },
    { value: "hoodies", label: "Hoodies" },
    { value: "shirts", label: "Shirts" },
    { value: "sweaters", label: "Sweaters" },
  ],
  bottoms: [
    { value: "jeans", label: "Jeans" },
    { value: "trousers", label: "Trousers" },
    { value: "shorts", label: "Shorts" },
  ],
  "co-ords-sets": [
    { value: "shorts-sets", label: "Shorts Sets" },
    { value: "trouser-sets", label: "Trouser Sets" },
  ],
};

export type CatalogCategoryValue = (typeof catalogCategories)[number]["value"];

export type CatalogSeoSubcategory = {
  category: CatalogCategoryValue;
  value: string;
  label: string;
  h1: string;
  title: string;
  description: string;
};

// Only subcategories with live products receive indexable landing pages.
// The taxonomy above remains the source of truth for admin and validation.
export const catalogSeoSubcategories: readonly CatalogSeoSubcategory[] = [
  {
    category: "outerwear",
    value: "jackets",
    label: "Jackets",
    h1: "Men's Jackets",
    title: "Men's Jackets UK | CNFans UK",
    description: "Browse men's jackets in practical weights and everyday fits, with simple notes on layering and sizing for UK buyers.",
  },
  {
    category: "outerwear",
    value: "puffers",
    label: "Puffers",
    h1: "Men's Puffer Jackets",
    title: "Men's Puffer Jackets UK | CNFans UK",
    description: "Explore men's puffer jackets for colder days, with useful guidance on insulation, layering room and everyday fit.",
  },
  {
    category: "outerwear",
    value: "coats",
    label: "Coats",
    h1: "Men's Coats",
    title: "Men's Coats UK | CNFans UK",
    description: "Browse men's coats for everyday UK layering, with practical notes on warmth, fabric and fit over winter clothing.",
  },
  {
    category: "tops",
    value: "t-shirts",
    label: "T-Shirts",
    h1: "Men's T-Shirts",
    title: "Men's T-Shirts UK | CNFans UK",
    description: "Shop men's T-shirts in everyday fits, with simple guidance on fabric weight, sizing and easy casual styling.",
  },
  {
    category: "tops",
    value: "hoodies",
    label: "Hoodies",
    h1: "Men's Hoodies",
    title: "Men's Hoodies UK | CNFans UK",
    description: "Browse men's hoodies for everyday wear and layering, with practical notes on fabric weight, fit and sizing.",
  },
  {
    category: "tops",
    value: "shirts",
    label: "Shirts",
    h1: "Men's Shirts",
    title: "Men's Shirts UK | CNFans UK",
    description: "Explore men's shirts for casual outfits and light layering, with clear notes on fabric, fit and everyday wear.",
  },
  {
    category: "tops",
    value: "sweaters",
    label: "Sweaters",
    h1: "Men's Sweaters",
    title: "Men's Sweaters UK | CNFans UK",
    description: "Browse men's sweaters and knit layers for changing UK weather, with practical fit, fabric and styling guidance.",
  },
  {
    category: "bottoms",
    value: "jeans",
    label: "Jeans",
    h1: "Men's Jeans",
    title: "Men's Jeans UK | CNFans UK",
    description: "Shop men's jeans in everyday denim fits, with useful notes on rise, leg shape, length and styling.",
  },
  {
    category: "bottoms",
    value: "trousers",
    label: "Trousers",
    h1: "Men's Trousers",
    title: "Men's Trousers UK | CNFans UK",
    description: "Browse men's trousers for everyday outfits, with simple guidance on rise, leg shape, fabric and finished length.",
  },
  {
    category: "bottoms",
    value: "shorts",
    label: "Shorts",
    h1: "Men's Shorts",
    title: "Men's Shorts UK | CNFans UK",
    description: "Explore men's shorts for warmer days, with practical notes on length, fabric, comfort and casual styling.",
  },
  {
    category: "co-ords-sets",
    value: "shorts-sets",
    label: "Shorts Sets",
    h1: "Men's Shorts Sets",
    title: "Men's Shorts Sets UK | CNFans UK",
    description: "Browse men's shorts sets and matching casual outfits, with simple guidance on fabric, fit and everyday wear.",
  },
  {
    category: "co-ords-sets",
    value: "trouser-sets",
    label: "Trouser Sets",
    h1: "Men's Trouser Sets",
    title: "Men's Trouser Sets UK | CNFans UK",
    description: "Explore men's trouser sets and coordinated outfits, with practical notes on proportion, comfort and styling.",
  },
] as const;

export function getCatalogSeoSubcategory(category: string, subcategory: string) {
  return catalogSeoSubcategories.find((item) => item.category === category && item.value === subcategory);
}

export function getCatalogSeoSubcategories(category: string) {
  return catalogSeoSubcategories.filter((item) => item.category === category);
}

export function catalogSeoSubcategoryPath(category: string, subcategory: string) {
  return `/category/${category}/${subcategory}`;
}

export function isCatalogCategory(category: string): boolean {
  return catalogCategories.some((item) => item.value === category);
}

export function isValidCatalogClassification(category: string, subcategory: string | null): boolean {
  return isCatalogCategory(category) && (
    subcategory === null || catalogSubcategories[category].some((item) => item.value === subcategory)
  );
}

// Read old classifications unchanged; only newly assigned pairs must be valid.
export function canUpdateCatalogClassification(
  current: { category: string; subcategory: string | null },
  next: { category: string; subcategory: string | null },
): boolean {
  return (current.category === next.category && current.subcategory === next.subcategory)
    || isValidCatalogClassification(next.category, next.subcategory);
}

export function availableCatalogSubcategories(
  category: string,
  counts: Array<{ category: string; subcategory: string | null; count: number }>,
) {
  if (!isCatalogCategory(category)) return [];
  return catalogSubcategories[category].filter((option) => counts.some((row) =>
    row.category === category && row.subcategory === option.value && row.count > 0,
  ));
}
