"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/CartProvider";
import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import {
  CHANNEL_POPUP_CART_ADD_EVENT,
  CHANNEL_POPUP_OUTCOME_KEY,
  CHANNEL_POPUP_SEEN_PRODUCTS_KEY,
  CHANNEL_POPUP_SESSION_SHOWN_KEY,
  getChannelPopupPage,
  getEligibleChannelPopupTrigger,
  isChannelPopupCoolingDown,
  shouldRenderChannelPopup,
  isValidWhatsAppChannelUrl,
  type ChannelPopupPageType,
  type ChannelPopupTrigger,
} from "@/lib/whatsappChannelPopup";
import styles from "./WhatsAppChannelPopup.module.css";

type Visit = {
  pathname: string;
  pageType: ChannelPopupPageType;
  productSlug: string | null;
  productVisitIndex: number;
  activeMs: number;
  productEngaged: boolean;
  homeScrolledProductArea: boolean;
  addToCartAtActiveMs: number | null;
};

type PopupState = {
  trigger: ChannelPopupTrigger;
  pageType: ChannelPopupPageType;
  pathname: string;
};

type OutcomeRecord = {
  outcome: "shown" | "closed" | "clicked";
  at: number;
};

let storageSnapshot: boolean | null = null;

function subscribeToStorageAvailability(): () => void {
  return () => undefined;
}
function getStorageAvailabilitySnapshot(): boolean {
  if (storageSnapshot === null) storageSnapshot = canUseLocalStorage();
  return storageSnapshot;
}

function getServerStorageAvailabilitySnapshot(): boolean {
  return false;
}

function canUseLocalStorage(): boolean {
  try {
    const key = "cnfans-channel-popup-storage-check";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    window.sessionStorage.setItem(key, "1");
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readOutcome(): OutcomeRecord | null {
  const value = window.localStorage.getItem(CHANNEL_POPUP_OUTCOME_KEY);
  if (!value) return null;
  const parsed = JSON.parse(value) as Partial<OutcomeRecord>;
  if (
    (parsed.outcome === "shown" || parsed.outcome === "closed" || parsed.outcome === "clicked") &&
    typeof parsed.at === "number" &&
    Number.isFinite(parsed.at)
  ) return parsed as OutcomeRecord;
  return null;
}

function writeOutcome(outcome: OutcomeRecord["outcome"]): void {
  try {
    window.localStorage.setItem(CHANNEL_POPUP_OUTCOME_KEY, JSON.stringify({ outcome, at: Date.now() }));
  } catch {
    // A storage failure must never interrupt shopping or opening WhatsApp.
  }
}

function getProductSlug(pathname: string): string | null {
  const match = pathname.match(/^\/product\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function hasOpenBlocker(): boolean {
  if (document.visibilityState !== "visible") return true;
  if (document.documentElement.classList.contains("cart-open")) return true;
  if (document.documentElement.classList.contains("desktop-filter-drawer-open")) return true;
  if (document.querySelector(".cart-drawer.open, .desktop-filter-drawer.open, .pdp-lightbox[open]")) return true;
  if (document.querySelector('[aria-modal="true"]:not([aria-hidden="true"]), dialog[open]')) return true;

  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused.closest(".pdp-size-grid, .pdp-quantity, .pdp-purchase-actions")) return false;
  if (focused instanceof HTMLElement && focused.isContentEditable) return true;
  if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement || focused instanceof HTMLSelectElement) return true;
  return false;
}

function getDeviceType(): "mobile" | "desktop" {
  return window.matchMedia("(max-width: 860px)").matches ? "mobile" : "desktop";
}

function trackPopupEvent(
  eventName: string,
  popup: PopupState,
  extra: Record<string, string> = {},
): void {
  trackGoogleAnalyticsEvent(eventName, {
    trigger_type: popup.trigger,
    page_type: popup.pageType,
    device_type: getDeviceType(),
    ...extra,
  });
}

export function WhatsAppChannelPopup({ channelUrl }: { channelUrl: string }) {
  const pathname = usePathname();
  return <WhatsAppChannelPopupRoute key={pathname || "unknown"} pathname={pathname} channelUrl={channelUrl} />;
}

function WhatsAppChannelPopupRoute({ pathname, channelUrl }: { pathname: string | null; channelUrl: string }) {
  const { isOpen } = useCart();
  const visitRef = useRef<Visit | null>(null);
  const popupRef = useRef<PopupState | null>(null);
  const sessionShownRef = useRef(false);
  const showScheduledRef = useRef(false);
  const storageReady = useSyncExternalStore(
    subscribeToStorageAvailability,
    getStorageAvailabilitySnapshot,
    getServerStorageAvailabilitySnapshot,
  );
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [temporarilySuppressed, setTemporarilySuppressed] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const suppressionRef = useRef(false);

  const pageType = getChannelPopupPage(pathname);
  const validChannelUrl = isValidWhatsAppChannelUrl(channelUrl);

  useLayoutEffect(() => {
    if (!storageReady || !validChannelUrl || !pathname || !pageType) {
      visitRef.current = null;
      return;
    }

    let productVisitIndex = -1;
    const productSlug = pageType === "product" ? getProductSlug(pathname) : null;
    if (productSlug) {
      try {
        const stored = window.sessionStorage.getItem(CHANNEL_POPUP_SEEN_PRODUCTS_KEY);
        const products = stored ? JSON.parse(stored) as unknown : [];
        const seenProducts = Array.isArray(products)
          ? products.filter((item): item is string => typeof item === "string")
          : [];
        productVisitIndex = seenProducts.indexOf(productSlug);
        if (productVisitIndex < 0) {
          seenProducts.push(productSlug);
          productVisitIndex = seenProducts.length - 1;
          window.sessionStorage.setItem(CHANNEL_POPUP_SEEN_PRODUCTS_KEY, JSON.stringify(seenProducts));
        }
      } catch {
        visitRef.current = null;
        return;
      }
    }

    const visit: Visit = {
      pathname,
      pageType,
      productSlug,
      productVisitIndex,
      activeMs: 0,
      productEngaged: false,
      homeScrolledProductArea: false,
      addToCartAtActiveMs: null,
    };
    visitRef.current = visit;

    let lastTick = performance.now();
    let clockFrame: number | null = null;
    const scheduleClockTick = () => {
      if (clockFrame !== null || sessionShownRef.current) return;
      clockFrame = window.requestAnimationFrame(() => {
        clockFrame = null;
        setClockTick((value) => value + 1);
      });
    };
    const advanceClock = () => {
      if (sessionShownRef.current) return;
      const now = performance.now();
      if (document.visibilityState === "visible") {
        visit.activeMs += Math.max(0, now - lastTick);
        setClockTick((value) => value + 1);
      }
      lastTick = now;
    };
    const timer = window.setInterval(advanceClock, 1_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") lastTick = performance.now();
      else advanceClock();
    };
    const inspectHomeProducts = () => {
      if (visit.pageType !== "home" || window.scrollY < 80) return;
      const visibleProduct = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/product/"]')).some((link) => {
        const rect = link.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
      });
      if (visibleProduct) visit.homeScrolledProductArea = true;
    };
    const handleScroll = () => {
      if (visit.pageType === "product" && window.scrollY > 100) visit.productEngaged = true;
      inspectHomeProducts();
      scheduleClockTick();
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (visit.pageType === "product" && target.closest(".pdp-gallery-arrow, .pdp-accordion-item > button, .pdp-size, .pdp-quantity button")) {
        visit.productEngaged = true;
      }
      inspectHomeProducts();
      scheduleClockTick();
    };
    const handleSuccessfulAdd = (event: Event) => {
      const customEvent = event as CustomEvent<{ productSlug?: unknown }>;
      if (
        visit.pageType === "product" &&
        typeof customEvent.detail?.productSlug === "string" &&
        customEvent.detail.productSlug === visit.productSlug
      ) {
        visit.addToCartAtActiveMs = visit.activeMs;
        scheduleClockTick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick, true);
    window.addEventListener(CHANNEL_POPUP_CART_ADD_EVENT, handleSuccessfulAdd);
    inspectHomeProducts();

    return () => {
      window.clearInterval(timer);
      if (clockFrame !== null) window.cancelAnimationFrame(clockFrame);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener(CHANNEL_POPUP_CART_ADD_EVENT, handleSuccessfulAdd);
      if (visitRef.current === visit) visitRef.current = null;
    };
  }, [pathname, pageType, storageReady, validChannelUrl]);

  useLayoutEffect(() => {
    if (!storageReady || !validChannelUrl || !pageType || !pathname) return;
    if (sessionShownRef.current) return;

    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem(CHANNEL_POPUP_SESSION_SHOWN_KEY) === "1";
    } catch {
      return;
    }
    if (alreadyShown) {
      sessionShownRef.current = true;
      return;
    }

    let outcome: OutcomeRecord | null;
    try {
      outcome = readOutcome();
    } catch {
      return;
    }
    if (isChannelPopupCoolingDown(outcome)) return;
    const visit = visitRef.current;
    if (!visit || visit.pathname !== pathname || visit.pageType !== pageType) return;
    const postAddToCartElapsedMs = visit.addToCartAtActiveMs == null
      ? null
      : Math.max(0, visit.activeMs - visit.addToCartAtActiveMs);
    const trigger = getEligibleChannelPopupTrigger({
      pageType,
      productVisitIndex: visit.productVisitIndex,
      activeMs: visit.activeMs,
      productEngaged: visit.productEngaged,
      homeScrolledProductArea: visit.homeScrolledProductArea,
      postAddToCartElapsedMs,
    });
    if (!trigger) return;

    const candidate = { trigger, pageType, pathname } satisfies PopupState;
    if (!popupRef.current || popupRef.current.pathname !== pathname) {
      popupRef.current = candidate;
      setPopup(candidate);
    }
  }, [clockTick, pageType, pathname, storageReady, validChannelUrl]);

  useLayoutEffect(() => {
    if (!popup || popup.pathname !== pathname || sessionShownRef.current || showScheduledRef.current) return;
    showScheduledRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      showScheduledRef.current = false;
      if (isOpen || hasOpenBlocker()) return;

      try {
        window.sessionStorage.setItem(CHANNEL_POPUP_SESSION_SHOWN_KEY, "1");
      } catch {
        return;
      }
      sessionShownRef.current = true;
      writeOutcome("shown");
      suppressionRef.current = false;
      setTemporarilySuppressed(false);
      setPopupVisible(true);
      trackPopupEvent("channel_popup_view", popup);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      showScheduledRef.current = false;
    };
  }, [clockTick, isOpen, pathname, popup]);

  useLayoutEffect(() => {
    if (!popup || !popupVisible) return;
    let frame: number | null = null;
    const update = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const nextSuppressed = isOpen || hasOpenBlocker();
        if (nextSuppressed !== suppressionRef.current) {
          suppressionRef.current = nextSuppressed;
          setTemporarilySuppressed(nextSuppressed);
        }
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "open", "aria-modal"] });
    document.addEventListener("focusin", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      document.removeEventListener("focusin", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [isOpen, popup, popupVisible]);

  const isRenderedVisible = shouldRenderChannelPopup(popupVisible, temporarilySuppressed);
  if (!storageReady || !validChannelUrl || !pageType || !popup || popup.pathname !== pathname) return null;

  const handleClose = () => {
    if (popupVisible) trackPopupEvent("channel_popup_close", popup);
    writeOutcome("closed");
    sessionShownRef.current = true;
    try {
      window.sessionStorage.setItem(CHANNEL_POPUP_SESSION_SHOWN_KEY, "1");
    } catch {
      // Closing the popup must never interrupt the current shopping session.
    }
    setPopupVisible(false);
    setTemporarilySuppressed(false);
    setPopup(null);
    popupRef.current = null;
  };

  const handleChannelClick = (clickTarget: "cover" | "button") => {
    trackPopupEvent("channel_popup_click", popup, { click_target: clickTarget });
    trackPopupEvent("channel_popup_to_whatsapp", popup, { click_target: clickTarget });
    writeOutcome("clicked");
    sessionShownRef.current = true;
    setPopupVisible(false);
    setTemporarilySuppressed(false);
  };

  return (
    <aside
      className={`${styles.popup} ${isRenderedVisible ? styles.visible : styles.preparing}`}
      aria-label="WhatsApp Channel invitation"
      aria-hidden={!isRenderedVisible}
      data-trigger-type={popup.trigger}
      data-page-type={popup.pageType}
      data-visible={isRenderedVisible ? "true" : "false"}
      data-suppressed={temporarilySuppressed ? "true" : "false"}
    >
      <button className={styles.close} type="button" onClick={handleClose} aria-label="Close WhatsApp Channel invitation" tabIndex={isRenderedVisible ? 0 : -1}>
        <span aria-hidden="true">×</span>
      </button>
      <a
        className={styles.coverLink}
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the CNFans WhatsApp Channel"
        tabIndex={isRenderedVisible ? 0 : -1}
        onClick={() => handleChannelClick("cover")}
      >
        <Image
          className={styles.cover}
          src="/channel/whatsapp-channel-cover.jpg"
          alt="Apparel displayed in a clothing shop"
          fill
          sizes="(max-width: 860px) 220px, 240px"
          loading="lazy"
          priority={false}
        />
        <span className={styles.previewLabel}>CNFANS CHANNEL</span>
        <span className={styles.play} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.1 5.2c.7.4.7 1.4 0 1.8l-9.1 5.2c-.7.4-1.6-.1-1.6-.9V5.8Z" /></svg>
        </span>
      </a>
      <div className={styles.body}>
        <h2>See Before You Buy.</h2>
        <p className={styles.subtitle}>Explore our WhatsApp Channel</p>
        <ul className={styles.features}>
          <li>
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><rect x="2.5" y="5" width="15" height="10" rx="2" /><path d="m8 8 4 2-4 2V8Z" /></svg>
            <span>Daily real-product videos</span>
          </li>
          <li>
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><path d="M3 4.5h14v9H9l-4 3v-3H3v-9Z" /><path d="M6.5 8h7M6.5 10.5h5" /></svg>
            <span>Real customer feedback</span>
          </li>
          <li>
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><path d="M16.2 8A6.3 6.3 0 0 0 5.3 5.1L3.8 6.5" /><path d="M3.8 3.8v2.7h2.7M3.8 12a6.3 6.3 0 0 0 10.9 2.9l1.5-1.4" /><path d="M16.2 16.2v-2.7h-2.7" /></svg>
            <span>Fresh updates every day</span>
          </li>
        </ul>
        <a
          className={styles.cta}
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={isRenderedVisible ? 0 : -1}
          onClick={() => handleChannelClick("button")}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.363z" />
          </svg>
          <span>Watch on WhatsApp</span>
        </a>
      </div>
    </aside>
  );
}
