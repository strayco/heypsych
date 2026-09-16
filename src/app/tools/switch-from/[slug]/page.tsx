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
  Building2,
  User,
  Stethoscope,
  Database,
  Download,
  Upload,
  Calendar,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY, CLINICIAN_PRODUCT_CATEGORY_LABELS } from "@/lib/schemas/clinician-tool-v4";
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

// Detailed migration checklist items by category with phases
interface MigrationPhase {
  title: string;
  items: string[];
}

function getMigrationPhases(category: string): MigrationPhase[] {
  const phasesByCategory: Record<string, MigrationPhase[]> = {
    "ehr-practice-management": [
      {
        title: "Phase 1: Data Export (Week 1)",
        items: [
          "Export all patient demographics and contact information",
          "Download complete clinical notes and progress notes",
          "Export treatment plans and care plans",
          "Download intake forms, assessments, and uploaded documents",
          "Export appointment history and scheduling data",
          "Download billing history, superbills, and outstanding claims",
          "Export insurance/payer information for each patient",
        ],
      },
      {
        title: "Phase 2: New System Setup (Week 2)",
        items: [
          "Import patient demographics into new system",
          "Configure practice settings, locations, and providers",
          "Set up fee schedules and billing codes",
          "Create note templates and documentation workflows",
          "Configure appointment types and scheduling rules",
          "Set up insurance/payer information",
          "Test patient portal and communication features",
        ],
      },
      {
        title: "Phase 3: Transition (Weeks 3-4)",
        items: [
          "Run both systems in parallel for 1-2 weeks",
          "Train staff on new workflows and features",
          "Notify patients of portal changes with new login instructions",
          "Update website and marketing materials with new portal links",
          "Verify all integrations are working (labs, e-Rx, clearinghouse)",
          "Confirm data integrity by spot-checking patient records",
          "Cancel old subscription only after full verification",
        ],
      },
    ],
    "ai-scribe-documentation": [
      {
        title: "Data Export",
        items: [
          "Export any saved note templates or custom prompts",
          "Download documentation history if available",
          "Screenshot or document any custom settings",
        ],
      },
      {
        title: "New System Setup",
        items: [
          "Install new AI scribe and connect to your EHR",
          "Configure note format preferences and templates",
          "Test with a few sessions before going live",
          "Remove old AI scribe integration from EHR",
        ],
      },
      {
        title: "Completion",
        items: [
          "Cancel old subscription",
          "Delete stored data from old provider if required",
        ],
      },
    ],
    "billing-rcm-insurance": [
      {
        title: "Phase 1: Financial Snapshot",
        items: [
          "Export complete claims history (at least 12 months)",
          "Document all outstanding accounts receivable by payer",
          "Export payment history and ERA/EOB records",
          "Download current fee schedules",
          "List all active payer enrollments and credentials",
          "Note any pending prior authorizations",
        ],
      },
      {
        title: "Phase 2: Transition Setup",
        items: [
          "Set up new billing system with your fee schedules",
          "Configure payer information and enrollment status",
          "Import patient insurance information",
          "Set up clearinghouse connection",
          "Test claim submission with a few test claims",
        ],
      },
      {
        title: "Phase 3: AR Management",
        items: [
          "Continue following up on old claims through previous system",
          "Submit new claims through new system only",
          "Keep access to old system for 90+ days for payment posting",
          "Reconcile all outstanding AR before fully transitioning",
        ],
      },
    ],
    "telehealth-communication": [
      {
        title: "Preparation",
        items: [
          "Export session recordings if applicable and permitted",
          "Document custom waiting room branding/settings",
          "Note any custom forms or intake workflows",
        ],
      },
      {
        title: "Setup & Go Live",
        items: [
          "Set up new telehealth platform",
          "Configure waiting room and session settings",
          "Test video/audio quality thoroughly",
          "Update appointment confirmations with new links",
          "Send patients new session links before appointments",
          "Cancel old subscription",
        ],
      },
    ],
    "provider-network-virtual-care": [
      {
        title: "Phase 1: Preparation",
        items: [
          "Review your contract terms and notice period",
          "Document all insurance panels you're credentialed with through the network",
          "List your current patient panel from the network",
          "Understand which patients you can keep vs. network-only",
        ],
      },
      {
        title: "Phase 2: Credentialing",
        items: [
          "Begin direct credentialing with insurance payers (this takes 60-120 days)",
          "Or sign up with alternative network/platform",
          "Set up your own billing system if going independent",
          "Notify patients of changes and transition timeline",
        ],
      },
      {
        title: "Phase 3: Transition",
        items: [
          "Transfer eligible patients to your independent practice",
          "Update your Psychology Today and directory listings",
          "Remove network branding from your materials",
          "Complete off-boarding with the network",
        ],
      },
    ],
    "credentialing-workforce": [
      {
        title: "Data Export",
        items: [
          "Export all credentialing documents and certificates",
          "Download license and certification copies",
          "Export payer enrollment status for all providers",
          "Document CAQH profile information",
        ],
      },
      {
        title: "Transition",
        items: [
          "Set up new credentialing system",
          "Import provider information and documents",
          "Link to CAQH profiles",
          "Verify all expiration dates are correctly set",
          "Cancel old subscription",
        ],
      },
    ],
  };

  return phasesByCategory[category] || [
    {
      title: "Data Export",
      items: [
        "Export all relevant data and documents",
        "Document current settings and configurations",
        "List all active integrations",
      ],
    },
    {
      title: "Transition",
      items: [
        "Set up replacement system",
        "Import data and configure settings",
        "Test thoroughly before going live",
        "Notify relevant stakeholders",
        "Cancel old subscription",
      ],
    },
  ];
}

// Legacy function for simple checklist (used in structured data)
function getMigrationChecklist(category: string): string[] {
  const phases = getMigrationPhases(category);
  return phases.flatMap(phase => phase.items);
}

// Get migration complexity estimate
function getMigrationComplexity(tool: ClinicianToolV4): {
  level: "easy" | "moderate" | "complex";
  timeEstimate: string;
  considerations: string[];
  dataExportNotes: string[];
  dataImportNotes: string[];
} {
  // EHRs are generally most complex
  if (tool.primary_category === "ehr-practice-management") {
    return {
      level: "complex",
      timeEstimate: "2-4 weeks",
      considerations: [
        "Patient data migration requires careful HIPAA-compliant handling",
        "Active treatment plans need to be transferred completely",
        "Staff will need comprehensive training on new system",
        "Plan to run systems in parallel for 1-2 weeks",
        "Patient portal changes require clear communication to patients",
      ],
      dataExportNotes: [
        "Most EHRs export to CSV, PDF, or CCD/C-CDA formats",
        "Request a complete data export - don't rely on individual record downloads",
        "Export BEFORE canceling - you may lose access immediately",
        "Keep exports for 7+ years per HIPAA requirements",
      ],
      dataImportNotes: [
        "Many EHRs offer free migration assistance for new customers",
        "CSV imports typically work for demographics; notes may need manual entry",
        "Ask about CCD/C-CDA import support for clinical data",
        "Budget 2-5 hours for data verification after import",
      ],
    };
  }

  // Billing/RCM is moderate
  if (tool.primary_category.includes("billing")) {
    return {
      level: "moderate",
      timeEstimate: "1-2 weeks",
      considerations: [
        "Outstanding claims need to be tracked until fully paid",
        "Payer enrollments may need updating with new clearinghouse",
        "Payment posting workflows will change",
        "Keep old system access for 90+ days for AR follow-up",
      ],
      dataExportNotes: [
        "Export claims history as CSV for reference",
        "Document all outstanding AR by payer and patient",
        "Save ERA/EOB records for reconciliation",
        "Export fee schedules to replicate in new system",
      ],
      dataImportNotes: [
        "Set up fee schedules before processing claims",
        "Configure clearinghouse connection and test with a few claims",
        "Import patient insurance information carefully",
        "Verify payer IDs match between old and new systems",
      ],
    };
  }

  // Provider networks are moderate complexity
  if (tool.primary_category === "provider-network-virtual-care") {
    return {
      level: "moderate",
      timeEstimate: "2-4 months (credentialing dependent)",
      considerations: [
        "Direct insurance credentialing takes 60-120 days",
        "Some patients may not be able to follow you",
        "You'll need your own billing solution",
        "Review contract for non-compete or patient ownership clauses",
      ],
      dataExportNotes: [
        "Document which insurance panels you're credentialed through",
        "Export your patient list if permitted",
        "Save all session notes and documentation",
        "Screenshot any performance metrics or reviews",
      ],
      dataImportNotes: [
        "Contact insurers directly to transfer credentialing",
        "Set up your own practice profile on directories",
        "Import patient contact info to your own system",
        "Consider platforms like Alma or Headway if not going fully independent",
      ],
    };
  }

  // AI scribes and telehealth are easiest
  if (tool.primary_category === "ai-scribe-documentation" ||
      tool.primary_category === "telehealth-communication") {
    return {
      level: "easy",
      timeEstimate: "1-3 days",
      considerations: [
        "Minimal data migration typically required",
        "Integration setup is straightforward",
        "Can often switch immediately",
        "Test thoroughly with a few sessions before going fully live",
      ],
      dataExportNotes: [
        "Export any saved templates or custom settings",
        "Download documentation history if you want records",
        "Most data stays in your EHR, not the tool itself",
      ],
      dataImportNotes: [
        "Set up new tool and configure preferences",
        "Recreate any custom templates",
        "Connect to your EHR and test the integration",
      ],
    };
  }

  // Default for other categories
  return {
    level: "easy",
    timeEstimate: "1-3 days",
    considerations: [
      "Minimal data migration typically required",
      "Integration setup is straightforward",
      "Can often switch immediately",
    ],
    dataExportNotes: [
      "Export any relevant data or settings",
      "Document custom configurations",
    ],
    dataImportNotes: [
      "Set up new tool with your preferences",
      "Test before fully transitioning",
    ],
  };
}

// Get practice-type based recommendations
function getPracticeTypeRecommendations(tool: ClinicianToolV4, alternatives: ClinicianToolV4[]): {
  solo: ClinicianToolV4[];
  groupSmall: ClinicianToolV4[];
  groupLarge: ClinicianToolV4[];
  psychiatry: ClinicianToolV4[];
} {
  const solo = alternatives.filter(t =>
    t.audiences?.organization_sizes?.includes("solo") ||
    t.pricing?.price_range === "budget"
  ).slice(0, 3);

  const groupSmall = alternatives.filter(t =>
    t.audiences?.organization_sizes?.includes("small-2-10") ||
    t.pricing?.price_range === "mid-market"
  ).slice(0, 3);

  const groupLarge = alternatives.filter(t =>
    t.audiences?.organization_sizes?.includes("enterprise-200-plus") ||
    t.pricing?.price_range === "enterprise"
  ).slice(0, 3);

  const psychiatry = alternatives.filter(t =>
    t.audiences?.clinician_roles?.includes("psychiatrist") ||
    t.feature_flags?.has_e_prescribing ||
    t.capabilities?.some(c => c.toLowerCase().includes("prescrib"))
  ).slice(0, 3);

  return { solo, groupSmall, groupLarge, psychiatry };
}

export default async function SwitchFromPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await ClinicianToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  // Get alternatives
  const categoryTools = await ClinicianToolService.getByCategory(tool.primary_category);
  const alternatives = categoryTools.filter((t) => t.slug !== slug).slice(0, 12);
  const topAlternatives = alternatives.slice(0, 3);

  const migrationPhases = getMigrationPhases(tool.primary_category);
  const migrationChecklist = getMigrationChecklist(tool.primary_category);
  const migrationComplexity = getMigrationComplexity(tool);
  const practiceRecommendations = getPracticeTypeRecommendations(tool, alternatives);

  // Get category display name
  const categoryLabel = CLINICIAN_PRODUCT_CATEGORY_LABELS[tool.primary_category] || tool.primary_category;

  // Enhanced structured data with more detail
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Switch from ${tool.name}`,
    description: `Complete step-by-step guide to migrating away from ${tool.name}. Covers data export, system setup, and transition best practices.`,
    totalTime: migrationComplexity.timeEstimate,
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    step: migrationPhases.flatMap((phase, phaseIdx) =>
      phase.items.map((item, itemIdx) => ({
        "@type": "HowToStep",
        position: phaseIdx * 10 + itemIdx + 1,
        name: item,
        itemListElement: {
          "@type": "HowToDirection",
          text: item,
        },
      }))
    ),
    tool: [
      {
        "@type": "HowToTool",
        name: "Data export from " + tool.name,
      },
      {
        "@type": "HowToTool",
        name: "New " + categoryLabel + " software",
      },
    ],
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
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
      {
        "@type": "ListItem",
        position: 4,
        name: `Switch from ${tool.name}`,
        item: `${siteConfig.url}/tools/switch-from/${slug}`,
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <div className="min-h-screen bg-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-linear-to-br from-destructive/2 via-transparent to-treatment/2" />
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
              <Link href="/tools/switch-from/" className="text-label-secondary hover:text-treatment">
                Migration Guides
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">{tool.name}</span>
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

        {/* Migration Checklist - Phased Approach */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary flex items-center gap-2 mb-6">
              <FileDown className="h-5 w-5 text-treatment" />
              Step-by-Step Migration Checklist
            </h2>

            <div className="space-y-6">
              {migrationPhases.map((phase, phaseIdx) => (
                <div key={phaseIdx} className="rounded-xl border border-separator bg-surface overflow-hidden">
                  <div className="bg-treatment/5 border-b border-separator px-6 py-3">
                    <h3 className="font-semibold text-label-primary flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment text-xs font-semibold text-white">
                        {phaseIdx + 1}
                      </span>
                      {phase.title}
                    </h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {phase.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-treatment shrink-0 mt-0.5" />
                          <span className="text-label-secondary">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Export/Import Considerations */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary flex items-center gap-2 mb-6">
              <Database className="h-5 w-5 text-treatment" />
              Data Migration Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Export Notes */}
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="h-6 w-6 text-destructive" />
                  <h3 className="font-semibold text-label-primary">Exporting from {tool.name}</h3>
                </div>
                <ul className="space-y-3">
                  {migrationComplexity.dataExportNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-label-secondary">
                      <span className="text-destructive mt-1">&#8226;</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Import Notes */}
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="h-6 w-6 text-success" />
                  <h3 className="font-semibold text-label-primary">Importing to New System</h3>
                </div>
                <ul className="space-y-3">
                  {migrationComplexity.dataImportNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-label-secondary">
                      <span className="text-success mt-1">&#8226;</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
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

        {/* Recommendations by Practice Type */}
        {(practiceRecommendations.solo.length > 0 || practiceRecommendations.groupSmall.length > 0 || practiceRecommendations.psychiatry.length > 0) && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-2">
                Recommended Replacements by Practice Type
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Find the best {tool.name} alternative for your specific practice
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Solo Practice */}
                {practiceRecommendations.solo.length > 0 && (
                  <div className="rounded-xl border border-separator bg-surface p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="h-5 w-5 text-treatment" />
                      <h3 className="font-semibold text-label-primary">Solo Practice</h3>
                    </div>
                    <div className="space-y-3">
                      {practiceRecommendations.solo.map((alt) => (
                        <Link
                          key={alt.slug}
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`}
                          className="block text-sm text-label-secondary hover:text-treatment"
                        >
                          {alt.name}
                          {alt.pricing?.starting_price_display && (
                            <span className="text-xs text-label-quaternary ml-1">
                              ({alt.pricing.starting_price_display})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Small Group */}
                {practiceRecommendations.groupSmall.length > 0 && (
                  <div className="rounded-xl border border-separator bg-surface p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-5 w-5 text-treatment" />
                      <h3 className="font-semibold text-label-primary">Small Group (2-10)</h3>
                    </div>
                    <div className="space-y-3">
                      {practiceRecommendations.groupSmall.map((alt) => (
                        <Link
                          key={alt.slug}
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`}
                          className="block text-sm text-label-secondary hover:text-treatment"
                        >
                          {alt.name}
                          {alt.pricing?.starting_price_display && (
                            <span className="text-xs text-label-quaternary ml-1">
                              ({alt.pricing.starting_price_display})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Large Group / Enterprise */}
                {practiceRecommendations.groupLarge.length > 0 && (
                  <div className="rounded-xl border border-separator bg-surface p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="h-5 w-5 text-treatment" />
                      <h3 className="font-semibold text-label-primary">Large Group (10+)</h3>
                    </div>
                    <div className="space-y-3">
                      {practiceRecommendations.groupLarge.map((alt) => (
                        <Link
                          key={alt.slug}
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`}
                          className="block text-sm text-label-secondary hover:text-treatment"
                        >
                          {alt.name}
                          {alt.pricing?.starting_price_display && (
                            <span className="text-xs text-label-quaternary ml-1">
                              ({alt.pricing.starting_price_display})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Psychiatry */}
                {practiceRecommendations.psychiatry.length > 0 && (
                  <div className="rounded-xl border border-separator bg-surface p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Stethoscope className="h-5 w-5 text-treatment" />
                      <h3 className="font-semibold text-label-primary">Psychiatry</h3>
                    </div>
                    <div className="space-y-3">
                      {practiceRecommendations.psychiatry.map((alt) => (
                        <Link
                          key={alt.slug}
                          href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[alt.primary_category] || alt.primary_category}/${alt.slug}/`}
                          className="block text-sm text-label-secondary hover:text-treatment"
                        >
                          {alt.name}
                          {alt.feature_flags?.has_e_prescribing && (
                            <span className="text-xs text-success ml-1">(e-Rx)</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/architect"
                  className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
                >
                  Get personalized recommendations with Practice Architect
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
              Common Questions About Switching from {tool.name}
            </h2>

            <div className="space-y-4">
              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Will I lose my patient data when I leave {tool.name}?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  No, but you must export your data BEFORE canceling your subscription. Most systems allow
                  you to export patient demographics, notes, and documents in standard formats (CSV, PDF, or
                  CCD/C-CDA). Once you cancel, you may lose access immediately, so always complete your
                  data export first.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  How long does it take to switch from {tool.name}?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  For {tool.name}, we estimate approximately <strong>{migrationComplexity.timeEstimate}</strong>.
                  This includes data export, setting up your new system, importing data, training staff,
                  and running a brief parallel period. The actual time depends on your practice size and
                  the complexity of your data.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Do I need to notify patients about the change?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  If {tool.name} includes a patient portal that your patients use, yes. Patients will need
                  new login credentials for the new system. Send a clear communication 1-2 weeks before the
                  switch explaining what's changing, why, and exactly how they'll access their information
                  going forward.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  What happens to my outstanding insurance claims?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  Outstanding claims submitted through {tool.name} will continue processing normally. However,
                  you'll need to track payments and follow up on denials. We recommend keeping access to your
                  old billing system for at least 90 days after switching to handle AR follow-up and payment
                  posting for older claims.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Should I run both systems at the same time?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  For EHR migrations, yes - we strongly recommend running both systems in parallel for 1-2
                  weeks. This lets you verify that all data transferred correctly, gives staff time to
                  adjust, and provides a safety net if any issues arise. Factor this overlap cost into
                  your migration budget.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  Will my new EHR help with migration?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  Many EHR vendors offer free or discounted migration assistance for new customers. This
                  typically includes help importing your patient data, configuring settings, and training
                  your staff. Ask about migration support during your sales process - it can significantly
                  reduce the burden on your practice.
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  What about my contract with {tool.name}?
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-4 pb-4 text-label-secondary">
                  Review your contract carefully for cancellation terms, notice periods, and early termination
                  fees. Many software contracts auto-renew annually, so timing your switch near your renewal
                  date can save money. Some vendors require 30-90 days notice, so plan accordingly.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={`/tools/alternatives/${slug}`}
                className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
              >
                {tool.name} alternatives
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/switch-from"
                className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
              >
                All migration guides
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tools/compare"
                className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
              >
                Compare tools
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/architect"
                className="flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
              >
                Practice Architect
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
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
              View all alternatives
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;
