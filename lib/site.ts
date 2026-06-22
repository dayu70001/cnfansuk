// Single source of truth for the public site URL.
// Canonical, sitemap, robots and OpenGraph URLs all use this.
// Apex domain https://cnfans.co.uk 308-redirects to https://www.cnfans.co.uk,
// so www is the canonical host.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cnfans.co.uk").replace(/\/+$/, "");
export const SITE_NAME = "CNFans UK";
