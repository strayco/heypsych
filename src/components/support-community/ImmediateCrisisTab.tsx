import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Resource } from "@/lib/types/support-community";
import type { Hotline } from "@/lib/loaders/support-community-loader";
import { ResourceCard } from "./ResourceCard";
import { CrisisAtoZSection } from "./CrisisAtoZSection";

interface Props {
  resources: Resource[];
  hotlines: Hotline[];
}

export function ImmediateCrisisTab({ resources, hotlines }: Props) {
  // Pin 988 and Crisis Text Line
  const pinnedResources = useMemo(
    () => resources.filter((r) => ["988-lifeline", "crisis-text-line"].includes(r.id)),
    [resources]
  );

  return (
    <div className="space-y-8">
      {/* Emergency Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-500 to-rose-600 p-6 shadow-xl"
      >
        <div className="text-center text-white">
          <h2 className="mb-2 text-2xl font-bold">In Crisis? Get Help Now</h2>
          <p className="text-red-100">Free, confidential support available 24/7</p>
        </div>
      </motion.div>

      {/* Pinned Resources */}
      <div className="grid gap-6 md:grid-cols-2">
        {pinnedResources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ResourceCard resource={resource} variant="crisis" />
          </motion.div>
        ))}
      </div>

      {/* A-Z Specialized Crisis Hotlines */}
      {hotlines.length > 0 && (
        <div className="mt-12 border-t border-slate-200 pt-12">
          <CrisisAtoZSection hotlines={hotlines} />
        </div>
      )}
    </div>
  );
}
