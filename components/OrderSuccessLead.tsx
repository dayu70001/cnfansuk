"use client";

import { useEffect, useRef } from "react";
import { trackLead } from "@/lib/metaPixel";

// Fires the Lead event exactly once when the order-success page loads. This is
// the single source of Lead — the Submit Order button does not fire Lead, so an
// order is never counted twice.
export function OrderSuccessLead({ order }: { order: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackLead({
      source_page: "order_success",
      placement: "order_success_load",
      content_name: order,
      currency: "GBP",
    });
  }, [order]);

  return null;
}
