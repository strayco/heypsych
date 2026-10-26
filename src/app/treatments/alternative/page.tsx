import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { TreatmentKindHub } from "@/components/hubs/TreatmentKindHub";

// Static: built from the treatment files, which only change on deploy.

export const metadata: Metadata = {
  title: "Alternative Mental Health Treatments | Light Therapy, Acupuncture & More",
  description:
    "Evidence-based alternative treatments for mental health including bright light therapy, acupuncture, mindfulness practices, yoga, and other complementary approaches.",
  keywords:
    "alternative mental health treatment, light therapy, acupuncture, mindfulness, yoga therapy, complementary medicine, holistic mental health, meditation",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/alternative`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Alternative Mental Health Treatments",
    description:
      "Evidence-based alternative treatments: light therapy, acupuncture, mindfulness, and complementary approaches.",
    url: `${SITE_CONFIG.url}/treatments/alternative`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Alternative Mental Health Treatments",
    description: "Explore alternative treatments: light therapy, acupuncture, mindfulness, and more.",
  },
};

export default function AlternativeHubPage() {
  return (
    <TreatmentKindHub
      modality="alternative"
      title="Lifestyle & alternative"
      description="Light therapy, exercise, mindfulness and other approaches, with how strong the evidence is."
      noun="approaches"
      searchPlaceholder="Search approaches, e.g. light therapy, yoga"
    />
  );
}
