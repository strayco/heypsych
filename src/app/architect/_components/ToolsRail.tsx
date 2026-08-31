/**
 * ToolsRail Component
 *
 * A persistent side rail displaying the user's selected tools (products).
 * This separates the "what you have" (tools) from "what you need" (practice canvas).
 *
 * Design principles:
 * - Tools appear exactly once in this rail, never scattered across areas
 * - Selecting a tool highlights which needs it covers on the canvas
 * - All commercial actions (pricing, details, remove) live here
 * - Mobile: collapses to a floating button that opens a bottom sheet
 *
 * @example
 * ```tsx
 * <ToolsRail
 *   tools={placedProducts}
 *   selectedToolSlug={selectedSlug}
 *   onSelectTool={handleSelect}
 *   onRemoveTool={handleRemove}
 *   onAddTool={() => setShowCatalog(true)}
 * />
 * ```
 */

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { getCategoryLabel } from "@/lib/schemas/clinician-tool-v4";
import type { PracticeAreaId } from "./practice-areas";

// ============================================================================
// Types
// ============================================================================

/**
 * Tool representation for the rail
 * Extend this interface to add more commercial/analytics data
 */
export interface RailTool {
  slug: string;
  name: string;
  category: string;
  /** Human-readable category name (computed from slug if not provided) */
  categoryLabel?: string;
  /** Total number of needs this tool covers */
  coverageCount: number;
  /** Number of practice areas this tool spans */
  areaCount: number;
  /** Areas this tool covers, for highlighting */
  coveredAreas: PracticeAreaId[];
  /** Optional pricing display */
  priceDisplay?: string;
  /** Optional pricing notes */
  priceNotes?: string;
  /** Any warnings or issues with this tool */
  warnings?: string[];
  /** Link to product details page */
  detailsUrl?: string;
}

export interface ToolsRailProps {
  /** List of tools in the user's stack */
  tools: RailTool[];
  /** Currently selected tool slug (for highlighting) */
  selectedToolSlug: string | null;
  /** Callback when a tool is selected/deselected */
  onSelectTool: (slug: string | null) => void;
  /** Callback when a tool is removed */
  onRemoveTool?: (slug: string) => void;
  /** Callback to open the product catalog/search */
  onAddTool?: () => void;
  /** Optional: Show expanded details for a tool */
  expandedToolSlug?: string | null;
  /** Optional: Callback when tool details are expanded */
  onExpandTool?: (slug: string | null) => void;
  /** Optional: Custom empty state message */
  emptyMessage?: string;
  /** Optional: Whether the rail is in a loading state */
  isLoading?: boolean;
  /** Optional: Additional class names */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function ToolsRail({
  tools,
  selectedToolSlug,
  onSelectTool,
  onRemoveTool,
  onAddTool,
  expandedToolSlug,
  onExpandTool,
  emptyMessage = "No tools added yet",
  isLoading = false,
  className = "",
}: ToolsRailProps) {
  // Track which tool card is expanded (if not controlled externally)
  const [internalExpanded, setInternalExpanded] = useState<string | null>(null);
  const expanded = expandedToolSlug ?? internalExpanded;
  const setExpanded = onExpandTool ?? setInternalExpanded;

  // Summary stats
  const totalCoverage = useMemo(
    () => tools.reduce((sum, t) => sum + t.coverageCount, 0),
    [tools]
  );

  return (
    <aside
      className={`
        flex flex-col h-full bg-white border-l border-separator
        ${className}
      `}
      aria-label="Your Tools"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-separator">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-label-secondary" />
          <h2 className="font-semibold text-label-primary">Your Tools</h2>
          {tools.length > 0 && (
            <span className="text-sm text-label-tertiary">
              ({tools.length})
            </span>
          )}
        </div>
        {onAddTool && (
          <button
            onClick={onAddTool}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
            aria-label="Add a new tool"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <ToolsRailSkeleton />
        ) : tools.length === 0 ? (
          <EmptyState message={emptyMessage} onAddTool={onAddTool} />
        ) : (
          <AnimatePresence mode="popLayout">
            {tools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                isSelected={selectedToolSlug === tool.slug}
                isExpanded={expanded === tool.slug}
                onSelect={() =>
                  onSelectTool(selectedToolSlug === tool.slug ? null : tool.slug)
                }
                onRemove={onRemoveTool ? () => onRemoveTool(tool.slug) : undefined}
                onToggleExpand={() =>
                  setExpanded(expanded === tool.slug ? null : tool.slug)
                }
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Summary */}
      {tools.length > 0 && (
        <div className="p-4 border-t border-separator bg-slate-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-label-secondary">Total coverage</span>
            <span className="font-semibold text-label-primary">
              {totalCoverage} needs
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================================================
// Tool Card Component
// ============================================================================

interface ToolCardProps {
  tool: RailTool;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onRemove?: () => void;
  onToggleExpand: () => void;
}

function ToolCard({
  tool,
  isSelected,
  isExpanded,
  onSelect,
  onRemove,
  onToggleExpand,
}: ToolCardProps) {
  const categoryLabel = tool.categoryLabel || getCategoryLabel(tool.category as any) || tool.category;
  const hasWarnings = tool.warnings && tool.warnings.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={`
        relative rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? "border-accent bg-accent/5 ring-2 ring-accent/20"
          : "border-slate-200 bg-white hover:border-slate-300"
        }
      `}
    >
      {/* Main Card Content */}
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-3"
        aria-pressed={isSelected}
        aria-label={`${tool.name}. ${categoryLabel}. Covers ${tool.coverageCount} needs across ${tool.areaCount} areas. ${isSelected ? "Selected." : "Click to highlight coverage."}`}
      >
        {/* Tool Identity */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-label-primary truncate">
              {tool.name}
            </h3>
            <p className="text-xs text-label-tertiary mt-0.5 truncate">
              {categoryLabel}
            </p>
          </div>

          {/* Warning indicator */}
          {hasWarnings && (
            <div className="shrink-0" title={tool.warnings?.join(", ")}>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>

        {/* Coverage Summary */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
            <Check className="h-3 w-3" />
            <span>{tool.coverageCount} needs</span>
          </div>
          {tool.areaCount > 1 && (
            <span className="text-xs text-label-tertiary">
              {tool.areaCount} areas
            </span>
          )}
        </div>
      </button>

      {/* Expand/Collapse Button */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="absolute top-2 right-2 p-1.5 rounded-md text-label-quaternary hover:text-label-secondary hover:bg-slate-100 transition-colors"
        aria-label={isExpanded ? "Collapse details" : "Expand details"}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-3">
              {/* Pricing */}
              {tool.priceDisplay && (
                <div>
                  <p className="text-xs text-label-tertiary mb-0.5">Est. Monthly</p>
                  <p className="text-sm font-medium text-label-primary">
                    {tool.priceDisplay}
                  </p>
                  {tool.priceNotes && (
                    <p className="text-xs text-label-tertiary mt-0.5">
                      {tool.priceNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Warnings */}
              {hasWarnings && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-800">
                    {tool.warnings?.join(" ")}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {tool.detailsUrl && (
                  <a
                    href={tool.detailsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-label-secondary hover:bg-slate-100 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View details</span>
                  </a>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-error hover:bg-error/5 transition-colors"
                    aria-label={`Remove ${tool.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({
  message,
  onAddTool,
}: {
  message: string;
  onAddTool?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
        <Package className="h-6 w-6 text-label-tertiary" />
      </div>
      <p className="text-sm text-label-secondary mb-4">{message}</p>
      {onAddTool && (
        <button
          onClick={onAddTool}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add your first tool</span>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function ToolsRailSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 animate-pulse"
        >
          <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-32 bg-slate-200 rounded mb-3" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Mobile Tools Button & Sheet
// ============================================================================

export interface MobileToolsButtonProps {
  toolCount: number;
  onClick: () => void;
  className?: string;
}

/**
 * Floating button for mobile that shows tool count
 * Opens the tools bottom sheet when clicked
 */
export function MobileToolsButton({
  toolCount,
  onClick,
  className = "",
}: MobileToolsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-2 px-4 py-3 rounded-full
        bg-white border border-separator shadow-lg
        text-sm font-medium text-label-primary
        hover:shadow-xl transition-shadow
        ${className}
      `}
      aria-label={`Your tools. ${toolCount} selected.`}
    >
      <Package className="h-5 w-5 text-label-secondary" />
      <span>My Tools</span>
      {toolCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-xs font-semibold">
          {toolCount}
        </span>
      )}
    </button>
  );
}

export interface MobileToolsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tools: RailTool[];
  selectedToolSlug: string | null;
  onSelectTool: (slug: string | null) => void;
  onRemoveTool?: (slug: string) => void;
  onAddTool?: () => void;
}

/**
 * Bottom sheet for mobile that shows the tools rail content
 */
export function MobileToolsSheet({
  isOpen,
  onClose,
  tools,
  selectedToolSlug,
  onSelectTool,
  onRemoveTool,
  onAddTool,
}: MobileToolsSheetProps) {
  // Track which tool card is expanded in the mobile sheet
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Reset expanded state when sheet closes
  const handleClose = () => {
    setExpandedSlug(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-separator">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-label-secondary" />
                <h2 className="font-semibold text-label-primary">Your Tools</h2>
                {tools.length > 0 && (
                  <span className="text-sm text-label-tertiary">
                    ({tools.length})
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-label-tertiary hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              {tools.length === 0 ? (
                <EmptyState
                  message="No tools added yet"
                  onAddTool={() => {
                    handleClose();
                    onAddTool?.();
                  }}
                />
              ) : (
                tools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    isSelected={selectedToolSlug === tool.slug}
                    isExpanded={expandedSlug === tool.slug}
                    onSelect={() => {
                      onSelectTool(
                        selectedToolSlug === tool.slug ? null : tool.slug
                      );
                    }}
                    onRemove={
                      onRemoveTool ? () => onRemoveTool(tool.slug) : undefined
                    }
                    onToggleExpand={() =>
                      setExpandedSlug(expandedSlug === tool.slug ? null : tool.slug)
                    }
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {onAddTool && (
              <div className="p-4 border-t border-separator">
                <button
                  onClick={() => {
                    handleClose();
                    onAddTool();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Tool</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * PlacedProduct shape from PracticeCanvas for type compatibility
 * This minimal interface allows conversion without importing from PracticeCanvas
 */
export interface PlacedProductLike {
  slug: string;
  name: string;
  category: string;
  totalCoverage: number;
  coverageByArea: Map<PracticeAreaId, string[]>;
}

/**
 * Convert PlacedProduct to RailTool format
 * This bridges the canvas data model with the rail component
 *
 * @param product - PlacedProduct (or compatible shape) from canvas
 * @param options - Optional pricing and details info
 * @returns RailTool for use with ToolsRail component
 *
 * @example
 * ```tsx
 * // In parent component that uses both PracticeCanvas and ToolsRail:
 * const railTools = placedProducts.map(p =>
 *   createRailTool(p, {
 *     priceDisplay: costMap.get(p.slug)?.priceDisplayText,
 *     priceNotes: costMap.get(p.slug)?.notes,
 *     detailsUrl: `/tools/for-clinicians/${category}/${p.slug}`,
 *   })
 * );
 *
 * <ToolsRail tools={railTools} ... />
 * ```
 */
export function createRailTool(
  product: PlacedProductLike,
  options?: {
    priceDisplay?: string;
    priceNotes?: string;
    warnings?: string[];
    detailsUrl?: string;
  }
): RailTool {
  const categoryLabel = getCategoryLabel(product.category as any) || product.category;

  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    categoryLabel,
    coverageCount: product.totalCoverage,
    areaCount: product.coverageByArea.size,
    coveredAreas: Array.from(product.coverageByArea.keys()),
    priceDisplay: options?.priceDisplay,
    priceNotes: options?.priceNotes,
    warnings: options?.warnings,
    detailsUrl: options?.detailsUrl,
  };
}
