"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const desktopBrandRef = useRef<HTMLAnchorElement>(null);
  const previousPathnameRef = useRef(pathname);
  const { currency, setCurrency } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const count = getCartCount(items);
  const isCurrentNavigationItem = (href: string) =>
    pathname === href || (href.startsWith("/category/") && Boolean(pathname?.startsWith(`${href}/`)));

  useEffect(() => setMounted(true), []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      const toggle = menuToggleRef.current;
      if (toggle?.getClientRects().length) toggle.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-menu-open", menuOpen);
    return () => document.documentElement.classList.remove("mobile-menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia("(min-width: 861px)");
    const closeOnDesktop = () => {
      if (desktopBreakpoint.matches) {
        setMenuOpen(false);
        requestAnimationFrame(() => desktopBrandRef.current?.focus({ preventScroll: true }));
      }
    };
    if (desktopBreakpoint.addEventListener) {
      desktopBreakpoint.addEventListener("change", closeOnDesktop);
      return () => desktopBreakpoint.removeEventListener("change", closeOnDesktop);
    }
    desktopBreakpoint.addListener(closeOnDesktop);
    return () => desktopBreakpoint.removeListener(closeOnDesktop);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      if (menuOpen) {
        const closeAfterNavigation = window.requestAnimationFrame(() => closeMenu());
        return () => window.cancelAnimationFrame(closeAfterNavigation);
      }
    }
  }, [pathname, closeMenu, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const focusCloseAfterSlide = window.setTimeout(() => {
      const menu = mobileMenuRef.current;
      if (menu?.classList.contains("open") && !menu.contains(document.activeElement)) {
        menuCloseRef.current?.focus({ preventScroll: true });
      }
    }, 260);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;
      const menu = mobileMenuRef.current;
      if (!menu) return;
      const focusable = Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        menu.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!menu.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusCloseAfterSlide);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, menuOpen]);

  const mobileNavigation = (
    <>
      <div className={`mobile-menu-backdrop ${menuOpen ? "open" : ""}`} aria-hidden="true" onClick={closeMenu} />
      <aside
        id="mobile-navigation-drawer"
        ref={mobileMenuRef}
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal={menuOpen ? "true" : undefined}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        tabIndex={-1}
      >
        <div className="mobile-menu-head">
          <Link className="mobile-menu-brand" href="/" onClick={closeMenu}>
            {isAdminRoute ? (
              <>
                <span className="site-logo-admin-main">CNFans</span>
                <span className="site-logo-admin-region">UK</span>
              </>
            ) : (
              <span className="site-logo-main">CNFANS</span>
            )}
          </Link>
          <button ref={menuCloseRef} className="mobile-menu-close" type="button" onClick={closeMenu} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="mobile-menu-nav" aria-label="Mobile navigation links">
          <section className="mobile-menu-section mobile-menu-primary" aria-labelledby="mobile-menu-shop-label">
            <p className="mobile-menu-label" id="mobile-menu-shop-label">SHOP</p>
            <div className="mobile-menu-links">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isCurrentNavigationItem(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
          <div className="mobile-menu-divider" aria-hidden="true" />
          <section className="mobile-menu-section mobile-menu-secondary" aria-labelledby="mobile-menu-support-label">
            <p className="mobile-menu-label" id="mobile-menu-support-label">SUPPORT</p>
            <div className="mobile-menu-links">
              {supportItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isCurrentNavigationItem(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
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
          onClick={() => setMenuOpen(true)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-drawer"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <Link ref={desktopBrandRef} className="brand" href="/">
          {isAdminRoute ? (
            <>
              <span className="site-logo-admin-main">CNFans</span>
              <span className="site-logo-admin-region">UK</span>
            </>
          ) : (
            <span className="site-logo-main">CNFANS</span>
          )}
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
