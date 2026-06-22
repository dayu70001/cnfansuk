import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/homepage-admin",
        "/api",
        "/api/",
        "/cart",
        "/checkout",
        "/order-success",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
