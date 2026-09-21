import type { Metadata } from "next";
import { GlobalFindsGuidePage } from "@/components/GlobalFindsGuidePage";
import { getPhaseFiveGuide } from "@/lib/phaseFiveGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseFiveGuide("/cnfans-shirt-finds");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansShirtFindsPage() { return <GlobalFindsGuidePage guide={guide} />; }
