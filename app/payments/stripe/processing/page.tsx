import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Keep old payment return links useful without retaining a payment flow or provider call. */
export default async function LegacyPaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  if (typeof order !== "string" || !/^CNF-[A-Za-z0-9-]{1,72}$/.test(order)) notFound();
  redirect(`/order-success?order=${encodeURIComponent(order)}&payment=stripe_live`);
}
