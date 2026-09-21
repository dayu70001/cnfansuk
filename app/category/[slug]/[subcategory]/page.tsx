import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogSearchForm } from "@/components/CatalogSearchForm";
import { CategoryFilterDrawer, type CategoryFilterDrawerGroup } from "@/components/CategoryFilterDrawer";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { getCategory } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { fetchCatalogFilters, fetchCatalogPage } from "@/lib/catalogApi";
import {
  catalogSeoSubcategoryPath,
  availableCatalogSubcategories,
  getCatalogSeoSubcategory,
} from "@/lib/catalogTaxonomy";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 20;

type SubcategoryParams = {
  params: Promise<{ slug: string; subcategory: string }>;
  searchParams: Promise<SubcategorySearchParams>;
};

type SubcategorySearchParams = {
  q?: string;
  brand?: string | string[];
  price?: string | string[];
  sort?: string;
  page?: string;
};

export async function generateMetadata({ params, searchParams }: SubcategoryParams): Promise<Metadata> {
  const { slug, subcategory } = await params;
  const config = getCatalogSeoSubcategory(slug, subcategory);
  if (!config) {
    return {
      title: { absolute: "Category Not Found | " + SITE_NAME },
      robots: { index: false, follow: false },
    };
  }

  const query = await searchParams;
  const filters = await fetchCatalogFilters();
  const productCount = getSubcategoryCount(filters, slug, subcategory);
  const page = cleanPage(query.page);
  const hasNonPaginationParams = Boolean(
    cleanParam(query.q) ||
    cleanParam(query.brand) ||
    cleanParam(query.price) ||
    (cleanParam(query.sort) && cleanParam(query.sort) !== "newest"),
  );
  const baseCanonical = SITE_URL + catalogSeoSubcategoryPath(slug, subcategory);
  const canonical = !hasNonPaginationParams && page > 1 ? baseCanonical + "?page=" + page : baseCanonical;
  const title = !hasNonPaginationParams && page > 1
    ? config.title.replace(" | " + SITE_NAME, "") + " – Page " + page + " | " + SITE_NAME
    : config.title;
  const description = !hasNonPaginationParams && page > 1 ? config.description + " Browse page " + page + "." : config.description;
  const shouldNoindex = productCount !== null && productCount < 5;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(hasNonPaginationParams || shouldNoindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: canonical, type: "website", siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SubcategoryPage({ params, searchParams }: SubcategoryParams) {
  const { slug, subcategory } = await params;
  const config = getCatalogSeoSubcategory(slug, subcategory);
  const parent = getCategory(slug);
  if (!config || !parent) notFound();

  const query = await searchParams;
  const q = cleanParam(query.q);
  const brand = cleanParam(query.brand);
  const price = cleanParam(query.price);
  const sort = cleanParam(query.sort) || "newest";
  const page = cleanPage(query.page);
  const basePath = catalogSeoSubcategoryPath(slug, subcategory);

  // Direct server-side category + subcategory query; the browser never
  // receives the parent catalogue to filter locally.
  const [catalog, filters] = await Promise.all([
    fetchCatalogPage(
      { category: slug, subcategory, q, brand, price, sort, page, limit: PAGE_SIZE },
      { bypassNextCache: true },
    ),
    fetchCatalogFilters(),
  ]);

  const localFallback = filterLocalProducts(getProductsByCategory(slug), { q, brand, price, sort, subcategory });
  const pageProducts = catalog === null
    ? localFallback.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : catalog.products;
  const totalProducts = catalog === null ? localFallback.length : catalog.total;
  const totalPages = catalog === null ? Math.ceil(totalProducts / PAGE_SIZE) : catalog.totalPages;
  const subcategoryProductCount = getSubcategoryCount(filters, slug, subcategory)
    ?? getProductsByCategory(slug).filter((product) => product.style === subcategory).length;

  // Empty taxonomy pairs (including Gilets while its count is zero) are not
  // published as indexable pages.
  if (subcategoryProductCount === 0 || totalProducts === 0 || (page > 1 && page > totalPages)) notFound();

  const brandOptions = getBrandOptionsFromLabels(filters?.brands || []);
  const categoryCanonical = SITE_URL + basePath;
  const parentCanonical = SITE_URL + "/category/" + slug;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: parent.name, item: parentCanonical },
      { "@type": "ListItem", position: 3, name: config.label, item: categoryCanonical },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <section className="category-page">
        <div className="category-hero">
          <div>
            <nav className="category-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={"/category/" + slug}>{parent.name}</Link>
              <span>/</span>
              <span>{config.label}</span>
            </nav>
            <h1>{config.h1}</h1>
            <p>{config.description}</p>
          </div>
        </div>

        <div className="category-desktop-filter-toolbar">
          <CatalogSearchForm
            action={basePath}
            hiddenFields={[
              brand ? { name: "brand", value: brand } : null,
              price ? { name: "price", value: price } : null,
              sort && sort !== "newest" ? { name: "sort", value: sort } : null,
            ].filter((field): field is { name: string; value: string } => Boolean(field))}
            defaultQuery={q}
            placeholder={"Search " + config.label.toLowerCase() + "..."}
            clearHref={q ? buildHref(basePath, { q: "", brand, price, sort, page: "1" }) : undefined}
            className="category-desktop-search"
          />

          <CategoryFilterDrawer
            groups={buildDesktopFilterGroups({ slug, subcategory, parentName: parent.name, configLabel: config.label, brand, brandOptions, price, sort, q, currentPage: String(page), basePath, filters })}
            clearAllHref={buildHref(`/category/${slug}`, { q, brand: "", price: "", sort, page: "1" })}
          />
        </div>

        {pageProducts.length > 0 ? (
          <div className="category-product-grid">
            {pageProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="category-empty">No products found for this filter.</p>
        )}
        <Pagination current={{ q, brand, price, sort, page: String(page) }} page={page} totalPages={totalPages} basePath={basePath} />
      </section>
    </>
  );
}

const priceOptions = [
  { value: "under-50", label: "Under £50" },
  { value: "50-100", label: "£50–£100" },
  { value: "100-150", label: "£100–£150" },
  { value: "150-plus", label: "£150+" },
];

type FilterState = { q: string; brand: string; price: string; sort: string; page: string };

function buildDesktopFilterGroups({
  slug,
  subcategory,
  parentName,
  configLabel,
  brand,
  brandOptions,
  price,
  sort,
  q,
  currentPage,
  basePath,
  filters,
}: {
  slug: string;
  subcategory: string;
  parentName: string;
  configLabel: string;
  brand: string;
  brandOptions: Array<{ value: string; label: string }>;
  price: string;
  sort: string;
  q: string;
  currentPage: string;
  basePath: string;
  filters: Awaited<ReturnType<typeof fetchCatalogFilters>>;
}): CategoryFilterDrawerGroup[] {
  const current = { q, brand, price, sort, page: currentPage };
  const siblingCounts = filters?.counts.subcategories || [];
  const siblingOptions = availableCatalogSubcategories(
    slug,
    siblingCounts.length ? siblingCounts : getProductsByCategory(slug).map((product) => ({ category: slug, subcategory: product.style, count: 1 })),
  );
  const categoryOptions = [
    {
      label: `All ${parentName}`,
      href: buildHref(`/category/${slug}`, { ...current, page: "1" }),
      value: "",
      selected: false,
    },
    ...siblingOptions.map((option) => ({
      label: option.label,
      href: buildSubcategoryHref(slug, option.value, current),
      value: option.value,
      selected: option.value === subcategory,
    })),
  ];
  const selectedBrands = splitFilterValues(brand);
  const selectedPrices = splitFilterValues(price);
  const selectedBrandLabels = selectedBrands
    .map((value) => brandOptions.find((option) => option.value && option.value.toLowerCase() === value.toLowerCase())?.label)
    .filter((label): label is string => Boolean(label));
  const selectedPriceLabels = selectedPrices
    .map((value) => priceOptions.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
  return [
    {
      id: "category",
      label: `Category: ${configLabel}`,
      title: "Category",
      multiple: true,
      options: categoryOptions,
      clearHref: buildHref(`/category/${slug}`, { ...current, page: "1" }),
    },
    {
      id: "brand",
      label: selectedBrandLabels.length === 0
        ? "Brand"
        : selectedBrandLabels.length === 1
          ? `Brand: ${selectedBrandLabels[0]}`
          : `Brand: ${selectedBrandLabels.length} selected`,
      title: "Brand",
      multiple: true,
      clearHref: brand ? buildHref(basePath, { ...current, brand: "", page: "1" }) : undefined,
      options: [
        { label: "All Brands", href: buildHref(basePath, { ...current, brand: "", page: "1" }), selected: !brand },
        ...brandOptions.filter((option) => option.value).map((option) => ({
          label: option.label,
          href: buildHref(basePath, { ...current, brand: option.value, page: "1" }),
          selected: selectedBrands.some((value) => option.value.toLowerCase() === value.toLowerCase()),
        })),
      ],
    },
    {
      id: "price",
      label: selectedPriceLabels.length === 0
        ? "Price"
        : selectedPriceLabels.length === 1
          ? `Price: ${selectedPriceLabels[0]}`
          : `Price: ${selectedPriceLabels.length} selected`,
      title: "Price",
      multiple: true,
      clearHref: price ? buildHref(basePath, { ...current, price: "", page: "1" }) : undefined,
      options: [
        { label: "All Prices", href: buildHref(basePath, { ...current, price: "", page: "1" }), selected: !price },
        ...priceOptions.map((option) => ({
          label: option.label,
          href: buildHref(basePath, { ...current, price: option.value, page: "1" }),
          selected: selectedPrices.includes(option.value),
        })),
      ],
    },
  ];
}

function Pagination({
  current,
  page,
  totalPages,
  basePath,
}: {
  current: FilterState;
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;
  const pages = buildPaginationPages(page, totalPages);
  const prevPage = page > 1 ? String(page - 1) : "1";
  const nextPage = page < totalPages ? String(page + 1) : String(totalPages);

  return (
    <nav className="category-pagination" aria-label="Pagination">
      {page <= 1 ? <span className="disabled">Previous</span> : <a href={buildHref(basePath, { ...current, page: prevPage })}>Previous</a>}
      <span className="category-pagination-status">Page {page} of {totalPages}</span>
      {pages.map((item, index) => item === "..."
        ? <span key={"ellipsis-" + index} className="category-pagination-ellipsis">…</span>
        : page === item
          ? <span key={item} className="active category-pagination-page">{item}</span>
          : <a key={item} className="category-pagination-page" href={buildHref(basePath, { ...current, page: String(item) })}>{item}</a>)}
      {page >= totalPages ? <span className="disabled">Next</span> : <a href={buildHref(basePath, { ...current, page: nextPage })}>Next</a>}
      <form className="category-pagination-jump" action={basePath} method="get">
        <label htmlFor={`category-page-jump-${basePath.replace(/[^a-z0-9]+/gi, "-")}`}>Go to page</label>
        {current.q ? <input type="hidden" name="q" value={current.q} /> : null}
        {current.brand ? <input type="hidden" name="brand" value={current.brand} /> : null}
        {current.price ? <input type="hidden" name="price" value={current.price} /> : null}
        {current.sort && current.sort !== "newest" ? <input type="hidden" name="sort" value={current.sort} /> : null}
        <input id={`category-page-jump-${basePath.replace(/[^a-z0-9]+/gi, "-")}`} type="number" name="page" min="1" max={totalPages} inputMode="numeric" defaultValue={page} />
        <button type="submit">GO</button>
      </form>
    </nav>
  );
}

function buildPaginationPages(page: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", page - 1, page, page + 1, "...", totalPages];
}

function buildHref(basePath: string, params: FilterState) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.brand) search.set("brand", params.brand);
  if (params.price) search.set("price", params.price);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.page && params.page !== "1") search.set("page", params.page);
  const query = search.toString();
  return query ? basePath + "?" + query : basePath;
}

function buildSubcategoryHref(slug: string, subcategory: string, params: FilterState) {
  return buildHref(catalogSeoSubcategoryPath(slug, subcategory), { ...params, page: "1" });
}

function filterLocalProducts(items: Product[], filters: { q: string; brand: string; price: string; sort: string; subcategory: string }) {
  const filtered = items.filter((product) => {
    const text = (product.name + " " + product.shortDescription + " " + product.description).toLowerCase();
    const selectedBrands = splitFilterValues(filters.brand).map((value) => value.toLowerCase());
    return product.style === filters.subcategory
      && (!filters.q || text.includes(filters.q.toLowerCase()))
      && (!selectedBrands.length || selectedBrands.includes(product.brand.toLowerCase()))
      && matchesPrice(product.priceGBP, filters.price);
  });
  if (filters.sort === "price-low-high") return filtered.sort((a, b) => a.priceGBP - b.priceGBP);
  if (filters.sort === "price-high-low") return filtered.sort((a, b) => b.priceGBP - a.priceGBP);
  if (filters.sort === "popular") return filtered.sort((a, b) => Number(b.featured) - Number(a.featured));
  return filtered;
}

function matchesPrice(price: number, range: string) {
  const ranges = splitFilterValues(range);
  if (!ranges.length) return true;
  return ranges.some((value) => {
    if (value === "under-50") return price < 50;
    if (value === "50-100") return price >= 50 && price < 100;
    if (value === "100-150") return price >= 100 && price < 150;
    if (value === "150-plus") return price >= 150;
    return false;
  });
}

function splitFilterValues(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : [value || ""];
  return values.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
}

function getBrandOptionsFromLabels(items: string[]) {
  return [
    { value: "", label: "All Brands" },
    ...items
      .map((item) => item.trim())
      .filter((item) => item && item !== "CNFans UK")
      .map((item) => ({ value: item, label: item }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

function getSubcategoryCount(
  filters: Awaited<ReturnType<typeof fetchCatalogFilters>>,
  category: string,
  subcategory: string,
) {
  const row = filters?.counts.subcategories.find((item) => item.category === category && item.subcategory === subcategory);
  return row ? row.count : filters ? 0 : null;
}

function cleanParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean).join(",") : typeof value === "string" ? value.trim() : "";
}

function cleanPage(value: string | undefined) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) ? Math.max(page, 1) : 1;
}
