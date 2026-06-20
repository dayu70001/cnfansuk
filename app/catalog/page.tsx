import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { fetchCatalogPage, fetchCatalogProducts } from "@/lib/catalogApi";
import type { Product } from "@/lib/types";

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
  const [catalog, optionProducts] = await Promise.all([
    fetchCatalogPage({ ...filters, page, limit: 24 }),
    fetchCatalogProducts({ category: filters.category, limit: 100 }),
  ]);
  const products = catalog?.products || [];
  const brandOptions = getBrandOptions(optionProducts || []);
  const visibleSubcategories = filters.category ? subcategoryOptions[filters.category] || [] : allSubcategoryOptions;
  const hasFilters = Boolean(filters.category || filters.subcategory || filters.brand || filters.q || (filters.sort && filters.sort !== "newest") || page > 1);

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

      <form className="category-search-row" action="/catalog">
        {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
        {filters.subcategory ? <input type="hidden" name="subcategory" value={filters.subcategory} /> : null}
        {filters.brand ? <input type="hidden" name="brand" value={filters.brand} /> : null}
        {filters.sort && filters.sort !== "newest" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
        <input className="category-search-input" type="search" name="q" defaultValue={filters.q} placeholder="Search catalog..." />
        <button className="category-search-button" type="submit">
          Search
        </button>
        {hasFilters ? (
          <Link className="category-clear-button" href="/catalog">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="category-filter-row" aria-label="Catalog filters">
        <FilterMenu label={`Category: ${categoryOptions.find((option) => option.value === filters.category)?.label || "All"}`} options={[{ value: "", label: "All Categories" }, ...categoryOptions]} current={filters} param="category" />
        <FilterMenu label={`Brand: ${brandOptions.find((option) => option.value === filters.brand)?.label || "All"}`} options={[{ value: "", label: "All Brands" }, ...brandOptions]} current={filters} param="brand" />
        <FilterMenu label={`Style: ${visibleSubcategories.find((option) => option.value === filters.subcategory)?.label || "All"}`} options={[{ value: "", label: "All Styles" }, ...visibleSubcategories]} current={filters} param="subcategory" />
        <FilterMenu label={`Sort: ${sortOptions.find((option) => option.value === filters.sort)?.label || "Newest"}`} options={sortOptions} current={filters} param="sort" />
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
    </section>
  );
}

function FilterMenu({
  current,
  label,
  options,
  param,
}: {
  current: NormalizedFilters;
  label: string;
  options: Option[];
  param: keyof NormalizedFilters;
}) {
  return (
    <details className="category-filter-menu">
      <summary>{label}</summary>
      <div>
        {options.map((option) => {
          const next = { ...current, [param]: option.value, page: "1" };
          if (param === "category") next.subcategory = "";
          return (
            <a className={current[param] === option.value ? "active" : ""} href={buildCatalogHref(next)} key={option.value || "all"} aria-current={current[param] === option.value ? "true" : undefined}>
              {option.label}
            </a>
          );
        })}
      </div>
    </details>
  );
}

function getBrandOptions(items: Product[]) {
  const brands = new Map<string, string>();
  items.forEach((product) => {
    const label = product.brand.trim();
    if (label && label !== "CNFans UK") brands.set(label, label);
  });
  return Array.from(brands, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
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
