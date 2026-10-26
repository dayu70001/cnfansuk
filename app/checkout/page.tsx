import CheckoutFlow from "@/components/CheckoutFlow";
import { fetchSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await fetchSiteSettings();
  return (
    <CheckoutFlow
      personalWhatsappUrl={settings.links.personalWhatsappUrl}
      personalWhatsappNumber={settings.links.personalWhatsappNumber}
    />
  );
}
