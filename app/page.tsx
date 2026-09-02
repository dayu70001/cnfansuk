import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { products } from "@/data/products";
import { fetchCatalogProducts } from "@/lib/catalogApi";
import { getDirectTelegramLinkFromSettings, getDirectWhatsappLinkFromSettings } from "@/lib/contactLinks";
import { fetchSiteSettings } from "@/lib/siteSettings";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

const HOME_TITLE = `${SITE_NAME} | Everyday Apparel, Hoodies, Jackets & Sets`;
const HOME_DESCRIPTION =
  "Shop everyday apparel from CNFans UK, including hoodies, jackets, trousers, tops and matching sets. Source-direct clothing with UK and Europe delivery support.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default async function Home() {
  const settings = await fetchSiteSettings();
  const { homepage, links } = settings;
  const { categoryImages, homeEditImage, homeHeroImage } = homepage;
  const personalWhatsappUrl = getDirectWhatsappLinkFromSettings(settings);
  const personalTelegramUrl = getDirectTelegramLinkFromSettings(settings);
  const catalogProducts = await fetchCatalogProducts({ limit: 24 });
  const displayProducts = catalogProducts ?? products;
  const newIn = displayProducts.filter((product) => product.newIn).slice(0, 10);

  // Organization + WebSite structured data. sameAs only uses real public
  // social links from site settings; placeholders are filtered out. No brand
  // names are placed in Organization schema.
  const sameAs = [
    links.instagramUrl,
    links.facebookUrl,
    links.whatsappChannelUrl,
    links.telegramChannelUrl,
  ].filter((url) => url && !url.includes("PLACEHOLDER"));
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    ...(sameAs.length ? { sameAs } : {}),
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
  const categoryTones = ["forest", "navy", "stone", "charcoal"];
  const homeCategoryCards = [
    {
      title: "Outerwear",
      subtitle: "Jackets, overshirts and coats for clean city layering.",
      href: "/category/outerwear",
    },
    {
      title: "Tops",
      subtitle: "Hoodies, tees and shirts for your everyday rotation.",
      href: "/category/tops",
    },
    {
      title: "Bottoms",
      subtitle: "Relaxed denim, trousers and shorts cut for everyday wear.",
      href: "/category/bottoms",
    },
    {
      title: "Co-ords & Sets",
      subtitle: "Tracksuits and matching sets made for effortless styling.",
      href: "/category/co-ords-sets",
    },
  ];

  function imageStyle(imageFit: "cover" | "contain", imagePosition: string): CSSProperties {
    return {
      objectFit: imageFit,
      objectPosition: imagePosition || "center center",
    };
  }

  return (
    <>
      <JsonLd data={orgSchema} />
      <JsonLd data={websiteSchema} />
      <div className="wrap">
        <section className="hero">
          <div className="hero-text">
            <span className="eyebrow">CNFans UK Apparel</span>
            <h1>Clean everyday clothing, sourced closer to production.</h1>
            <p className="hero-sub">CNFans UK brings together hoodies, jackets, trousers and matching sets through a simpler route from production to customer.</p>
            <p className="hero-meta">OUTERWEAR · TOPS · BOTTOMS · CO-ORDS & SETS</p>
            <div className="hero-actions">
              <Link className="btn btn-solid" href="/category/new-in">
                Shop New In
              </Link>
              <Link className="link-arrow" href="#categories">
                Explore Categories <span>→</span>
              </Link>
            </div>
          </div>
          <div
            className={homeHeroImage.imageUrl ? "hero-img has-image" : "hero-img"}
          >
            {homeHeroImage.imageUrl ? (
              <img
                className="home-image"
                src={homeHeroImage.imageUrl}
                alt={homeHeroImage.label || "CNFans UK apparel edit"}
                data-home-visual="homeHeroImage"
                style={imageStyle(homeHeroImage.imageFit, homeHeroImage.imagePosition)}
              />
            ) : null}
            <div className="hero-collage-main">
              <span className="hero-garment hero-garment-1" />
            </div>
            <div className="hero-collage-side">
              <span className="hero-garment hero-garment-2" />
            </div>
            <div className="hero-collage-small">
              <span className="hero-garment hero-garment-3" />
            </div>
            <span className="ph-label">Apparel edit</span>
          </div>
        </section>
      </div>

      <div className="service" aria-label="CNFans UK service notes">
        <div className="wrap">
          <span>Size support before ordering</span>
          <span>New arrivals released in batches</span>
          <span>Official updates through our channels</span>
        </div>
      </div>

      <section id="categories">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow sec-head-label">Browse</span>
              <h2>Shop by category</h2>
            </div>
          </div>
          <div className="cat-rail">
            {homeCategoryCards.map((card, index) => {
              const imageSlot = categoryImages[index];
              return (
              <Link className="cat-card" href={card.href} key={card.href}>
                <div className="frame">
                  <div className={`cat-fill tone-${categoryTones[index] || "stone"}`}>
                    {imageSlot?.imageUrl ? (
                      <img
                        className="home-image"
                        src={imageSlot.imageUrl}
                        alt={imageSlot.label || card.title}
                        data-home-visual={`categoryImages.${index}`}
                        style={imageStyle(imageSlot.imageFit, imageSlot.imagePosition)}
                      />
                    ) : null}
                  </div>
                </div>
                <span className="name">{card.title}</span>
                <span className="cat-sub">{card.subtitle}</span>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="new" className="new-section">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow sec-head-label">Just landed</span>
              <h2>New in</h2>
            </div>
            <Link className="view-all" href="/category/new-in">
              Shop new in
            </Link>
          </div>
          <div className="prod-grid">
            {newIn.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="featured">
        <div className="wrap">
          <div className="feat-grid">
            <div
              className={homeEditImage.imageUrl ? "feat-img has-image" : "feat-img"}
            >
              {homeEditImage.imageUrl ? (
                <img
                  className="home-image"
                  src={homeEditImage.imageUrl}
                  alt={homeEditImage.label || "Lookbook styling"}
                  data-home-visual="homeEditImage"
                  style={imageStyle(homeEditImage.imageFit, homeEditImage.imagePosition)}
                />
              ) : null}
              <span className="ph-label">Lookbook · styling</span>
            </div>
            <div className="feat-text">
              <span className="eyebrow">The edit</span>
              <h3>Built for the week, made to repeat.</h3>
              <p>Clean layers, relaxed fits and everyday pieces designed to move through workdays, weekends and travel.</p>
              <Link className="btn btn-solid" href={homepage.apparelEdit.buttonHref}>
                {homepage.apparelEdit.buttonText}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-support" aria-labelledby="home-support-title">
        <div className="wrap">
          <div className="home-support-head">
            <span className="eyebrow">Before You Order</span>
            <h2 id="home-support-title">Need A Closer Look?</h2>
            <p>
              Ask for photos, colours, stock or delivery details before ordering.
              <br />
              Follow new arrivals and restocks through our official channels.
            </p>
          </div>
          <div className="home-support-panels">
            <article className="home-support-panel">
              <h3>Personal Support</h3>
              <p>Photos, colours, stock and delivery details.</p>
              <div className="home-support-links">
                <MetaPixelEventLink
                  className="home-support-link"
                  href={personalWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  eventName="ContactWhatsApp"
                  eventParams={{
                    source_page: "home",
                    placement: "homepage_personal_support",
                    button_label: "WhatsApp",
                    destination: "whatsapp_personal",
                  }}
                >
                  WhatsApp
                </MetaPixelEventLink>
                <MetaPixelEventLink
                  className="home-support-link"
                  href={personalTelegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  eventName="ContactTelegram"
                  eventParams={{
                    source_page: "home",
                    placement: "homepage_personal_support",
                    button_label: "Telegram",
                    destination: "telegram_personal",
                  }}
                >
                  Telegram
                </MetaPixelEventLink>
              </div>
            </article>
            <article className="home-support-panel">
              <h3>New Arrival Channels</h3>
              <p>Follow new arrivals and restocks in our channels.</p>
              <div className="home-support-links">
                <MetaPixelEventLink
                  className="home-support-link"
                  href={links.whatsappChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  eventName="JoinWhatsAppChannel"
                  eventParams={{
                    source_page: "home",
                    placement: "homepage_new_arrival_channels",
                    button_label: "WhatsApp Channel",
                    destination: "whatsapp_channel",
                  }}
                >
                  WhatsApp Channel
                </MetaPixelEventLink>
                <MetaPixelEventLink
                  className="home-support-link"
                  href={links.telegramChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  eventName="JoinTelegramChannel"
                  eventParams={{
                    source_page: "home",
                    placement: "homepage_new_arrival_channels",
                    button_label: "Telegram Channel",
                    destination: "telegram_channel",
                  }}
                >
                  Telegram Channel
                </MetaPixelEventLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="standard">
        <div className="wrap standard-grid">
          <div className="std-intro">
            <span className="std-kicker">Why CNFans UK</span>
            <h2>Practical everyday clothing with a simpler sourcing route.</h2>
            <p>CNFans UK is built around production experience, useful wardrobe pieces and a cleaner path from production to customer.</p>
          </div>
          <div className="std-card-grid">
            <div className="std-item">
              <h4>Production Background</h4>
              <p>Built by a Guangzhou-based clothing team with real garment-making experience.</p>
            </div>
            <div className="std-item">
              <h4>Practical Wardrobe Pieces</h4>
              <p>Hoodies, jackets, trousers and sets selected for repeat daily wear.</p>
            </div>
            <div className="std-item">
              <h4>Simpler Sourcing Route</h4>
              <p>A cleaner route from production to customer, with fewer unnecessary layers.</p>
            </div>
            <div className="std-item">
              <h4>Order Support</h4>
              <p>Get help with sizing, order details and delivery updates when needed.</p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
