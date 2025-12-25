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
        <TrendingUp className="h-4 w-4 text-neutral-600" />
        <span className="text-sm font-semibold text-neutral-700">Popular</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR_RESOURCES.map((resource, index) => (
          <motion.div
            key={resource.slug}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={resource.href || `/resources/${resource.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow"
            >
              <span className="font-semibold">{resource.name}</span>
              <span className="text-xs text-neutral-600 group-hover:text-blue-600">
                {resource.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
