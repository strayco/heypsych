import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";
import {
  BookOpen,
  Pill,
  Smartphone,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { featureFlags } from "@/lib/config/feature-flags";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "For Clinicians",
  description:
    "Clinical resources for mental health professionals. Treatment information, digital tools, assessments, and patient education materials.",
  openGraph: {
    images: ["/images/og/heypsych.png"],
    title: "For Clinicians",
    description:
      "Clinical resources for mental health professionals. Treatment information, digital tools, and patient education.",
  },
};

// Resource categories for clinicians
const clinicianResources = [
  {
    id: "treatment-info",
    title: "Treatment Information",
    description:
      "Evidence-based information on medications, therapies, and treatment approaches for mental health conditions.",
    href: "/treatments",
    icon: Pill,
    color: "bg-green-50 text-green-600",
  },
  {
    id: "condition-reference",
    title: "Condition Reference",
    description:
      "Comprehensive information on mental health conditions, diagnostic criteria, and clinical presentations.",
    href: "/conditions",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "digital-tools",
    title: "Clinical Tools & Technology",
    description:
      "Review of digital mental health tools including AI scribes, EHR integrations, measurement-based care, and telehealth platforms.",
    href: "/tools/for-clinicians",
    icon: Smartphone,
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "assessments",
    title: "Assessments & Screeners",
    description:
      "Validated screening instruments and assessment tools for clinical use, with scoring guidance and interpretation resources.",
    href: "/resources?category=assessments-screeners",
    icon: ClipboardList,
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "patient-education",
    title: "Patient Education Resources",
    description:
      "Materials to help patients understand their conditions and treatment options. Conditions and treatment guides.",
    href: "/conditions",
    icon: FileText,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    id: "support-resources",
    title: "Support & Crisis Resources",
    description:
      "Crisis hotlines, support organizations, and community resources to share with patients.",
    href: "/resources?category=support-community",
    icon: Users,
    color: "bg-rose-50 text-rose-600",
  },
];

/**
 * For Clinicians Landing Page
 *
 * A public, account-free page that helps clinicians discover
 * relevant resources on HeyPsych.
 *
 * This page does NOT:
 * - Require login
 * - Offer provider claiming
 * - Advertise unbuilt dashboards
 * - Collect clinician information
 */
export default function ForCliniciansPage() {
  // Check if the page is enabled
  if (!featureFlags.forCliniciansPage) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PageIntro
        title="For clinicians"
        object="clinician"
        description="Treatment information, condition reference, assessments, and patient education, free to use. And Practice Architect, for designing the practice itself."
      >
        <Link
          href="/architect"
          className="group inline-flex items-center gap-2 rounded-full bg-label-primary px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Build my practice
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </PageIntro>

      {/* Resources Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clinicianResources.map((resource) => {
              const IconComponent = resource.icon;
              return (
                <Link
                  key={resource.id}
                  href={resource.href}
                  className="group flex flex-col rounded-2xl border border-separator bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-separator-opaque hover:shadow-elevated motion-reduce:hover:translate-y-0"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${resource.color}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h2 data-heading="sans" className="mb-2 text-lg font-semibold text-label-primary group-hover:text-accent">
                    {resource.title}
                  </h2>
                  <p className="text-sm text-label-secondary">{resource.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* What HeyPsych Provides Section */}
      <section className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-semibold text-slate-900">
            What HeyPsych Provides
          </h2>
          <div className="space-y-4 text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-medium text-slate-900">
                Available Now
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Comprehensive condition and treatment information</li>
                <li>Digital mental health tool reviews</li>
                <li>Validated assessment instruments</li>
                <li>Patient education resources</li>
                <li>Crisis and support resource directory</li>
                <li>Psychiatrist directory (NPPES-derived)</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-medium text-slate-900">
                About Our Content
              </h3>
              <p className="text-sm">
                HeyPsych content is developed with input from mental health
                professionals and reviewed for accuracy. We cite primary sources
                and clearly distinguish between established evidence and emerging
                research. Our goal is to support—not replace—clinical judgment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-slate-600">
            HeyPsych provides educational information for healthcare
            professionals. Content is for informational purposes only and does
            not constitute medical advice. Clinical decisions should be based on
            individual patient assessment and current clinical guidelines.
          </p>
        </div>
      </section>
    </div>
  );
}
