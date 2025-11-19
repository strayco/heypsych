"use client";

// CLIENT WRAPPER - Assessment detail page with interactive functionality
// Data is passed from server component (already fetched)

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ClipboardCheck,
  AlertTriangle,
  Info,
  Award,
  Clock,
  Users,
  BookOpen,
  Calculator,
} from "lucide-react";
import { Entity } from "@/lib/types/database";
import type { PageLinkResult } from "@/lib/linking/link-service";
import {
  TreatmentOptionsSection,
  RelatedConditionsSection,
  AssessmentCTASection,
  RelatedArticlesSection,
} from "@/components/linking";
import {
  AuthorByline,
  MedicalReviewBadge,
  ContentTimestamps,
  MedicalDisclaimer,
  CitationList,
} from "@/components/eat";

interface AssessmentDetailClientProps {
  entity: Entity;
  pageLinks: PageLinkResult;
}

export default function AssessmentDetailClient({ entity, pageLinks }: AssessmentDetailClientProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const data = entity?.data ?? {};
  const name = entity?.name ?? data?.name ?? "Assessment";
  const fullName = data?.full_name ?? data?.fullName ?? name;
  const description = data?.description ?? "No description available";
  const items = data?.items ?? [];
  const responseOptions = data?.response_options ?? [];
  const sections = data?.sections ?? [];
  const duration = data?.duration ?? "Variable";
  const ageRange = data?.age_range ?? data?.ageRange ?? "Not specified";
  const validated = data?.validated !== false;
  const free = data?.free !== false;

  // Helper function to get response options for an item
  const getResponseOptionsForItem = (item: any) => {
    if (Array.isArray(responseOptions)) {
      return responseOptions;
    }
    if (typeof responseOptions === "object" && item.response_set) {
      return responseOptions[item.response_set] ?? [];
    }
    return [];
  };

  const handleResponseChange = (itemId: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  // Enhanced scoring system
  const calculateScores = () => {
    const scoring = data?.scoring;
    const engine = scoring?.engine || "sum_with_bands";
    const total = Object.values(responses).reduce((sum, val) => sum + val, 0);
    const scores: any = { total };

    if (engine === "sum_with_bands") {
      const bands = scoring?.rules?.severity?.bands;
      if (bands) {
        for (const [range, level] of Object.entries(bands)) {
          const [min, max] = range.split("-").map(Number);
          if (total >= min && total <= max) {
            scores.severity = level;
            break;
          }
        }
      }
    } else if (engine === "asrs_custom") {
      const rules = scoring?.rules;
      if (rules) {
        const partA = rules.part_a || [];
        const partB = rules.part_b || [];

        scores.part_a_total = partA.reduce(
          (sum: number, qNum: number) => sum + (responses[`q${qNum}`] || 0),
          0
        );
        scores.part_b_total = partB.reduce(
          (sum: number, qNum: number) => sum + (responses[`q${qNum}`] || 0),
          0
        );

        if (scores.part_a_total >= 18 || scores.total >= 50) {
          scores.severity = "Very High";
        } else if (scores.part_a_total >= 14 || scores.total >= 40) {
          scores.severity = "High";
        } else if (scores.part_a_total >= 10 || scores.total >= 30) {
          scores.severity = "Mild to Moderate";
        } else {
          scores.severity = "Low";
        }
      }
    } else if (engine === "assist_who_v3") {
      scores.severity = "Low Risk";
    }

    return scores;
  };

  const isComplete =
    items.length > 0 && items.every((item: any) => responses[item.id] !== undefined);

  const handleSubmit = () => {
    if (isComplete) {
      setShowResults(true);
      setTimeout(() => {
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handleReset = () => {
    setResponses({});
    setShowResults(false);
    setTimeout(() => {
      const firstQuestion = document.getElementById("question-1");
      if (firstQuestion) {
        firstQuestion.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const scoreResults = calculateScores();
  const totalScore = scoreResults.total;
  const severityLevel = scoreResults.severity;
  const interpretation = severityLevel ? data?.clinical_interpretations?.[severityLevel] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <section className="relative px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/resources/assessments-screeners")}
            className="group mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Assessments
          </Button>

          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl bg-blue-50 p-4">
                <ClipboardCheck className="h-12 w-12 text-blue-600" />
              </div>
            </div>

            <h1 className="mb-2 text-3xl font-bold text-neutral-900">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {name}
              </span>
            </h1>
            <p className="mb-4 text-lg text-neutral-700">{fullName}</p>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              {validated && (
                <Badge className="border-green-200 bg-green-50 text-green-700">
                  <Award className="mr-1 h-3 w-3" />
                  Validated
                </Badge>
              )}
              {free && (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">Free to Use</Badge>
              )}
              <Badge className="border-neutral-200 bg-neutral-50 text-neutral-700">
                <Clock className="mr-1 h-3 w-3" />
                {duration}
              </Badge>
              <Badge className="border-neutral-200 bg-neutral-50 text-neutral-700">
                <Users className="mr-1 h-3 w-3" />
                {ageRange}
              </Badge>
            </div>

            <p className="mx-auto max-w-2xl text-sm text-neutral-800">{description}</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Important Disclaimer</p>
                  <p>
                    This is a screening tool for educational purposes only. It does not provide a
                    diagnosis and should not replace professional evaluation. If you're experiencing
                    mental health concerns, please consult a licensed clinician.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Sections */}
      {sections.length > 0 && (
        <section className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-4">
            {sections.map((section: any, idx: number) => (
              <Card key={idx} className="shadow-sm">
                <CardContent className="p-6">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-neutral-900">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {section.title}
                  </h3>
                  <p className="text-sm text-neutral-800">{section.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Questionnaire */}
      {items.length > 0 && (
        <section id="questionnaire-section" className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-center text-2xl text-neutral-900">
                  Assessment Questions
                </CardTitle>
                <p className="text-center text-sm text-neutral-700">
                  {items.length} items • Select one response per question
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {items.map((item: any, index: number) => (
                    <motion.div
                      key={item.id}
                      id={index === 0 ? "question-1" : undefined}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium leading-relaxed text-neutral-900">
                            {item.text}
                          </p>
                          {item.alert && (
                            <Badge className="mt-2 border-red-200 bg-red-50 text-red-700">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Critical Item
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="ml-11 space-y-2">
                        {getResponseOptionsForItem(item).map((option: any) => (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition-all hover:border-blue-300 hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20"
                          >
                            <input
                              type="radio"
                              name={item.id}
                              value={option.value}
                              checked={responses[item.id] === option.value}
                              onChange={() => handleResponseChange(item.id, option.value)}
                              className="h-4 w-4 border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-neutral-900">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="text-sm text-neutral-700">
                    {Object.keys(responses).length} of {items.length} questions answered
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isComplete}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isComplete
                      ? showResults
                        ? "Recalculate Score"
                        : "Calculate Score"
                      : "Complete All Questions"}
                  </Button>
                  {Object.keys(responses).length > 0 && !showResults && (
                    <Button onClick={handleReset} variant="ghost" size="sm">
                      Clear All Responses
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Results */}
      {showResults && (
        <motion.section
          id="results-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-4xl">
            <Card className="border-blue-200 bg-blue-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calculator className="h-6 w-6" />
                  Your Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">Total Score:</span>
                    <span className="text-2xl font-bold text-blue-600">{totalScore}</span>
                  </div>
                  {severityLevel && (
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">Severity Level:</span>
                      <Badge className="text-base">{severityLevel}</Badge>
                    </div>
                  )}
                  {scoreResults.part_a_total !== undefined && (
                    <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-900">Part A Score:</span>
                        <span className="font-semibold text-blue-600">
                          {scoreResults.part_a_total} / 24
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-900">Part B Score:</span>
                        <span className="font-semibold text-blue-600">
                          {scoreResults.part_b_total} / 48
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {interpretation && (
                  <div className="rounded-lg bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-neutral-900">
                      <Info className="h-5 w-5 text-blue-600" />
                      Clinical Interpretation
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-800">{interpretation}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Retake Assessment
                  </Button>
                  <Button onClick={() => window.print()} className="flex-1">
                    Print Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      )}

      {/* Psychometric Properties */}
      {data?.psychometric_properties && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="border-purple-200 bg-purple-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Award className="h-6 w-6" />
                  Psychometric Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(data.psychometric_properties).map(([key, value]: any) => (
                    <div key={key} className="rounded-lg bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="mt-1 text-sm text-neutral-900">{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* References */}
      {data?.references && data.references.length > 0 && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.references.map((ref: any, idx: number) => (
                    <li key={idx} className="text-sm text-neutral-800">
                      <span className="font-medium">{ref.title}</span>
                      {ref.authors && <span className="text-neutral-700">. {ref.authors}</span>}
                      {ref.year && <span className="text-neutral-700"> ({ref.year})</span>}
                      {ref.doi && <span className="text-neutral-700">. DOI: {ref.doi}</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Related Conditions Links */}
      {pageLinks.linksBySlot.related_conditions.length > 0 && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RelatedConditionsSection
                links={pageLinks.linksBySlot.related_conditions}
                title="Conditions This Assessment Screens For"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Related Treatments Links */}
      {pageLinks.linksBySlot.treatment_options.length > 0 && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <TreatmentOptionsSection
                links={pageLinks.linksBySlot.treatment_options}
                title="Treatment Options"
                description="Evidence-based treatments for conditions this assessment screens for"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Other Assessments Links */}
      {pageLinks.linksBySlot.screening_tools.length > 0 && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <AssessmentCTASection
                links={pageLinks.linksBySlot.screening_tools}
                title="Other Assessment Tools"
                description="Additional screening tools you may find helpful"
                prominent={false}
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Related Resources Links */}
      {pageLinks.linksBySlot.related_articles.length > 0 && (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <RelatedArticlesSection
                links={pageLinks.linksBySlot.related_articles}
                title="Related Resources"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Medical Disclaimer */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <MedicalDisclaimer
              config={{
                entity_type: 'assessment',
                prominent: true,
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Copyright */}
      {data?.copyright && (
        <section className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg bg-neutral-100 p-4 text-center text-xs text-neutral-700">
              <p>{data.copyright.notice}</p>
              {data.copyright.usage && <p className="mt-1">{data.copyright.usage}</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
