"use client";

import { useState, useCallback, useEffect } from "react";
import type { ScenarioV2, RunStateV2, Pack, EndOfRunResult, TriggeredInsightBeat, MicroIntervention } from "@/lib/psychTrail/types-v2";
import type { CampusContext, ResourceMapping } from "@/lib/psychTrail/institutional-types";
import { GameOrchestrator } from "@/lib/psychTrail/game-orchestrator";
import { generateSeed } from "@/lib/psychTrail/rng";
import { getDiscoveredRoutes, getScenarioProgress } from "@/lib/psychTrail/storage-v2";
import { trackRouteDiscovered, trackScenarioComplete } from "@/lib/analytics/product-events";
import {
  evaluateInsightBeats,
  recordBeatShown,
  recordInterventionSelection,
  createInsightBeatRunState,
  type InsightBeatRunState,
} from "@/lib/psychTrail/insight-beats-engine";
import { ScenarioPreRun } from "./ScenarioPreRun";
import type { ScenarioPreRunProps } from "./ScenarioPreRun";
import { EndOfRunSummary } from "./EndOfRunSummary";
import type { EndOfRunSummaryProps } from "./EndOfRunSummary";
import { TransferCommitment } from "./TransferCommitment";
import { InsightBeatCard } from "./InsightBeatCard";
import type { MechanismId, MechanismStrength, PatternId, PatternValence } from "@/lib/psychTrail/clinical-constants";
import { ChevronLeft, X } from "lucide-react";

type Phase = "pre-run" | "playing" | "result" | "transfer";

interface GameContainerV2Props {
  scenario: ScenarioV2;
  allScenarios?: ScenarioV2[];
  allPacks?: Pack[];
  directPlay?: boolean;
  campusContext?: CampusContext | null;
  campusResources?: ResourceMapping[];
  playlistId?: string | null;
  onBack?: () => void;
  onBackToPack?: () => void;
  onContinueToPlaylist?: () => void;
}

/**
 * Generate supportive observations based on what happened in the run.
 */
function generateObservations(result: EndOfRunResult, scenario: ScenarioV2): string[] {
  const observations: string[] = [];

  if (result.ending.quality === "positive") {
    observations.push("You navigated to a positive outcome");
  } else if (result.ending.quality === "mixed") {
    observations.push("You stayed with a complex situation");
  }

  const completedObjectives = result.objectives.filter(o => o.completed);
  for (const obj of completedObjectives.slice(0, 2)) {
    const title = obj.objective.title.toLowerCase();
    if (title.includes("stay")) {
      observations.push("You stayed present through the experience");
    } else if (title.includes("ask") || title.includes("question")) {
      observations.push("You engaged beyond the minimum");
    } else if (title.includes("recover") || title.includes("return")) {
      observations.push("You recovered after a difficult moment");
    } else if (!title.includes("positive") && !title.includes("complete")) {
      observations.push(`You ${title}`);
    }
  }

  const recoveryPatterns = result.structuredSummary?.patternsDetected?.filter(
    p => p.pattern === "recovery_success"
  ) || [];
  if (recoveryPatterns.length > 0 && !observations.some(o => o.includes("recover"))) {
    observations.push("You showed the ability to course-correct");
  }

  const tolerancePatterns = result.structuredSummary?.patternsDetected?.filter(
    p => p.pattern === "distress_tolerated"
  ) || [];
  if (tolerancePatterns.length > 0) {
    observations.push("You tolerated discomfort without avoiding");
  }

  const directPatterns = result.structuredSummary?.patternsDetected?.filter(
    p => p.pattern === "direct_action"
  ) || [];
  if (directPatterns.length > 0) {
    observations.push("You took direct action");
  }

  return observations.slice(0, 3);
}

function findRelatedScenario(
  currentScenario: ScenarioV2,
  allScenarios: ScenarioV2[],
  _discoveredRoutes: string[]
): ScenarioV2 | null {
  const candidates = allScenarios.filter(s => s.id !== currentScenario.id);
  if (candidates.length === 0) return null;

  const samePack = candidates.filter(s =>
    s.packIds.some(pid => currentScenario.packIds.includes(pid))
  );

  if (samePack.length > 0) {
    const difficultyOrder = ["beginner", "intermediate", "advanced"];
    const currentDiffIdx = difficultyOrder.indexOf(currentScenario.difficulty);
    samePack.sort((a, b) => {
      const aDiff = Math.abs(difficultyOrder.indexOf(a.difficulty) - currentDiffIdx);
      const bDiff = Math.abs(difficultyOrder.indexOf(b.difficulty) - currentDiffIdx);
      return aDiff - bDiff;
    });
    return samePack[0];
  }

  const similarDifficulty = candidates.filter(s => s.difficulty === currentScenario.difficulty);
  if (similarDifficulty.length > 0) {
    return similarDifficulty[0];
  }

  return candidates[0];
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo(0, 0);
  }
}

export function GameContainerV2({
  scenario,
  allScenarios = [],
  allPacks = [],
  directPlay = false,
  campusContext = null,
  campusResources = [],
  playlistId = null,
  onBack,
  onBackToPack,
  onContinueToPlaylist,
}: GameContainerV2Props) {
  const [phase, setPhase] = useState<Phase>(directPlay ? "playing" : "pre-run");
  const [orchestrator] = useState(() => new GameOrchestrator(scenario));
  const [state, setState] = useState<RunStateV2 | null>(null);
  const [result, setResult] = useState<EndOfRunResult | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [isReplay, setIsReplay] = useState(false);
  const [runId, setRunId] = useState<string>("");

  const [beatRunState, setBeatRunState] = useState<InsightBeatRunState>(createInsightBeatRunState);
  const [activeInsightBeat, setActiveInsightBeat] = useState<TriggeredInsightBeat | null>(null);

  const engine = orchestrator.getEngine();
  const currentNode = state ? engine.getCurrentNode(state) : null;
  const availableChoices = state ? engine.getAvailableChoices(state) : [];

  const [hasBeenPlayed, setHasBeenPlayed] = useState(false);
  const [completionCount, setCompletionCount] = useState(0);

  useEffect(() => {
    const preRunInfo = orchestrator.getPreRunInfo();
    setHasBeenPlayed(preRunInfo.bestRun !== null);
    const progress = getScenarioProgress(scenario.id);
    setCompletionCount(progress?.completions ?? 0);
  }, [orchestrator, scenario.id]);

  useEffect(() => {
    scrollToTop();
  }, [phase]);

  useEffect(() => {
    if (directPlay && !state) {
      const seed = generateSeed();
      const initial = orchestrator.createInitialState(seed);
      setState(initial);
      setRunId(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      setIsReplay(false);
      setPhase("playing");
    }
  }, [directPlay, state, orchestrator]);

  const handleStartRun = useCallback((challengeId?: string) => {
    const seed = generateSeed();
    const initial = orchestrator.createInitialState(seed, challengeId);
    setState(initial);
    setResult(null);
    setResultText(null);
    setRunId(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    setIsReplay(hasBeenPlayed);
    setBeatRunState(createInsightBeatRunState());
    setActiveInsightBeat(null);
    setPhase("playing");
  }, [orchestrator, hasBeenPlayed]);

  const handleSelectChoice = useCallback((choiceId: string) => {
    if (!state || state.isEnded) return;
    setActiveInsightBeat(null);

    const turnResult = engine.processTurn(state, { choiceId });
    setResultText(turnResult.choice.resultText || null);
    setState(turnResult.newState);

    if (turnResult.newState.isEnded) {
      const endResult = orchestrator.processEndOfRun(turnResult.newState, allScenarios, allPacks);
      setResult(endResult);
      setPhase("result");

      trackScenarioComplete(
        scenario.id,
        scenario.packIds[0] || "none",
        endResult.score.grade,
        endResult.starsEarned,
        Date.now()
      );

      if (endResult.route.isNewDiscovery && endResult.route.routeId && endResult.route.routeName) {
        const routesDiscovered = getDiscoveredRoutes(scenario.id).length;
        trackRouteDiscovered(
          scenario.id,
          endResult.route.routeId,
          endResult.route.routeName,
          endResult.route.isHidden,
          routesDiscovered,
          scenario.routes.length
        );
      }
    } else {
      const triggeredBeat = evaluateInsightBeats(
        scenario,
        turnResult.newState,
        choiceId,
        beatRunState
      );

      if (triggeredBeat) {
        setActiveInsightBeat(triggeredBeat);
        setBeatRunState((prev) => recordBeatShown(prev, triggeredBeat));

        if (triggeredBeat.beat.setFlagOnTrigger) {
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  flags: {
                    ...prev.flags,
                    [triggeredBeat.beat.setFlagOnTrigger!]: true,
                  },
                }
              : null
          );
        }
      }
    }
  }, [state, engine, orchestrator, allScenarios, allPacks, scenario, beatRunState]);

  const handleReplay = useCallback(() => {
    handleStartRun(state?.challengeId || undefined);
  }, [handleStartRun, state?.challengeId]);

  const handleBackToScenario = useCallback(() => {
    setPhase("pre-run");
    setState(null);
    setResult(null);
    setResultText(null);
  }, []);

  const handleProceedToTransfer = useCallback(() => {
    setPhase("transfer");
  }, []);

  const handleTransferComplete = useCallback(() => {
    if (onContinueToPlaylist && playlistId) {
      onContinueToPlaylist();
    } else {
      handleBackToScenario();
    }
  }, [onContinueToPlaylist, playlistId, handleBackToScenario]);

  const handleDismissInsightBeat = useCallback(() => {
    setActiveInsightBeat(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (!state || state.history.length < 1) return;

    const newHistory = state.history.slice(0, -1);
    const newChoiceSequence = state.choiceSequence.slice(0, -1);
    const newNodeSequence = state.nodeSequence.slice(0, -1);
    const targetStep = state.history.length === 1 ? 0 : state.history[state.history.length - 2].step;

    if (beatRunState.lastBeatStep >= targetStep && beatRunState.beatsShownCount > 0) {
      setBeatRunState((prev) => ({
        ...prev,
        beatsShownCount: Math.max(0, prev.beatsShownCount - 1),
        triggeredBeatIds: prev.triggeredBeatIds.slice(0, -1),
        lastBeatStep: -100,
        interventionsShownCount: prev.lastInterventionStep >= targetStep
          ? Math.max(0, prev.interventionsShownCount - 1)
          : prev.interventionsShownCount,
        lastInterventionStep: prev.lastInterventionStep >= targetStep
          ? -100
          : prev.lastInterventionStep,
        selectedInterventions: prev.selectedInterventions.filter(
          (s) => s.stepNumber < targetStep
        ),
      }));
    }

    if (state.history.length === 1) {
      setState({
        ...state,
        currentStep: 0,
        currentNodeId: scenario.startNodeId,
        metrics: { ...scenario.initialMetrics },
        categoryScores: { directness: 0, persistence: 0, recovery: 0, exploration: 0, clarity: 0, resilience: 0 },
        history: [],
        choiceSequence: [],
        nodeSequence: [scenario.startNodeId],
        isEnded: false,
        endingId: null,
      });
    } else {
      const previousEntry = state.history[state.history.length - 2];
      setState({
        ...state,
        currentStep: previousEntry.step,
        currentNodeId: previousEntry.nodeId,
        metrics: { ...previousEntry.metricsSnapshot },
        categoryScores: { ...previousEntry.scoreSnapshot },
        history: newHistory,
        choiceSequence: newChoiceSequence,
        nodeSequence: newNodeSequence,
        isEnded: false,
        endingId: null,
      });
    }
    setResultText(null);
    setActiveInsightBeat(null);
  }, [state, scenario, beatRunState]);

  const handleSelectIntervention = useCallback((intervention: MicroIntervention) => {
    if (!activeInsightBeat || !state) return;
    setBeatRunState((prev) =>
      recordInterventionSelection(
        prev,
        activeInsightBeat.beat.id,
        intervention.id,
        state.currentStep
      )
    );
  }, [activeInsightBeat, state]);

  const handlePlayRelated = useCallback((scenarioId: string) => {
    if (typeof window !== "undefined") {
      window.location.href = `/psychtrails/play/${scenarioId}`;
    }
  }, []);

  // Pre-run phase
  if (phase === "pre-run") {
    const practiceAreas = scenario.llmHints?.coachingFocus?.slice(0, 3) || [];
    const preRunProps: ScenarioPreRunProps = {
      scenario: {
        id: scenario.id,
        title: scenario.title,
        summary: scenario.summary,
        difficulty: scenario.difficulty,
        estimatedMinutes: scenario.estimatedMinutes,
        stuckMoment: scenario.stuckMoment?.description,
        practiceAreas,
      },
      hasBeenPlayed,
      completionCount,
      onStartRun: () => handleStartRun(),
      onBack: onBack || (() => {}),
    };
    return <ScenarioPreRun {...preRunProps} />;
  }

  // Result phase
  if (phase === "result" && result) {
    const discoveredRoutes = getDiscoveredRoutes(scenario.id);
    const relatedScenario = findRelatedScenario(scenario, allScenarios, discoveredRoutes);
    const scenarioProgress = getScenarioProgress(scenario.id);
    const isFirstScenarioCompletion = !scenarioProgress || scenarioProgress.completions === 0;
    const observations = generateObservations(result, scenario);

    const summaryProps: EndOfRunSummaryProps = {
      endingTitle: result.ending.title,
      endingText: result.ending.text,
      interpretation: result.clinical.interpretation,
      observations,
      relatedScenario: relatedScenario ? {
        id: relatedScenario.id,
        title: relatedScenario.title,
        estimatedMinutes: relatedScenario.estimatedMinutes,
      } : null,
      scenarioId: scenario.id,
      isFirstScenarioCompletion,
      showUsefulnessSignal: isFirstScenarioCompletion && !campusContext,
      onReplay: handleReplay,
      onBackToScenarios: onBackToPack || (() => {}),
      onPlayRelated: relatedScenario ? () => handlePlayRelated(relatedScenario.id) : undefined,
      onProceedToTransfer: campusContext ? handleProceedToTransfer : undefined,
      showTransferButton: !!campusContext,
      onCommitToRep: undefined,
    };
    return <EndOfRunSummary {...summaryProps} />;
  }

  // Transfer phase
  if (phase === "transfer" && result) {
    const mechanismsScored: Array<{ mechanism: MechanismId; strength: MechanismStrength }> =
      result.structuredSummary.mechanismScores?.map(m => ({
        mechanism: m.mechanism,
        strength: m.strength,
      })) || [];

    const patternsDetected: Array<{ pattern: PatternId; valence: PatternValence }> =
      result.structuredSummary.patternsDetected?.map(p => ({
        pattern: p.pattern,
        valence: p.valence,
      })) || [];

    return (
      <div className="min-h-screen bg-canvas text-label-primary px-4 py-8">
        <div className="max-w-lg mx-auto">
          <TransferCommitment
            runId={runId}
            scenarioId={scenario.id}
            scenarioTitle={scenario.title}
            transferPrompt={result.structuredSummary.transferPrompt || "Think about how you can apply what you practiced today."}
            smallestBetterMove={result.structuredSummary.smallestBetterMove?.description || null}
            reflectionPrompts={result.structuredSummary.reflectionPrompts || []}
            grade={result.score.grade}
            isReplay={isReplay}
            mechanismsScored={mechanismsScored}
            patternsDetected={patternsDetected}
            campusResources={campusResources}
            onComplete={handleTransferComplete}
            onContinueToPlaylist={onContinueToPlaylist}
          />
        </div>
      </div>
    );
  }

  // Playing phase - main game UI
  if (phase === "playing" && state && currentNode) {
    const canUndo = state.history.length >= 1;

    return (
      <div className="min-h-screen bg-canvas">
        {/* Desktop: two-column layout. Mobile: single column */}
        <div className="mx-auto max-w-5xl px-4 py-6 lg:flex lg:gap-8 lg:py-8">

          {/* Main content column */}
          <div className="flex-1 max-w-xl mx-auto lg:mx-0">

            {/* Header bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={canUndo ? handleUndo : undefined}
                disabled={!canUndo}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  canUndo
                    ? "text-label-tertiary hover:text-label-secondary"
                    : "text-label-tertiary cursor-default"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <span className="text-sm font-medium text-label-tertiary">
                {scenario.title}
              </span>

              <button
                onClick={onBack}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-label-primary0 hover:text-label-secondary hover:bg-surface-grouped transition-colors"
                aria-label="Exit"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Metrics - minimal, secondary */}
            {scenario.uiConfig.metrics.length > 0 && (
              <div className="flex gap-3 mb-6">
                {scenario.uiConfig.metrics.map((m) => (
                  <div key={m.key} className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-label-primary0">{m.label}</span>
                      <span className="text-xs text-label-primary0">
                        {Math.round(((state.metrics[m.key] ?? 0) / m.max) * 100)}%
                      </span>
                    </div>
                    <div className="h-1 bg-surface-grouped rounded-full overflow-hidden">
                      <div
                        className="h-full bg-canvas-elevated0 rounded-full transition-all duration-300"
                        style={{ width: `${((state.metrics[m.key] ?? 0) / m.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Narrative card - primary focus */}
            <div className="rounded-2xl bg-surface-grouped border border-separator p-6 mb-6 shadow-card-2">
              <p className="text-label-primary text-base leading-relaxed whitespace-pre-line">
                {currentNode.text}
              </p>
              {resultText && (
                <p className="mt-4 pt-4 border-t border-separator text-sm text-label-tertiary italic">
                  {resultText}
                </p>
              )}
            </div>

            {/* Choices - premium, tactile feel */}
            <div className="space-y-3">
              {availableChoices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleSelectChoice(choice.id)}
                  className="w-full text-left px-5 py-4 rounded-xl bg-surface border border-separator transition-all duration-150 hover:bg-surface-grouped hover:border-separator hover:shadow-card-1 active:scale-[0.99] group"
                >
                  <span className="text-sm text-label-primary group-hover:text-label-primary">
                    {choice.text}
                  </span>
                  {choice.description && (
                    <p className="mt-1.5 text-xs text-label-primary0 group-hover:text-label-tertiary">
                      {choice.description}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Mobile: Insight Beat below choices */}
            {activeInsightBeat && (
              <div className="mt-6 lg:hidden">
                <InsightBeatCard
                  triggeredBeat={activeInsightBeat}
                  onContinue={handleDismissInsightBeat}
                  onSelectIntervention={handleSelectIntervention}
                />
              </div>
            )}
          </div>

          {/* Desktop: Aside rail for Insight Beat */}
          <aside className="hidden lg:block lg:w-80 lg:shrink-0">
            <div className="sticky top-24">
              {activeInsightBeat ? (
                <InsightBeatCard
                  triggeredBeat={activeInsightBeat}
                  onContinue={handleDismissInsightBeat}
                  onSelectIntervention={handleSelectIntervention}
                />
              ) : (
                <div className="rounded-xl bg-surface/50 border border-separator/50 p-5">
                  <p className="text-sm text-label-primary0 text-center">
                    Insights will appear here as you play
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return null;
}
