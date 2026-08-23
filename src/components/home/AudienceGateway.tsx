// src/components/home/AudienceGateway.tsx
// Dual-audience gateway for homepage positioning
//
// Provides equal prominence to patients and clinicians above the fold.
// Mission 1: Fix homepage positioning to serve both audiences.

import Link from "next/link";
import { User, Stethoscope, ArrowRight } from "lucide-react";

interface AudienceCardProps {
  title: string;
  description: string;
  primaryLink: { href: string; label: string };
  secondaryLink?: { href: string; label: string };
  icon: React.ReactNode;
  variant: "patient" | "clinician";
}

function AudienceCard({
  title,
  description,
  primaryLink,
  secondaryLink,
  icon,
  variant,
}: AudienceCardProps) {
  const variantStyles = {
    patient: {
      border: "border-accent/20",
      bg: "bg-accent/5",
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      primaryBtn: "bg-accent hover:bg-accent/90 text-white",
      secondaryBtn: "border-accent/30 hover:bg-accent/5",
    },
    clinician: {
      border: "border-treatment/20",
      bg: "bg-treatment/5",
      iconBg: "bg-treatment/10",
      iconColor: "text-treatment",
      primaryBtn: "bg-treatment hover:bg-treatment/90 text-white",
      secondaryBtn: "border-treatment/30 hover:bg-treatment/5",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-2xl border ${styles.border} ${styles.bg} p-6 transition-shadow hover:shadow-soft`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg}`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-label-primary">{title}</h3>
      </div>

      <p className="text-label-secondary mb-5">{description}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={primaryLink.href}
          className={`group inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${styles.primaryBtn}`}
        >
          {primaryLink.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        {secondaryLink && (
          <Link
            href={secondaryLink.href}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border bg-surface px-4 py-2.5 text-sm font-medium text-label-primary transition-all ${styles.secondaryBtn}`}
          >
            {secondaryLink.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function AudienceGateway() {
  return (
    <section className="px-4 pb-12 pt-12 sm:px-6 md:pt-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Primary H1 - Mission FIX 3 */}
        <h1 className="text-3xl font-bold tracking-tight text-label-primary text-center sm:text-4xl md:text-5xl mb-4">
          Mental health, for everyone involved.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-label-secondary text-center sm:text-xl mb-10">
          Whether you&apos;re seeking understanding or running a practice, start here.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Patient Path */}
          <AudienceCard
            variant="patient"
            title="For Patients & Families"
            description="Understand mental health conditions, explore treatment options, and find tools to support your journey."
            icon={<User className="h-5 w-5 text-accent" />}
            primaryLink={{
              href: "/tools/for-patients",
              label: "Find Self-Help Tools",
            }}
            secondaryLink={{
              href: "/conditions",
              label: "Explore Conditions",
            }}
          />

          {/* Clinician Path - with attribution tracking */}
          <AudienceCard
            variant="clinician"
            title="For Mental Health Clinicians"
            description="Find the right EHR and practice management software for your mental health practice."
            icon={<Stethoscope className="h-5 w-5 text-treatment" />}
            primaryLink={{
              href: "/tools/for-clinicians/ehr-practice-management/match?source=homepage_audience_gateway",
              label: "Find My EHR Match",
            }}
            secondaryLink={{
              href: "/tools/for-clinicians?source=homepage_audience_gateway",
              label: "Browse All Tools",
            }}
          />
        </div>
      </div>
    </section>
  );
}
