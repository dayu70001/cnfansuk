import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogSearchForm } from "@/components/CatalogSearchForm";
import { ProductCard } from "@/components/ProductCard";
import { FilterDropdown, type DropdownOption } from "@/components/FilterDropdown";
import { JsonLd } from "@/components/JsonLd";
import { getCategory } from "@/data/categories";
import { getProductsByCategory, products } from "@/data/products";
import { fetchCatalogFilters, fetchCatalogPage } from "@/lib/catalogApi";
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
  const PAGE_SIZE = 20;
  const [catalog, filters] = await Promise.all([
    fetchCatalogPage({ ...catalogQuery, q, brand, subcategory, sort, page, limit: PAGE_SIZE }),
    fetchCatalogFilters(),
  ]);
  const fallbackProducts = sortProducts(
    localProducts.filter((product) => {
      const matchesSearch = q ? `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesBrand = brand ? product.brand.toLowerCase() === brand.toLowerCase() : true;
      const matchesStyle = subcategory ? product.style === subcategory : true;
      return matchesSearch && matchesBrand && matchesStyle;
    }),
    sort,
  );
  const paginatedProducts = catalog === null ? fallbackProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : catalog.products;
  const totalProducts = catalog === null ? fallbackProducts.length : catalog.total;
  const totalPages = catalog === null ? Math.ceil(totalProducts / PAGE_SIZE) : catalog.totalPages;
  const brandOptions = filters?.brands?.length ? getBrandOptionsFromLabels(filters.brands) : getBrandOptions(localProducts);
  const styleGroup = styleOptionsByCategory[filterCategory];
  const hasFilters = Boolean(q || brand || subcategory || (sort && sort !== "newest") || page > 1);
  const productCountLabel = `${totalProducts} ${totalProducts === 1 ? "style" : "styles"}`;

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
        <span className="category-count">{productCountLabel}</span>
      </div>

      <CatalogSearchForm
        action={`/category/${slug}`}
        hiddenFields={[
          brand ? { name: "brand", value: brand } : null,
          subcategory ? { name: "subcategory", value: subcategory } : null,
          sort && sort !== "newest" ? { name: "sort", value: sort } : null,
        ].filter((field): field is { name: string; value: string } => Boolean(field))}
        defaultQuery={q}
        placeholder={`Search ${category.name.toLowerCase()}...`}
        clearHref={hasFilters ? `/category/${slug}` : undefined}
      />

      <div className="category-filter-row" aria-label="Category filters">
        <FilterDropdown
          label={`Brand: ${brandOptions.find((option) => option.value === brand)?.label || "All"}`}
          options={toDropdownOptions([{ value: "", label: "All Brands" }, ...brandOptions], slug, { q, brand, subcategory, sort, page: String(page) }, "brand")}
          currentValue={brand}
        />
        {styleGroup ? (
          <FilterDropdown
            label={`Style: ${styleGroup.options.find((option) => option.value === subcategory)?.label || "All"}`}
            options={toDropdownOptions([{ value: "", label: styleGroup.allLabel }, ...styleGroup.options], slug, { q, brand, subcategory, sort, page: String(page) }, "subcategory")}
            currentValue={subcategory}
          />
        ) : null}
        <FilterDropdown
          label={`Sort: ${sortOptions.find((option) => option.value === sort)?.label || "Newest"}`}
          options={toDropdownOptions(sortOptions, slug, { q, brand, subcategory, sort, page: String(page) }, "sort")}
          currentValue={sort}
        />
      </div>

      {paginatedProducts.length > 0 ? (
        <div className="category-product-grid">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="category-empty">No products found for this filter.</p>
      )}
      <Pagination
        slug={slug}
        current={{ q, brand, subcategory, sort, page: String(page) }}
        page={page}
        totalPages={totalPages}
      />
    </section>
    </>
  );
}

function toDropdownOptions(
  options: StyleOption[],
  slug: string,
  current: NormalizedFilters,
  param: keyof NormalizedFilters,
): DropdownOption[] {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
    href: buildCategoryHref(slug, { ...current, [param]: option.value, page: "1" }),
  }));
}

function Pagination({
  slug,
  current,
  page,
  totalPages,
}: {
  slug: string;
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
        <a href={buildCategoryHref(slug, { ...current, page: prevPage })}>Previous</a>
      )}
      <span className="category-pagination-status">Page {page} of {totalPages}</span>
      {pages.map((item, index) => {
        if (item === "...") {
          return <span key={`ellipsis-${index}`} className="category-pagination-ellipsis">…</span>;
        }
        return page === item ? (
          <span key={item} className="active category-pagination-page">{item}</span>
        ) : (
          <a key={item} className="category-pagination-page" href={buildCategoryHref(slug, { ...current, page: String(item) })}>{item}</a>
        );
      })}
      {page >= totalPages ? (
        <span className="disabled">Next</span>
      ) : (
        <a href={buildCategoryHref(slug, { ...current, page: nextPage })}>Next</a>
      )}
    </nav>
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

function getBrandOptionsFromLabels(items: string[]) {
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
