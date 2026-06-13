"use client";

import { useState } from "react";
import { formatOrderForCopy } from "@/lib/formatOrder";
import type { Order } from "@/lib/types";

export function CopyOrderButton({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="secondary-button"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(formatOrderForCopy(order));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? "Copied" : "Copy Order Details"}
    </button>
  );
}
