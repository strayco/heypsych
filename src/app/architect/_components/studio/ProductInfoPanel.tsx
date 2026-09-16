/**
 * ProductInfoPanel Component
 *
 * Slide-in panel showing detailed information about a product.
 * Includes pricing, features, integrations, and action buttons.
 */

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Check,
  Plus,
  Star,
  DollarSign,
  Users,
  Building2,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import type { ProductArchitectureMetadata, FitResult } from "@/domains/architect/schemas";

interface ProductInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    slug: string;
    name: string;
    tagline?: string;
    category: string;
  } | null;
  metadata: ProductArchitectureMetadata | null;
  fitResult: FitResult | null;
  isPlaced: boolean;
  onAddProduct: (slug: string, category: string) => void;
  onRemoveProduct: (slug: string) => void;
}

export function ProductInfoPanel({
  isOpen,
  onClose,
  product,
  metadata,
  fitResult,
  isPlaced,
  onAddProduct,
  onRemoveProduct,
}: ProductInfoPanelProps) {
  // Format price display
  const priceDisplay = useMemo(() => {
    if (!metadata?.pricing?.minPriceCents) return null;
    const min = Math.round(metadata.pricing.minPriceCents / 100);
    const max = metadata.pricing.maxPriceCents
      ? Math.round(metadata.pricing.maxPriceCents / 100)
      : null;
    if (max && max !== min) {
      return `$${min}–$${max}/mo`;
    }
    return `$${min}/mo`;
  }, [metadata]);

  // Format practice sizes
  const practiceSizes = useMemo(() => {
    if (!metadata?.fitEvidence?.idealSizes?.length) return null;
    const sizeLabels: Record<string, string> = {
      solo: "Solo",
      "2-5": "Small (2-5)",
      "6-10": "Medium (6-10)",
      "11-25": "Medium (11-25)",
      "26-50": "Large (26-50)",
      "51-100": "Large (51-100)",
      "101-250": "Enterprise",
      "250+": "Enterprise",
    };
    return metadata.fitEvidence.idealSizes
      .map((s) => sizeLabels[s] || s)
      .join(", ");
  }, [metadata]);

  // Format practice types
  const practiceTypes = useMemo(() => {
    if (!metadata?.fitEvidence?.practiceTypes?.length) return null;
    const typeLabels: Record<string, string> = {
      "solo-clinician": "Solo clinician",
      "therapy-group": "Therapy group",
      "psychiatry": "Psychiatry",
      "therapy-plus-psychiatry": "Therapy + Psychiatry",
      "psychological-testing": "Psych testing",
      "community-behavioral-health": "Community MH",
      "sud-addiction": "SUD/Addiction",
      "iop-php": "IOP/PHP",
      "telehealth-first": "Telehealth-first",
      "other": "Other",
    };
    return metadata.fitEvidence.practiceTypes
      .slice(0, 5)
      .map((s) => typeLabels[s] || s);
  }, [metadata]);

  // Get fit score color
  const fitScoreColor = useMemo(() => {
    const score = fitResult?.score ?? 0;
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-slate-500";
  }, [fitResult]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-xl font-semibold text-slate-900 truncate">
                  {product.name}
                </h2>
                {product.tagline && (
                  <p className="text-sm text-slate-500 mt-1">{product.tagline}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Fit Score */}
              {fitResult && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Fit Score
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${fitScoreColor}`}>
                    {fitResult.score}%
                  </span>
                </div>
              )}

              {/* Price */}
              {priceDisplay && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Starting at</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {priceDisplay}
                    </p>
                  </div>
                </div>
              )}

              {/* Practice Sizes */}
              {practiceSizes && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Practice Sizes</p>
                    <p className="text-sm font-medium text-slate-900">
                      {practiceSizes}
                    </p>
                  </div>
                </div>
              )}

              {/* Practice Types */}
              {practiceTypes && practiceTypes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      Practice Types
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {practiceTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Capabilities */}
              {metadata?.capabilities && metadata.capabilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Key Capabilities
                  </h3>
                  <div className="space-y-2">
                    {metadata.capabilities.slice(0, 8).map((cap) => (
                      <div key={cap.capabilityId} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">
                          {cap.capabilityId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                    {metadata.capabilities.length > 8 && (
                      <p className="text-xs text-slate-400 pl-6">
                        +{metadata.capabilities.length - 8} more capabilities
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Integrations */}
              {metadata?.integrations && metadata.integrations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Integrations
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {metadata.integrations.slice(0, 10).map((int) => (
                      <span
                        key={int.targetSlug}
                        className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full"
                      >
                        {int.targetSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    ))}
                    {metadata.integrations.length > 10 && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">
                        +{metadata.integrations.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Fit Reasons */}
              {fitResult?.contributions && fitResult.contributions.some(c => c.reasons.length > 0) && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Why it fits your practice
                  </h3>
                  <div className="space-y-2">
                    {fitResult.contributions
                      .filter(c => c.reasons.length > 0)
                      .flatMap(c => c.reasons.map((reason, idx) => ({
                        reason,
                        evidence: c.evidence,
                        key: `${c.dimension}-${idx}`,
                      })))
                      .slice(0, 5)
                      .map(({ reason, evidence, key }) => (
                        <div
                          key={key}
                          className={`flex items-start gap-2 text-sm ${
                            evidence === "match" ? "text-emerald-700" : evidence === "mismatch" ? "text-amber-700" : "text-slate-600"
                          }`}
                        >
                          <span>{evidence === "match" ? "+" : evidence === "mismatch" ? "−" : "•"}</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-slate-100 space-y-3">
              {isPlaced ? (
                <button
                  onClick={() => {
                    onRemoveProduct(product.slug);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                >
                  Remove from Stack
                </button>
              ) : (
                <button
                  onClick={() => {
                    onAddProduct(product.slug, product.category);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Stack
                </button>
              )}

              <Link
                href={`/tools/${product.slug}`}
                className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                View Full Profile
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
