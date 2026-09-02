/**
 * Switch-From / Migration Page Template
 *
 * Detailed migration guide for switching from a specific product.
 * Highest buyer intent - user is actively looking to replace.
 *
 * URL: /tools/switch-from/[product-slug]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  FileDown,
  Users,
  Shield,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { AlternativeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import { ClinicianToolCard } from "@/components/tools/clinician";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for published products
export async function generateStaticParams() {
  const tools = await ClinicianToolService.loadClinicianTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    return { title: "Product Not Found" };
  }

  // Check if there are enough alternatives to make switching guide useful
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);
  const alternativeCount = categoryTools.filter(t => t.slug !== slug).length;
  const hasSubstantiveContent = alternativeCount >= 3;

  const title = `How to Switch from ${tool.name} | Migration Guide`;
  const description = `Complete guide to switching from ${tool.name}. Learn about data migration, contract timing, what to expect, and find the best replacement for your practice.`;

  return {
    title,
    description,
    keywords: [
      `switch from ${tool.name}`,
      `migrate from ${tool.name}`,
      `leave ${tool.name}`,
      `${tool.name} replacement`,
      `cancel ${tool.name}`,
      `${tool.name} data export`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/tools/switch-from/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/tools/switch-from/${slug}`,
      type: "website",
    },
    // Noindex pages with fewer than 3 alternatives (thin content)
    robots: hasSubstantiveContent ? undefined : { index: false, follow: true },
  };
}

// Migration checklist items by category
function getMigrationChecklist(category: string): string[] {
  const checklistByCategory: Record<string, string[]> = {
    "ehr-practice-management": [
      "Export all patient records and demographics",
      "Download clinical notes and documentation",
      "Export appointment history",
      "Download billing history and outstanding claims",
      "Export patient intake forms and documents",
      "Note all active treatment plans",
      "Document current scheduling preferences",
      "List all active integrations to replicate",
      "Check contract end date and cancellation terms",
      "Notify patients of any portal changes",
    ],
    "ai-scribe-documentation": [
      "Export any saved templates or macros",
      "Download documentation history if available",
      "Note custom settings and preferences",
      "Cancel any active subscriptions",
      "Remove integration from your EHR",
    ],
    "billing-rcm": [
      "Export all claims history",
      "Document outstanding AR",
      "Export payment history",
      "Download ERA/EOB records",
      "Note all payer enrollments",
      "Document fee schedules",
    ],
    "telehealth-communication": [
      "Export session recordings if applicable",
      "Download any saved session notes",
      "Note custom waiting room settings",
      "Update patient communication preferences",
    ],
  };

  return checklistByCategory[category] || [
    "Export all relevant data",
    "Document current settings",
    "Cancel subscription",
    "Remove integrations",
    "Notify stakeholders of change",
  ];
}

// Get migration complexity estimate
function getMigrationComplexity(tool: ClinicianToolV4): {
  level: "easy" | "moderate" | "complex";
  timeEstimate: string;
  considerations: string[];
} {
  // EHRs are generally most complex
  if (tool.primary_category === "ehr-practice-management") {
    return {
      level: "complex",
      timeEstimate: "2-4 weeks",
      considerations: [
        "Patient data migration requires careful handling",
        "Active treatment plans need to be transferred",
        "Staff will need training on new system",
        "May need to run systems in parallel briefly",
      ],
    };
  }

  // Billing/RCM is moderate
  if (tool.primary_category.includes("billing")) {
    return {
      level: "moderate",
      timeEstimate: "1-2 weeks",
      considerations: [
        "Outstanding claims need to be tracked",
        "Payer enrollments may need updating",
        "Payment posting workflows will change",
      ],
    };
  }

  // Most other tools are easier
  return {
    level: "easy",
    timeEstimate: "1-3 days",
    considerations: [
      "Minimal data migration typically required",
      "Integration setup is straightforward",
      "Can often switch immediately",
    ],
  };
}

export default async function SwitchFromPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  // Get alternatives
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);
  const alternatives = categoryTools.filter((t) => t.slug !== slug).slice(0, 6);
  const topAlternatives = alternatives.slice(0, 3);

  const migrationChecklist = getMigrationChecklist(tool.primary_category);
  const migrationComplexity = getMigrationComplexity(tool);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Switch from ${tool.name}`,
    description: `Step-by-step guide to migrating away from ${tool.name}`,
    step: migrationChecklist.map((item, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: item,
    })),
  };

  const complexityColor = {
    easy: "text-success",
    moderate: "text-warning",
    complex: "text-destructive",
  }[migrationComplexity.level];

  const complexityBg = {
    easy: "bg-success/10 border-success/20",
    moderate: "bg-warning/10 border-warning/20",
    complex: "bg-destructive/10 border-destructive/20",
  }[migrationComplexity.level];

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
              <span className="text-label-primary font-medium">Migration Guide</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-destructive/10 text-destructive border-destructive/20">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  How to Switch from {tool.name}
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  Complete migration guide
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Ready to move on from {tool.name}? This guide covers everything you need to know
                about migrating your practice data, timing your switch, and finding the right
                replacement.
              </p>
            </div>
          </div>
        </section>

        {/* Migration Complexity Overview */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className={`rounded-xl border p-6 ${complexityBg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-label-primary flex items-center gap-2">
                    <Clock className={`h-5 w-5 ${complexityColor}`} />
                    Migration Complexity: <span className={`capitalize ${complexityColor}`}>{migrationComplexity.level}</span>
                  </h2>
                  <p className="mt-1 text-label-secondary">
                    Estimated time: {migrationComplexity.timeEstimate}
                  </p>
                </div>
                <Link
                  href={`/tools/alternatives/${slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-treatment px-4 py-2.5 text-sm font-medium text-white hover:bg-treatment-600 transition-colors whitespace-nowrap"
                >
                  Find Replacement
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Key Considerations */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Key Migration Considerations
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {migrationComplexity.considerations.map((consideration, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4"
                >
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-label-secondary">{consideration}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Migration Checklist */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary flex items-center gap-2 mb-6">
              <FileDown className="h-5 w-5 text-treatment" />
              Migration Checklist
            </h2>

            <div className="rounded-xl border border-separator bg-surface p-6">
              <ol className="space-y-4">
                {migrationChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-xs font-semibold text-treatment">
                      {idx + 1}
                    </span>
                    <span className="text-label-primary">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Before You Switch */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Before You Switch
            </h2>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <DollarSign className="h-8 w-8 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Check Your Contract</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Review cancellation terms, notice periods, and any early termination fees.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <Shield className="h-8 w-8 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Backup Your Data</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Export all critical data before canceling. You may lose access immediately.
                </p>
              </div>

              <div className="rounded-xl border border-separator bg-canvas p-5">
                <Users className="h-8 w-8 text-treatment mb-3" />
                <h3 className="font-semibold text-label-primary">Notify Your Team</h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Ensure staff knows about the transition and schedule training time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <AlternativeArchitectCTA switchingFrom={slug} />
          </div>
        </section>

        {/* Top Replacement Options */}
        {topAlternatives.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-2">
                Top Replacement Options
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Popular alternatives practices switch to from {tool.name}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topAlternatives.map((alt) => (
                  <ClinicianToolCard key={alt.slug} tool={alt} />
                ))}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href={`/tools/alternatives/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
                >
                  View all {tool.name} alternatives
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Common Questions About Switching
            </h2>

            <div className="space-y-4">
              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Will I lose my patient data?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  Most EHRs allow you to export patient data in standard formats. However, some systems
                  make this easier than others. Always export your data BEFORE canceling your subscription,
                  as you may lose access immediately upon cancellation.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  How long does migration typically take?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  This varies by system complexity. Simple tools (AI scribes, telehealth) can be switched
                  in days. EHR migrations typically take 2-4 weeks, including data migration, staff training,
                  and a parallel running period.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Do I need to notify patients?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  If your EHR includes a patient portal, yes. Patients will need new login credentials
                  and should be informed of any changes to how they access their information or
                  communicate with your practice.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <Link
              href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${slug}/`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to {tool.name}
            </Link>

            <Link
              href={`/tools/alternatives/${slug}`}
              className="group inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
            >
              View alternatives
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;
