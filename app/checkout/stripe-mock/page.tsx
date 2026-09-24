import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/formatMoney";
import { isLocalStripeBankTransferMockEnabled } from "@/lib/payments/stripeBankTransfer";

export const dynamic = "force-dynamic";

export default async function StripeMockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; amount?: string }>;
}) {
  if (!isLocalStripeBankTransferMockEnabled()) notFound();
  const { order, amount } = await searchParams;
  const amountMinor = Number(amount);
  if (order !== "LOCAL-CNF-TEST" || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) notFound();

  const returnUrl = `/order-success?order=${encodeURIComponent(order)}&payment=mock&amount=${amountMinor}`;

  return (
    <main className="wrap checkout-flow">
      <section className="checkout-step-panel stripe-mock-panel" aria-labelledby="stripe-mock-title">
        <p className="eyebrow">LOCAL PAYMENT SIMULATION</p>
        <h1 id="stripe-mock-title">Bank transfer</h1>
        <p>This development-only screen represents the future hosted payment step. No bank transfer is being started and no money will move.</p>
        <div className="checkout-payment-summary">
          <div><span>Order reference</span><strong>#{order}</strong></div>
          <div><span>Amount</span><strong>{formatMoney(amountMinor / 100, "GBP")}</strong></div>
          <div><span>Status</span><strong>Waiting for payment confirmation</strong></div>
        </div>
        <p role="status">Returning to CNFans does not confirm payment. Bank transfers remain pending until a verified provider notification is received.</p>
        <div className="checkout-actions end">
          <Link className="btn btn-solid" href={returnUrl}>Simulate return to CNFANS</Link>
        </div>
      </section>
    </main>
  );
}
