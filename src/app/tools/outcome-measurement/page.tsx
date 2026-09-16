// src/app/tools/outcome-measurement/page.tsx
// Measurement-Based Care / Outcome Measurement Landing Page
// Comprehensive guide to MBC platforms, standalone tools, EHRs with built-in measurement, and DTx

import { Metadata } from "next";
import Link from "next/link";
import {
  LineChart,
  ClipboardCheck,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Shield,
  Brain,
  Clock,
  TrendingUp,
  Users,
  GitCompare,
  ChevronRight,
  BadgeCheck,
  Pill,
  Laptop,
  Activity,
  Heart,
} from "lucide-react";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Best Outcome Measurement Tools for Mental Health (2026)",
  description:
    "Compare the best measurement-based care (MBC) platforms for mental health. PHQ-9, GAD-7 automation, progress tracking, and EHR integration. Improve outcomes by 20-40%.",
  alternates: {
    canonical: `${siteConfig.url}/tools/outcome-measurement/`,
  },
  openGraph: {
    title: "Best Outcome Measurement Tools for Mental Health (2026)",
    description:
      "Compare measurement-based care platforms, standalone assessment tools, EHRs with built-in MBC, and digital therapeutics for mental health practices.",
    url: `${siteConfig.url}/tools/outcome-measurement/`,
    type: "website",
  },
};

// Tool card component for this page
function OutcomeToolCard({ tool }: { tool: ClinicianToolV4 }) {
  // V4 clinician tools use /tools/{slug}/ URL pattern
  const toolUrl = `/tools/${tool.slug}/`;

  return (
    <Link
      href={toolUrl}
      className="group block rounded-xl border border-separator bg-surface p-5 transition-all hover:border-treatment/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-label-primary group-hover:text-treatment transition-colors">
            {tool.name}
          </h3>
          <p className="mt-1 text-sm text-label-secondary line-clamp-2">
            {tool.short_description || tool.one_liner}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-label-quaternary group-hover:text-treatment transition-colors shrink-0 ml-2" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tool.feature_flags.has_measurement && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <Activity className="h-3 w-3" />
            MBC
          </span>
        )}
        {tool.compliance?.hipaa_support === "yes" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            <Shield className="h-3 w-3" />
            HIPAA
          </span>
        )}
        {tool.feature_flags.has_ai && (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
        )}
        {tool.pricing?.free_tier && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Free Tier
          </span>
        )}
      </div>

      {tool.pricing?.starting_price_display && (
        <p className="mt-3 text-xs text-label-tertiary">
          Starting at {tool.pricing.starting_price_display}
        </p>
      )}
    </Link>
  );
}

// Comparison table row component
function ComparisonRow({
  tool,
  features,
}: {
  tool: ClinicianToolV4;
  features: {
    assessmentLibrary: string;
    automatedScoring: boolean;
    progressTracking: boolean;
    ehrIntegration: boolean | string;
    pricing: string;
  };
}) {
  return (
    <tr className="border-b border-separator last:border-0">
      <td className="py-3 pr-4">
        <Link
          href={`/tools/${tool.slug}/`}
          className="font-medium text-label-primary hover:text-treatment"
        >
          {tool.name}
        </Link>
      </td>
      <td className="py-3 px-4 text-sm text-label-secondary">{features.assessmentLibrary}</td>
      <td className="py-3 px-4 text-center">
        {features.automatedScoring ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
        ) : (
          <span className="text-label-quaternary">-</span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {features.progressTracking ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
        ) : (
          <span className="text-label-quaternary">-</span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {typeof features.ehrIntegration === "boolean" ? (
          features.ehrIntegration ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
          ) : (
            <span className="text-label-quaternary">-</span>
          )
        ) : (
          <span className="text-xs text-label-secondary">{features.ehrIntegration}</span>
        )}
      </td>
      <td className="py-3 pl-4 text-sm text-label-secondary">{features.pricing}</td>
    </tr>
  );
}

export default async function OutcomeMeasurementPage() {
  // Load all measurement-outcomes-dtx tools
  const allMbcTools = await ClinicianToolService.getByCategory("measurement-outcomes-dtx");

  // Categorize tools
  const standaloneMbcTools = allMbcTools.filter(
    (t) => !t.feature_flags.has_ehr && t.feature_flags.has_measurement
  );

  const dtxTools = allMbcTools.filter(
    (t) =>
      t.name.toLowerCase().includes("dtx") ||
      t.name.toLowerCase().includes("therapeutic") ||
      t.short_description?.toLowerCase().includes("dtx") ||
      t.short_description?.toLowerCase().includes("digital therapeutic") ||
      t.short_description?.toLowerCase().includes("fda") ||
      // Known DTx products
      ["woebot", "wysa", "happify", "sleepio", "daylight", "endeavorrx", "freespira"].some(
        (dtx) => t.slug.includes(dtx)
      )
  );

  // Get EHRs with built-in measurement (from ehr category with measurement flag)
  const ehrTools = await ClinicianToolService.getByCategory("ehr-practice-management");
  const ehrsWithMeasurement = ehrTools.filter(
    (t) => t.feature_flags.has_measurement || t.secondary_categories?.includes("measurement-outcomes-dtx")
  );

  // Top MBC platforms (featured or high data quality)
  const topMbcTools = allMbcTools
    .filter((t) => t.featured || (t.governance?.data_quality_score && t.governance.data_quality_score >= 85))
    .slice(0, 6);

  // Prepare comparison data
  const comparisonTools = [
    ...topMbcTools.slice(0, 4),
    ...ehrsWithMeasurement.slice(0, 2),
  ];

  // Generate structured data
  const structuredData = generateStructuredData(allMbcTools);

  return (
    <>
      {/* Structured Data */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-canvas">
        {/* Hero Section */}
        <section className="bg-surface border-b border-separator">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-accent transition-colors"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link
                href="/tools/for-clinicians/"
                className="text-label-secondary hover:text-accent transition-colors"
              >
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Outcome Measurement</span>
            </nav>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-50 p-3">
                <LineChart className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                  Measurement-Based Care
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Best Outcome Measurement Tools for Mental Health (2026)
                </h1>
                <p className="mt-2 text-sm text-label-tertiary">
                  {allMbcTools.length}+ tools reviewed
                </p>
              </div>
            </div>

            {/* Direct Answer Block */}
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                <strong>Measurement-based care (MBC)</strong> improves patient outcomes by 20-40% through
                routine assessment and progress tracking. The best MBC tools for mental health include
                standalone platforms like <strong>Blueprint</strong>, <strong>Greenspace Health</strong>,
                and <strong>Mirah</strong>, plus EHRs with built-in measurement like{" "}
                <strong>Valant</strong> and <strong>SimplePractice</strong>. Key features to compare:
                assessment library size, automated delivery, progress visualization, and EHR integration.
              </p>
            </div>

            <p className="mt-4 max-w-3xl text-label-secondary">
              This guide covers standalone MBC platforms, EHRs with built-in outcome tracking, and
              digital therapeutics (DTx) with measurement capabilities. Whether you're implementing MBC
              for the first time or upgrading your current setup, we help you find the right tool for
              your practice.
            </p>
          </div>
        </section>

        {/* Why MBC Matters */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary">
              Why Measurement-Based Care Matters
            </h2>
            <p className="mt-2 text-label-secondary max-w-3xl">
              Research consistently shows that tracking patient progress with standardized assessments
              leads to better outcomes and more efficient care.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">20-40%</span>
                </div>
                <p className="text-sm text-label-secondary">
                  Better outcomes when using MBC versus treatment as usual
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">3.5x</span>
                </div>
                <p className="text-sm text-label-secondary">
                  More likely to achieve clinically significant change with MBC
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">40%</span>
                </div>
                <p className="text-sm text-label-secondary">
                  Reduction in no-shows and cancellations with assessment reminders
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <BadgeCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">+25%</span>
                </div>
                <p className="text-sm text-label-secondary">
                  Additional revenue potential via CPT codes for outcome tracking
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compare Top Tools CTA */}
        {comparisonTools.length >= 2 && (
          <section className="border-b border-separator bg-surface px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-3">
                  <GitCompare className="h-5 w-5 text-label-tertiary" />
                  <div>
                    <p className="font-medium text-label-primary">Compare MBC Platforms</p>
                    <p className="text-sm text-label-secondary">
                      Side-by-side comparison of top outcome measurement tools
                    </p>
                  </div>
                </div>
                <Link
                  href={`/tools/compare/?tools=${topMbcTools
                    .slice(0, 4)
                    .map((t) => t.slug)
                    .join(",")}`}
                  className="group flex items-center gap-2 rounded-lg bg-treatment px-4 py-2 text-sm font-medium text-treatment-foreground transition-all hover:bg-treatment-600"
                >
                  Compare tools
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Top MBC Platforms */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardCheck className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-label-primary">
                Top Measurement-Based Care Platforms
              </h2>
            </div>
            <p className="text-label-secondary mb-6 max-w-3xl">
              Standalone MBC platforms specialize in outcome measurement with extensive assessment
              libraries, automated delivery, and deep EHR integrations. Ideal for practices wanting
              best-in-class measurement capabilities.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topMbcTools.map((tool) => (
                <OutcomeToolCard key={tool.slug} tool={tool} />
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/tools/for-clinicians/measurement-outcomes/"
                className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
              >
                View all {standaloneMbcTools.length}+ MBC platforms
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* EHRs with Built-in Measurement */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-2">
              <Laptop className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-label-primary">
                EHRs with Built-in Measurement
              </h2>
            </div>
            <p className="text-label-secondary mb-6 max-w-3xl">
              Many mental health EHRs now include outcome measurement features, offering a unified
              workflow without separate MBC software. Good for practices wanting simplicity over
              specialized MBC capabilities.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ehrsWithMeasurement.slice(0, 6).map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}/`}
                  className="group flex items-center gap-4 rounded-xl border border-separator bg-canvas p-4 transition-all hover:border-treatment/30 hover:shadow-md"
                >
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Laptop className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-label-primary group-hover:text-treatment truncate">
                      {tool.name}
                    </p>
                    <p className="text-xs text-label-tertiary">
                      {tool.feature_flags.has_measurement && "Built-in MBC"}
                      {tool.feature_flags.has_telehealth && " + Telehealth"}
                      {tool.feature_flags.has_e_prescribing && " + e-Rx"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-label-quaternary group-hover:text-treatment shrink-0" />
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/tools/for-clinicians/ehr-practice-management/"
                className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
              >
                Browse all mental health EHRs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Digital Therapeutics */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-label-primary">
                Digital Therapeutics (DTx) with Measurement
              </h2>
            </div>
            <p className="text-label-secondary mb-6 max-w-3xl">
              Digital therapeutics combine evidence-based interventions with outcome tracking. Many
              offer clinician dashboards to monitor patient progress on prescribed digital treatments.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dtxTools.slice(0, 6).map((tool) => (
                <OutcomeToolCard key={tool.slug} tool={tool} />
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/tools/for-clinicians/digital-therapeutics/"
                className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
              >
                Explore digital therapeutics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Feature Comparison: Top MBC Tools
            </h2>
            <p className="text-label-secondary mb-6">
              Key features to evaluate when choosing an outcome measurement platform.
            </p>

            <div className="overflow-x-auto rounded-xl border border-separator bg-canvas">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-separator bg-surface/50">
                    <th className="py-3 pr-4 pl-4 text-left text-sm font-medium text-label-secondary">
                      Tool
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-label-secondary">
                      Assessment Library
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-label-secondary">
                      Auto Scoring
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-label-secondary">
                      Progress Tracking
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-label-secondary">
                      EHR Integration
                    </th>
                    <th className="py-3 pl-4 pr-4 text-left text-sm font-medium text-label-secondary">
                      Pricing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    tool={{ name: "Blueprint", slug: "blueprint" } as ClinicianToolV4}
                    features={{
                      assessmentLibrary: "PHQ-9, GAD-7, PCL-5, C-SSRS",
                      automatedScoring: true,
                      progressTracking: true,
                      ehrIntegration: true,
                      pricing: "Free EHR + $0.99/session AI",
                    }}
                  />
                  <ComparisonRow
                    tool={{ name: "Greenspace Health", slug: "greenspace-health" } as ClinicianToolV4}
                    features={{
                      assessmentLibrary: "300+ assessments",
                      automatedScoring: true,
                      progressTracking: true,
                      ehrIntegration: "85+ EHRs",
                      pricing: "From $24.99/mo",
                    }}
                  />
                  <ComparisonRow
                    tool={{ name: "Mirah", slug: "mirah" } as ClinicianToolV4}
                    features={{
                      assessmentLibrary: "400+ measures + CAMS",
                      automatedScoring: true,
                      progressTracking: true,
                      ehrIntegration: true,
                      pricing: "$75/provider/mo",
                    }}
                  />
                  <ComparisonRow
                    tool={{ name: "NeuroFlow", slug: "neuroflow" } as ClinicianToolV4}
                    features={{
                      assessmentLibrary: "400+ assessments",
                      automatedScoring: true,
                      progressTracking: true,
                      ehrIntegration: true,
                      pricing: "Enterprise custom",
                    }}
                  />
                  <ComparisonRow
                    tool={{ name: "Valant (EHR)", slug: "valant" } as ClinicianToolV4}
                    features={{
                      assessmentLibrary: "PHQ-9, GAD-7, more",
                      automatedScoring: true,
                      progressTracking: true,
                      ehrIntegration: "Built-in",
                      pricing: "$100-300/provider/mo",
                    }}
                  />
                  <ComparisonRow
                    tool={{ name: "SimplePractice (EHR)", slug: "simplepractice" } as ClinicianToolV4}
                    features={{
                      assessmentLibrary: "Basic measures",
                      automatedScoring: true,
                      progressTracking: true,
                      ehrIntegration: "Built-in",
                      pricing: "From $49/mo",
                    }}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How to Choose */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              How to Choose an Outcome Measurement Tool
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-separator bg-surface p-6">
                <h3 className="font-semibold text-label-primary mb-3">
                  Choose a Standalone MBC Platform If:
                </h3>
                <ul className="space-y-2 text-sm text-label-secondary">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    You need 100+ validated assessments beyond PHQ-9/GAD-7
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    Your organization requires population-level analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    You want bidirectional EHR integration (Epic, Cerner, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    MBC is a strategic priority requiring specialized support
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-separator bg-surface p-6">
                <h3 className="font-semibold text-label-primary mb-3">
                  Choose EHR with Built-in Measurement If:
                </h3>
                <ul className="space-y-2 text-sm text-label-secondary">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    You want a single platform for all practice needs
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    Basic assessments (PHQ-9, GAD-7) meet your clinical needs
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    You're a solo or small group practice
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    Simplicity and unified workflow are priorities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Common Assessments */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Common Mental Health Assessments
            </h2>
            <p className="text-label-secondary mb-6">
              Most MBC platforms support these validated assessment instruments.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h3 className="font-medium text-label-primary">PHQ-9</h3>
                </div>
                <p className="text-sm text-label-secondary">
                  Patient Health Questionnaire for depression screening and monitoring. 9 items.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-label-primary">GAD-7</h3>
                </div>
                <p className="text-sm text-label-secondary">
                  Generalized Anxiety Disorder scale. 7 items for anxiety severity.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <h3 className="font-medium text-label-primary">Columbia (C-SSRS)</h3>
                </div>
                <p className="text-sm text-label-secondary">
                  Columbia Suicide Severity Rating Scale for suicide risk assessment.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-medium text-label-primary">PCL-5</h3>
                </div>
                <p className="text-sm text-label-secondary">
                  PTSD Checklist for DSM-5. 20 items measuring trauma symptoms.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  <h3 className="font-medium text-label-primary">ORS/SRS</h3>
                </div>
                <p className="text-sm text-label-secondary">
                  Outcome Rating Scale and Session Rating Scale. Session-by-session feedback.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="h-4 w-4 text-teal-600" />
                  <h3 className="font-medium text-label-primary">AUDIT/DAST</h3>
                </div>
                <p className="text-sm text-label-secondary">
                  Alcohol and Drug screening instruments for substance use assessment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: "What is measurement-based care (MBC)?",
                  a: "Measurement-based care involves routinely administering standardized assessments (like PHQ-9, GAD-7) to track patient progress and inform treatment decisions. Research shows MBC improves outcomes by 20-40% and helps identify patients who aren't responding to treatment.",
                },
                {
                  q: "How often should I assess patients?",
                  a: "Research supports session-by-session feedback for therapeutic alliance measures (ORS/SRS) or every 4-6 sessions for symptom measures (PHQ-9, GAD-7). More frequent measurement catches treatment non-response earlier. Find a cadence that works for your workflow without causing assessment fatigue.",
                },
                {
                  q: "Do I need a separate MBC platform if my EHR has assessments?",
                  a: "It depends on your needs. EHR-integrated assessments work well for basic PHQ-9/GAD-7 tracking. Standalone MBC platforms offer larger assessment libraries (100-400+ measures), better visualization, population analytics, and deeper integrations. Organizations prioritizing MBC often benefit from specialized platforms.",
                },
                {
                  q: "Can I bill for outcome measurement?",
                  a: "Yes, several CPT codes support MBC billing. Commonly used codes include 96127 (brief emotional/behavioral assessment), 96136-96139 (psychological test administration/scoring), and collaborative care codes (99492-99494) which require outcome tracking. Check payer-specific requirements.",
                },
                {
                  q: "Are MBC platforms HIPAA compliant?",
                  a: "Reputable MBC platforms are HIPAA compliant and provide Business Associate Agreements (BAAs). Key questions to ask: Is PHI used to train AI models? Where is data stored? What encryption is used? Always verify compliance before implementation.",
                },
                {
                  q: "What's the ROI of implementing MBC?",
                  a: "MBC ROI includes: improved clinical outcomes (20-40%), reduced no-shows (up to 40% reduction), additional reimbursement via CPT codes, and value-based care contract performance. Some organizations report recouping MBC platform costs within months through improved outcomes and billing.",
                },
              ].map((faq, index) => (
                <div key={index} className="rounded-xl border border-separator bg-surface p-5">
                  <h3 className="font-medium text-label-primary">{faq.q}</h3>
                  <p className="mt-2 text-sm text-label-secondary">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Categories */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-label-primary mb-4">Related Categories</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tools/for-clinicians/ehr-practice-management/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                <Laptop className="h-4 w-4" />
                EHR & Practice Management
              </Link>
              <Link
                href="/tools/for-clinicians/patient-engagement/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                <Heart className="h-4 w-4" />
                Patient Engagement
              </Link>
              <Link
                href="/tools/for-clinicians/digital-therapeutics/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Digital Therapeutics
              </Link>
              <Link
                href="/tools/for-clinicians/analytics-reporting/"
                className="inline-flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
              >
                <LineChart className="h-4 w-4" />
                Analytics & Reporting
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Signal */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-separator rounded-full">
              <Shield className="h-5 w-5 text-label-tertiary" />
              <span className="text-sm font-medium text-label-secondary">
                Verify compliance directly with vendors before use
              </span>
            </div>
          </div>
        </section>

        {/* Vendor CTA */}
        <section className="bg-surface border-t border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Building2 className="mx-auto h-10 w-10 text-label-tertiary mb-4" />
            <h2 className="text-xl font-semibold text-label-primary">
              Are You an MBC Platform Vendor?
            </h2>
            <p className="mt-2 text-label-secondary max-w-2xl mx-auto">
              Get your outcome measurement tool listed and reviewed by our editorial team to reach
              mental health clinicians actively searching for MBC solutions.
            </p>
            <div className="mt-6">
              <Link
                href="/tools/list-your-tool/"
                className="inline-flex items-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-treatment-foreground transition-all hover:bg-treatment-600"
              >
                List Your Tool
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// Generate structured data for SEO
function generateStructuredData(tools: ClinicianToolV4[]): object[] {
  const schemas: object[] = [];
  const currentYear = new Date().getFullYear();
  const recentDate = new Date().toISOString();

  // BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: `${siteConfig.url}/tools/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: `${siteConfig.url}/tools/for-clinicians/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Outcome Measurement",
        item: `${siteConfig.url}/tools/outcome-measurement/`,
      },
    ],
  });

  // FAQPage
  schemas.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is measurement-based care (MBC)?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Measurement-based care involves routinely administering standardized assessments (like PHQ-9, GAD-7) to track patient progress and inform treatment decisions. Research shows MBC improves outcomes by 20-40%.",
        },
      },
      {
        "@type": "Question",
        name: "What are the best MBC platforms for mental health?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Top measurement-based care platforms include Blueprint (free EHR + AI), Greenspace Health (300+ assessments), Mirah (pediatric-optimized), and NeuroFlow (enterprise). Many EHRs like Valant and SimplePractice also include built-in outcome tracking.",
        },
      },
      {
        "@type": "Question",
        name: "Can I bill for outcome measurement?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, CPT codes 96127 (brief assessment), 96136-96139 (psychological testing), and collaborative care codes (99492-99494) support billing for outcome measurement. Check payer-specific requirements.",
        },
      },
    ],
  });

  // ItemList
  if (tools.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best Outcome Measurement Tools for Mental Health (${currentYear})`,
      description:
        "Compare measurement-based care platforms for mental health clinicians",
      numberOfItems: tools.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: tools.slice(0, 10).map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: `${siteConfig.url}/tools/${tool.slug}/`,
      })),
    });
  }

  // Article
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Best Outcome Measurement Tools for Mental Health (${currentYear})`,
    description:
      "Compare the best measurement-based care (MBC) platforms for mental health. PHQ-9, GAD-7 automation, progress tracking, and EHR integration.",
    datePublished: `${currentYear}-01-01T00:00:00Z`,
    dateModified: recentDate,
    author: {
      "@type": "Organization",
      name: "HeyPsych Editorial Team",
      url: `${siteConfig.url}/about/`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/tools/outcome-measurement/`,
    },
  });

  // MedicalWebPage
  schemas.push({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Outcome Measurement Tools for Mental Health Professionals",
    specialty: "Psychiatry",
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Clinician",
    },
    lastReviewed: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
  });

  return schemas;
}

export const revalidate = 86400; // 24 hours
