"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCartItemPrice, getCartItemSizeOptions, getCartLineKey, getCartSubtotal, hasValidCartItemSize } from "@/lib/cart";
import { formatMoney } from "@/lib/formatMoney";
import { cartItemToGoogleAnalyticsItem, trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { useCurrency } from "@/lib/useCurrency";
import { useCart } from "./CartProvider";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, updateSize, removeItem } = useCart();
  const { currency } = useCurrency();
  const subtotal = getCartSubtotal(items, currency);
  const viewedOpenCart = useRef(false);
  const [checkoutAttempted, setCheckoutAttempted] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeCartRef = useRef(closeCart);
  const hasMissingSize = items.some((item) => !hasValidCartItemSize(item));

  useEffect(() => {
    if (!isOpen) {
      viewedOpenCart.current = false;
      return;
    }
    if (viewedOpenCart.current || items.length === 0) return;
    viewedOpenCart.current = true;
    trackGoogleAnalyticsEvent("view_cart", {
      currency,
      value: subtotal,
      items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, currency))),
    });
  }, [currency, isOpen, items, subtotal]);

  useEffect(() => {
    closeCartRef.current = closeCart;
  }, [closeCart]);

  useEffect(() => {
    if (!isOpen) return;

    const activeElement = document.activeElement;
    returnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    const initialFocusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCartRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsInside = drawer.contains(document.activeElement);
      if (event.shiftKey && (!focusIsInside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!focusIsInside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(initialFocusFrame);
      document.removeEventListener("keydown", onKeyDown, true);
      const returnFocus = returnFocusRef.current;
      if (returnFocus?.isConnected) window.requestAnimationFrame(() => returnFocus.focus());
    };
  }, [isOpen]);

  return (
    <>
      <div className={`cart-backdrop ${isOpen ? "open" : ""}`} onClick={() => closeCart()} />
      <aside
        ref={drawerRef}
        className={`cart-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Your Cart"
        aria-modal={isOpen ? true : undefined}
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
      >
        <div className="cart-head">
          <h2>Your Cart</h2>
          <button ref={closeButtonRef} type="button" onClick={() => closeCart()} aria-label="Close cart">
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty-state cart-empty">
            <svg className="cart-empty-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M8 13h24l-2 22H10L8 13Z" stroke="currentColor" strokeWidth="1.4" />
              <path d="M14 15V11a6 6 0 0 1 12 0v4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <p>Your cart is empty. Explore the latest CNFANS UK pieces.</p>
            <button className="cart-continue" type="button" onClick={() => closeCart()}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item, index) => (
                <div className="cart-line" key={getCartLineKey(item, index)}>
                  <Link href={`/product/${item.slug}`} className={item.image ? "cart-thumb placeholder-art has-cart-image" : "cart-thumb placeholder-art"} onClick={() => closeCart()}>
                    {item.image ? <img src={item.image} alt={item.name} onError={(event) => event.currentTarget.classList.add("image-error")} /> : null}
                    <span />
                  </Link>
                  <div className="cart-line-copy">
                    <div className="cart-line-heading">
                      <h3 title={item.name}>{item.name}</h3>
                    </div>
                    <p className="cart-line-price">{formatMoney(getCartItemPrice(item, currency), currency)}</p>
                    {item.color ? <p>{item.color}</p> : null}
                    <div className="cart-size-row">
                      <span className="cart-size-label">
                        Size{!hasValidCartItemSize(item) ? <span className="cart-size-required"> *</span> : ""}
                      </span>
                      <select
                        className={`cart-size-select${!hasValidCartItemSize(item) ? " missing" : ""}`}
                        aria-label={hasValidCartItemSize(item) ? `Change size for ${item.name}` : "Select size"}
                        aria-invalid={!hasValidCartItemSize(item)}
                        value={item.size || ""}
                        onChange={(event) => updateSize(item, event.currentTarget.value)}
                      >
                        <option value="">Select</option>
                        {!hasValidCartItemSize(item) && item.size ? (
                          <option value={item.size} disabled>
                            {item.size} ({item.sizeOptionsResolved || item.sizeOptionsFailed ? "unavailable" : "checking"})
                          </option>
                        ) : null}
                        {getCartItemSizeOptions(item).map((size) => <option value={size} key={size}>{size}</option>)}
                      </select>
                    </div>
                    {!getCartItemSizeOptions(item).length ? (
                      <p className="cart-size-recovery-hint" role="status">
                        {item.sizeOptionsFailed || item.sizeOptionsResolved
                          ? "Size options unavailable. Open the product page to check."
                          : "Loading available sizes…"}
                      </p>
                    ) : null}
                    <div className="quantity-row">
                      <div className="cart-quantity-control" role="group" aria-label={`Quantity of ${item.name}`}>
                        <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}>
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>
                          +
                        </button>
                      </div>
                      <button
                        className="cart-remove"
                        type="button"
                        onClick={() => {
                          trackGoogleAnalyticsEvent("remove_from_cart", {
                            currency,
                            value: getCartItemPrice(item, currency) * item.quantity,
                            items: [cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, currency))],
                          });
                          removeItem(item);
                        }}
                        aria-label="Remove item"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal, currency)}</strong>
              </div>
              <Link
                className="primary-button full"
                href="/checkout?startNew=1"
                scroll={false}
                onClick={(event) => {
                  if (hasMissingSize) {
                    event.preventDefault();
                    setCheckoutAttempted(true);
                    return;
                  }
                  setCheckoutAttempted(false);
                  trackInitiateCheckout({
                    source_page: "cart_drawer",
                    placement: "cart_checkout",
                    button_label: "Checkout",
                    destination: "/checkout",
                    content_ids: items.map((item) => item.productId),
                    content_type: "product",
                    currency,
                    value: subtotal,
                    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
                  });
                  closeCart();
                }}
              >
                Checkout
              </Link>
              {checkoutAttempted && hasMissingSize ? (
                <p className="cart-checkout-error" role="alert">Please select a size for all items.</p>
              ) : null}
              <button className="cart-continue" type="button" onClick={() => closeCart()}>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
