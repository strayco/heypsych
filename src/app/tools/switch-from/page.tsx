/**
 * Switch-From Hub Page
 *
 * Landing page for users looking to migrate from their current software.
 * Links to individual switch-from guides for high-intent buyer journeys.
 *
 * URL: /tools/switch-from
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  RefreshCw,
  FileText,
  Bot,
  Users,
  Video,
  Stethoscope,
  Clock,
  Shield,
  FileDown,
  DollarSign,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";

export const metadata: Metadata = {
  title: "How to Switch Mental Health Software (2026) | Migration Guides | HeyPsych",
  description: "Step-by-step guides for switching from SimplePractice, TherapyNotes, Valant, and other mental health software. Learn about data migration, contract timing, and finding the right replacement.",
  alternates: {
    canonical: `${siteConfig.url}/tools/switch-from`,
  },
  openGraph: {
    title: "Mental Health Software Migration Guides | HeyPsych",
    description: "Complete guides for switching from popular mental health software. Data migration tips, contract timing, and replacement recommendations.",
    url: `${siteConfig.url}/tools/switch-from`,
    type: "website",
  },
  keywords: [
    "switch from SimplePractice",
    "migrate from TherapyNotes",
    "leave Valant",
    "mental health EHR migration",
    "therapy software replacement",
    "practice management migration",
    "cancel SimplePractice",
    "export patient data EHR",
    "switch therapy software",
    "mental health software migration guide",
  ],
};

// Top products that people commonly switch FROM
const FEATURED_SWITCH_FROM = [
  {
    slug: "simplepractice",
    name: "SimplePractice",
    description: "Complete guide to migrating away from the most popular therapy EHR",
    category: "EHR & Practice Management",
    icon: FileText,
    migrationComplexity: "complex" as const,
    timeEstimate: "2-4 weeks",
  },
  {
    slug: "therapynotes",
    name: "TherapyNotes",
    description: "Step-by-step guide to switching from TherapyNotes",
    category: "EHR & Practice Management",
    icon: FileText,
    migrationComplexity: "complex" as const,
    timeEstimate: "2-4 weeks",
  },
  {
    slug: "jane-app",
    name: "Jane App",
    description: "How to migrate your practice from Jane to a new platform",
    category: "EHR & Practice Management",
    icon: FileText,
    migrationComplexity: "complex" as const,
    timeEstimate: "2-4 weeks",
  },
  {
    slug: "valant",
    name: "Valant",
    description: "Migration guide for psychiatry practices leaving Valant",
    category: "EHR & Practice Management",
    icon: Stethoscope,
    migrationComplexity: "complex" as const,
    timeEstimate: "2-4 weeks",
  },
  {
    slug: "freed",
    name: "Freed",
    description: "Quick guide to switching AI scribes - minimal data migration",
    category: "AI Scribe",
    icon: Bot,
    migrationComplexity: "easy" as const,
    timeEstimate: "1-3 days",
  },
  {
    slug: "mentalyc",
    name: "Mentalyc",
    description: "How to switch from Mentalyc to another AI documentation tool",
    category: "AI Scribe",
    icon: Bot,
    migrationComplexity: "easy" as const,
    timeEstimate: "1-3 days",
  },
  {
    slug: "headway",
    name: "Headway",
    description: "Guide to leaving Headway and managing your own insurance",
    category: "Provider Networks",
    icon: Users,
    migrationComplexity: "moderate" as const,
    timeEstimate: "1-2 weeks",
  },
  {
    slug: "doxy-me",
    name: "Doxy.me",
    description: "Switching from Doxy.me to an integrated telehealth solution",
    category: "Telehealth",
    icon: Video,
    migrationComplexity: "easy" as const,
    timeEstimate: "1-3 days",
  },
];

// Migration complexity colors
const complexityConfig = {
  easy: {
    color: "text-success",
    bg: "bg-success/10",
    label: "Easy",
  },
  moderate: {
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Moderate",
  },
  complex: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Complex",
  },
};

export default async function SwitchFromHubPage() {
  // Get tool data for pricing display
  const allTools = await ClinicianToolService.loadClinicianTools();
  const toolMap = new Map(allTools.map(t => [t.slug, t]));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Mental Health Software Migration Guides",
    description: "Step-by-step guides for switching from popular mental health software. Learn about data migration, contract timing, and finding replacements.",
    url: `${siteConfig.url}/tools/switch-from`,
    hasPart: FEATURED_SWITCH_FROM.map((item) => ({
      "@type": "HowTo",
      name: `How to Switch from ${item.name}`,
      description: item.description,
      url: `${siteConfig.url}/tools/switch-from/${item.slug}`,
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: "0",
      },
      totalTime: item.timeEstimate,
    })),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Tools",
          item: `${siteConfig.url}/tools`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "For Clinicians",
          item: `${siteConfig.url}/tools/for-clinicians`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Migration Guides",
          item: `${siteConfig.url}/tools/switch-from`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/[0.02] via-transparent to-treatment/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Migration Guides</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-destructive/10 text-destructive border-destructive/20">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Software Migration Guides
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  Step-by-step guides for switching your mental health software
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Ready to switch software? These guides cover everything you need: data export procedures,
                contract timing, staff training considerations, and recommended replacements for your
                practice type.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-separator bg-surface p-5 text-center">
                <div className="flex justify-center mb-2">
                  <Clock className="h-6 w-6 text-treatment" />
                </div>
                <div className="text-2xl font-bold text-label-primary">1-4 weeks</div>
                <div className="text-sm text-label-secondary">Typical migration timeline</div>
              </div>
              <div className="rounded-xl border border-separator bg-surface p-5 text-center">
                <div className="flex justify-center mb-2">
                  <Shield className="h-6 w-6 text-treatment" />
                </div>
                <div className="text-2xl font-bold text-label-primary">HIPAA</div>
                <div className="text-sm text-label-secondary">Compliant data transfer</div>
              </div>
              <div className="rounded-xl border border-separator bg-surface p-5 text-center">
                <div className="flex justify-center mb-2">
                  <FileDown className="h-6 w-6 text-treatment" />
                </div>
                <div className="text-2xl font-bold text-label-primary">Export First</div>
                <div className="text-sm text-label-secondary">Always backup before canceling</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Migration Guides */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Popular Migration Guides
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              The most requested switching guides for mental health software
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_SWITCH_FROM.map((item) => {
                const tool = toolMap.get(item.slug);
                const Icon = item.icon;
                const complexity = complexityConfig[item.migrationComplexity];

                return (
                  <Link
                    key={item.slug}
                    href={`/tools/switch-from/${item.slug}`}
                    className="group rounded-xl border border-separator bg-canvas p-5 transition-all hover:border-treatment/30 hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${complexity.bg} ${complexity.color}`}>
                        {complexity.label}
                      </span>
                    </div>

                    <h3 className="font-semibold text-label-primary group-hover:text-treatment transition-colors">
                      Switch from {item.name}
                    </h3>

                    <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-label-tertiary">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.timeEstimate}</span>
                    </div>

                    {tool?.pricing?.starting_price_display && (
                      <p className="mt-2 text-xs text-label-tertiary">
                        Currently paying {tool.pricing.starting_price_display}+/mo?
                      </p>
                    )}

                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-treatment">
                      View guide
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Migration Guides by Category
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">EHR & Practice Management</h3>
                </div>
                <p className="text-xs text-label-tertiary mb-3">Complex migrations - allow 2-4 weeks</p>
                <div className="space-y-2">
                  <Link href="/tools/switch-from/simplepractice" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from SimplePractice
                  </Link>
                  <Link href="/tools/switch-from/therapynotes" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from TherapyNotes
                  </Link>
                  <Link href="/tools/switch-from/jane-app" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Jane App
                  </Link>
                  <Link href="/tools/switch-from/valant" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Valant
                  </Link>
                  <Link href="/tools/switch-from/theranest" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from TheraNest
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">AI Scribes</h3>
                </div>
                <p className="text-xs text-label-tertiary mb-3">Easy migrations - usually 1-3 days</p>
                <div className="space-y-2">
                  <Link href="/tools/switch-from/freed" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Freed
                  </Link>
                  <Link href="/tools/switch-from/mentalyc" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Mentalyc
                  </Link>
                  <Link href="/tools/switch-from/upheal" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Upheal
                  </Link>
                  <Link href="/tools/switch-from/autonotes" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Autonotes
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">Provider Networks</h3>
                </div>
                <p className="text-xs text-label-tertiary mb-3">Moderate complexity - plan for 1-2 weeks</p>
                <div className="space-y-2">
                  <Link href="/tools/switch-from/headway" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Headway
                  </Link>
                  <Link href="/tools/switch-from/alma-provider-platform" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Alma
                  </Link>
                  <Link href="/tools/switch-from/grow-therapy" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Grow Therapy
                  </Link>
                  <Link href="/tools/switch-from/sondermind" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from SonderMind
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Video className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">Telehealth</h3>
                </div>
                <p className="text-xs text-label-tertiary mb-3">Easy to switch - usually same day</p>
                <div className="space-y-2">
                  <Link href="/tools/switch-from/doxy-me" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Doxy.me
                  </Link>
                  <Link href="/tools/switch-from/zoom-for-healthcare" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Zoom Healthcare
                  </Link>
                  <Link href="/tools/switch-from/vsee" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from VSee
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">Billing & RCM</h3>
                </div>
                <p className="text-xs text-label-tertiary mb-3">Moderate complexity - track outstanding AR</p>
                <div className="space-y-2">
                  <Link href="/tools/switch-from/therabill" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from TheraBill
                  </Link>
                  <Link href="/tools/switch-from/office-ally" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Office Ally
                  </Link>
                  <Link href="/tools/switch-from/availity" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Availity
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Stethoscope className="h-5 w-5 text-treatment" />
                  <h3 className="font-semibold text-label-primary">Psychiatry EHRs</h3>
                </div>
                <p className="text-xs text-label-tertiary mb-3">Complex - requires e-Rx transition</p>
                <div className="space-y-2">
                  <Link href="/tools/switch-from/valant" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Valant
                  </Link>
                  <Link href="/tools/switch-from/luminello" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Luminello
                  </Link>
                  <Link href="/tools/switch-from/osmind" className="block text-sm text-label-secondary hover:text-treatment">
                    Switch from Osmind
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Migration Checklist Overview */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              General Migration Checklist
            </h2>

            <div className="rounded-xl border border-separator bg-canvas p-6">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                    1
                  </span>
                  <div>
                    <span className="font-medium text-label-primary">Review your contract</span>
                    <p className="text-sm text-label-secondary mt-0.5">Check cancellation terms, notice periods, and early termination fees</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                    2
                  </span>
                  <div>
                    <span className="font-medium text-label-primary">Export all your data</span>
                    <p className="text-sm text-label-secondary mt-0.5">Download patient records, notes, billing history, and documents before canceling</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                    3
                  </span>
                  <div>
                    <span className="font-medium text-label-primary">Choose your replacement</span>
                    <p className="text-sm text-label-secondary mt-0.5">Use our alternatives pages to compare options for your practice type</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                    4
                  </span>
                  <div>
                    <span className="font-medium text-label-primary">Set up the new system</span>
                    <p className="text-sm text-label-secondary mt-0.5">Import data, configure settings, and test workflows before going live</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                    5
                  </span>
                  <div>
                    <span className="font-medium text-label-primary">Notify stakeholders</span>
                    <p className="text-sm text-label-secondary mt-0.5">Train staff, update patients about portal changes, and update any integrations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                    6
                  </span>
                  <div>
                    <span className="font-medium text-label-primary">Cancel your old subscription</span>
                    <p className="text-sm text-label-secondary mt-0.5">Only after confirming all data has been migrated successfully</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Common Questions */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Common Migration Questions
            </h2>

            <div className="space-y-4">
              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Will I lose my patient data when I switch?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">
                    &#9660;
                  </span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  Most EHRs allow you to export patient data. However, you must export BEFORE canceling
                  your subscription. Once canceled, you may lose access immediately. Each guide above
                  includes specific export instructions for that platform.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  How long does it take to switch EHRs?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">
                    &#9660;
                  </span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  EHR migrations typically take 2-4 weeks, including data export, import, staff training,
                  and a parallel running period. AI scribes and telehealth tools can usually be switched
                  in 1-3 days since they have minimal data migration requirements.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Should I run both systems in parallel?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">
                    &#9660;
                  </span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  For EHR migrations, yes - we recommend running both systems for 1-2 weeks. This
                  ensures you can still access historical data while verifying the new system works
                  correctly. Factor this overlap cost into your migration budget.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Do I need to notify patients?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">
                    &#9660;
                  </span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  If your current software includes a patient portal, yes. Patients will need new login
                  credentials and should be informed about how to access their records. For telehealth
                  changes, send new session links before appointments.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  What about my outstanding claims and AR?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">
                    &#9660;
                  </span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  Export all claims data and track outstanding AR before switching billing systems.
                  You may need to continue accessing the old system to process payments and follow up
                  on pending claims. Some practices keep old billing access for 90+ days after switching.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-6">
            <Link
              href="/tools/alternatives"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Browse alternatives
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools/compare"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Compare tools side-by-side
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tools/pricing"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Pricing comparisons
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/architect"
              className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
            >
              Build your ideal stack
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;
