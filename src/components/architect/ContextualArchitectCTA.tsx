/**
 * Contextual Architect CTA Component
 *
 * Context-aware call-to-action that routes users into Practice Architect™
 * with pre-populated data based on their current page context.
 *
 * Principle: Never ask users to repeat information already known from context.
 */

"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, GitCompare, Layers, RefreshCw, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type ArchitectContextSource =
  | "product"           // Single product page
  | "comparison"        // Comparison page (2+ products)
  | "category"          // Category listing page
  | "integration"       // Integration/compatibility page
  | "practice-type"     // Practice type landing page
  | "alternative"       // Alternatives page
  | "pricing"           // Pricing page
  | "migration"         // Migration/switch-from page
  | "homepage"          // Homepage or general
  | "search";           // Search results

export interface ArchitectContext {
  source: ArchitectContextSource;
  preloadedProducts?: string[];          // Product slugs to preload
  preloadedCapabilities?: string[];      // Capability IDs to set as needs
  practiceTypeHint?: string;             // Practice type to suggest
  switchingFrom?: string;                // Product being replaced
  integratesWith?: string;               // Required integration partner
  categorySlug?: string;                 // Current category context
  utmSource?: string;                    // UTM tracking
}

export interface ContextualArchitectCTAProps {
  context: ArchitectContext;
  variant?: "inline" | "banner" | "card" | "sticky" | "minimal";
  className?: string;
}

// ============================================================================
// HEADLINE & SUBTEXT GENERATORS
// ============================================================================

function getHeadline(context: ArchitectContext): string {
  switch (context.source) {
    case "product":
      return "See how this fits your practice";
    case "comparison":
      if (context.preloadedProducts && context.preloadedProducts.length >= 2) {
        return "Compare these for YOUR practice";
      }
      return "Find the right fit for your practice";
    case "category":
      return "Find the best fit for your workflow";
    case "integration":
      return "See this combination in your architecture";
    case "practice-type":
      return "Build your practice stack";
    case "alternative":
      return "Build your replacement stack";
    case "pricing":
      return "Calculate your total stack cost";
    case "migration":
      return "Plan your migration";
    case "search":
      return "Build a complete stack around this";
    default:
      return "Architect your practice technology";
  }
}

function getSubtext(context: ArchitectContext): string {
  switch (context.source) {
    case "product":
      return "Get a personalized fit score with Practice Architect™ based on your practice type, size, and needs.";
    case "comparison":
      return "See which option best fits your specific practice requirements in Practice Architect™.";
    case "category":
      return "Answer a few questions and get personalized recommendations from Practice Architect™.";
    case "integration":
      return "Check compatibility and build your complete technology stack with Practice Architect™.";
    case "practice-type":
      return "Get recommendations tailored to your practice type from Practice Architect™.";
    case "alternative":
      return "Find the best replacement based on your specific needs with Practice Architect™.";
    case "pricing":
      return "See total costs across your entire technology stack with Practice Architect™.";
    case "migration":
      return "Get a detailed plan for switching your practice technology with Practice Architect™.";
    case "search":
      return "Build a complete practice stack around your search with Practice Architect™.";
    default:
      return "Build your ideal mental health practice technology stack with Practice Architect™.";
  }
}

function getButtonText(context: ArchitectContext): string {
  switch (context.source) {
    case "product":
      return "Check Fit";
    case "comparison":
      return "Compare for My Practice";
    case "category":
      return "Find My Match";
    case "integration":
      return "View in Practice Architect™";
    case "practice-type":
      return "Start Building";
    case "alternative":
      return "Find Alternatives";
    case "pricing":
      return "Calculate Costs";
    case "migration":
      return "Plan Migration";
    default:
      return "Open Practice Architect™";
  }
}

function getIcon(context: ArchitectContext) {
  switch (context.source) {
    case "comparison":
      return GitCompare;
    case "integration":
      return Layers;
    case "alternative":
    case "migration":
      return RefreshCw;
    case "pricing":
      return Calculator;
    default:
      return Sparkles;
  }
}

// ============================================================================
// URL BUILDER
// ============================================================================

export function buildArchitectUrl(context: ArchitectContext): string {
  const params = new URLSearchParams();

  // Set mode based on context
  if (context.switchingFrom) {
    params.set("mode", "audit");
    params.set("replace", context.switchingFrom);
  } else if (context.preloadedProducts && context.preloadedProducts.length > 0) {
    params.set("mode", "build-myself");
    params.set("products", context.preloadedProducts.join(","));
  } else if (context.practiceTypeHint) {
    params.set("mode", "build-for-me");
    params.set("type", context.practiceTypeHint);
  } else {
    params.set("mode", "build-for-me");
  }

  // Add capabilities if specified
  if (context.preloadedCapabilities && context.preloadedCapabilities.length > 0) {
    params.set("capabilities", context.preloadedCapabilities.join(","));
  }

  // Add integration requirement
  if (context.integratesWith) {
    params.set("integrates", context.integratesWith);
  }

  // Add category context
  if (context.categorySlug) {
    params.set("category", context.categorySlug);
  }

  // Add UTM tracking
  params.set("utm_source", context.utmSource || context.source);
  params.set("utm_medium", "cta");

  return `/architect/build?${params.toString()}`;
}

// ============================================================================
// COMPONENT VARIANTS
// ============================================================================

function InlineCTA({ context, className }: ContextualArchitectCTAProps) {
  const Icon = getIcon(context);

  return (
    <Link
      href={buildArchitectUrl(context)}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {getButtonText(context)}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function BannerCTA({ context, className }: ContextualArchitectCTAProps) {
  const Icon = getIcon(context);

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="font-semibold text-label-primary">
            {getHeadline(context)}
          </p>
          <p className="text-sm text-label-secondary mt-0.5">
            {getSubtext(context)}
          </p>
        </div>
      </div>
      <Link
        href={buildArchitectUrl(context)}
        className="group flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover whitespace-nowrap"
      >
        {getButtonText(context)}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function CardCTA({ context, className }: ContextualArchitectCTAProps) {
  const Icon = getIcon(context);

  return (
    <div className={cn(
      "rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-accent/30 hover:shadow-soft",
      className
    )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-label-primary">
        {getHeadline(context)}
      </h3>
      <p className="mt-2 text-sm text-label-secondary">
        {getSubtext(context)}
      </p>
      <Link
        href={buildArchitectUrl(context)}
        className="group mt-4 flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover"
      >
        {getButtonText(context)}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function StickyCTA({ context, className }: ContextualArchitectCTAProps) {
  const Icon = getIcon(context);

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t border-separator bg-surface/95 backdrop-blur-sm px-4 py-3 sm:px-6",
      className
    )}>
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-accent hidden sm:block" />
          <p className="text-sm font-medium text-label-primary">
            {getHeadline(context)}
          </p>
        </div>
        <Link
          href={buildArchitectUrl(context)}
          className="group flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover"
        >
          {getButtonText(context)}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function MinimalCTA({ context, className }: ContextualArchitectCTAProps) {
  return (
    <Link
      href={buildArchitectUrl(context)}
      className={cn(
        "group inline-flex items-center gap-1.5 text-xs font-medium text-label-tertiary hover:text-accent transition-colors",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {getButtonText(context)}
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContextualArchitectCTA({
  context,
  variant = "banner",
  className,
}: ContextualArchitectCTAProps) {
  switch (variant) {
    case "inline":
      return <InlineCTA context={context} className={className} />;
    case "banner":
      return <BannerCTA context={context} className={className} />;
    case "card":
      return <CardCTA context={context} className={className} />;
    case "sticky":
      return <StickyCTA context={context} className={className} />;
    case "minimal":
      return <MinimalCTA context={context} className={className} />;
    default:
      return <BannerCTA context={context} className={className} />;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export function ProductArchitectCTA({
  productSlug,
  productName,
  className
}: {
  productSlug: string;
  productName?: string;
  className?: string;
}) {
  return (
    <ContextualArchitectCTA
      context={{
        source: "product",
        preloadedProducts: [productSlug],
      }}
      variant="banner"
      className={className}
    />
  );
}

export function ComparisonArchitectCTA({
  productSlugs,
  className
}: {
  productSlugs: string[];
  className?: string;
}) {
  return (
    <ContextualArchitectCTA
      context={{
        source: "comparison",
        preloadedProducts: productSlugs,
      }}
      variant="banner"
      className={className}
    />
  );
}

export function CategoryArchitectCTA({
  categorySlug,
  capabilities,
  className
}: {
  categorySlug: string;
  capabilities?: string[];
  className?: string;
}) {
  return (
    <ContextualArchitectCTA
      context={{
        source: "category",
        categorySlug,
        preloadedCapabilities: capabilities,
      }}
      variant="banner"
      className={className}
    />
  );
}

export function IntegrationArchitectCTA({
  productSlugs,
  className
}: {
  productSlugs: string[];
  className?: string;
}) {
  return (
    <ContextualArchitectCTA
      context={{
        source: "integration",
        preloadedProducts: productSlugs,
      }}
      variant="banner"
      className={className}
    />
  );
}

export function AlternativeArchitectCTA({
  switchingFrom,
  className
}: {
  switchingFrom: string;
  className?: string;
}) {
  return (
    <ContextualArchitectCTA
      context={{
        source: "alternative",
        switchingFrom,
      }}
      variant="banner"
      className={className}
    />
  );
}

export function PracticeTypeArchitectCTA({
  practiceType,
  className
}: {
  practiceType: string;
  className?: string;
}) {
  return (
    <ContextualArchitectCTA
      context={{
        source: "practice-type",
        practiceTypeHint: practiceType,
      }}
      variant="banner"
      className={className}
    />
  );
}
