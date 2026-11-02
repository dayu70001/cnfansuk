"use client";

import { type MouseEvent, type PointerEvent, type TouchEvent, type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/formatMoney";
import { getProductPrice } from "@/lib/productPrice";
import { productToGoogleAnalyticsItem, trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { trackAddToCart, trackInitiateCheckout, trackViewContent } from "@/lib/metaPixel";
import { useCurrency } from "@/lib/useCurrency";
import { getCustomerPurchaseSizes } from "@/lib/productSizes";
import { clampGalleryIndex, getAdjacentGalleryIndex, getNearestGalleryIndex } from "@/lib/productGallery";
import { getProductCategoryLabel } from "@/lib/productCategoryLabel";
import type { CartItem, Product } from "@/lib/types";
import { useCart } from "./CartProvider";

const EMPTY_GALLERY_IMAGES: string[] = [];

type AccordionKey = "details" | "fit" | "material" | "delivery" | "returns";
type GalleryState = {
  productId: string;
  activeIndex: number;
  failedImages: string[];
  previewOpen: boolean;
};

const PURE_SIZE_TOKEN = /^(?:XS|S|M|L|XL|XXL|XXXL|[2-5]XL|\d{2,3})$/i;
const LETTER_SIZE_RANGE = /^(?:XS|S|M|L|XL|XXL|XXXL|[2-5]XL)\s*(?:-|–|—|~|～|to)\s*(?:XS|S|M|L|XL|XXL|XXXL|[2-5]XL)$/i;
const NUMBER_SIZE_RANGE = /^\d{2,3}\s*(?:-|–|—|~|～|to)\s*\d{2,3}$/i;

function factLines(value: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(value) ? value : String(value || "").split(/\r?\n|[•·]/);
  return Array.from(new Set(raw
    .map((item) => String(item || "").replace(/^\s*(?:[-•·*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)));
}

function isPureSizeLine(value: string): boolean {
  const text = String(value || "").trim().replace(/[.。!?！]+$/, "");
  if (!text) return false;
  const labelled = text.match(/^(?:sizes?|size|尺码|码数)\s*[:：]?\s*(.+)$/i)?.[1]?.trim();
  const body = labelled || text;
  if (LETTER_SIZE_RANGE.test(body) || NUMBER_SIZE_RANGE.test(body)) return true;
  const tokens = body.replace(/[、，,\/|]+/g, " ").split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => PURE_SIZE_TOKEN.test(token));
}

function isMaterialLine(value: string): boolean {
  return /^(?:material|fabric|材质)\s*[:：-]/i.test(String(value || "").trim());
}

function materialValue(product: Product): string {
  const direct = String(product.material || "").trim();
  if (direct && !/^not specified$/i.test(direct)) return direct;
  const materialLine = factLines(product.description).find(isMaterialLine);
  const parsed = materialLine?.replace(/^(?:material|fabric|材质)\s*[:：-]\s*/i, "").trim() || "";
  return parsed && !/^not specified$/i.test(parsed) ? parsed : "";
}

function productDetailFacts(product: Product): string[] {
  const source = product.productDetails?.length ? product.productDetails : factLines(product.description);
  return source.map((line) => String(line).trim()).filter((line) => line && !isPureSizeLine(line) && !isMaterialLine(line));
}

function sizeFitFacts(product: Product): string[] {
  return factLines(product.sizeFit).filter((line) => !isPureSizeLine(line));
}

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionKey | null>(null);
  const [galleryState, setGalleryState] = useState<GalleryState>(() => ({
    productId: product.id,
    activeIndex: 0,
    failedImages: [],
    previewOpen: false,
  }));
  const galleryStateIsCurrent = galleryState.productId === product.id;
  const activeIndex = galleryStateIsCurrent ? galleryState.activeIndex : 0;
  const failedGalleryImages = galleryStateIsCurrent ? galleryState.failedImages : EMPTY_GALLERY_IMAGES;
  const isImagePreviewOpen = galleryStateIsCurrent && galleryState.previewOpen;
  const mainTrackRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<HTMLDialogElement | null>(null);
  const mobileScrollUpdateRef = useRef(false);
  const zoomReturnScrollPositionRef = useRef<{ left: number; top: number } | null>(null);
  const mainImageGestureRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);
  const suppressMainImageClickRef = useRef(false);
  const lightboxTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoomReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const defaultColor = product.colors.find((item) => item?.trim());
  const purchaseSizes = useMemo(
    () => getCustomerPurchaseSizes(product.category, product.sizes),
    [product.category, product.sizes],
  );
  const galleryItems = useMemo(
    () => product.images.filter((item) => item && item !== "placeholder" && !failedGalleryImages.includes(item)),
    [failedGalleryImages, product.images],
  );
  const currentIndex = clampGalleryIndex(activeIndex, galleryItems.length);
  const activeImage = galleryItems[currentIndex];
  const currentPrice = getProductPrice(product, currency);
  const publicProductCode = product.productCode?.trim() || product.id;
  const details = useMemo(() => productDetailFacts(product), [product]);
  const fitFacts = useMemo(() => sizeFitFacts(product), [product]);
  const material = useMemo(() => materialValue(product), [product]);

  function updateGalleryState(updater: (current: GalleryState) => GalleryState) {
    setGalleryState((current) => updater(current.productId === product.id ? current : {
      productId: product.id,
      activeIndex: 0,
      failedImages: [],
      previewOpen: false,
    }));
  }

  function setActiveIndex(value: number | ((previous: number) => number)) {
    updateGalleryState((current) => ({
      ...current,
      activeIndex: typeof value === "function" ? value(current.activeIndex) : value,
    }));
  }

  function setFailedGalleryImages(value: string[] | ((previous: string[]) => string[])) {
    updateGalleryState((current) => ({
      ...current,
      failedImages: typeof value === "function" ? value(current.failedImages) : value,
    }));
  }

  function setIsImagePreviewOpen(value: boolean | ((previous: boolean) => boolean)) {
    updateGalleryState((current) => ({
      ...current,
      previewOpen: typeof value === "function" ? value(current.previewOpen) : value,
    }));
  }

  useEffect(() => {
    const track = mainTrackRef.current;
    if (!track) return;

    const syncSlidePosition = () => {
      if (!window.matchMedia("(max-width: 860px)").matches) return;
      if (mobileScrollUpdateRef.current) {
        mobileScrollUpdateRef.current = false;
        return;
      }
      const currentTrack = mainTrackRef.current;
      const currentSlide = currentTrack?.children.item(currentIndex) as HTMLElement | null | undefined;
      if (!currentTrack || !currentSlide) return;
      const trackRect = currentTrack.getBoundingClientRect();
      const paddingLeft = Number.parseFloat(window.getComputedStyle(currentTrack).paddingLeft) || 0;
      const snapStart = trackRect.left + currentTrack.clientLeft + paddingLeft;
      const targetScrollLeft = currentTrack.scrollLeft + currentSlide.getBoundingClientRect().left - snapStart;
      currentTrack.scrollLeft = Math.max(0, targetScrollLeft);
    };

    syncSlidePosition();
    const resizeObserver = new ResizeObserver(syncSlidePosition);
    resizeObserver.observe(track);
    window.addEventListener("resize", syncSlidePosition);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncSlidePosition);
    };
  }, [currentIndex, galleryItems]);

  useEffect(() => {
    if (!isImagePreviewOpen) return;
    const dialog = lightboxRef.current;
    if (!dialog) return;

    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
    };
    const previousScrollPosition = zoomReturnScrollPositionRef.current || {
      left: window.scrollX,
      top: window.scrollY,
    };
    zoomReturnScrollPositionRef.current = null;
    document.body.style.position = "fixed";
    document.body.style.top = `${-previousScrollPosition.top}px`;
    document.body.style.left = `${-previousScrollPosition.left}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.left = previousBodyStyles.left;
      document.body.style.width = previousBodyStyles.width;
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ left: previousScrollPosition.left, top: previousScrollPosition.top, behavior: "instant" });
      root.style.scrollBehavior = previousScrollBehavior;
      if (zoomReturnFocusRef.current?.isConnected) {
        zoomReturnFocusRef.current.focus({ preventScroll: true });
      }
    };
  }, [isImagePreviewOpen]);

  useEffect(() => {
    if (!isImagePreviewOpen) return;

    function handleGalleryKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setGalleryState((current) => {
          const state = current.productId === product.id ? current : {
            productId: product.id,
            activeIndex: 0,
            failedImages: [],
            previewOpen: false,
          };
          return { ...state, activeIndex: getAdjacentGalleryIndex(state.activeIndex, -1, galleryItems.length) };
        });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setGalleryState((current) => {
          const state = current.productId === product.id ? current : {
            productId: product.id,
            activeIndex: 0,
            failedImages: [],
            previewOpen: false,
          };
          return { ...state, activeIndex: getAdjacentGalleryIndex(state.activeIndex, 1, galleryItems.length) };
        });
      }
    }

    window.addEventListener("keydown", handleGalleryKeyDown);
    return () => window.removeEventListener("keydown", handleGalleryKeyDown);
  }, [galleryItems.length, isImagePreviewOpen, product.id]);

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
    trackGoogleAnalyticsEvent("view_item", {
      currency,
      value: currentPrice,
      items: [productToGoogleAnalyticsItem(product, currentPrice)],
    });
  }, [currency, currentPrice, product]);

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
      availableSizes: purchaseSizes,
      quantity,
    }),
    [defaultColor, galleryItems, product.id, product.name, product.priceEUR, product.priceGBP, product.priceUSD, product.slug, purchaseSizes, quantity, size],
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
      trackGoogleAnalyticsEvent("add_to_cart", {
        currency,
        value: currentPrice * quantity,
        items: [productToGoogleAnalyticsItem(product, currentPrice, quantity)],
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
      router.push("/checkout?startNew=1", { scroll: false });
    }
  }

  function selectSize(value: string) {
    setSize(value);
    setSizeError(false);
  }

  function showPrevious(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveIndex((index) => getAdjacentGalleryIndex(index, -1, galleryItems.length));
  }

  function showNext(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveIndex((index) => getAdjacentGalleryIndex(index, 1, galleryItems.length));
  }

  function updateMobileIndex(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const trackRect = target.getBoundingClientRect();
    const paddingLeft = Number.parseFloat(window.getComputedStyle(target).paddingLeft) || 0;
    const snapStart = trackRect.left + target.clientLeft + paddingLeft;
    const snapOffsets = Array.from(target.children).map((slide) => {
      return slide.getBoundingClientRect().left - snapStart + target.scrollLeft;
    });
    const nextIndex = getNearestGalleryIndex(target.scrollLeft, snapOffsets);
    if (nextIndex !== currentIndex) {
      mobileScrollUpdateRef.current = true;
      setActiveIndex(nextIndex);
    }
  }

  function markGalleryImageFailed(image: string) {
    const failedIndex = galleryItems.indexOf(image);
    setFailedGalleryImages((current) => current.includes(image) ? current : [...current, image]);
    if (failedIndex >= 0) {
      setActiveIndex((current) => {
        if (current > failedIndex) return current - 1;
        if (current === failedIndex && failedIndex > 0) return failedIndex - 1;
        return current;
      });
    }
  }

  function handleMainImagePointerDown(event: PointerEvent<HTMLButtonElement>) {
    suppressMainImageClickRef.current = false;
    mainImageGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handleMainImagePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const gesture = mainImageGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientX - gesture.startX) > 10 || Math.abs(event.clientY - gesture.startY) > 10) {
      suppressMainImageClickRef.current = true;
    }
  }

  function openImagePreview(event: MouseEvent<HTMLButtonElement>) {
    if (suppressMainImageClickRef.current && event.detail > 0) {
      suppressMainImageClickRef.current = false;
      mainImageGestureRef.current = null;
      return;
    }
    suppressMainImageClickRef.current = false;
    mainImageGestureRef.current = null;
    zoomReturnFocusRef.current = event.currentTarget;
    zoomReturnScrollPositionRef.current = { left: window.scrollX, top: window.scrollY };
    setIsImagePreviewOpen(true);
  }

  function handleLightboxTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    lightboxTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleLightboxTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = lightboxTouchStartRef.current;
    const touch = event.changedTouches[0];
    lightboxTouchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    setActiveIndex((index) => getAdjacentGalleryIndex(index, deltaX < 0 ? 1 : -1, galleryItems.length));
  }

  const purchaseActions = (
    <>
      <button className="btn btn-solid pdp-action" type="button" onClick={handleAddToCart}>
        Add to cart
      </button>
      <button className="btn pdp-action" type="button" onClick={orderNow}>
        Order now
      </button>
    </>
  );

  return (
    <section className="pdp wrap">
      <div className="pdp-gallery" aria-label={`${product.name} gallery`}>
        <div className="pdp-main-frame">
          <div className="pdp-main-viewport">
            <div
              className="pdp-main-track"
              ref={mainTrackRef}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              onScroll={updateMobileIndex}
            >
              {galleryItems.length ? galleryItems.map((image, index) => (
                <div className="pdp-image" key={`${image}-${index}`}>
                  <button
                    className="pdp-main-image-trigger"
                    type="button"
                    aria-label={`Enlarge image ${index + 1} of ${galleryItems.length}`}
                    onClick={openImagePreview}
                    onPointerDown={handleMainImagePointerDown}
                    onPointerMove={handleMainImagePointerMove}
                    onPointerCancel={() => { mainImageGestureRef.current = null; }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} image ${index + 1}`}
                      draggable={false}
                      onError={() => markGalleryImageFailed(image)}
                    />
                  </button>
                </div>
              )) : (
                <div className="pdp-image pdp-image-empty">
                  <span>Image unavailable</span>
                </div>
              )}
            </div>
          </div>
          {galleryItems.length > 1 ? (
            <>
              {currentIndex > 0 ? (
                <button className="pdp-gallery-arrow previous" type="button" onClick={showPrevious} aria-label="Previous image">
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="m14.5 5-7 7 7 7" /></svg>
                </button>
              ) : null}
              {currentIndex < galleryItems.length - 1 ? (
                <button className="pdp-gallery-arrow next" type="button" onClick={showNext} aria-label="Next image">
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="m9.5 5 7 7-7 7" /></svg>
                </button>
              ) : null}
              <span className="pdp-count" aria-live="polite">
                {currentIndex + 1} / {galleryItems.length}
              </span>
            </>
          ) : null}
        </div>
        {galleryItems.length > 1 ? (
          <div className="pdp-gallery-progress" role="img" aria-label={`Image ${currentIndex + 1} of ${galleryItems.length}`}>
            {galleryItems.map((_, index) => (
              <span
                className={index === currentIndex ? "pdp-gallery-progress-segment is-active" : "pdp-gallery-progress-segment"}
                key={`progress-${index}`}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : null}
      </div>

      <dialog
        ref={lightboxRef}
        className="pdp-lightbox"
        aria-label={`${product.name} image preview`}
        onCancel={(event) => {
          event.preventDefault();
          setIsImagePreviewOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsImagePreviewOpen(false);
        }}
      >
        <div className="pdp-lightbox-content">
          <button className="pdp-lightbox-close" type="button" autoFocus onClick={() => setIsImagePreviewOpen(false)} aria-label="Close image preview">
            ×
          </button>
          {galleryItems.length > 1 ? (
            currentIndex > 0 ? (
              <button className="pdp-lightbox-arrow previous" type="button" onClick={showPrevious} aria-label="Previous image">
                ‹
              </button>
            ) : null
          ) : null}
          <div
            className="pdp-lightbox-stage"
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${product.name} enlarged image ${currentIndex + 1}`}
                draggable={false}
              />
            ) : <span>Image unavailable</span>}
          </div>
          {galleryItems.length > 1 ? (
            currentIndex < galleryItems.length - 1 ? (
              <button className="pdp-lightbox-arrow next" type="button" onClick={showNext} aria-label="Next image">
                ›
              </button>
            ) : null
          ) : null}
          {galleryItems.length > 1 ? (
            <span className="pdp-lightbox-count" aria-live="polite">{currentIndex + 1} / {galleryItems.length}</span>
          ) : null}
        </div>
      </dialog>

      <aside className="pdp-info">
        <p className="eyebrow">{getProductCategoryLabel(product.category, product.style)}</p>
        <h1>{product.name}</h1>
        <p className="pdp-price">{formatMoney(currentPrice, currency)}</p>

        <div className={sizeError ? "pdp-option size-error" : "pdp-option"}>
          <div className="pdp-size-head">
            <span className="pdp-option-label">Size</span>
          </div>
          <div className="pdp-size-grid" aria-label="Select size">
            {purchaseSizes.map((value) => (
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
          {sizeError ? <p className="pdp-size-help">Please select a size before adding to cart.</p> : null}
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

        <div className="pdp-purchase-actions">{purchaseActions}</div>

        <div className="pdp-accordion">
          <AccordionItem
            title="Product details"
            open={openSection === "details"}
            onToggle={() => setOpenSection(openSection === "details" ? null : "details")}
          >
            <FactList facts={details} />
            <p className="pdp-product-code"><strong>Product Code:</strong> {publicProductCode}</p>
          </AccordionItem>
          <AccordionItem
            title="Size & fit"
            open={openSection === "fit"}
            onToggle={() => setOpenSection(openSection === "fit" ? null : "fit")}
          >
            <FactList facts={fitFacts} />
            <p>Not sure which size to choose?</p>
            <Link className="pdp-accordion-link" href="/size-recommender">
              Use our Size Recommender →
            </Link>
            <Link className="pdp-accordion-link" href="/cnfans-size-guide">
              View size guide →
            </Link>
          </AccordionItem>
          {material ? (
            <AccordionItem
              title="Material"
              open={openSection === "material"}
              onToggle={() => setOpenSection(openSection === "material" ? null : "material")}
            >
              <p>{material}</p>
            </AccordionItem>
          ) : null}
          <AccordionItem
            title="Delivery"
            open={openSection === "delivery"}
            onToggle={() => setOpenSection(openSection === "delivery" ? null : "delivery")}
          >
            <p>Tracked delivery across the UK and Europe.</p>
            <Link className="pdp-accordion-link" href="/delivery">
              View delivery information →
            </Link>
          </AccordionItem>
          <AccordionItem
            title="Returns"
            open={openSection === "returns"}
            onToggle={() => setOpenSection(openSection === "returns" ? null : "returns")}
          >
            <p>Returns and exchanges are subject to our return policy.</p>
            <Link className="pdp-accordion-link" href="/returns">
              View returns information →
            </Link>
          </AccordionItem>
        </div>
      </aside>

    </section>
  );
}

function FactList({ facts }: { facts: string[] }) {
  if (!facts.length) return null;
  return (
    <ul className="pdp-fact-list">
      {facts.map((fact) => <li key={fact}>{fact}</li>)}
    </ul>
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
      <div className="pdp-accordion-content" hidden={!open}>{children}</div>
    </div>
  );
}
