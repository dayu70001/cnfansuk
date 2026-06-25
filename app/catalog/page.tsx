import Link from "next/link";
import { CatalogSearchForm } from "@/components/CatalogSearchForm";
import { ProductCard } from "@/components/ProductCard";
import { FilterDropdown, type DropdownOption } from "@/components/FilterDropdown";
import { fetchCatalogFilters, fetchCatalogPage } from "@/lib/catalogApi";

export const dynamic = "force-dynamic";

type CatalogSearchParams = {
  category?: string;
  subcategory?: string;
  brand?: string;
  q?: string;
  sort?: string;
  page?: string;
};

type Option = {
  value: string;
  label: string;
};

type NormalizedFilters = {
  category: string;
  subcategory: string;
  brand: string;
  q: string;
  sort: string;
  page: string;
};

const categoryOptions: Option[] = [
  { value: "tops", label: "Tops" },
  { value: "outerwear", label: "Outerwear" },
  { value: "bottoms", label: "Bottoms" },
  { value: "co-ords-sets", label: "Co-ords & Sets" },
];

const subcategoryOptions: Record<string, Option[]> = {
  tops: [
    { value: "t-shirts", label: "T-Shirts" },
    { value: "tank-tops", label: "Tank Tops" },
    { value: "hoodies", label: "Hoodies" },
    { value: "sweatshirts", label: "Sweatshirts" },
    { value: "zip-hoodies", label: "Zip Hoodies" },
    { value: "shirts", label: "Shirts" },
    { value: "knitwear", label: "Knitwear" },
  ],
  outerwear: [
    { value: "jackets", label: "Jackets" },
    { value: "hooded-jackets", label: "Hooded Jackets" },
    { value: "varsity-jackets", label: "Varsity Jackets" },
    { value: "puffer-jackets", label: "Puffer Jackets" },
    { value: "vests", label: "Vests" },
    { value: "coats", label: "Coats" },
  ],
  bottoms: [
    { value: "trousers", label: "Trousers" },
    { value: "joggers", label: "Joggers" },
    { value: "cargo-pants", label: "Cargo Pants" },
    { value: "jeans", label: "Jeans" },
    { value: "shorts", label: "Shorts" },
    { value: "skirts", label: "Skirts" },
  ],
  "co-ords-sets": [
    { value: "tracksuits", label: "Tracksuits" },
    { value: "hoodie-sets", label: "Hoodie Sets" },
    { value: "t-shirt-shorts-sets", label: "T-Shirt & Shorts Sets" },
    { value: "knit-sets", label: "Knit Sets" },
    { value: "casual-sets", label: "Casual Sets" },
    { value: "jacket-pants-sets", label: "Jacket & Pants Sets" },
  ],
};

const allSubcategoryOptions = Object.values(subcategoryOptions).flat();

const sortOptions: Option[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const query = await searchParams;
  const filters: NormalizedFilters = {
    category: cleanParam(query.category),
    subcategory: cleanParam(query.subcategory),
    brand: cleanParam(query.brand),
    q: cleanParam(query.q),
    sort: cleanParam(query.sort) || "newest",
    page: String(cleanPage(query.page)),
  };
  const page = Number(filters.page);
  const PAGE_SIZE = 20;
  const [catalog, catalogFilters] = await Promise.all([
    fetchCatalogPage({ ...filters, page, limit: PAGE_SIZE }),
    fetchCatalogFilters(),
  ]);
  const products = catalog?.products || [];
  const brandOptions = getBrandOptions(catalogFilters?.brands || []);
  const totalPages = catalog?.totalPages || 0;
  const visibleSubcategories = filters.category ? subcategoryOptions[filters.category] || [] : allSubcategoryOptions;
  const hasFilters = Boolean(filters.category || filters.subcategory || filters.brand || filters.q || (filters.sort && filters.sort !== "newest") || page > 1);

  const categoryDropdownOptions = toDropdownOptions(
    [{ value: "", label: "All Categories" }, ...categoryOptions],
    filters,
    "category"
  );
  const brandDropdownOptions = toDropdownOptions(
    [{ value: "", label: "All Brands" }, ...brandOptions],
    filters,
    "brand"
  );
  const subcategoryDropdownOptions = toDropdownOptions(
    [{ value: "", label: "All Styles" }, ...visibleSubcategories],
    filters,
    "subcategory"
  );
  const sortDropdownOptions = toDropdownOptions(sortOptions, filters, "sort");

  return (
    <section className="category-page">
      <div className="category-hero">
        <div>
          <nav className="category-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Catalog</span>
          </nav>
          <h1>Catalog</h1>
          <p>Browse the live product catalog by category, brand and style.</p>
        </div>
        <span className="category-count">{catalog?.total ?? products.length} styles</span>
      </div>

      <CatalogSearchForm
        action="/catalog"
        hiddenFields={[
          filters.category ? { name: "category", value: filters.category } : null,
          filters.subcategory ? { name: "subcategory", value: filters.subcategory } : null,
          filters.brand ? { name: "brand", value: filters.brand } : null,
          filters.sort && filters.sort !== "newest" ? { name: "sort", value: filters.sort } : null,
        ].filter((field): field is { name: string; value: string } => Boolean(field))}
        defaultQuery={filters.q}
        placeholder="Search catalog..."
        clearHref={hasFilters ? "/catalog" : undefined}
      />

      <div className="category-filter-row" aria-label="Catalog filters">
        <FilterDropdown
          label={`Category: ${categoryOptions.find((option) => option.value === filters.category)?.label || "All"}`}
          options={categoryDropdownOptions}
          currentValue={filters.category}
        />
        <FilterDropdown
          label={`Brand: ${brandOptions.find((option) => option.value === filters.brand)?.label || "All"}`}
          options={brandDropdownOptions}
          currentValue={filters.brand}
        />
        <FilterDropdown
          label={`Style: ${visibleSubcategories.find((option) => option.value === filters.subcategory)?.label || "All"}`}
          options={subcategoryDropdownOptions}
          currentValue={filters.subcategory}
        />
        <FilterDropdown
          label={`Sort: ${sortOptions.find((option) => option.value === filters.sort)?.label || "Newest"}`}
          options={sortDropdownOptions}
          currentValue={filters.sort}
        />
      </div>

      {products.length > 0 ? (
        <div className="category-product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="category-empty">No products found for this filter.</p>
      )}
      <Pagination current={filters} page={page} totalPages={totalPages} />
    </section>
  );
}

function toDropdownOptions(
  options: Option[],
  current: NormalizedFilters,
  param: keyof NormalizedFilters
): DropdownOption[] {
  return options.map((option) => {
    const next = { ...current, [param]: option.value, page: "1" };
    if (param === "category") next.subcategory = "";
    return {
      value: option.value,
      label: option.label,
      href: buildCatalogHref(next),
    };
  });
}

function Pagination({
  current,
  page,
  totalPages,
}: {
  current: NormalizedFilters;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prevPage = page > 1 ? String(page - 1) : "1";
  const nextPage = page < totalPages ? String(page + 1) : String(totalPages);
  const pages = buildPaginationPages(page, totalPages);

  return (
    <nav className="category-pagination" aria-label="Pagination">
      {page <= 1 ? (
        <span className="disabled">Previous</span>
      ) : (
        <a href={buildCatalogHref({ ...current, page: prevPage })}>Previous</a>
      )}
      <span className="category-pagination-status">Page {page} of {totalPages}</span>
      {pages.map((item, index) => {
        if (item === "...") {
          return <span key={`ellipsis-${index}`} className="category-pagination-ellipsis">…</span>;
        }
        return page === item ? (
          <span key={item} className="active category-pagination-page">{item}</span>
        ) : (
          <a key={item} className="category-pagination-page" href={buildCatalogHref({ ...current, page: String(item) })}>{item}</a>
        );
      })}
      {page >= totalPages ? (
        <span className="disabled">Next</span>
      ) : (
        <a href={buildCatalogHref({ ...current, page: nextPage })}>Next</a>
      )}
    </nav>
  );
}

function getBrandOptions(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter((item) => item && item !== "CNFans UK")
    .map((item) => ({ value: item, label: item }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildPaginationPages(page: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", page - 1, page, page + 1, "...", totalPages];
}

function buildCatalogHref(params: NormalizedFilters) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.subcategory) search.set("subcategory", params.subcategory);
  if (params.brand) search.set("brand", params.brand);
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.page && params.page !== "1") search.set("page", params.page);
  const query = search.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function cleanParam(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPage(value: string | undefined) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) ? Math.max(page, 1) : 1;
}
