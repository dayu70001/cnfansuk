export const SHIPPING_FEE_GBP = 4.99;

export const supportConfig = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  telegramUsername: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "",
};

export function getWhatsappLink(orderNo?: string) {
  const text = orderNo
    ? `Hi CNFans UK, I want to pay for order #${orderNo}.`
    : "Hi CNFans UK, I would like help with an order.";
  const number = supportConfig.whatsappNumber || "0000000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function getTelegramLink(orderNo?: string) {
  const text = orderNo
    ? `Hi CNFans UK, I want to pay for order #${orderNo}.`
    : "Hi CNFans UK, I would like help with an order.";
  const username = supportConfig.telegramUsername || "cnfansuk_support";
  return `https://t.me/${username}?text=${encodeURIComponent(text)}`;
}

export const channelConfig = {
  whatsappChannel: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL || "https://whatsapp.com/channel/PLACEHOLDER",
  telegramChannel: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL || "https://t.me/PLACEHOLDER",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "https://instagram.com/PLACEHOLDER",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK || "https://facebook.com/PLACEHOLDER",
};
