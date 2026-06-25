"use client";

import { type MouseEvent, type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/formatMoney";
import { getProductPrice } from "@/lib/productPrice";
import { trackAddToCart, trackInitiateCheckout, trackViewContent } from "@/lib/metaPixel";
import { useCurrency } from "@/lib/useCurrency";
import type { CartItem, Product } from "@/lib/types";
import { useCart } from "./CartProvider";

const galleryLabels = ["Front", "Back", "Detail", "Fabric", "Fit", "Styling", "Close-up", "Inside", "Extra"];

type AccordionKey = "description" | "fit" | "delivery";

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionKey | null>("description");
  const [activeIndex, setActiveIndex] = useState(0);
  const defaultColor = product.colors.find((item) => item?.trim());
  const galleryItems = useMemo(() => product.images.filter((item) => item && item !== "placeholder").slice(0, 9), [product.images]);
  const currentPrice = getProductPrice(product, currency);

  // Fire ViewContent once per product. Guarding by product id prevents a
  // re-render (currency change, gallery state, etc.) from re-sending the event.
  const viewedProductId = useRef<string | null>(null);
  useEffect(() => {
    if (viewedProductId.current === product.id) return;
    viewedProductId.current = product.id;
    trackViewContent({
      source_page: "product_detail",
      content_name: product.name,
      content_ids: [product.id],
      product_slug: product.slug,
      product_code: product.id,
      content_category: product.category,
      content_type: "product",
      currency: "GBP",
      value: product.priceGBP,
    });
  }, [product.category, product.id, product.name, product.priceGBP, product.slug]);

  const cartItem = useMemo<CartItem>(
    () => ({
      productId: product.id,
      productCode: product.id,
      slug: product.slug,
      name: product.name,
      title: product.name,
      productUrl: `/product/${product.slug}`,
      priceGBP: product.priceGBP,
      priceEUR: product.priceEUR,
      priceUSD: product.priceUSD,
      image: galleryItems[0],
      color: defaultColor,
      size,
      quantity,
    }),
    [defaultColor, galleryItems, product.id, product.name, product.priceEUR, product.priceGBP, product.priceUSD, product.slug, quantity, size],
  );

  // Adds the selected item to the cart. Tracking is handled by the caller so
  // that one button click maps to exactly one business event.
  function addSelectedItem(openCart = true) {
    if (!size) {
      setSizeError(true);
      return false;
    }

    addItem(cartItem, { openCart });
    setSizeError(false);
    return true;
  }

  function handleAddToCart(event?: MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    if (addSelectedItem(true)) {
      trackAddToCart({
        source_page: "product_detail",
        placement: "add_to_cart",
        button_label: "Add to cart",
        content_name: product.name,
        content_ids: [product.id],
        product_slug: product.slug,
        product_code: product.id,
        content_type: "product",
        currency,
        value: currentPrice * quantity,
        num_items: quantity,
      });
    }
  }

  function orderNow(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (addSelectedItem(false)) {
      trackInitiateCheckout({
        source_page: "product_detail",
        placement: "order_now",
        button_label: "Order now",
        destination: "/checkout",
        content_name: product.name,
        content_ids: [product.id],
        product_slug: product.slug,
        product_code: product.id,
        content_type: "product",
        currency,
        value: currentPrice * quantity,
        num_items: quantity,
      });
      router.push("/checkout");
    }
  }

  function selectSize(value: string) {
    setSize(value);
    setSizeError(false);
  }

  function showPrevious(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveIndex((index) => (index === 0 ? Math.max(galleryItems.length - 1, 0) : index - 1));
  }

  function showNext(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveIndex((index) => (index + 1) % Math.max(galleryItems.length, 1));
  }

  function updateMobileIndex(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  }

  return (
    <section className="pdp wrap">
      <div className="pdp-gallery" aria-label={`${product.name} gallery`}>
        <div className="pdp-main-frame">
          <div className="pdp-main-viewport">
            <div className="pdp-main-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }} onScroll={updateMobileIndex}>
              {galleryItems.length ? galleryItems.map((image, index) => (
                <div className={`pdp-image pdp-image-${(index % 7) + 1}`} key={index}>
                  <img src={image} alt={`${product.name} ${galleryLabels[index] || `Detail ${index + 1}`}`} onError={(event) => event.currentTarget.classList.add("image-error")} />
                  <span>{galleryLabels[index] || `Detail ${index + 1}`}</span>
                </div>
              )) : (
                <div className="pdp-image pdp-image-empty">
                  <span>Image unavailable</span>
                </div>
              )}
            </div>
          </div>
          <button className="pdp-gallery-arrow previous" type="button" onClick={showPrevious} aria-label="Previous image">
            ‹
          </button>
          <button className="pdp-gallery-arrow next" type="button" onClick={showNext} aria-label="Next image">
            ›
          </button>
          <span className="pdp-count">
            {Math.min(activeIndex + 1, Math.max(galleryItems.length, 1))} / {Math.max(galleryItems.length, 1)}
          </span>
        </div>
        <div className="pdp-thumbs" aria-label="Select product image">
          {galleryItems.map((image, index) => (
            <button
              className={index === activeIndex ? "pdp-thumb selected" : "pdp-thumb"}
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <span className={`pdp-image pdp-image-${(index % 7) + 1}`}>
                <img src={image} alt="" onError={(event) => event.currentTarget.classList.add("image-error")} />
              </span>
            </button>
          ))}
        </div>
        <div className="pdp-dots" aria-hidden="true">
          {Array.from({ length: Math.max(galleryItems.length, 1) }).map((_, index) => (
            <span className={index === activeIndex ? "active" : ""} key={index} />
          ))}
        </div>
      </div>

      <aside className="pdp-info">
        <p className="eyebrow">{product.category.replace("-", " ")}</p>
        <h1>{product.name}</h1>
        <p className="pdp-price">{formatMoney(currentPrice, currency)}</p>

        <div className={sizeError ? "pdp-option size-error" : "pdp-option"}>
          <div className="pdp-size-head">
            <span className="pdp-option-label">Size</span>
            <a href="#" className="pdp-text-link">
              Size guide
            </a>
          </div>
          <div className="pdp-size-grid" aria-label="Select size">
            {product.sizes.map((value) => (
              <button
                className={value === size ? "pdp-size selected" : "pdp-size"}
                key={value}
                type="button"
                onClick={() => selectSize(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="pdp-size-help">{sizeError ? "Please select a size before adding to cart." : "Not sure about your size? Ask us →"}</p>
        </div>

        <div className="pdp-quantity" aria-label="Quantity">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
            −
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => value + 1)}>
            +
          </button>
        </div>

        <button className="btn btn-solid pdp-action" type="button" onClick={handleAddToCart}>
          Add to cart
        </button>
        <button className="btn pdp-action" type="button" onClick={orderNow}>
          Order now
        </button>
        <p className="pdp-note">Submit your order — we&apos;ll confirm sizing, details and payment with you before processing.</p>

        <div className="pdp-accordion">
          <AccordionItem
            title="Description"
            open={openSection === "description"}
            onToggle={() => setOpenSection(openSection === "description" ? null : "description")}
          >
            <p>{product.description}</p>
          </AccordionItem>
          <AccordionItem
            title="Size & Fit"
            open={openSection === "fit"}
            onToggle={() => setOpenSection(openSection === "fit" ? null : "fit")}
          >
            <p>Choose your usual size for a regular fit, or size up for a relaxed feel. If you are between sizes, ask us before confirming your order.</p>
          </AccordionItem>
          <AccordionItem
            title="Delivery & Order Confirmation"
            open={openSection === "delivery"}
            onToggle={() => setOpenSection(openSection === "delivery" ? null : "delivery")}
          >
            <p>Submit your order to receive an order number. We&apos;ll confirm sizing and details with you on WhatsApp or Telegram, then let you know how to complete your order.</p>
          </AccordionItem>
        </div>
      </aside>

      <div className="pdp-mobile-bar">
        <span>{formatMoney(currentPrice, currency)}</span>
        <button className="btn btn-solid" type="button" onClick={handleAddToCart}>
          Add to cart
        </button>
      </div>
    </section>
  );
}

function AccordionItem({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pdp-accordion-item">
      <button type="button" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <span className={open ? "pdp-accordion-icon open" : "pdp-accordion-icon"}>+</span>
      </button>
      {open ? <div className="pdp-accordion-content">{children}</div> : null}
    </div>
  );
}
