"use client";

// Audience Selector Component
// Prominent audience selection with navigation

import Link from "next/link";
import { Users, Stethoscope, ArrowRight, LayoutGrid } from "lucide-react";
import { trackToolsAudienceSelect } from "@/lib/analytics/product-events";

interface AudienceSelectorProps {
  patientCount: number;
  clinicianCount: number;
}

export function AudienceSelector({ patientCount, clinicianCount }: AudienceSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
      <Link
        href="/tools/for-patients/"
        onClick={() => trackToolsAudienceSelect("patient", "landing")}
        className="group flex w-full max-w-xs items-center gap-4 rounded-2xl border border-separator bg-surface p-4 shadow-subtle transition-all hover:border-accent/30 hover:shadow-soft sm:w-auto sm:min-w-[240px]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <Users className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-label-primary group-hover:text-accent transition-colors">
            For Patients
          </div>
          <div className="text-sm text-label-secondary">
            {patientCount} apps & tools
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-label-quaternary group-hover:text-accent transition-all group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/tools/for-clinicians/"
        onClick={() => trackToolsAudienceSelect("clinician", "landing")}
        className="group flex w-full max-w-xs items-center gap-4 rounded-2xl border border-separator bg-surface p-4 shadow-subtle transition-all hover:border-treatment/30 hover:shadow-soft sm:w-auto sm:min-w-[240px]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-treatment/10">
          <Stethoscope className="h-6 w-6 text-treatment" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-label-primary group-hover:text-treatment transition-colors">
            For Clinicians
          </div>
          <div className="text-sm text-label-secondary">
            {clinicianCount} professional tools
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-label-quaternary group-hover:text-treatment transition-all group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/tools/search/"
        className="group flex items-center gap-2 rounded-full border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-secondary shadow-subtle transition-all hover:border-label-tertiary hover:text-label-primary"
      >
        <LayoutGrid className="h-4 w-4" />
        Browse all tools
      </Link>
    </div>
  );
}
