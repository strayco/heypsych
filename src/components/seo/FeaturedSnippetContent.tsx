/**
 * Featured Snippet Content Components
 *
 * Specialized components that format content to trigger Google featured snippets.
 * Uses semantic HTML, specific formatting patterns, and structured content
 * that Google's algorithms prefer for Position 0.
 *
 * Snippet Types Targeted:
 * 1. Definition box (40-60 word paragraph)
 * 2. Numbered list (steps, rankings)
 * 3. Bulleted list (features, examples)
 * 4. Table (comparison data)
 * 5. FAQ accordion (People Also Ask)
 *
 * AI/LLM Optimization:
 * Also optimized for AI Overview extraction and LLM training data.
 * Clear, factual, well-structured content that AI systems can cite.
 */

import React from "react";

// ============================================================================
// DEFINITION SNIPPET
// Target: "What is X?" queries - 40-60 word definition paragraphs
// ============================================================================

interface DefinitionSnippetProps {
  term: string;
  definition: string;
  /** Optional follow-up for additional context */
  followUp?: string;
  /** Make the term bold in the definition */
  highlightTerm?: boolean;
}

/**
 * Definition Snippet Component
 *
 * Formats a definition to trigger Google's definition featured snippet.
 * Optimal length: 40-60 words in the definition.
 *
 * Example output:
 * "SimplePractice is a HIPAA-compliant practice management platform
 * designed for mental health professionals. It combines scheduling,
 * documentation, billing, and telehealth in one integrated solution..."
 */
export function DefinitionSnippet({
  term,
  definition,
  followUp,
  highlightTerm = true,
}: DefinitionSnippetProps) {
  // Check definition word count
  const wordCount = definition.split(/\s+/).length;
  const isOptimalLength = wordCount >= 40 && wordCount <= 60;

  return (
    <div
      className="featured-snippet-definition"
      itemScope
      itemType="https://schema.org/DefinedTerm"
    >
      {/* Hidden but semantic markup for crawlers */}
      <meta itemProp="name" content={term} />

      <p
        className="text-lg text-label-primary leading-relaxed"
        itemProp="description"
      >
        {highlightTerm ? (
          <>
            <strong className="font-semibold">{term}</strong>{" "}
            {definition.replace(new RegExp(`^${term}\\s*`, "i"), "")}
          </>
        ) : (
          definition
        )}
      </p>

      {followUp && (
        <p className="mt-3 text-label-secondary">{followUp}</p>
      )}

      {/* Dev warning for suboptimal length */}
      {process.env.NODE_ENV === "development" && !isOptimalLength && (
        <p className="mt-2 text-xs text-warning">
          ⚠️ Definition is {wordCount} words. Optimal: 40-60 words.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// NUMBERED LIST SNIPPET
// Target: "How to X", "Best X", "Steps to X" queries
// ============================================================================

interface NumberedListSnippetProps {
  title: string;
  /** Question format for PAA targeting */
  question?: string;
  items: {
    title: string;
    description?: string;
  }[];
  /** Numbered (1, 2, 3) or ordered (steps) */
  variant?: "numbered" | "steps" | "ranking";
}

/**
 * Numbered List Snippet Component
 *
 * Formats a numbered list to trigger Google's list featured snippet.
 * Optimal: 3-8 items with concise titles.
 */
export function NumberedListSnippet({
  title,
  question,
  items,
  variant = "numbered",
}: NumberedListSnippetProps) {
  const listType =
    variant === "steps" ? "HowTo" : variant === "ranking" ? "ItemList" : "ItemList";

  return (
    <section
      className="featured-snippet-list"
      itemScope
      itemType={`https://schema.org/${listType}`}
    >
      {/* Question format for PAA */}
      {question && (
        <h3
          className="text-lg font-semibold text-label-primary mb-3"
          itemProp="name"
        >
          {question}
        </h3>
      )}

      {!question && (
        <h3
          className="text-lg font-semibold text-label-primary mb-3"
          itemProp="name"
        >
          {title}
        </h3>
      )}

      <ol className="space-y-3 list-decimal list-inside">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="text-label-primary"
            itemProp={variant === "steps" ? "step" : "itemListElement"}
            itemScope
            itemType={
              variant === "steps"
                ? "https://schema.org/HowToStep"
                : "https://schema.org/ListItem"
            }
          >
            <meta itemProp="position" content={String(idx + 1)} />
            <strong className="font-medium" itemProp="name">
              {item.title}
            </strong>
            {item.description && (
              <span className="text-label-secondary" itemProp="text">
                {" "}— {item.description}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ============================================================================
// BULLETED LIST SNIPPET
// Target: "Features of X", "Examples of X", "Types of X" queries
// ============================================================================

interface BulletedListSnippetProps {
  title: string;
  items: string[];
  /** Intro sentence before the list */
  intro?: string;
}

/**
 * Bulleted List Snippet Component
 *
 * Formats a bulleted list to trigger Google's list featured snippet.
 * Optimal: 4-8 items with concise text.
 */
export function BulletedListSnippet({
  title,
  items,
  intro,
}: BulletedListSnippetProps) {
  return (
    <section className="featured-snippet-bullets">
      <h3 className="text-lg font-semibold text-label-primary mb-2">{title}</h3>

      {intro && <p className="text-label-secondary mb-3">{intro}</p>}

      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-label-primary">
            <span className="text-treatment mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================================
// TABLE SNIPPET
// Target: Comparison queries, "X vs Y", pricing comparisons
// ============================================================================

interface TableSnippetProps {
  title: string;
  headers: string[];
  rows: string[][];
  /** Caption for accessibility and SEO */
  caption?: string;
}

/**
 * Table Snippet Component
 *
 * Formats a comparison table to trigger Google's table featured snippet.
 * Keep tables simple: 2-4 columns, 3-8 rows.
 */
export function TableSnippet({
  title,
  headers,
  rows,
  caption,
}: TableSnippetProps) {
  return (
    <section className="featured-snippet-table">
      <h3 className="text-lg font-semibold text-label-primary mb-3">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead>
            <tr className="border-b border-separator bg-surface">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="py-2 px-3 text-left font-semibold text-label-primary"
                  scope="col"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-separator ${
                  rowIdx % 2 === 0 ? "bg-canvas" : "bg-surface"
                }`}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="py-2 px-3 text-label-secondary"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ ACCORDION SNIPPET
// Target: People Also Ask boxes
// ============================================================================

interface FAQSnippetProps {
  questions: {
    question: string;
    answer: string;
  }[];
  /** Expandable accordion or always visible */
  variant?: "accordion" | "visible";
}

/**
 * FAQ Snippet Component
 *
 * Formats FAQs with proper semantic markup for PAA and FAQ rich results.
 * Uses details/summary for native accordion without JS.
 */
export function FAQSnippet({
  questions,
  variant = "visible",
}: FAQSnippetProps) {
  return (
    <section
      className="featured-snippet-faq"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="space-y-4">
        {questions.map((faq, idx) => (
          <div
            key={idx}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            {variant === "accordion" ? (
              <details className="group rounded-lg border border-separator bg-surface">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-label-primary">
                  <span itemProp="name">{faq.question}</span>
                  <span className="ml-2 text-label-tertiary group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div
                  className="px-4 pb-4 text-label-secondary"
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p itemProp="text">{faq.answer}</p>
                </div>
              </details>
            ) : (
              <div className="rounded-lg border border-separator bg-surface p-4">
                <h4
                  className="font-medium text-label-primary mb-2"
                  itemProp="name"
                >
                  {faq.question}
                </h4>
                <div
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p className="text-label-secondary" itemProp="text">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// AI/LLM CITATION BLOCK
// Target: AI Overviews, ChatGPT citations, Perplexity references
// ============================================================================

interface AICitationBlockProps {
  /** Primary fact or claim */
  claim: string;
  /** Source attribution */
  source: string;
  /** Date for freshness signal */
  date: string;
  /** Optional confidence level */
  confidence?: "verified" | "reported" | "estimated";
}

/**
 * AI Citation Block Component
 *
 * Formats a factual claim in a way that AI systems prefer to cite.
 * Clear, attributed, dated content with explicit confidence level.
 */
export function AICitationBlock({
  claim,
  source,
  date,
  confidence = "verified",
}: AICitationBlockProps) {
  const confidenceLabel = {
    verified: "Verified",
    reported: "Vendor-reported",
    estimated: "Estimated",
  }[confidence];

  return (
    <aside
      className="ai-citation-block rounded-lg border border-separator bg-canvas p-4"
      data-ai-citation="true"
    >
      <p className="text-label-primary font-medium">{claim}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-label-tertiary">
        <span>Source: {source}</span>
        <span>•</span>
        <span>Updated: {date}</span>
        <span>•</span>
        <span
          className={`px-1.5 py-0.5 rounded ${
            confidence === "verified"
              ? "bg-positive/10 text-positive"
              : confidence === "reported"
              ? "bg-accent/10 text-accent"
              : "bg-caution/10 text-caution"
          }`}
        >
          {confidenceLabel}
        </span>
      </div>
    </aside>
  );
}

// ============================================================================
// QUICK ANSWER BOX
// Target: Zero-click queries, direct answers
// ============================================================================

interface QuickAnswerBoxProps {
  question: string;
  answer: string;
  /** Additional context after the answer */
  context?: string;
}

/**
 * Quick Answer Box Component
 *
 * Formats a direct answer for zero-click queries.
 * Google often shows these for "how much", "what is", "when" queries.
 */
export function QuickAnswerBox({
  question,
  answer,
  context,
}: QuickAnswerBoxProps) {
  return (
    <div className="quick-answer-box rounded-xl border-2 border-treatment/20 bg-treatment/5 p-5">
      <p className="text-sm font-medium text-label-tertiary uppercase tracking-wide mb-1">
        Quick Answer
      </p>
      <h3 className="text-lg font-semibold text-label-primary mb-2">
        {question}
      </h3>
      <p className="text-2xl font-bold text-treatment">{answer}</p>
      {context && (
        <p className="mt-2 text-sm text-label-secondary">{context}</p>
      )}
    </div>
  );
}

// Components are exported inline with their definitions above
