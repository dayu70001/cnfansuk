"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { getCartCount } from "@/lib/cart";
import { currencies, currencySymbols } from "@/lib/currency";
import { useCurrency } from "@/lib/useCurrency";
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
  const { items, isOpen, toggleCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const { currency, setCurrency } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const count = getCartCount(items);

  useEffect(() => setMounted(true), []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => menuToggleRef.current?.focus());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-menu-open", menuOpen);
    return () => document.documentElement.classList.remove("mobile-menu-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    menuCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, menuOpen]);

  const mobileNavigation = (
    <>
      <div className={`mobile-menu-backdrop ${menuOpen ? "open" : ""}`} aria-hidden="true" onClick={closeMenu} />
      <aside
        id="mobile-navigation-drawer"
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu-head">
          <Link className="mobile-menu-brand" href="/" onClick={closeMenu}>
            <span className="site-logo-main">CNFans</span>
            <span className="site-logo-region">UK</span>
          </Link>
          <button ref={menuCloseRef} className="mobile-menu-close" type="button" onClick={closeMenu} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="mobile-menu-nav" aria-label="Mobile navigation links">
          <div className="mobile-menu-section mobile-menu-primary">
            <div className="mobile-menu-links">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenu}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mobile-menu-divider" aria-hidden="true" />
          <div className="mobile-menu-section mobile-menu-secondary">
            <div className="mobile-menu-links">
              {supportItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenu}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );

  return (
    <>
      <header className="site-header">
      <div className="wrap nav">
        <button
          ref={menuToggleRef}
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-drawer"
        >
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
              {currencySymbols[currency]} <span>▾</span>
            </button>
            {currencyOpen ? (
              <div className="currency-menu">
                {currencies
                  .filter((value) => value !== currency)
                  .map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setCurrency(value);
                        setCurrencyOpen(false);
                      }}
                    >
                      {currencySymbols[value]}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
          <button className="icon-btn" type="button" onClick={toggleCart} aria-label="Cart" aria-expanded={isOpen}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span className="cart-count">{count}</span>
          </button>
        </div>
      </div>
      </header>
      {mounted ? createPortal(mobileNavigation, document.body) : null}
    </>
  );
}
