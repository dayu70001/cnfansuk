import type { Metadata } from "next";
import { GlobalFindsGuidePage } from "@/components/GlobalFindsGuidePage";
import { getPhaseEightGuide } from "@/lib/phaseEightGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseEightGuide("/cnfans-embroidered-shirt-finds");

export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });

export default function CnfansEmbroideredShirtFindsPage() {
  return <GlobalFindsGuidePage guide={guide} />;
}
