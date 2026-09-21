import { fetchCatalogFilters, fetchCatalogPage, fetchCatalogProductBySlug, fetchCatalogSizeStats, type CatalogFilters, type CatalogSizeStats } from "@/lib/catalogApi";
import { catalogCategories, catalogSubcategories } from "@/lib/catalogTaxonomy";
import type { Product } from "@/lib/types";

const EXAMPLE_SUBCATEGORIES = [
  ["tops", "t-shirts"],
  ["tops", "hoodies"],
  ["tops", "sweaters"],
  ["outerwear", "jackets"],
  ["outerwear", "puffers"],
  ["bottoms", "jeans"],
  ["bottoms", "trousers"],
  ["bottoms", "shorts"],
  ["co-ords-sets", "shorts-sets"],
  ["co-ords-sets", "trouser-sets"],
] as const;

export type FirstPartyProductExample = {
  product: Product;
  categoryLabel: string;
  subcategoryLabel: string;
};

export type FirstPartyCatalogueData = {
  totalListings: number;
  categoryCounts: Array<{ category: string; label: string; count: number }>;
  subcategoryCounts: Array<{ category: string; subcategory: string; label: string; count: number; href: string }>;
  examples: FirstPartyProductExample[];
  sizeStats: CatalogSizeStats | null;
};

/**
 * Read-only data for the two guide modules. All counts and examples come from
 * the same Worker-backed catalogue used by storefront pages. If the Worker is
 * unavailable, return null so a guide never renders made-up numbers.
 */
export async function fetchFirstPartyCatalogueData(): Promise<FirstPartyCatalogueData | null> {
  const [filters, sizeStats] = await Promise.all([fetchCatalogFilters(), fetchCatalogSizeStats()]);
  if (!filters) return null;

  const categoryCounts = mapCategoryCounts(filters);
  const subcategoryCounts = mapSubcategoryCounts(filters);
  const available = new Set(subcategoryCounts.filter((row) => row.count > 0).map((row) => `${row.category}/${row.subcategory}`));
  const examplePages = await Promise.all(
    EXAMPLE_SUBCATEGORIES
      .filter(([category, subcategory]) => available.has(`${category}/${subcategory}`))
      .map(async ([category, subcategory]) => ({
        category,
        subcategory,
        page: await fetchCatalogPage(
          { category, subcategory, sort: "newest", page: 1, limit: 1 },
          { bypassNextCache: true },
        ),
      })),
  );
  const resolvedExamples = await Promise.all(examplePages.map(async (item) => {
    const listedProduct = item.page?.products[0];
    const product = listedProduct?.slug ? await fetchCatalogProductBySlug(listedProduct.slug) || listedProduct : listedProduct;
    return { item, product };
  }));
  const examples: FirstPartyProductExample[] = [];
  const seen = new Set<string>();
  for (const { item, product } of resolvedExamples) {
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    examples.push({
      product,
      categoryLabel: categoryLabel(item.category),
      subcategoryLabel: subcategoryLabel(item.category, item.subcategory),
    });
  }

  return {
    totalListings: categoryCounts.reduce((total, row) => total + row.count, 0),
    categoryCounts,
    subcategoryCounts,
    examples,
    sizeStats,
  };
}

function mapCategoryCounts(filters: CatalogFilters) {
  const counts = new Map(filters.counts.categories.map((row) => [row.category, Number(row.count) || 0]));
  return catalogCategories
    .map((category) => ({ category: category.value, label: category.label, count: counts.get(category.value) || 0 }))
    .filter((row) => row.count > 0);
}

function mapSubcategoryCounts(filters: CatalogFilters) {
  const counts = new Map(filters.counts.subcategories.map((row) => [`${row.category}/${row.subcategory}`, Number(row.count) || 0]));
  return catalogCategories.flatMap((category) => (catalogSubcategories[category.value] || []).map((subcategory) => ({
    category: category.value,
    subcategory: subcategory.value,
    label: subcategory.label,
    count: counts.get(`${category.value}/${subcategory.value}`) || 0,
    href: `/category/${category.value}/${subcategory.value}`,
  }))).filter((row) => row.count > 0);
}

function categoryLabel(value: string) {
  return catalogCategories.find((category) => category.value === value)?.label || value;
}

function subcategoryLabel(category: string, value: string) {
  return catalogSubcategories[category]?.find((subcategory) => subcategory.value === value)?.label || value;
}

export function displaySizeLabels(product: Product) {
  return product.sizes.filter(Boolean).join(", ");
}
