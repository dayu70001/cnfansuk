import { notFound } from "next/navigation";
import { defaultSiteSettings, readSiteSettings } from "@/lib/siteSettings";
import { HomepageAdminClient } from "./HomepageAdminClient";

export default function HomepageAdminPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <HomepageAdminClient defaults={defaultSiteSettings} initialSettings={readSiteSettings()} />;
}
