import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogSearchForm } from "@/components/CatalogSearchForm";
import { CategoryFilterDrawer, type CategoryFilterDrawerGroup, type CategoryFilterDrawerOption } from "@/components/CategoryFilterDrawer";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getCategory } from "@/data/categories";
import { getProductsByCategory, products } from "@/data/products";
import { fetchCatalogFilters, fetchCatalogPage } from "@/lib/catalogApi";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  availableCatalogSubcategories,
  catalogSeoSubcategoryPath,
  catalogCategories,
  catalogSubcategories,
  getCatalogSeoSubcategory,
} from "@/lib/catalogTaxonomy";
import type { Product } from "@/lib/types";

// Rendered dynamically because it reads searchParams (filters/sort/page).
// D1 load is reduced via fetch-layer revalidate in lib/catalogApi.ts, not via
// static rendering, so no page-level revalidate is set here.

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  "new-in": {
    title: "New Men's Clothing UK | Latest Styles | CNFans UK",
    description:
      "Shop the latest CNFans UK arrivals, including hoodies, jackets, trousers, tops and matching sets for everyday wear.",
  },
  outerwear: {
    title: "Men's Jackets & Outerwear UK | CNFans UK",
    description:
      "Shop CNFans UK outerwear, including jackets, hooded jackets, puffer jackets, vests and coats for everyday layering.",
  },
  tops: {
    title: "Men's Hoodies, T-Shirts & Knitwear UK | CNFans UK",
    description:
      "Shop CNFans UK tops, including T-shirts, hoodies, sweatshirts, zip hoodies, shirts and knitwear.",
  },
  bottoms: {
    title: "Men's Trousers, Joggers & Jeans UK | CNFans UK",
    description:
      "Shop CNFans UK bottoms, including trousers, joggers, cargo pants, jeans, shorts and skirts.",
  },
  "co-ords-sets": {
    title: "Men's Co-ords & Tracksuits UK | CNFans UK",
    description:
      "Shop CNFans UK co-ords and sets, including tracksuits, hoodie sets, T-shirt and shorts sets, knit sets and casual matching sets.",
  },
};

type CategoryParams = { params: Promise<{ slug: string }>; searchParams: Promise<CategorySearchParams> };

export async function generateMetadata({ params, searchParams }: CategoryParams): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const meta = CATEGORY_META[slug];
  if (!meta) {
    return {
      title: { absolute: `Category Not Found | ${SITE_NAME}` },
      robots: { index: false, follow: false },
    };
  }
  const page = cleanPage(query.page);
  const hasNonPaginationParams = Boolean(
    cleanParam(query.q) ||
    cleanParam(query.brand) ||
    cleanParam(query.category) ||
    cleanParam(query.subcategory) ||
    cleanParam(query.style) ||
    cleanParam(query.price) ||
    (cleanParam(query.sort) && cleanParam(query.sort) !== "newest"),
  );
  const baseCanonical = `${SITE_URL}/category/${slug}`;
  const canonical = !hasNonPaginationParams && page > 1 ? `${baseCanonical}?page=${page}` : baseCanonical;
  const title = !hasNonPaginationParams && page > 1 ? `${meta.title.replace(` | ${SITE_NAME}`, "")} – Page ${page} | ${SITE_NAME}` : meta.title;
  const description = !hasNonPaginationParams && page > 1 ? `${meta.description} Browse page ${page}.` : meta.description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(hasNonPaginationParams ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

type CategorySearchParams = {
  category?: string | string[];
  q?: string;
  brand?: string | string[];
  subcategory?: string | string[];
  style?: string;
  price?: string | string[];
  sort?: string;
  page?: string;
};

type StyleOption = {
  value: string;
  label: string;
};

type NormalizedFilters = {
  category?: string;
  q: string;
  brand: string;
  subcategory: string;
  price?: string;
  sort: string;
  page: string;
};

const priceOptions = [
  { value: "under-50", label: "Under £50" },
  { value: "50-100", label: "£50–£100" },
  { value: "100-150", label: "£100–£150" },
  { value: "150-plus", label: "£150+" },
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

  const isNewIn = slug === "new-in";
  const categoryFilter = isNewIn ? cleanParam(query.category) : "";
  const q = cleanParam(query.q);
  const brand = cleanParam(query.brand);
  const subcategory = cleanParam(query.subcategory) || cleanParam(query.style);
  const price = cleanParam(query.price);
  const sort = cleanParam(query.sort) || "newest";
  const page = cleanPage(query.page);
  const filterCategory = legacyCategoryMap[slug] || slug;
  const localProducts = getProductsByCategory(slug);
  const catalogQuery = isNewIn
    ? { collection: "new-in", category: categoryFilter, subcategory, q, brand, price, sort, page, limit: 20 }
    : { category: filterCategory, q, brand, subcategory, price, sort, page, limit: 20 };
  const PAGE_SIZE = 20;
  const [catalog, newInBase, filters] = await Promise.all([
    fetchCatalogPage(catalogQuery, { bypassNextCache: true }),
    isNewIn
      ? fetchCatalogPage({ collection: "new-in", sort: "newest", page: 1, limit: 100 }, { bypassNextCache: true })
      : Promise.resolve(null),
    isNewIn ? Promise.resolve(null) : fetchCatalogFilters(),
  ]);
  const collectionProducts = isNewIn
    ? (newInBase?.products || localProducts).slice(0, 100)
    : localProducts;
  const fallbackProducts = sortProducts(
    collectionProducts.filter((product) => {
      const matchesSearch = q ? `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase().includes(q.toLowerCase()) : true;
      const selectedBrands = splitFilterValues(brand).map((value) => value.toLowerCase());
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand.toLowerCase());
      const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
      const matchesStyle = subcategory ? product.style === subcategory : true;
      const matchesPrice = matchesPriceRange(product.priceGBP, price);
      return matchesSearch && matchesBrand && matchesCategory && matchesStyle && matchesPrice;
    }),
    sort,
    isNewIn,
  );
  const paginatedProducts = catalog === null
    ? fallbackProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : catalog.products;
  const totalProducts = catalog === null ? fallbackProducts.length : catalog.total;
  const totalPages = catalog === null ? Math.ceil(totalProducts / PAGE_SIZE) : catalog.totalPages;
  if ((brand || subcategory) && totalProducts === 0) {
    notFound();
  }
  if (page > 1 && totalPages > 0 && page > totalPages) {
    notFound();
  }
  const brandOptions = isNewIn
    ? getBrandOptions(collectionProducts)
    : filters?.brands?.length ? getBrandOptionsFromLabels(filters.brands) : getBrandOptions(localProducts);
  const currentFilters: NormalizedFilters = {
    category: categoryFilter,
    q,
    brand,
    subcategory,
    price,
    sort,
    page: String(page),
  };
  const desktopFilterGroups = buildDesktopFilterGroups({
    slug,
    categoryFilter,
    brand,
    brandOptions,
    collectionProducts,
    currentFilters,
    filterCategory,
    filters,
    price,
    q,
    sort,
    subcategory,
  });

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
      </div>

      <div className="category-desktop-filter-toolbar">
        <CatalogSearchForm
          action={`/category/${slug}`}
          hiddenFields={[
            categoryFilter ? { name: "category", value: categoryFilter } : null,
            brand ? { name: "brand", value: brand } : null,
            subcategory ? { name: "subcategory", value: subcategory } : null,
            price ? { name: "price", value: price } : null,
            sort && sort !== "newest" ? { name: "sort", value: sort } : null,
          ].filter((field): field is { name: string; value: string } => Boolean(field))}
          defaultQuery={q}
          placeholder={`Search ${category.name.toLowerCase()}...`}
          clearHref={q ? buildCategoryHref(slug, { ...currentFilters, q: "", page: "1" }) : undefined}
          className="category-desktop-search"
        />

        <CategoryFilterDrawer
          groups={desktopFilterGroups}
          clearAllHref={buildCategoryHref(slug, { ...currentFilters, category: "", subcategory: "", brand: "", price: "", page: "1" })}
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
        current={currentFilters}
        page={page}
        totalPages={totalPages}
      />
    </section>
    </>
  );
}

type DesktopFilterGroupArgs = {
  slug: string;
  categoryFilter: string;
  brand: string;
  brandOptions: StyleOption[];
  collectionProducts: Product[];
  currentFilters: NormalizedFilters;
  filterCategory: string;
  filters: Awaited<ReturnType<typeof fetchCatalogFilters>>;
  price: string;
  q: string;
  sort: string;
  subcategory: string;
};

function buildDesktopFilterGroups(args: DesktopFilterGroupArgs): CategoryFilterDrawerGroup[] {
  const {
    slug,
    categoryFilter,
    brand,
    brandOptions,
    collectionProducts,
    currentFilters,
    filterCategory,
    filters,
    price,
    sort,
    subcategory,
  } = args;
  const categoryOptions = buildDesktopCategoryOptions({
    slug,
    categoryFilter,
    collectionProducts,
    currentFilters,
    filterCategory,
    filters,
    subcategory,
  });
  const selectedCategoryLabels = findSelectedCategoryLabels(categoryOptions);
  const selectedBrands = splitFilterValues(brand);
  const selectedPrices = splitFilterValues(price);
  const selectedBrandLabels = selectedBrands
    .map((value) => brandOptions.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label)
    .filter((label): label is string => Boolean(label));
  const selectedPriceLabels = selectedPrices
    .map((value) => priceOptions.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
  const categoryButtonLabel = selectedCategoryLabels.length === 0
    ? "Category"
    : selectedCategoryLabels.length === 1
      ? selectedCategoryLabels[0]
      : `${selectedCategoryLabels.length} selected`;

  return [
    {
      id: "category",
      label: categoryButtonLabel === "Category" ? "Category" : `Category: ${categoryButtonLabel}`,
      title: "Category",
      multiple: slug !== "new-in",
      options: categoryOptions,
      clearHref: categoryFilter || subcategory
        ? buildCategoryHref(slug, { ...currentFilters, category: "", subcategory: "", page: "1" })
        : undefined,
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
      clearHref: brand ? buildCategoryHref(slug, { ...currentFilters, brand: "", page: "1" }) : undefined,
      options: [
        {
          label: "All Brands",
          href: buildCategoryHref(slug, { ...currentFilters, brand: "", page: "1" }),
          value: "",
          selected: !brand,
        },
        ...brandOptions.map((option) => ({
          label: option.label,
          href: buildCategoryHref(slug, { ...currentFilters, brand: option.value, page: "1" }),
          value: option.value,
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
      clearHref: price ? buildCategoryHref(slug, { ...currentFilters, price: "", page: "1" }) : undefined,
      options: [
        {
          label: "All Prices",
          href: buildCategoryHref(slug, { ...currentFilters, price: "", page: "1" }),
          value: "",
          selected: !price,
        },
        ...priceOptions.map((option) => ({
          label: option.label,
          href: buildCategoryHref(slug, { ...currentFilters, price: option.value, page: "1" }),
          value: option.value,
          selected: selectedPrices.includes(option.value),
        })),
      ],
    },
  ];
}

function findSelectedCategoryLabels(options: CategoryFilterDrawerOption[]): string[] {
  const labels: string[] = [];
  for (const option of options) {
    if (option.selected && option.value) labels.push(option.label);
    if (option.children?.length) labels.push(...findSelectedCategoryLabels(option.children));
  }
  return labels;
}

function buildDesktopCategoryOptions({
  slug,
  categoryFilter,
  collectionProducts,
  currentFilters,
  filterCategory,
  filters,
  subcategory,
}: Pick<DesktopFilterGroupArgs, "slug" | "categoryFilter" | "collectionProducts" | "currentFilters" | "filterCategory" | "filters" | "subcategory">): CategoryFilterDrawerOption[] {
  if (slug === "new-in") {
    const options: CategoryFilterDrawerOption[] = [
      {
        label: "All New In",
        href: buildCategoryHref(slug, { ...currentFilters, category: "", subcategory: "", page: "1" }),
        value: "",
        selected: !categoryFilter && !subcategory,
      },
    ];
    const categoryCounts = new Map<string, number>();
    collectionProducts.forEach((product) => categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1));
    for (const parent of catalogCategories) {
      if (!categoryCounts.get(parent.value)) continue;
      const children = catalogSubcategories[parent.value].filter((option) =>
        collectionProducts.some((product) => product.category === parent.value && product.style === option.value),
      );
      if (!children.length) continue;
      options.push({
        label: parent.label,
        href: buildCategoryHref(slug, { ...currentFilters, category: parent.value, subcategory: "", page: "1" }),
        value: parent.value,
        selected: categoryFilter === parent.value && !subcategory,
        children: [
          {
            label: `All ${parent.label}`,
            href: buildCategoryHref(slug, { ...currentFilters, category: parent.value, subcategory: "", page: "1" }),
            value: "",
            selected: categoryFilter === parent.value && !subcategory,
          },
          ...children.map((option) => ({
            label: option.label,
            href: buildCategoryHref(slug, { ...currentFilters, category: parent.value, subcategory: option.value, page: "1" }),
            value: option.value,
            selected: categoryFilter === parent.value && splitFilterValues(subcategory).includes(option.value),
          })),
        ],
      });
    }
    return options;
  }

  const parent = catalogCategories.find((item) => item.value === filterCategory);
  if (!parent) return [];
  const styleCounts = filters?.counts.subcategories || countProductStyles(collectionProducts, filterCategory);
  const availableStyles = availableCatalogSubcategories(filterCategory, styleCounts);
  return [
    {
      label: `All ${parent.label}`,
      href: buildCategoryHref(slug, { ...currentFilters, subcategory: "", page: "1" }),
      value: "",
      selected: !subcategory,
    },
    ...availableStyles.map((option) => ({
      label: option.label,
      href: buildSeoSubcategoryHref(filterCategory, option.value, currentFilters),
      value: option.value,
      selected: splitFilterValues(subcategory).includes(option.value),
    })),
  ];
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
      <form className="category-pagination-jump" action={`/category/${slug}`} method="get">
        <label htmlFor={`category-page-jump-${slug}`}>Go to page</label>
        {current.category ? <input type="hidden" name="category" value={current.category} /> : null}
        {current.q ? <input type="hidden" name="q" value={current.q} /> : null}
        {current.brand ? <input type="hidden" name="brand" value={current.brand} /> : null}
        {current.subcategory ? <input type="hidden" name="subcategory" value={current.subcategory} /> : null}
        {current.price ? <input type="hidden" name="price" value={current.price} /> : null}
        {current.sort && current.sort !== "newest" ? <input type="hidden" name="sort" value={current.sort} /> : null}
        <input id={`category-page-jump-${slug}`} type="number" name="page" min="1" max={totalPages} inputMode="numeric" defaultValue={page} />
        <button type="submit">GO</button>
      </form>
    </nav>
  );
}

function cleanParam(value: string | string[] | undefined) {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean).join(",")
    : typeof value === "string" ? value.trim() : "";
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

function sortProducts(items: Product[], sort: string, preserveNewestOrder = false) {
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
  if (preserveNewestOrder) return nextItems;
  return nextItems.sort((a, b) => Number(b.newIn) - Number(a.newIn) || products.indexOf(a) - products.indexOf(b));
}

function matchesPriceRange(price: number, range: string) {
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

function countProductStyles(items: Product[], category: string) {
  const counts = new Map<string, number>();
  items.forEach((product) => {
    if (product.category !== category || !product.style) return;
    counts.set(product.style, (counts.get(product.style) || 0) + 1);
  });
  return Array.from(counts, ([subcategory, count]) => ({ category, subcategory, count }));
}

function buildCategoryHref(slug: string, params: NormalizedFilters) {
  return buildPathHref(`/category/${slug}`, params);
}

function buildSeoSubcategoryHref(slug: string, subcategory: string, params: NormalizedFilters) {
  return buildPathHref(catalogSeoSubcategoryPath(slug, subcategory), {
    ...params,
    category: "",
    subcategory: "",
    page: "1",
  });
}

function buildPathHref(path: string, params: NormalizedFilters) {
  const search = new URLSearchParams();
  if (params.category) {
    search.set("category", params.category);
  }
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.brand) {
    search.set("brand", params.brand);
  }
  if (params.subcategory) {
    search.set("subcategory", params.subcategory);
  }
  if (params.price) {
    search.set("price", params.price);
  }
  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }
  if (params.page && params.page !== "1") {
    search.set("page", params.page);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
