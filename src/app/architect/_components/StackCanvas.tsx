// src/app/architect/_components/StackCanvas.tsx
// Main canvas displaying selected products in the stack

"use client";

import { useMemo } from "react";
import {
  Plus,
  X,
  AlertTriangle,
  Layers,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  type PracticeStack,
  type ProductArchitectureMetadata,
  type StackCoverageResult,
  type OverlapAssessment,
  type CompatibilityAssessment,
  type CapabilityId,
  LIFECYCLE_STAGES,
  getCapabilitiesForStage,
  getCapability,
} from "@/domains/architect/schemas";
import type { DemoProductDisplay } from "@/domains/architect/fixtures";
import type { ArchitectProductDisplay } from "@/domains/architect/services";

// Common display interface that both demo and real products satisfy
type ProductDisplay = DemoProductDisplay | ArchitectProductDisplay;

interface StackCanvasProps {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  productDisplayMap: Map<string, ProductDisplay>;
  coverageResult: StackCoverageResult;
  overlapResult: OverlapAssessment[];
  compatibilityResult: CompatibilityAssessment[];
  activeStage: string;
  selectedCapability: CapabilityId | null;
  onAddProduct: (slug: string, category: string) => void;
  onRemoveProduct: (slug: string, category: string) => void;
  onCapabilitySelect: (capabilityId: CapabilityId) => void;
  isDemo: boolean;
}

export function StackCanvas({
  stack,
  metadataMap,
  productDisplayMap,
  coverageResult,
  overlapResult,
  compatibilityResult,
  activeStage,
  selectedCapability,
  onAddProduct,
  onRemoveProduct,
  onCapabilitySelect,
  isDemo,
}: StackCanvasProps) {
  // Get active stage info
  const activeStageInfo = useMemo(
    () => (activeStage ? LIFECYCLE_STAGES[activeStage as keyof typeof LIFECYCLE_STAGES] : undefined),
    [activeStage]
  );

  // Get capabilities for active stage
  const stageCapabilities = useMemo(
    () => (activeStage ? getCapabilitiesForStage(activeStage as any) : []),
    [activeStage]
  );

  // Get products covering the selected capability
  const productsForCapability = useMemo(() => {
    if (!selectedCapability) return [];

    const products: Array<{
      slug: string;
      name: string;
      strength: string;
      isInStack: boolean;
    }> = [];

    // Check each product in metadata
    for (const [slug, metadata] of metadataMap) {
      const cap = metadata.capabilities.find((c) => c.capabilityId === selectedCapability);
      if (cap) {
        const display = productDisplayMap.get(slug);
        products.push({
          slug,
          name: display?.name || slug,
          strength: cap.strength,
          isInStack: stack.selectedProducts.some((p) => p.slug === slug),
        });
      }
    }

    // Sort: in-stack first, then by strength
    return products.sort((a, b) => {
      if (a.isInStack !== b.isInStack) return a.isInStack ? -1 : 1;
      const strengthOrder = ["core", "strong", "partial", "addon", "integration-only"];
      return strengthOrder.indexOf(a.strength) - strengthOrder.indexOf(b.strength);
    });
  }, [selectedCapability, metadataMap, productDisplayMap, stack]);

  // Get coverage status for a capability
  const getCoverageStatus = (capId: CapabilityId) => {
    const coverage = coverageResult.capabilityCoverage.find(
      (c) => c.capabilityId === capId
    );
    return coverage?.status || "unknown";
  };

  // Get products covering a capability (for display)
  const getProductsForCapability = (capId: CapabilityId) => {
    const products: string[] = [];
    for (const selected of stack.selectedProducts) {
      const metadata = metadataMap.get(selected.slug);
      if (metadata?.capabilities.some((c) => c.capabilityId === capId)) {
        const display = productDisplayMap.get(selected.slug);
        products.push(display?.name || selected.slug);
      }
    }
    return products;
  };

  return (
    <div className="h-full p-6">
      {/* Stage Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-label-primary">
          {activeStageInfo?.name || "Select a Stage"}
        </h2>
        <p className="mt-1 text-label-secondary">
          {activeStageInfo?.description || "Choose a lifecycle stage from the left to explore capabilities"}
        </p>
      </div>

      {/* Selected Capability Detail */}
      {selectedCapability && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-label-primary">
                {getCapability(selectedCapability)?.name}
              </h3>
              <p className="mt-1 text-sm text-label-secondary">
                {getCapability(selectedCapability)?.description}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                getCoverageStatus(selectedCapability) === "covered" ||
                getCoverageStatus(selectedCapability) === "strong"
                  ? "bg-success/10 text-success"
                  : getCoverageStatus(selectedCapability) === "partial"
                  ? "bg-warning/10 text-warning"
                  : "bg-error/10 text-error"
              }`}
            >
              {getCoverageStatus(selectedCapability) === "covered" ||
              getCoverageStatus(selectedCapability) === "strong"
                ? "Covered"
                : getCoverageStatus(selectedCapability) === "partial"
                ? "Partial"
                : "Gap"}
            </span>
          </div>

          {/* Products covering this capability */}
          {productsForCapability.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-label-tertiary">
                Products with this capability
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {productsForCapability.map((product) => (
                  <div
                    key={product.slug}
                    onClick={() => {
                      if (!product.isInStack) {
                        onAddProduct(product.slug, "unknown");
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      product.isInStack
                        ? "border-success/30 bg-success/5"
                        : "border-separator bg-surface hover:border-accent/50 cursor-pointer"
                    }`}
                  >
                    <span className="font-medium text-label-primary">{product.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        product.strength === "core"
                          ? "bg-success/10 text-success"
                          : product.strength === "strong"
                          ? "bg-accent/10 text-accent"
                          : "bg-fill-secondary text-label-tertiary"
                      }`}
                    >
                      {product.strength}
                    </span>
                    {product.isInStack ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveProduct(product.slug, "unknown");
                        }}
                        className="text-label-tertiary hover:text-error"
                        title="Remove from stack"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddProduct(product.slug, "unknown");
                        }}
                        className="text-label-tertiary hover:text-success"
                        title="Add to stack"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capability Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stageCapabilities.map((capability) => {
          const status = getCoverageStatus(capability.id);
          const coveringProducts = getProductsForCapability(capability.id);
          const isSelected = selectedCapability === capability.id;

          return (
            <div
              key={capability.id}
              onClick={() => onCapabilitySelect(capability.id)}
              className={`rounded-xl border p-4 transition-all cursor-pointer ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : status === "covered" || status === "strong"
                  ? "border-success/30 bg-success/5 hover:border-success/50"
                  : status === "partial"
                  ? "border-warning/30 bg-warning/5 hover:border-warning/50"
                  : "border-separator bg-surface hover:border-accent/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-label-primary">{capability.name}</h4>
                {status === "covered" || status === "strong" ? (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    Covered
                  </span>
                ) : status === "partial" ? (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    Partial
                  </span>
                ) : (
                  <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-xs font-medium text-label-tertiary">
                    Gap
                  </span>
                )}
              </div>

              {coveringProducts.length > 0 ? (
                <div className="mt-2">
                  <p className="text-xs text-label-tertiary">
                    Covered by: {coveringProducts.join(", ")}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-label-quaternary italic">
                  No products selected
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Products in Stack */}
      {stack.selectedProducts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-label-primary">Your Stack</h3>
          <p className="mt-1 text-sm text-label-secondary">
            {stack.selectedProducts.length} product
            {stack.selectedProducts.length === 1 ? "" : "s"} selected
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stack.selectedProducts.map((selected) => {
              const display = productDisplayMap.get(selected.slug);
              const metadata = metadataMap.get(selected.slug);

              // Check for compatibility issues
              const hasIssues = compatibilityResult.some(
                (c) =>
                  (c.productA === selected.slug || c.productB === selected.slug) &&
                  c.status === "incompatible"
              );

              // Check for overlaps
              const hasOverlaps = overlapResult.some(
                (o) =>
                  (o.productA === selected.slug || o.productB === selected.slug) &&
                  o.classification === "probable-redundancy"
              );

              return (
                <div
                  key={selected.slug}
                  className={`group relative rounded-xl border p-4 transition-all ${
                    hasIssues
                      ? "border-error/30 bg-error/5"
                      : hasOverlaps
                      ? "border-warning/30 bg-warning/5"
                      : "border-separator bg-surface hover:border-accent/30"
                  }`}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveProduct(selected.slug, display?.category || "unknown")}
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-label-tertiary opacity-0 transition-opacity hover:bg-fill-secondary hover:text-error group-hover:opacity-100"
                    title="Remove from stack"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Product info */}
                  <div className="pr-8">
                    <h4 className="font-medium text-label-primary">
                      {display?.name || selected.slug}
                    </h4>
                    {display?.tagline && (
                      <p className="mt-0.5 text-xs text-label-secondary">
                        {display.tagline}
                      </p>
                    )}
                    {display?.category && (
                      <span className="mt-2 inline-block rounded-full bg-fill-secondary px-2 py-0.5 text-xs text-label-tertiary">
                        {display.category}
                      </span>
                    )}
                  </div>

                  {/* Warnings */}
                  {(hasIssues || hasOverlaps) && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs">
                      <AlertTriangle
                        className={`h-3.5 w-3.5 ${hasIssues ? "text-error" : "text-warning"}`}
                      />
                      <span className={hasIssues ? "text-error" : "text-warning"}>
                        {hasIssues ? "Compatibility issue" : "Overlaps with another product"}
                      </span>
                    </div>
                  )}

                  {/* Capability count */}
                  {metadata && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-label-tertiary">
                      <Layers className="h-3.5 w-3.5" />
                      <span>{metadata.capabilities.length} capabilities</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stack.selectedProducts.length === 0 && !selectedCapability && (
        <div className="mt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-fill-secondary">
            <Plus className="h-8 w-8 text-label-tertiary" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-label-primary">
            Start building your stack
          </h3>
          <p className="mt-2 text-sm text-label-secondary">
            Select a capability to see products that can cover it, or browse the shortlist.
          </p>
        </div>
      )}
    </div>
  );
}
