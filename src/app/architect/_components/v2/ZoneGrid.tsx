/**
 * Zone Grid
 *
 * Displays the 4 practice zones in a 2x2 grid (desktop) or vertical stack (mobile).
 * Each zone contains its components.
 */

"use client";

import { motion } from "framer-motion";
import type { ComponentState, ComponentId, SelectedSolution } from "@/domains/architect/schemas/practice-v2";
import {
  getOrderedZones,
  getComponentsForZone,
  type ZoneDefinition,
} from "@/domains/architect/component-mapping";
import { ComponentCard } from "./ComponentCard";

interface ZoneGridProps {
  /** Component states keyed by component ID */
  components: Record<ComponentId, ComponentState>;
  /** Solutions in the stack (for looking up display names) */
  solutions: SelectedSolution[];
  /** Component that was just resolved (for cascade animation) */
  justResolvedComponent?: ComponentId;
  /** Components being animated as part of cascade */
  cascadeComponents?: ComponentId[];
  /** Click handler for components */
  onComponentClick: (componentId: ComponentId) => void;
}

interface ZoneCardProps {
  zone: ZoneDefinition;
  components: Record<ComponentId, ComponentState>;
  solutions: SelectedSolution[];
  justResolvedComponent?: ComponentId;
  cascadeComponents?: ComponentId[];
  onComponentClick: (componentId: ComponentId) => void;
  index: number;
}

const zoneColorClasses: Record<string, { header: string; badge: string }> = {
  blue: {
    header: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  rose: {
    header: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
  },
  emerald: {
    header: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    header: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
};

function ZoneCard({
  zone,
  components,
  solutions,
  justResolvedComponent,
  cascadeComponents = [],
  onComponentClick,
  index,
}: ZoneCardProps) {
  const zoneComponents = getComponentsForZone(zone.id);
  const colors = zoneColorClasses[zone.color] ?? zoneColorClasses.blue;

  // Create a map from slug to solution name for quick lookup
  const solutionNameMap = new Map(solutions.map((s) => [s.slug, s.name]));

  // Calculate how many solutions cover each component (for overlap detection)
  const getOverlapCount = (componentId: ComponentId) =>
    solutions.filter((s) => s.covers.includes(componentId)).length;

  // Count resolved components in this zone
  const resolvedCount = zoneComponents.filter(
    (c) => components[c.id].status !== "unresolved"
  ).length;

  return (
    <motion.div
      className="rounded-2xl border border-separator bg-surface p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Zone header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${colors.header}`}>
          {zone.name}
        </h2>
        {resolvedCount > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}
          >
            {resolvedCount}/{zoneComponents.length}
          </span>
        )}
      </div>

      {/* Components */}
      <div className="space-y-2">
        {zoneComponents.map((componentDef, idx) => {
          const isCascading = cascadeComponents.includes(componentDef.id);
          const cascadeIndex = cascadeComponents.indexOf(componentDef.id);
          const componentState = components[componentDef.id];
          const overlapCount = getOverlapCount(componentDef.id);

          // Get solution name if component is covered
          const solutionName = componentState.status === "covered"
            ? solutionNameMap.get(componentState.solutionSlug)
            : undefined;

          return (
            <ComponentCard
              key={componentDef.id}
              componentId={componentDef.id}
              state={componentState}
              zoneColor={zone.color}
              solutionName={solutionName}
              overlapCount={overlapCount}
              animateResolve={isCascading}
              animationDelay={cascadeIndex * 0.1}
              onClick={() => onComponentClick(componentDef.id)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export function ZoneGrid({
  components,
  solutions,
  justResolvedComponent,
  cascadeComponents,
  onComponentClick,
}: ZoneGridProps) {
  const zones = getOrderedZones();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {zones.map((zone, index) => (
        <ZoneCard
          key={zone.id}
          zone={zone}
          components={components}
          solutions={solutions}
          justResolvedComponent={justResolvedComponent}
          cascadeComponents={cascadeComponents}
          onComponentClick={onComponentClick}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * Mobile-optimized zone grid with collapsible sections.
 */
export function ZoneGridMobile({
  components,
  solutions: _solutions, // Not used in mobile view but required by type
  cascadeComponents,
  onComponentClick,
}: Omit<ZoneGridProps, "justResolvedComponent">) {
  const zones = getOrderedZones();

  return (
    <div className="space-y-4">
      {zones.map((zone, index) => {
        const zoneComponents = getComponentsForZone(zone.id);
        const colors = zoneColorClasses[zone.color] ?? zoneColorClasses.blue;
        const resolvedCount = zoneComponents.filter(
          (c) => components[c.id].status !== "unresolved"
        ).length;

        return (
          <motion.div
            key={zone.id}
            className="rounded-xl border border-separator bg-surface"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            {/* Zone header */}
            <div className="flex items-center justify-between border-b border-separator px-4 py-3">
              <h2 className={`text-sm font-semibold ${colors.header}`}>
                {zone.name}
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}
              >
                {resolvedCount}/{zoneComponents.length}
              </span>
            </div>

            {/* Components */}
            <div className="divide-y divide-separator">
              {zoneComponents.map((componentDef) => {
                const state = components[componentDef.id];
                const Icon = componentDef.icon;
                const isResolved = state.status !== "unresolved";

                return (
                  <button
                    key={componentDef.id}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fill-quaternary"
                    onClick={() => onComponentClick(componentDef.id)}
                  >
                    <Icon className="h-5 w-5 text-label-secondary" />
                    <span className="flex-1 text-sm font-medium text-label-primary">
                      {componentDef.name}
                    </span>
                    {isResolved && (
                      <span className="text-xs text-positive">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
