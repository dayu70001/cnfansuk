import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OrderSuccessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
