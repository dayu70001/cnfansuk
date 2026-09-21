"use client";

import Link from "next/link";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { trackSearch } from "@/lib/metaPixel";

type HiddenField = {
  name: string;
  value: string;
};

type CatalogSearchFormProps = {
  action: string;
  hiddenFields?: HiddenField[];
  defaultQuery?: string;
  placeholder: string;
  clearHref?: string;
  className?: string;
};

export function CatalogSearchForm({
  action,
  hiddenFields = [],
  defaultQuery = "",
  placeholder,
  clearHref,
  className,
}: CatalogSearchFormProps) {
  return (
    <form
      className={["category-search-row", className].filter(Boolean).join(" ")}
      action={action}
      onSubmit={(event) => {
        const search = new FormData(event.currentTarget).get("q");
        const searchString = typeof search === "string" ? search.trim() : "";
        if (searchString) {
          trackSearch({ source_page: "catalog", placement: "catalog_search", search_string: searchString });
          trackGoogleAnalyticsEvent("search", { search_term: searchString });
        }
      }}
    >
      {hiddenFields.map((field) => (
        <input type="hidden" name={field.name} value={field.value} key={field.name} />
      ))}
      <input className="category-search-input" type="search" name="q" defaultValue={defaultQuery} placeholder={placeholder} />
      <button className="category-search-button" type="submit" aria-label="Search products">
        Search
      </button>
      {clearHref ? (
        <Link className="category-clear-button" href={clearHref}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}
