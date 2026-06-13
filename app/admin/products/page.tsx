import { products } from "@/data/products";
import { formatMoney } from "@/lib/formatMoney";

export default function AdminProductsPage() {
  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Products</h1>
        <p>Mock product list prepared for future management tools.</p>
      </div>
      <div className="admin-product-table">
        {products.map((product) => (
          <article key={product.id}>
            <div className="mini-thumb placeholder-art" />
            <div>
              <h2>{product.name}</h2>
              <p>{product.category}</p>
            </div>
            <strong>{formatMoney(product.priceGBP)}</strong>
            <span>{product.colors.length} colours</span>
            <span>{product.sizes.length} sizes</span>
          </article>
        ))}
      </div>
    </section>
  );
}
