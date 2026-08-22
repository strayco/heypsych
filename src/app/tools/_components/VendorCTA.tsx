"use client";

// Vendor CTA Component
// Call-to-action for tool vendors

import Link from "next/link";
import { Building2, Sparkles, ArrowRight } from "lucide-react";
import {
  trackToolsVendorListingCTA,
  trackToolsFeaturedPartnerCTA,
} from "@/lib/analytics/product-events";

export function VendorCTA() {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
          <Building2 className="h-4 w-4 text-white/80" />
          <span className="text-sm font-medium text-white/80">For Vendors</span>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
          Build tools for mental health?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Reach clinicians and patients actively evaluating mental health products.
          Join our directory to connect with your target audience.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/tools/list-your-tool/"
            onClick={() => trackToolsVendorListingCTA("landing-footer")}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:bg-white/90"
          >
            List your tool
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/tools/become-a-partner/"
            onClick={() => trackToolsFeaturedPartnerCTA("landing-footer")}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4" />
            Become a featured partner
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/50">
          Free basic listings available.{" "}
          <Link href="/tools/become-a-partner/" className="underline hover:text-white/70">
            Learn about partnership options
          </Link>
        </p>
      </div>
    </section>
  );
}
