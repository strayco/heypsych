/**
 * Safe Text Highlighting Utility
 *
 * Provides XSS-safe text highlighting using React nodes instead of innerHTML.
 * All text content is escaped and rendered as React text nodes - no HTML parsing.
 *
 * SECURITY:
 * - Never uses dangerouslySetInnerHTML
 * - All input is treated as plain text
 * - Search terms are regex-escaped to prevent ReDoS
 * - Empty/invalid inputs return safely
 */

import React, { ReactNode } from "react";

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

interface HighlightOptions {
  /** CSS classes for the highlighted text */
  highlightClassName?: string;
  /** Maximum text length before truncation (0 = no limit) */
  maxLength?: number;
  /** Case-insensitive matching (default: true) */
  caseInsensitive?: boolean;
}

const DEFAULT_HIGHLIGHT_CLASS = "bg-accent-500/30 text-accent-700 px-0.5 rounded font-medium";

/**
 * Safely highlight search terms in text using React nodes.
 *
 * @param text - The text to search within (from API/database)
 * @param searchTerms - Terms to highlight (single string or array)
 * @param options - Highlighting options
 * @returns React nodes with highlighted terms, or null for invalid input
 *
 * @example
 * // Single term
 * safeHighlight("Hello world", "world")
 * // => ["Hello ", <mark>world</mark>]
 *
 * @example
 * // Multiple terms
 * safeHighlight("Hello beautiful world", ["hello", "world"])
 * // => [<mark>Hello</mark>, " beautiful ", <mark>world</mark>]
 */
export function safeHighlight(
  text: string | null | undefined,
  searchTerms: string | string[] | null | undefined,
  options: HighlightOptions = {}
): ReactNode[] | null {
  // Validate text input
  if (!text || typeof text !== "string") {
    return null;
  }

  const {
    highlightClassName = DEFAULT_HIGHLIGHT_CLASS,
    maxLength = 0,
    caseInsensitive = true,
  } = options;

  // Normalize and filter search terms
  const terms = (Array.isArray(searchTerms) ? searchTerms : [searchTerms])
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.trim());

  // If no valid terms, return plain text
  if (terms.length === 0) {
    const displayText = maxLength > 0 ? truncateText(text, maxLength) : text;
    return [displayText];
  }

  // Apply truncation if needed
  const displayText = maxLength > 0 ? truncateText(text, maxLength) : text;

  // Build a combined regex for all terms (escaped to prevent ReDoS)
  const escapedTerms = terms.map(escapeRegex);
  const pattern = `(${escapedTerms.join("|")})`;
  const regex = new RegExp(pattern, caseInsensitive ? "gi" : "g");

  // Split text by matches and create React nodes
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = regex.exec(displayText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(displayText.slice(lastIndex, match.index));
    }

    // Add the highlighted match as a React element
    parts.push(
      <mark key={`hl-${keyIndex++}`} className={highlightClassName}>
        {match[0]}
      </mark>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < displayText.length) {
    parts.push(displayText.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [displayText];
}

/**
 * React component wrapper for safe highlighting.
 *
 * @example
 * <SafeHighlightedText
 *   text="Search results here"
 *   searchTerms={["search"]}
 *   className="text-sm"
 * />
 */
export function SafeHighlightedText({
  text,
  searchTerms,
  className,
  highlightClassName,
  maxLength,
}: {
  text: string | null | undefined;
  searchTerms: string | string[] | null | undefined;
  className?: string;
  highlightClassName?: string;
  maxLength?: number;
}): React.ReactElement | null {
  const highlighted = safeHighlight(text, searchTerms, {
    highlightClassName,
    maxLength,
  });

  if (!highlighted) {
    return null;
  }

  return <span className={className}>{highlighted}</span>;
}
