import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { MetaPixelEventLink } from "@/components/MetaPixelEventLink";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { products } from "@/data/products";
import { fetchCatalogProducts } from "@/lib/catalogApi";
import { fetchSiteSettings } from "@/lib/siteSettings";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

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
  const { categoryImages, homeChannelImages, homeEditImage, homeHeroImage } = homepage;
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

      <section>
        <div className="wrap">
          <div className="ig-head">
          <span className="eyebrow">Follow CNFans UK</span>
          <h2>Latest fits & drops</h2>
          <p>New arrivals, outfit updates and product drops are shared through our official channels.</p>
          </div>
          <div className="ig-grid" aria-label="Latest drops grid">
            {homeChannelImages.map((drop, index) => (
              <div className="ig-tile" key={index} aria-label={drop.label}>
                <span className={`ig-fill ig${index + 1}`}>
                  {drop.imageUrl ? (
                    <img
                      className="home-image"
                      src={drop.imageUrl}
                      alt={drop.label || `Latest fit ${index + 1}`}
                      data-home-visual={`homeChannelImages.${index}`}
                      style={imageStyle(drop.imageFit, drop.imagePosition)}
                    />
                  ) : null}
                </span>
              </div>
            ))}
          </div>
          <div className="ig-cta">
            <MetaPixelEventLink
              className="channel-link"
              href={links.whatsappChannelUrl}
              target="_blank"
              rel="noreferrer"
              eventName="Contact"
              eventParams={{ contact_channel: "whatsapp", source: "homepage_channel" }}
            >
              <WhatsAppIcon />
              WhatsApp Channel
            </MetaPixelEventLink>
            <MetaPixelEventLink
              className="channel-link"
              href={links.telegramChannelUrl}
              target="_blank"
              rel="noreferrer"
              eventName="Contact"
              eventParams={{ contact_channel: "telegram", source: "homepage_channel" }}
            >
              <TelegramIcon />
              Telegram Channel
            </MetaPixelEventLink>
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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.52 15.27L2 22l4.86-1.27A10 10 0 1 0 12 2Zm0 18.13a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-2.88.76.77-2.81-.19-.29A8.13 8.13 0 1 1 12 20.13Zm4.46-6.09c-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.24-.01-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2.01 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.27 18.6 19.78c-.25 1.1-.9 1.37-1.83.85l-5.04-3.72-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.13 9.34-8.44c.4-.36-.09-.56-.63-.2L5.5 13.07l-4.96-1.55c-1.08-.33-1.1-1.07.23-1.59L20.48 2.4c.9-.33 1.69.21 1.42 1.87Z" />
    </svg>
  );
}
