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
    homeHeroImage: HomepageImage;
    homeEditImage: HomepageImage;
    homeChannelImages: HomepageImage[];
    categoryImages: HomepageImage[];
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

export type HomepageImage = {
  imageUrl: string;
  imageFit: "cover" | "contain";
  imagePosition: string;
  label?: string;
};

const fixedHomeVisuals = {
  homeHeroImage: {
    imageUrl: "https://taplink.st/p/d/a/8/5/70249982.jpg?0",
    imageFit: "cover" as const,
    imagePosition: "center center",
    label: "CNFans UK apparel edit",
  },
  homeEditImage: {
    imageUrl: "https://taplink.st/p/c/3/2/7/70249984.jpg?0",
    imageFit: "cover" as const,
    imagePosition: "center center",
    label: "Lookbook styling",
  },
  homeChannelImages: [
    "https://taplink.st/p/f/9/3/e/70226926.jpg?0",
    "https://taplink.st/p/c/b/c/d/70226923.jpg?0",
    "https://taplink.st/p/3/d/f/4/70249985.jpg?0",
    "https://taplink.st/p/1/7/7/e/70249986.jpg?0",
    "https://taplink.st/p/7/d/e/5/70249987.jpg?0",
    "https://taplink.st/p/f/3/d/7/70249988.jpg?0",
  ].map((imageUrl, index) => ({
    imageUrl,
    imageFit: "cover" as const,
    imagePosition: "center center",
    label: `Latest fit ${index + 1}`,
  })),
  categoryImages: [
    {
      imageUrl: "https://taplink.st/p/e/2/4/9/70226617.jpg?3",
      imageFit: "cover" as const,
      imagePosition: "70% center",
      label: "Outerwear",
    },
    {
      imageUrl: "https://taplink.st/p/2/2/4/0/70226615.jpg?9",
      imageFit: "cover" as const,
      imagePosition: "center center",
      label: "Tops",
    },
    {
      imageUrl: "https://taplink.st/p/a/1/8/8/70226769.jpg?2",
      imageFit: "cover" as const,
      imagePosition: "60% center",
      label: "Bottoms",
    },
    {
      imageUrl: "https://taplink.st/p/e/1/b/9/70226771.jpg?2",
      imageFit: "cover" as const,
      imagePosition: "center bottom",
      label: "Co-ords & Sets",
    },
  ],
};

export const defaultSiteSettings: SiteSettings = {
  links: {
    whatsappChannelUrl: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL || "https://whatsapp.com/channel/0029VbCaLkaGpLHHrhnDip3N",
    telegramChannelUrl: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL || "https://t.me/liusnning",
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM || "https://instagram.com/PLACEHOLDER",
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK || "https://facebook.com/PLACEHOLDER",
    personalWhatsappUrl: "https://api.whatsapp.com/send?phone=41799182999",
    personalWhatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "41799182999",
    personalTelegramUrl: "https://t.me/kunkunyu0",
    personalTelegramUsername: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "@kunkunyu0",
  },
  homepage: {
    ...fixedHomeVisuals,
    heroMainImageUrl: "https://taplink.st/p/d/a/8/5/70249982.jpg?0",
    heroMainImageFit: "cover",
    heroMainImagePosition: "center center",
    categories: [
      {
        key: "hoodies",
        title: "Hoodies",
        subtitle: "Soft layers for everyday wear.",
        imageUrl: "https://taplink.st/p/e/2/4/9/70226617.jpg?3",
        imageFit: "cover",
        imagePosition: "70% center",
        href: "/category/hoodies",
      },
      {
        key: "tracksuits",
        title: "Tracksuits",
        subtitle: "Matching sets for clean daily styling.",
        imageUrl: "https://taplink.st/p/2/2/4/0/70226615.jpg?9",
        imageFit: "cover",
        imagePosition: "center center",
        href: "/category/tracksuits",
      },
      {
        key: "jackets",
        title: "Jackets",
        subtitle: "Outer layers for cooler days.",
        imageUrl: "https://taplink.st/p/a/1/8/8/70226769.jpg?2",
        imageFit: "cover",
        imagePosition: "60% center",
        href: "/category/jackets",
      },
      {
        key: "trousers",
        title: "Trousers",
        subtitle: "Easy bottoms for daily rotation.",
        imageUrl: "https://taplink.st/p/e/1/b/9/70226771.jpg?2",
        imageFit: "cover",
        imagePosition: "center bottom",
        href: "/category/jeans-trousers",
      },
    ],
    apparelEdit: {
      title: "Clean layers,\neveryday pieces.",
      subtitle:
        "Clean layers, relaxed fits and everyday pieces — colours that sit easily together and shapes built to be worn on repeat.",
      imageUrl: "https://taplink.st/p/c/3/2/7/70249984.jpg?0",
      imageFit: "cover",
      imagePosition: "center center",
      buttonText: "Shop the edit",
      buttonHref: "/category/new-in",
    },
    latestDrops: [
      {
        imageUrl: "https://taplink.st/p/f/9/3/e/70226926.jpg?0",
        href: "/category/new-in",
        label: "Latest fit 1",
        imageFit: "cover" as const,
        imagePosition: "center center",
      },
      {
        imageUrl: "https://taplink.st/p/c/b/c/d/70226923.jpg?0",
        href: "/category/new-in",
        label: "Latest fit 2",
        imageFit: "cover" as const,
        imagePosition: "center center",
      },
      {
        imageUrl: "https://taplink.st/p/3/d/f/4/70249985.jpg?0",
        href: "/category/new-in",
        label: "Latest fit 3",
        imageFit: "cover" as const,
        imagePosition: "center center",
      },
      {
        imageUrl: "https://taplink.st/p/1/7/7/e/70249986.jpg?0",
        href: "/category/new-in",
        label: "Latest fit 4",
        imageFit: "cover" as const,
        imagePosition: "center center",
      },
      {
        imageUrl: "https://taplink.st/p/7/d/e/5/70249987.jpg?0",
        href: "/category/new-in",
        label: "Latest fit 5",
        imageFit: "cover" as const,
        imagePosition: "center center",
      },
      {
        imageUrl: "https://taplink.st/p/f/3/d/7/70249988.jpg?0",
        href: "/category/new-in",
        label: "Latest fit 6",
        imageFit: "cover" as const,
        imagePosition: "center center",
      },
    ],
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

function imageRecord(value: unknown, fallback: HomepageImage): HomepageImage {
  const item = record(value);
  return {
    imageUrl: withFallback(item.imageUrl, fallback.imageUrl),
    imageFit: imageFit(item.imageFit, fallback.imageFit),
    imagePosition: withFallback(item.imagePosition, fallback.imagePosition),
    label: withFallback(item.label, fallback.label || ""),
  };
}

export function sanitizeSiteSettings(input: unknown): SiteSettings {
  const source = record(input);
  const links = record(source.links);
  const homepage = record(source.homepage);
  const homeHeroImage = record(homepage.homeHeroImage);
  const homeEditImage = record(homepage.homeEditImage);
  const apparelEdit = record(homepage.apparelEdit);
  const sourceCategories = Array.isArray(homepage.categories) ? homepage.categories : [];
  const sourceDrops = Array.isArray(homepage.latestDrops) ? homepage.latestDrops : [];
  const sourceCategoryImages = Array.isArray(homepage.categoryImages) ? homepage.categoryImages : [];
  const sourceChannelImages = Array.isArray(homepage.homeChannelImages) ? homepage.homeChannelImages : [];
  const legacyHero = {
    imageUrl: homepage.heroMainImageUrl,
    imageFit: homepage.heroMainImageFit,
    imagePosition: homepage.heroMainImagePosition,
    label: fixedHomeVisuals.homeHeroImage.label,
  };
  const legacyEdit = {
    imageUrl: apparelEdit.imageUrl,
    imageFit: apparelEdit.imageFit,
    imagePosition: apparelEdit.imagePosition,
    label: fixedHomeVisuals.homeEditImage.label,
  };

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
      homeHeroImage: imageRecord(
        Object.keys(homeHeroImage).length ? homeHeroImage : legacyHero,
        fixedHomeVisuals.homeHeroImage,
      ),
      homeEditImage: imageRecord(
        Object.keys(homeEditImage).length ? homeEditImage : legacyEdit,
        fixedHomeVisuals.homeEditImage,
      ),
      homeChannelImages: fixedHomeVisuals.homeChannelImages.map((fallback, index) => {
        const legacy = record(sourceDrops[index]);
        return imageRecord(record(sourceChannelImages[index] || legacy), fallback);
      }),
      categoryImages: fixedHomeVisuals.categoryImages.map((fallback, index) => {
        const legacy = record(sourceCategories[index]);
        return imageRecord(record(sourceCategoryImages[index] || legacy), fallback);
      }),
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

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const baseUrl = (process.env.CATALOG_API_BASE || process.env.NEXT_PUBLIC_CATALOG_API_BASE || "").replace(/\/+$/, "");
  if (!baseUrl) return readSiteSettings();
  try {
    const response = await fetch(`${baseUrl}/site-settings`, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return readSiteSettings();
    const payload = await response.json() as { settings?: unknown };
    return payload.settings ? sanitizeSiteSettings(payload.settings) : readSiteSettings();
  } catch {
    return readSiteSettings();
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
