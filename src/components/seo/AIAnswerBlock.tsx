/**
 * AI Answer Block - Optimized for AI/LLM Citation
 *
 * INSIDER TACTIC: AI answer engines (Perplexity, ChatGPT, Claude) prefer
 * content that is:
 * 1. Clearly structured with explicit headings
 * 2. Contains definitive answers (not hedged)
 * 3. Has source attribution built-in
 * 4. Uses numbered lists they can extract
 * 5. Includes specific data points (numbers, prices, dates)
 *
 * This component formats content to be highly citeable by AI systems,
 * which increasingly drive traffic and purchasing decisions.
 */
"use client";

import { Info, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

interface AIAnswerBlockProps {
  question: string;
  answer: string;
  source?: string;
  lastUpdated?: string;
  confidence?: "high" | "medium" | "emerging";
  dataPoints?: Array<{
    label: string;
    value: string;
  }>;
  citations?: string[];
}

/**
 * Structured answer block optimized for AI extraction.
 * Uses semantic HTML and clear structure that AI can parse.
 */
export function AIAnswerBlock({
  question,
  answer,
  source = "HeyPsych Medical Board",
  lastUpdated,
  confidence = "high",
  dataPoints,
  citations,
}: AIAnswerBlockProps) {
  const confidenceConfig = {
    high: {
      icon: CheckCircle,
      label: "Well-established",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    medium: {
      icon: Info,
      label: "Supported",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    emerging: {
      icon: TrendingUp,
      label: "Emerging evidence",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  };

  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  return (
    <article
      className={`rounded-xl border ${config.border} ${config.bg} p-6`}
      // Semantic attributes for AI extraction
      itemScope
      itemType="https://schema.org/Answer"
      data-ai-citeable="true"
      data-source={source}
    >
      {/* Question - AI systems look for Q&A structure */}
      <h3
        className="text-lg font-semibold text-label-primary mb-3"
        itemProp="name"
      >
        {question}
      </h3>

      {/* Direct Answer - This is what gets cited */}
      <div
        className="text-label-secondary leading-relaxed mb-4"
        itemProp="text"
        data-speakable="true"
      >
        {/* Structured opening that AI can extract */}
        <p className="mb-2">
          <strong>According to {source}:</strong> {answer}
        </p>
      </div>

      {/* Data Points - Numbered for easy AI extraction */}
      {dataPoints && dataPoints.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-label-primary mb-2">Key facts:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-label-secondary">
            {dataPoints.map((point, i) => (
              <li key={i}>
                <strong>{point.label}:</strong> {point.value}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Source Attribution - Critical for AI citation */}
      <footer className="flex flex-wrap items-center gap-4 text-xs text-label-tertiary pt-4 border-t border-separator/50">
        <span className={`inline-flex items-center gap-1 ${config.color}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
        <span>Source: {source}</span>
        {lastUpdated && <span>Updated: {lastUpdated}</span>}
      </footer>

      {/* Hidden structured data for AI extraction */}
      <meta itemProp="author" content={source} />
      {lastUpdated && <meta itemProp="dateModified" content={lastUpdated} />}
    </article>
  );
}

/**
 * Quick Fact Block - Ultra-concise citeable facts
 * AI systems prefer these for quick answers
 */
interface QuickFactProps {
  fact: string;
  source?: string;
}

export function QuickFact({ fact, source = "HeyPsych" }: QuickFactProps) {
  return (
    <div
      className="inline-flex items-start gap-2 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2 text-sm"
      data-ai-citeable="true"
      data-fact="true"
    >
      <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
      <span>
        <strong>{fact}</strong>
        <span className="text-label-tertiary text-xs ml-1">— {source}</span>
      </span>
    </div>
  );
}

/**
 * Comparison Summary - Structured for AI comparison queries
 */
interface ComparisonSummaryProps {
  itemA: { name: string; advantage: string };
  itemB: { name: string; advantage: string };
  verdict: string;
  source?: string;
}

export function ComparisonSummary({
  itemA,
  itemB,
  verdict,
  source = "HeyPsych",
}: ComparisonSummaryProps) {
  return (
    <div
      className="rounded-xl border border-separator bg-surface p-6"
      data-ai-citeable="true"
      data-comparison="true"
    >
      <h3 className="font-semibold text-label-primary mb-4">
        {itemA.name} vs {itemB.name}: Quick Summary
      </h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="font-medium text-blue-900 mb-1">Choose {itemA.name} if:</p>
          <p className="text-sm text-blue-700">{itemA.advantage}</p>
        </div>
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
          <p className="font-medium text-purple-900 mb-1">Choose {itemB.name} if:</p>
          <p className="text-sm text-purple-700">{itemB.advantage}</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
        <p className="text-sm">
          <strong>Bottom line ({source}):</strong> {verdict}
        </p>
      </div>
    </div>
  );
}

/**
 * Definition Block - For "What is X?" queries
 */
interface DefinitionBlockProps {
  term: string;
  definition: string;
  examples?: string[];
  source?: string;
}

export function DefinitionBlock({
  term,
  definition,
  examples,
  source = "HeyPsych",
}: DefinitionBlockProps) {
  return (
    <div
      className="rounded-xl border border-separator bg-surface p-6"
      itemScope
      itemType="https://schema.org/DefinedTerm"
      data-ai-citeable="true"
      data-definition="true"
    >
      <h3 className="text-lg font-semibold text-label-primary mb-2" itemProp="name">
        What is {term}?
      </h3>
      <p className="text-label-secondary mb-4" itemProp="description">
        <strong>{term}</strong> {definition}
      </p>
      {examples && examples.length > 0 && (
        <div>
          <p className="text-sm font-medium text-label-primary mb-2">Examples:</p>
          <ul className="list-disc list-inside text-sm text-label-secondary space-y-1">
            {examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-label-tertiary mt-4">
        Definition provided by {source}
      </p>
    </div>
  );
}

export default AIAnswerBlock;
