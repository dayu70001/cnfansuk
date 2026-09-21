import type { Metadata } from "next";
import { GlobalFindsGuidePage } from "@/components/GlobalFindsGuidePage";
import { getPhaseSixGuide } from "@/lib/phaseSixGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseSixGuide("/cnfans-polo-shirt-finds");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansPoloShirtFindsPage() { return <GlobalFindsGuidePage guide={guide} />; }
