// src/app/tools/for-patients/page.tsx
// Patient-focused tools landing page - Aggressive SEO optimization
// Target queries: "best mental health apps", "free anxiety apps", "therapy apps"

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Search, Star, Smartphone, Check, X, Scale } from "lucide-react";
import { TaxonomyService } from "@/lib/tools/taxonomy-service";
import { ToolService } from "@/lib/tools/tool-service";
import { CampaignService } from "@/lib/tools/campaign-service";
import { siteConfig } from "@/lib/config/site";
import { ToolsHeroSearch } from "../_components/ToolsHeroSearch";
import { SponsoredSection } from "../_components/SponsoredSection";
import { TrustSignal } from "../_components/TrustSignal";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { KEY_COMPARISONS, TOP_APPS } from "@/lib/seo/patient-programmatic-seo-engine";

const canonicalUrl = `${siteConfig.url}/tools/for-patients`;

// SEO-optimized metadata with specific numbers and direct answers
export const metadata: Metadata = {
  title: "Best Mental Health Apps 2026: Free & Paid Options Compared | HeyPsych",
  description:
    "Compare 100+ mental health apps reviewed by clinicians. Best free apps: CBT-i Coach, MindShift CBT, PTSD Coach. Premium: Calm ($70/yr), Headspace ($70/yr). Updated September 2026.",
  keywords: [
    "best mental health apps 2026",
    "free mental health apps",
    "best anxiety apps free",
    "best depression apps",
    "best therapy apps",
    "mental health apps that actually work",
    "free CBT apps",
    "best mood tracker app",
    "Calm vs Headspace",
    "best sleep app for anxiety",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Best Mental Health Apps 2026: 100+ Apps Compared",
    description: "Free apps: CBT-i Coach, MindShift CBT, PTSD Coach. Premium: Calm, Headspace. All reviewed by mental health clinicians.",
    url: canonicalUrl,
    type: "website",
    images: [
      {
        url: `${siteConfig.url}/og/mental-health-apps.png`,
        width: 1200,
        height: 630,
        alt: "Best Mental Health Apps 2026 - HeyPsych Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Mental Health Apps 2026 | Free & Paid Compared",
    description: "100+ apps reviewed. Best free: CBT-i Coach, MindShift. Best premium: Calm, Headspace.",
  },
  other: {
    "article:modified_time": new Date().toISOString(),
  },
};

// SEO FAQ content - targets "People Also Ask" boxes
const SEO_FAQS = [
  {
    q: "What is the best free mental health app?",
    a: "The best free mental health apps are CBT-i Coach (for insomnia), MindShift CBT (for anxiety), and PTSD Coach (for trauma). All three are completely free with no subscriptions, developed by government agencies or non-profits, and use evidence-based therapeutic techniques.",
  },
  {
    q: "Is Calm or Headspace better for anxiety?",
    a: "Both Calm and Headspace cost $70/year and offer anxiety-focused content. Calm is better for sleep issues with its Sleep Stories, while Headspace has more structured meditation courses. For free anxiety help, MindShift CBT or Rootd (freemium) are better options.",
  },
  {
    q: "Do mental health apps actually work?",
    a: "Yes, mental health apps based on CBT (Cognitive Behavioral Therapy) have research support. Apps like CBT-i Coach and MindShift CBT use clinically-validated techniques. However, apps are self-help tools - not replacements for therapy in moderate to severe cases.",
  },
  {
    q: "What is the best app for depression?",
    a: "For depression, mood tracking apps like Daylio (freemium, $2.99/mo premium) help identify patterns. For CBT-based support, Moodfit (freemium) offers structured exercises. Woebot provides AI-guided CBT conversations. For clinical depression, apps should complement professional treatment.",
  },
  {
    q: "Are therapy apps worth it?",
    a: "Paid therapy apps like Calm ($70/yr) and Headspace ($70/yr) are worth it if you'll use them daily. However, many excellent apps are completely free (CBT-i Coach, MindShift CBT, PTSD Coach). Try free options first before committing to subscriptions.",
  },
];

export default async function ForPatientsPage() {
  const hubs = TaxonomyService.getAllHubs();
  const allTools = await ToolService.getAll();

  // Filter to patient-relevant tools
  const patientTools = allTools.filter(
    (t) => !t.clinician?.is_clinician_relevant || t.primary_hubs.length > 0
  );

  // Get sponsored tools for patients
  const sponsoredTools = await CampaignService.getSponsoredTools(
    "tools-landing-featured",
    "patient",
    undefined,
    2
  );

  // Get featured patient tools
  const featuredPatientTools = patientTools
    .filter((t) => t.app_rating && t.app_rating >= 4.0)
    .sort((a, b) => (b.app_rating || 0) - (a.app_rating || 0))
    .slice(0, 6);

  // Get truly free apps (no subscription, no trial - completely free)
  const trulyFreeTools = patientTools
    .filter((t) => t.pricing.model === "free" && t.app_rating && t.app_rating >= 4.0)
    .sort((a, b) => (b.app_rating || 0) - (a.app_rating || 0))
    .slice(0, 6);

  // Generate structured data for SEO
  const structuredData = generateStructuredData(patientTools, trulyFreeTools, hubs);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Structured Data for Search Engines */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Hero Section with Direct Answer Block - Optimized for Featured Snippets */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb - Schema.org BreadcrumbList */}
          <nav className="mb-6 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="text-label-secondary hover:text-accent transition-colors">
              Home
            </Link>
            <span className="text-label-quaternary">/</span>
            <Link href="/tools/" className="text-label-secondary hover:text-accent transition-colors">
              Tools
            </Link>
            <span className="text-label-quaternary">/</span>
            <span className="text-label-primary font-medium">Mental Health Apps</span>
          </nav>

          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Updated September 2026
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
            Best Mental Health Apps ({patientTools.length}+ Reviewed)
          </h1>

          {/* Direct Answer Block - Featured Snippet Bait */}
          <div className="mt-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 p-4 sm:p-6">
            <p className="text-sm font-medium text-emerald-800 mb-2">Quick Answer:</p>
            <p className="text-label-primary">
              <strong>Best free mental health apps (2026):</strong> CBT-i Coach (insomnia),
              MindShift CBT (anxiety), PTSD Coach (trauma). All completely free, no subscriptions.{" "}
              <strong>Best premium apps:</strong> Calm and Headspace ($70/year each) for meditation and sleep.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-lg">
            <Suspense fallback={<SearchFallback />}>
              <ToolsHeroSearch />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Quick Comparison Table - Targets Table Featured Snippets */}
      <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-semibold text-label-primary mb-4">
            Free vs Paid Mental Health Apps at a Glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-separator">
                  <th className="text-left py-3 pr-4 font-medium text-label-primary">App</th>
                  <th className="text-left py-3 px-4 font-medium text-label-primary">Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-label-primary">Best For</th>
                  <th className="text-center py-3 px-4 font-medium text-label-primary">Free Forever</th>
                  <th className="text-left py-3 pl-4 font-medium text-label-primary">Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-separator bg-emerald-50/30">
                  <td className="py-3 pr-4 font-medium">CBT-i Coach</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">Free</td>
                  <td className="py-3 px-4 text-label-secondary">Insomnia</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 pl-4">4.7★</td>
                </tr>
                <tr className="border-b border-separator bg-emerald-50/30">
                  <td className="py-3 pr-4 font-medium">MindShift CBT</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">Free</td>
                  <td className="py-3 px-4 text-label-secondary">Anxiety</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 pl-4">4.5★</td>
                </tr>
                <tr className="border-b border-separator bg-emerald-50/30">
                  <td className="py-3 pr-4 font-medium">PTSD Coach</td>
                  <td className="py-3 px-4 text-emerald-700 font-medium">Free</td>
                  <td className="py-3 px-4 text-label-secondary">Trauma/PTSD</td>
                  <td className="py-3 px-4 text-center"><Check className="h-4 w-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 pl-4">4.8★</td>
                </tr>
                <tr className="border-b border-separator">
                  <td className="py-3 pr-4 font-medium">Calm</td>
                  <td className="py-3 px-4 text-label-secondary">$70/year</td>
                  <td className="py-3 px-4 text-label-secondary">Sleep & Meditation</td>
                  <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-amber-500 mx-auto" /></td>
                  <td className="py-3 pl-4">4.8★</td>
                </tr>
                <tr className="border-b border-separator">
                  <td className="py-3 pr-4 font-medium">Headspace</td>
                  <td className="py-3 px-4 text-label-secondary">$70/year</td>
                  <td className="py-3 px-4 text-label-secondary">Meditation courses</td>
                  <td className="py-3 px-4 text-center"><X className="h-4 w-4 text-amber-500 mx-auto" /></td>
                  <td className="py-3 pl-4">4.8★</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-label-tertiary">
            Prices verified September 2026. Free apps developed by VA, Anxiety Canada, and other non-profits.
          </p>
        </div>
      </section>

      {/* Sponsored Section (if any active) */}
      {sponsoredTools.length > 0 && (
        <SponsoredSection sponsoredTools={sponsoredTools} />
      )}

      {/* Browse by Category */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Categories
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            Browse by Need
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hubs.map((hub) => (
              <Link
                key={hub.slug}
                href={hub.url}
                className="group flex items-center justify-between rounded-xl border border-separator bg-surface p-4 transition-all hover:border-neutral-300 hover:shadow-soft"
              >
                <div>
                  <h3 className="font-medium text-label-primary group-hover:text-accent transition-colors">
                    {hub.display_name}
                  </h3>
                  {hub.intro && (
                    <p className="mt-1 text-sm text-label-tertiary line-clamp-1">
                      {hub.intro.slice(0, 50)}...
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Free Apps - Addresses "What can I actually use for free?" */}
      {trulyFreeTools.length > 0 && (
        <section className="border-b border-separator bg-emerald-50/30 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                  Completely Free
                </p>
                <h2 className="mt-1 text-xl font-semibold text-label-primary">
                  Best Free Mental Health Apps
                </h2>
                <p className="mt-2 text-sm text-label-secondary max-w-xl">
                  No subscriptions, no trials, no hidden costs. These apps are genuinely free to use,
                  developed by non-profits, government agencies, or as public health resources.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trulyFreeTools.map((tool) => (
                <PatientToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Rated Tools */}
      {featuredPatientTools.length > 0 && (
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                  Featured
                </p>
                <h2 className="mt-1 text-xl font-semibold text-label-primary">
                  Top Rated Apps
                </h2>
              </div>
              <Link
                href="/tools/search/?audience=patient"
                className="group flex items-center gap-1 text-sm font-medium text-label-primary hover:text-accent"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPatientTools.map((tool) => (
                <PatientToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Comparisons */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-1">
            <Scale className="h-5 w-5 text-treatment" />
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Compare
            </p>
          </div>
          <h2 className="text-xl font-semibold text-label-primary">
            Popular Comparisons
          </h2>
          <p className="mt-2 text-label-secondary text-sm">
            Head-to-head comparisons of the most popular mental health apps
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {KEY_COMPARISONS.map(({ a, b }) => {
              const appA = TOP_APPS.find((app) => app.slug === a);
              const appB = TOP_APPS.find((app) => app.slug === b);
              const nameA = appA?.name || a.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              const nameB = appB?.name || b.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

              return (
                <Link
                  key={`${a}-vs-${b}`}
                  href={`/tools/for-patients/compare/${a}-vs-${b}/`}
                  className="inline-flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2.5 text-sm font-medium text-label-secondary transition-all hover:border-treatment/30 hover:bg-treatment/5 hover:text-treatment"
                >
                  {nameA} vs {nameB}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              );
            })}
          </div>

          <Link
            href="/tools/for-patients/compare/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
          >
            View all comparisons
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Trust Signal */}
      <TrustSignal />

      {/* FAQ Section - Targets "People Also Ask" */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-label-primary mb-6">
            Frequently Asked Questions About Mental Health Apps
          </h2>
          <div className="space-y-4">
            {SEO_FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-lg border border-separator bg-surface"
                open={i === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  {faq.q}
                  <ArrowRight className="h-4 w-4 text-label-tertiary transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4 text-sm text-label-secondary">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Clinicians */}
      <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Are you a clinician?
          </p>
          <h2 className="mt-2 text-xl font-semibold text-label-primary">
            Professional Tools for Practices
          </h2>
          <p className="mx-auto mt-2 max-w-md text-label-secondary">
            AI scribes, EHRs, billing tools, and more.
          </p>
          <Link
            href="/tools/for-clinicians/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-treatment-foreground transition-colors hover:bg-treatment-600"
          >
            <span className="text-treatment-foreground">Browse Clinician Tools</span>
            <ArrowRight className="h-4 w-4 text-treatment-foreground" />
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Get accurate pricing label for patient tool cards.
 * Distinguishes between completely free, freemium, and trial-only.
 */
function getPricingBadge(pricing: DigitalToolV3["pricing"]): { label: string; variant: "free" | "freemium" | "trial" | "paid" } | null {
  const { model, free_tier, starting_price } = pricing;

  if (model === "free") {
    return { label: "Free", variant: "free" };
  }
  if (model === "freemium") {
    return { label: "Free tier", variant: "freemium" };
  }
  if (model === "subscription" && free_tier) {
    return { label: "Free trial", variant: "trial" };
  }
  if (starting_price) {
    return { label: `From ${starting_price}`, variant: "paid" };
  }
  return null;
}

function PatientToolCard({ tool }: { tool: DigitalToolV3 }) {
  const pricingBadge = getPricingBadge(tool.pricing);

  // Badge styling based on pricing variant
  const badgeStyles = {
    free: "bg-emerald-50 text-emerald-700 border-emerald-200",
    freemium: "bg-positive/10 text-positive-700",
    trial: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-neutral-100 text-neutral-600",
  };

  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-4 transition-all hover:border-accent/20 hover:shadow-soft"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/5">
        <Smartphone className="h-6 w-6 text-accent/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-label-primary group-hover:text-accent transition-colors truncate">
            {tool.name}
          </h3>
          {tool.app_rating && (
            <div className="flex shrink-0 items-center gap-1 text-sm text-label-secondary">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{tool.app_rating}</span>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-label-secondary line-clamp-2">
          {tool.short_description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pricingBadge && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badgeStyles[pricingBadge.variant]}`}>
              {pricingBadge.label}
            </span>
          )}
          {tool.privacy.hipaa_compliant === true && (
            <span className="rounded bg-treatment/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-treatment-700">
              HIPAA
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchFallback() {
  return (
    <div className="flex h-12 items-center justify-center rounded-xl border border-separator bg-surface px-4">
      <Search className="h-5 w-5 text-label-tertiary" />
      <span className="ml-3 text-label-tertiary">Search tools...</span>
    </div>
  );
}

export const revalidate = 3600; // 1 hour

/**
 * Generate comprehensive structured data for maximum SEO impact.
 * Targets: FAQPage, ItemList, BreadcrumbList, HowTo, WebPage
 */
function generateStructuredData(
  allTools: DigitalToolV3[],
  freeTools: DigitalToolV3[],
  hubs: ReturnType<typeof TaxonomyService.getAllHubs>
): object[] {
  const schemas: object[] = [];

  // 1. BreadcrumbList - Helps with sitelinks
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/tools/` },
      { "@type": "ListItem", position: 3, name: "Mental Health Apps", item: canonicalUrl },
    ],
  });

  // 2. FAQPage - Targets "People Also Ask"
  schemas.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SEO_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  });

  // 3. ItemList - Best Free Mental Health Apps
  if (freeTools.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Best Free Mental Health Apps 2026",
      description: "Completely free mental health apps with no subscriptions or hidden costs",
      numberOfItems: freeTools.length,
      itemListElement: freeTools.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        url: `${siteConfig.url}/tools/${tool.slug}/`,
        description: tool.short_description,
      })),
    });
  }

  // 4. WebPage with speakable for voice search
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Best Mental Health Apps 2026",
    description: "Compare 100+ mental health apps reviewed by clinicians. Find the best free and paid options.",
    url: canonicalUrl,
    dateModified: new Date().toISOString(),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".direct-answer", "h1", ".quick-answer"],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Mental Health Apps",
      numberOfItems: allTools.length,
    },
  });

  // 5. HowTo - "How to Choose a Mental Health App"
  schemas.push({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Choose a Mental Health App",
    description: "A step-by-step guide to selecting the right mental health app for your needs",
    totalTime: "PT5M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Identify your primary concern",
        text: "Determine whether you need help with anxiety, sleep, depression, focus, or another area.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Decide on budget",
        text: "Free options like CBT-i Coach and MindShift CBT are excellent. Premium apps like Calm cost $70/year.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Check the evidence",
        text: "Look for apps using CBT or other evidence-based approaches. Government-developed apps are well-researched.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Consider privacy",
        text: "Review the app's privacy policy. Apps that don't sell data are preferable for sensitive health information.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Try before committing",
        text: "Start with free apps or free trials. Most premium apps offer 7-day trials.",
      },
    ],
  });

  // 6. CollectionPage for category browsing
  schemas.push({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mental Health App Categories",
    description: "Browse mental health apps by category: anxiety, sleep, depression, ADHD, and more",
    hasPart: hubs.map((hub) => ({
      "@type": "WebPage",
      name: hub.display_name,
      url: `${siteConfig.url}${hub.url}`,
    })),
  });

  return schemas;
}
