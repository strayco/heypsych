import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { TreatmentKindHub } from "@/components/hubs/TreatmentKindHub";

// Static: built from the treatment files, which only change on deploy.

export const metadata: Metadata = {
  title:
    "Investigational Mental Health Treatments | Psilocybin, MDMA & Clinical Trials",
  description:
    "Breakthrough investigational treatments in clinical trials including psilocybin therapy, MDMA-assisted therapy, ketamine, and other novel approaches for mental health.",
  keywords:
    "investigational treatments, clinical trials, psilocybin therapy, MDMA therapy, ketamine treatment, psychedelic therapy, breakthrough therapy, experimental mental health treatment",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/investigational`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Investigational Mental Health Treatments",
    description:
      "Breakthrough investigational treatments: psilocybin, MDMA, ketamine, and other novel therapies in clinical trials.",
    url: `${SITE_CONFIG.url}/treatments/investigational`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Investigational Mental Health Treatments",
    description:
      "Explore breakthrough therapies in clinical trials: psilocybin, MDMA, ketamine, and more.",
  },
};

export default function InvestigationalHubPage() {
  return (
    <TreatmentKindHub
      modality="investigational"
      title="Investigational"
      description="Treatments still being studied in clinical trials. Most are not approved and are available only in research settings."
      noun="treatments"
      searchPlaceholder="Search, e.g. psilocybin, MDMA"
      caution="These are still being studied; most are only available in clinical trials."
    />
  );
}
