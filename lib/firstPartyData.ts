import { fetchCatalogFilters, fetchCatalogPage, fetchCatalogProductBySlug, type CatalogFilters } from "@/lib/catalogApi";
import { catalogCategories, catalogSubcategories } from "@/lib/catalogTaxonomy";
import { validateFirstPartyCatalogueState } from "@/lib/firstPartyCatalogueValidation";
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
};

/**
 * Read-only data for the two guide modules. All counts and examples come from
 * the same Worker-backed catalogue used by storefront pages. If the Worker is
 * unavailable, return null so a guide never renders made-up numbers.
 */
export async function fetchFirstPartyCatalogueData(): Promise<FirstPartyCatalogueData | null> {
  try {
    const [filters, firstPage] = await Promise.all([
      fetchCatalogFilters(),
      fetchCatalogPage({ sort: "newest", page: 1, limit: 1 }, { bypassNextCache: true }),
    ]);
    const totalListings = validateFirstPartyCatalogueState(filters, firstPage);
    if (totalListings === null || !filters) return null;

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
      totalListings,
      categoryCounts,
      subcategoryCounts,
      examples,
    };
  } catch {
    return null;
  }
}

function mapCategoryCounts(filters: CatalogFilters) {
  return filters.counts.categories
    .map((row) => ({ category: row.category, label: categoryLabel(row.category), count: Number(row.count) }))
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
