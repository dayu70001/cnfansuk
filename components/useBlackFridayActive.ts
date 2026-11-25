"use client";

import { useEffect, useState } from "react";
import { BLACK_FRIDAY, isBlackFridayActiveAt } from "@/lib/blackFriday";

export function useBlackFridayActive(initialActive = false) {
  // Use the serialized server value for hydration, then correct cached HTML at the boundaries.
  const [active, setActive] = useState(initialActive);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      if (timer) clearTimeout(timer);
      const now = Date.now();
      setActive(isBlackFridayActiveAt(now));
      const nextBoundary = now < BLACK_FRIDAY.startMs ? BLACK_FRIDAY.startMs
        : now < BLACK_FRIDAY.endMs ? BLACK_FRIDAY.endMs : null;
      if (nextBoundary !== null) timer = setTimeout(sync, Math.min(nextBoundary - now + 1, 2_147_483_647));
    };
    sync();
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return active;
}
