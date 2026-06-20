import { requireAdmin } from "@/lib/adminAuth";
import { defaultSiteSettings, fetchSiteSettings } from "@/lib/siteSettings";
import { HomepageAdminClient } from "@/app/homepage-admin/HomepageAdminClient";

export default async function AdminHomepagePage() {
  await requireAdmin();
  return <HomepageAdminClient defaults={defaultSiteSettings} initialSettings={await fetchSiteSettings()} />;
}
