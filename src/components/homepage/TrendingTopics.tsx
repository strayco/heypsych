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
    title: "Anxiety Disorders",
    description: "Symptoms, causes, and treatment options.",
    href: "/conditions/generalized-anxiety-disorder",
  },
  {
    title: "SSRIs",
    description: "How antidepressants work.",
    href: "/treatments/escitalopram-lexapro",
  },
  {
    title: "CBT",
    description: "Therapy in plain English.",
    href: "/treatments/cognitive-behavioral-therapy",
  },
  {
    title: "Panic Disorder",
    description: "Understanding panic attacks.",
    href: "/conditions/panic-disorder",
  },
];

export function TrendingTopics() {
  return (
    <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Title */}
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary text-center">
          Popular
        </p>
        <h2 className="mt-1 mb-6 text-center text-xl font-semibold text-label-primary sm:text-2xl">
          Trending Mental Health Topics
        </h2>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {trendingTopics.map((topic) => (
            <Link key={topic.title} href={topic.href} className="group block">
              <div className="h-full rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft">
                <h3 className="mb-2 font-semibold text-label-primary group-hover:text-accent transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-label-secondary">{topic.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
