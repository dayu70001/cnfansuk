import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Shared metadata builder for the CNFans UK guide / landing pages.
// Mirrors the canonical + OpenGraph + Twitter shape used on category pages,
// so every guide page is indexable with a self-referencing canonical URL.
export function buildGuideMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const canonical = `${SITE_URL}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
