import type { Metadata } from "next";
import { LongTailGuidePage } from "@/components/LongTailGuidePage";
import { getPhaseFourGuide } from "@/lib/phaseFourGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseFourGuide("/cnfans-hoodie-fabric-weight");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansHoodieFabricWeightPage() { return <LongTailGuidePage guide={guide} />; }
