// src/app/architect/build/page.tsx
// Practice Stack Architect - Build Experience
// Main workspace for building practice technology stack
// Supports context preloading via URL parameters from ContextualArchitectCTA

import { Metadata } from "next";
import { Suspense } from "react";
import { ArchitectWorkspace, type ArchitectInitialContext } from "../_components/ArchitectWorkspace";
import { ArchitectLoading } from "../_components/ArchitectLoading";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/architect/build`;

export const metadata: Metadata = {
  title: "Build Your Stack | Practice Architect™ | HeyPsych",
  description:
    "Build your mental health practice technology stack with Practice Architect™. Get personalized recommendations and transparent fit scores.",
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: false, // Interactive tool, not for indexing
    follow: true,
  },
};

interface BuildPageProps {
  searchParams: Promise<{
    mode?: string;
    products?: string;          // Comma-separated product slugs to preload
    capabilities?: string;      // Comma-separated capability IDs
    replace?: string;          // Product being replaced (switching context)
    integrates?: string;       // Required integration partner
    category?: string;         // Category context
    type?: string;             // Practice type hint
    utm_source?: string;
    utm_medium?: string;
  }>;
}

export default async function BuildPage({ searchParams }: BuildPageProps) {
  const params = await searchParams;
  const mode = params.mode === "build-for-me" ? "build-for-me" : "build-myself";

  // Parse context from URL parameters (from ContextualArchitectCTA)
  const initialContext: ArchitectInitialContext = {
    preloadProducts: params.products?.split(",").filter(Boolean) || [],
    preloadCapabilities: params.capabilities?.split(",").filter(Boolean) || [],
    switchingFrom: params.replace || undefined,
    requiredIntegration: params.integrates || undefined,
    categoryContext: params.category || undefined,
    practiceTypeHint: params.type || undefined,
    utmSource: params.utm_source || undefined,
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Suspense fallback={<ArchitectLoading />}>
        <ArchitectWorkspace
          initialMode={mode}
          isDemo={false}
          initialContext={initialContext}
        />
      </Suspense>
    </div>
  );
}
