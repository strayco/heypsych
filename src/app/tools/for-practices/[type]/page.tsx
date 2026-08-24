/**
 * Practice Type Landing Page
 *
 * Specific software recommendations for a practice archetype.
 * Pre-configured Architect entry point.
 *
 * URL: /tools/for-practices/[practice-type]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  User,
  Users,
  Building2,
  Stethoscope,
  Video,
  Brain,
  Heart,
  Sparkles,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { PracticeTypeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import { ClinicianToolCard } from "@/components/tools/clinician";

interface PageProps {
  params: Promise<{ type: string }>;
}

// Practice type configurations
const PRACTICE_CONFIGS: Record<string, {
  name: string;
  headline: string;
  description: string;
  icon: any;
  color: string;
  seoTitle: string;
  seoDescription: string;
  capabilities: string[];
  recommendedCategories: string[];
  considerations: string[];
  staffSize: string;
}> = {
  "solo-therapist": {
    name: "Solo Therapist",
    headline: "Software for Solo Therapy Practices",
    description: "Running a solo practice means wearing many hats. Find all-in-one solutions or build a simple, affordable stack that handles scheduling, notes, billing, and telehealth without overwhelming complexity.",
    icon: User,
    color: "treatment",
    seoTitle: "Best Software for Solo Therapists (2024) | Practice Technology | HeyPsych",
    seoDescription: "Find the best EHR, billing, and telehealth software for solo therapy practices. Compare SimplePractice, TherapyNotes, and more. Get personalized recommendations.",
    capabilities: ["scheduling", "clinical-notes", "billing", "telehealth", "patient-portal"],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication", "ai-scribe-documentation"],
    considerations: [
      "Look for all-in-one solutions to minimize complexity",
      "Prioritize ease of use over advanced features",
      "Consider total cost including payment processing fees",
      "Ensure HIPAA compliance is built-in, not an add-on",
    ],
    staffSize: "1 provider",
  },
  "therapy-group": {
    name: "Therapy Group Practice",
    headline: "Software for Group Therapy Practices",
    description: "Managing multiple clinicians requires robust scheduling, permissions, reporting, and potentially separate billing. Find platforms designed for the complexity of group practice operations.",
    icon: Users,
    color: "accent",
    seoTitle: "Best Software for Group Therapy Practices (2024) | HeyPsych",
    seoDescription: "Find EHR and practice management software designed for group therapy practices. Multi-provider scheduling, reporting, and billing solutions.",
    capabilities: ["multi-provider-scheduling", "permissions", "reporting", "payroll-integration", "group-analytics"],
    recommendedCategories: ["ehr-practice-management", "billing-rcm", "ai-scribe-documentation"],
    considerations: [
      "Ensure pricing scales reasonably with provider count",
      "Look for role-based permissions and access controls",
      "Consider reporting needs for tracking productivity",
      "Evaluate onboarding support for new clinicians",
    ],
    staffSize: "2-50 providers",
  },
  "psychiatry": {
    name: "Psychiatry Practice",
    headline: "Software for Psychiatry Practices",
    description: "Psychiatry practices need specialized features like e-prescribing, EPCS for controlled substances, lab integration, and medication tracking. Generic therapy EHRs often fall short.",
    icon: Stethoscope,
    color: "treatment",
    seoTitle: "Best EHR & Software for Psychiatrists (2024) | HeyPsych",
    seoDescription: "Find psychiatry-specific EHR software with e-prescribing, EPCS, and medication management. Compare Valant, SimplePractice, and more.",
    capabilities: ["e-prescribing", "epcs", "lab-integration", "medication-tracking", "prior-auth"],
    recommendedCategories: ["ehr-practice-management", "prescribing-erx", "ai-scribe-documentation"],
    considerations: [
      "Verify EPCS certification for controlled substances",
      "Check state-specific e-prescribing requirements",
      "Look for medication history and interaction checking",
      "Consider lab integration for monitoring",
    ],
    staffSize: "Any size",
  },
  "telehealth-first": {
    name: "Telehealth-First Practice",
    headline: "Software for Telehealth Practices",
    description: "When your practice is primarily or entirely virtual, telehealth quality isn't optional—it's your practice. Find platforms with robust video, digital intake, and seamless patient experience.",
    icon: Video,
    color: "accent",
    seoTitle: "Best Software for Telehealth Therapy Practices (2024) | HeyPsych",
    seoDescription: "Find the best telehealth platform for virtual mental health practices. HIPAA-compliant video, online scheduling, and digital intake solutions.",
    capabilities: ["hipaa-video", "virtual-waiting-room", "online-scheduling", "digital-intake", "secure-messaging"],
    recommendedCategories: ["telehealth-communication", "ehr-practice-management", "ai-scribe-documentation"],
    considerations: [
      "Test video quality and reliability before committing",
      "Look for built-in virtual waiting rooms",
      "Ensure mobile experience works for patients",
      "Check bandwidth requirements for your connection",
    ],
    staffSize: "Any size",
  },
  "iop-php": {
    name: "IOP / PHP Program",
    headline: "Software for Intensive Programs",
    description: "IOPs and PHPs have unique needs: group therapy tracking, complex treatment planning, outcome measurement at scale, and often more complex billing requirements.",
    icon: Building2,
    color: "treatment",
    seoTitle: "Best Software for IOP & PHP Programs (2024) | HeyPsych",
    seoDescription: "Find EHR and practice management software designed for intensive outpatient and partial hospitalization programs. Group therapy, outcomes, and compliance tools.",
    capabilities: ["group-therapy-tracking", "outcomes-measurement", "treatment-planning", "utilization-review", "compliance"],
    recommendedCategories: ["ehr-practice-management", "measurement-dtx", "billing-rcm"],
    considerations: [
      "Look for group therapy scheduling and documentation",
      "Ensure robust outcome measurement tools",
      "Consider utilization review and authorization workflows",
      "Verify compliance with state licensing requirements",
    ],
    staffSize: "5-100+ staff",
  },
  "psychological-testing": {
    name: "Psychological Testing",
    headline: "Software for Psychological Assessment",
    description: "Testing practices need assessment administration, scoring, and report generation. General EHRs rarely have the depth needed for comprehensive psychological evaluations.",
    icon: Brain,
    color: "accent",
    seoTitle: "Best Software for Psychological Testing Practices (2024) | HeyPsych",
    seoDescription: "Find assessment administration, scoring, and report generation software for psychological testing practices.",
    capabilities: ["assessment-administration", "automated-scoring", "report-generation", "document-management"],
    recommendedCategories: ["measurement-dtx", "ehr-practice-management"],
    considerations: [
      "Check which assessments are included vs. additional cost",
      "Look for report template customization",
      "Consider integration with your EHR",
      "Evaluate data export options for research",
    ],
    staffSize: "1-10 providers",
  },
  "addiction-treatment": {
    name: "Addiction Treatment",
    headline: "Software for Addiction Treatment",
    description: "SUD treatment has unique needs: PDMP integration, recovery tracking, group management, and compliance with SAMHSA and state regulations.",
    icon: Heart,
    color: "treatment",
    seoTitle: "Best Software for Addiction Treatment Centers (2024) | HeyPsych",
    seoDescription: "Find EHR and practice management software designed for substance use disorder treatment. PDMP integration, recovery tracking, and compliance tools.",
    capabilities: ["pdmp-integration", "recovery-tracking", "group-management", "samhsa-compliance", "residential-features"],
    recommendedCategories: ["ehr-practice-management", "measurement-dtx", "billing-rcm"],
    considerations: [
      "Verify PDMP integration for your state",
      "Look for recovery milestone tracking",
      "Consider residential vs. outpatient feature needs",
      "Check compliance with 42 CFR Part 2",
    ],
    staffSize: "Any size",
  },
  "starting-out": {
    name: "Starting a Practice",
    headline: "Starting Your Therapy Practice",
    description: "Launching a practice is exciting but overwhelming. Start with the essentials: a solid EHR, reliable telehealth, and simple billing. You can add complexity later.",
    icon: Sparkles,
    color: "accent",
    seoTitle: "Software Checklist for Starting a Therapy Practice (2024) | HeyPsych",
    seoDescription: "Complete guide to software for starting your therapy practice. EHR, telehealth, billing, and everything you need to launch successfully.",
    capabilities: ["easy-setup", "all-in-one", "affordable", "learning-resources", "scalable"],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication"],
    considerations: [
      "Start simple—you can add tools as you grow",
      "Look for free trials to test before committing",
      "Consider total monthly cost in your business plan",
      "Prioritize HIPAA compliance from day one",
    ],
    staffSize: "New practice",
  },
};

// Generate static params
export function generateStaticParams() {
  return Object.keys(PRACTICE_CONFIGS).map((type) => ({ type }));
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const config = PRACTICE_CONFIGS[type];

  if (!config) {
    return { title: "Practice Type | HeyPsych" };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    alternates: {
      canonical: `${siteConfig.url}/tools/for-practices/${type}`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/for-practices/${type}`,
      type: "website",
    },
  };
}

export default async function PracticeTypePage({ params }: PageProps) {
  const { type } = await params;
  const config = PRACTICE_CONFIGS[type];

  if (!config) {
    notFound();
  }

  // Get recommended tools for each category
  const allTools = await ClinicianToolService.loadClinicianTools();

  const recommendedTools = config.recommendedCategories.flatMap((category) =>
    allTools
      .filter((t) => t.primary_category === category)
      .slice(0, 3)
  ).slice(0, 6);

  const Icon = config.icon;
  const colorClasses = config.color === "treatment"
    ? "bg-treatment/10 text-treatment border-treatment/20"
    : "bg-accent/10 text-accent border-accent/20";

  return (
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
            <Link href="/tools/for-practices/" className="text-label-secondary hover:text-treatment">
              For Practices
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
              <p className="mt-1 text-sm text-label-tertiary">
                {config.staffSize}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
            <p className="text-lg text-label-primary leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-treatment" />
            Key Capabilities for {config.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {config.capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-lg bg-treatment/10 px-3 py-1.5 text-sm font-medium text-treatment border border-treatment/20"
              >
                {cap.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Architect CTA */}
      <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <PracticeTypeArchitectCTA practiceType={type} />
        </div>
      </section>

      {/* Recommended Tools */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-semibold text-label-primary mb-2">
            Recommended for {config.name}
          </h2>
          <p className="text-sm text-label-secondary mb-6">
            Popular tools among similar practices
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedTools.map((tool) => (
              <ClinicianToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Considerations */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-label-primary mb-6">
            Things to Consider
          </h2>

          <div className="space-y-4">
            {config.considerations.map((consideration, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-label-secondary">{consideration}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
            Browse Recommended Categories
          </h3>
          <div className="flex flex-wrap gap-3">
            {config.recommendedCategories.map((category) => (
              <Link
                key={category}
                href={`/tools/for-clinicians/${category}/`}
                className="flex items-center gap-1 text-sm text-treatment hover:underline"
              >
                {category.replace(/-/g, " ")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export const revalidate = 3600;
