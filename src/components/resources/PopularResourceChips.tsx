"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const POPULAR_RESOURCES = [
  { name: "PHQ-9", slug: "phq-9", label: "Depression Assessment" },
  { name: "GAD-7", slug: "gad-7", label: "Anxiety Assessment" },
  { name: "988 Lifeline", slug: "988-lifeline", label: "Crisis Support", href: "/resources/support-community" },
  { name: "Find a Therapist", slug: "finding-a-therapist", label: "How-to Guide" },
  { name: "BetterHelp", slug: "betterhelp", label: "Online Therapy" },
  { name: "Crisis Text Line", slug: "crisis-text-line", label: "Text Support", href: "/resources/support-community" },
];

export function PopularResourceChips() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-label-primary0" />
        <span className="text-sm font-semibold text-label-tertiary">Popular</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR_RESOURCES.map((resource, index) => (
          <motion.div
            key={resource.slug}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
          >
            <Link
              href={resource.href || `/resources/${resource.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-separator bg-surface-grouped px-4 py-2 text-sm font-medium text-label-secondary transition-all hover:border-separator hover:bg-fill-secondary hover:text-label-primary"
            >
              <span className="font-semibold">{resource.name}</span>
              <span className="text-xs text-label-primary0 group-hover:text-label-tertiary">
                {resource.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
