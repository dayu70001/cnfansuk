"use client";

import Link from "next/link";
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
};

export function CatalogSearchForm({
  action,
  hiddenFields = [],
  defaultQuery = "",
  placeholder,
  clearHref,
}: CatalogSearchFormProps) {
  return (
    <form
      className="category-search-row"
      action={action}
      onSubmit={(event) => {
        const search = new FormData(event.currentTarget).get("q");
        const searchString = typeof search === "string" ? search.trim() : "";
        if (searchString) {
          trackSearch({ source_page: "catalog", placement: "catalog_search", search_string: searchString });
        }
      }}
    >
      {hiddenFields.map((field) => (
        <input type="hidden" name={field.name} value={field.value} key={field.name} />
      ))}
      <input className="category-search-input" type="search" name="q" defaultValue={defaultQuery} placeholder={placeholder} />
      <button className="category-search-button" type="submit">
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
