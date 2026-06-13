import { supportConfig } from "./config";
import { readSiteSettings } from "./siteSettings";

function appendText(url: string, text: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}text=${encodeURIComponent(text)}`;
}

export function getWhatsappLink(orderNo?: string) {
  const text = orderNo
    ? `Hi CNFans UK, I want to pay for order #${orderNo}.`
    : "Hi CNFans UK, I would like help with an order.";
  const links = readSiteSettings().links;
  if (links.personalWhatsappUrl) {
    return appendText(links.personalWhatsappUrl, text);
  }
  const number = links.personalWhatsappNumber || supportConfig.whatsappNumber || "0000000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function getTelegramLink(orderNo?: string) {
  const text = orderNo
    ? `Hi CNFans UK, I want to pay for order #${orderNo}.`
    : "Hi CNFans UK, I would like help with an order.";
  const links = readSiteSettings().links;
  if (links.personalTelegramUrl) {
    return appendText(links.personalTelegramUrl, text);
  }
  const username = links.personalTelegramUsername || supportConfig.telegramUsername || "cnfansuk_support";
  return `https://t.me/${username}?text=${encodeURIComponent(text)}`;
}
