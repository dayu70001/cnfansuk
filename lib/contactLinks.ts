import { supportConfig } from "./config";
import { readSiteSettings, type SiteSettings } from "./siteSettings";

type ContactLinks = SiteSettings["links"];

function appendText(url: string, text: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}text=${encodeURIComponent(text)}`;
}

function whatsappLinkFromLinks(links: ContactLinks, orderNo?: string) {
  const text = orderNo
    ? `Hi CNFans UK, I want to pay for order #${orderNo}.`
    : "Hi CNFans UK, I would like help with an order.";
  if (links.personalWhatsappUrl) {
    return appendText(links.personalWhatsappUrl, text);
  }
  const number = links.personalWhatsappNumber || supportConfig.whatsappNumber || "0000000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function telegramLinkFromLinks(links: ContactLinks, orderNo?: string) {
  const text = orderNo
    ? `Hi CNFans UK, I want to pay for order #${orderNo}.`
    : "Hi CNFans UK, I would like help with an order.";
  if (links.personalTelegramUrl) {
    return appendText(links.personalTelegramUrl, text);
  }
  const username = links.personalTelegramUsername || supportConfig.telegramUsername || "cnfansuk_support";
  return `https://t.me/${username}?text=${encodeURIComponent(text)}`;
}

export function getWhatsappLink(orderNo?: string) {
  return whatsappLinkFromLinks(readSiteSettings().links, orderNo);
}

export function getTelegramLink(orderNo?: string) {
  return telegramLinkFromLinks(readSiteSettings().links, orderNo);
}

export function getWhatsappLinkFromSettings(settings: SiteSettings, orderNo?: string) {
  return whatsappLinkFromLinks(settings.links, orderNo);
}

export function getTelegramLinkFromSettings(settings: SiteSettings, orderNo?: string) {
  return telegramLinkFromLinks(settings.links, orderNo);
}
