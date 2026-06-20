import { requireAdmin } from "@/lib/adminAuth";
import { defaultSiteSettings, readSiteSettings } from "@/lib/siteSettings";
import { HomepageAdminClient } from "./HomepageAdminClient";

export default async function HomepageAdminPage() {
  await requireAdmin();

  return <HomepageAdminClient defaults={defaultSiteSettings} initialSettings={readSiteSettings()} />;
}
