import Link from "next/link";
import { Card } from "@/components/ui/card";

/**
 * Trending Topics - Discovery Tiles
 *
 * Purpose: Maximize browsing, depth, and SEO value
 *
 * Spec Requirements:
 * - Section title: "Trending Mental Health Topics"
 * - 4 hardcoded tiles (V1):
 *   1. Anxiety vs. Stress — "Know the difference."
 *   2. SSRI Basics — "How they work."
 *   3. CBT Explained — "Therapy in plain English."
 *   4. Panic Attacks — "Immediate coping strategies."
 * - 4 equal-width tiles on desktop
 * - 2×2 wrap on tablet
 * - Stack on mobile
 * - Use existing card typography + spacing
 */

const trendingTopics = [
  {
    title: "Anxiety vs. Stress",
    description: "Know the difference.",
    href: "/conditions/anxiety-fear", // Linking to anxiety category
  },
  {
    title: "SSRI Basics",
    description: "How they work.",
    href: "/treatments", // Linking to treatments - can be made more specific later
  },
  {
    title: "CBT Explained",
    description: "Therapy in plain English.",
    href: "/treatments", // Can link to specific CBT page when available
  },
  {
    title: "Panic Attacks",
    description: "Immediate coping strategies.",
    href: "/conditions/panic-disorder",
  },
];

export function TrendingTopics() {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Title */}
        <h2 className="mb-4 text-center text-2xl font-bold leading-tight sm:text-3xl">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Trending Mental Health Topics
          </span>
        </h2>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {trendingTopics.map((topic) => (
            <Link key={topic.title} href={topic.href} className="group block">
              <div className="relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-blue-500 opacity-5 transition-opacity duration-500 group-hover:opacity-10" />

                {/* Content */}
                <div className="relative p-6">
                  <h3 className="mb-2 text-lg font-bold text-neutral-900">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-neutral-800">{topic.description}</p>
                </div>

                {/* Hover ring effect */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
