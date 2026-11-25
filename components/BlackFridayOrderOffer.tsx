import type { ReactNode } from "react";

export function BlackFridayOrderOffer({ children }: { children: ReactNode }) {
  return (
    <section className="bf-order-offer" aria-label="Your Black Friday offer">
      <div className="bf-order-offer-inner">
        <p className="bf-order-kicker">YOUR BLACK FRIDAY OFFER</p>
        <h2>Claim your Black Friday savings.</h2>
        <p>Your order qualifies for our Black Friday offer. Contact us on WhatsApp to claim your discount before payment.</p>
        <strong className="bf-payment-warning">Please confirm your discounted total with us before paying.</strong>
        {children}
      </div>
    </section>
  );
}
