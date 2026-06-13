import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getCategory } from "@/data/categories";
import { getProductsByCategory, products } from "@/data/products";
import type { Product } from "@/lib/types";

type CategorySearchParams = {
  q?: string;
  brand?: string;
  style?: string;
  sort?: string;
};

type StyleOption = {
  value: string;
  label: string;
};

const styleOptionsByCategory: Record<string, { allLabel: string; options: StyleOption[] }> = {
  outerwear: {
    allLabel: "All Outerwear",
    options: [
      { value: "jackets", label: "Jackets" },
      { value: "coats", label: "Coats" },
    ],
  },
  tops: {
    allLabel: "All Tops",
    options: [
      { value: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
      { value: "t-shirts", label: "T-Shirts" },
      { value: "shirts", label: "Shirts" },
    ],
  },
  bottoms: {
    allLabel: "All Bottoms",
    options: [
      { value: "jeans-denim", label: "Jeans & Denim" },
      { value: "trousers", label: "Trousers" },
      { value: "shorts", label: "Shorts" },
    ],
  },
  "co-ords-sets": {
    allLabel: "All Sets",
    options: [
      { value: "tracksuits", label: "Tracksuits" },
      { value: "casual-sets", label: "Casual Sets" },
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
  const style = cleanParam(query.style);
  const sort = cleanParam(query.sort) || "newest";
  const filterCategory = legacyCategoryMap[slug] || slug;
  const baseProducts = getProductsByCategory(slug);
  const brandOptions = getBrandOptions(baseProducts);
  const styleGroup = styleOptionsByCategory[filterCategory];
  const categoryProducts = sortProducts(
    baseProducts.filter((product) => {
      const productBrandSlug = slugify(product.brand || "CNFans UK");
      const matchesSearch = q ? `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesBrand = brand ? productBrandSlug === brand : true;
      const matchesStyle = style ? product.style === style : true;
      return matchesSearch && matchesBrand && matchesStyle;
    }),
    sort,
  );
  const hasFilters = Boolean(q || brand || style || (sort && sort !== "newest"));
  const productCountLabel = `${categoryProducts.length} ${categoryProducts.length === 1 ? "style" : "styles"}`;

  return (
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

      <form className="category-search-row" action={`/category/${slug}`}>
        {brand ? <input type="hidden" name="brand" value={brand} /> : null}
        {style ? <input type="hidden" name="style" value={style} /> : null}
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
          current={{ q, brand, style, sort }}
          param="brand"
        />
        {styleGroup ? (
          <FilterMenu
            label={`Style: ${styleGroup.options.find((option) => option.value === style)?.label || "All"}`}
            options={[{ value: "", label: styleGroup.allLabel }, ...styleGroup.options]}
            slug={slug}
            current={{ q, brand, style, sort }}
            param="style"
          />
        ) : null}
        <FilterMenu
          label={`Sort: ${sortOptions.find((option) => option.value === sort)?.label || "Newest"}`}
          options={sortOptions}
          slug={slug}
          current={{ q, brand, style, sort }}
          param="sort"
        />
      </div>

      {categoryProducts.length > 0 ? (
        <div className="category-product-grid">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="category-empty">No products found. Try clearing the filters.</p>
      )}
    </section>
  );
}

function FilterMenu({
  current,
  label,
  options,
  param,
  slug,
}: {
  current: Required<CategorySearchParams>;
  label: string;
  options: StyleOption[];
  param: keyof CategorySearchParams;
  slug: string;
}) {
  return (
    <details className="category-filter-menu">
      <summary>{label} ▾</summary>
      <div>
        {options.map((option) => (
          <Link href={buildCategoryHref(slug, { ...current, [param]: option.value })} key={option.value || "all"}>
            {option.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

function cleanParam(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getBrandOptions(items: Product[]) {
  const brands = new Map<string, string>();
  items.forEach((product) => {
    const label = product.brand || "CNFans UK";
    brands.set(slugify(label), label);
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

function buildCategoryHref(slug: string, params: Required<CategorySearchParams>) {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.brand) {
    search.set("brand", params.brand);
  }
  if (params.style) {
    search.set("style", params.style);
  }
  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }
  const query = search.toString();
  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}
