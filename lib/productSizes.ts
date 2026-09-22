/**
 * Customer-facing purchase sizes for the current CNFans clothing catalogue.
 *
 * Supplier option data remains available to the catalogue layer, but it must
 * not decide which size buttons a customer can select on clothing products.
 */
export const FIXED_CLOTHING_PURCHASE_SIZES = ["M", "L", "XL", "XXL"] as const;

const CLOTHING_CATEGORY_SLUGS = new Set([
  "outerwear",
  "tops",
  "bottoms",
  "co-ords-sets",
  "co-ords-and-sets",
]);

export function isClothingCategory(category: string): boolean {
  return CLOTHING_CATEGORY_SLUGS.has(String(category || "").trim().toLowerCase());
}

export function getCustomerPurchaseSizes(category: string, fallback: readonly string[] = []): string[] {
  return isClothingCategory(category)
    ? [...FIXED_CLOTHING_PURCHASE_SIZES]
    : Array.from(new Set(fallback.map((value) => String(value || "").trim()).filter(Boolean)));
}
