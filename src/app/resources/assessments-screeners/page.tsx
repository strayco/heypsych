import { Metadata } from "next";
import { getResourcesByCategoryServer } from "@/lib/data/server-queries";
import { AssessmentsClient } from "@/components/pages/assessments-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Mental Health Assessments & Screeners | Free Clinical Tools | HeyPsych",
  description:
    "Evidence-based mental health screening tools and assessments. Free validated questionnaires for depression, anxiety, ADHD, and more.",
  keywords:
    "mental health assessment, depression screener, anxiety test, ADHD assessment, PHQ-9, GAD-7, mental health quiz",
  alternates: {
    canonical: `${SITE_CONFIG.url}/resources/assessments-screeners`,
  },
  openGraph: {
    title: "Mental Health Assessments & Screeners | HeyPsych",
    description: "Free evidence-based mental health screening tools and validated assessments.",
    url: `${SITE_CONFIG.url}/resources/assessments-screeners`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default async function AssessmentsPage() {
  const assessments = await getResourcesByCategoryServer("assessments-screeners");
  return <AssessmentsClient assessments={assessments} />;
}
