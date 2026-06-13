"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { getCartSubtotal } from "@/lib/cart";
import { SHIPPING_FEE_GBP } from "@/lib/config";
import { formatMoney } from "@/lib/formatMoney";
import { addOrder, createOrderNumber } from "@/lib/orders";
import type { CartItem, CustomerDetails } from "@/lib/types";

type CheckoutStep = "contact" | "shipping" | "method" | "review";

type ContactForm = {
  email: string;
};

type ShippingForm = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
};

const steps: { id: CheckoutStep; label: string }[] = [
  { id: "contact", label: "Contact" },
  { id: "shipping", label: "Shipping" },
  { id: "method", label: "Method" },
  { id: "review", label: "Review" },
];

const shippingMethod = {
  label: "Standard UK delivery",
  price: SHIPPING_FEE_GBP,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>("contact");
  const [maxStep, setMaxStep] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactForm>({ email: "" });
  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    phone: "",
  });

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const total = subtotal + shippingMethod.price;
  const stepIndex = steps.findIndex((item) => item.id === step);

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
      "address1",
      "city",
      "postcode",
      "country",
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

  function submitOrder() {
    if (items.length === 0 || !validateContact() || !validateShipping()) {
      return;
    }

    const customer: CustomerDetails = {
      fullName: `${shipping.firstName.trim()} ${shipping.lastName.trim()}`.trim(),
      phone: shipping.phone.trim(),
      email: contact.email.trim(),
      country: shipping.country.trim(),
      address: [shipping.address1.trim(), shipping.address2.trim()].filter(Boolean).join(", "),
      city: shipping.city.trim(),
      postcode: shipping.postcode.trim(),
      preferredContact: "WhatsApp",
      notes: "",
    };
    const orderNo = createOrderNumber();
    addOrder({
      orderNo,
      createdAt: new Date().toISOString(),
      customer,
      items,
      subtotal,
      shipping: shippingMethod.price,
      total,
      status: "Order Submitted",
    });
    clearCart();
    router.push(`/order-success?order=${orderNo}`);
  }

  return (
    <section className="checkout checkout-flow wrap">
      <div className="page-heading checkout-heading">
        <p className="eyebrow">Checkout</p>
      </div>

      <StepIndicator currentStep={step} maxStep={maxStep} onSelect={goToCompleted} />

      <MobileSummary items={items} subtotal={subtotal} total={total} open={summaryOpen} onToggle={() => setSummaryOpen(!summaryOpen)} />

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
            <MethodStep onBack={() => setStep("shipping")} onContinue={() => continueTo("review")} />
          ) : null}

          {step === "review" ? (
            <ReviewStep
              contact={contact}
              shipping={shipping}
              items={items}
              subtotal={subtotal}
              total={total}
              onBack={() => setStep("method")}
              onSubmit={submitOrder}
            />
          ) : null}
        </div>

        <aside className="checkout-summary checkout-summary-desktop" aria-label="Order summary">
          <OrderSummary items={items} subtotal={subtotal} total={total} />
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
  function update(field: keyof ShippingForm, value: string) {
    onChange({ ...shipping, [field]: value });
  }

  return (
    <div className="checkout-step-panel">
      <h2>Shipping address</h2>
      <div className="field-row">
        <CheckoutInput label="First name" value={shipping.firstName} error={errors.firstName} onChange={(value) => update("firstName", value)} />
        <CheckoutInput label="Last name" value={shipping.lastName} error={errors.lastName} onChange={(value) => update("lastName", value)} />
      </div>
      <CheckoutInput label="Address line 1" value={shipping.address1} error={errors.address1} onChange={(value) => update("address1", value)} />
      <CheckoutInput label="Address line 2 (optional)" value={shipping.address2} onChange={(value) => update("address2", value)} />
      <div className="field-row">
        <CheckoutInput label="City" value={shipping.city} error={errors.city} onChange={(value) => update("city", value)} />
        <CheckoutInput label="Postcode" value={shipping.postcode} error={errors.postcode} onChange={(value) => update("postcode", value)} />
      </div>
      <CheckoutInput label="Country" value={shipping.country} error={errors.country} onChange={(value) => update("country", value)} />
      <CheckoutInput label="Phone" value={shipping.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Return to contact
        </button>
        <button className="btn btn-solid" type="button" onClick={onContinue}>
          Continue to shipping method
        </button>
      </div>
    </div>
  );
}

function MethodStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  return (
    <div className="checkout-step-panel">
      <h2>Shipping method</h2>
      <label className="ship-option selected">
        <input type="radio" name="shippingMethod" checked readOnly />
        <span>{shippingMethod.label}</span>
        <strong>{formatMoney(shippingMethod.price)}</strong>
      </label>
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
  total,
  onBack,
  onSubmit,
}: {
  contact: ContactForm;
  shipping: ShippingForm;
  items: CartItem[];
  subtotal: number;
  total: number;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="checkout-step-panel">
      <h2>Review & submit</h2>
      <div className="checkout-review">
        <ReviewRow label="Contact" value={contact.email} />
        <ReviewRow
          label="Ship to"
          value={[shipping.firstName, shipping.lastName, shipping.address1, shipping.address2, shipping.city, shipping.postcode, shipping.country]
            .filter(Boolean)
            .join(", ")}
        />
        <ReviewRow label="Method" value={`${shippingMethod.label} — ${formatMoney(shippingMethod.price)}`} />
      </div>
      <OrderSummary items={items} subtotal={subtotal} total={total} compact={false} />
      <div className="checkout-actions">
        <button className="checkout-back" type="button" onClick={onBack}>
          Return to method
        </button>
        <button className="btn btn-solid" type="button" onClick={onSubmit} disabled={items.length === 0}>
          Submit Order
        </button>
      </div>
      <p className="checkout-submit-note">We&apos;ll confirm sizing, order details and payment with you via WhatsApp or Telegram.</p>
    </div>
  );
}

function CheckoutInput({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const inputId = `checkout-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <div className={error ? "field error" : "field"}>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? "true" : "false"} />
      {error ? <span className="err-msg">{error}</span> : null}
    </div>
  );
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
  total,
  open,
  onToggle,
}: {
  items: CartItem[];
  subtotal: number;
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="checkout-summary-mobile">
      <button className="summary-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        <span>Order summary</span>
        <strong>{formatMoney(total)}</strong>
      </button>
      {open ? <OrderSummary items={items} subtotal={subtotal} total={total} /> : null}
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  total,
  compact = false,
}: {
  items: CartItem[];
  subtotal: number;
  total: number;
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
                {item.name} · {item.color} · Size {item.size} · Qty {item.quantity}
              </span>
              <strong>{formatMoney(item.priceGBP * item.quantity)}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="totals">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <div>
          <span>Shipping</span>
          <strong>{formatMoney(shippingMethod.price)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </div>
    </div>
  );
}
