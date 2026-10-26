"use client";

/**
 * A paid placement. Always labelled "Sponsored", visually set apart from our
 * picks, and explained in one line. It never sits inside a list of picks.
 */

import Link from "next/link";
import type { SponsoredPlacement } from "@/lib/commercial/placements";
import { trackToolsFeaturedPartnerCTA } from "@/lib/analytics/product-events";
import { ToolMark } from "@/components/tools/ToolMark";

export function SponsoredCard({ placement, source }: { placement: SponsoredPlacement; source: string }) {
  return (
    <aside
      aria-label={`Sponsored: ${placement.name}`}
      className="border-separator/70 rounded-2xl border p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label-quaternary text-[11.5px] font-medium tracking-[0.04em] uppercase">Sponsored</p>
        <p className="text-label-quaternary text-[12px]">
          Not one of our picks.{" "}
          <Link href="/about/sponsorship-policy" className="hover:text-label-secondary underline underline-offset-2">
            How sponsorship works
          </Link>
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ToolMark name={placement.name} slug={placement.slug} />
          <div className="min-w-0">
            <p className="text-label-primary text-[17px] leading-tight font-semibold">{placement.name}</p>
            {(placement.offer || placement.summary) && (
              <p className="text-label-secondary mt-0.5 text-[14px] leading-snug">{placement.offer ?? placement.summary}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href={placement.profileHref} className="text-label-secondary hover:text-label-primary text-[14px]">
            Our profile
          </Link>
          <a
            href={placement.href}
            target="_blank"
            rel="noopener nofollow sponsored"
            onClick={() => trackToolsFeaturedPartnerCTA(`${source}:${placement.campaignId}`)}
            className="border-separator text-label-primary hover:border-label-tertiary focus-visible:ring-accent rounded-full border px-4 py-2 text-[14px] font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Visit {placement.name} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
