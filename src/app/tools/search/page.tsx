// src/app/tools/search/page.tsx
// Tools search results page with URL-backed filters

import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Search,
  ArrowLeft,
  X,
  Star,
  Smartphone,
  Monitor,
} from "lucide-react";
import { ToolService, type ToolFilters } from "@/lib/tools/tool-service";
import { CampaignService } from "@/lib/tools/campaign-service";
import { siteConfig } from "@/lib/config/site";
import { SponsoredSection } from "../_components/SponsoredSection";
import { SearchFormClient } from "./SearchFormClient";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { cn } from "@/lib/utils";

interface ToolsSearchPageProps {
  searchParams: Promise<{
    q?: string;
    audience?: "patient" | "clinician";
    hub?: string;
    hipaa?: string;
    free?: string;
    sort?: "relevance" | "rating" | "name";
  }>;
}

export async function generateMetadata({ searchParams }: ToolsSearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";
  const title = query
    ? `Search: "${query}" | Mental Health Tools | HeyPsych`
    : "Search Tools | HeyPsych";

  return {
    title,
    description: `Search mental health apps and tools. ${query ? `Results for "${query}".` : "Find therapy apps, AI scribes, and clinical software."} `,
    robots: { index: false, follow: true }, // Don't index search pages
    alternates: {
      canonical: `${siteConfig.url}/tools/search/`,
    },
  };
}

export default async function ToolsSearchPage({ searchParams }: ToolsSearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const audience = params.audience;
  const hubFilter = params.hub;
  const hipaaFilter = params.hipaa === "true";
  const freeFilter = params.free === "true";
  const sortBy = params.sort || "relevance";

  // Build filters
  const filters: ToolFilters = {};
  if (audience === "clinician") {
    filters.isClinicianRelevant = true;
  }
  if (hubFilter) {
    filters.hub = hubFilter as any;
  }

  // Search tools
  const searchResult = await ToolService.search(query, filters);
  let tools = searchResult.tools;

  // Apply additional filters not in ToolFilters
  if (hipaaFilter) {
    tools = tools.filter((t) => t.privacy.hipaa_compliant);
  }
  if (freeFilter) {
    tools = tools.filter((t) => t.pricing.free_tier);
  }
  if (audience === "patient") {
    tools = tools.filter((t) => !t.clinician?.is_clinician_relevant || t.primary_hubs.length > 0);
  }

  // Sort
  if (sortBy === "rating") {
    tools = [...tools].sort((a, b) => (b.app_rating || 0) - (a.app_rating || 0));
  } else if (sortBy === "name") {
    tools = [...tools].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get sponsored tools for search (if relevant query)
  const sponsoredTools = query
    ? await CampaignService.getSponsoredTools(
        "search-results",
        audience || "all",
        undefined,
        2
      )
    : [];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Back Link */}
          <Link
            href="/tools/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl">
                Search Tools
              </h1>
            </div>
          </div>

          {/* Search Form */}
          <Suspense fallback={<SearchFormFallback />}>
            <SearchFormClient
              initialQuery={query}
              initialAudience={audience}
              initialHub={hubFilter}
              initialHipaa={hipaaFilter}
              initialFree={freeFilter}
              initialSort={sortBy}
              resultCount={tools.length}
            />
          </Suspense>

          {/* Results Summary */}
          {query && (
            <p className="mt-4 text-label-secondary">
              {tools.length} {tools.length === 1 ? "result" : "results"} for{" "}
              <span className="font-semibold text-label-primary">&ldquo;{query}&rdquo;</span>
              {audience && (
                <span className="text-label-tertiary">
                  {" "}in {audience === "clinician" ? "clinician" : "patient"} tools
                </span>
              )}
            </p>
          )}
        </div>
      </section>

      {/* Sponsored Results */}
      {sponsoredTools.length > 0 && query && (
        <SponsoredSection sponsoredTools={sponsoredTools} />
      )}

      {/* Filters Bar */}
      <section className="border-b border-separator bg-canvas/50 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={null}>
            <ActiveFilters
              audience={audience}
              hubFilter={hubFilter}
              hipaaFilter={hipaaFilter}
              freeFilter={freeFilter}
              query={query}
            />
          </Suspense>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {!query && (
            <div className="rounded-xl border border-separator bg-surface p-12 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-label-quaternary" />
              <h3 className="mb-2 text-xl font-semibold text-label-primary">
                Enter a search term
              </h3>
              <p className="text-label-tertiary">
                Search for apps, platforms, or features
              </p>
            </div>
          )}

          {query && tools.length === 0 && (
            <div className="rounded-xl border border-separator bg-surface p-12 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-label-quaternary" />
              <h3 className="mb-2 text-xl font-semibold text-label-primary">
                No results found
              </h3>
              <p className="text-label-tertiary">
                No tools match &ldquo;{query}&rdquo;. Try different keywords.
              </p>
              <Link
                href="/tools/"
                className="mt-4 inline-flex items-center gap-2 text-accent hover:text-accent-hover"
              >
                Browse all tools
              </Link>
            </div>
          )}

          {query && tools.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolResultCard key={tool.slug} tool={tool} query={query} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SearchFormFallback() {
  return (
    <div className="h-12 rounded-xl border border-separator bg-canvas animate-pulse" />
  );
}

function ActiveFilters({
  audience,
  hubFilter,
  hipaaFilter,
  freeFilter,
  query,
}: {
  audience?: string;
  hubFilter?: string;
  hipaaFilter: boolean;
  freeFilter: boolean;
  query: string;
}) {
  const hasFilters = audience || hubFilter || hipaaFilter || freeFilter;

  if (!hasFilters) return null;

  const buildUrl = (exclude: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (audience && exclude !== "audience") params.set("audience", audience);
    if (hubFilter && exclude !== "hub") params.set("hub", hubFilter);
    if (hipaaFilter && exclude !== "hipaa") params.set("hipaa", "true");
    if (freeFilter && exclude !== "free") params.set("free", "true");
    return `/tools/search?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-label-tertiary">Active filters:</span>

      {audience && (
        <Link
          href={buildUrl("audience")}
          className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent hover:bg-accent/20 transition-colors"
        >
          {audience === "clinician" ? "Clinicians" : "Patients"}
          <X className="h-3 w-3" />
        </Link>
      )}

      {hubFilter && (
        <Link
          href={buildUrl("hub")}
          className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent hover:bg-accent/20 transition-colors"
        >
          {hubFilter.replace(/-/g, " ")}
          <X className="h-3 w-3" />
        </Link>
      )}

      {hipaaFilter && (
        <Link
          href={buildUrl("hipaa")}
          className="inline-flex items-center gap-1 rounded-full bg-treatment/10 px-3 py-1 text-sm text-treatment hover:bg-treatment/20 transition-colors"
        >
          HIPAA Compliant
          <X className="h-3 w-3" />
        </Link>
      )}

      {freeFilter && (
        <Link
          href={buildUrl("free")}
          className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-3 py-1 text-sm text-positive hover:bg-positive/20 transition-colors"
        >
          Free Tier
          <X className="h-3 w-3" />
        </Link>
      )}

      <Link
        href={`/tools/search?q=${encodeURIComponent(query)}`}
        className="text-sm text-label-tertiary hover:text-label-secondary transition-colors"
      >
        Clear all
      </Link>
    </div>
  );
}

function ToolResultCard({ tool, query }: { tool: DigitalToolV3; query: string }) {
  const isClinician = tool.clinician?.is_clinician_relevant;

  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className={cn(
        "group flex flex-col rounded-xl border border-separator bg-surface p-4 transition-all hover:shadow-soft",
        isClinician ? "hover:border-treatment/20" : "hover:border-accent/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isClinician ? "bg-treatment/5" : "bg-accent/5"
        )}>
          {isClinician ? (
            <Monitor className={cn("h-5 w-5", isClinician ? "text-treatment/70" : "text-accent/70")} />
          ) : (
            <Smartphone className="h-5 w-5 text-accent/70" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-label-primary transition-colors truncate",
            isClinician ? "group-hover:text-treatment" : "group-hover:text-accent"
          )}>
            {tool.name}
          </h3>
          {tool.app_rating && (
            <div className="flex items-center gap-1 text-sm text-label-secondary">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{tool.app_rating}</span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-label-secondary line-clamp-2">
        {tool.short_description}
      </p>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tool.pricing.free_tier && (
          <span className="rounded bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-positive-700">
            Free tier
          </span>
        )}
        {tool.privacy.hipaa_compliant && (
          <span className="rounded bg-treatment/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-treatment-700">
            HIPAA
          </span>
        )}
        {tool.clinical_metadata?.evidence_based && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            Evidence-based
          </span>
        )}
        {isClinician && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
            For Clinicians
          </span>
        )}
      </div>
    </Link>
  );
}

export const revalidate = 3600; // 1 hour
