import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";
import { TreatmentKindHub } from "@/components/hubs/TreatmentKindHub";

// Static: built from the treatment files, which only change on deploy.

export const metadata: Metadata = {
  title: "Interventional Mental Health Treatments | TMS, ECT, DBS & Brain Stimulation",
  description:
    "Brain stimulation and interventional treatments for treatment-resistant mental health conditions including TMS, ECT, deep brain stimulation, and VNS therapy.",
  keywords:
    "brain stimulation, TMS, transcranial magnetic stimulation, ECT, electroconvulsive therapy, deep brain stimulation, DBS, VNS, vagus nerve stimulation, treatment-resistant depression",
  alternates: {
    canonical: `${SITE_CONFIG.url}/treatments/interventional`,
  },
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "Interventional Mental Health Treatments",
    description:
      "Brain stimulation treatments: TMS, ECT, deep brain stimulation, and VNS for treatment-resistant conditions.",
    url: `${SITE_CONFIG.url}/treatments/interventional`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    images: ["/images/og/heypsych.png"],
    card: "summary_large_image",
    title: "Interventional Mental Health Treatments",
    description: "Explore brain stimulation treatments: TMS, ECT, DBS, and VNS therapy.",
  },
};

export default function InterventionalHubPage() {
  return (
    <TreatmentKindHub
      modality="interventional"
      title="Procedures & brain stimulation"
      description="Treatments done in a clinic, such as TMS, ECT and ketamine, usually when other options have not helped enough."
      noun="procedures"
      searchPlaceholder="Search procedures, e.g. TMS, ECT, ketamine"
    />
  );
}
