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
 * Server Component - Mental Health Organizations & Communities hub page
 * SEO-optimized landing page for support organizations
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mental Health Organizations & Support Communities | HeyPsych",
  description:
    "Connect with mental health organizations, peer support groups, and recovery communities. Find NAMI, DBSA, AA, Al-Anon, and specialized support networks for anxiety, depression, eating disorders, and more.",
  keywords:
    "mental health organizations, support groups, peer support, NAMI, DBSA, AA, Al-Anon, recovery community, mental health community, anxiety support, depression support",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources/support-community/organizations-communities`,
  },
  openGraph: {
    title: "Mental Health Organizations & Support Communities",
    description:
      "Connect with NAMI, DBSA, AA, and specialized mental health support networks and peer communities.",
    url: `${SITE_CONFIG.url}/resources/support-community/organizations-communities`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Mental Health Organizations & Communities | HeyPsych",
    description:
      "Find mental health support groups: NAMI, DBSA, AA, and specialized peer communities.",
  },
};

export default async function OrganizationsCommunitiesPage() {
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
      defaultTab="organizations"
    />
  );
}
