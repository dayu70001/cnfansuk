"use client";

import { useRef } from "react";
import type { CustomerFeedbackItem } from "@/data/customerFeedback";

export function CustomerFeedbackCarousel({ items }: { items: readonly CustomerFeedbackItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollRail(direction: number) {
    railRef.current?.scrollBy({
      left: direction * railRef.current.clientWidth * 0.92,
      behavior: "smooth",
    });
  }

  return (
    <section className="customer-feedback" aria-labelledby="customer-feedback-title">
      <div className="wrap">
        <header className="customer-feedback-head">
          <h2 id="customer-feedback-title">Customer Orders &amp; Feedback</h2>
          <p>Real customer messages, delivery updates and product feedback.</p>
          <p className="customer-feedback-privacy">Customer details are blurred for privacy.</p>
        </header>

        <div className="customer-feedback-track">
          <button
            className="customer-feedback-arrow customer-feedback-arrow-prev"
            type="button"
            aria-label="Previous customer feedback"
            onClick={() => scrollRail(-1)}
          >
            ←
          </button>
          <div className="customer-feedback-rail" ref={railRef} role="region" aria-label="Customer feedback carousel">
            {items.map((item) => {
              return (
                <article className="customer-feedback-card" key={item.id}>
                  <div className="customer-feedback-media">
                    <img src={item.image} alt={`Customer order screenshot ${String(item.id).padStart(2, "0")}`} />
                  </div>
                </article>
              );
            })}
          </div>
          <button
            className="customer-feedback-arrow customer-feedback-arrow-next"
            type="button"
            aria-label="Next customer feedback"
            onClick={() => scrollRail(1)}
          >
            →
          </button>
        </div>
        <div className="customer-feedback-separator" aria-hidden="true" />
      </div>
    </section>
  );
}
