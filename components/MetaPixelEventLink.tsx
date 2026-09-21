"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { type MetaPixelEventName, type MetaPixelParams, trackMetaEvent } from "@/lib/metaPixel";

type MetaPixelEventLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  eventName: MetaPixelEventName;
  eventParams?: MetaPixelParams;
  recordWhatsappClickForOrder?: string;
};

export function MetaPixelEventLink({ eventName, eventParams, children, ...props }: MetaPixelEventLinkProps) {
  const { recordWhatsappClickForOrder, ...linkProps } = props;
  return (
    <Link
      {...linkProps}
      onClick={() => {
        trackMetaEvent(eventName, eventParams);
        if (recordWhatsappClickForOrder) {
          void fetch(`/api/orders/${encodeURIComponent(recordWhatsappClickForOrder)}/whatsapp-clicked`, {
            method: "POST",
            headers: { Accept: "application/json" },
            keepalive: true,
          }).catch(() => undefined);
        }
      }}
    >
      {children}
    </Link>
  );
}
