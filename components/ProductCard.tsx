"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/formatMoney";
import { getProductPrice } from "@/lib/productPrice";
import { useCurrency } from "@/lib/useCurrency";

export function ProductCard({ product }: { product: Product }) {
  const { currency } = useCurrency();
  const swatches = product.colors.filter((item) => item?.trim()).slice(0, 3);
  const image = product.images.find((item) => item && item !== "placeholder");
  const currentPrice = getProductPrice(product, currency);

  return (
    <article className="product">
      <Link href={`/product/${product.slug}`} className="shot" aria-label={product.name} prefetch={false}>
        <span className={image ? "fill product-preview has-product-image" : "fill product-preview"}>
          {image ? <img src={image} alt={product.name} loading="lazy" onError={(event) => event.currentTarget.classList.add("image-error")} /> : null}
          <span className="product-placeholder-mark">CNFANS UK</span>
          <span className="product-placeholder-sub">Product preview</span>
        </span>
      </Link>
      <div className="meta">
        <Link className="pname" href={`/product/${product.slug}`} prefetch={false}>
          {product.name}
        </Link>
        <span className="price">{formatMoney(currentPrice, currency)}</span>
      </div>
      {swatches.length > 0 ? (
        <div className="swatches" aria-label={`${product.name} colours`}>
          {swatches.map((item) => (
            <span className={`swatch swatch-${item.toLowerCase().replaceAll(" ", "-")}`} key={item} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
