import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { TreatmentKindHub } from "@/components/hubs/TreatmentKindHub";

// Static: built from the treatment files, which only change on deploy.

export const metadata: Metadata = {
  title: "Mental Health Supplements | Omega-3, Vitamin D, SAMe & Evidence-Based Options",
  description:
    "Evidence-based nutritional supplements for mental health including omega-3 fatty acids, vitamin D, SAMe, magnesium, and other supplements that may support well-being.",
  keywords:
    "mental health supplements, omega-3, fish oil, vitamin D, SAMe, magnesium, L-theanine, St John's wort, nutritional psychiatry, supplements for depression, supplements for anxiety",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/supplements`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Mental Health Supplements",
    description:
      "Evidence-based supplements: omega-3, vitamin D, SAMe, magnesium, and other options for mental health.",
    url: `${SITE_CONFIG.url}/treatments/supplements`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Mental Health Supplements",
    description: "Explore evidence-based supplements: omega-3, vitamin D, SAMe, and more.",
  },
};

export default function SupplementsHubPage() {
  return (
    <TreatmentKindHub
      modality="supplement"
      title="Supplements"
      description="Nutritional supplements people use for mental health, with what the evidence does and does not show."
      noun="supplements"
      searchPlaceholder="Search supplements, e.g. omega-3, magnesium"
      caution="Supplements can interact with medicines; check with a clinician or pharmacist first."
    />
  );
}
