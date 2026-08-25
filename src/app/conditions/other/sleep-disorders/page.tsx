import { Metadata } from "next";
import { getOtherConditionsSubcategoryServer } from "@/lib/data/server-queries";
import { OtherSubcategoryClient } from "@/components/pages/other-subcategory-client";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Sleep Disorders | Insomnia, Sleep Apnea, Narcolepsy",
  description:
    "Comprehensive guide to sleep disorders including insomnia, sleep apnea, narcolepsy, and evidence-based sleep treatments and therapies.",
  keywords:
    "sleep disorders, insomnia, sleep apnea, narcolepsy, circadian rhythm, sleep treatment, sleep therapy",
  alternates: {
    canonical: `${SITE_CONFIG.url}/conditions/other/sleep-disorders`,
  },
  openGraph: {
    title: "Sleep Disorders",
    description: "Comprehensive guide to sleep disorders: symptoms, causes, and treatment options.",
    url: `${SITE_CONFIG.url}/conditions/other/sleep-disorders`,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

const config = {
  title: "Sleep Disorders",
  description: "Conditions involving persistent disruptions in sleep patterns that cause distress or impair functioning across multiple life domains.",
  icon: "moon",
  iconColor: "text-indigo-600",
  bgColor: "from-indigo-50",
  gradient: "from-indigo-900 via-blue-900 to-indigo-900",
  features: [
    {
      icon: "clock",
      title: "Circadian Rhythms",
      description: "Disruptions to natural sleep-wake cycles and timing",
    },
    {
      icon: "brain",
      title: "Neurological Impact",
      description: "Affects cognitive function, mood, and overall health",
    },
    {
      icon: "activity",
      title: "Sleep Studies",
      description: "Often requires polysomnography and sleep monitoring",
    },
  ],
};

export default async function SleepDisordersPage() {
  const conditions = await getOtherConditionsSubcategoryServer("sleep-disorders");
  return <OtherSubcategoryClient conditions={conditions} config={config} />;
}
