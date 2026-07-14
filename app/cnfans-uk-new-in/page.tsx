import type { Metadata } from "next";
import { FindsGuidePage } from "@/components/FindsGuidePage";
import { getPhaseThreeGuide } from "@/lib/phaseThreeGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseThreeGuide("/cnfans-uk-new-in");

export const metadata: Metadata = buildGuideMetadata({
  path: guide.path,
  title: guide.title,
  description: guide.description,
});

export default function CnfansUkNewInPage() {
  return <FindsGuidePage guide={guide} />;
}
