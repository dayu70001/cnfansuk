"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCartCount } from "@/lib/cart";
import { useCart } from "./CartProvider";

const navItems = [
  { href: "/category/new-in", label: "New In" },
  { href: "/category/outerwear", label: "Outerwear" },
  { href: "/category/tops", label: "Tops" },
  { href: "/category/bottoms", label: "Bottoms" },
  { href: "/category/co-ords-sets", label: "Co-ords & Sets" },
];

const supportItems = [
  { href: "/delivery", label: "Delivery" },
  { href: "/returns", label: "Returns" },
  { href: "/size-guide", label: "Size Guide" },
  { href: "/track-order", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { items, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currency, setCurrency] = useState("£");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const count = getCartCount(items);

  useEffect(() => {
    setCurrency(localStorage.getItem("cnfans_currency") || "£");
  }, []);

  return (
    <header className="site-header">
      <div className="wrap nav">
        <button className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <Link className="brand" href="/">
          <span className="site-logo-main">CNFans</span>
          <span className="site-logo-region">UK</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <div className="currency">
            <button className="currency-toggle" type="button" onClick={() => setCurrencyOpen((value) => !value)}>
              {currency} <span>▾</span>
            </button>
            {currencyOpen ? (
              <div className="currency-menu">
                {["£", "€", "$"]
                  .filter((value) => value !== currency)
                  .map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setCurrency(value);
                        localStorage.setItem("cnfans_currency", value);
                        setCurrencyOpen(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
          <button className="icon-btn" type="button" onClick={openCart} aria-label="Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span className="cart-count">{count}</span>
          </button>
        </div>
        <div className={menuOpen ? "mobile-menu open" : "mobile-menu"}>
          <div>
            <p>Shop</p>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <p>Support</p>
            {supportItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
