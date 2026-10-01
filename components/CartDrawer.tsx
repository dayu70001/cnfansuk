"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCartItemPrice, getCartLineKey, getCartSubtotal } from "@/lib/cart";
import { formatMoney } from "@/lib/formatMoney";
import { cartItemToGoogleAnalyticsItem, trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { useCurrency } from "@/lib/useCurrency";
import { useCart } from "./CartProvider";

const CUSTOMER_SIZES = ["M", "L", "XL", "XXL"];
const isCustomerSize = (size: string) => CUSTOMER_SIZES.includes(size);

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, updateSize, removeItem } = useCart();
  const { currency } = useCurrency();
  const subtotal = getCartSubtotal(items, currency);
  const viewedOpenCart = useRef(false);
  const [openSizeLine, setOpenSizeLine] = useState<string | null>(null);
  const [checkoutAttempted, setCheckoutAttempted] = useState(false);
  const hasMissingSize = items.some((item) => !isCustomerSize(item.size));

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

  return (
    <>
      <div className={`cart-backdrop ${isOpen ? "open" : ""}`} onClick={closeCart} />
      <aside className={`cart-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
        <div className="cart-head">
          <h2>Your Cart</h2>
          <button type="button" onClick={closeCart} aria-label="Close cart">
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <p>Your cart is empty. Explore the latest CNFans UK pieces.</p>
            <button className="secondary-button" type="button" onClick={closeCart}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item, index) => (
                <div className="cart-line" key={getCartLineKey(item, index)}>
                  <Link href={`/product/${item.slug}`} className={item.image ? "cart-thumb placeholder-art has-cart-image" : "cart-thumb placeholder-art"} onClick={closeCart}>
                    {item.image ? <img src={item.image} alt={item.name} onError={(event) => event.currentTarget.classList.add("image-error")} /> : null}
                    <span />
                  </Link>
                  <div className="cart-line-copy">
                    <div className="cart-line-heading">
                      <h3>{item.name}</h3>
                      <strong>{formatMoney(getCartItemPrice(item, currency) * item.quantity, currency)}</strong>
                    </div>
                    {item.color ? <p>{item.color}</p> : null}
                    <div className="cart-size-row">
                      <span className="cart-size-label">
                        Size{!isCustomerSize(item.size) ? <span className="cart-size-required"> *</span> : ""}
                      </span>
                      <button
                        className={`cart-size-select${!isCustomerSize(item.size) ? " missing" : ""}`}
                        type="button"
                        aria-label={isCustomerSize(item.size) ? `Size ${item.size}, change size` : "Select size"}
                        aria-expanded={openSizeLine === getCartLineKey(item, index)}
                        onClick={() => {
                          const lineKey = getCartLineKey(item, index);
                          setOpenSizeLine((current) => (current === lineKey ? null : lineKey));
                        }}
                      >
                        {isCustomerSize(item.size) ? item.size : "Select"} <span aria-hidden="true">▾</span>
                      </button>
                    </div>
                    {openSizeLine === getCartLineKey(item, index) ? (
                      <div className="cart-size-options" aria-label={`Choose size for ${item.name}`}>
                        {CUSTOMER_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={item.size === size}
                            onClick={() => {
                              updateSize(item, size);
                              setOpenSizeLine(null);
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p>{formatMoney(getCartItemPrice(item, currency), currency)}</p>
                    <div className="quantity-row">
                      <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)}>
                        +
                      </button>
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
                href="/checkout"
                scroll
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
                  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                }}
              >
                Checkout
              </Link>
              {checkoutAttempted && hasMissingSize ? (
                <p className="cart-checkout-error" role="alert">Please select a size for all items.</p>
              ) : null}
              <button className="secondary-button full" type="button" onClick={closeCart}>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
