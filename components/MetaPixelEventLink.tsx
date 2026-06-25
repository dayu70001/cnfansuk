"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { type MetaPixelEventName, type MetaPixelParams, trackMetaEvent } from "@/lib/metaPixel";

type MetaPixelEventLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  eventName: MetaPixelEventName;
  eventParams?: MetaPixelParams;
};

export function MetaPixelEventLink({ eventName, eventParams, children, ...props }: MetaPixelEventLinkProps) {
  return (
    <Link
      {...props}
      onClick={() => {
        trackMetaEvent(eventName, eventParams);
      }}
    >
      {children}
    </Link>
  );
}
