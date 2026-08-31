/**
 * PracticeBlueprint Component
 *
 * Visual representation of the practice with 6 interactive areas.
 * Designed to feel like configuring a car or furnishing a room -
 * calm, premium, intuitive, and visually satisfying.
 *
 * KEY FEATURE: Connects to the relevance engine to show only
 * items relevant to the user's practice fingerprint.
 */

"use client";

import { useMemo } from "react";
import {
  Shield,
  DoorOpen,
  Heart,
  DollarSign,
  Briefcase,
  TrendingUp,
  Check,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Clock,
  Minus,
  type LucideIcon,
} from "lucide-react";
import {
  type PracticeAreaId,
  type PracticeArea,
  type PracticeAreaItem,
  type PracticeItemStatus,
  type ItemRelevance,
  getOrderedPracticeAreas,
  PRACTICE_AREAS,
  PRACTICE_ITEM_STATUS_LABELS,
  ITEM_RELEVANCE_LABELS,
  getItemRelevance,
} from "./practice-areas";
import type {
  PracticeStack,
  ProductArchitectureMetadata,
  StackCoverageResult,
  PracticeFingerprint,
  CapabilityId,
  ItemDecision,
} from "@/domains/architect/schemas";
import { getItemDecision } from "@/domains/architect/schemas";
import { getAllCapabilityRelevance, type RelevanceResult } from "@/domains/architect/engines/relevance-engine";

// Icon mapping
const AREA_ICONS: Record<PracticeAreaId, LucideIcon> = {
  foundation: Shield,
  "front-door": DoorOpen,
  care: Heart,
  money: DollarSign,
  "back-office": Briefcase,
  growth: TrendingUp,
};

// Color schemes for each area
const AREA_COLORS: Record<PracticeAreaId, { bg: string; border: string; text: string; accent: string }> = {
  foundation: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    accent: "bg-slate-600",
  },
  "front-door": {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    accent: "bg-blue-600",
  },
  care: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    accent: "bg-rose-600",
  },
  money: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    accent: "bg-emerald-600",
  },
  "back-office": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    accent: "bg-amber-600",
  },
  growth: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    accent: "bg-purple-600",
  },
};

interface AreaItemStatus {
  itemId: string;
  status: PracticeItemStatus;
  productName?: string;
  isIncluded?: boolean;
  relevance: ItemRelevance;
  isRelevant: boolean;
}

interface AreaStatus {
  areaId: PracticeAreaId;
  readyCount: number;
  totalCount: number; // Only relevant items
  needsAttention: boolean;
  items: AreaItemStatus[];
}

interface PracticeBlueprintProps {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  coverageResult: StackCoverageResult;
  selectedArea: PracticeAreaId | null;
  onSelectArea: (areaId: PracticeAreaId) => void;
  onSelectItem: (areaId: PracticeAreaId, itemId: string) => void;
  isCompact?: boolean;
  /** Show all items including irrelevant ones (for advanced mode) */
  showAllItems?: boolean;
}

export function PracticeBlueprint({
  stack,
  metadataMap,
  coverageResult,
  selectedArea,
  onSelectArea,
  onSelectItem,
  isCompact = false,
  showAllItems = false,
}: PracticeBlueprintProps) {
  const areas = getOrderedPracticeAreas();

  // Calculate capability relevance from fingerprint
  const capabilityRelevanceMap = useMemo(
    () => getAllCapabilityRelevance(stack.fingerprint),
    [stack.fingerprint]
  );

  // Calculate status for each area, filtering by relevance
  const areaStatuses = useMemo((): AreaStatus[] => {
    return areas.map((area) => {
      const itemStatuses: AreaItemStatus[] = area.items.map((item) => {
        // Calculate relevance for this item
        const { relevance, isRelevant } = getItemRelevance(item, capabilityRelevanceMap);

        // Get user decision from stack
        const decision = getItemDecision(stack, area.id, item.id);

        // If item is irrelevant AND user hasn't made a decision, auto-mark as not-needed
        if (!isRelevant && !decision && !showAllItems) {
          return {
            itemId: item.id,
            status: "not-needed" as PracticeItemStatus,
            relevance,
            isRelevant,
          };
        }

        // Check user decisions (persisted in stack)
        if (decision === "not-needed") {
          return { itemId: item.id, status: "not-needed" as PracticeItemStatus, relevance, isRelevant };
        }
        if (decision === "add-later") {
          return { itemId: item.id, status: "add-later" as PracticeItemStatus, relevance, isRelevant };
        }
        if (decision === "complete") {
          return { itemId: item.id, status: "complete" as PracticeItemStatus, relevance, isRelevant };
        }

        // Foundation items (non-software) without decision
        if (item.isFoundational) {
          return {
            itemId: item.id,
            status: "choose" as PracticeItemStatus,
            relevance,
            isRelevant,
          };
        }

        // Check capability coverage
        if (item.capabilities.length === 0) {
          return { itemId: item.id, status: "unknown" as PracticeItemStatus, relevance, isRelevant };
        }

        // Find products covering these capabilities
        const coveringProducts: string[] = [];
        for (const selected of stack.selectedProducts) {
          const metadata = metadataMap.get(selected.slug);
          if (metadata) {
            const hasCoverage = item.capabilities.some((cap) =>
              metadata.capabilities.some(
                (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
              )
            );
            if (hasCoverage) {
              coveringProducts.push(selected.slug);
            }
          }
        }

        if (coveringProducts.length > 0) {
          // Check if this is "included" (covered by a multi-capability product)
          const product = metadataMap.get(coveringProducts[0]);
          const isMultiFunction = product && product.capabilities.length > 3;

          return {
            itemId: item.id,
            status: (isMultiFunction ? "included" : "ready") as PracticeItemStatus,
            productName: coveringProducts[0],
            relevance,
            isRelevant,
          };
        }

        return { itemId: item.id, status: "choose" as PracticeItemStatus, relevance, isRelevant };
      });

      // Filter to only relevant items for counting (unless showing all)
      const relevantItems = showAllItems
        ? itemStatuses
        : itemStatuses.filter((i) => i.isRelevant);

      const readyCount = relevantItems.filter(
        (i) => i.status === "ready" || i.status === "included" || i.status === "complete"
      ).length;

      const needsAttention = relevantItems.some((i) => i.status === "attention");

      return {
        areaId: area.id,
        readyCount,
        totalCount: relevantItems.length,
        needsAttention,
        items: showAllItems ? itemStatuses : relevantItems,
      };
    });
  }, [areas, stack, metadataMap, capabilityRelevanceMap, showAllItems]);

  if (isCompact) {
    return (
      <CompactBlueprint
        areas={areas}
        areaStatuses={areaStatuses}
        selectedArea={selectedArea}
        onSelectArea={onSelectArea}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Main grid layout */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {areas.map((area, idx) => {
          const status = areaStatuses.find((s) => s.areaId === area.id)!;
          const isSelected = selectedArea === area.id;
          const Icon = AREA_ICONS[area.id];
          const colors = AREA_COLORS[area.id];
          const isComplete = status.readyCount === status.totalCount;
          const hasProgress = status.readyCount > 0;

          return (
            <button
              key={area.id}
              onClick={() => onSelectArea(area.id)}
              className={`
                group relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all
                ${isSelected
                  ? `${colors.border} ${colors.bg} ring-2 ring-offset-2 ring-${area.color}-400`
                  : `border-separator bg-surface hover:border-neutral-300 hover:shadow-sm`
                }
              `}
            >
              {/* Status indicator */}
              <div className="absolute right-3 top-3">
                {isComplete ? (
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${colors.accent} text-white`}>
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : status.needsAttention ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                ) : hasProgress ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-separator text-xs font-medium text-label-secondary">
                    {status.readyCount}
                  </div>
                ) : null}
              </div>

              {/* Icon and title */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>

              <h3 className="mt-3 font-semibold text-label-primary">{area.name}</h3>
              <p className="mt-0.5 text-sm text-label-secondary line-clamp-2">{area.description}</p>

              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-separator">
                  <div
                    className={`h-full rounded-full transition-all ${colors.accent}`}
                    style={{ width: `${(status.readyCount / status.totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-label-tertiary">
                  {status.readyCount}/{status.totalCount}
                </span>
              </div>

              {/* Expand indicator */}
              <div
                className={`mt-2 flex items-center gap-1 text-xs font-medium transition-colors ${
                  isSelected ? colors.text : "text-label-tertiary group-hover:text-label-secondary"
                }`}
              >
                {isSelected ? "Viewing" : "View details"}
                <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? "rotate-90" : ""}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected area detail panel */}
      {selectedArea && (
        <AreaDetailPanel
          area={PRACTICE_AREAS[selectedArea]}
          status={areaStatuses.find((s) => s.areaId === selectedArea)!}
          onSelectItem={(itemId) => onSelectItem(selectedArea, itemId)}
        />
      )}
    </div>
  );
}

/**
 * Compact blueprint for mobile area selector
 */
function CompactBlueprint({
  areas,
  areaStatuses,
  selectedArea,
  onSelectArea,
}: {
  areas: PracticeArea[];
  areaStatuses: AreaStatus[];
  selectedArea: PracticeAreaId | null;
  onSelectArea: (areaId: PracticeAreaId) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {areas.map((area) => {
        const status = areaStatuses.find((s) => s.areaId === area.id)!;
        const isSelected = selectedArea === area.id;
        const Icon = AREA_ICONS[area.id];
        const colors = AREA_COLORS[area.id];
        const isComplete = status.readyCount === status.totalCount;

        return (
          <button
            key={area.id}
            onClick={() => onSelectArea(area.id)}
            className={`
              flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-all
              ${isSelected ? `${colors.bg} ${colors.border} border-2` : "border-2 border-transparent hover:bg-fill-secondary"}
            `}
          >
            <div className="relative">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? colors.bg : "bg-fill-secondary"}`}>
                <Icon className={`h-5 w-5 ${isSelected ? colors.text : "text-label-secondary"}`} />
              </div>
              {isComplete && (
                <div className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${colors.accent} text-white`}>
                  <Check className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
            <span className={`text-xs font-medium ${isSelected ? colors.text : "text-label-secondary"}`}>
              {area.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Detail panel showing items within a selected area
 */
function AreaDetailPanel({
  area,
  status,
  onSelectItem,
}: {
  area: PracticeArea;
  status: AreaStatus;
  onSelectItem: (itemId: string) => void;
}) {
  const colors = AREA_COLORS[area.id];
  const Icon = AREA_ICONS[area.id];

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${colors.text}`}>{area.name}</h3>
          <p className="text-sm text-label-secondary">{area.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-label-primary">
            {status.readyCount}/{status.totalCount}
          </div>
          <div className="text-xs text-label-tertiary">ready</div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {status.items.map((itemStatus) => {
          const item = area.items.find((i) => i.id === itemStatus.itemId);
          if (!item) return null;

          const itemState = itemStatus.status;
          const relevance = itemStatus.relevance;

          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`
                group flex items-center gap-3 rounded-xl bg-white p-3 text-left transition-all hover:shadow-sm
                ${itemState === "ready" || itemState === "included" || itemState === "complete"
                  ? "ring-1 ring-inset ring-emerald-200"
                  : itemState === "not-needed"
                  ? "ring-1 ring-inset ring-neutral-100 opacity-60"
                  : "ring-1 ring-inset ring-separator"
                }
              `}
            >
              {/* Status icon */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  itemState === "ready" || itemState === "included" || itemState === "complete"
                    ? "bg-emerald-100 text-emerald-600"
                    : itemState === "choose"
                    ? relevance === "core"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-amber-100 text-amber-600"
                    : itemState === "not-needed"
                    ? "bg-neutral-100 text-neutral-400"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {itemState === "ready" || itemState === "complete" ? (
                  <Check className="h-4 w-4" />
                ) : itemState === "included" ? (
                  <Sparkles className="h-4 w-4" />
                ) : itemState === "not-needed" ? (
                  <Minus className="h-4 w-4" />
                ) : itemState === "add-later" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-label-primary">{item.name}</span>
                  {/* Relevance badge for "choose" items */}
                  {itemState === "choose" && relevance === "core" && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      Essential
                    </span>
                  )}
                </div>
                <div className="text-xs text-label-tertiary truncate">
                  {itemState === "included"
                    ? "Included with your products"
                    : itemState === "ready" || itemState === "complete"
                    ? PRACTICE_ITEM_STATUS_LABELS[itemState]
                    : itemState === "not-needed"
                    ? "Not needed for your practice"
                    : item.description}
                </div>
              </div>

              {/* Action hint */}
              {(itemState === "choose" || itemState === "add-later") && (
                <ChevronRight className="h-4 w-4 text-label-tertiary group-hover:text-label-secondary transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Overall practice readiness summary
 * Only counts items that are RELEVANT based on fingerprint
 */
export function PracticeReadinessSummary({
  stack,
  metadataMap,
  coverageResult,
}: {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  coverageResult: StackCoverageResult;
}) {
  const areas = getOrderedPracticeAreas();

  // Calculate capability relevance from fingerprint
  const capabilityRelevanceMap = useMemo(
    () => getAllCapabilityRelevance(stack.fingerprint),
    [stack.fingerprint]
  );

  // Calculate overall stats - only counting relevant items
  const stats = useMemo(() => {
    let totalItems = 0;
    let readyItems = 0;
    let productCount = stack.selectedProducts.length;

    for (const area of areas) {
      for (const item of area.items) {
        // Check if item is relevant based on fingerprint
        const { isRelevant } = getItemRelevance(item, capabilityRelevanceMap);

        // Skip irrelevant items
        if (!isRelevant) continue;

        totalItems++;

        // Check user decision
        const decision = getItemDecision(stack, area.id, item.id);
        if (decision === "complete") {
          readyItems++;
          continue;
        }
        if (decision === "not-needed") {
          // User marked as not needed - don't count
          totalItems--;
          continue;
        }

        // Foundational items without "complete" decision are not ready
        if (item.isFoundational) {
          continue;
        }

        // Check coverage from products
        for (const selected of stack.selectedProducts) {
          const metadata = metadataMap.get(selected.slug);
          if (metadata) {
            const hasCoverage = item.capabilities.some((cap) =>
              metadata.capabilities.some(
                (c) => c.capabilityId === cap && (c.strength === "core" || c.strength === "strong")
              )
            );
            if (hasCoverage) {
              readyItems++;
              break;
            }
          }
        }
      }
    }

    return {
      totalItems: Math.max(1, totalItems), // Avoid division by zero
      readyItems,
      productCount,
      percentReady: totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0,
    };
  }, [areas, stack, metadataMap, capabilityRelevanceMap]);

  // Determine overall state
  const getOverallState = () => {
    if (stats.percentReady >= 80) return { label: "Ready to Launch", color: "emerald" };
    if (stats.percentReady >= 50) return { label: "Making Progress", color: "amber" };
    if (stats.percentReady > 0) return { label: "Getting Started", color: "blue" };
    return { label: "Start Building", color: "slate" };
  };

  const state = getOverallState();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-separator bg-surface p-4">
      {/* Progress ring */}
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-separator"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${stats.percentReady * 1.76} 176`}
            strokeLinecap="round"
            className={`text-${state.color}-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-label-primary">{stats.percentReady}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1">
        <div className={`text-sm font-semibold text-${state.color}-600`}>{state.label}</div>
        <div className="mt-1 text-2xl font-bold text-label-primary">
          {stats.readyItems} of {stats.totalItems}
        </div>
        <div className="text-sm text-label-secondary">
          practice items ready {stats.productCount > 0 && `with ${stats.productCount} product${stats.productCount > 1 ? "s" : ""}`}
        </div>
      </div>
    </div>
  );
}
