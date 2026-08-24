/**
 * For Practices Hub Page
 *
 * Landing page for practice-type specific software recommendations.
 * Routes to specific practice archetypes with pre-configured Architect.
 *
 * URL: /tools/for-practices
 */

import { Metadata } from "next";
import Link from "next/link";
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
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { PracticeTypeArchitectCTA } from "@/components/architect/ContextualArchitectCTA";

export const metadata: Metadata = {
  title: "Software for Your Practice Type | Mental Health Technology | HeyPsych",
  description: "Find the right software for your specific practice type. Solo therapist, group practice, psychiatry, telehealth-first, IOP/PHP, and more. Get personalized recommendations.",
  keywords: [
    "therapy practice software",
    "psychiatry practice software",
    "group practice software",
    "solo therapist software",
    "telehealth practice software",
    "mental health practice technology",
  ],
  alternates: {
    canonical: `${siteConfig.url}/tools/for-practices`,
  },
};

const PRACTICE_TYPES = [
  {
    slug: "solo-therapist",
    name: "Solo Therapist",
    description: "Independent therapists, counselors, and social workers in private practice",
    icon: User,
    color: "treatment",
    needs: ["Simple scheduling", "Basic billing", "Telehealth", "Note templates"],
    staffSize: "1 provider",
  },
  {
    slug: "therapy-group",
    name: "Therapy Group Practice",
    description: "Group practices with multiple therapists, counselors, or social workers",
    icon: Users,
    color: "accent",
    needs: ["Multi-provider scheduling", "Shared client management", "Payroll", "Analytics"],
    staffSize: "2-50 providers",
  },
  {
    slug: "psychiatry",
    name: "Psychiatry Practice",
    description: "Psychiatrists, psychiatric NPs, and medication management practices",
    icon: Stethoscope,
    color: "treatment",
    needs: ["E-prescribing", "EPCS", "Lab integration", "Medication tracking"],
    staffSize: "Any size",
  },
  {
    slug: "telehealth-first",
    name: "Telehealth-First Practice",
    description: "Practices that primarily or exclusively see patients virtually",
    icon: Video,
    color: "accent",
    needs: ["HIPAA video", "Virtual waiting room", "Online scheduling", "Digital intake"],
    staffSize: "Any size",
  },
  {
    slug: "iop-php",
    name: "IOP / PHP Program",
    description: "Intensive outpatient programs and partial hospitalization programs",
    icon: Building2,
    color: "treatment",
    needs: ["Group therapy tracking", "Outcomes measurement", "Complex billing", "Care coordination"],
    staffSize: "5-100+ staff",
  },
  {
    slug: "psychological-testing",
    name: "Psychological Testing",
    description: "Practices focused on psychological assessments and evaluations",
    icon: Brain,
    color: "accent",
    needs: ["Assessment tools", "Report generation", "Scoring automation", "Document management"],
    staffSize: "1-10 providers",
  },
  {
    slug: "addiction-treatment",
    name: "Addiction Treatment",
    description: "Substance use disorder treatment and recovery programs",
    icon: Heart,
    color: "treatment",
    needs: ["PDMP integration", "Recovery tracking", "Group management", "Compliance tools"],
    staffSize: "Any size",
  },
  {
    slug: "starting-out",
    name: "Starting a Practice",
    description: "Clinicians launching their first private practice",
    icon: Sparkles,
    color: "accent",
    needs: ["All-in-one solution", "Low startup cost", "Easy setup", "Learning resources"],
    staffSize: "New practice",
  },
];

export default function ForPracticesPage() {
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
            <span className="text-label-primary font-medium">For Practices</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl lg:text-5xl">
            Software for Your Practice Type
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-label-secondary">
            Different practices need different tools. Find software recommendations tailored to your
            specific practice type, size, and workflow.
          </p>
        </div>
      </section>

      {/* Practice Types Grid */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICE_TYPES.map((practice) => {
              const Icon = practice.icon;
              const colorClasses = practice.color === "treatment"
                ? "bg-treatment/10 text-treatment border-treatment/20"
                : "bg-accent/10 text-accent border-accent/20";

              return (
                <Link
                  key={practice.slug}
                  href={`/tools/for-practices/${practice.slug}`}
                  className="group rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-treatment/30 hover:shadow-soft"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colorClasses}`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-label-primary group-hover:text-treatment transition-colors">
                    {practice.name}
                  </h2>

                  <p className="mt-2 text-sm text-label-secondary">
                    {practice.description}
                  </p>

                  <div className="mt-4 text-xs text-label-tertiary">
                    {practice.staffSize}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {practice.needs.slice(0, 3).map((need) => (
                      <span
                        key={need}
                        className="rounded-md bg-canvas px-2 py-0.5 text-xs text-label-secondary border border-separator"
                      >
                        {need}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-treatment">
                    View recommendations
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* General CTA */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold text-label-primary">
            Not sure which category fits?
          </h2>
          <p className="mt-2 text-label-secondary">
            Use Practice Architect to get personalized recommendations based on your specific needs.
          </p>
          <Link
            href="/architect"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-treatment px-6 py-3 font-medium text-white hover:bg-treatment-600 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            Open Practice Architect
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
            Browse by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/for-clinicians/ehr-practice-management/"
              className="text-sm text-treatment hover:underline"
            >
              EHR & Practice Management
            </Link>
            <Link
              href="/tools/for-clinicians/ai-scribe-documentation/"
              className="text-sm text-treatment hover:underline"
            >
              AI Scribe & Documentation
            </Link>
            <Link
              href="/tools/for-clinicians/billing-rcm/"
              className="text-sm text-treatment hover:underline"
            >
              Billing & RCM
            </Link>
            <Link
              href="/tools/for-clinicians/telehealth-communication/"
              className="text-sm text-treatment hover:underline"
            >
              Telehealth
            </Link>
            <Link
              href="/tools/integrations/"
              className="text-sm text-treatment hover:underline"
            >
              Integrations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
