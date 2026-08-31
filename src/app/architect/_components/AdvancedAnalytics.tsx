/**
 * AdvancedAnalytics Component
 *
 * A distinct analytics workspace that replaces the simple canvas view.
 * Shows detailed capability coverage, fit scores, overlap analysis,
 * compatibility, and cost breakdown.
 *
 * This is NOT the same as the simple configurator with more items -
 * it's a dedicated analytics view for power users.
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  DoorOpen,
  Heart,
  DollarSign,
  Briefcase,
  TrendingUp,
  Check,
  AlertTriangle,
  Info,
  Zap,
  Layers,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import type {
  PracticeStack,
  ProductArchitectureMetadata,
  StackCoverageResult,
  StackHealthResult,
  OverlapAssessment,
  CompatibilityAssessment,
  CostEstimate,
  FitResult,
} from "@/domains/architect/schemas";
import { type PracticeAreaId, PRACTICE_AREAS } from "./practice-areas";

interface ProductDisplay {
  slug: string;
  name: string;
  category?: string;
  tagline?: string;
}

interface AdvancedAnalyticsProps {
  stack: PracticeStack;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  productDisplayMap: Map<string, ProductDisplay>;
  coverageResult: StackCoverageResult;
  healthResult: StackHealthResult;
  overlapResult: OverlapAssessment[];
  compatibilityResult: CompatibilityAssessment[];
  costResult: CostEstimate;
  fitResultsMap: Map<string, FitResult>;
  onBack: () => void;
  onRemoveProduct: (slug: string) => void;
}

const AREA_ICONS: Record<PracticeAreaId, LucideIcon> = {
  foundation: Shield,
  "front-door": DoorOpen,
  care: Heart,
  money: DollarSign,
  "back-office": Briefcase,
  growth: TrendingUp,
};

const AREA_COLORS: Record<PracticeAreaId, { bg: string; text: string; border: string }> = {
  foundation: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  "front-door": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  care: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  money: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "back-office": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  growth: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

export function AdvancedAnalytics({
  stack,
  metadataMap,
  productDisplayMap,
  coverageResult,
  healthResult,
  overlapResult,
  compatibilityResult,
  costResult,
  fitResultsMap,
  onBack,
  onRemoveProduct,
}: AdvancedAnalyticsProps) {
  // Format cost
  const formatCost = (cents: number) => `$${Math.round(cents / 100)}`;

  // Calculate coverage by area
  const coverageByArea = useMemo(() => {
    const result: Record<PracticeAreaId, { covered: number; total: number; items: string[] }> = {} as any;

    // Get covered capability IDs from the coverage result
    const coveredCapabilityIds = new Set(
      coverageResult.capabilityCoverage
        .filter(c => c.status === "covered" || c.status === "strong")
        .map(c => c.capabilityId)
    );

    for (const [areaId, areaData] of Object.entries(PRACTICE_AREAS)) {
      const coveredItems: string[] = [];
      let covered = 0;
      const total = areaData.items.length;

      for (const item of areaData.items) {
        const isCovered = item.capabilities.some(capId => coveredCapabilityIds.has(capId));
        if (isCovered) {
          covered++;
          coveredItems.push(item.name);
        }
      }

      result[areaId as PracticeAreaId] = { covered, total, items: coveredItems };
    }

    return result;
  }, [coverageResult]);

  // Categorize overlaps
  const redundancies = overlapResult.filter(o => o.classification === "probable-redundancy");
  const intentionalOverlaps = overlapResult.filter(o => o.classification === "intentional-overlap");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-separator bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-label-secondary hover:bg-fill-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Practice
            </button>
          </div>
          <h1 className="text-lg font-semibold text-label-primary">Advanced Analytics</h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Health Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overall Health */}
            <div className="rounded-2xl bg-white border border-separator p-6 shadow-sm">
              <div className="flex items-center gap-2 text-label-tertiary">
                <Zap className="h-4 w-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">Stack Health</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${
                  healthResult.overallScore >= 80 ? "text-emerald-600" :
                  healthResult.overallScore >= 60 ? "text-amber-600" : "text-red-600"
                }`}>
                  {healthResult.overallScore}
                </span>
                <span className="text-lg text-label-tertiary">/ 100</span>
              </div>
              <p className="mt-2 text-sm text-label-secondary">{healthResult.summary}</p>
            </div>

            {/* Coverage Score */}
            <div className="rounded-2xl bg-white border border-separator p-6 shadow-sm">
              <div className="flex items-center gap-2 text-label-tertiary">
                <Check className="h-4 w-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">Coverage</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-label-primary">
                  {Math.round(coverageResult.overallScore)}%
                </span>
              </div>
              <p className="mt-2 text-sm text-label-secondary">
                {coverageResult.gapCapabilities.length} capability gaps
              </p>
            </div>

            {/* Redundancy */}
            <div className="rounded-2xl bg-white border border-separator p-6 shadow-sm">
              <div className="flex items-center gap-2 text-label-tertiary">
                <Layers className="h-4 w-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">Redundancy</h3>
              </div>
              <div className="mt-3">
                {redundancies.length > 0 ? (
                  <span className="text-2xl font-bold text-amber-600">
                    {redundancies.length} overlap{redundancies.length !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-emerald-600">Clean</span>
                )}
              </div>
              <p className="mt-2 text-sm text-label-secondary">
                {intentionalOverlaps.length > 0 && `${intentionalOverlaps.length} intentional`}
              </p>
            </div>

            {/* Monthly Cost */}
            <div className="rounded-2xl bg-white border border-separator p-6 shadow-sm">
              <div className="flex items-center gap-2 text-label-tertiary">
                <DollarSign className="h-4 w-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">Est. Monthly</h3>
              </div>
              <div className="mt-3">
                {costResult.knownMinMonthlyCents ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-label-primary">
                      {formatCost(costResult.knownMinMonthlyCents)}
                    </span>
                    {costResult.knownMaxMonthlyCents && costResult.knownMaxMonthlyCents !== costResult.knownMinMonthlyCents && (
                      <span className="text-lg text-label-tertiary">
                        – {formatCost(costResult.knownMaxMonthlyCents)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-label-tertiary">TBD</span>
                )}
              </div>
              <p className="mt-2 text-sm text-label-secondary">
                {costResult.unknownPricingCount > 0 && `${costResult.unknownPricingCount} products without pricing`}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Products Detail */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-label-primary mb-4">Your Products</h2>
          <div className="rounded-2xl bg-white border border-separator overflow-hidden shadow-sm">
            {stack.selectedProducts.length === 0 ? (
              <div className="p-8 text-center text-label-secondary">
                No products selected yet
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-separator">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-label-tertiary uppercase tracking-wide">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-label-tertiary uppercase tracking-wide">Fit Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-label-tertiary uppercase tracking-wide">Coverage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-label-tertiary uppercase tracking-wide">Monthly Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-label-tertiary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {stack.selectedProducts.map(selected => {
                    const display = productDisplayMap.get(selected.slug);
                    const metadata = metadataMap.get(selected.slug);
                    const fitResult = fitResultsMap.get(selected.slug);
                    const productCost = costResult.productCosts.find(pc => pc.slug === selected.slug);

                    if (!display) return null;

                    const coveredCount = metadata?.capabilities?.length || 0;
                    const score = fitResult?.score ?? fitResult?.fitScore;

                    return (
                      <tr key={selected.slug} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-label-primary">{display.name}</p>
                            <p className="text-sm text-label-tertiary">{display.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {fitResult && score != null ? (
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-semibold ${
                                score >= 80 ? "text-emerald-600" :
                                score >= 60 ? "text-amber-600" : "text-red-600"
                              }`}>
                                {score}
                              </span>
                              <span className="text-xs text-label-tertiary">
                                ({fitResult.dataConfidence}% confidence)
                              </span>
                            </div>
                          ) : (
                            <span className="text-label-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-label-secondary">
                            {coveredCount} capabilities
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {productCost?.requiresQuote ? (
                            <span className="text-sm text-label-tertiary">Contact vendor</span>
                          ) : productCost?.minMonthlyCents != null ? (
                            // Calculated total available - show it with context
                            <div>
                              <span className="text-sm text-label-secondary">
                                {formatCost(productCost.minMonthlyCents)}
                                {productCost.maxMonthlyCents && productCost.maxMonthlyCents !== productCost.minMonthlyCents &&
                                  ` – ${formatCost(productCost.maxMonthlyCents)}`}
                              </span>
                              {productCost.notes && (
                                <p className="text-xs text-label-tertiary mt-0.5">{productCost.notes}</p>
                              )}
                              {productCost.isEstimate && (
                                <p className="text-xs text-amber-600 mt-0.5">Estimated</p>
                              )}
                            </div>
                          ) : productCost?.priceDisplayText ? (
                            // No calculated total - show fallback display text
                            <div>
                              <span className="text-sm text-label-secondary">{productCost.priceDisplayText}</span>
                              {productCost.notes && (
                                <p className="text-xs text-label-tertiary mt-0.5">{productCost.notes}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-label-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => onRemoveProduct(selected.slug)}
                            className="text-sm text-error hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.section>

        {/* Coverage by Area */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-label-primary mb-4">Coverage by Area</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(PRACTICE_AREAS) as [PracticeAreaId, typeof PRACTICE_AREAS[PracticeAreaId]][]).map(([areaId, areaData]) => {
              const Icon = AREA_ICONS[areaId];
              const colors = AREA_COLORS[areaId];
              const coverage = coverageByArea[areaId];
              const percentage = coverage.total > 0 ? Math.round((coverage.covered / coverage.total) * 100) : 0;

              return (
                <div
                  key={areaId}
                  className={`rounded-xl border p-4 ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                    <h3 className={`font-semibold ${colors.text}`}>{areaData.name}</h3>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-white/50 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${percentage === 100 ? "bg-emerald-500" : "bg-current"} ${colors.text} opacity-60 transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className={colors.text}>{coverage.covered} of {coverage.total}</span>
                    <span className={`font-medium ${colors.text}`}>{percentage}%</span>
                  </div>

                  {coverage.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/30">
                      <p className="text-xs text-label-secondary mb-1">Covered:</p>
                      <p className="text-xs text-label-primary">
                        {coverage.items.slice(0, 3).join(", ")}
                        {coverage.items.length > 3 && ` +${coverage.items.length - 3} more`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Overlap Analysis */}
        {overlapResult.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-label-primary mb-4">Overlap Analysis</h2>
            <div className="space-y-3">
              {overlapResult.map((overlap, idx) => {
                const product1 = productDisplayMap.get(overlap.productA);
                const product2 = productDisplayMap.get(overlap.productB);
                const isRedundancy = overlap.classification === "probable-redundancy" || overlap.classification === "possible-redundancy";

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 ${
                      isRedundancy ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isRedundancy ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${isRedundancy ? "text-amber-800" : "text-blue-800"}`}>
                          {product1?.name || overlap.productA} ↔ {product2?.name || overlap.productB}
                        </p>
                        <p className="text-sm mt-1 text-label-secondary">
                          Shared capability: {overlap.capabilityId}
                        </p>
                        <p className="text-sm mt-1 text-label-tertiary">
                          {overlap.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Compatibility */}
        {compatibilityResult.filter(a => a.status === "concern" || a.status === "incompatible").length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-label-primary mb-4">Compatibility Notes</h2>
            <div className="rounded-2xl bg-white border border-separator overflow-hidden shadow-sm">
              <div className="divide-y divide-separator">
                {compatibilityResult
                  .filter(a => a.status === "concern" || a.status === "incompatible")
                  .map((assessment, idx) => {
                    const productA = productDisplayMap.get(assessment.productA);
                    const productB = productDisplayMap.get(assessment.productB);
                    return (
                      <div key={idx} className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                            assessment.status === "incompatible" ? "text-red-500" : "text-amber-500"
                          }`} />
                          <div>
                            <p className="font-medium text-label-primary">
                              {productA?.name || assessment.productA} ↔ {productB?.name || assessment.productB}
                            </p>
                            <p className="text-sm text-label-secondary mt-1">
                              {assessment.status === "incompatible" ? "Incompatible" : "Potential concern"}
                              {assessment.integrationType && ` - ${assessment.integrationType}`}
                            </p>
                            {assessment.notes && (
                              <p className="text-sm text-label-tertiary mt-1">{assessment.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.section>
        )}

        {/* Back to Practice */}
        <div className="text-center pt-4 pb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to My Practice
          </button>
        </div>
      </main>
    </div>
  );
}
