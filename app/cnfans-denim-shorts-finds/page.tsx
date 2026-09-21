import type { Metadata } from "next";
import { GlobalFindsGuidePage } from "@/components/GlobalFindsGuidePage";
import { getPhaseSixGuide } from "@/lib/phaseSixGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseSixGuide("/cnfans-denim-shorts-finds");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansDenimShortsFindsPage() { return <GlobalFindsGuidePage guide={guide} />; }
