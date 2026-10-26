import { Metadata } from "next";
import {
  loadCrisisResources,
  loadOrganizationsResources,
  loadTreatmentResources,
  loadCrisisHotlines,
} from "@/lib/loaders/support-community-loader";
import { SupportCommunityPage as SupportCommunityClient } from "@/components/support-community/SupportCommunityPage";
import { SITE_CONFIG } from "@/lib/seo/config";

/**
 * Server Component - Immediate Crisis & Hotlines hub page
 * SEO-optimized landing page for crisis resources
 */

// Static: content is read from data/ files at build time, and the client
// component reads ?tab/?page behind a Suspense boundary (see SupportCommunityPage).

export const metadata: Metadata = {
  title: "Crisis Helplines & Hotlines | 24/7 Mental Health Support",
  description:
    "Find 24/7 crisis helplines including 988 Suicide & Crisis Lifeline, Crisis Text Line, and specialized hotlines for veterans, LGBTQ+, and more. Free, confidential support available now.",
  keywords:
    "crisis helpline, 988, suicide hotline, mental health crisis, 24/7 support, crisis text line, emergency mental health, veterans crisis line, trevor project",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources/support-community/immediate-crisis`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Crisis Helplines & Hotlines | 24/7 Mental Health Support",
    description:
      "24/7 crisis helplines: 988 Lifeline, Crisis Text Line, and specialized support for veterans, LGBTQ+, and more.",
    url: `${SITE_CONFIG.url}/resources/support-community/immediate-crisis`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Crisis Helplines & Hotlines",
    description:
      "Find 24/7 crisis helplines: 988 Lifeline, Crisis Text Line, and specialized support.",
  },
};

export default async function ImmediateCrisisPage() {
  const [crisisResources, organizationsResources, treatmentResources, crisisHotlines] = await Promise.all([
    loadCrisisResources(),
    loadOrganizationsResources(),
    loadTreatmentResources(),
    loadCrisisHotlines(),
  ]);

  return (
    <SupportCommunityClient
      crisisResources={crisisResources}
      organizationsResources={organizationsResources}
      treatmentResources={treatmentResources}
      crisisHotlines={crisisHotlines}
      defaultTab="crisis"
    />
  );
}
