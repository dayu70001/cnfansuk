"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { getCartItemPrice, getCartSubtotal } from "@/lib/cart";
import { formatMoney } from "@/lib/formatMoney";
import {
  cartItemToGoogleAnalyticsItem,
  rememberSubmittedOrderAnalytics,
  trackGoogleAnalyticsEvent,
} from "@/lib/googleAnalytics";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import {
  DEFAULT_SHIPPING_METHOD_ID,
  getShippingMethod,
  getShippingPrice,
  hasFreeShipping,
  isFreeShippingApplied,
  shippingMethods,
  type ShippingMethodId,
} from "@/lib/shipping";
import { getOrderPaymentStage, orderPaymentStageLabel, type OrderPaymentStage, type RawOrderStatus } from "@/lib/orderStatus";
import type { CartItem, CustomerDetails } from "@/lib/types";
import { getOrderAccessTokenStorageKey } from "@/lib/orderAccessTokenKey";

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

const bankDetails = [
  ["Account name", "YUANZHONG BAO"],
  ["Sort code", "00039045"],
  ["Account number", "040001"],
  ["Bank", "Banking Circle S.A."],
] as const;

type CheckoutOrder = {
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  finalTotal: number;
  total: number;
  currency: "GBP";
  status: RawOrderStatus;
  paymentStage?: OrderPaymentStage;
  orderAccessToken?: string | null;
};

type PersistedCheckout = {
  sessionId: string;
  step: CheckoutStep;
  maxStep: number;
  contact: ContactForm;
  shipping: ShippingForm;
  shippingMethodId: ShippingMethodId;
  order: Omit<CheckoutOrder, "orderAccessToken"> | null;
};

const CHECKOUT_STORAGE_KEY = "cnfansuk-checkout-session";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>("details");
  const [maxStep, setMaxStep] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>(DEFAULT_SHIPPING_METHOD_ID);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactForm>({ email: "" });
  const [shipping, setShipping] = useState<ShippingForm>({
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
  });
  const [checkoutSessionId, setCheckoutSessionId] = useState("");
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const subtotal = useMemo(() => getCartSubtotal(items, "GBP"), [items]);
  const shippingPrice = getShippingPrice(shippingMethodId, subtotal, "GBP");
  const total = subtotal + shippingPrice;
  const checkoutTracked = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<PersistedCheckout>;
          if (saved.sessionId) setCheckoutSessionId(saved.sessionId);
          if (saved.step && steps.some((item) => item.id === saved.step)) setStep(saved.step);
          if (typeof saved.maxStep === "number") setMaxStep(Math.min(Math.max(saved.maxStep, 0), 2));
          if (saved.contact?.email !== undefined) setContact({ email: saved.contact.email });
          if (saved.shipping) setShipping((current) => ({ ...current, ...saved.shipping }));
          if (saved.shippingMethodId && shippingMethods.some((method) => method.id === saved.shippingMethodId)) setShippingMethodId(saved.shippingMethodId);
          if (saved.order?.orderNumber) {
            const orderAccessToken = window.sessionStorage.getItem(getOrderAccessTokenStorageKey(saved.order.orderNumber));
            setOrder({ ...saved.order, orderAccessToken });
          }
        }
      } catch {
        // Session storage can be unavailable in privacy modes; checkout still works in-memory.
      }
      setCheckoutSessionId((current) => current || createCheckoutSessionId());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

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
      order: persistedOrder,
    };
    try {
      window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Keep the in-memory checkout usable if browser storage is blocked.
    }
  }, [checkoutSessionId, contact, hydrated, maxStep, order, shipping, shippingMethodId, step]);

  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    trackGoogleAnalyticsEvent("begin_checkout", {
      currency: "GBP",
      value: subtotal,
      items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, "GBP"))),
    });
  }, [items, subtotal]);

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const frame = window.requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step]);

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
    if (!validateDetails()) return;
    trackInitiateCheckout({
      source_page: "checkout",
      placement: "continue_to_delivery",
      button_label: "Continue to delivery",
    });
    setStep("delivery");
    setMaxStep(1);
    setErrors({});
  }

  async function continueToPayment() {
    if (items.length === 0 || !validateDetails() || creatingOrder || !checkoutSessionId) return;
    setCreatingOrder(true);
    setSubmitError("");
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
          currency: "GBP",
          paymentMethod: "bank-transfer",
          paymentFee: 0,
          paymentFeeRate: 0,
        }),
      });
      const result = await response.json().catch(() => ({})) as { order?: CheckoutOrder; error?: string };
      if (!response.ok || !result.order?.orderNumber) {
        setSubmitError(result.error || "订单创建失败，请稍后重试。");
        return;
      }
      if (result.order.orderAccessToken) {
        try {
          window.sessionStorage.setItem(getOrderAccessTokenStorageKey(result.order.orderNumber), result.order.orderAccessToken);
        } catch {
          // The confirmation card will show a safe unavailable state if storage is blocked.
        }
      }
      setOrder(result.order);
      trackGoogleAnalyticsEvent("add_shipping_info", {
        currency: "GBP",
        value: result.order.total,
        shipping_tier: getShippingMethod(shippingMethodId).label,
        items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, "GBP"))),
      });
      setStep("payment");
      setMaxStep(2);
      setErrors({});
    } catch {
      setSubmitError("订单服务连接失败，请检查网络后重试。");
    } finally {
      setCreatingOrder(false);
    }
  }

  function goToCompleted(nextStep: CheckoutStep) {
    const nextIndex = steps.findIndex((item) => item.id === nextStep);
    if (nextIndex <= maxStep) {
      setStep(nextStep);
      setErrors({});
    }
  }

  async function submitPayment() {
    if (!order || submitting) return;

    trackGoogleAnalyticsEvent("add_payment_info", {
      currency: "GBP",
      value: order.total,
      payment_type: "GBP Bank Transfer",
      items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, "GBP"))),
    });
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json().catch(() => ({})) as { order?: CheckoutOrder; error?: string };
      if (!response.ok || !result.order?.orderNumber) {
        setSubmitError(result.error || "付款状态提交失败，请稍后重试。");
        setSubmitting(false);
        return;
      }
      rememberSubmittedOrderAnalytics({
        transactionId: result.order.orderNumber,
        currency: "GBP",
        value: result.order.total,
        items: items.map((item) => cartItemToGoogleAnalyticsItem(item, getCartItemPrice(item, "GBP"))),
      });
      clearCart();
      try { window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY); } catch { /* ignore storage errors */ }
      router.push(`/order-success?order=${encodeURIComponent(result.order.orderNumber)}`);
    } catch {
      setSubmitError("订单服务连接失败，请检查网络后重试。");
      setSubmitting(false);
    }
  }

  return (
    <section className="checkout checkout-flow wrap">
      <div className="page-heading checkout-heading">
        <p className="eyebrow">Checkout</p>
      </div>

      <StepIndicator currentStep={step} maxStep={maxStep} onSelect={goToCompleted} />

      <MobileSummary
        items={items}
        subtotal={subtotal}
        shippingPrice={shippingPrice}
        shippingMethodId={shippingMethodId}
        total={total}
        open={summaryOpen}
        onToggle={() => setSummaryOpen(!summaryOpen)}
      />

      <div className="checkout-layout">
        <div className="checkout-panel">
          {step === "details" ? (
            <DetailsStep
              contact={contact}
              shipping={shipping}
              errors={errors}
              onContactChange={setContact}
              onChange={setShipping}
              onContinue={continueToDelivery}
            />
          ) : null}

          {step === "delivery" ? (
            <DeliveryStep
              subtotal={subtotal}
              shippingPrice={shippingPrice}
              selectedMethodId={shippingMethodId}
              onSelect={setShippingMethodId}
              onBack={() => setStep("details")}
              onContinue={continueToPayment}
              submitting={creatingOrder}
            />
          ) : null}

          {step === "payment" ? (
            <PaymentStep
              total={order?.total ?? total}
              orderNumber={order?.orderNumber || ""}
              orderStatus={order?.paymentStage || getOrderPaymentStage(order || { status: "awaiting_payment" })}
              submitting={submitting}
              submitError={submitError}
              onBack={() => setStep("delivery")}
              onSubmit={submitPayment}
            />
          ) : null}
        </div>

        <aside className="checkout-summary checkout-summary-desktop" aria-label="Order summary">
          <OrderSummary items={items} subtotal={subtotal} shippingPrice={shippingPrice} shippingMethodId={shippingMethodId} total={total} />
        </aside>
      </div>
    </section>
  );
}

function StepIndicator({
  currentStep,
  maxStep,
  onSelect,
}: {
  currentStep: CheckoutStep;
  maxStep: number;
  onSelect: (step: CheckoutStep) => void;
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
          <button className={className} key={item.id} type="button" onClick={() => onSelect(item.id)} disabled={!available}>
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
  onContactChange,
  onChange,
  onContinue,
}: {
  contact: ContactForm;
  shipping: ShippingForm;
  errors: Record<string, string>;
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
    const countryName = properties.country || countryNameForCode(countryCode) || shipping.countryName;

    onChange({
      ...shipping,
      addressLine1: properties.address_line1 || properties.name || shipping.addressLine1,
      addressLine2: properties.address_line2 || shipping.addressLine2,
      city: properties.address_level2 || shipping.city,
      county: properties.address_level1 || shipping.county,
      postcode: properties.postcode || shipping.postcode,
      countryCode,
      countryName,
    });
    setAddressQuery("");
    setAutofillUnavailable(false);
  }

  function updateCountry(countryCode: string) {
    setAddressQuery("");
    onChange({
      ...shipping,
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
      <h2>Contact &amp; Shipping Address</h2>
      <p className="checkout-submit-note">Enter your contact and delivery details. You&apos;ll choose a delivery method next, then complete payment.</p>
      <div className={errors.email ? "field error" : "field"}>
        <label htmlFor="checkout-email">Email *</label>
        <input
          id="checkout-email"
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
        {MAPBOX_ACCESS_TOKEN ? (
          <div className="field">
            <label htmlFor="checkout-address-search">Find your address</label>
            <AddressAutofill
              accessToken={MAPBOX_ACCESS_TOKEN}
              options={{ language: "en", limit: 5 }}
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
            {autofillUnavailable ? (
              <span className="checkout-address-unavailable">Address suggestions are unavailable. Enter the address manually below.</span>
            ) : null}
          </div>
        ) : (
          <p className="checkout-address-unavailable">Address suggestions are unavailable. Enter your address manually below.</p>
        )}
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
      <CheckoutInput label="Phone" required autoComplete="tel" inputMode="tel" value={shipping.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
      <div className="checkout-actions end">
        <button className="btn btn-solid" type="submit">
          Continue to Delivery
        </button>
      </div>
    </form>
  );
}

function DeliveryStep({
  subtotal,
  shippingPrice,
  selectedMethodId,
  onSelect,
  onBack,
  onContinue,
  submitting,
}: {
  subtotal: number;
  shippingPrice: number;
  selectedMethodId: ShippingMethodId;
  onSelect: (methodId: ShippingMethodId) => void;
  onBack: () => void;
  onContinue: () => void | Promise<void>;
  submitting: boolean;
}) {
  const freeShipping = isFreeShippingApplied(selectedMethodId, subtotal);

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
            <strong>{formatDeliveryPrice(getShippingPrice(method.id, subtotal, "GBP"))}</strong>
          </label>
        ))}
      </div>
      {freeShipping ? <p className="free-shipping-applied">Free standard delivery applied</p> : null}
      <div className="checkout-review">
        <div>
          <span>Selected delivery</span>
          <strong>{getShippingMethod(selectedMethodId).label} · {formatDeliveryPrice(shippingPrice)}</strong>
        </div>
      </div>
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Back to Details
        </button>
        <button className="btn btn-solid" type="button" onClick={() => void onContinue()} disabled={submitting}>
          {submitting ? "Creating order…" : "Continue to Payment"}
        </button>
      </div>
    </div>
  );
}

function PaymentStep({
  total,
  orderNumber,
  orderStatus,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: {
  total: number;
  orderNumber: string;
  orderStatus: OrderPaymentStage;
  submitting: boolean;
  submitError: string;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
}) {
  const [copied, setCopied] = useState("");
  // Reaching this step means the bank details are visible; show the
  // customer-facing payment stage immediately while the idempotent event
  // request records the first viewed timestamp in the background.
  const [displayedStage, setDisplayedStage] = useState<OrderPaymentStage>(
    orderStatus === "created" ? "awaiting_payment" : orderStatus,
  );

  useEffect(() => {
    if (!orderNumber) return;
    void fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment-viewed`, {
      method: "POST",
      headers: { Accept: "application/json" },
      keepalive: true,
    })
      .then((response) => response.ok ? response.json() as Promise<{ order?: { paymentStage?: OrderPaymentStage } }> : null)
      .then((result) => {
        if (result?.order?.paymentStage) setDisplayedStage(result.order.paymentStage);
      })
      .catch(() => undefined);
  }, [orderNumber]);

  useEffect(() => {
    setDisplayedStage(orderStatus === "created" ? "awaiting_payment" : orderStatus);
  }, [orderStatus]);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied((current) => current === label ? "" : current), 1400);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="checkout-step-panel">
      <p className="eyebrow">Payment</p>
      <h2>Bank transfer</h2>
      <div className="checkout-payment-summary">
        <div><span>Order</span><strong>#{orderNumber}</strong></div>
        <div><span>Status</span><strong>{orderPaymentStageLabel(displayedStage, "en")}</strong></div>
        <div><span>Amount due</span><strong>{formatMoney(total, "GBP")}</strong></div>
      </div>
      <section className="checkout-bank-card" aria-label="GBP bank account details">
        <div className="checkout-bank-card-head">
          <span>Bank details</span>
        </div>
        <dl className="checkout-bank-details">
          {bankDetails.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <span>{value}</span>
                {label !== "Bank" ? (
                  <button type="button" className="checkout-copy-button" onClick={() => void copyValue(label, value)}>
                    {copied === label ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </dd>
            </div>
          ))}
          <div>
            <dt>Payment reference</dt>
            <dd>
              <span>{orderNumber}</span>
              <button type="button" className="checkout-copy-button" onClick={() => void copyValue("Payment reference", orderNumber)}>
                {copied === "Payment reference" ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        </dl>
        <p className="checkout-bank-note">Please use your order number as the payment reference.</p>
      </section>
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Back to Delivery
        </button>
        <button className="btn btn-solid" type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting payment…" : "I've made the bank transfer"}
        </button>
      </div>
      {submitError ? <p className="checkout-submit-error">{submitError}</p> : null}
    </div>
  );
}

function CheckoutInput({
  label,
  required = false,
  value,
  error,
  autoComplete,
  inputMode,
  onChange,
}: {
  label: string;
  required?: boolean;
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
  shippingMethodId,
  total,
  open,
  onToggle,
}: {
  items: CartItem[];
  subtotal: number;
  shippingPrice: number;
  shippingMethodId: ShippingMethodId;
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="checkout-summary-mobile">
      <button className="summary-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        <span>Order summary</span>
        <strong>{formatMoney(total, "GBP")}</strong>
      </button>
      {open ? <OrderSummary items={items} subtotal={subtotal} shippingPrice={shippingPrice} shippingMethodId={shippingMethodId} total={total} /> : null}
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  shippingPrice,
  shippingMethodId,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  shippingPrice: number;
  shippingMethodId: ShippingMethodId;
  total: number;
}) {
  return (
    <div className="summary-panel">
      <h2>Order Summary</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="summary-items">
          {items.map((item) => (
            <article className="checkout-summary-item" key={`${item.productId}-${item.color}-${item.size}`}>
              {item.image ? <img src={item.image} alt="" /> : <span className="checkout-summary-image-placeholder" aria-hidden="true" />}
              <span className="checkout-summary-item-copy">
                {[item.name, item.color, `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
              </span>
              <strong>{formatMoney(getCartItemPrice(item, "GBP") * item.quantity, "GBP")}</strong>
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
        {isFreeShippingApplied(shippingMethodId, subtotal) ? (
          <p className="free-shipping-applied">Free standard delivery applied</p>
        ) : hasFreeShipping(subtotal) ? (
          <p className="free-shipping-hint">Free standard delivery available with standard delivery</p>
        ) : (
          <p className="free-shipping-hint">
            Free standard delivery on orders £150+
          </p>
        )}
        <div>
          <span>Total</span>
          <strong>{formatMoney(total, "GBP")}</strong>
        </div>
      </div>
      <p className="checkout-summary-currency">Checkout and bank transfer are completed in GBP.</p>
    </div>
  );
}

function formatDeliveryPrice(price: number) {
  return price === 0 ? "Free" : formatMoney(price, "GBP");
}

function createCheckoutSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(3);
    crypto.getRandomValues(values);
    return `checkout-${values.join("-")}`;
  }
  return `checkout-${Date.now()}`;
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
