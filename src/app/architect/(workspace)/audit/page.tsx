// src/app/architect/audit/page.tsx
// Practice Stack Architect - Audit Experience
// Workspace for auditing existing practice stack

import { Metadata } from "next";
import { Suspense } from "react";
import { ArchitectWorkspace } from "../../_components/ArchitectWorkspace";
import { ArchitectLoading } from "../../_components/ArchitectLoading";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/architect/audit`;

export const metadata: Metadata = {
  title: "Audit Your Stack | Practice Stack Architect",
  description:
    "Audit your mental health practice technology stack. Find gaps, identify redundancies, and discover better alternatives.",
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: false, // Interactive tool, not for indexing
    follow: true,
  },
};

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Suspense fallback={<ArchitectLoading />}>
        <ArchitectWorkspace initialMode="audit" isDemo={false} />
      </Suspense>
    </div>
  );
}
