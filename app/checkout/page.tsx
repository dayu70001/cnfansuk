"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { getCartItemPrice, getCartSubtotal } from "@/lib/cart";
import type { CurrencyCode } from "@/lib/currency";
import { formatMoney } from "@/lib/formatMoney";
import {
  DEFAULT_SHIPPING_METHOD_ID,
  getShippingMethod,
  getShippingPrice,
  hasFreeShipping,
  isFreeShippingApplied,
  shippingMethods,
  type ShippingMethodId,
} from "@/lib/shipping";
import { useCurrency } from "@/lib/useCurrency";
import type { CartItem, CustomerDetails } from "@/lib/types";

type CheckoutStep = "contact" | "shipping" | "method" | "review";

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
  { id: "contact", label: "Contact" },
  { id: "shipping", label: "Shipping" },
  { id: "method", label: "Method" },
  { id: "review", label: "Review" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { currency } = useCurrency();
  const [step, setStep] = useState<CheckoutStep>("contact");
  const [maxStep, setMaxStep] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const subtotal = useMemo(() => getCartSubtotal(items, currency), [currency, items]);
  const subtotalGbp = useMemo(() => getCartSubtotal(items, "GBP"), [items]);
  const shippingPrice = getShippingPrice(shippingMethodId, subtotalGbp, currency);
  const total = subtotal + shippingPrice;

  function validateContact() {
    const nextErrors: Record<string, string> = {};
    const email = contact.email.trim();
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateShipping() {
    const requiredFields: (keyof ShippingForm)[] = [
      "firstName",
      "lastName",
      "addressLine1",
      "city",
      "postcode",
      "countryCode",
      "phone",
    ];
    const nextErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!shipping[field].trim()) {
        nextErrors[field] = "This field is required.";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function continueTo(nextStep: CheckoutStep) {
    if (step === "contact" && !validateContact()) {
      return;
    }
    if (step === "shipping" && !validateShipping()) {
      return;
    }
    const nextIndex = steps.findIndex((item) => item.id === nextStep);
    setStep(nextStep);
    setMaxStep((value) => Math.max(value, nextIndex));
    setErrors({});
  }

  function goToCompleted(nextStep: CheckoutStep) {
    const nextIndex = steps.findIndex((item) => item.id === nextStep);
    if (nextIndex <= maxStep) {
      setStep(nextStep);
      setErrors({});
    }
  }

  async function submitOrder() {
    if (items.length === 0 || !validateContact() || !validateShipping()) {
      return;
    }

    const customer: CustomerDetails = {
      fullName: `${shipping.firstName.trim()} ${shipping.lastName.trim()}`.trim(),
      phone: shipping.phone.trim(),
      email: contact.email.trim(),
      country: shipping.countryName.trim(),
      countryCode: shipping.countryCode,
      countryName: shipping.countryName.trim(),
      address: [shipping.addressLine1.trim(), shipping.addressLine2.trim()].filter(Boolean).join(", "),
      city: shipping.city.trim(),
      county: shipping.county.trim(),
      postcode: shipping.postcode.trim(),
      preferredContact: "WhatsApp",
      notes: "",
    };
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            ...customer,
            addressLine1: shipping.addressLine1.trim(),
            addressLine2: shipping.addressLine2.trim(),
            preferredContact: customer.preferredContact,
          },
          items: items.map((item) => ({
            productCode: item.productCode || item.productId,
            title: item.title || item.name,
            slug: item.slug,
            productUrl: item.productUrl || `/product/${item.slug}`,
            image: item.image,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: getCartItemPrice(item, currency),
            currency,
          })),
          shippingMethodId,
          currency,
          paymentMethod: "待确认",
        }),
      });
      const result = await response.json().catch(() => ({})) as { order?: { orderNumber?: string }; error?: string };
      if (!response.ok || !result.order?.orderNumber) {
        setSubmitError(result.error || "订单保存失败，请稍后重试。");
        setSubmitting(false);
        return;
      }
      clearCart();
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

      <MobileSummary items={items} subtotal={subtotal} subtotalGbp={subtotalGbp} shippingPrice={shippingPrice} total={total} currency={currency} open={summaryOpen} onToggle={() => setSummaryOpen(!summaryOpen)} />

      <div className="checkout-layout">
        <div className="checkout-panel">
          {step === "contact" ? (
            <ContactStep contact={contact} errors={errors} onChange={setContact} onContinue={() => continueTo("shipping")} />
          ) : null}

          {step === "shipping" ? (
            <ShippingStep
              shipping={shipping}
              errors={errors}
              onChange={setShipping}
              onBack={() => setStep("contact")}
              onContinue={() => continueTo("method")}
            />
          ) : null}

          {step === "method" ? (
            <MethodStep
              currency={currency}
              subtotalGbp={subtotalGbp}
              selectedMethodId={shippingMethodId}
              onSelect={setShippingMethodId}
              onBack={() => setStep("shipping")}
              onContinue={() => continueTo("review")}
            />
          ) : null}

          {step === "review" ? (
            <ReviewStep
              contact={contact}
              shipping={shipping}
              items={items}
              subtotal={subtotal}
              subtotalGbp={subtotalGbp}
              shippingPrice={shippingPrice}
              total={total}
              currency={currency}
              shippingMethodId={shippingMethodId}
              submitting={submitting}
              submitError={submitError}
              onBack={() => setStep("method")}
              onSubmit={submitOrder}
            />
          ) : null}
        </div>

        <aside className="checkout-summary checkout-summary-desktop" aria-label="Order summary">
          <OrderSummary items={items} subtotal={subtotal} subtotalGbp={subtotalGbp} shippingPrice={shippingPrice} total={total} currency={currency} />
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

function ContactStep({
  contact,
  errors,
  onChange,
  onContinue,
}: {
  contact: ContactForm;
  errors: Record<string, string>;
  onChange: (value: ContactForm) => void;
  onContinue: () => void;
}) {
  return (
    <div className="checkout-step-panel">
      <h2>Contact</h2>
      <div className={errors.email ? "field error" : "field"}>
        <label htmlFor="checkout-email">Email</label>
        <input
          id="checkout-email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={contact.email}
          onChange={(event) => onChange({ email: event.target.value })}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email ? <span className="err-msg">{errors.email}</span> : null}
      </div>
      <div className="checkout-actions end">
        <button className="btn btn-solid" type="button" onClick={onContinue}>
          Continue to shipping
        </button>
      </div>
    </div>
  );
}

function ShippingStep({
  shipping,
  errors,
  onChange,
  onBack,
  onContinue,
}: {
  shipping: ShippingForm;
  errors: Record<string, string>;
  onChange: (value: ShippingForm) => void;
  onBack: () => void;
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
    setAddressQuery(properties.address_line1 || properties.name || addressQuery);
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
      <h2>Shipping address</h2>
      <div className="field-row">
        <CheckoutInput label="First name" autoComplete="given-name" value={shipping.firstName} error={errors.firstName} onChange={(value) => update("firstName", value)} />
        <CheckoutInput label="Last name" autoComplete="family-name" value={shipping.lastName} error={errors.lastName} onChange={(value) => update("lastName", value)} />
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
                placeholder="Start typing your address"
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
        <CheckoutInput label="City" autoComplete="address-level2" value={shipping.city} error={errors.city} onChange={(value) => update("city", value)} />
        <CheckoutInput label="County / State" autoComplete="address-level1" value={shipping.county} onChange={(value) => update("county", value)} />
      </div>
      <div className="field-row">
        <CheckoutInput label="Postcode" autoComplete="postal-code" value={shipping.postcode} error={errors.postcode} onChange={(value) => update("postcode", value)} />
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
      <CheckoutInput label="Phone" autoComplete="tel" inputMode="tel" value={shipping.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Return to contact
        </button>
        <button className="btn btn-solid" type="submit">
          Continue to shipping method
        </button>
      </div>
    </form>
  );
}

function MethodStep({
  currency,
  subtotalGbp,
  selectedMethodId,
  onSelect,
  onBack,
  onContinue,
}: {
  currency: CurrencyCode;
  subtotalGbp: number;
  selectedMethodId: ShippingMethodId;
  onSelect: (methodId: ShippingMethodId) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const freeShipping = isFreeShippingApplied(selectedMethodId, subtotalGbp);

  return (
    <div className="checkout-step-panel">
      <h2>Shipping method</h2>
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
            <strong>{formatMoney(getShippingPrice(method.id, subtotalGbp, currency), currency)}</strong>
          </label>
        ))}
      </div>
      {freeShipping ? <p className="free-shipping-applied">Free shipping applied</p> : null}
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Return to shipping
        </button>
        <button className="btn btn-solid" type="button" onClick={onContinue}>
          Continue to review
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  contact,
  shipping,
  items,
  subtotal,
  subtotalGbp,
  shippingPrice,
  total,
  currency,
  shippingMethodId,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: {
  contact: ContactForm;
  shipping: ShippingForm;
  items: CartItem[];
  subtotal: number;
  subtotalGbp: number;
  shippingPrice: number;
  total: number;
  currency: CurrencyCode;
  shippingMethodId: ShippingMethodId;
  submitting: boolean;
  submitError: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const shippingMethod = getShippingMethod(shippingMethodId);

  return (
    <div className="checkout-step-panel">
      <h2>Review & submit</h2>
      <div className="checkout-review">
        <ReviewRow label="Contact" value={contact.email} />
        <ReviewRow
          label="Ship to"
          value={[
            shipping.firstName,
            shipping.lastName,
            shipping.addressLine1,
            shipping.addressLine2,
            shipping.city,
            shipping.county,
            shipping.postcode,
            shipping.countryName,
          ]
            .filter(Boolean)
            .join(", ")}
        />
        <ReviewRow label="Method" value={`${shippingMethod.label} · ${shippingMethod.estimate} — ${formatMoney(shippingPrice, currency)}`} />
      </div>
      <OrderSummary items={items} subtotal={subtotal} subtotalGbp={subtotalGbp} shippingPrice={shippingPrice} total={total} currency={currency} compact={false} />
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Return to method
        </button>
        <button className="btn btn-solid" type="button" onClick={onSubmit} disabled={items.length === 0 || submitting}>
          {submitting ? "Saving order…" : "Submit Order"}
        </button>
      </div>
      {submitError ? <p className="checkout-submit-error">{submitError}</p> : null}
      <p className="checkout-submit-note">We&apos;ll confirm sizing, order details and payment with you via WhatsApp or Telegram.</p>
    </div>
  );
}

function CheckoutInput({
  label,
  value,
  error,
  autoComplete,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  autoComplete?: string;
  inputMode?: "email" | "numeric" | "search" | "tel" | "text" | "url";
  onChange: (value: string) => void;
}) {
  const inputId = `checkout-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <div className={error ? "field error" : "field"}>
      <label htmlFor={inputId}>{label}</label>
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MobileSummary({
  items,
  subtotal,
  subtotalGbp,
  shippingPrice,
  total,
  currency,
  open,
  onToggle,
}: {
  items: CartItem[];
  subtotal: number;
  subtotalGbp: number;
  shippingPrice: number;
  total: number;
  currency: CurrencyCode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="checkout-summary-mobile">
      <button className="summary-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        <span>Order summary</span>
        <strong>{formatMoney(total, currency)}</strong>
      </button>
      {open ? <OrderSummary items={items} subtotal={subtotal} subtotalGbp={subtotalGbp} shippingPrice={shippingPrice} total={total} currency={currency} /> : null}
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  subtotalGbp,
  shippingPrice,
  total,
  currency,
  compact = false,
}: {
  items: CartItem[];
  subtotal: number;
  subtotalGbp: number;
  shippingPrice: number;
  total: number;
  currency: CurrencyCode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "summary-panel compact" : "summary-panel"}>
      <h2>Order Summary</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="summary-items">
          {items.map((item) => (
            <div key={`${item.productId}-${item.color}-${item.size}`}>
              <span>
                {[item.name, item.color, `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
              </span>
              <strong>{formatMoney(getCartItemPrice(item, currency) * item.quantity, currency)}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="totals">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal, currency)}</strong>
        </div>
        <div>
          <span>Shipping</span>
          <strong>{formatMoney(shippingPrice, currency)}</strong>
        </div>
        {shippingPrice === 0 && hasFreeShipping(subtotalGbp) ? <p className="free-shipping-applied">Free shipping applied</p> : null}
        <div>
          <span>Total</span>
          <strong>{formatMoney(total, currency)}</strong>
        </div>
      </div>
    </div>
  );
}
