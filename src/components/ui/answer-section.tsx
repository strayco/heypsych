/**
 * Answer Section Component
 *
 * Wrapper that adds semantic markers for Google's featured-snippet parser.
 * Use this for any content block that should be eligible for featured snippets.
 *
 * @see Phase H of Wave 3 directive - Server-rendered answer objects
 */

import React from "react";

interface AnswerSectionProps {
  /** Unique ID for the section (e.g., "KEY_FACTS", "OVERVIEW", "SYMPTOMS") */
  id: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Section heading (optional - if provided, renders as h2) */
  heading?: string;
  /** Additional CSS classes */
  className?: string;
  /** Content type hint for SEO (optional) */
  answerType?: "definition" | "list" | "table" | "comparison" | "steps" | "facts";
  /** Children content */
  children: React.ReactNode;
}

/**
 * AnswerSection - Semantic wrapper for featured-snippet-eligible content
 *
 * Adds:
 * - data-answer="true" for snippet parser
 * - id for deep linking
 * - aria-label for accessibility
 * - data-answer-type for content type hints
 */
export function AnswerSection({
  id,
  ariaLabel,
  heading,
  className = "",
  answerType,
  children,
}: AnswerSectionProps) {
  return (
    <section
      id={id}
      data-answer="true"
      data-answer-type={answerType}
      aria-label={ariaLabel || heading || id.toLowerCase().replace(/_/g, " ")}
      className={className}
    >
      {heading && (
        <h2 className="text-xl font-semibold text-label-primary mb-4">
          {heading}
        </h2>
      )}
      {children}
    </section>
  );
}

/**
 * EntityTerm - Wrapper for medical terms that match Wikidata entities
 *
 * Adds data-entity attribute for entity grounding.
 * Use for any medical term that has a corresponding Wikidata QID.
 */
interface EntityTermProps {
  /** The term text */
  children: React.ReactNode;
  /** Wikidata QID (e.g., "Q12136" for depression) */
  qid?: string;
  /** Entity type for styling */
  type?: "condition" | "treatment" | "symptom" | "medication";
  /** Optional link to entity page */
  href?: string;
}

export function EntityTerm({
  children,
  qid,
  type = "condition",
  href,
}: EntityTermProps) {
  const className = `data-entity ${type === "condition" ? "text-teal-700" : type === "medication" ? "text-blue-700" : ""}`;

  if (href) {
    return (
      <a
        href={href}
        data-entity={type}
        data-qid={qid}
        className={`${className} underline hover:no-underline`}
      >
        {children}
      </a>
    );
  }

  return (
    <span data-entity={type} data-qid={qid} className={className}>
      {children}
    </span>
  );
}

/**
 * StepList - Semantic ordered list for step-by-step content
 *
 * Use instead of raw prose for any content that is inherently sequential.
 */
interface StepListProps {
  steps: string[];
  className?: string;
}

export function StepList({ steps, className = "" }: StepListProps) {
  return (
    <ol
      className={`list-decimal list-inside space-y-2 ${className}`}
      data-answer-type="steps"
    >
      {steps.map((step, index) => (
        <li key={index} className="text-label-secondary">
          {step}
        </li>
      ))}
    </ol>
  );
}

/**
 * ComparisonTable - Semantic table for comparisons
 *
 * Use for any side-by-side comparison content.
 */
interface ComparisonTableProps {
  headers: string[];
  rows: string[][];
  caption?: string;
  className?: string;
}

export function ComparisonTable({
  headers,
  rows,
  caption,
  className = "",
}: ComparisonTableProps) {
  return (
    <table
      className={`w-full border-collapse ${className}`}
      data-answer-type="comparison"
    >
      {caption && (
        <caption className="text-sm text-label-secondary mb-2 text-left">
          {caption}
        </caption>
      )}
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              scope="col"
              className="text-left p-2 border-b border-separator font-medium text-label-primary"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="p-2 border-b border-separator text-label-secondary"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * DefinitionBlock - Semantic block for definitions
 *
 * Use for "What is X?" type content that should appear in definition featured snippets.
 */
interface DefinitionBlockProps {
  term: string;
  definition: string;
  className?: string;
}

export function DefinitionBlock({
  term,
  definition,
  className = "",
}: DefinitionBlockProps) {
  return (
    <dl className={className} data-answer-type="definition">
      <dt className="font-semibold text-label-primary">{term}</dt>
      <dd className="text-label-secondary mt-1">{definition}</dd>
    </dl>
  );
}
