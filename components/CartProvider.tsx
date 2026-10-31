"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CART_STORAGE_KEY, createCartLineId, ensureCartLineIds, getCartItemLookupSlug, getCartItemSizeLookupKey, mergeCartItemSizeOptions, removeSubmittedCartItems, sameCartItem, sameCartLine, updateCartItemSize, type SubmittedCartItem } from "@/lib/cart";
import { readStorage, writeStorage } from "@/lib/storage";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  cartRestored: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem, options?: { openCart?: boolean }) => void;
  updateSize: (item: CartItem, size: string) => void;
  updateQuantity: (item: CartItem, quantity: number) => void;
  removeItem: (item: CartItem) => void;
  clearCart: () => void;
  removeSubmittedItems: (items: SubmittedCartItem[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartRestored, setCartRestored] = useState(false);
  const lockedScrollY = useRef(0);
  const sizeLookupRequests = useRef(new Set<string>());

  useEffect(() => {
    try {
      const storedItems = JSON.parse(readStorage(CART_STORAGE_KEY) || "[]") as CartItem[];
      setItems(ensureCartLineIds(Array.isArray(storedItems) ? storedItems : []));
    } catch {
      setItems([]);
    } finally {
      setCartRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!cartRestored) return;
    writeStorage(CART_STORAGE_KEY, JSON.stringify(items.map((item) => {
      const persistedItem = { ...item };
      delete persistedItem.sizeOptionsFailed;
      return persistedItem;
    })));
  }, [cartRestored, items]);

  useEffect(() => {
    if (!cartRestored) return;
    const lookups = new Map<string, string>();
    const unresolved = items.filter((item) => !Array.isArray(item.availableSizes) || item.availableSizes.length === 0);

    for (const item of unresolved) {
      if (item.sizeOptionsResolved) continue;
      const key = getCartItemSizeLookupKey(item);
      const slug = getCartItemLookupSlug(item);
      if (!key || !slug || sizeLookupRequests.current.has(key)) continue;
      sizeLookupRequests.current.add(key);
      lookups.set(key, slug);
    }

    const missingSlugItems = unresolved.filter((item) => {
      const key = getCartItemSizeLookupKey(item);
      return !getCartItemLookupSlug(item) && !item.sizeOptionsResolved && !sizeLookupRequests.current.has(key);
    });
    for (const item of missingSlugItems) {
      sizeLookupRequests.current.add(getCartItemSizeLookupKey(item));
    }
    if (missingSlugItems.length) {
      void Promise.resolve().then(() => {
        setItems((current) => current.map((item) =>
          !getCartItemLookupSlug(item) && (!Array.isArray(item.availableSizes) || item.availableSizes.length === 0)
            ? { ...item, sizeOptionsResolved: true }
            : item,
        ));
      });
    }

    for (const [key, slug] of lookups) {
      void fetch(`/api/cart/product-sizes?slug=${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Product size lookup failed");
          const result = await response.json() as { sizes?: unknown };
          const sizes = Array.isArray(result.sizes)
            ? result.sizes.filter((size): size is string => typeof size === "string")
            : [];
          setItems((current) => current.map((item) =>
            getCartItemSizeLookupKey(item) === key
              ? mergeCartItemSizeOptions(item, sizes)
              : item,
          ));
        })
        .catch(() => {
          setItems((current) => current.map((item) =>
            getCartItemSizeLookupKey(item) === key && (!Array.isArray(item.availableSizes) || item.availableSizes.length === 0)
              ? { ...item, sizeOptionsFailed: true, sizeOptionsResolved: false }
              : item,
          ));
        });
    }
  }, [cartRestored, items]);

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
      if (window.scrollY !== lockedScrollY.current) {
        window.scrollTo({ top: lockedScrollY.current, left: 0, behavior: "instant" });
      }
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
      if (window.scrollY !== lockedScrollY.current) {
        window.scrollTo({ top: lockedScrollY.current, left: 0, behavior: "instant" });
      }
    };
  }, [isOpen]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cartRestored,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((current) => !current),
      addItem: (item, options = { openCart: true }) => {
        setItems((current) => {
          const existingIndex = current.findIndex((cartItem) => sameCartItem(cartItem, item));
          if (existingIndex < 0) return [...current, { ...item, cartLineId: item.cartLineId || createCartLineId() }];
          return current.map((cartItem, index) =>
            index === existingIndex
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + item.quantity,
                  availableSizes: cartItem.availableSizes?.length ? cartItem.availableSizes : item.availableSizes,
                  sizeOptionsResolved: cartItem.availableSizes?.length ? cartItem.sizeOptionsResolved : false,
                  sizeOptionsFailed: false,
                }
              : cartItem,
          );
        });
        if (options.openCart !== false) {
          setIsOpen(true);
        }
      },
      updateSize: (item, size) => {
        setItems((current) => updateCartItemSize(current, item, size));
      },
      updateQuantity: (item, quantity) => {
        if (quantity <= 0) {
          setItems((current) => current.filter((cartItem) => !sameCartLine(cartItem, item)));
          return;
        }
        setItems((current) =>
          current.map((cartItem) => (sameCartLine(cartItem, item) ? { ...cartItem, quantity } : cartItem)),
        );
      },
      removeItem: (item) => {
        setItems((current) => current.filter((cartItem) => !sameCartLine(cartItem, item)));
      },
      clearCart: () => setItems([]),
      removeSubmittedItems: (submittedItems) => {
        setItems((current) => removeSubmittedCartItems(current, submittedItems));
      },
    }),
    [cartRestored, items, isOpen],
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
