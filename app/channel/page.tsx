import type { Metadata } from "next";
import ChannelLandingPage from "@/components/channel/ChannelLandingPage";
import { SITE_URL } from "@/lib/site";
import styles from "./channel.module.css";

export const metadata: Metadata = {
  title: { absolute: "CNFans UK | Everyday Clothing & New Arrivals" },
  description:
    "Discover clothing from CNFans UK, including outerwear, tops, bottoms and matching sets, with regular new arrivals and product updates.",
  alternates: { canonical: `${SITE_URL}/channel` },
  robots: { index: false, follow: true },
  openGraph: {
    title: "CNFans UK | Everyday Clothing & New Arrivals",
    description:
      "Discover clothing from CNFans UK, including outerwear, tops, bottoms and matching sets, with regular new arrivals and product updates.",
    url: `${SITE_URL}/channel`,
    type: "website",
  },
};

export default function ChannelPage() {
  return (
    <div className={styles.channelPage} data-channel-page="true">
      <ChannelLandingPage />
    </div>
  );
}
