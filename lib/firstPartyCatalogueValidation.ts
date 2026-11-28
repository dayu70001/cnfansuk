type CountRow = { category?: unknown; subcategory?: unknown; brand?: unknown; count?: unknown };

type CatalogueFiltersLike = {
  categories?: unknown;
  subcategories?: unknown;
  brands?: unknown;
  counts?: {
    categories?: unknown;
    subcategories?: unknown;
    brands?: unknown;
  };
};

type CataloguePageLike = {
  products?: unknown;
  total?: unknown;
  page?: unknown;
  limit?: unknown;
  totalPages?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function validCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function sameValues(left: string[], right: string[]) {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

export function validateFirstPartyCatalogueState(filtersValue: unknown, pageValue: unknown): number | null {
  if (!isRecord(filtersValue) || !isRecord(pageValue)) return null;
  const filters = filtersValue as CatalogueFiltersLike;
  const counts = filters.counts;
  const page = pageValue as CataloguePageLike;
  if (!counts
    || !validStringArray(filters.categories)
    || !validStringArray(filters.subcategories)
    || !validStringArray(filters.brands)
    || !Array.isArray(counts.categories)
    || !Array.isArray(counts.subcategories)
    || !Array.isArray(counts.brands)
    || !Array.isArray(page.products)
    || !validCount(page.total)
    || page.page !== 1
    || !validCount(page.limit)
    || page.limit < 1
    || !validCount(page.totalPages)) return null;

  const categoryRows = counts.categories as CountRow[];
  const subcategoryRows = counts.subcategories as CountRow[];
  const brandRows = counts.brands as CountRow[];
  const validRows = (rows: CountRow[], keys: Array<keyof CountRow>) => rows.every((row) =>
    isRecord(row)
      && validCount(row.count)
      && Number(row.count) > 0
      && keys.every((key) => typeof row[key] === "string" && String(row[key]).trim().length > 0),
  );
  if (!validRows(categoryRows, ["category"])
    || !validRows(subcategoryRows, ["category", "subcategory"])
    || !validRows(brandRows, ["brand"])) return null;

  const categoryNames = categoryRows.map((row) => String(row.category));
  const subcategoryNames = subcategoryRows.map((row) => String(row.subcategory));
  const brandNames = brandRows.map((row) => String(row.brand));
  if (new Set(categoryNames).size !== categoryNames.length
    || new Set(categoryNames).size !== filters.categories.length
    || !sameValues(categoryNames, filters.categories)
    || !sameValues(subcategoryNames, filters.subcategories)
    || !sameValues(brandNames.map((value) => value.toLocaleLowerCase("en")), filters.brands.map((value) => value.toLocaleLowerCase("en")))) {
    return null;
  }

  const categoryTotal = categoryRows.reduce((sum, row) => sum + Number(row.count), 0);
  if (!Number.isSafeInteger(categoryTotal) || categoryTotal !== page.total) return null;

  const expectedPages = page.total === 0 ? 0 : Math.ceil(Number(page.total) / Number(page.limit));
  const expectedPageSize = Math.min(Number(page.total), Number(page.limit));
  if (page.totalPages !== expectedPages || page.products.length !== expectedPageSize) return null;
  if (page.products.some((product) => !isRecord(product) || typeof product.slug !== "string" || !product.slug.trim())) return null;

  return Number(page.total);
}
