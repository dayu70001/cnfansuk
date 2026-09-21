import type { Metadata } from "next";
import { LongTailGuidePage } from "@/components/LongTailGuidePage";
import { getPhaseFourGuide } from "@/lib/phaseFourGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseFourGuide("/cnfans-jacket-sizing");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansJacketSizingPage() { return <LongTailGuidePage guide={guide} />; }
