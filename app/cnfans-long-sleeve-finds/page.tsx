import type { Metadata } from "next";
import { GlobalFindsGuidePage } from "@/components/GlobalFindsGuidePage";
import { getPhaseSixGuide } from "@/lib/phaseSixGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseSixGuide("/cnfans-long-sleeve-finds");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansLongSleeveFindsPage() { return <GlobalFindsGuidePage guide={guide} />; }
