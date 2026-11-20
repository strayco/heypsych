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
import { getLiveConfig, getLiveTools, getPublicConsensus } from "@/lib/live/state";

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

/**
 * Server render passes the live catalog version (so the products API URL
 * changes when a price is published, and the CDN serves the new catalog) and
 * the live nonclinical config, plus approved Consensus Scores (public
 * projection only). All are tagged cached reads: this page is regenerated
 * only when one of them is published.
 */
export default async function ArchitectPage() {
  const [tools, config, consensus] = await Promise.all([getLiveTools(), getLiveConfig(), getPublicConsensus()]);
  return (
    <PracticeArchitect
      live={{
        catalogVersion: tools.version,
        draftFlag: config.flags["architect.draft-stack"],
        ledgerFlag: config.flags["architect.plan-ledger"],
        draftCta: config.experiments["architect-draft-cta"],
        draftTitle: config.copy["architect.draft.title"],
        draftBody: config.copy["architect.draft.body"],
        consensus,
      }}
    />
  );
}
