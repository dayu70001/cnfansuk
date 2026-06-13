"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/formatMoney";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const color = product.colors[0];
  const size = product.sizes[0];
  const swatches = product.colors.slice(0, 3);

  return (
    <article className="product">
      <Link href={`/product/${product.slug}`} className="shot" aria-label={product.name}>
        <span className="fill product-preview">
          <span className="product-placeholder-mark">CNFans UK</span>
          <span className="product-placeholder-sub">Product preview</span>
        </span>
        <button
          className="add"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceGBP: product.priceGBP,
              color,
              size,
              quantity: 1,
            });
          }}
        >
          Add to cart
        </button>
      </Link>
      <div className="meta">
        <Link className="pname" href={`/product/${product.slug}`}>
          {product.name}
        </Link>
        <span className="price">{formatMoney(product.priceGBP)}</span>
      </div>
      <div className="swatches" aria-label={`${product.name} colours`}>
        {swatches.map((item) => (
          <span className={`swatch swatch-${item.toLowerCase().replaceAll(" ", "-")}`} key={item} />
        ))}
      </div>
    </article>
  );
}
