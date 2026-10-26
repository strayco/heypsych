// src/app/architect/page.tsx
// Practice Architect — the illustrated practice world.
//
// This was previously a gateway offering a choice between five partial
// builders (/architect/build, /audit, /demo, /my-practice, /studio). Asking a
// clinician to pick a mode before they had told us anything about their
// practice was a decision we were making them make on our behalf. There is now
// one experience, and the old routes redirect here (see next.config.ts).

import { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";
import { PracticeArchitect } from "./_components/world/PracticeArchitect";

const canonicalUrl = `${siteConfig.url}/architect`;

export const metadata: Metadata = {
  title: "Practice Architect™ | Build Your Mental Health Practice",
  description:
    "Design your mental health practice and see it come to life. Tools matched to how you actually practise, with transparent pricing and the reasons behind every recommendation.",
  keywords: [
    "mental health EHR",
    "therapy practice software",
    "practice management",
    "EHR comparison",
    "mental health billing",
    "telehealth platform",
    "practice technology stack",
    "Practice Architect",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Practice Architect™ | Build Your Mental Health Practice",
    description:
      "Design your practice and see it come to life. Tools matched to how you actually practise.",
    url: canonicalUrl,
    type: "website",
  },
};

export default function ArchitectPage() {
  return <PracticeArchitect />;
}
