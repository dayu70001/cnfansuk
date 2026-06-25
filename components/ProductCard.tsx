"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/formatMoney";
import { getProductPrice } from "@/lib/productPrice";
import { trackAddToCart } from "@/lib/metaPixel";
import { useCurrency } from "@/lib/useCurrency";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const color = product.colors.find((item) => item?.trim());
  const size = product.sizes[0];
  const swatches = product.colors.filter((item) => item?.trim()).slice(0, 3);
  const image = product.images.find((item) => item && item !== "placeholder");
  const currentPrice = getProductPrice(product, currency);

  return (
    <article className="product">
      <Link href={`/product/${product.slug}`} className="shot" aria-label={product.name}>
        <span className={image ? "fill product-preview has-product-image" : "fill product-preview"}>
          {image ? <img src={image} alt={product.name} loading="lazy" onError={(event) => event.currentTarget.classList.add("image-error")} /> : null}
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
              productCode: product.id,
              slug: product.slug,
              name: product.name,
              title: product.name,
              productUrl: `/product/${product.slug}`,
              priceGBP: product.priceGBP,
              priceEUR: product.priceEUR,
              priceUSD: product.priceUSD,
              image,
              color,
              size,
              quantity: 1,
            });
            trackAddToCart({
              source_page: "product_card",
              placement: "product_card_add_to_cart",
              button_label: "Add to cart",
              content_name: product.name,
              content_ids: [product.id],
              product_slug: product.slug,
              product_code: product.id,
              content_type: "product",
              currency,
              value: currentPrice,
              num_items: 1,
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
