import Link from "next/link";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { fetchSiteSettings } from "@/lib/siteSettings";

export async function Footer() {
  const { links } = await fetchSiteSettings();
  const shopLinks = [
    { href: "/category/new-in", label: "New In" },
    { href: "/category/outerwear", label: "Outerwear" },
    { href: "/category/tops", label: "Tops" },
    { href: "/category/bottoms", label: "Bottoms" },
    { href: "/category/co-ords-sets", label: "Co-ords & Sets" },
  ];
  const supportLinks = [
    { href: "/delivery", label: "Delivery" },
    { href: "/returns", label: "Returns" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/track-order", label: "Track Order" },
    { href: "/contact", label: "Contact" },
  ];
  const companyLinks = [
    { href: "/about", label: "About CNFans UK" },
    { href: "/how-to-order", label: "How to Order" },
  ];
  const guideLinks = [
    { href: "/cnfans-spreadsheet", label: "CNFans Spreadsheet" },
    { href: "/cnfans-finds", label: "CNFans Finds" },
    { href: "/how-to-order", label: "How to Order" },
    { href: "/cnfans-delivery-uk", label: "Delivery Guide" },
    { href: "/cnfans-size-guide", label: "Size Guide" },
  ];
  const channels = [
    { href: links.instagramUrl, label: "Instagram", icon: <InstagramIcon /> },
    { href: links.facebookUrl, label: "Facebook", icon: <FacebookIcon /> },
    { href: links.whatsappChannelUrl, label: "WhatsApp", icon: <WhatsAppIcon /> },
    { href: links.telegramChannelUrl, label: "Telegram", icon: <TelegramIcon /> },
  ];

  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <div className="brand">
              CNFans <span>UK</span>
            </div>
            <p>Everyday apparel with practical fits and a simpler sourcing route.</p>
          </div>
          <nav className="foot-col" aria-label="Shop">
            <h4>Shop</h4>
            {shopLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="foot-col" aria-label="Support">
            <h4>Support</h4>
            {supportLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="foot-col" aria-label="Follow">
            <h4>Follow</h4>
            {channels.map((item) => {
              // The footer "Follow" WhatsApp/Telegram links point at the public
              // channel URLs, so they map to the Join*Channel events.
              if (item.label === "WhatsApp" || item.label === "Telegram") {
                const eventName = item.label === "WhatsApp" ? "JoinWhatsAppChannel" : "JoinTelegramChannel";
                const destination = item.label === "WhatsApp" ? "whatsapp_channel" : "telegram_channel";
                return (
                  <MetaPixelEventLink
                    className="foot-icon-link"
                    href={item.href}
                    key={item.label}
                    target="_blank"
                    rel="noreferrer"
                    eventName={eventName}
                    eventParams={{
                      source_page: "footer",
                      placement: "footer_follow",
                      button_label: item.label,
                      destination,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </MetaPixelEventLink>
                );
              }
              return (
                <Link className="foot-icon-link" href={item.href} key={item.label} target="_blank" rel="noreferrer">
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <nav className="foot-col" aria-label="Company">
            <h4>Company</h4>
            {companyLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="foot-col" aria-label="CNFans UK guides">
            <h4>Guides</h4>
            {guideLinks.map((item) => (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="foot-bottom">
          <small>© 2026 CNFans UK. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.52 15.27L2 22l4.86-1.27A10 10 0 1 0 12 2Zm0 18.13a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-2.88.76.77-2.81-.19-.29A8.13 8.13 0 1 1 12 20.13Zm4.46-6.09c-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.24-.01-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2.01 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.27 18.6 19.78c-.25 1.1-.9 1.37-1.83.85l-5.04-3.72-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.13 9.34-8.44c.4-.36-.09-.56-.63-.2L5.5 13.07l-4.96-1.55c-1.08-.33-1.1-1.07.23-1.59L20.48 2.4c.9-.33 1.69.21 1.42 1.87Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M15 3h-3a4 4 0 0 0-4 4v3H5v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
    </svg>
  );
}
