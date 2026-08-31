// src/app/architect/_components/StackHealthPanel.tsx
// Stack health score summary panel

"use client";

import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Layers,
  Info,
} from "lucide-react";
import {
  type StackHealthResult,
  type CostEstimate,
  type StackCoverageResult,
  type PracticeStack,
} from "@/domains/architect/schemas";
import { formatCost, formatCostRange } from "@/domains/architect/engines";
import { trackHealthView, trackCostView } from "@/domains/architect/analytics";

interface StackHealthPanelProps {
  healthResult: StackHealthResult;
  costResult: CostEstimate;
  coverageResult: StackCoverageResult;
  stack: PracticeStack;
}

export function StackHealthPanel({
  healthResult,
  costResult,
  coverageResult,
  stack,
}: StackHealthPanelProps) {
  const productCount = stack.selectedProducts.filter((p) => !p.isDemo).length;

  // Get health level styling
  const getHealthStyles = () => {
    switch (healthResult.healthLevel) {
      case "excellent":
        return {
          bg: "bg-success/10",
          text: "text-success",
          icon: CheckCircle,
          label: "Excellent",
        };
      case "good":
        return {
          bg: "bg-accent/10",
          text: "text-accent",
          icon: TrendingUp,
          label: "Good",
        };
      case "fair":
        return {
          bg: "bg-warning/10",
          text: "text-warning",
          icon: AlertCircle,
          label: "Fair",
        };
      case "poor":
        return {
          bg: "bg-error/10",
          text: "text-error",
          icon: TrendingDown,
          label: "Needs Work",
        };
    }
  };

  const healthStyles = getHealthStyles();
  const HealthIcon = healthStyles.icon;

  return (
    <div className="p-4">
      {/* Health Score */}
      <div
        className={`rounded-xl ${healthStyles.bg} p-4`}
        onClick={() => trackHealthView(healthResult.overallScore)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HealthIcon className={`h-5 w-5 ${healthStyles.text}`} />
            <span className="text-sm font-medium text-label-primary">Stack Health</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${healthStyles.text}`}>
              {healthResult.overallScore}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${healthStyles.bg} ${healthStyles.text}`}>
              {healthStyles.label}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-label-secondary">{healthResult.summary}</p>

        {/* Subscores */}
        <div className="mt-4 space-y-2">
          {healthResult.subscores.map((subscore) => (
            <div key={subscore.name} className="flex items-center gap-2">
              <span className="w-24 text-xs text-label-tertiary">{subscore.name}</span>
              {subscore.score !== null ? (
                <>
                  <div className="flex-1 h-1.5 rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full ${
                        subscore.score >= 80
                          ? "bg-success"
                          : subscore.score >= 60
                          ? "bg-accent"
                          : subscore.score >= 40
                          ? "bg-warning"
                          : "bg-error"
                      }`}
                      style={{ width: `${subscore.score}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-label-secondary">
                    {subscore.score}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex-1 h-1.5 rounded-full bg-surface opacity-50" />
                  <span className="w-8 text-right text-xs text-label-tertiary">
                    {subscore.isNotApplicable ? "N/A" : "—"}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Coverage */}
        <div className="rounded-lg border border-separator bg-surface p-3">
          <div className="flex items-center gap-2 text-label-tertiary">
            <Layers className="h-4 w-4" />
            <span className="text-xs">Coverage</span>
          </div>
          <div className="mt-1">
            <span className="text-lg font-semibold text-label-primary">
              {coverageResult.knownCoveragePercent}%
            </span>
            {coverageResult.gapCapabilities.length > 0 && (
              <span className="ml-1 text-xs text-warning">
                ({coverageResult.gapCapabilities.length} gaps)
              </span>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="rounded-lg border border-separator bg-surface p-3">
          <div className="flex items-center gap-2 text-label-tertiary">
            <Heart className="h-4 w-4" />
            <span className="text-xs">Products</span>
          </div>
          <div className="mt-1">
            <span className="text-lg font-semibold text-label-primary">
              {productCount}
            </span>
            <span className="ml-1 text-xs text-label-tertiary">selected</span>
          </div>
        </div>
      </div>

      {/* Cost Estimate */}
      <div
        className="mt-4 rounded-lg border border-separator bg-surface p-3"
        onClick={() =>
          trackCostView(
            costResult.knownMaxMonthlyCents,
            costResult.knownMaxMonthlyCents !== null && stack.fingerprint.monthlyBudget
              ? (costResult.knownMaxMonthlyCents / 100) <= stack.fingerprint.monthlyBudget
              : null
          )
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-label-tertiary">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Est. Monthly Cost</span>
          </div>
          {stack.fingerprint.monthlyBudget && costResult.knownMaxMonthlyCents !== null && (
            <span
              className={`text-xs ${
                (costResult.knownMaxMonthlyCents / 100) <= stack.fingerprint.monthlyBudget
                  ? "text-success"
                  : "text-warning"
              }`}
            >
              {(costResult.knownMaxMonthlyCents / 100) <= stack.fingerprint.monthlyBudget
                ? "Within budget"
                : "Over budget"}
            </span>
          )}
        </div>
        <div className="mt-1">
          <span className="text-lg font-semibold text-label-primary">
            {formatCostRange(
              costResult.knownMinMonthlyCents,
              costResult.knownMaxMonthlyCents,
              costResult.unknownPricingCount,
              costResult.customQuoteCount
            )}
          </span>
        </div>
        {costResult.unknownPricingCount > 0 && (
          <div className="mt-2 space-y-1">
            {costResult.productCosts
              .filter((p) => p.minMonthlyCents === null && p.priceDisplayText)
              .map((p) => (
                <p key={p.slug} className="text-xs text-label-tertiary">
                  + {p.priceDisplayText}
                </p>
              ))}
            {costResult.productCosts.filter(
              (p) => p.minMonthlyCents === null && !p.priceDisplayText
            ).length > 0 && (
              <p className="text-xs text-label-tertiary">
                + {costResult.productCosts.filter((p) => p.minMonthlyCents === null && !p.priceDisplayText).length} with custom pricing
              </p>
            )}
          </div>
        )}
      </div>

      {/* Top Concerns */}
      {healthResult.topConcerns.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-label-tertiary">
            Areas to Improve
          </h4>
          <ul className="mt-2 space-y-1">
            {healthResult.topConcerns.map((concern) => (
              <li
                key={concern}
                className="flex items-center gap-2 text-xs text-label-secondary"
              >
                <AlertCircle className="h-3 w-3 text-warning shrink-0" />
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
