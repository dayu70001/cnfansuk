import type { Metadata } from "next";
import { FindsGuidePage } from "@/components/FindsGuidePage";
import { getPhaseThreeGuide } from "@/lib/phaseThreeGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseThreeGuide("/cnfans-t-shirt-finds");

export const metadata: Metadata = buildGuideMetadata({
  path: guide.path,
  title: guide.title,
  description: guide.description,
});

export default function CnfansTShirtFindsPage() {
  return <FindsGuidePage guide={guide} />;
}
