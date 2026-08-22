"use client";

import { ChevronLeft, Lock, Star } from "lucide-react";
import type { PackBrowserProps, PackCardProps } from "./contracts";

const TIER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  none: { bg: "bg-surface-grouped", text: "text-label-tertiary", border: "border-separator" },
  bronze: { bg: "bg-amber-900/30", text: "text-amber-400", border: "border-amber-700/30" },
  silver: { bg: "bg-fill-secondary", text: "text-label-secondary", border: "border-separator" },
  gold: { bg: "bg-amber-800/30", text: "text-amber-300", border: "border-amber-600/30" },
  platinum: { bg: "bg-cyan-900/30", text: "text-cyan-300", border: "border-cyan-600/30" },
};

function PackCard({ pack, onSelect }: { pack: PackCardProps; onSelect: () => void }) {
  const badge = TIER_BADGES[pack.masteryTier];

  return (
    <button
      onClick={onSelect}
      disabled={!pack.unlocked}
      className={`w-full text-left rounded-xl border transition-all ${
        pack.unlocked
          ? "border-separator bg-surface-grouped hover:bg-fill-secondary hover:border-separator shadow-card-1 hover:shadow-card-2"
          : "border-separator bg-surface/50 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-label-primary">{pack.title}</h3>
          {!pack.unlocked && <Lock className="h-4 w-4 text-label-primary0" />}
        </div>
        <p className="text-sm text-label-tertiary line-clamp-2 leading-relaxed">{pack.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-label-primary0">{pack.completedCount}/{pack.scenarioCount} completed</span>
            <div className="flex gap-0.5">
              {Array.from({ length: pack.maxStars }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < pack.totalStars
                      ? "text-amber-400 fill-amber-400"
                      : "text-label-tertiary"
                  }`}
                />
              ))}
            </div>
          </div>
          {pack.masteryTier !== "none" && (
            <span className={`text-xs px-2 py-1 rounded-md capitalize border ${badge.bg} ${badge.text} ${badge.border}`}>
              {pack.masteryTier}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function PackBrowser(props: PackBrowserProps) {
  const { packs, onSelectPack, onBack } = props;

  return (
    <div className="min-h-screen bg-canvas text-label-primary px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-label-tertiary hover:text-label-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-label-primary">Scenario Packs</h1>
          <p className="mt-2 text-sm text-label-tertiary">Choose a pack to practice</p>
        </div>

        <div className="space-y-3">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} onSelect={() => onSelectPack(pack.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
