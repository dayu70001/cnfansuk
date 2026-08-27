import type { Metadata } from "next";
import Link from "next/link";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { getTelegramLinkFromSettings, getWhatsappLinkFromSettings } from "@/lib/contactLinks";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { fetchSiteSettings } from "@/lib/siteSettings";
import styles from "./connect.module.css";

const title = `Connect with ${SITE_NAME}`;
const description =
  "Message CNFans UK on WhatsApp or Telegram for clothing details, sizing guidance and personal order support.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/connect` },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE_URL}/connect`,
    siteName: SITE_NAME,
  },
};

export default async function ConnectPage() {
  const settings = await fetchSiteSettings();
  const whatsappUrl = getWhatsappLinkFromSettings(settings);
  const telegramUrl = getTelegramLinkFromSettings(settings);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.card} aria-labelledby="connect-title">
          <div className={styles.glow} aria-hidden="true" />

          <Link className={styles.brand} href="/" aria-label="CNFans UK home">
            <span>CNFans</span>
            <small>UK</small>
          </Link>

          <div className={styles.avatar} aria-hidden="true">
            <span>C</span>
            <i />
            <small>CNFANS UK</small>
          </div>

          <h1 id="connect-title">
            <em>New</em>
            Clothing Style Picks
          </h1>
          <p className={styles.description}>
            Explore everyday hoodies, jackets, trousers and matching sets, with personal support before you order.
          </p>

          <div className={styles.trust} aria-label="Service highlights">
            <div>
              <span aria-hidden="true">✦</span>
              <p>
                Direct
                <br />
                Personal Support
              </p>
            </div>
            <div>
              <span aria-hidden="true">⌖</span>
              <p>
                UK &amp; Europe
                <br />
                Delivery
              </p>
            </div>
            <div>
              <span aria-hidden="true">✓</span>
              <p>
                Simple
                <br />
                Order Support
              </p>
            </div>
          </div>

          <div className={styles.actions} aria-label="Contact CNFans UK">
            <MetaPixelEventLink
              className={styles.button}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              eventName="ContactWhatsApp"
              eventParams={{
                source_page: "connect",
                placement: "connect_whatsapp",
                button_label: "WhatsApp Support",
                destination: "whatsapp_personal",
              }}
            >
              <span className={styles.buttonIcon} aria-hidden="true">
                <WhatsAppIcon />
              </span>
              <span className={styles.buttonText}>WhatsApp Support</span>
              <span className={styles.buttonArrow} aria-hidden="true">
                ›
              </span>
              <span className={styles.buttonShine} aria-hidden="true" />
              <span className={styles.buttonSpark} aria-hidden="true">
                ✦
              </span>
            </MetaPixelEventLink>

            <MetaPixelEventLink
              className={styles.button}
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              eventName="ContactTelegram"
              eventParams={{
                source_page: "connect",
                placement: "connect_telegram",
                button_label: "Telegram Support",
                destination: "telegram_personal",
              }}
            >
              <span className={styles.buttonIcon} aria-hidden="true">
                <TelegramIcon />
              </span>
              <span className={styles.buttonText}>Telegram Support</span>
              <span className={styles.buttonArrow} aria-hidden="true">
                ›
              </span>
              <span className={styles.buttonShine} aria-hidden="true" />
              <span className={styles.buttonSpark} aria-hidden="true">
                ✦
              </span>
            </MetaPixelEventLink>
          </div>

          <p className={styles.note}>✦ Fast response · Product details · Order support ✦</p>
        </section>

        <div className={styles.divider} aria-hidden="true">
          <span>C</span>
        </div>
        <Link className={styles.shopLink} href="/category/new-in">
          Explore CNFans UK <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 4.5c-6.3 0-11.4 5-11.4 11.2 0 2 .5 3.9 1.5 5.6l-1.6 6.2 6.4-1.7c1.6.9 3.4 1.3 5.2 1.3 6.3 0 11.4-5 11.4-11.2C27.4 9.5 22.3 4.5 16 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M11.1 10.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7-.5.6c-.2.2-.3.4-.1.7.8 1.4 2 2.6 3.4 3.3.3.2.5.1.7-.1l1-1.2c.2-.3.4-.3.7-.2l2 1c.3.1.5.2.5.4 0 .6-.3 1.3-.7 1.7-.5.5-1.2.8-1.9.8-.6 0-1.3-.2-2.2-.5-3.3-1.3-5.8-3.9-7-7.1-.3-1-.1-2 .5-2.7Z" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="m5.2 15.2 20.6-8c1-.4 1.7.4 1.4 1.7l-3.5 16.2c-.3 1.2-1.2 1.5-2.2.8l-5.3-3.9-2.6 2.5c-.3.3-.6.6-1.1.6l.4-5.5L23 10.5c.4-.4-.1-.6-.7-.2L9.8 18.2l-5.4-1.7c-1.2-.4-1.2-1.2.8-1.9v.6Z" fill="currentColor" />
    </svg>
  );
}
