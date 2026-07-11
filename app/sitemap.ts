import type { MetadataRoute } from "next";

const SITE_URL = "https://www.cnfans.co.uk";

const PUBLIC_PATHS = [
  "/",
  "/category/new-in",
  "/category/outerwear",
  "/category/tops",
  "/category/bottoms",
  "/category/co-ords-sets",
  "/delivery",
  "/returns",
  "/size-guide",
  "/track-order",
  "/contact",
  "/about",
  "/how-to-order",
  "/cnfans-spreadsheet",
  "/cnfans-finds",
  "/cnfans-delivery-uk",
  "/cnfans-qc-photos",
  "/cnfans-size-guide",
  "/cnfans-hoodie-finds",
  "/cnfans-jacket-finds",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/category/") || path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/category/") ? 0.8 : 0.5,
  }));
}
