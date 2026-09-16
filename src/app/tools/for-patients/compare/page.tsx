/**
 * Patient App Comparisons Index Page
 *
 * Landing page for all mental health app comparisons.
 * Targets "[App] vs [App]" and "compare mental health apps" queries.
 */

import { Metadata } from "next";
import Link from "next/link";
import { Scale, ArrowRight, TrendingUp, Star, Zap } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { KEY_COMPARISONS, TOP_APPS } from "@/lib/seo/patient-programmatic-seo-engine";
import { getCurrentYear } from "@/lib/seo/freshness-automation";

const canonicalUrl = `${siteConfig.url}/tools/for-patients/compare`;

export const metadata: Metadata = {
  title: `Mental Health App Comparisons (${getCurrentYear()}) - Side-by-Side Reviews | HeyPsych`,
  description:
    "Compare mental health apps head-to-head. BetterHelp vs Talkspace, Calm vs Headspace, Cerebral vs Done, and more. Pricing, features, and evidence compared.",
  keywords: [
    "mental health app comparison",
    "BetterHelp vs Talkspace",
    "Calm vs Headspace",
    "therapy app comparison",
    "best mental health app",
    "compare therapy apps",
    "Cerebral vs Done",
    "online therapy comparison",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: `Mental Health App Comparisons ${getCurrentYear()}`,
    description:
      "Head-to-head comparisons of therapy apps, meditation apps, and mental health tools. Find the best option for you.",
    url: canonicalUrl,
    type: "website",
  },
};

// Group comparisons by category for better UX
const COMPARISON_CATEGORIES = [
  {
    name: "Therapy Platforms",
    description: "Online therapy services compared",
    icon: Star,
    comparisons: KEY_COMPARISONS.filter(({ a, b }) => {
      const cats = ["therapy", "psychiatry"];
      const appA = TOP_APPS.find((app) => app.slug === a);
      const appB = TOP_APPS.find((app) => app.slug === b);
      return cats.includes(appA?.category || "") || cats.includes(appB?.category || "");
    }),
  },
  {
    name: "Meditation Apps",
    description: "Mindfulness and meditation compared",
    icon: Zap,
    comparisons: KEY_COMPARISONS.filter(({ a, b }) => {
      const appA = TOP_APPS.find((app) => app.slug === a);
      const appB = TOP_APPS.find((app) => app.slug === b);
      return appA?.category === "meditation" || appB?.category === "meditation";
    }),
  },
  {
    name: "AI Therapy & Chatbots",
    description: "AI-powered mental health support compared",
    icon: TrendingUp,
    comparisons: KEY_COMPARISONS.filter(({ a, b }) => {
      const appA = TOP_APPS.find((app) => app.slug === a);
      const appB = TOP_APPS.find((app) => app.slug === b);
      return appA?.category === "ai-therapy" || appB?.category === "ai-therapy";
    }),
  },
];

export default function CompareIndexPage() {
  const year = getCurrentYear();
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  // Structured data
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Tools", item: `${siteConfig.url}/tools/` },
        { "@type": "ListItem", position: 2, name: "For Patients", item: `${siteConfig.url}/tools/for-patients/` },
        { "@type": "ListItem", position: 3, name: "Compare", item: canonicalUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Mental Health App Comparisons ${year}`,
      description: "Head-to-head comparisons of mental health apps",
      url: canonicalUrl,
      dateModified: new Date().toISOString(),
      hasPart: KEY_COMPARISONS.map(({ a, b }) => {
        const appA = TOP_APPS.find((app) => app.slug === a);
        const appB = TOP_APPS.find((app) => app.slug === b);
        const nameA = appA?.name || a;
        const nameB = appB?.name || b;
        return {
          "@type": "WebPage",
          name: `${nameA} vs ${nameB}`,
          url: `${siteConfig.url}/tools/for-patients/compare/${a}-vs-${b}/`,
        };
      }),
    },
  ];

  return (
    <>
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-patients/" className="text-label-secondary hover:text-treatment">
                For Patients
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Compare</span>
            </nav>

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Scale className="h-7 w-7 text-treatment" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Mental Health App Comparisons
                </h1>
                <p className="mt-2 text-label-secondary">
                  Updated {currentMonth} {year}
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-lg text-label-secondary">
              Compare therapy apps, meditation apps, and mental health tools side-by-side.
              See pricing, features, privacy, and evidence to find the best option for you.
            </p>

            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-treatment">{KEY_COMPARISONS.length}</span>
                <span className="text-label-secondary">comparisons</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-treatment">{TOP_APPS.length}</span>
                <span className="text-label-secondary">apps compared</span>
              </div>
            </div>
          </div>
        </section>

        {/* All Comparisons Grid */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">All Comparisons</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {KEY_COMPARISONS.map(({ a, b }) => {
                const appA = TOP_APPS.find((app) => app.slug === a);
                const appB = TOP_APPS.find((app) => app.slug === b);
                const nameA = appA?.name || a.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                const nameB = appB?.name || b.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

                return (
                  <Link
                    key={`${a}-vs-${b}`}
                    href={`/tools/for-patients/compare/${a}-vs-${b}/`}
                    className="group flex items-center justify-between rounded-xl border border-separator bg-surface p-4 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div>
                      <h3 className="font-semibold text-label-primary group-hover:text-treatment transition-colors">
                        {nameA} vs {nameB}
                      </h3>
                      <p className="mt-1 text-sm text-label-tertiary">
                        {appA?.category || "App"} comparison
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-label-quaternary group-hover:text-treatment transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* By Category */}
        {COMPARISON_CATEGORIES.filter((cat) => cat.comparisons.length > 0).map((category) => (
          <section
            key={category.name}
            className="border-t border-separator px-4 py-12 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-3 mb-6">
                <category.icon className="h-5 w-5 text-treatment" />
                <div>
                  <h2 className="text-lg font-semibold text-label-primary">{category.name}</h2>
                  <p className="text-sm text-label-secondary">{category.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {category.comparisons.map(({ a, b }) => {
                  const appA = TOP_APPS.find((app) => app.slug === a);
                  const appB = TOP_APPS.find((app) => app.slug === b);
                  const nameA = appA?.name || a;
                  const nameB = appB?.name || b;
                  return (
                    <Link
                      key={`${a}-vs-${b}`}
                      href={`/tools/for-patients/compare/${a}-vs-${b}/`}
                      className="inline-flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2.5 text-sm font-medium text-label-secondary transition-all hover:border-treatment/30 hover:text-treatment"
                    >
                      {nameA} vs {nameB}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="border-t border-separator bg-treatment/5 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-label-secondary">
              Browse all mental health apps by category to find what you need.
            </p>
            <Link
              href="/tools/for-patients/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
            >
              Browse All Apps
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 86400; // 24 hours
