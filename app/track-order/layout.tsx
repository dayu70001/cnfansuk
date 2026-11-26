import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check available order or parcel tracking updates using your CNFANS UK order number or tracking number.",
  alternates: { canonical: `${SITE_URL}/track-order` },
};

export default function TrackOrderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
