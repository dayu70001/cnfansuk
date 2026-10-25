export type PersonalWhatsAppContact = {
  personalWhatsappUrl?: string | null;
  personalWhatsappNumber?: string | null;
};

function isDirectWhatsAppUrl(url: URL): boolean {
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === "api.whatsapp.com") return url.pathname.replace(/\/$/, "") === "/send";
  if (hostname === "wa.me") return /^\/\d{6,20}\/?$/.test(url.pathname);
  return false;
}

/** Build a prefilled link to the configured personal WhatsApp contact only. */
export function buildPersonalWhatsAppLink(
  contact: PersonalWhatsAppContact,
  message: string,
): string | null {
  const configuredUrl = contact.personalWhatsappUrl?.trim();
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      if (isDirectWhatsAppUrl(url)) {
        url.searchParams.set("text", message);
        return url.toString();
      }
    } catch {
      // Fall through to the configured personal number when the URL is invalid.
    }
  }

  const number = (contact.personalWhatsappNumber || "").replace(/\D/g, "");
  if (!/^\d{6,20}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
