"use client";

// EHR Matcher Client Component
// Interactive questionnaire to match clinicians with the right EHR

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import {
  EHR_MATCHER_QUESTIONS,
  matchEHRTools,
  type EHRMatcherAnswers,
  type EHRMatchScore,
} from "@/lib/tools/ehr-matcher";
import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";

// Serialized tool type from server
interface SerializedTool {
  slug: string;
  name: string;
  short_description: string;
  one_liner: string;
  website_url: string;
  logo_url: string;
  primary_category: string;
  audiences: ClinicianToolV4["audiences"];
  feature_flags: ClinicianToolV4["feature_flags"];
  capabilities: ClinicianToolV4["capabilities"];
  pricing: ClinicianToolV4["pricing"] | null;
  compliance: ClinicianToolV4["compliance"];
  company_info?: { company_name?: string };
}

interface EHRMatcherClientProps {
  tools: SerializedTool[];
}

export function EHRMatcherClient({ tools }: EHRMatcherClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<EHRMatcherAnswers>>({});
  const [showResults, setShowResults] = useState(false);

  const questions = EHR_MATCHER_QUESTIONS;
  const totalSteps = questions.length;

  const handleAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    // Auto-advance to next question
    if (currentStep < totalSteps - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 200);
    } else {
      // Last question - show results
      setTimeout(() => setShowResults(true), 200);
    }
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
  };

  // Convert serialized tools to the format expected by matchEHRTools
  const fullTools = useMemo(
    () =>
      tools.map(
        (t) =>
          ({
            ...t,
            schema_version: "4.0" as const,
            kind: "clinician-tool" as const,
            id: t.slug,
            secondary_categories: [],
            integrations: [],
            governance: { needs_review: false },
            lifecycle: { status: "active" as const },
            status: "active" as const,
          }) as unknown as ClinicianToolV4
      ),
    [tools]
  );

  // Calculate results
  const results = useMemo(() => {
    if (!showResults) return [];

    const fullAnswers: EHRMatcherAnswers = {
      practiceSize: (answers.practiceSize as EHRMatcherAnswers["practiceSize"]) || "solo",
      practiceSetting:
        (answers.practiceSetting as EHRMatcherAnswers["practiceSetting"]) ||
        "solo-practice",
      needsTelehealth: answers.needsTelehealth === true,
      needsBilling: answers.needsBilling === true,
      needsEPrescribing: answers.needsEPrescribing === true,
      needsAI: answers.needsAI === true,
      needsPatientPortal: true, // Default on
      budget: (answers.budget as EHRMatcherAnswers["budget"]) || "any",
      hipaaRequired: true, // Always required for mental health
    };

    return matchEHRTools(fullTools, fullAnswers);
  }, [showResults, answers, fullTools]);

  if (showResults) {
    return (
      <ResultsView
        results={results}
        tools={tools}
        onBack={goBack}
        onRestart={restart}
      />
    );
  }

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id as keyof EHRMatcherAnswers];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Stethoscope className="h-6 w-6 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
          Find Your Ideal EHR
        </h1>
        <p className="mt-2 text-label-secondary">
          Answer {totalSteps} quick questions to get personalized recommendations
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-label-secondary">
          <span>
            Question {currentStep + 1} of {totalSteps}
          </span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-fill-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-separator bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-label-primary">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = currentAnswer === option.value;

            return (
              <button
                key={String(option.value)}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? "border-accent bg-accent/5 ring-2 ring-accent"
                    : "border-separator bg-canvas hover:border-accent/50 hover:bg-accent/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-label-primary">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="mt-1 text-sm text-label-secondary">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            currentStep === 0
              ? "cursor-not-allowed text-label-quaternary"
              : "text-label-secondary hover:text-label-primary"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {currentAnswer !== undefined && currentStep < totalSteps - 1 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {currentAnswer !== undefined && currentStep === totalSteps - 1 && (
          <button
            onClick={() => setShowResults(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            See Results
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// RESULTS VIEW
// ============================================================================

interface ResultsViewProps {
  results: EHRMatchScore[];
  tools: SerializedTool[];
  onBack: () => void;
  onRestart: () => void;
}

function ResultsView({ results, tools, onBack, onRestart }: ResultsViewProps) {
  // Get top 3 recommendations
  const topResults = results.slice(0, 3);
  const otherResults = results.slice(3, 6);

  // Find the tool data for display
  const getToolData = (slug: string) => tools.find((t) => t.slug === slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-positive/10">
          <Check className="h-6 w-6 text-positive" />
        </div>
        <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
          EHR Options Based on Your Answers
        </h1>
        <p className="mt-2 text-label-secondary">
          These tools match some or all of your stated requirements
        </p>
      </div>

      {/* HIPAA/BAA Disclaimer */}
      <div className="mb-6 rounded-lg border border-caution/30 bg-caution/5 p-4">
        <p className="text-sm text-label-secondary">
          <strong className="text-label-primary">Important:</strong> Feature information is based on vendor disclosures
          and may change. Before signing any contract,{" "}
          <strong>confirm BAA availability and HIPAA compliance directly with the vendor</strong>.
          HeyPsych does not guarantee compliance claims.
        </p>
      </div>

      {/* Top Recommendations */}
      <div className="space-y-4">
        {topResults.map((result, index) => {
          const toolData = getToolData(result.tool.slug);
          if (!toolData) return null;

          return (
            <div
              key={result.tool.slug}
              className={`rounded-xl border bg-surface p-6 shadow-sm ${
                index === 0
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-separator"
              }`}
            >
              {/* FIX 4: Qualified language instead of marketing claims */}
              <div className="mb-4 flex flex-wrap gap-2">
                {index === 0 && result.missingRequirements.length === 0 && !result.hipaaDisqualified && !result.baaDisqualified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                    Top result based on your answers
                  </span>
                )}
                {result.hipaaDisqualified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-caution/10 px-3 py-1 text-sm font-medium text-caution">
                    HIPAA status unconfirmed
                  </span>
                )}
                {result.baaDisqualified && !result.hipaaDisqualified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-caution/10 px-3 py-1 text-sm font-medium text-caution">
                    BAA availability unconfirmed
                  </span>
                )}
                {result.missingRequirements.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-negative/10 px-3 py-1 text-sm font-medium text-negative">
                    Missing: {result.missingRequirements.join(", ")}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-label-primary">
                      {toolData.name}
                    </h3>
                    {/* Show match percentage - consistent across all tools */}
                    <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-sm font-medium text-label-secondary">
                      {result.percentage}% match
                    </span>
                  </div>

                  <p className="mt-2 text-label-secondary">
                    {toolData.one_liner || toolData.short_description}
                  </p>

                  {/* Match Reasons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.matchReasons.slice(0, 4).map((reason, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2 py-1 text-xs text-positive"
                      >
                        <Check className="h-3 w-3" />
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Mismatch Warnings */}
                  {result.mismatchReasons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.mismatchReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full bg-caution/10 px-2 py-1 text-xs text-caution"
                        >
                          <X className="h-3 w-3" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  {toolData.pricing?.starting_price_display && (
                    <p className="mt-3 text-sm text-label-tertiary">
                      Starting at {toolData.pricing.starting_price_display}
                    </p>
                  )}
                </div>

                {/* Actions - FIX 5: Add from=matcher attribution */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/tools/for-clinicians/ehr-practice-management/${result.tool.slug}/?from=matcher#demo`}
                    className="flex items-center gap-2 rounded-lg bg-treatment px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
                  >
                    Request Demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/tools/for-clinicians/ehr-practice-management/${result.tool.slug}/?from=matcher`}
                    className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm font-medium text-label-primary transition-colors hover:bg-fill-secondary"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Other Options - includes tools missing some requirements */}
      {otherResults.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-label-primary">
            Other Options (may require verification)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherResults.map((result) => {
              const toolData = getToolData(result.tool.slug);
              if (!toolData) return null;

              return (
                <Link
                  key={result.tool.slug}
                  href={`/tools/for-clinicians/ehr-practice-management/${result.tool.slug}/?from=matcher`}
                  className="rounded-lg border border-separator bg-surface p-4 transition-all hover:border-accent/50 hover:shadow-md"
                >
                  <h3 className="font-medium text-label-primary">
                    {toolData.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-label-secondary">
                    {toolData.one_liner || toolData.short_description}
                  </p>
                  {/* FIX 4: Show missing requirements for disqualified tools */}
                  {result.missingRequirements.length > 0 && (
                    <p className="mt-2 text-xs text-caution">
                      Missing: {result.missingRequirements.join(", ")}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-label-secondary transition-colors hover:text-label-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit Answers
        </button>

        <button
          onClick={onRestart}
          className="rounded-lg border border-separator px-4 py-2 text-sm font-medium text-label-primary transition-colors hover:bg-fill-secondary"
        >
          Start Over
        </button>
      </div>

      {/* Compare Top Matches CTA */}
      {topResults.length >= 2 && (
        <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-6">
          <h2 className="text-lg font-semibold text-label-primary">
            Compare Your Top Matches Side-by-Side
          </h2>
          <p className="mt-2 text-label-secondary">
            See a detailed feature comparison of your top {Math.min(topResults.length, 3)} matches
          </p>
          <div className="mt-4">
            <Link
              href={`/tools/compare/?tools=${topResults.slice(0, 3).map((r) => r.tool.slug).join(",")}&from=matcher`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Compare {topResults.slice(0, 3).map((r) => getToolData(r.tool.slug)?.name).filter(Boolean).join(" vs ")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Browse All CTA */}
      <div className="mt-8 rounded-xl bg-fill-secondary p-6 text-center">
        <h2 className="text-lg font-semibold text-label-primary">
          Want to explore more options?
        </h2>
        <p className="mt-2 text-label-secondary">
          Browse all EHR platforms or adjust your answers to see different recommendations
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tools/for-clinicians/ehr-practice-management/?from=matcher"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Browse All EHRs
          </Link>
        </div>
      </div>
    </div>
  );
}
