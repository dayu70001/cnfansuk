"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CART_STORAGE_KEY, sameCartItem } from "@/lib/cart";
import { readStorage, writeStorage } from "@/lib/storage";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem, options?: { openCart?: boolean }) => void;
  updateQuantity: (item: CartItem, quantity: number) => void;
  removeItem: (item: CartItem) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const lockedScrollY = useRef(0);

  useEffect(() => {
    try {
      setItems(JSON.parse(readStorage(CART_STORAGE_KEY) || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    writeStorage(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!isOpen) {
      document.documentElement.classList.remove("cart-open");
      return () => document.documentElement.classList.remove("cart-open");
    }

    lockedScrollY.current = window.scrollY;
    document.documentElement.classList.add("cart-open");

    const isInsideCart = (event: Event) => {
      const target = event.target;
      return target instanceof Element && Boolean(target.closest(".cart-drawer"));
    };
    const preventBackgroundScroll = (event: Event) => {
      if (!isInsideCart(event)) event.preventDefault();
    };
    const keepBackgroundPosition = () => {
      if (window.scrollY !== lockedScrollY.current) window.scrollTo(0, lockedScrollY.current);
    };
    const preventBackgroundKeys = (event: KeyboardEvent) => {
      if (isInsideCart(event)) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) event.preventDefault();
    };

    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    window.addEventListener("scroll", keepBackgroundPosition, { passive: true });
    document.addEventListener("keydown", preventBackgroundKeys, true);

    return () => {
      document.documentElement.classList.remove("cart-open");
      window.removeEventListener("wheel", preventBackgroundScroll);
      window.removeEventListener("touchmove", preventBackgroundScroll);
      window.removeEventListener("scroll", keepBackgroundPosition);
      document.removeEventListener("keydown", preventBackgroundKeys, true);
      if (window.scrollY !== lockedScrollY.current) window.scrollTo(0, lockedScrollY.current);
    };
  }, [isOpen]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((current) => !current),
      addItem: (item, options = { openCart: true }) => {
        setItems((current) => {
          const existing = current.find((cartItem) => sameCartItem(cartItem, item));
          if (!existing) {
            return [...current, item];
          }
          return current.map((cartItem) =>
            sameCartItem(cartItem, item)
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem,
          );
        });
        if (options.openCart !== false) {
          setIsOpen(true);
        }
      },
      updateQuantity: (item, quantity) => {
        if (quantity <= 0) {
          setItems((current) => current.filter((cartItem) => !sameCartItem(cartItem, item)));
          return;
        }
        setItems((current) =>
          current.map((cartItem) => (sameCartItem(cartItem, item) ? { ...cartItem, quantity } : cartItem)),
        );
      },
      removeItem: (item) => {
        setItems((current) => current.filter((cartItem) => !sameCartItem(cartItem, item)));
      },
      clearCart: () => setItems([]),
    }),
    [items, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
