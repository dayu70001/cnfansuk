import type { Metadata } from "next";
import { FindsGuidePage } from "@/components/FindsGuidePage";
import { getPhaseThreeGuide } from "@/lib/phaseThreeGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseThreeGuide("/cnfans-sweatshirt-finds");

export const metadata: Metadata = buildGuideMetadata({
  path: guide.path,
  title: guide.title,
  description: guide.description,
});

export default function CnfansSweatshirtFindsPage() {
  return <FindsGuidePage guide={guide} />;
}
