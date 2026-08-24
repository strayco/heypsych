"use client";

// Audience Selector Component
// Prominent audience selection with navigation

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackToolsAudienceSelect } from "@/lib/analytics/product-events";

interface AudienceSelectorProps {
  patientCount: number;
  clinicianCount: number;
}

export function AudienceSelector({ patientCount, clinicianCount }: AudienceSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
      <Link
        href="/tools/for-patients/"
        onClick={() => trackToolsAudienceSelect("patient", "landing")}
        className="group flex w-full items-center justify-between rounded-xl border border-separator bg-surface px-5 py-4 transition-all hover:border-neutral-300 hover:shadow-soft sm:w-auto sm:min-w-[200px]"
      >
        <div>
          <div className="font-medium text-label-primary group-hover:text-accent transition-colors">
            For Patients
          </div>
          <div className="text-sm text-label-tertiary">
            {patientCount} tools
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-label-quaternary group-hover:text-accent transition-all group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/tools/for-clinicians/"
        onClick={() => trackToolsAudienceSelect("clinician", "landing")}
        className="group flex w-full items-center justify-between rounded-xl border border-separator bg-surface px-5 py-4 transition-all hover:border-neutral-300 hover:shadow-soft sm:w-auto sm:min-w-[200px]"
      >
        <div>
          <div className="font-medium text-label-primary group-hover:text-accent transition-colors">
            For Clinicians
          </div>
          <div className="text-sm text-label-tertiary">
            {clinicianCount} tools
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-label-quaternary group-hover:text-accent transition-all group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/tools/search/"
        className="text-sm font-medium text-label-secondary hover:text-accent transition-colors"
      >
        Browse all →
      </Link>
    </div>
  );
}
