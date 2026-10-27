"use client";

import { usePathname } from "next/navigation";

export function FooterBrand() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  return (
    <div className={`brand${isAdminRoute ? " admin-footer-brand" : ""}`}>
      {isAdminRoute ? (
        <>
          CNFans <span>UK</span>
        </>
      ) : (
        "CNFANS UK"
      )}
    </div>
  );
}
