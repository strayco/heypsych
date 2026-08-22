"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, Check, AlertCircle, Minus } from "lucide-react";
import type { InterpretationResult, RouteInterpretationResult, StepInterpretationResult } from "@/lib/psychTrail/types-v2";

interface InterpretationDisplayProps {
  interpretation: InterpretationResult;
  onTryNextRep?: (rep: string) => void;
}

const VALENCE_STYLES = {
  positive: {
    card: "border-positive-600/20 bg-positive-900/10",
    icon: <Check className="h-4 w-4 text-positive-600" />,
    iconBg: "bg-positive-600/20",
  },
  negative: {
    card: "border-caution-600/20 bg-caution-900/10",
    icon: <AlertCircle className="h-4 w-4 text-caution" />,
    iconBg: "bg-caution-600/20",
  },
  mixed: {
    card: "border-accent-600/20 bg-accent-900/10",
    icon: <Minus className="h-4 w-4 text-accent" />,
    iconBg: "bg-accent-600/20",
  },
};

export function InterpretationDisplay({ interpretation, onTryNextRep }: InterpretationDisplayProps) {
  const [showTurningPoints, setShowTurningPoints] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  if (!interpretation.route && interpretation.turningPoints.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Route-Level Interpretation */}
      {interpretation.route && (
        <RouteInterpretationCard
          route={interpretation.route}
          onTryNextRep={onTryNextRep}
        />
      )}

      {/* Turning Points Section */}
      {interpretation.turningPoints.length > 0 && (
        <div>
          <button
            onClick={() => setShowTurningPoints(!showTurningPoints)}
            className="w-full flex items-center justify-between py-3 text-sm text-label-tertiary hover:text-label-secondary transition-colors"
          >
            <span className="font-medium">Where the run turned</span>
            {showTurningPoints ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showTurningPoints && (
            <div className="space-y-3 mt-2">
              {interpretation.turningPoints.map((step) => (
                <StepInterpretationCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedStep === step.id}
                  onToggle={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  onTryNextRep={onTryNextRep}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RouteInterpretationCardProps {
  route: RouteInterpretationResult;
  onTryNextRep?: (rep: string) => void;
}

function RouteInterpretationCard({ route, onTryNextRep }: RouteInterpretationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-xl bg-surface border border-separator/30 overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-accent">
          {route.routeSummaryLabel}
        </span>
        <p className="mt-3 text-label-primary font-medium leading-relaxed">
          {route.whatShowedUp}
        </p>
      </div>

      {/* Pattern Label */}
      <div className="px-5 py-3 bg-surface-grouped/50 border-t border-separator/30">
        <span className="text-sm text-label-secondary">{route.userFacingPatternLabel}</span>
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-5 py-3 flex items-center justify-center gap-2 text-xs text-label-primary0 hover:text-label-secondary transition-colors border-t border-separator/30"
      >
        {showDetails ? "Show less" : "More about this pattern"}
        {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-5 pb-5 space-y-5 border-t border-separator/30">
          <div className="pt-4">
            <InterpretationRow
              label="What it reinforced"
              value={route.reinforcement}
            />
          </div>

          <InterpretationRow
            label="If this pattern keeps running"
            value={route.ifPatternKeepsRunning}
            italic
          />

          {/* Next Rep */}
          <div className="rounded-lg bg-accent-tint border border-accent-600/20 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              Try next
            </span>
            <p className="mt-2 text-sm text-label-primary">{route.nextRep}</p>
            <p className="mt-1.5 text-xs text-label-tertiary">{route.whyItMatters}</p>
            {onTryNextRep && (
              <button
                onClick={() => onTryNextRep(route.nextRep)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-700 transition-colors"
              >
                <span>Commit to this</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Transfer Bridge */}
          {route.transferBridge && (
            <div className="pt-3 border-t border-separator/30">
              <p className="text-xs text-label-primary0">
                <span className="text-label-tertiary">In real life:</span> {route.transferBridge}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StepInterpretationCardProps {
  step: StepInterpretationResult;
  isExpanded: boolean;
  onToggle: () => void;
  onTryNextRep?: (rep: string) => void;
}

function StepInterpretationCard({ step, isExpanded, onToggle, onTryNextRep }: StepInterpretationCardProps) {
  const style = VALENCE_STYLES[step.valence];

  return (
    <div className={`rounded-xl border overflow-hidden ${style.card}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${style.iconBg}`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-label-primary0">Step {step.stepNumber}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-label-primary0 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-label-primary0 shrink-0" />
            )}
          </div>
          <p className="text-xs text-label-tertiary mb-1">
            {step.userFacingPatternLabel}
          </p>
          {step.whatYouChose && (
            <p className="text-sm text-label-primary">
              {step.whatYouChose}
            </p>
          )}
          <p className="text-sm text-label-secondary mt-1">
            {step.whatShowedUp}
          </p>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 ml-9 space-y-4">
          <div className="border-t border-separator/30 pt-4 space-y-4">
            <InterpretationRow
              label="What it was doing"
              value={step.functionalIntent}
            />

            <InterpretationRow
              label="What it gave you right away"
              value={step.immediatePayoff}
            />

            <InterpretationRow
              label="What it cost"
              value={step.cost}
            />

            <InterpretationRow
              label="What it reinforced"
              value={step.reinforcement}
            />

            {/* Try Next */}
            <div className="rounded-lg bg-surface-grouped/50 p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-accent">
                Try next
              </span>
              <p className="mt-2 text-sm text-label-primary">{step.tryNext}</p>
              <p className="mt-1.5 text-xs text-label-tertiary">{step.whyThisMatters}</p>
              {onTryNextRep && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTryNextRep(step.tryNext);
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-700 transition-colors"
                >
                  <span>Commit</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Consequence */}
            <p className="text-xs text-label-primary0 italic">
              If this pattern keeps running: {step.consequenceIfRepeated}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface InterpretationRowProps {
  label: string;
  value: string;
  italic?: boolean;
}

function InterpretationRow({ label, value, italic }: InterpretationRowProps) {
  return (
    <div>
      <h4 className="text-xs text-label-primary0 mb-1">{label}</h4>
      <p className={`text-sm text-label-secondary ${italic ? "italic" : ""}`}>{value}</p>
    </div>
  );
}

export default InterpretationDisplay;
