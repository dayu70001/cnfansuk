import type { Metadata } from "next";
import Link from "next/link";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { fetchSiteSettings } from "@/lib/siteSettings";
import styles from "./connect.module.css";

const title = `${SITE_NAME} — Official Contact`;
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
  // Use the configured personal accounts without an automatic message. The
  // visitor can start their own conversation from the contact app.
  const whatsappUrl = withoutPrefilledText(
    settings.links.personalWhatsappUrl || `https://wa.me/${settings.links.personalWhatsappNumber}`,
  );
  const telegramUrl = withoutPrefilledText(
    settings.links.personalTelegramUrl || `https://t.me/${settings.links.personalTelegramUsername.replace(/^@/, "")}`,
  );

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <div className={styles.avatarWrap}>
          <img className={styles.avatar} src="/connect-logo.png" alt="CNFans UK" />
        </div>

        <h1>CNFans UK</h1>
        <p className={styles.kicker}>Official Personal Contact</p>
        <p className={styles.intro}>Questions about products, sizing, prices or orders? Contact us directly.</p>

        <div className={styles.links} aria-label="Contact CNFans UK">
          <MetaPixelEventLink
            className={`${styles.link} ${styles.whatsapp}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            eventName="ContactWhatsApp"
            eventParams={{
              source_page: "connect",
              placement: "connect_whatsapp",
              button_label: "WhatsApp",
              destination: "whatsapp_personal",
            }}
          >
            <span className={styles.icon} aria-hidden="true"><WhatsAppIcon /></span>
            <span className={styles.text}>
              <span className={styles.name}>WhatsApp</span>
              <span className={styles.desc}>Chat with us directly</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </MetaPixelEventLink>

          <MetaPixelEventLink
            className={`${styles.link} ${styles.telegram}`}
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            eventName="ContactTelegram"
            eventParams={{
              source_page: "connect",
              placement: "connect_telegram",
              button_label: "Telegram",
              destination: "telegram_personal",
            }}
          >
            <span className={styles.icon} aria-hidden="true"><TelegramIcon /></span>
            <span className={styles.text}>
              <span className={styles.name}>Telegram</span>
              <span className={styles.desc}>Chat with us directly</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </MetaPixelEventLink>
        </div>

        <p className={styles.supportLine}>
          Product questions <span>·</span> Size guidance <span>·</span> Order support
        </p>

        <div className={styles.storeWrap}>
          <Link className={styles.storeLink} href="/">
            Explore CNFans UK <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className={styles.footer}>CNFans UK · Official Contact</p>
      </main>
    </div>
  );
}

function withoutPrefilledText(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("text");
    return parsed.toString();
  } catch {
    return url;
  }
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" fill="#25D366" />
      <path d="M11.1 10.7c.3-.7.6-.7 1-.7h.7c.2 0 .5.1.6.5l1 2.5c.1.3.1.6-.1.9l-.8 1c-.2.2-.2.4-.1.6.7 1.5 1.9 2.7 3.4 3.4.2.1.4.1.6-.1l1-.8c.3-.2.6-.3.9-.1l2.4 1.1c.4.2.5.4.5.7v.7c0 .4-.1.7-.7 1-1 .5-2.3.7-3.8.2-2.1-.6-4.2-2.2-5.9-4.3-1.3-1.6-2.1-3.4-2.1-4.9 0-.8.2-1.4.4-1.7z" fill="white" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" fill="#229ED9" />
      <path d="M8.6 15.5 22.3 10c.6-.2 1.1.1.9.9l-2.3 10.8c-.2.8-.7 1-1.3.6l-3.5-2.6-1.7 1.6c-.2.2-.3.3-.7.3l.3-3.6 6.5-5.9c.3-.3-.1-.4-.4-.2l-8 5-3.5-1.1c-.8-.3-.8-.8 0-1.1z" fill="white" />
    </svg>
  );
}
