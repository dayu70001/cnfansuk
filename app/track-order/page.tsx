"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

interface TrackEvent {
  date: string;
  content: string;
  location: string;
}

interface TrackResult {
  ok: boolean;
  trackingNumber?: string;
  status?: string;
  statusCode?: number;
  message?: string;
  events?: TrackEvent[];
  error?: string;
}

const trackingNotes = [
  {
    title: "Order status and tracking status",
    text: "An order result describes order or payment progress, such as Order created, Awaiting payment, Payment submitted, Payment confirmed or Cancelled. Payment submitted records the payment step, not confirmed receipt. Parcel tracking is different: it shows carrier movement after dispatch.",
  },
  {
    title: "Tracking updates",
    text: "Tracking information is shared after your order has been confirmed and dispatched. A new carrier scan may not appear immediately.",
  },
  {
    title: "Need help?",
    text: "Keep your CNFans UK order number. If your order is not visible or tracking is not available, contact support with that number.",
  },
];

export default function TrackOrderPage() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = number.trim();
    if (!trimmed) {
      setResult({ ok: false, error: "Please enter a tracking number." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/track?number=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResult(data as TrackResult);
    } catch {
      setResult({ ok: false, error: "Network error. Please try again later." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="support-page track-page">
      <section className="support-hero support-hero-centered">
        <p className="support-kicker">Support</p>
        <h1>Track Your Order</h1>
        <p>
          Tracking details are shared after your order has been confirmed and dispatched. If tracking
          is not available yet, please contact us with your CNFans UK order number.
        </p>
      </section>

      <section className="tracking-panel tracking-panel-primary">
        <div className="tracking-panel-head">
          <span>Order tracking</span>
          <h2>Enter your order number or tracking number.</h2>
          <p>Enter your order number or tracking number to check for available updates.</p>
        </div>
        <form className="tracking-form" onSubmit={handleSubmit}>
          <input
            aria-label="Order number or tracking number"
            name="q"
            placeholder="Order number or tracking number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Tracking..." : "Track Order"}
          </button>
        </form>
        <p className="tracking-note">
          For delivery support, email us with your CNFans UK order number.
        </p>
      </section>

      {result && (
        <section className="tracking-result" aria-live="polite">
          {!result.ok ? (
            <div className="tracking-result-empty">
              <p className="tracking-result-title">No results found</p>
              <p className="tracking-result-text">
                {result.error || "We could not find tracking information for that number."}
              </p>
            </div>
          ) : (
            <div className="tracking-result-card">
              <div className="tracking-result-header">
                <p className="tracking-result-number">{result.trackingNumber}</p>
                <span className="tracking-result-status">{result.status}</span>
              </div>
              {result.events && result.events.length > 0 ? (
                <ul className="tracking-result-list">
                  {result.events.map((event, i) => (
                    <li key={i} className="tracking-result-item">
                      <span className="tracking-result-date">{event.date}</span>
                      <span className="tracking-result-content">{event.content}</span>
                      {event.location && (
                        <span className="tracking-result-location">{event.location}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tracking-result-text">
                  {result.message || "No tracking events available yet."}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="tracking-support-notes" aria-label="Tracking guidance">
        {trackingNotes.map((item) => (
          <article key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="support-notice">
        <span>Related help</span>
        <p>
          Read our <Link href="/delivery">delivery guidance</Link> for parcel issues, the{" "}
          <Link href="/how-to-order">How to Order guide</Link> for the purchase steps, or{" "}
          <Link href="/bank-transfer-payment-help">bank transfer payment help</Link> if you are unsure about a payment status.
        </p>
      </section>
    </main>
  );
}
