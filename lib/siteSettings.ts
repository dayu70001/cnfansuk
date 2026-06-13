import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

export type SiteSettings = {
  links: {
    whatsappChannelUrl: string;
    telegramChannelUrl: string;
    instagramUrl: string;
    facebookUrl: string;
    personalWhatsappUrl: string;
    personalWhatsappNumber: string;
    personalTelegramUrl: string;
    personalTelegramUsername: string;
  };
  homepage: {
    heroMainImageUrl: string;
    heroMainImageFit: "cover" | "contain";
    heroMainImagePosition: string;
    categories: {
      key: string;
      title: string;
      subtitle: string;
      imageUrl: string;
      imageFit: "cover" | "contain";
      imagePosition: string;
      href: string;
    }[];
    apparelEdit: {
      title: string;
      subtitle: string;
      imageUrl: string;
      imageFit: "cover" | "contain";
      imagePosition: string;
      buttonText: string;
      buttonHref: string;
    };
    latestDrops: {
      imageUrl: string;
      href: string;
      label?: string;
      imageFit: "cover" | "contain";
      imagePosition: string;
    }[];
  };
};

const settingsPath = join(process.cwd(), "data", "site-settings.json");

export const defaultSiteSettings: SiteSettings = {
  links: {
    whatsappChannelUrl: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL || "https://whatsapp.com/channel/PLACEHOLDER",
    telegramChannelUrl: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL || "https://t.me/PLACEHOLDER",
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM || "https://instagram.com/PLACEHOLDER",
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK || "https://facebook.com/PLACEHOLDER",
    personalWhatsappUrl: "",
    personalWhatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    personalTelegramUrl: "",
    personalTelegramUsername: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "",
  },
  homepage: {
    heroMainImageUrl: "",
    heroMainImageFit: "cover",
    heroMainImagePosition: "center center",
    categories: [
      {
        key: "hoodies",
        title: "Hoodies",
        subtitle: "Soft layers for everyday wear.",
        imageUrl: "",
        imageFit: "cover",
        imagePosition: "70% center",
        href: "/category/hoodies",
      },
      {
        key: "tracksuits",
        title: "Tracksuits",
        subtitle: "Matching sets for clean daily styling.",
        imageUrl: "",
        imageFit: "cover",
        imagePosition: "center center",
        href: "/category/tracksuits",
      },
      {
        key: "jackets",
        title: "Jackets",
        subtitle: "Outer layers for cooler days.",
        imageUrl: "",
        imageFit: "cover",
        imagePosition: "60% center",
        href: "/category/jackets",
      },
      {
        key: "trousers",
        title: "Trousers",
        subtitle: "Easy bottoms for daily rotation.",
        imageUrl: "",
        imageFit: "cover",
        imagePosition: "center bottom",
        href: "/category/jeans-trousers",
      },
    ],
    apparelEdit: {
      title: "Clean layers,\neveryday pieces.",
      subtitle:
        "Clean layers, relaxed fits and everyday pieces — colours that sit easily together and shapes built to be worn on repeat.",
      imageUrl: "",
      imageFit: "cover",
      imagePosition: "center center",
      buttonText: "Shop the edit",
      buttonHref: "/category/new-in",
    },
    latestDrops: Array.from({ length: 6 }, (_, index) => ({
      imageUrl: "",
      href: "/category/new-in",
      label: `Latest fit ${index + 1}`,
      imageFit: "cover" as const,
      imagePosition: "center center",
    })),
  },
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function withFallback(value: unknown, fallback: string) {
  return text(value) || fallback;
}

function imageFit(value: unknown, fallback: "cover" | "contain") {
  return value === "contain" ? "contain" : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function sanitizeSiteSettings(input: unknown): SiteSettings {
  const source = record(input);
  const links = record(source.links);
  const homepage = record(source.homepage);
  const apparelEdit = record(homepage.apparelEdit);
  const sourceCategories = Array.isArray(homepage.categories) ? homepage.categories : [];
  const sourceDrops = Array.isArray(homepage.latestDrops) ? homepage.latestDrops : [];

  return {
    links: {
      whatsappChannelUrl: withFallback(links.whatsappChannelUrl, defaultSiteSettings.links.whatsappChannelUrl),
      telegramChannelUrl: withFallback(links.telegramChannelUrl, defaultSiteSettings.links.telegramChannelUrl),
      instagramUrl: withFallback(links.instagramUrl, defaultSiteSettings.links.instagramUrl),
      facebookUrl: withFallback(links.facebookUrl, defaultSiteSettings.links.facebookUrl),
      personalWhatsappUrl: text(links.personalWhatsappUrl),
      personalWhatsappNumber: withFallback(links.personalWhatsappNumber, defaultSiteSettings.links.personalWhatsappNumber),
      personalTelegramUrl: text(links.personalTelegramUrl),
      personalTelegramUsername: withFallback(links.personalTelegramUsername, defaultSiteSettings.links.personalTelegramUsername),
    },
    homepage: {
      heroMainImageUrl: text(homepage.heroMainImageUrl),
      heroMainImageFit: imageFit(homepage.heroMainImageFit, defaultSiteSettings.homepage.heroMainImageFit),
      heroMainImagePosition: withFallback(homepage.heroMainImagePosition, defaultSiteSettings.homepage.heroMainImagePosition),
      categories: defaultSiteSettings.homepage.categories.map((fallback, index) => {
        const item = record(sourceCategories[index]);
        return {
          key: fallback.key,
          title: withFallback(item.title, fallback.title),
          subtitle: withFallback(item.subtitle, fallback.subtitle),
          imageUrl: text(item.imageUrl),
          imageFit: imageFit(item.imageFit, fallback.imageFit),
          imagePosition: withFallback(item.imagePosition, fallback.imagePosition),
          href: withFallback(item.href, fallback.href),
        };
      }),
      apparelEdit: {
        title: withFallback(apparelEdit.title, defaultSiteSettings.homepage.apparelEdit.title),
        subtitle: withFallback(apparelEdit.subtitle, defaultSiteSettings.homepage.apparelEdit.subtitle),
        imageUrl: text(apparelEdit.imageUrl),
        imageFit: imageFit(apparelEdit.imageFit, defaultSiteSettings.homepage.apparelEdit.imageFit),
        imagePosition: withFallback(apparelEdit.imagePosition, defaultSiteSettings.homepage.apparelEdit.imagePosition),
        buttonText: withFallback(apparelEdit.buttonText, defaultSiteSettings.homepage.apparelEdit.buttonText),
        buttonHref: withFallback(apparelEdit.buttonHref, defaultSiteSettings.homepage.apparelEdit.buttonHref),
      },
      latestDrops: defaultSiteSettings.homepage.latestDrops.map((fallback, index) => {
        const item = record(sourceDrops[index]);
        return {
          imageUrl: text(item.imageUrl),
          href: withFallback(item.href, fallback.href),
          label: withFallback(item.label, fallback.label || `Latest fit ${index + 1}`),
          imageFit: imageFit(item.imageFit, fallback.imageFit),
          imagePosition: withFallback(item.imagePosition, fallback.imagePosition),
        };
      }),
    },
  };
}

export function readSiteSettings(): SiteSettings {
  if (!existsSync(settingsPath)) {
    return defaultSiteSettings;
  }

  try {
    return sanitizeSiteSettings(JSON.parse(readFileSync(settingsPath, "utf8")));
  } catch {
    return defaultSiteSettings;
  }
}

export function writeSiteSettings(settings: SiteSettings) {
  const nextSettings = sanitizeSiteSettings(settings);
  if (!existsSync(dirname(settingsPath))) {
    throw new Error("Settings data directory is missing.");
  }
  writeFileSync(settingsPath, `${JSON.stringify(nextSettings, null, 2)}\n`, "utf8");
  return nextSettings;
}
