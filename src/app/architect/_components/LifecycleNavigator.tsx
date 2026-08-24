// src/app/architect/_components/LifecycleNavigator.tsx
// Left pane lifecycle stage and capability navigator

"use client";

import { useMemo } from "react";
import {
  ChevronRight,
  TrendingUp,
  UserPlus,
  MessageSquare,
  Heart,
  DollarSign,
  Settings,
  Check,
  AlertCircle,
  Circle,
} from "lucide-react";
import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type StackCoverageResult,
  type CapabilityId,
  type LifecycleStageId,
  type CoverageStatus,
  LIFECYCLE_STAGES,
  getCapabilitiesForStage,
} from "@/domains/architect/schemas";
import { trackStageView, trackCapabilityView } from "@/domains/architect/analytics";

interface LifecycleNavigatorProps {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  coverageResult: StackCoverageResult;
  activeStage: string;
  selectedCapability: CapabilityId | null;
  onStageSelect: (stageId: string) => void;
  onCapabilitySelect: (capabilityId: CapabilityId) => void;
}

const STAGE_ICONS: Record<LifecycleStageId, typeof TrendingUp> = {
  grow: TrendingUp,
  access: UserPlus,
  engage: MessageSquare,
  care: Heart,
  revenue: DollarSign,
  operate: Settings,
};

const STAGE_COLORS: Record<LifecycleStageId, string> = {
  grow: "text-success",
  access: "text-accent",
  engage: "text-treatment",
  care: "text-[#E91E63]",
  revenue: "text-warning",
  operate: "text-label-secondary",
};

export function LifecycleNavigator({
  stack,
  metadataMap,
  coverageResult,
  activeStage,
  selectedCapability,
  onStageSelect,
  onCapabilitySelect,
}: LifecycleNavigatorProps) {
  // Convert LIFECYCLE_STAGES record to sorted array
  const stagesArray = useMemo(
    () => Object.values(LIFECYCLE_STAGES).sort((a, b) => a.order - b.order),
    []
  );

  // Get coverage by capability
  const capabilityCoverage = useMemo(() => {
    const coverage = new Map<CapabilityId, CoverageStatus>();
    for (const cap of coverageResult.capabilityCoverage) {
      coverage.set(cap.capabilityId, cap.status);
    }
    return coverage;
  }, [coverageResult]);

  // Calculate stage coverage summaries
  const stageSummaries = useMemo(() => {
    const summaries: Record<
      string,
      { total: number; covered: number; partial: number; missing: number }
    > = {};

    for (const stage of stagesArray) {
      const capabilities = getCapabilitiesForStage(stage.id);
      let covered = 0;
      let partial = 0;
      let missing = 0;

      for (const cap of capabilities) {
        const status = capabilityCoverage.get(cap.id);
        if (status === "covered" || status === "strong") {
          covered++;
        } else if (status === "partial") {
          partial++;
        } else {
          missing++;
        }
      }

      summaries[stage.id] = {
        total: capabilities.length,
        covered,
        partial,
        missing,
      };
    }

    return summaries;
  }, [capabilityCoverage, stagesArray]);

  return (
    <nav className="h-full overflow-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-label-tertiary">
          Lifecycle Stages
        </h2>
      </div>

      <div className="space-y-1 px-2 pb-4">
        {stagesArray.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const colorClass = STAGE_COLORS[stage.id];
          const isActive = activeStage === stage.id;
          const summary = stageSummaries[stage.id];
          const capabilities = getCapabilitiesForStage(stage.id);

          return (
            <div key={stage.id}>
              {/* Stage Header */}
              <button
                onClick={() => {
                  onStageSelect(stage.id);
                  trackStageView(stage.id);
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? "bg-fill-secondary"
                    : "hover:bg-fill-secondary/50"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? "bg-accent/10" : "bg-fill-tertiary"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? colorClass : "text-label-tertiary"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isActive ? "text-label-primary" : "text-label-secondary"
                      }`}
                    >
                      {stage.name}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-label-tertiary transition-transform ${
                        isActive ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-label-tertiary">
                      {summary.covered}/{summary.total} covered
                    </span>
                    {summary.missing > 0 && (
                      <span className="text-xs text-warning">
                        {summary.missing} gaps
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Capabilities */}
              {isActive && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-separator pl-4">
                  {capabilities.map((cap) => {
                    const status = capabilityCoverage.get(cap.id);
                    const isSelected = selectedCapability === cap.id;

                    return (
                      <button
                        key={cap.id}
                        onClick={() => {
                          onCapabilitySelect(cap.id);
                          trackCapabilityView(cap.id, stage.id);
                        }}
                        className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                          isSelected
                            ? "bg-accent/10 text-accent"
                            : "hover:bg-fill-secondary/50"
                        }`}
                      >
                        {/* Status indicator */}
                        <span className="shrink-0">
                          {status === "covered" || status === "strong" ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : status === "partial" ? (
                            <Circle className="h-3.5 w-3.5 text-warning fill-warning/30" />
                          ) : status === "missing" ? (
                            <AlertCircle className="h-3.5 w-3.5 text-error" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-label-quaternary" />
                          )}
                        </span>

                        <span
                          className={`text-xs ${
                            isSelected
                              ? "font-medium text-accent"
                              : status === "missing"
                              ? "text-label-secondary"
                              : "text-label-tertiary"
                          }`}
                        >
                          {cap.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Coverage Summary */}
      <div className="border-t border-separator p-4">
        <div className="rounded-lg bg-fill-tertiary p-3">
          <div className="text-xs font-medium text-label-secondary">
            Overall Coverage
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-separator overflow-hidden">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${coverageResult.knownCoveragePercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-label-primary">
              {coverageResult.knownCoveragePercent}%
            </span>
          </div>
          {coverageResult.gapCapabilities.length > 0 && (
            <p className="mt-2 text-xs text-label-tertiary">
              {coverageResult.gapCapabilities.length} capability{" "}
              {coverageResult.gapCapabilities.length === 1 ? "gap" : "gaps"} to fill
            </p>
          )}
        </div>
      </div>
    </nav>
  );
}
