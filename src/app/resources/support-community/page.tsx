// src/app/resources/support-community/page.tsx
import { Metadata } from "next";
import {
  loadCrisisResources,
  loadOrganizationsResources,
  loadTreatmentResources,
  loadCrisisHotlines,
} from "@/lib/loaders/support-community-loader";
import { SupportCommunityPage as SupportCommunityClient } from "@/components/support-community/SupportCommunityPage";

export const metadata: Metadata = {
  title: "Support & Community Resources | HeyPsych",
  description:
    "Find mental health support groups, crisis helplines, recovery programs, and community resources. Connect with others and access 24/7 support services.",
  keywords: [
    "mental health support",
    "support groups",
    "crisis helpline",
    "988",
    "peer support",
    "recovery programs",
    "online communities",
    "mental health resources",
  ],
};

export default async function SupportCommunityPage() {
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
    />
  );
}
