"use client";

/**
 * Psych Trail - Game Container Component
 *
 * Orchestrates the UI and engine together.
 * Contains React state but delegates all simulation logic to the engine.
 */

import { useState, useEffect } from "react";
import type { Scenario, RunState, GameEvent, Choice } from "@/lib/psychTrail/types";
import { PsychTrailEngine } from "@/lib/psychTrail/engine";
import { MetricsDisplay } from "./MetricsDisplay";
import { NodeDisplay } from "./NodeDisplay";
import { ChoiceList } from "./ChoiceList";
import { EventLog } from "./EventLog";
import { Timeline } from "./Timeline";
import { EndingDisplay } from "./EndingDisplay";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface GameContainerProps {
  scenario: Scenario;
  className?: string;
}

export function GameContainer({ scenario, className = "" }: GameContainerProps) {
  // Engine instance (created once)
  const [engine] = useState(() => new PsychTrailEngine(scenario));

  // Game state
  const [runState, setRunState] = useState<RunState>(() => engine.createInitialState());
  const [lastEvents, setLastEvents] = useState<GameEvent[]>([]);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showingExplanation, setShowingExplanation] = useState(false);
  const [pendingState, setPendingState] = useState<RunState | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Derived state from engine (NO logic here)
  const currentNode = engine.getCurrentNode(runState);
  const availableChoices = engine.getAvailableChoices(runState);
  const ending = runState.isEnded && runState.endingId ? engine.getEnding(runState.endingId) : undefined;

  // Handle choice selection
  const handleChoiceSelect = async (choiceId: string) => {
    setIsProcessing(true);
    setLastEvents([]); // Clear previous events
    setLastChoice(null); // Clear previous choice

    try {
      // All logic happens in the engine
      const result = engine.processTurn(runState, { choiceId });

      // Brief delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Store results
      setLastEvents(result.triggeredEvents);
      setLastChoice(result.choice);

      // If choice has a description, show explanation WITHOUT advancing state yet
      if (result.choice.description) {
        setShowingExplanation(true);
        setPendingState(result.newState); // Save state to apply after Continue
      } else {
        // No explanation, advance immediately
        setRunState(result.newState);
      }
    } catch (error) {
      console.error("Turn processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle continuing after reading explanation
  const handleContinue = () => {
    // Don't advance state yet - just show results on the same node
    setShowingExplanation(false);
    setShowResults(true);
  };

  // Handle dismissing results and showing new choices
  const handleDismissResults = () => {
    // NOW advance to the next node
    if (pendingState) {
      setRunState(pendingState);
      setPendingState(null);
    }
    setShowResults(false);
    setLastChoice(null);
    setLastEvents([]);
  };

  // Restart game
  const handleRestart = () => {
    setRunState(engine.createInitialState());
    setLastEvents([]);
    setLastChoice(null);
    setShowingExplanation(false);
    setPendingState(null);
    setShowResults(false);
  };

  if (!currentNode) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
        <p className="font-semibold">Error: Invalid game state</p>
        <p className="mt-2 text-sm">Current node not found. This scenario may have errors.</p>
        <Button onClick={handleRestart} variant="outline" className="mt-4">
          Restart
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with restart button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{scenario.title}</h1>
          <p className="mt-1 text-sm text-neutral-700">
            {scenario.summary}
          </p>
        </div>
        <Button onClick={handleRestart} variant="ghost" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restart
        </Button>
      </div>

      {/* Main game area */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left column: Story and choices */}
        <div className="space-y-6">
          {/* Current node */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <NodeDisplay
              node={currentNode}
              stepNumber={runState.currentStep}
              stepLabel={scenario.timeConfig.stepLabel}
            />
          </div>

          {/* Choices (hide only when showing results or ended) */}
          {!runState.isEnded && !ending && !showResults && (
            <ChoiceList
              choices={availableChoices}
              onChoiceSelect={handleChoiceSelect}
              disabled={isProcessing || showingExplanation}
            />
          )}

          {/* Choice explanation (shown after selection, under the choices) */}
          {lastChoice && lastChoice.description && showingExplanation && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">You chose: {lastChoice.text}</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{lastChoice.description}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleContinue} size="sm">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Results from previous choice (shown after continuing) */}
          {!showingExplanation && showResults && lastChoice && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">Result of your choice:</p>
                    {lastChoice.resultText && (
                      <p className="mt-2 text-sm text-green-800 leading-relaxed">{lastChoice.resultText}</p>
                    )}
                  </div>
                </div>

                {/* Show metric changes */}
                <div className="ml-7 space-y-1">
                  {lastChoice.effects.filter(e => e.type === 'metric' || e.type === 'metric-set').map((effect, i) => {
                    if (effect.type === 'metric') {
                      const changeText = effect.change > 0 ? `+${effect.change}` : `${effect.change}`;
                      const metricDef = scenario.uiConfig.metrics.find(m => m.key === effect.metric);
                      const label = metricDef?.label || effect.metric;
                      return (
                        <p key={i} className="text-sm text-green-800">
                          <span className="font-medium">{label}</span> {changeText}
                        </p>
                      );
                    }
                    return null;
                  })}

                  {/* Show flag changes */}
                  {lastChoice.effects.filter(e => e.type === 'flag' && e.value === true).map((effect, i) => {
                    if (effect.type === 'flag') {
                      return (
                        <p key={`flag-${i}`} className="text-sm text-green-800">
                          <span className="font-medium">Unlocked:</span> {effect.flag.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Show events if any */}
                {lastEvents.length > 0 && (
                  <div className="ml-7 space-y-1 border-t border-green-300 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Events:</p>
                    {lastEvents.map((event, i) => (
                      <p key={i} className="text-sm text-green-800">{event.text}</p>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleDismissResults} size="sm" variant="outline" className="border-green-300 text-green-900 hover:bg-green-100">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ending screen */}
          {runState.isEnded && ending && (
            <EndingDisplay
              ending={ending}
              stepNumber={runState.currentStep}
              stepLabel={scenario.timeConfig.stepLabel}
              onRestart={handleRestart}
            />
          )}
        </div>

        {/* Right column: Metrics and timeline */}
        <div className="space-y-6">
          {/* Metrics */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <MetricsDisplay metrics={runState.metrics} config={scenario.uiConfig.metrics} />
          </div>

          {/* Timeline */}
          {runState.history.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <Timeline history={runState.history} stepLabel={scenario.timeConfig.stepLabel} />
            </div>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <p className="font-semibold">Educational Simulation Disclaimer</p>
        <p className="mt-1">
          This is a fictional scenario for learning purposes only. It does not constitute medical
          advice. Real treatment decisions should always be made with qualified mental health
          professionals.
        </p>
      </div>
    </div>
  );
}
