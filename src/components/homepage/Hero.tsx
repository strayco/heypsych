"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Hero Section - Search + Trust
 *
 * Purpose: Instant clarity, high trust, immediate direction
 *
 * Spec Requirements:
 * - H1: "Mental health guidance. Grounded in science."
 * - Subhead: "Clear answers on conditions, treatments, and tools. Always free. Always clinical."
 * - Large, center-aligned search bar
 * - Trust indicators: "Evidence-Based · Clinically Reviewed · Updated Weekly"
 * - White background, generous spacing, center-aligned
 */
export function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        {/* H1 */}
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Mental health guidance. Grounded in science.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mb-4 max-w-2xl text-sm text-neutral-800">
          Clear answers on conditions, treatments, and tools. Always free. Always clinical.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mx-auto mb-3 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for anxiety, CBT, psychiatrists…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-6 pl-12 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            />
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </form>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span>Evidence-Based</span>
          <span className="text-slate-300">·</span>
          <span>Clinically Reviewed</span>
          <span className="text-slate-300">·</span>
          <span>Updated Weekly</span>
        </div>
      </div>
    </section>
  );
}
