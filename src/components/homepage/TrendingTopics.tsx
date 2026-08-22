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
 *   4. Panic Attacks — "What's happening in the body and mind."
 * - 4 equal-width tiles on desktop
 * - 2×2 wrap on tablet
 * - Stack on mobile
 * - Use existing card typography + spacing
 */

const trendingTopics = [
  {
    title: "Anxiety vs. Stress",
    description: "Know the difference.",
    href: "/resources/knowledge-hub/how-to-guides/anxiety-vs-stress",
  },
  {
    title: "SSRI Basics",
    description: "How they work.",
    href: "/resources/knowledge-hub/research-and-science/ssri-basics",
  },
  {
    title: "CBT Explained",
    description: "Therapy in plain English.",
    href: "/resources/knowledge-hub/how-to-guides/cbt-explained",
  },
  {
    title: "Panic Attacks",
    description: "What's happening in the body and mind.",
    href: "/resources/knowledge-hub/how-to-guides/panic-attacks-body-mind",
  },
];

export function TrendingTopics() {
  return (
    <section className="bg-canvas px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Title */}
        <h2 className="mb-4 text-center text-2xl font-bold leading-tight sm:text-3xl">
          <span className="bg-linear-to-r from-accent-600 to-accent bg-clip-text text-transparent">
            Trending Mental Health Topics
          </span>
        </h2>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {trendingTopics.map((topic) => (
            <Link key={topic.title} href={topic.href} className="group block">
              <div className="relative h-full overflow-hidden rounded-2xl border border-separator bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600 opacity-5 transition-opacity duration-500 group-hover:opacity-10" />

                {/* Content */}
                <div className="relative p-6">
                  <h3 className="mb-2 text-lg font-bold text-label-primary">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-label-secondary">{topic.description}</p>
                </div>

                {/* Hover ring effect */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-separator-opaque" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
