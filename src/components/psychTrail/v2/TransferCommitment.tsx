"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  Lock,
  Check,
} from "lucide-react";
import type {
  TransferActionType,
  TransferCommitment as TransferCommitmentType,
  ResourceMapping,
} from "@/lib/psychTrail/institutional-types";
import {
  getCampusContext,
  addTransferCommitment,
  createAnonymousRunRecord,
  createFollowUpRequest,
  updatePlaylistProgress,
} from "@/lib/psychTrail/campus-storage";
import { trackTransferCommit } from "@/lib/analytics/product-events";
import type { MechanismId, MechanismStrength, PatternId, PatternValence } from "@/lib/psychTrail/clinical-constants";
import type { Grade } from "@/lib/psychTrail/types-v2";

const ACTION_OPTIONS: { action: TransferActionType; label: string; subtext: string }[] = [
  {
    action: "commit_24h",
    label: "I'll try this tomorrow",
    subtext: "Commit to taking this step in the next 24 hours",
  },
  {
    action: "smaller_step",
    label: "I need something smaller",
    subtext: "The suggested step feels too big right now",
  },
  {
    action: "talk_to_someone",
    label: "I want to talk to someone first",
    subtext: "Get support before taking the next step",
  },
  {
    action: "practice_only",
    label: "Just practicing for now",
    subtext: "Not ready to commit—and that's okay",
  },
];

export interface TransferCommitmentProps {
  runId: string;
  scenarioId: string;
  scenarioTitle: string;
  transferPrompt: string;
  smallestBetterMove: string | null;
  reflectionPrompts: string[];
  grade: Grade;
  isReplay: boolean;
  mechanismsScored: Array<{ mechanism: MechanismId; strength: MechanismStrength }>;
  patternsDetected: Array<{ pattern: PatternId; valence: PatternValence }>;
  campusResources?: ResourceMapping[];
  onComplete: () => void;
  onContinueToPlaylist?: () => void;
}

export function TransferCommitment(props: TransferCommitmentProps) {
  const {
    runId,
    scenarioId,
    scenarioTitle,
    transferPrompt,
    smallestBetterMove,
    reflectionPrompts,
    grade,
    isReplay,
    mechanismsScored,
    patternsDetected,
    campusResources = [],
    onComplete,
    onContinueToPlaylist,
  } = props;

  const campusContext = getCampusContext();
  const isInCampusMode = campusContext !== null;

  const [selectedAction, setSelectedAction] = useState<TransferActionType | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [followUpRequested, setFollowUpRequested] = useState(false);
  const [resourceClicked, setResourceClicked] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleActionSelect = (action: TransferActionType) => {
    setSelectedAction(action);
    if (action === "talk_to_someone" && isInCampusMode && campusResources.length > 0) {
      setShowResources(true);
    } else {
      setShowResources(false);
    }
  };

  const handleResourceClick = (resource: ResourceMapping) => {
    setResourceClicked(resource.type);
    window.open(resource.url, "_blank");
  };

  const handleSubmit = () => {
    if (!selectedAction) return;

    const commitmentType = selectedAction === "commit_24h" ? "24h"
      : selectedAction === "smaller_step" ? "smaller_step"
      : selectedAction === "talk_to_someone" ? "talk_to_someone"
      : "practice_only";
    trackTransferCommit(scenarioId, commitmentType);

    const commitment: TransferCommitmentType = {
      runId,
      scenarioId,
      transferPrompt,
      selectedAction,
      concreteCommitment: selectedAction === "commit_24h" ? transferPrompt : null,
      smallestBetterMoveSelected: selectedAction === "smaller_step",
      campusResourceClicked: resourceClicked,
      followUpRequested,
      sharedWithStaff: followUpRequested,
      timestamp: Date.now(),
    };

    addTransferCommitment(commitment);

    if (isInCampusMode) {
      createAnonymousRunRecord({
        scenarioId,
        completed: true,
        isReplay,
        grade,
        mechanismsScored,
        patternsDetected,
        transferActionType: selectedAction,
        resourceClicked,
      });

      if (campusContext.playlistId) {
        updatePlaylistProgress(campusContext.playlistId, scenarioId, commitment);
      }

      if (followUpRequested && studentIdentifier.trim()) {
        createFollowUpRequest({
          studentIdentifier: studentIdentifier.trim(),
          scenarioId,
          scenarioTitle,
          transferPrompt,
          selectedAction,
          smallestBetterMove,
        });
      }
    }

    setSubmitted(true);
  };

  const handleContinue = () => {
    if (onContinueToPlaylist && campusContext?.playlistId) {
      onContinueToPlaylist();
    } else {
      onComplete();
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-surface-grouped border border-separator p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-positive-600 text-lg font-medium mb-3">
            <Check className="h-5 w-5" />
            <span>Got it</span>
          </div>
          <p className="text-sm text-label-tertiary mb-5">
            {selectedAction === "commit_24h"
              ? "Good luck tomorrow. You can replay this scenario anytime to practice more."
              : selectedAction === "smaller_step"
                ? "Smaller steps still count. You can come back anytime."
                : selectedAction === "talk_to_someone"
                  ? "Reaching out takes courage. You've got this."
                  : "Practice matters. Come back whenever you're ready."}
          </p>
          {followUpRequested && (
            <div className="mb-5 p-3 rounded-lg border border-accent-700/30 bg-accent-tint">
              <p className="text-xs text-accent-700">
                Staff will see: the scenario you practiced, your next step, and how to reach you.
                They won't see your specific choices or score.
              </p>
            </div>
          )}
          <button
            onClick={handleContinue}
            className="px-6 py-2.5 rounded-xl bg-canvas-elevated text-label-primary font-semibold transition-all hover:bg-white shadow-medium hover:shadow-large"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-grouped border border-separator p-6 space-y-6">
      {/* Transfer prompt */}
      <div>
        <h3 className="text-xs font-medium text-accent uppercase tracking-wider mb-2">A possible next step</h3>
        <p className="text-lg text-label-primary leading-relaxed">{transferPrompt}</p>
      </div>

      {/* Smallest better move */}
      {smallestBetterMove && (
        <div className="p-4 rounded-xl border border-accent-700/30 bg-accent-tint">
          <p className="text-xs text-accent mb-1">Or even smaller:</p>
          <p className="text-sm text-accent-700">{smallestBetterMove}</p>
        </div>
      )}

      {/* Action selection */}
      <div className="space-y-3">
        <p className="text-sm text-label-secondary">What feels right?</p>
        <div className="space-y-2">
          {ACTION_OPTIONS.map(({ action, label, subtext }) => (
            <button
              key={action}
              onClick={() => handleActionSelect(action)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                selectedAction === action
                  ? "border-accent-border bg-accent-tint"
                  : "border-separator bg-surface hover:border-separator hover:bg-surface-grouped"
              }`}
            >
              <span className={`text-sm font-medium ${selectedAction === action ? "text-label-primary" : "text-label-secondary"}`}>
                {label}
              </span>
              <span className="block text-xs text-label-primary0 mt-0.5">{subtext}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campus resources */}
      {showResources && campusResources.length > 0 && (
        <div className="space-y-2 p-4 rounded-xl border border-separator bg-surface">
          <p className="text-sm text-label-secondary mb-2">Campus resources</p>
          <div className="space-y-2">
            {campusResources.map((resource) => (
              <button
                key={resource.type}
                onClick={() => handleResourceClick(resource)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-separator bg-surface-grouped hover:border-separator transition-all"
              >
                <span className="text-sm text-label-primary">{resource.label}</span>
                <ExternalLink className="h-4 w-4 text-label-primary0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opt-in follow-up */}
      {isInCampusMode && selectedAction && (
        <div className="pt-4 border-t border-separator">
          <button
            onClick={() => setShowFollowUp(!showFollowUp)}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Ask for follow-up support</span>
            {showFollowUp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showFollowUp && (
            <div className="mt-4 space-y-4 p-4 rounded-xl border border-accent-700/30 bg-accent-tint">
              <p className="text-sm text-accent-700">
                A staff member can check in with you about this next step.
              </p>

              <div className="p-3 rounded-lg border border-separator bg-surface-grouped/50 text-xs text-label-tertiary">
                <p className="font-medium text-label-secondary mb-1">What they'll see:</p>
                <ul className="list-disc list-inside space-y-0.5 mb-2">
                  <li>Which scenario you practiced</li>
                  <li>The next step you're considering</li>
                  <li>How to contact you</li>
                </ul>
                <p className="font-medium text-label-secondary">What they won't see:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Your specific choices in the scenario</li>
                  <li>Your score or grade</li>
                </ul>
              </div>

              <div>
                <label className="text-xs text-label-tertiary block mb-1.5">
                  How should they reach you?
                </label>
                <input
                  type="text"
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  placeholder="Name, email, or phone"
                  className="w-full px-3.5 py-2.5 bg-surface border border-separator rounded-lg text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-500/30"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequested}
                  onChange={(e) => setFollowUpRequested(e.target.checked)}
                  disabled={!studentIdentifier.trim()}
                  className="rounded border-separator bg-surface-grouped text-accent-500 focus:ring-accent-500/50"
                />
                <span className="text-sm text-label-secondary">
                  Yes, share this with staff for follow-up
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 text-xs text-label-primary0">
        <Lock className="h-4 w-4 shrink-0 mt-0.5 text-positive-500" />
        <p>
          {isInCampusMode
            ? "Your school only sees anonymous totals unless you ask for follow-up above."
            : "This stays on your device. No one else sees it."}
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedAction}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
          selectedAction
            ? "bg-canvas-elevated text-label-primary hover:bg-white shadow-medium hover:shadow-large"
            : "bg-surface-grouped text-label-quaternary cursor-not-allowed"
        }`}
      >
        <span>Done</span>
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* Reflection prompts */}
      {reflectionPrompts.length > 0 && (
        <details className="pt-4 border-t border-separator">
          <summary className="text-sm text-label-tertiary cursor-pointer hover:text-label-secondary transition-colors">
            Questions to think about
          </summary>
          <ul className="mt-3 space-y-2">
            {reflectionPrompts.map((prompt, i) => (
              <li key={i} className="text-sm text-label-primary0 pl-4 border-l-2 border-separator">
                {prompt}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
