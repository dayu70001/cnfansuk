"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { getCartItemPrice, getCartSubtotal, hasValidCartItemSize, type SubmittedCartItem } from "@/lib/cart";
import { useCurrency } from "@/lib/useCurrency";
import { currencySymbols, type CurrencyCode } from "@/lib/currency";
import { formatMoney } from "@/lib/formatMoney";
import {
  cartItemToGoogleAnalyticsItem,
  trackGoogleAnalyticsEvent,
} from "@/lib/googleAnalytics";
import { trackContactWhatsApp, trackInitiateCheckout } from "@/lib/metaPixel";
import {
  DEFAULT_SHIPPING_METHOD_ID,
  getShippingMethod,
  getShippingPrice,
  hasFreeShipping,
  isFreeShippingApplied,
  shippingMethods,
  type ShippingMethodId,
} from "@/lib/shipping";
import type { RawOrderStatus } from "@/lib/orderStatus";
import type { CartItem, CustomerDetails } from "@/lib/types";
import { getOrderAccessTokenStorageKey } from "@/lib/orderAccessTokenKey";
import { buildPersonalWhatsAppLink } from "@/lib/personalWhatsAppLink";

type CheckoutStep = "details" | "delivery" | "payment";

type ContactForm = {
  email: string;
};

type ShippingForm = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
  countryCode: string;
  countryName: string;
  phone: string;
};

function createEmptyShippingForm(): ShippingForm {
  return {
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postcode: "",
    countryCode: "GB",
    countryName: "United Kingdom",
    phone: "",
  };
}

type MapboxAddressProperties = {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  address_level1?: string;
  address_level2?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  metadata?: { iso_3166_1?: string };
};

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";
const AddressAutofill = dynamic(
  () => import("@mapbox/search-js-react").then((module) => module.AddressAutofill),
  { ssr: false },
);

const countries = [
  ["GB", "United Kingdom"],
  ["IE", "Ireland"],
  ["FR", "France"],
  ["DE", "Germany"],
  ["IT", "Italy"],
  ["ES", "Spain"],
  ["NL", "Netherlands"],
  ["BE", "Belgium"],
  ["PT", "Portugal"],
  ["CH", "Switzerland"],
  ["AT", "Austria"],
  ["DK", "Denmark"],
  ["SE", "Sweden"],
  ["NO", "Norway"],
  ["FI", "Finland"],
  ["PL", "Poland"],
  ["CZ", "Czech Republic"],
  ["GR", "Greece"],
  ["LU", "Luxembourg"],
  ["MC", "Monaco"],
] as const;

const steps: { id: CheckoutStep; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

type CheckoutOrderItem = {
  productId: string;
  productCode: string;
  name: string;
  title: string;
  slug: string;
  productUrl: string;
  image?: string;
  color?: string;
  size: string;
  quantity: number;
  priceGBP: number;
  unitPrice: number;
  lineTotal: number;
  currency: CurrencyCode;
};

type CheckoutOrderCustomer = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  countryCode: string;
  countryName: string;
};

type CheckoutOrder = {
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  finalTotal: number;
  total: number;
  currency: "GBP";
  status: RawOrderStatus;
  orderAccessToken?: string | null;
  items: CheckoutOrderItem[];
  customer: CheckoutOrderCustomer;
  shippingMethodId: ShippingMethodId;
  shippingMethodLabel: string;
  shippingEstimate: string;
  eligibilityCurrency?: CurrencyCode;
  eligibilitySubtotal?: number;
  freeShippingApplied?: boolean;
};

type CheckoutQuote = {
  subtotal: number;
  shippingFee: number;
  finalTotal: number;
  currency: "GBP";
  eligibilityCurrency: CurrencyCode;
  eligibilitySubtotal: number;
  freeShippingApplied: boolean;
  lineItems: Array<{ productCode: string; size: string; quantity: number; unitPrice: number; lineTotal: number }>;
};

type QuoteState = {
  key: string;
  retry: number;
  status: "loading" | "ready" | "error";
  quote?: CheckoutQuote;
  error?: string;
  code?: string;
};

type PersistedOrder = Omit<CheckoutOrder, "orderAccessToken">;

type PersistedCheckout = {
  sessionId: string;
  step: CheckoutStep;
  maxStep: number;
  cartFingerprint?: string;
  contact?: ContactForm;
  shipping?: ShippingForm;
  shippingMethodId: ShippingMethodId;
  order: Partial<PersistedOrder> | null;
};

const CHECKOUT_STORAGE_KEY = "cnfansuk-checkout-session";

type CheckoutFlowProps = {
  personalWhatsappUrl?: string;
  personalWhatsappNumber?: string;
};

export default function CheckoutFlow({ personalWhatsappUrl, personalWhatsappNumber }: CheckoutFlowProps) {
  const { items, cartRestored, removeSubmittedItems } = useCart();
  const { currency: eligibilityCurrency, ready: currencyReady } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startNewCheckout = searchParams.get("startNew") === "1";
  const [step, setStep] = useState<CheckoutStep>("details");
  const [maxStep, setMaxStep] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>(DEFAULT_SHIPPING_METHOD_ID);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactForm>({ email: "" });
  const [shipping, setShipping] = useState<ShippingForm>(createEmptyShippingForm);
  const [checkoutSessionId, setCheckoutSessionId] = useState("");
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [lastConfirmedPricingQuote, setLastConfirmedPricingQuote] = useState<{ scopeKey: string; quote: CheckoutQuote } | null>(null);
  const submitLock = useRef(false);
  const checkoutInitialized = useRef(false);
  const startIntentHandled = useRef(false);
  const cleanedOrderNumbers = useRef(new Set<string>());
  const scrollTopAfterStepChange = useRef(false);
  const startEntryTopHandled = useRef(false);

  function scrollPageInstantly(top: number) {
    window.scrollTo({ top, left: 0, behavior: "instant" });
  }

  function scrollCheckoutToTop() {
    scrollTopAfterStepChange.current = true;
  }

  useLayoutEffect(() => {
    const shouldPositionFreshEntry = startNewCheckout && !startEntryTopHandled.current;
    if (!shouldPositionFreshEntry && !scrollTopAfterStepChange.current) return;
    if (shouldPositionFreshEntry) startEntryTopHandled.current = true;
    scrollTopAfterStepChange.current = false;
    scrollPageInstantly(0);
  }, [startNewCheckout, step]);

  const subtotalInEligibilityCurrency = useMemo(() => getCartSubtotal(items, eligibilityCurrency), [eligibilityCurrency, items]);
  const localSubtotalGbp = useMemo(() => getCartSubtotal(items, "GBP"), [items]);
  const quoteItems = useMemo(() => items.map((item) => ({
    productCode: item.productCode || item.productId,
    size: item.size || "",
    color: item.color || "",
    quantity: item.quantity,
  })), [items]);
  const quoteKey = useMemo(() => JSON.stringify({
    shippingMethodId,
    eligibilityCurrency,
    items: quoteItems,
  }), [eligibilityCurrency, quoteItems, shippingMethodId]);
  const quoteScopeKey = useMemo(() => JSON.stringify({
    checkoutSessionId,
    eligibilityCurrency,
    items: quoteItems,
  }), [checkoutSessionId, eligibilityCurrency, quoteItems]);
  const cartFingerprint = useMemo(() => JSON.stringify(
    [...quoteItems].sort((left, right) => (
      `${left.productCode}|${left.size}|${left.color}`.localeCompare(`${right.productCode}|${right.size}|${right.color}`)
    )),
  ), [quoteItems]);
  const cartFingerprintRef = useRef(cartFingerprint);
  const quoteStateMatches = quoteState?.key === quoteKey && quoteState.retry === quoteRetry;
  const hasCompleteSizes = items.length > 0 && items.every(hasValidCartItemSize);
  const activeQuote = quoteStateMatches && quoteState.status === "ready" ? quoteState.quote : undefined;
  const quoteLoading = hasCompleteSizes && (!quoteStateMatches || quoteState.status === "loading");
  const quoteRequestFailed = quoteStateMatches && quoteState.status === "error";
  const quoteError = items.length > 0 && !hasCompleteSizes
    ? "Please select a size for every item before continuing."
    : quoteRequestFailed
      ? quoteErrorForCustomer(quoteState.error, quoteState.code)
      : "";
  const quoteReady = Boolean(activeQuote) && quoteStateMatches && quoteState?.status === "ready";
  const lastQuoteForCurrentCart = lastConfirmedPricingQuote?.scopeKey === quoteScopeKey
    ? lastConfirmedPricingQuote.quote
    : undefined;
  const subtotal = activeQuote?.subtotal ?? lastQuoteForCurrentCart?.subtotal ?? localSubtotalGbp;
  const shippingPrice = activeQuote?.shippingFee
    ?? getShippingPrice(shippingMethodId, subtotalInEligibilityCurrency, eligibilityCurrency);
  const total = activeQuote?.finalTotal ?? subtotal + shippingPrice;
  const checkoutTracked = useRef(false);

  function restoreCheckoutSession(saved: Partial<PersistedCheckout>) {
    if (saved.sessionId) setCheckoutSessionId(saved.sessionId);
    if (saved.step && steps.some((item) => item.id === saved.step)) setStep(saved.step);
    if (typeof saved.maxStep === "number") setMaxStep(Math.min(Math.max(saved.maxStep, 0), 2));
    if (saved.contact?.email !== undefined) setContact({ email: saved.contact.email });
    if (saved.shipping) setShipping((current) => ({ ...current, ...saved.shipping }));
    if (saved.shippingMethodId && shippingMethods.some((method) => method.id === saved.shippingMethodId)) {
      setShippingMethodId(saved.shippingMethodId);
    }
    if (hasCompletedOrderSnapshot(saved.order)) {
      const orderAccessToken = window.sessionStorage.getItem(getOrderAccessTokenStorageKey(saved.order.orderNumber));
      setOrder({ ...saved.order, orderAccessToken });
      setStep("payment");
      setMaxStep(2);
    } else if (saved.step === "payment" || saved.order?.orderNumber) {
      // Older saved sessions may have an order summary without the receipt
      // snapshot. Revisit Delivery; the same session can safely retrieve its
      // matching stored order when the customer confirms again.
      setStep("delivery");
      setMaxStep(1);
    } else if (typeof saved.maxStep === "number") {
      setMaxStep(Math.min(Math.max(saved.maxStep, 0), 1));
    }
  }

  useEffect(() => {
    cartFingerprintRef.current = cartFingerprint;
  }, [cartFingerprint]);

  useEffect(() => {
    if (!cartRestored) return;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (!startNewCheckout) {
        startIntentHandled.current = false;
        if (checkoutInitialized.current) return;
      } else if (startIntentHandled.current) {
        return;
      } else {
        startIntentHandled.current = true;
      }

      let saved: Partial<PersistedCheckout> = {};
      try {
        const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
        if (raw) saved = JSON.parse(raw) as Partial<PersistedCheckout>;
      } catch {
        // Session storage can be unavailable in privacy modes; checkout still works in-memory.
      }

      const hasCompletedOrder = hasCompletedOrderSnapshot(saved.order);
      const currentCartFingerprint = cartFingerprintRef.current;
      const cartChangedSinceSaved = Boolean(saved.cartFingerprint && saved.cartFingerprint !== currentCartFingerprint);
      const startFreshSession = startNewCheckout && (hasCompletedOrder || cartChangedSinceSaved);

      if (startFreshSession) {
        const nextSessionId = createCheckoutSessionId(saved.sessionId);
        const nextMethodId = saved.shippingMethodId && shippingMethods.some((method) => method.id === saved.shippingMethodId)
          ? saved.shippingMethodId
          : DEFAULT_SHIPPING_METHOD_ID;
        const nextContact = hasCompletedOrder
          ? { email: "" }
          : saved.contact?.email !== undefined
            ? { email: saved.contact.email }
            : contact;
        const nextShipping = hasCompletedOrder
          ? createEmptyShippingForm()
          : saved.shipping ?? shipping;
        const freshSession: PersistedCheckout = {
          sessionId: nextSessionId,
          step: "details",
          maxStep: 0,
          contact: nextContact,
          shipping: nextShipping,
          shippingMethodId: nextMethodId,
          cartFingerprint: currentCartFingerprint,
          order: null,
        };
        try {
          window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(freshSession));
        } catch {
          // Keep the new checkout usable in-memory if browser storage is blocked.
        }
        setCheckoutSessionId(nextSessionId);
        setContact(nextContact);
        setShipping(nextShipping);
        setShippingMethodId(nextMethodId);
        setOrder(null);
        setStep("details");
        setMaxStep(0);
        setQuoteState(null);
        setQuoteRetry(0);
        setSubmitError("");
        setErrors({});
        submitLock.current = false;
      } else if (!checkoutInitialized.current) {
        restoreCheckoutSession(saved);
        setCheckoutSessionId((current) => current || saved.sessionId || createCheckoutSessionId());
      }

      checkoutInitialized.current = true;
      setHydrated(true);
      if (startNewCheckout) router.replace("/checkout", { scroll: false });
    });
    return () => {
      active = false;
    };
  }, [cartRestored, contact, router, shipping, startNewCheckout]);

  useEffect(() => {
    if (!hydrated || !cartRestored || !currencyReady || step !== "delivery" || order || items.length === 0) return;
    if (!hasCompleteSizes) return;

    const controller = new AbortController();
    let active = true;
    void fetch("/api/orders/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ items: quoteItems, shippingMethodId, eligibilityCurrency }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { quote?: CheckoutQuote; error?: string; code?: string };
        if (!active || controller.signal.aborted) return;
        if (!response.ok || !result.quote) {
          const failure = new Error(result.error || "Unable to verify the current order total.") as Error & { code?: string };
          failure.code = result.code;
          throw failure;
        }
        if (!isCheckoutQuote(result.quote)) throw new Error("Unable to verify the current order total.");
        setLastConfirmedPricingQuote({ scopeKey: quoteScopeKey, quote: result.quote });
        setQuoteState({ key: quoteKey, retry: quoteRetry, status: "ready", quote: result.quote });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        const failure = error instanceof Error ? error as Error & { code?: string } : undefined;
        setQuoteState({
          key: quoteKey,
          retry: quoteRetry,
          status: "error",
          error: failure?.message || "Unable to verify the current order total.",
          code: failure?.code,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [cartRestored, currencyReady, eligibilityCurrency, hasCompleteSizes, hydrated, items, order, quoteItems, quoteKey, quoteRetry, quoteScopeKey, shippingMethodId, step]);

  useEffect(() => {
    if (!hydrated || !checkoutSessionId) return;
    const persistedOrder = order
      ? Object.fromEntries(Object.entries(order).filter(([key]) => key !== "orderAccessToken")) as Omit<CheckoutOrder, "orderAccessToken">
      : null;
    const saved: PersistedCheckout = {
      sessionId: checkoutSessionId,
      step,
      maxStep,
      contact,
      shipping,
      shippingMethodId,
      cartFingerprint,
      order: persistedOrder,
    };
    try {
      window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Keep the in-memory checkout usable if browser storage is blocked.
    }
  }, [cartFingerprint, checkoutSessionId, contact, hydrated, maxStep, order, shipping, shippingMethodId, step]);

  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    trackGoogleAnalyticsEvent("begin_checkout", {
      currency: "GBP",
      value: subtotal,
      items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, "GBP"))),
    });
  }, [items, subtotal]);

  function validateDetails() {
    const nextErrors: Record<string, string> = {};
    const email = contact.email.trim();
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    const requiredFields: (keyof ShippingForm)[] = [
      "firstName",
      "lastName",
      "addressLine1",
      "city",
      "postcode",
      "countryCode",
      "phone",
    ];
    requiredFields.forEach((field) => {
      if (!shipping[field].trim()) {
        nextErrors[field] = "This field is required.";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function continueToDelivery() {
    if (items.length === 0) {
      setSubmitError("Your cart is empty. Add items before continuing to checkout.");
      return;
    }
    if (items.some((item) => !hasValidCartItemSize(item))) {
      setSubmitError("Please select a size for every item in your cart before continuing.");
      return;
    }
    if (!validateDetails()) return;
    setSubmitError("");
    trackInitiateCheckout({
      source_page: "checkout",
      placement: "continue_to_delivery",
      button_label: "Continue to delivery",
    });
    setQuoteState({ key: quoteKey, retry: quoteRetry, status: "loading" });
    setStep("delivery");
    scrollCheckoutToTop();
    setMaxStep(1);
    setErrors({});
  }

  async function confirmOrder() {
    if (submitLock.current || creatingOrder || order || !checkoutSessionId) return;
    if (!quoteReady || !activeQuote) return;
    if (items.length === 0 || items.some((item) => !hasValidCartItemSize(item))) {
      setSubmitError("Please select a size for every item in your cart before confirming your order.");
      return;
    }
    if (!validateDetails()) {
      setStep("details");
      scrollCheckoutToTop();
      setMaxStep(0);
      setSubmitError("Please complete your contact and delivery details before confirming your order.");
      return;
    }
    submitLock.current = true;
    setCreatingOrder(true);
    setSubmitError("");
    const submittedCartSnapshot: SubmittedCartItem[] = items.map((item) => ({
      cartLineId: item.cartLineId,
      productId: item.productId,
      productCode: item.productCode,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    }));
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutSessionId,
          customer: buildCustomerPayload(shipping, contact),
          items: items.map((item) => ({
            productCode: item.productCode || item.productId,
            title: item.title || item.name,
            slug: item.slug,
            productUrl: item.productUrl || `/product/${item.slug}`,
            image: item.image,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: getCartItemPrice(item, "GBP"),
            currency: "GBP",
          })),
          shippingMethodId,
          eligibilityCurrency,
          currency: "GBP",
          expectedQuote: activeQuote,
        }),
      });
      const result = await response.json().catch(() => ({})) as {
        order?: CheckoutOrder;
        error?: string;
        code?: string;
        quote?: unknown;
      };
      if (response.status === 409 && isCheckoutQuote(result.quote)) {
        setLastConfirmedPricingQuote({ scopeKey: quoteScopeKey, quote: result.quote });
        setQuoteState({ key: quoteKey, retry: quoteRetry, status: "ready", quote: result.quote });
        setSubmitError("Your order total has changed. Please review the updated amount before confirming.");
        return;
      }
      if (!response.ok || !result.order?.orderNumber || !result.order.items?.length || !result.order.customer) {
        setSubmitError(result.error || "We couldn't create your order. Please try again.");
        return;
      }
      if (result.order.orderAccessToken) {
        try {
          window.sessionStorage.setItem(getOrderAccessTokenStorageKey(result.order.orderNumber), result.order.orderAccessToken);
        } catch {
          // Keep the order visible in memory if browser storage is blocked.
        }
      }
      setOrder({ ...result.order, eligibilityCurrency });
      if (!cleanedOrderNumbers.current.has(result.order.orderNumber)) {
        cleanedOrderNumbers.current.add(result.order.orderNumber);
        removeSubmittedItems(submittedCartSnapshot);
      }
      trackGoogleAnalyticsEvent("add_shipping_info", {
        currency: "GBP",
        value: result.order.total,
        shipping_tier: getShippingMethod(shippingMethodId).label,
        items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, "GBP"))),
      });
      setMaxStep(2);
      setStep("payment");
      scrollCheckoutToTop();
      setErrors({});
    } catch {
      setSubmitError("We couldn't reach the order service. Please check your connection and try again.");
    } finally {
      submitLock.current = false;
      setCreatingOrder(false);
    }
  }

  function goToCompleted(nextStep: CheckoutStep) {
    if (order || nextStep === step) return;
    const nextIndex = steps.findIndex((item) => item.id === nextStep);
    if (nextIndex <= maxStep) {
      setSubmitError("");
      setStep(nextStep);
      scrollCheckoutToTop();
      setErrors({});
    }
  }

  const orderItems = order?.items ?? items;
  const whatsappMessage = order
    ? `Hi CNFans UK, please confirm my order #${order.orderNumber}`
    : "";
  const whatsappHref = buildPersonalWhatsAppLink(
    { personalWhatsappUrl, personalWhatsappNumber },
    whatsappMessage,
  );
  const summaryItems = orderItems;
  const summarySubtotal = order ? order.subtotal : subtotal;
  const summaryShippingPrice = order ? order.shippingFee : shippingPrice;
  const summaryTotal = order ? order.finalTotal : total;
  const summaryLineTotals = order
    ? order.items.map((item) => item.lineTotal)
    : (activeQuote ?? lastQuoteForCurrentCart)?.lineItems.map((line) => line.lineTotal);
  const summaryEligibilityCurrency = order?.eligibilityCurrency ?? eligibilityCurrency;
  const summaryEligibilitySubtotal = order?.eligibilitySubtotal
    ?? activeQuote?.eligibilitySubtotal
    ?? subtotalInEligibilityCurrency;
  const summaryFreeShippingApplied = order
    ? order.freeShippingApplied ?? (order.shippingFee === 0 && shippingMethodId !== "fedex-priority")
    : activeQuote?.freeShippingApplied;

  if (!hydrated || !cartRestored || !currencyReady) {
    return (
      <section className="checkout checkout-flow wrap" aria-busy="true">
        <div className="page-heading checkout-heading"><p className="eyebrow">Checkout</p></div>
        <p className="checkout-loading" role="status">Loading your cart…</p>
      </section>
    );
  }

  if (items.length === 0 && !order) {
    return (
      <section className="checkout checkout-flow wrap">
        <div className="page-heading checkout-heading"><p className="eyebrow">Checkout</p></div>
        <div className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add some items to your cart before proceeding to checkout.</p>
          <Link className="btn btn-solid" href="/category/new-in">Continue Shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`checkout checkout-flow wrap${step === "payment" ? " checkout-order-received" : ""}`}>
      <div className="page-heading checkout-heading">
        <p className="eyebrow">Checkout</p>
      </div>

      <StepIndicator currentStep={step} maxStep={maxStep} onSelect={goToCompleted} locked={Boolean(order)} />

      <MobileSummary
        items={summaryItems}
        subtotal={summarySubtotal}
        shippingPrice={summaryShippingPrice}
        total={summaryTotal}
        open={summaryOpen}
        onToggle={() => setSummaryOpen(!summaryOpen)}
        eligibilityCurrency={summaryEligibilityCurrency}
        eligibilitySubtotal={summaryEligibilitySubtotal}
        lineTotals={summaryLineTotals}
        freeShippingApplied={summaryFreeShippingApplied}
        quoteReady={quoteReady}
      />

      <div className="checkout-layout">
        <div className="checkout-panel">
          {step === "details" ? (
            <DetailsStep
              contact={contact}
              shipping={shipping}
              errors={errors}
              submitError={submitError}
              onContactChange={setContact}
              onChange={setShipping}
              onContinue={continueToDelivery}
            />
          ) : null}

          {step === "delivery" ? (
            <DeliveryStep
              shippingPrice={shippingPrice}
              eligibilityCurrency={eligibilityCurrency}
              eligibilitySubtotal={activeQuote?.eligibilitySubtotal ?? subtotalInEligibilityCurrency}
              selectedMethodId={shippingMethodId}
              quoteLoading={quoteLoading}
              quoteError={quoteError}
              quoteFailed={quoteRequestFailed}
              quoteReady={quoteReady}
              canRetryQuote={quoteRequestFailed}
              onRetryQuote={() => {
                setSubmitError("");
                setQuoteRetry((current) => current + 1);
              }}
              onSelect={(methodId) => {
                setShippingMethodId(methodId);
                setQuoteState(null);
                setSubmitError("");
              }}
              onBack={() => {
                setSubmitError("");
                setStep("details");
                scrollCheckoutToTop();
              }}
              onConfirm={() => void confirmOrder()}
              submitting={creatingOrder}
              submitError={submitError}
            />
          ) : null}

          {step === "payment" ? (
            order ? (
              <PaymentStep
                order={order}
                whatsappHref={whatsappHref}
                onWhatsAppClick={() => trackContactWhatsApp({
                  source_page: "checkout",
                  placement: "payment_step",
                  button_label: "Contact on WhatsApp",
                  num_items: orderItems.length,
                  value: order.finalTotal,
                  currency: "GBP",
                })}
              />
            ) : (
              <div className="checkout-step-panel">
                <p className="checkout-submit-error" role="alert">Your order has not been created yet. Return to Delivery and confirm your order.</p>
                <button className="checkout-back" type="button" onClick={() => {
                  setStep("delivery");
                  scrollCheckoutToTop();
                }}>Back to Delivery</button>
              </div>
            )
          ) : null}
        </div>

        <aside className="checkout-summary checkout-summary-desktop" aria-label="Order summary">
          <OrderSummary
            items={summaryItems}
            subtotal={summarySubtotal}
            shippingPrice={summaryShippingPrice}
            total={summaryTotal}
            eligibilityCurrency={summaryEligibilityCurrency}
            eligibilitySubtotal={summaryEligibilitySubtotal}
            lineTotals={summaryLineTotals}
            freeShippingApplied={summaryFreeShippingApplied}
            quoteReady={quoteReady}
          />
        </aside>
      </div>
    </section>
  );
}

function StepIndicator({
  currentStep,
  maxStep,
  onSelect,
  locked,
}: {
  currentStep: CheckoutStep;
  maxStep: number;
  onSelect: (step: CheckoutStep) => void;
  locked: boolean;
}) {
  const currentIndex = steps.findIndex((item) => item.id === currentStep);

  return (
    <nav className="checkout-steps" aria-label="Checkout steps">
      {steps.map((item, index) => {
        const available = index <= maxStep;
        const className = [
          "checkout-step",
          index === currentIndex ? "active" : "",
          index < currentIndex || index <= maxStep ? "complete" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            className={className}
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            disabled={!available || locked}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            <span>{index + 1}</span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function DetailsStep({
  contact,
  shipping,
  errors,
  submitError,
  onContactChange,
  onChange,
  onContinue,
}: {
  contact: ContactForm;
  shipping: ShippingForm;
  errors: Record<string, string>;
  submitError: string;
  onContactChange: (value: ContactForm) => void;
  onChange: (value: ShippingForm) => void;
  onContinue: () => void;
}) {
  const [addressQuery, setAddressQuery] = useState("");
  const [autofillUnavailable, setAutofillUnavailable] = useState(false);

  function update(field: keyof ShippingForm, value: string) {
    onChange({ ...shipping, [field]: value });
  }

  function handleAddressRetrieve(response: { features?: Array<{ properties?: MapboxAddressProperties }> }) {
    const properties = response.features?.[0]?.properties;
    if (!properties) return;

    const countryCode = (properties.country_code || properties.metadata?.iso_3166_1 || shipping.countryCode).toUpperCase();
    if (countryCode !== shipping.countryCode.toUpperCase() || !countries.some(([code]) => code === countryCode)) {
      setAddressQuery("");
      setAutofillUnavailable(true);
      return;
    }
    const countryName = properties.country || countryNameForCode(countryCode) || shipping.countryName;

    onChange({
      ...shipping,
      addressLine1: properties.address_line1 || properties.name || "",
      addressLine2: properties.address_line2 || "",
      city: properties.address_level2 || "",
      county: properties.address_level1 || "",
      postcode: properties.postcode || "",
      countryCode,
      countryName,
    });
    setAddressQuery("");
    setAutofillUnavailable(false);
  }

  function updateCountry(countryCode: string) {
    setAddressQuery("");
    setAutofillUnavailable(false);
    onChange({
      ...shipping,
      addressLine1: "",
      addressLine2: "",
      city: "",
      county: "",
      postcode: "",
      countryCode,
      countryName: countryNameForCode(countryCode) || shipping.countryName,
    });
  }

  return (
    <form
      className="checkout-step-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <h2>Contact &amp; delivery details</h2>
      <p className="checkout-submit-note">Enter your contact and delivery details, then choose a delivery method.</p>
      {submitError ? <p className="checkout-submit-error" role="alert">{submitError}</p> : null}
      <div className={errors.email ? "field error" : "field"}>
        <label htmlFor="checkout-email">Email *</label>
        <input
          id="checkout-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={contact.email}
          onChange={(event) => onContactChange({ email: event.target.value })}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email ? <span className="err-msg">{errors.email}</span> : null}
      </div>
      <div className="field-row">
        <CheckoutInput label="First name" required autoComplete="given-name" value={shipping.firstName} error={errors.firstName} onChange={(value) => update("firstName", value)} />
        <CheckoutInput label="Last name" required autoComplete="family-name" value={shipping.lastName} error={errors.lastName} onChange={(value) => update("lastName", value)} />
      </div>
      <div className="checkout-address-autofill">
        <div className="field">
          <label htmlFor="checkout-address-search">Find your address</label>
          {MAPBOX_ACCESS_TOKEN ? (
            <AddressAutofill
              accessToken={MAPBOX_ACCESS_TOKEN}
              options={{ language: "en", limit: 5, country: shipping.countryCode.toLowerCase() }}
              onRetrieve={handleAddressRetrieve}
              onSuggestError={() => setAutofillUnavailable(true)}
            >
              <input
                id="checkout-address-search"
                autoComplete="address-line1"
                placeholder="Search address"
                value={addressQuery}
                onChange={(event) => {
                  setAddressQuery(event.target.value);
                  setAutofillUnavailable(false);
                }}
              />
            </AddressAutofill>
          ) : (
            <span id="checkout-address-search-hint" className="checkout-address-unavailable" role="status">
              Address lookup is not configured in this local preview. Enter your address manually below.
            </span>
          )}
          {MAPBOX_ACCESS_TOKEN && autofillUnavailable ? (
            <span id="checkout-address-search-hint" className="checkout-address-unavailable" role="status">
              Address suggestions are unavailable. Enter the address manually below.
            </span>
          ) : null}
        </div>
      </div>
      <CheckoutInput
        label="Address line 1"
        required
        autoComplete="address-line1"
        value={shipping.addressLine1}
        error={errors.addressLine1}
        onChange={(value) => update("addressLine1", value)}
      />
      <CheckoutInput
        label="Address line 2 (optional)"
        autoComplete="address-line2"
        value={shipping.addressLine2}
        onChange={(value) => update("addressLine2", value)}
      />
      <div className="field-row">
        <CheckoutInput label="City" required autoComplete="address-level2" value={shipping.city} error={errors.city} onChange={(value) => update("city", value)} />
        <CheckoutInput label="County / State" autoComplete="address-level1" value={shipping.county} onChange={(value) => update("county", value)} />
      </div>
      <div className="field-row">
        <CheckoutInput label="Postcode" required autoComplete="postal-code" value={shipping.postcode} error={errors.postcode} onChange={(value) => update("postcode", value)} />
        <div className={errors.countryCode ? "field error" : "field"}>
          <label htmlFor="checkout-country">Country</label>
          <select
            id="checkout-country"
            autoComplete="country"
            value={shipping.countryCode}
            onChange={(event) => updateCountry(event.target.value)}
            aria-invalid={errors.countryCode ? "true" : "false"}
          >
            {countries.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          {errors.countryCode ? <span className="err-msg">{errors.countryCode}</span> : null}
        </div>
      </div>
      <CheckoutInput label="Phone" required type="tel" autoComplete="tel" inputMode="tel" value={shipping.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
      <div className="checkout-actions end">
        <button className="btn btn-solid" type="submit">
          Continue to Delivery
        </button>
      </div>
    </form>
  );
}

function DeliveryStep({
  shippingPrice,
  eligibilityCurrency,
  eligibilitySubtotal,
  selectedMethodId,
  quoteLoading,
  quoteError,
  quoteFailed,
  quoteReady,
  canRetryQuote,
  onRetryQuote,
  onSelect,
  onBack,
  onConfirm,
  submitting,
  submitError,
}: {
  shippingPrice: number;
  eligibilityCurrency: CurrencyCode;
  eligibilitySubtotal: number;
  selectedMethodId: ShippingMethodId;
  quoteLoading: boolean;
  quoteError: string;
  quoteFailed: boolean;
  quoteReady: boolean;
  canRetryQuote: boolean;
  onRetryQuote: () => void;
  onSelect: (methodId: ShippingMethodId) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  submitError: string;
}) {
  const freeShipping = isFreeShippingApplied(selectedMethodId, eligibilitySubtotal, eligibilityCurrency);

  return (
    <div className="checkout-step-panel">
      <h2>Choose your delivery</h2>
      <div className="ship-options">
        {shippingMethods.map((method) => (
          <label className={method.id === selectedMethodId ? "ship-option selected" : "ship-option"} key={method.id}>
            <input
              type="radio"
              name="shippingMethod"
              value={method.id}
              checked={method.id === selectedMethodId}
              onChange={() => onSelect(method.id)}
            />
            <span className="ship-option-copy">
              <strong>{method.label}</strong>
              <small>{method.estimate}</small>
            </span>
            <strong aria-live={method.id === selectedMethodId ? "polite" : undefined}>
              {formatDeliveryPrice(method.id === selectedMethodId && quoteReady
                ? shippingPrice
                : getShippingPrice(method.id, eligibilitySubtotal, eligibilityCurrency))}
            </strong>
          </label>
        ))}
      </div>
      <p className={`checkout-quote-status${freeShipping && quoteReady ? " free-shipping-applied" : ""}`} role="status" aria-live="polite">
        {quoteLoading
          ? "Amounts are estimates while we verify."
          : quoteFailed
            ? "Unable to verify; amounts remain estimates."
          : freeShipping && quoteReady
            ? "Free standard delivery applied"
            : quoteReady
              ? "Selected delivery and total confirmed."
              : "Amounts are estimates until confirmed."}
      </p>
      {quoteError ? (
        <div className="checkout-quote-error" role="alert">
          <span>{quoteError}</span>
          {canRetryQuote ? <button type="button" onClick={onRetryQuote}>Try again</button> : null}
        </div>
      ) : null}
      <div className="checkout-review">
        <div>
          <span>Selected delivery</span>
          <strong aria-live="polite">
            {getShippingMethod(selectedMethodId).label} · {formatDeliveryPrice(quoteReady
                ? shippingPrice
                : getShippingPrice(selectedMethodId, eligibilitySubtotal, eligibilityCurrency))}
          </strong>
        </div>
      </div>
      <p className="checkout-currency-note">
        Order totals are in GBP. Free standard delivery eligibility uses your selected {eligibilityCurrency} display currency ({currencyThresholdLabel(eligibilityCurrency)}).
      </p>
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Back to Details
        </button>
        <div className="checkout-confirm-action">
          {submitError ? <p className="checkout-submit-error" role="alert">{submitError}</p> : null}
          <button className="btn btn-solid" type="button" onClick={onConfirm} disabled={submitting || !quoteReady}>
            {submitting ? "Placing Order..." : "Confirm Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({
  order,
  whatsappHref,
  onWhatsAppClick,
}: {
  order: CheckoutOrder;
  whatsappHref: string | null;
  onWhatsAppClick: () => void;
}) {
  return (
    <div className="checkout-step-panel">
      <h2>Order Received</h2>
      <p className="checkout-submit-note">Thank you. Your order has been received.</p>
      <div className="checkout-received-card">
        <div><span>Order</span><strong>#{order.orderNumber}</strong></div>
        <div><span>Amount due</span><strong>{formatMoney(order.finalTotal, "GBP")}</strong></div>
        <div><span>Status</span><strong>Awaiting Payment</strong></div>
      </div>
      <section className="checkout-payment-info" aria-labelledby="checkout-payment-info-heading">
        <h3 id="checkout-payment-info-heading">Payment Information</h3>
        <p>Our online checkout payment service is temporarily unavailable while we carry out maintenance.</p>
        <p>You can still complete your order by contacting us on WhatsApp. We accept <strong>PayPal and bank transfer.</strong></p>
      </section>
      <div className="checkout-actions checkout-received-actions">
        {whatsappHref ? (
          <a className="btn btn-solid" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={onWhatsAppClick}>
            Continue on WhatsApp
          </a>
        ) : (
          <span className="checkout-submit-note">WhatsApp contact is temporarily unavailable. Please contact customer support.</span>
        )}
      </div>
      <p className="checkout-payment-note">No payment has been taken yet.</p>
    </div>
  );
}

function CheckoutInput({
  label,
  required = false,
  type = "text",
  value,
  error,
  autoComplete,
  inputMode,
  onChange,
}: {
  label: string;
  required?: boolean;
  type?: "email" | "tel" | "text";
  value: string;
  error?: string;
  autoComplete?: string;
  inputMode?: "email" | "numeric" | "search" | "tel" | "text" | "url";
  onChange: (value: string) => void;
}) {
  const inputId = `checkout-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <div className={error ? "field error" : "field"}>
      <label htmlFor={inputId}>{label}{required ? " *" : ""}</label>
      <input
        id={inputId}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : "false"}
      />
      {error ? <span className="err-msg">{error}</span> : null}
    </div>
  );
}

function countryNameForCode(countryCode: string) {
  return countries.find(([code]) => code === countryCode.toUpperCase())?.[1] || "";
}

function MobileSummary({
  items,
  subtotal,
  shippingPrice,
  total,
  open,
  onToggle,
  eligibilityCurrency,
  eligibilitySubtotal,
  lineTotals,
  freeShippingApplied,
  quoteReady,
}: {
  items: CartItem[];
  subtotal: number;
  shippingPrice: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  eligibilityCurrency: CurrencyCode;
  eligibilitySubtotal: number;
  lineTotals?: number[];
  freeShippingApplied?: boolean;
  quoteReady: boolean;
}) {
  return (
    <div className="checkout-summary-mobile">
      <button
        className="summary-toggle"
        type="button"
        onClick={onToggle}
        aria-label={open ? "Hide order summary" : "Show order summary"}
        aria-controls="checkout-summary-mobile-content"
        aria-expanded={open}
      >
        <span>Order summary</span>
        <strong aria-live="polite">
          {formatMoney(total, "GBP")}
        </strong>
      </button>
      <div id="checkout-summary-mobile-content" hidden={!open}>
        {open ? (
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingPrice={shippingPrice}
            total={total}
            eligibilityCurrency={eligibilityCurrency}
            eligibilitySubtotal={eligibilitySubtotal}
            lineTotals={lineTotals}
            freeShippingApplied={freeShippingApplied}
            quoteReady={quoteReady}
          />
        ) : null}
      </div>
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  shippingPrice,
  total,
  eligibilityCurrency,
  eligibilitySubtotal,
  lineTotals,
  freeShippingApplied,
  quoteReady,
}: {
  items: CartItem[];
  subtotal: number;
  shippingPrice: number;
  total: number;
  eligibilityCurrency: CurrencyCode;
  eligibilitySubtotal: number;
  lineTotals?: number[];
  freeShippingApplied?: boolean;
  quoteReady: boolean;
}) {
  return (
    <div className="summary-panel">
      <h2>Order Summary</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="summary-items">
          {items.map((item, index) => (
            <article className="checkout-summary-item" key={`${item.productId}-${item.color}-${item.size}`}>
              {item.image ? <img src={item.image} alt="" /> : <span className="checkout-summary-image-placeholder" aria-hidden="true" />}
              <span className="checkout-summary-item-copy">
                {[item.name, item.color, `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
              </span>
              <strong>{formatMoney(lineTotals?.[index] ?? getCartItemPrice(item, "GBP") * item.quantity, "GBP")}</strong>
            </article>
          ))}
        </div>
      )}
      <div className="totals">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal, "GBP")}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{formatDeliveryPrice(shippingPrice)}</strong>
        </div>
        {quoteReady && freeShippingApplied === true ? (
          <p className="free-shipping-applied">Free standard delivery applied</p>
        ) : hasFreeShipping(eligibilitySubtotal, eligibilityCurrency) ? (
          <p className="free-shipping-hint">Free standard delivery available with standard delivery</p>
        ) : (
          <p className="free-shipping-hint">Free standard delivery on orders {currencyThresholdLabel(eligibilityCurrency)}+</p>
        )}
        <p className="checkout-currency-note">Order totals are in GBP. Free standard delivery eligibility uses your selected {eligibilityCurrency} display currency.</p>
        <div>
          <span>Total</span>
          <strong aria-live="polite">
            {formatMoney(total, "GBP")}
          </strong>
        </div>
      </div>
    </div>
  );
}

function formatDeliveryPrice(price: number) {
  return price === 0 ? "Free" : formatMoney(price, "GBP");
}

function currencyThresholdLabel(currency: CurrencyCode) {
  return `${currencySymbols[currency]}180`;
}

function isCheckoutQuote(value: unknown): value is CheckoutQuote {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const quote = value as Partial<CheckoutQuote>;
  const isMoney = (amount: unknown) => typeof amount === "number" && Number.isFinite(amount);
  return isMoney(quote.subtotal)
    && isMoney(quote.shippingFee)
    && isMoney(quote.finalTotal)
    && quote.currency === "GBP"
    && (quote.eligibilityCurrency === "GBP" || quote.eligibilityCurrency === "EUR" || quote.eligibilityCurrency === "USD")
    && isMoney(quote.eligibilitySubtotal)
    && typeof quote.freeShippingApplied === "boolean"
    && Array.isArray(quote.lineItems)
    && quote.lineItems.every((line) => Boolean(line)
      && typeof line.productCode === "string"
      && typeof line.size === "string"
      && Number.isSafeInteger(line.quantity)
      && isMoney(line.unitPrice)
      && isMoney(line.lineTotal));
}

function hasCompletedOrderSnapshot(
  order: PersistedCheckout["order"] | undefined,
): order is PersistedOrder {
  return Boolean(order?.orderNumber
    && Array.isArray(order.items)
    && order.items.length > 0
    && order.customer
    && order.shippingMethodLabel);
}

function quoteErrorForCustomer(error?: string, code?: string) {
  if (code === "LOCAL_QA_ITEM_UNAVAILABLE") {
    return "This item isn't available in the local QA catalogue yet. Prepare it locally before testing checkout.";
  }
  if (code === "ITEM_UNAVAILABLE" || error === "One or more items in your cart are no longer available. Please review your cart.") {
    return "One or more items in your cart are no longer available. Please review your cart.";
  }
  if (code === "SIZE_UNAVAILABLE" || error === "One or more selected sizes are no longer available. Please review your cart.") {
    return "One or more selected sizes are no longer available. Please review your cart.";
  }
  return "We couldn't verify the current order total. Please try again.";
}

function createCheckoutSessionId(previousSessionId?: string) {
  let sessionId = "";
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    sessionId = crypto.randomUUID();
  } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(3);
    crypto.getRandomValues(values);
    sessionId = `checkout-${values.join("-")}`;
  } else {
    sessionId = `checkout-${Date.now()}`;
  }
  if (previousSessionId && sessionId === previousSessionId) return `${sessionId}-new-${Date.now()}`;
  return sessionId;
}

function buildCustomerPayload(shipping: ShippingForm, contact: ContactForm): CustomerDetails & {
  addressLine1: string;
  addressLine2: string;
} {
  return {
    fullName: `${shipping.firstName.trim()} ${shipping.lastName.trim()}`.trim(),
    phone: shipping.phone.trim(),
    email: contact.email.trim(),
    country: shipping.countryName.trim(),
    countryCode: shipping.countryCode,
    countryName: shipping.countryName.trim(),
    address: [shipping.addressLine1.trim(), shipping.addressLine2.trim()].filter(Boolean).join(", "),
    addressLine1: shipping.addressLine1.trim(),
    addressLine2: shipping.addressLine2.trim(),
    city: shipping.city.trim(),
    county: shipping.county.trim(),
    postcode: shipping.postcode.trim(),
    preferredContact: "WhatsApp",
    notes: "",
  };
}
