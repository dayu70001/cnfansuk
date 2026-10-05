"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import styles from "@/app/channel/channel.module.css";

const apparelPhotos = [
  { src: "/channel/apparel-01.jpg", alt: "Apparel 1" },
  { src: "/channel/apparel-02.jpg", alt: "Apparel 2" },
  { src: "/channel/apparel-03.jpg", alt: "Apparel 3" },
  { src: "/channel/apparel-04.jpg", alt: "Apparel 4" },
  { src: "/channel/apparel-05.jpg", alt: "Apparel 5" },
];

const operations = [
  { src: "/channel/preparation.jpg", label: "Preparation" },
  { src: "/channel/sorting.jpg", label: "Sorting" },
  { src: "/channel/packing.jpg", label: "Packing" },
  { src: "/channel/dispatch.jpg", label: "Dispatch" },
];

const paymentUpdates = [
  { src: "/channel/payment-01.jpg", alt: "Payment 1" },
  { src: "/channel/payment-02.webp", alt: "Payment 2" },
  { src: "/channel/payment-03.webp", alt: "Payment 3" },
  { src: "/channel/payment-04.jpg", alt: "Payment 4" },
  { src: "/channel/payment-05.jpg", alt: "Payment 5" },
  { src: "/channel/payment-06.jpg", alt: "Payment 6" },
];

const reviews = [
  {
    quote:
      "Really pleased with the fit. I asked about sizing before ordering and the advice was helpful.",
    location: "London",
  },
  {
    quote: "Good selection and easy to keep up with new arrivals through the channel.",
    location: "Manchester",
  },
  {
    quote: "The order arrived well packed and the quality was as expected. Happy with everything.",
    location: "Birmingham",
  },
];

export default function ChannelLandingPage() {
  const [activePhoto, setActivePhoto] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % apparelPhotos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.screenX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const distance = touchStartX.current - (event.changedTouches[0]?.screenX ?? touchStartX.current);
    touchStartX.current = null;
    if (Math.abs(distance) > 40) {
      setActivePhoto((current) => (current + (distance > 0 ? 1 : -1) + apparelPhotos.length) % apparelPhotos.length);
    }
  }

  return (
    <>
      <section className={styles.channelHero}>
        <div className={styles.channelHeroBrand}>
          CNFans UK
        </div>
        <h1 className={styles.channelHeroTitle}>The CNFans Clothing Collection</h1>
        <p className={styles.channelHeroDescription}>
          Discover hoodies, jackets, tops, trousers, sets and more, with new styles added regularly.
        </p>
        <div className={styles.channelHeroTags}>
          <span>Everyday Apparel · New Arrivals · Product Updates</span>
        </div>
      </section>

      <section className={styles.channelSection}>
        <h2 className={styles.channelSectionLabel}>Latest Clothing</h2>
        <div className={styles.channelCarouselWrap}>
          <div
            className={styles.channelCarouselTrack}
            style={{ transform: `translateX(-${activePhoto * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-roledescription="carousel"
            aria-label="Latest clothing"
          >
            {apparelPhotos.map((photo, index) => (
              <div className={styles.channelCarouselSlide} key={photo.src} aria-hidden={index !== activePhoto}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1080}
                  height={1439}
                  unoptimized
                  priority={index === 0}
                  className={styles.channelImage}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.channelCarouselDots} aria-label="Choose a clothing photo">
          {apparelPhotos.map((photo, index) => (
            <button
              aria-label={`Show apparel photo ${index + 1}`}
              aria-current={index === activePhoto ? "true" : undefined}
              className={`${styles.channelCarouselDot}${index === activePhoto ? ` ${styles.channelCarouselDotActive}` : ""}`}
              key={photo.src}
              onClick={() => setActivePhoto(index)}
              type="button"
            />
          ))}
        </div>
        <p className={styles.channelCarouselHint}>
          Explore recent styles across everyday essentials, outerwear and matching sets.
        </p>
        <div className={styles.channelCarouselTags}>Outerwear · Tops · Bottoms · Co-ords &amp; Sets</div>
      </section>

      <section className={styles.channelSection}>
        <h2 className={styles.channelSectionLabel}>Official Channels</h2>
        <div className={styles.channelCtaButtons}>
          <MetaPixelEventLink
            className={styles.channelCtaButton}
            href="https://whatsapp.com/channel/0029Vb7eg1jDZ4LU1XMbt630"
            target="_blank"
            rel="noopener noreferrer"
            eventName="click_whatsapp_channel"
          >
            <span className={styles.channelIcon} aria-hidden="true">
              <WhatsAppIcon />
            </span>
            <span className={styles.channelCtaLabel}>WhatsApp Channel</span>
          </MetaPixelEventLink>
          <MetaPixelEventLink
            className={styles.channelCtaButton}
            href="https://t.me/cnfansu"
            target="_blank"
            rel="noopener noreferrer"
            eventName="click_telegram_channel"
          >
            <span className={styles.channelIcon} aria-hidden="true">
              <TelegramIcon />
            </span>
            <span className={styles.channelCtaLabel}>Telegram Channel</span>
          </MetaPixelEventLink>
        </div>
      </section>

      <section className={styles.channelSection}>
        <h2 className={styles.channelSectionLabel}>About CNFans UK</h2>
        <div className={styles.channelAboutText}>
          <p>
            CNFans UK is a Guangzhou-based clothing team focused on practical everyday apparel. We work closer to
            production to keep the buying process straightforward, with regular updates across outerwear, tops,
            bottoms and matching sets.
          </p>
          <p>
            Our focus is simple: clear product information, regularly updated styles and a more direct route from
            production to customer.
          </p>
        </div>
      </section>

      <section className={styles.channelSection}>
        <h2 className={styles.channelSectionLabel}>Operations &amp; Dispatch</h2>
        <div className={styles.channelOperationsGrid}>
          {operations.map((item) => (
            <div key={item.label}>
              <div className={styles.channelOperationsItem}>
                <Image
                  src={item.src}
                  alt={item.label}
                  width={1080}
                  height={1439}
                  unoptimized
                  loading="lazy"
                  className={styles.channelImage}
                />
              </div>
              <div className={styles.channelOperationsLabel}>{item.label}</div>
            </div>
          ))}
        </div>
        <p className={styles.channelOperationsNote}>
          Real order preparation, packing and dispatch updates from our team.
        </p>
      </section>

      <section className={styles.channelSection}>
        <h2 className={styles.channelSectionLabel}>Customer Orders &amp; Updates</h2>
        <div className={styles.channelPaymentScroll}>
          {paymentUpdates.map((item, index) => {
            const dimensions = index === 1 ? { width: 828, height: 1614 } : { width: 1080, height: index === 3 ? 2095 : index === 4 ? 2074 : index === 5 ? 2059 : 2065 };
            return (
              <div className={styles.channelPaymentCard} key={item.src}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={dimensions.width}
                  height={dimensions.height}
                  unoptimized
                  loading="lazy"
                  className={styles.channelImage}
                />
              </div>
            );
          })}
        </div>
        <p className={styles.channelPaymentNote}>
          A look at real order preparation, delivery updates and customer purchases.
        </p>
      </section>

      <section className={styles.channelSection}>
        <h2 className={styles.channelSectionLabel}>Customer Orders &amp; Feedback</h2>
        {reviews.map((review) => (
          <article className={styles.channelReviewCard} key={review.location}>
            <div className={styles.channelReviewStars} aria-label="5 out of 5 stars">★★★★★</div>
            <p className={styles.channelReviewQuote}>{review.quote}</p>
            <p className={styles.channelReviewAuthor}>🇬🇧 UK Customer · {review.location}</p>
          </article>
        ))}
      </section>

      <div className={styles.channelFooter}>
        <div className={styles.channelFooterBrand}>CNFans UK</div>
        <p className={styles.channelFooterTagline}>
          Everyday apparel with practical fits and a simpler sourcing route.
        </p>
        <div className={styles.channelFooterLinks}>
          <a href="#">Imprint</a>&nbsp;·&nbsp;<a href="#">Privacy</a>&nbsp;·&nbsp;<a href="#">Terms</a>
        </div>
      </div>
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.363z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.169.339.015.104.034.34.019.524z" />
    </svg>
  );
}
