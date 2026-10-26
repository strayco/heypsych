import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { TreatmentKindHub } from "@/components/hubs/TreatmentKindHub";

// Static: built from the treatment files, which only change on deploy.

export const metadata: Metadata = {
  title: "Psychiatric Medications A-Z | Antidepressants, Mood Stabilizers & More",
  description:
    "Complete guide to psychiatric medications including antidepressants, antipsychotics, mood stabilizers, anxiolytics, and stimulants. Learn about uses, side effects, and dosing.",
  keywords:
    "psychiatric medications, antidepressants, SSRI, SNRI, antipsychotics, mood stabilizers, benzodiazepines, stimulants, ADHD medication, anxiety medication",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/medications`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Psychiatric Medications A-Z",
    description:
      "Complete guide to psychiatric medications: antidepressants, antipsychotics, mood stabilizers, and more.",
    url: `${SITE_CONFIG.url}/treatments/medications`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Psychiatric Medications A-Z",
    description:
      "Evidence-based information on psychiatric medications: uses, side effects, and dosing.",
  },
};

export default function MedicationsHubPage() {
  return (
    <TreatmentKindHub
      modality="medication"
      title="Medications"
      description="Prescription medicines for mental health, shelved by family, with what each is used for and what to expect."
      noun="medications"
      searchPlaceholder="Search by name or brand, e.g. Zoloft, Lamictal, Adderall"
    />
  );
}
