import type { Metadata } from "next";
import { LongTailGuidePage } from "@/components/LongTailGuidePage";
import { getPhaseFourGuide } from "@/lib/phaseFourGuides";
import { buildGuideMetadata } from "@/lib/seoPage";

const guide = getPhaseFourGuide("/cnfans-rehearsal-shipping");
export const metadata: Metadata = buildGuideMetadata({ path: guide.path, title: guide.title, description: guide.description });
export default function CnfansRehearsalShippingPage() { return <LongTailGuidePage guide={guide} />; }
