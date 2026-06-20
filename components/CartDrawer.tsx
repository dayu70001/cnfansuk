"use client";

import Link from "next/link";
import { getCartItemPrice, getCartSubtotal } from "@/lib/cart";
import { formatMoney } from "@/lib/formatMoney";
import { DEFAULT_SHIPPING_METHOD_ID, getShippingPrice, hasFreeShipping } from "@/lib/shipping";
import { useCurrency } from "@/lib/useCurrency";
import { useCart } from "./CartProvider";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem } = useCart();
  const { currency } = useCurrency();
  const subtotal = getCartSubtotal(items, currency);
  const subtotalGbp = getCartSubtotal(items, "GBP");
  const shipping = getShippingPrice(DEFAULT_SHIPPING_METHOD_ID, subtotalGbp, currency);
  const total = subtotal + shipping;

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
              {items.map((item) => (
                <div className="cart-line" key={`${item.productId}-${item.color}-${item.size}`}>
                  <Link href={`/product/${item.slug}`} className={item.image ? "cart-thumb placeholder-art has-cart-image" : "cart-thumb placeholder-art"} onClick={closeCart}>
                    {item.image ? <img src={item.image} alt={item.name} onError={(event) => event.currentTarget.classList.add("image-error")} /> : null}
                    <span />
                  </Link>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{[item.color, `Size ${item.size}`].filter(Boolean).join(" · ")}</p>
                    <p>{formatMoney(getCartItemPrice(item, currency), currency)}</p>
                    <div className="quantity-row">
                      <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)}>
                        +
                      </button>
                      <button className="cart-remove" type="button" onClick={() => removeItem(item)} aria-label="Remove item">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <strong>{formatMoney(getCartItemPrice(item, currency) * item.quantity, currency)}</strong>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal, currency)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>{formatMoney(shipping, currency)}</strong>
              </div>
              {hasFreeShipping(subtotalGbp) ? <p className="free-shipping-applied">Free shipping applied</p> : null}
              <div>
                <span>Total</span>
                <strong>{formatMoney(total, currency)}</strong>
              </div>
              <Link className="primary-button full" href="/checkout" onClick={closeCart}>
                Checkout
              </Link>
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
