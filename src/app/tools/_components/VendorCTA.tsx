"use client";

// Vendor CTA Component
// Call-to-action for tool vendors

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  trackToolsVendorListingCTA,
  trackToolsFeaturedPartnerCTA,
} from "@/lib/analytics/product-events";

export function VendorCTA() {
  return (
    <section className="bg-neutral-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          For Vendors
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Build tools for mental health?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-neutral-400">
          Reach clinicians and patients evaluating mental health products.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/tools/list-your-tool/"
            onClick={() => trackToolsVendorListingCTA("landing-footer")}
            className="group inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            List your tool
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/tools/become-a-partner/"
            onClick={() => trackToolsFeaturedPartnerCTA("landing-footer")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Become a partner
          </Link>
        </div>
      </div>
    </section>
  );
}
