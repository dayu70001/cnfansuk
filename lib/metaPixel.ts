export type MetaPixelEventName = "PageView" | "ViewContent" | "Contact" | "Lead" | "InitiateCheckout" | "Search";

export type MetaPixelParams = Record<string, string | number | boolean | string[] | undefined>;

declare global {
  interface Window {
    fbq?: (method: "track", eventName: MetaPixelEventName, params?: MetaPixelParams) => void;
  }
}

export function trackMetaEvent(eventName: MetaPixelEventName, params?: MetaPixelParams) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", eventName, params);
}
