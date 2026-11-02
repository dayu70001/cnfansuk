import {
  catalogCategories,
  catalogSubcategories,
  isValidCatalogClassification,
} from "@/lib/catalogTaxonomy";

function classificationSlug(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function displayCategoryFallback(category: string): string {
  return category.trim().replace(/[-_]+/g, " ").toUpperCase();
}

/** Format only validated catalogue category/subcategory pairs for product details. */
export function getProductCategoryLabel(
  category: string | null | undefined,
  subcategory: string | null | undefined,
): string {
  const categoryKey = classificationSlug(category);
  if (!categoryKey) return "";

  const parent = catalogCategories.find((item) => item.value === categoryKey);
  if (!parent) return displayCategoryFallback(String(category || ""));

  const parentLabel = parent.label.toUpperCase();
  const subcategoryKey = classificationSlug(subcategory);
  if (!subcategoryKey || subcategoryKey === categoryKey) return parentLabel;
  if (!isValidCatalogClassification(categoryKey, subcategoryKey)) return parentLabel;

  const child = catalogSubcategories[categoryKey]?.find((item) => item.value === subcategoryKey);
  if (!child || child.label.trim().toUpperCase() === parentLabel) return parentLabel;

  return `${parentLabel} / ${child.label.toUpperCase()}`;
}
