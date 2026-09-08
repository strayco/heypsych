/**
 * Practice Stack Landing Page
 *
 * Complete software stack recommendations for a practice type.
 * Shows multi-category tool combinations in a stage-based workflow.
 *
 * URL: /tools/stacks/[practice-type]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Rocket,
  TrendingUp,
  Heart,
  Users,
  Stethoscope,
  Pill,
  DollarSign,
  Calendar,
  FileText,
  Video,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { PracticeTypeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import { ClinicianToolCard } from "@/components/tools/clinician";

interface PageProps {
  params: Promise<{ "practice-type": string }>;
}

interface StackStage {
  name: string;
  description: string;
  icon: LucideIcon;
  categories: {
    category: string;
    label: string;
    required: boolean;
    description: string;
  }[];
}

interface StackConfig {
  name: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  color: string;
  seoTitle: string;
  seoDescription: string;
  stages: StackStage[];
  integrationTips: string[];
  budgetGuidance: {
    range: string;
    breakdown: string[];
  };
  keywords: string[];
}

// Stack configurations for each practice type
const STACK_CONFIGS: Record<string, StackConfig> = {
  "therapy-practice": {
    name: "Therapy Private Practice",
    headline: "Complete Software Stack for a Therapy Private Practice",
    description: "Everything you need to run a successful solo or small therapy practice. This stack covers client management, documentation, billing, and growth—organized by when you need each tool in your practice journey.",
    icon: Heart,
    color: "treatment",
    seoTitle: "Software Stack for a Therapy Private Practice (2026) | Complete Guide",
    seoDescription: "Complete software stack guide for therapists. EHR, billing, telehealth, AI notes, and marketing tools for solo and small therapy practices. Expert recommendations.",
    stages: [
      {
        name: "Start",
        description: "Essential foundation—get these before seeing your first client",
        icon: Rocket,
        categories: [
          {
            category: "ehr-practice-management",
            label: "EHR & Practice Management",
            required: true,
            description: "Your operational hub: scheduling, notes, client records, and often billing in one platform",
          },
          {
            category: "telehealth-communication",
            label: "Telehealth Platform",
            required: true,
            description: "HIPAA-compliant video for virtual sessions—often included in your EHR",
          },
        ],
      },
      {
        name: "Care",
        description: "Enhance your clinical work and efficiency",
        icon: Sparkles,
        categories: [
          {
            category: "ai-scribe-documentation",
            label: "AI Scribe",
            required: false,
            description: "Automate session notes—save 5-10 hours weekly on documentation",
          },
          {
            category: "measurement-outcomes-dtx",
            label: "Outcome Measurement",
            required: false,
            description: "Track client progress with validated assessments like PHQ-9, GAD-7",
          },
        ],
      },
      {
        name: "Grow",
        description: "Scale your practice and increase revenue",
        icon: TrendingUp,
        categories: [
          {
            category: "billing-rcm",
            label: "Billing & RCM",
            required: false,
            description: "Dedicated billing service if your EHR billing isn't enough or you take insurance",
          },
          {
            category: "patient-engagement",
            label: "Client Engagement",
            required: false,
            description: "Between-session tools, client portal, automated reminders",
          },
        ],
      },
    ],
    integrationTips: [
      "Start with an all-in-one EHR (SimplePractice, TherapyNotes) to minimize setup complexity",
      "Add AI scribe only after you've established your documentation workflow",
      "Choose tools that integrate with your EHR to avoid double data entry",
      "Consider your insurance billing needs before choosing an EHR—switching is painful",
    ],
    budgetGuidance: {
      range: "$50–200/month",
      breakdown: [
        "EHR: $30–80/month (SimplePractice, TherapyNotes, Jane)",
        "Telehealth: Often included, or $0–50/month standalone",
        "AI Scribe: $30–80/month (optional, but high ROI)",
        "Billing: Usually included in EHR, or 5-8% of collections",
      ],
    },
    keywords: [
      "therapy practice software stack",
      "software for solo therapists",
      "therapy EHR setup",
      "therapist technology guide",
    ],
  },
  "psychiatry-practice": {
    name: "Psychiatry Private Practice",
    headline: "Complete Software Stack for a Psychiatry Private Practice",
    description: "Psychiatry practices need specialized tools: e-prescribing with EPCS for controlled substances, medication tracking, lab integration, and efficient documentation for 15-30 minute visits. This stack covers your unique clinical and operational needs.",
    icon: Stethoscope,
    color: "treatment",
    seoTitle: "Software Stack for a Psychiatry Private Practice (2026) | Complete Guide",
    seoDescription: "Complete software stack for psychiatrists. EHR with EPCS, e-prescribing, AI scribes for med checks, and billing tools. Expert recommendations for psychiatric practices.",
    stages: [
      {
        name: "Start",
        description: "Clinical essentials—required before prescribing",
        icon: Rocket,
        categories: [
          {
            category: "ehr-practice-management",
            label: "Psychiatry EHR",
            required: true,
            description: "Must support e-prescribing and EPCS for controlled substances. Valant, SimplePractice, or general medical EHRs",
          },
          {
            category: "prescribing-erx",
            label: "E-Prescribing (EPCS)",
            required: true,
            description: "EPCS certification required for Schedule II-V. Usually integrated in your EHR",
          },
          {
            category: "telehealth-communication",
            label: "Telehealth",
            required: true,
            description: "HIPAA-compliant video for medication management appointments",
          },
        ],
      },
      {
        name: "Care",
        description: "Optimize your clinical workflow",
        icon: Sparkles,
        categories: [
          {
            category: "ai-scribe-documentation",
            label: "AI Scribe",
            required: false,
            description: "Critical for high-volume med checks—Freed excels at HPI generation for psychiatry",
          },
          {
            category: "measurement-outcomes-dtx",
            label: "Rating Scales",
            required: false,
            description: "PHQ-9, GAD-7, MDQ for diagnostic support and treatment monitoring",
          },
        ],
      },
      {
        name: "Grow",
        description: "Scale efficiently and increase revenue",
        icon: TrendingUp,
        categories: [
          {
            category: "billing-rcm",
            label: "Billing & Prior Auth",
            required: false,
            description: "Prior authorization support for medications; RCM if taking insurance",
          },
          {
            category: "patient-engagement",
            label: "Patient Engagement",
            required: false,
            description: "Medication reminders, refill requests, patient portal",
          },
        ],
      },
    ],
    integrationTips: [
      "Verify EPCS certification before choosing an EHR—not all support controlled substances",
      "Check your state's e-prescribing requirements (some mandate EPCS)",
      "AI scribes like Freed excel at psychiatry documentation; Mentalyc is therapy-focused",
      "Consider lab integration if you're doing lithium, clozapine, or metabolic monitoring",
    ],
    budgetGuidance: {
      range: "$100–300/month",
      breakdown: [
        "Psychiatry EHR with EPCS: $60–150/month",
        "E-Prescribing: Usually included, or $30–50/month standalone",
        "AI Scribe: $40–120/month (high ROI for med checks)",
        "Telehealth: Often included, or $0–50/month",
      ],
    },
    keywords: [
      "psychiatry practice software",
      "psychiatrist EHR with EPCS",
      "software for psychiatrists",
      "psychiatry technology stack",
    ],
  },
  "pmhnp-practice": {
    name: "PMHNP Private Practice",
    headline: "Complete Software Stack for a PMHNP Private Practice",
    description: "PMHNPs balance prescribing and therapy, often with higher case volumes than psychiatrists. You need EPCS-capable EHR, efficient documentation, and tools that support both medication management and psychotherapy workflows.",
    icon: Pill,
    color: "treatment",
    seoTitle: "Software Stack for a PMHNP Private Practice (2026) | Complete Guide",
    seoDescription: "Complete software stack for PMHNPs. EHR with EPCS, AI scribes for mixed visits, billing, and telehealth. Expert recommendations for psychiatric nurse practitioners.",
    stages: [
      {
        name: "Start",
        description: "Core clinical requirements",
        icon: Rocket,
        categories: [
          {
            category: "ehr-practice-management",
            label: "EHR with EPCS",
            required: true,
            description: "Must support e-prescribing with EPCS. Consider SimplePractice, Valant, or medical EHRs",
          },
          {
            category: "prescribing-erx",
            label: "E-Prescribing",
            required: true,
            description: "EPCS for controlled substances—usually integrated in EHR",
          },
          {
            category: "telehealth-communication",
            label: "Telehealth",
            required: true,
            description: "HIPAA video for both med checks and therapy sessions",
          },
        ],
      },
      {
        name: "Care",
        description: "Efficiency and clinical quality",
        icon: Sparkles,
        categories: [
          {
            category: "ai-scribe-documentation",
            label: "AI Scribe",
            required: false,
            description: "Essential for PMHNP volume—choose one that handles both med checks and therapy notes",
          },
          {
            category: "measurement-outcomes-dtx",
            label: "Outcome Tracking",
            required: false,
            description: "Rating scales for monitoring treatment response",
          },
        ],
      },
      {
        name: "Grow",
        description: "Expand your practice sustainably",
        icon: TrendingUp,
        categories: [
          {
            category: "billing-rcm",
            label: "Billing Services",
            required: false,
            description: "Especially important if you're credentialed with multiple payers",
          },
          {
            category: "patient-engagement",
            label: "Patient Tools",
            required: false,
            description: "Refill requests, medication reminders, between-session engagement",
          },
        ],
      },
    ],
    integrationTips: [
      "You need the prescribing capabilities of psychiatry EHRs AND the therapy features of therapy EHRs",
      "SimplePractice with e-prescribing add-on is popular among PMHNPs for this reason",
      "AI scribes should handle both med management and therapy session formats",
      "Check collaborative agreement requirements in your state—some EHRs support supervision documentation",
    ],
    budgetGuidance: {
      range: "$80–250/month",
      breakdown: [
        "EHR with EPCS: $60–130/month",
        "E-Prescribing add-on: $0–40/month (varies by EHR)",
        "AI Scribe: $40–100/month (essential for volume)",
        "Telehealth: Usually included, or $0–50/month",
      ],
    },
    keywords: [
      "PMHNP software stack",
      "software for psychiatric nurse practitioners",
      "PMHNP EHR with EPCS",
      "PMHNP practice technology",
    ],
  },
  "group-practice": {
    name: "Mental Health Group Practice",
    headline: "Complete Software Stack for a Mental Health Group Practice",
    description: "Group practices have unique needs: multi-provider scheduling, role-based permissions, shared client management, productivity reporting, and potentially centralized billing. Your stack needs to scale from 2 to 50+ providers.",
    icon: Users,
    color: "accent",
    seoTitle: "Software Stack for a Mental Health Group Practice (2026) | Complete Guide",
    seoDescription: "Complete software stack for group therapy practices. Multi-provider EHR, centralized billing, AI scribes at scale, and practice analytics. Expert recommendations.",
    stages: [
      {
        name: "Start",
        description: "Foundation that scales with your team",
        icon: Rocket,
        categories: [
          {
            category: "ehr-practice-management",
            label: "Group Practice EHR",
            required: true,
            description: "Multi-provider scheduling, permissions, shared clients. Pricing must scale reasonably",
          },
          {
            category: "telehealth-communication",
            label: "Group Telehealth",
            required: true,
            description: "HIPAA video with multi-provider support and virtual waiting rooms",
          },
        ],
      },
      {
        name: "Care",
        description: "Clinical efficiency at scale",
        icon: Sparkles,
        categories: [
          {
            category: "ai-scribe-documentation",
            label: "AI Scribe (Team)",
            required: false,
            description: "Per-provider AI scribes with practice-wide customization",
          },
          {
            category: "measurement-outcomes-dtx",
            label: "Outcomes Platform",
            required: false,
            description: "Standardized assessments across the practice for quality measurement",
          },
        ],
      },
      {
        name: "Grow",
        description: "Operational excellence and growth",
        icon: TrendingUp,
        categories: [
          {
            category: "billing-rcm",
            label: "Centralized Billing/RCM",
            required: false,
            description: "Often essential for groups—dedicated billing team or outsourced RCM",
          },
          {
            category: "patient-engagement",
            label: "Patient Experience",
            required: false,
            description: "Branded client portal, automated communications, satisfaction surveys",
          },
        ],
      },
    ],
    integrationTips: [
      "Get per-provider pricing in writing—costs can escalate quickly as you grow",
      "Role-based permissions are essential: clinicians shouldn't see each other's notes unless intended",
      "Centralized billing becomes necessary around 5-10 providers if taking insurance",
      "Consider AI scribe ROI: if each provider saves 5 hours/week, the math works fast",
      "Look for productivity dashboards to track utilization across the team",
    ],
    budgetGuidance: {
      range: "$500–3,000+/month (varies by size)",
      breakdown: [
        "EHR: $50–100/provider/month",
        "Telehealth: Often included, or $10–30/provider",
        "AI Scribe: $40–80/provider/month (volume discounts possible)",
        "RCM: 5-8% of collections or $1,500-5,000/month flat",
        "Outcomes platform: $100–500/month practice-wide",
      ],
    },
    keywords: [
      "group practice software stack",
      "multi-provider therapy EHR",
      "group practice management software",
      "mental health group practice technology",
    ],
  },
};

// Generate static params
export function generateStaticParams() {
  return Object.keys(STACK_CONFIGS).map((type) => ({ "practice-type": type }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "practice-type": type } = await params;
  const config = STACK_CONFIGS[type];

  if (!config) {
    return { title: "Practice Stack" };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    alternates: {
      canonical: `${siteConfig.url}/tools/stacks/${type}`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/stacks/${type}`,
      type: "website",
    },
  };
}

export default async function StackPage({ params }: PageProps) {
  const { "practice-type": type } = await params;
  const config = STACK_CONFIGS[type];

  if (!config) {
    notFound();
  }

  // Get tools for each category mentioned in the stack
  const allTools = await ClinicianToolService.loadClinicianTools();

  const categoriesInStack = config.stages.flatMap((stage) =>
    stage.categories.map((c) => c.category)
  );

  const toolsByCategory: Record<string, Awaited<ReturnType<typeof ClinicianToolService.loadClinicianTools>>> = {};
  for (const category of categoriesInStack) {
    toolsByCategory[category] = allTools
      .filter((t) => t.primary_category === category)
      .slice(0, 3);
  }

  const Icon = config.icon;
  const colorClasses = config.color === "treatment"
    ? "bg-treatment/10 text-treatment border-treatment/20"
    : "bg-accent/10 text-accent border-accent/20";

  // Stage colors
  const stageColors = {
    Start: "border-success/30 bg-success/5",
    Care: "border-accent/30 bg-accent/5",
    Grow: "border-treatment/30 bg-treatment/5",
  };

  const stageIconColors = {
    Start: "text-success",
    Care: "text-accent",
    Grow: "text-treatment",
  };

  // Structured data
  const structuredData = [
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Tools", "item": `${siteConfig.url}/tools/` },
        { "@type": "ListItem", "position": 2, "name": "Stacks", "item": `${siteConfig.url}/tools/stacks/` },
        { "@type": "ListItem", "position": 3, "name": config.name, "item": `${siteConfig.url}/tools/stacks/${type}` },
      ],
    },
    // HowTo schema for the stack stages
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": config.headline,
      "description": config.description,
      "step": config.stages.map((stage, idx) => ({
        "@type": "HowToStep",
        "position": idx + 1,
        "name": stage.name,
        "text": stage.description,
        "itemListElement": stage.categories.map((cat) => ({
          "@type": "HowToDirection",
          "text": `${cat.label}: ${cat.description}`,
        })),
      })),
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": config.budgetGuidance.range,
      },
    },
  ];

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
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/stacks/" className="text-label-secondary hover:text-treatment">
                Stacks
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">{config.name}</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${colorClasses}`}>
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {config.headline}
                </h1>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Budget summary */}
            <div className="mt-4 flex items-center gap-2 text-sm text-label-secondary">
              <DollarSign className="h-4 w-4" />
              <span>Typical monthly cost: <strong className="text-label-primary">{config.budgetGuidance.range}</strong></span>
            </div>
          </div>
        </section>

        {/* Stack Stages */}
        {config.stages.map((stage, stageIdx) => {
          const StageIcon = stage.icon;
          const stageColor = stageColors[stage.name as keyof typeof stageColors] || "border-separator bg-canvas";
          const iconColor = stageIconColors[stage.name as keyof typeof stageIconColors] || "text-label-secondary";

          return (
            <section
              key={stage.name}
              className={`border-b border-separator px-4 py-10 sm:px-6 lg:px-8 ${stageIdx % 2 === 0 ? "bg-canvas" : "bg-surface"}`}
            >
              <div className="mx-auto max-w-6xl">
                {/* Stage header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stageColor}`}>
                    <StageIcon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-label-primary">
                      Stage {stageIdx + 1}: {stage.name}
                    </h2>
                    <p className="text-sm text-label-secondary">{stage.description}</p>
                  </div>
                </div>

                {/* Categories in this stage */}
                <div className="mt-6 space-y-8">
                  {stage.categories.map((cat) => {
                    const categoryTools = toolsByCategory[cat.category] || [];

                    return (
                      <div key={cat.category} className="rounded-xl border border-separator bg-surface p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-label-primary">{cat.label}</h3>
                              {cat.required ? (
                                <span className="rounded-full bg-treatment/10 px-2 py-0.5 text-xs font-medium text-treatment">
                                  Required
                                </span>
                              ) : (
                                <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-label-tertiary">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-label-secondary mt-1">{cat.description}</p>
                          </div>
                          <Link
                            href={`/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[cat.category] || cat.category}/`}
                            className="flex items-center gap-1 text-sm text-treatment hover:underline whitespace-nowrap"
                          >
                            View all
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>

                        {/* Tool cards */}
                        {categoryTools.length > 0 && (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                            {categoryTools.map((tool) => (
                              <ClinicianToolCard key={tool.slug} tool={tool} variant="compact" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}

        {/* Architect CTA */}
        <section className="border-b border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <PracticeTypeArchitectCTA practiceType={type} />
          </div>
        </section>

        {/* Integration Tips */}
        <section className="border-b border-separator bg-canvas px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Integration Tips
            </h2>

            <div className="space-y-3">
              {config.integrationTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-surface p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <p className="text-label-secondary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Budget Guidance */}
        <section className="border-b border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-treatment" />
              Budget Guidance
            </h2>

            <div className="rounded-xl border border-treatment/20 bg-treatment/5 p-5 mb-4">
              <p className="text-lg font-semibold text-treatment">
                Typical monthly cost: {config.budgetGuidance.range}
              </p>
            </div>

            <div className="space-y-2">
              {config.budgetGuidance.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-separator bg-canvas p-3"
                >
                  <CreditCard className="h-4 w-4 text-label-tertiary shrink-0" />
                  <p className="text-sm text-label-secondary">{item}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-label-tertiary">
              * Pricing varies by vendor, features, and practice size. Get exact quotes before committing.
            </p>
          </div>
        </section>

        {/* Related Stacks */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Other Practice Stacks
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(STACK_CONFIGS)
                .filter(([slug]) => slug !== type)
                .map(([slug, stackConfig]) => (
                  <Link
                    key={slug}
                    href={`/tools/stacks/${slug}/`}
                    className="flex items-center gap-1 text-sm text-treatment hover:underline"
                  >
                    {stackConfig.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600;
