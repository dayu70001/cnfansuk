import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getCategory } from "@/data/categories";
import { getProductsByCategory, products } from "@/data/products";
import { fetchCatalogProducts } from "@/lib/catalogApi";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  "new-in": {
    title: "New In | Latest Apparel Drops | CNFans UK",
    description:
      "Shop the latest CNFans UK arrivals, including hoodies, jackets, trousers, tops and matching sets for everyday wear.",
  },
  outerwear: {
    title: "Outerwear | Jackets, Coats & Layering Pieces | CNFans UK",
    description:
      "Shop CNFans UK outerwear, including jackets, hooded jackets, puffer jackets, vests and coats for everyday layering.",
  },
  tops: {
    title: "Tops | T-Shirts, Hoodies, Shirts & Knitwear | CNFans UK",
    description:
      "Shop CNFans UK tops, including T-shirts, hoodies, sweatshirts, zip hoodies, shirts and knitwear.",
  },
  bottoms: {
    title: "Bottoms | Trousers, Joggers, Jeans & Shorts | CNFans UK",
    description:
      "Shop CNFans UK bottoms, including trousers, joggers, cargo pants, jeans, shorts and skirts.",
  },
  "co-ords-sets": {
    title: "Co-ords & Sets | Tracksuits & Matching Sets | CNFans UK",
    description:
      "Shop CNFans UK co-ords and sets, including tracksuits, hoodie sets, T-shirt and shorts sets, knit sets and casual matching sets.",
  },
};

type CategoryParams = { params: Promise<{ slug: string }>; searchParams: Promise<CategorySearchParams> };

export async function generateMetadata({ params }: CategoryParams): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) {
    return {
      title: { absolute: `Category Not Found | ${SITE_NAME}` },
      robots: { index: false, follow: false },
    };
  }
  const canonical = `${SITE_URL}/category/${slug}`;
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

type CategorySearchParams = {
  q?: string;
  brand?: string;
  subcategory?: string;
  style?: string;
  sort?: string;
  page?: string;
};

type StyleOption = {
  value: string;
  label: string;
};

type NormalizedFilters = {
  q: string;
  brand: string;
  subcategory: string;
  sort: string;
  page: string;
};

const styleOptionsByCategory: Record<string, { allLabel: string; options: StyleOption[] }> = {
  outerwear: {
    allLabel: "All Outerwear",
    options: [
      { value: "jackets", label: "Jackets" },
      { value: "hooded-jackets", label: "Hooded Jackets" },
      { value: "varsity-jackets", label: "Varsity Jackets" },
      { value: "puffer-jackets", label: "Puffer Jackets" },
      { value: "vests", label: "Vests" },
      { value: "coats", label: "Coats" },
    ],
  },
  tops: {
    allLabel: "All Tops",
    options: [
      { value: "t-shirts", label: "T-Shirts" },
      { value: "tank-tops", label: "Tank Tops" },
      { value: "hoodies", label: "Hoodies" },
      { value: "sweatshirts", label: "Sweatshirts" },
      { value: "zip-hoodies", label: "Zip Hoodies" },
      { value: "shirts", label: "Shirts" },
      { value: "knitwear", label: "Knitwear" },
    ],
  },
  bottoms: {
    allLabel: "All Bottoms",
    options: [
      { value: "trousers", label: "Trousers" },
      { value: "joggers", label: "Joggers" },
      { value: "cargo-pants", label: "Cargo Pants" },
      { value: "jeans", label: "Jeans" },
      { value: "shorts", label: "Shorts" },
      { value: "skirts", label: "Skirts" },
    ],
  },
  "co-ords-sets": {
    allLabel: "All Sets",
    options: [
      { value: "tracksuits", label: "Tracksuits" },
      { value: "hoodie-sets", label: "Hoodie Sets" },
      { value: "t-shirt-shorts-sets", label: "T-Shirt & Shorts Sets" },
      { value: "knit-sets", label: "Knit Sets" },
      { value: "casual-sets", label: "Casual Sets" },
      { value: "jacket-pants-sets", label: "Jacket & Pants Sets" },
    ],
  },
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
];

// PC: 4 cols x 5 rows = 20; Mobile: 2 cols x 10 rows = 20.
const PAGE_SIZE = 20;

const legacyCategoryMap: Record<string, string> = {
  hoodies: "tops",
  "t-shirts": "tops",
  jackets: "outerwear",
  "jeans-trousers": "bottoms",
  tracksuits: "co-ords-sets",
  sets: "co-ords-sets",
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const q = cleanParam(query.q);
  const brand = cleanParam(query.brand);
  const subcategory = cleanParam(query.subcategory) || cleanParam(query.style);
  const sort = cleanParam(query.sort) || "newest";
  const page = cleanPage(query.page);
  const filterCategory = legacyCategoryMap[slug] || slug;
  const localProducts = getProductsByCategory(slug);
  const catalogQuery = slug === "new-in" ? {} : { category: filterCategory };
  const [catalogProducts, optionProducts] = await Promise.all([
    fetchCatalogProducts({ ...catalogQuery, q, brand, subcategory, sort, page, limit: 100 }),
    fetchCatalogProducts({ ...catalogQuery, limit: 100 }),
  ]);
  const matchingCatalogProducts =
    catalogProducts?.filter((product) => (slug === "new-in" ? product.newIn : product.category === filterCategory)) || [];
  const baseProducts = catalogProducts === null ? localProducts : matchingCatalogProducts;
  const filterOptionProducts = optionProducts === null ? localProducts : optionProducts;
  const brandOptions = getBrandOptions(filterOptionProducts);
  const styleGroup = styleOptionsByCategory[filterCategory];
  const categoryProducts = sortProducts(
    baseProducts.filter((product) => {
      const matchesSearch = q ? `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesBrand = brand ? product.brand.toLowerCase() === brand.toLowerCase() : true;
      const matchesStyle = subcategory ? product.style === subcategory : true;
      return matchesSearch && matchesBrand && matchesStyle;
    }),
    sort,
  );
  const hasFilters = Boolean(q || brand || subcategory || (sort && sort !== "newest") || page > 1);
  const productCountLabel = `${categoryProducts.length} ${categoryProducts.length === 1 ? "style" : "styles"}`;

  // Pagination: applied AFTER filtering + sorting, on the full product list.
  const totalCount = categoryProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pagedProducts = categoryProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);
  const showingLabel =
    totalPages > 1
      ? `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`
      : `${totalCount} ${totalCount === 1 ? "style" : "styles"}`;

  const categoryCanonical = `${SITE_URL}/category/${slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: category.name, item: categoryCanonical },
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
            <span>{category.name}</span>
          </nav>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>
        <span className="category-count">{showingLabel}</span>
      </div>

      <form className="category-search-row" action={`/category/${slug}`}>
        {brand ? <input type="hidden" name="brand" value={brand} /> : null}
        {subcategory ? <input type="hidden" name="subcategory" value={subcategory} /> : null}
        {sort && sort !== "newest" ? <input type="hidden" name="sort" value={sort} /> : null}
        <input className="category-search-input" type="search" name="q" defaultValue={q} placeholder={`Search ${category.name.toLowerCase()}...`} />
        <button className="category-search-button" type="submit">
          Search
        </button>
        {hasFilters ? (
          <Link className="category-clear-button" href={`/category/${slug}`}>
            Clear
          </Link>
        ) : null}
      </form>

      <div className="category-filter-row" aria-label="Category filters">
        <FilterMenu
          label={`Brand: ${brandOptions.find((option) => option.value === brand)?.label || "All"}`}
          options={[{ value: "", label: "All Brands" }, ...brandOptions]}
          slug={slug}
          current={{ q, brand, subcategory, sort, page: String(page) }}
          param="brand"
        />
        {styleGroup ? (
          <FilterMenu
            label={`Style: ${styleGroup.options.find((option) => option.value === subcategory)?.label || "All"}`}
            options={[{ value: "", label: styleGroup.allLabel }, ...styleGroup.options]}
            slug={slug}
            current={{ q, brand, subcategory, sort, page: String(page) }}
            param="subcategory"
          />
        ) : null}
        <FilterMenu
          label={`Sort: ${sortOptions.find((option) => option.value === sort)?.label || "Newest"}`}
          options={sortOptions}
          slug={slug}
          current={{ q, brand, subcategory, sort, page: String(page) }}
          param="sort"
        />
      </div>

      {pagedProducts.length > 0 ? (
        <div className="category-product-grid">
          {pagedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="category-empty">No products found for this filter.</p>
      )}

      {totalPages > 1 ? (
        <Pagination
          slug={slug}
          currentPage={currentPage}
          totalPages={totalPages}
          baseParams={{ q, brand, subcategory, sort }}
        />
      ) : null}
    </section>
    </>
  );
}

function buildPageHref(slug: string, page: number, baseParams: { q: string; brand: string; subcategory: string; sort: string }) {
  const search = new URLSearchParams();
  if (baseParams.q) search.set("q", baseParams.q);
  if (baseParams.brand) search.set("brand", baseParams.brand);
  if (baseParams.subcategory) search.set("subcategory", baseParams.subcategory);
  if (baseParams.sort && baseParams.sort !== "newest") search.set("sort", baseParams.sort);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

function buildPageRange(current: number, total: number): (number | "ellipsis")[] {
  // Compact page range with ellipsis. Always include 1 and total.
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const range: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) range.push("ellipsis");
  for (let i = start; i <= end; i++) range.push(i);
  if (end < total - 1) range.push("ellipsis");
  range.push(total);
  return range;
}

function Pagination({
  slug,
  currentPage,
  totalPages,
  baseParams,
}: {
  slug: string;
  currentPage: number;
  totalPages: number;
  baseParams: { q: string; brand: string; subcategory: string; sort: string };
}) {
  const pages = buildPageRange(currentPage, totalPages);
  const prevHref = buildPageHref(slug, currentPage - 1, baseParams);
  const nextHref = buildPageHref(slug, currentPage + 1, baseParams);

  return (
    <nav className="category-pagination" aria-label="Pagination">
      <Link
        className={`category-pagination-arrow${currentPage === 1 ? " is-disabled" : ""}`}
        href={currentPage === 1 ? "#" : prevHref}
        aria-label="Previous page"
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : 0}
        onClick={currentPage === 1 ? (e) => e.preventDefault() : undefined}
      >
        Previous
      </Link>
      <ul className="category-pagination-pages">
        {pages.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <li className="category-pagination-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>
                …
              </li>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <li key={page}>
              <Link
                className={`category-pagination-page${isCurrent ? " is-current" : ""}`}
                href={buildPageHref(slug, page, baseParams)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        className={`category-pagination-arrow${currentPage === totalPages ? " is-disabled" : ""}`}
        href={currentPage === totalPages ? "#" : nextHref}
        aria-label="Next page"
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : 0}
        onClick={currentPage === totalPages ? (e) => e.preventDefault() : undefined}
      >
        Next
      </Link>
    </nav>
  );
}

function FilterMenu({
  current,
  label,
  options,
  param,
  slug,
}: {
  current: NormalizedFilters;
  label: string;
  options: StyleOption[];
  param: keyof NormalizedFilters;
  slug: string;
}) {
  return (
    <details className="category-filter-menu">
      <summary>{label}</summary>
      <div>
        {options.map((option) => (
          <a
            className={current[param] === option.value ? "active" : ""}
            href={buildCategoryHref(slug, { ...current, [param]: option.value, page: "1" })}
            key={option.value || "all"}
            aria-current={current[param] === option.value ? "true" : undefined}
          >
            {option.label}
          </a>
        ))}
      </div>
    </details>
  );
}

function cleanParam(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPage(value: string | undefined) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) ? Math.max(page, 1) : 1;
}

function getBrandOptions(items: Product[]) {
  const brands = new Map<string, string>();
  items.forEach((product) => {
    const label = product.brand.trim();
    if (label && label !== "CNFans UK") brands.set(label, label);
  });
  return Array.from(brands, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

function sortProducts(items: Product[], sort: string) {
  const nextItems = [...items];
  if (sort === "price-low-high") {
    return nextItems.sort((a, b) => a.priceGBP - b.priceGBP);
  }
  if (sort === "price-high-low") {
    return nextItems.sort((a, b) => b.priceGBP - a.priceGBP);
  }
  if (sort === "popular") {
    return nextItems.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return nextItems.sort((a, b) => Number(b.newIn) - Number(a.newIn) || products.indexOf(a) - products.indexOf(b));
}

function buildCategoryHref(slug: string, params: NormalizedFilters) {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.brand) {
    search.set("brand", params.brand);
  }
  if (params.subcategory) {
    search.set("subcategory", params.subcategory);
  }
  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }
  if (params.page && params.page !== "1") {
    search.set("page", params.page);
  }
  const query = search.toString();
  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}
