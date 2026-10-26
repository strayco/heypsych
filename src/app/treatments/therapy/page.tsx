import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { TreatmentKindHub } from "@/components/hubs/TreatmentKindHub";

// Static: built from the treatment files, which only change on deploy.

export const metadata: Metadata = {
  title: "Psychotherapy Types | CBT, DBT, EMDR, Psychodynamic & More",
  description:
    "Explore evidence-based psychotherapy approaches including CBT, DBT, EMDR, ACT, psychodynamic therapy, and other modalities for mental health treatment.",
  keywords:
    "psychotherapy, therapy types, CBT, cognitive behavioral therapy, DBT, dialectical behavior therapy, EMDR, ACT, psychodynamic therapy, talk therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/therapy`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Psychotherapy Types",
    description:
      "Evidence-based psychotherapy approaches: CBT, DBT, EMDR, ACT, and other modalities.",
    url: `${SITE_CONFIG.url}/treatments/therapy`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Psychotherapy Types",
    description: "Explore psychotherapy approaches: CBT, DBT, EMDR, ACT, and more.",
  },
};

export default function TherapyHubPage() {
  return (
    <TreatmentKindHub
      modality="therapy"
      title="Therapies"
      description="Talking and skills-based treatments, what each involves and what it helps with."
      noun="therapies"
      searchPlaceholder="Search therapies, e.g. CBT, DBT, EMDR"
    />
  );
}
