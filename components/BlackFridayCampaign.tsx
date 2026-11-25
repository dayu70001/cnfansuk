"use client";

import Link from "next/link";
import { BLACK_FRIDAY } from "@/lib/blackFriday";
import { useBlackFridayActive } from "./useBlackFridayActive";

export function BlackFridayCampaign({ initialActive }: { initialActive: boolean }) {
  const active = useBlackFridayActive(initialActive);
  if (!active) return null;

  return (
    <section className="bf-campaign" aria-labelledby="bf-campaign-title">
      <div className="bf-campaign-inner wrap">
        <div className="bf-campaign-main">
          <p className="bf-kicker">CNFANS / BLACK FRIDAY EDIT <span>24–30 November 2026</span></p>
          <h2 id="bf-campaign-title">Black Friday Week</h2>
          <p className="bf-hero-offer">£5 <span>OFF</span></p>
          <p className="bf-no-minimum">No minimum spend.</p>
        </div>
        <div className="bf-campaign-details">
          <p className="bf-extra-title">Extra savings when you spend more.</p>
          <div className="bf-tiers">
            {BLACK_FRIDAY.tiers.map(({ spend, extra }) => (
              <div className="bf-tier" key={spend}>
                <span>SPEND £{spend}</span>
                <strong>EXTRA £{extra} OFF</strong>
              </div>
            ))}
          </div>
          <Link className="bf-shop-link" href="/category/new-in" prefetch={false}>Shop the Collection <span aria-hidden="true">→</span></Link>
          <p className="bf-flow-note">Order online. Claim your savings on WhatsApp before payment.</p>
          <details className="bf-terms">
            <summary>Terms apply</summary>
            <div className="bf-terms-content">
              <strong>Black Friday Offer Terms</strong>
              <p>24–30 November 2026.</p>
              <ul>
                <li>Get £5 off with no minimum spend.</li>
                <li>Spend £100 and get an extra £5 off.</li>
                <li>Spend £200 and get an extra £10 off.</li>
                <li>Spend £300 and get an extra £20 off.</li>
                <li>The £5 voucher is limited to one use per customer.</li>
                <li>The voucher can be combined with the highest applicable spending discount only.</li>
                <li>Spending thresholds exclude delivery charges.</li>
                <li>The discount cannot exceed the eligible merchandise total.</li>
                <li>The same numerical offer amounts apply in euros for EUR orders.</li>
                <li>Place your order online, then contact us on WhatsApp with your order number to claim your savings before payment.</li>
                <li>Eligible orders must be placed by 30 November 2026, UK time.</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
