// src/components/resource-renderers/AssessmentRenderer.tsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import {
  SEOMeta,
  SectionList,
  ReferencesTable,
  AutoFields,
  MedicalDisclaimer,
  type Section,
} from "./shared";
import { runEngine } from "./index";
import type { ResourceRendererProps } from "./index";

// Progress footer component
function FixedProgressFooter({ percent }: { percent: number }) {
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-40" aria-hidden="true">
      <div className="h-1 bg-surface-grouped">
        <div
          className="h-1 bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

type Question = {
  id?: string;
  number?: number;
  text?: string;
  response_set?: string;
  alert?: string | boolean;
  [key: string]: unknown;
};

type ResponseOption = {
  value: number;
  label: string;
  [key: string]: unknown;
};

export function AssessmentRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;

  // Split sections by type
  const allSections: Section[] = Array.isArray(data.sections) ? data.sections : [];
  const topSections = allSections.filter((s: Section) => {
    const t = String(s?.type ?? "").toLowerCase();
    return t === "about" || t === "instructions";
  });
  const scoringSections = allSections.filter((s: Section) => {
    const t = String(s?.type ?? "").toLowerCase();
    const title = String(s?.title ?? "").toLowerCase();
    return t === "scoring" || title.includes("scor");
  });
  const otherSections = allSections.filter((s: Section) => {
    const t = String(s?.type ?? "").toLowerCase();
    const title = String(s?.title ?? "").toLowerCase();
    return t !== "about" && t !== "instructions" && t !== "scoring" && !title.includes("scor");
  });

  // Handle both items and questions arrays
  const questions: Question[] = Array.isArray(data.questions)
    ? data.questions
    : Array.isArray(data.items)
      ? data.items.map((item: any, index: number) => ({
          id: item.id,
          number: index + 1,
          text: item.text,
          response_set: item.response_set,
          alert: item.alert,
        }))
      : [];

  // Handle response options - could be array (legacy) or object (new multi-set format)
  const responseOptions = data.response_options || {};
  const isLegacyFormat = Array.isArray(responseOptions);

  // Use string keys to match engine expectations
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const result = useMemo(() => {
    console.log("Calling runEngine with:", data.scoring?.engine, "answers:", answers);
    return runEngine(data, answers);
  }, [data, answers]);

  const onAnswer = (questionIndex: number, value: number) => {
    // Use item ID if available, otherwise fall back to question number
    const key = questions[questionIndex]?.id || `q${questionIndex + 1}`;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Get response options for a specific question
  const getOptionsForQuestion = (question: Question): ResponseOption[] => {
    if (isLegacyFormat) {
      // Legacy format - single array for all questions
      return responseOptions as ResponseOption[];
    } else {
      // New format - different options per response_set
      const responseSet = question.response_set || "default";
      return responseOptions[responseSet] || [];
    }
  };

  const showResultsWithScroll = () => {
    setShowResults(true);
    setTimeout(() => {
      const resultsElement = document.getElementById("assessment-results");
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const completedCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions ? Math.round((completedCount / totalQuestions) * 100) : 0;

  return (
    <>
      <FixedProgressFooter percent={progressPercent} />
      <SEOMeta seo={data.seo} />

      {/* Medical disclaimer */}
      <MedicalDisclaimer />

      {/* Related Conditions - Cross-links */}
      {data.conditions && data.conditions.length > 0 && (
        <Card className="border-separator bg-surface-grouped/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-label-primary">Related Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.conditions.map((conditionSlug: string) => (
                <Link
                  key={conditionSlug}
                  href={`/conditions/${conditionSlug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-fill-secondary px-3 py-1 text-sm font-medium text-label-secondary transition-colors hover:bg-fill-tertiary hover:text-label-primary"
                >
                  {conditionSlug
                    .split('-')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-label-tertiary">
              This assessment is commonly used to screen for these conditions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Intro sections */}
      <SectionList sections={topSections} />

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assessment Questions</span>
            <span className="text-sm font-normal text-label-tertiary">
              {completedCount} of {totalQuestions} completed
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question: Question, index: number) => {
            const answerKey = question.id || `q${index + 1}`;
            const selectedValue = answers[answerKey];
            const questionOptions = getOptionsForQuestion(question);

            return (
              <motion.div
                key={answerKey}
                id={index === 0 ? "question-1" : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="space-y-3"
              >
                  <div className="font-medium text-label-primary">
                    {index + 1}. {String(question.text ?? "")}
                    {question.alert && (
                      <div className="mt-1 text-sm font-normal text-caution">
                        ⚠️{" "}
                        {typeof question.alert === "string"
                          ? question.alert
                          : "Requires immediate clinical attention if positive"}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {questionOptions.map((option: ResponseOption) => {
                      const isSelected = selectedValue === option.value;
                      return (
                        <button
                          key={`${answerKey}-${option.value}`}
                          onClick={() => onAnswer(index, option.value)}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            isSelected
                              ? "border-accent bg-accent-tint text-accent-700"
                              : "border-separator text-label-secondary hover:border-separator-opaque"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                isSelected ? "border-accent bg-accent" : "border-separator"
                              }`}
                            >
                              {isSelected && <div className="h-2 w-2 rounded-full bg-canvas" />}
                            </div>
                            <span className="text-sm font-medium">{option.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

          {!showResults && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-label-secondary">
                Progress: {completedCount} / {totalQuestions}
              </p>
              <Button
                size="lg"
                disabled={totalQuestions > 0 && completedCount !== totalQuestions}
                onClick={showResultsWithScroll}
              >
                View Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && (
        <Card id="assessment-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-positive-500" />
              Your Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-fill-tertiary/30 py-6 text-center">
              <div className="mb-1 text-3xl font-bold text-label-primary">
                {result.score} / {result.max}
              </div>
              {result.details && "band" in result.details && result.details.band && (
                <div className="mb-3 text-lg font-semibold text-label-secondary">
                  {result.details.band}
                </div>
              )}
            </div>

            {/* Clinical interpretation from JSON */}
            {result.details &&
              "band" in result.details &&
              result.details.band &&
              data.clinical_interpretations?.[result.details.band] && (
                <Card className="border-separator bg-surface-grouped/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-label-primary">What This Means</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-label-secondary">
                    <p>{data.clinical_interpretations[result.details.band]}</p>
                  </CardContent>
                </Card>
              )}

            {/* Clinical alerts */}
            {result.details &&
              "alerts" in result.details &&
              result.details.alerts &&
              result.details.alerts.length > 0 && (
                <div className="rounded-lg border border-caution-border bg-caution-tint p-4">
                  <div className="mb-2 font-medium text-caution-700">Clinical Alert</div>
                  <div className="text-sm text-caution">{result.details.alerts.join("; ")}</div>
                </div>
              )}

            {/* Recommendations */}
            {result.details &&
              "recommendations" in result.details &&
              result.details.recommendations &&
              result.details.recommendations.length > 0 && (
                <div className="rounded-lg border border-positive-border bg-positive-tint p-4">
                  <div className="mb-2 font-medium text-positive-700">Recommendations</div>
                  <div className="text-sm text-positive-600">
                    <ul className="list-inside list-disc space-y-1">
                      {result.details.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            <SectionList sections={scoringSections} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => window.print()}>
                Print / Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAnswers({});
                  setShowResults(false);
                  setTimeout(() => {
                    const firstQuestion = document.getElementById("question-1");
                    if (firstQuestion) {
                      firstQuestion.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }, 100);
                }}
              >
                Retake Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional info */}
      <AutoFields
        title="Clinical Information"
        data={data}
        only={["clinical_use", "clinical_alerts", "psychometric_properties", "limitations"]}
        collapsible
        defaultOpen={false}
      />

      <SectionList sections={otherSections} />
      <ReferencesTable refs={data.references} />
    </>
  );
}
