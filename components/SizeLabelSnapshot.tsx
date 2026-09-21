import { catalogCategories } from "@/lib/catalogTaxonomy";
import type { CatalogSizeStats } from "@/lib/catalogApi";

export function SizeLabelSnapshot({ stats }: { stats: CatalogSizeStats }) {
  const categoryRows = stats.categories
    .filter((row) => row.sizes.length > 0)
    .sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category))
    .slice(0, 4);

  return (
    <section className="seo-section size-label-snapshot" aria-labelledby="size-label-snapshot-heading">
      <h2 id="size-label-snapshot-heading">Sizes currently found across listings</h2>
      <p>
        These counts show size labels recorded on the live listings. A label is an option, not a fit recommendation: the same
        XL can describe different garment measurements, so compare the individual product details before ordering.
      </p>
      <p className="data-note">
        Listings with recorded size options: <strong>{stats.listingsWithSizeOptions.toLocaleString("en-GB")}</strong> of {stats.totalListings.toLocaleString("en-GB")}.
      </p>

      <div className="first-party-table-wrap">
        <table className="first-party-table size-label-table">
          <caption>Size label availability across current listings</caption>
          <thead><tr><th scope="col">Size label</th><th scope="col">Listings</th></tr></thead>
          <tbody>
            {stats.sizeLabels.map((row) => (
              <tr key={row.size}><th scope="row">{row.size}</th><td>{row.count.toLocaleString("en-GB")}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {categoryRows.length ? (
        <div className="size-label-category-grid">
          {categoryRows.map((row) => (
            <div className="size-label-category" key={row.category}>
              <h3>{getCategoryLabel(row.category)}</h3>
              <ul>
                {row.sizes.slice(0, 6).map((size) => <li key={size.size}><span>{size.size}</span><strong>{size.count.toLocaleString("en-GB")}</strong></li>)}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function getCategoryLabel(value: string) {
  return catalogCategories.find((category) => category.value === value)?.label || value;
}

function categoryOrder(category: string) {
  const index = catalogCategories.findIndex((item) => item.value === category);
  return index < 0 ? 99 : index;
}
