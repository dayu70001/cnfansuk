import { defaultSiteSettings, readSiteSettings } from "@/lib/siteSettings";
import { HomepageAdminClient } from "./HomepageAdminClient";

export default function HomepageAdminPage() {
  return <HomepageAdminClient defaults={defaultSiteSettings} initialSettings={readSiteSettings()} />;
}
