// src/app/architect/demo/page.tsx
// Practice Stack Architect - Demo Experience
// Workspace with fictional products for exploration

import { Metadata } from "next";
import { Suspense } from "react";
import { ArchitectWorkspace } from "../_components/ArchitectWorkspace";
import { ArchitectLoading } from "../_components/ArchitectLoading";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/architect/demo`;

export const metadata: Metadata = {
  title: "Demo | Practice Stack Architect",
  description:
    "Try the Practice Stack Architect with fictional products. Explore all features without commitment.",
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: false, // Demo page, not for indexing
    follow: true,
  },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Suspense fallback={<ArchitectLoading />}>
        <ArchitectWorkspace initialMode="build-myself" isDemo={true} />
      </Suspense>
    </div>
  );
}
