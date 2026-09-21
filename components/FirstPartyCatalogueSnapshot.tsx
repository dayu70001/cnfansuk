import Link from "next/link";
import type { FirstPartyCatalogueData } from "@/lib/firstPartyData";
import { displaySizeLabels } from "@/lib/firstPartyData";

export function FirstPartyCatalogueSnapshot({ data }: { data: FirstPartyCatalogueData }) {
  return (
    <section className="seo-section first-party-snapshot" aria-labelledby="catalogue-snapshot-heading">
      <h2 id="catalogue-snapshot-heading">What&apos;s in the catalogue right now</h2>
      <p>
        This snapshot is taken from listings currently available to browse on CNFans UK. It is a live catalogue view rather
        than a saved spreadsheet, so the links below open the same categories and product pages shoppers can use today.
      </p>

      <div className="first-party-total">
        <span>Total current listings</span>
        <strong>{data.totalListings.toLocaleString("en-GB")}</strong>
      </div>

      <div className="first-party-table-wrap">
        <table className="first-party-table">
          <caption>Current listings by category</caption>
          <thead>
            <tr><th scope="col">Category</th><th scope="col">Listings</th><th scope="col">Browse</th></tr>
          </thead>
          <tbody>
            {data.categoryCounts.map((row) => (
              <tr key={row.category}>
                <th scope="row">{row.label}</th>
                <td>{row.count.toLocaleString("en-GB")}</td>
                <td><Link href={`/category/${row.category}`}>View category</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="first-party-table-wrap">
        <table className="first-party-table first-party-subcategory-table">
          <caption>Current listings by clothing type</caption>
          <thead>
            <tr><th scope="col">Clothing type</th><th scope="col">Listings</th><th scope="col">Browse</th></tr>
          </thead>
          <tbody>
            {data.subcategoryCounts.map((row) => (
              <tr key={`${row.category}/${row.subcategory}`}>
                <th scope="row">{row.label}</th>
                <td>{row.count.toLocaleString("en-GB")}</td>
                <td><Link href={row.href}>View styles</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.examples.length ? (
        <div className="first-party-examples">
          <h3>Product examples from the same catalogue</h3>
          <ul>
            {data.examples.slice(0, 10).map(({ product, categoryLabel, subcategoryLabel }) => (
              <li key={product.id}>
                <Link href={`/product/${product.slug}`}><strong>{product.name}</strong></Link>
                <span>{[product.brand, categoryLabel, subcategoryLabel, displaySizeLabels(product) ? `Sizes: ${displaySizeLabels(product)}` : ""].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
