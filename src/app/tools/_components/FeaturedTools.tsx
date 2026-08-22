"use client";

// Featured Tools Component
// Editorial picks section (not sponsored)

import Link from "next/link";
import { Star, ArrowRight, Smartphone } from "lucide-react";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { isComplianceConfirmedYes } from "@/lib/schemas/tool-editorial";
import { trackToolsProfileView } from "@/lib/analytics/product-events";

interface FeaturedToolsProps {
  tools: DigitalToolV3[];
}

export function FeaturedTools({ tools }: FeaturedToolsProps) {
  return (
    <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-label-primary sm:text-2xl">
              Popular Tools
            </h2>
            <p className="mt-1 text-sm text-label-secondary">
              Frequently viewed by patients and clinicians
            </p>
          </div>
          <Link
            href="/tools/search/"
            className="group flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.slice(0, 6).map((tool) => (
            <FeaturedToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedToolCard({ tool }: { tool: DigitalToolV3 }) {
  return (
    <Link
      href={`/tools/${tool.slug}/`}
      onClick={() => trackToolsProfileView(tool.slug, "featured-section")}
      className="group flex items-start gap-4 rounded-xl border border-separator bg-surface p-4 transition-all hover:border-accent/20 hover:shadow-soft"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/5">
        <Smartphone className="h-6 w-6 text-accent/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-label-primary group-hover:text-accent transition-colors truncate">
            {tool.name}
          </h3>
          {tool.app_rating && (
            <div className="flex shrink-0 items-center gap-1 text-sm text-label-secondary">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{tool.app_rating}</span>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-label-secondary line-clamp-2">
          {tool.short_description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tool.pricing.free_tier && (
            <span className="rounded bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-positive-700">
              Free tier
            </span>
          )}
          {isComplianceConfirmedYes(tool.privacy.hipaa_compliant) && (
            <span className="rounded bg-treatment/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-treatment-700">
              HIPAA
            </span>
          )}
          {tool.clinical_metadata?.evidence_based && (
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              Evidence-based
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
