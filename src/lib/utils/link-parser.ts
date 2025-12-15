// src/lib/utils/link-parser.ts
import { ReactElement } from "react";
import { getRouteType, type RouteType } from "./entity-type";

export interface ParsedLink {
  type: "text" | "link";
  content: string;
  slug?: string;
  linkType?: RouteType;
}

/**
 * Parse text containing link tokens like {link:condition:major-depressive-disorder}
 * or {link:treatment:cognitive-behavioral-therapy:CBT}
 */
export function parseLinks(text: string): ParsedLink[] {
  // Support 3-part syntax: {link:type:slug:displayText}
  const linkRegex = /{link:([^:}]+):([^:}]+)(?::([^}]+))?}/g;
  const simpleLinkRegex = /{link:([^}]+)}/g;

  const parts: ParsedLink[] = [];
  let lastIndex = 0;

  // First try the full format: {link:type:slug} or {link:type:slug:displayText}
  let match = linkRegex.exec(text);
  const matches: { index: number; length: number; type: string; slug: string; displayText?: string }[] = [];

  while (match) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: match[1], // condition, treatment, provider, medication, therapy, etc.
      slug: match[2],
      displayText: match[3], // optional display text
    });
    match = linkRegex.exec(text);
  }

  // Reset regex
  linkRegex.lastIndex = 0;

  // If no full format matches, try simple format: {link:slug} (assumes condition)
  if (matches.length === 0) {
    let simpleMatch = simpleLinkRegex.exec(text);
    while (simpleMatch) {
      matches.push({
        index: simpleMatch.index,
        length: simpleMatch[0].length,
        type: "condition", // default to condition
        slug: simpleMatch[1],
      });
      simpleMatch = simpleLinkRegex.exec(text);
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build parts array
  matches.forEach((match) => {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({ type: "text", content: textContent });
      }
    }

    // Add the link - use displayText if provided, otherwise format from slug
    parts.push({
      type: "link",
      content: match.displayText || formatSlugToName(match.slug),
      slug: match.slug,
      linkType: normalizeEntityTypeToRouteType(match.type),
    });

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push({ type: "text", content: remainingText });
    }
  }

  // If no links found, return the original text
  if (parts.length === 0) {
    parts.push({ type: "text", content: text });
  }

  return parts;
}

/**
 * Convert a slug to a readable name
 * e.g., "major-depressive-disorder" -> "Major Depressive Disorder"
 */
export function formatSlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Normalize entity types to route types
 * Uses consolidated utility for consistent route mapping
 */
function normalizeEntityTypeToRouteType(entityType: string): RouteType {
  return getRouteType(entityType);
}

/**
 * Get the appropriate URL path for a link type and slug
 * CANONICAL ROUTE MAPPING - single source of truth for all URLs
 */
export function getLinkPath(
  linkType: "condition" | "treatment" | "provider" | "resource" | "assessment",
  slug: string
): string {
  switch (linkType) {
    case "condition":
      return `/conditions/${slug}`;
    case "treatment":
      return `/treatments/${slug}`;
    case "provider":
      return `/providers/${slug}`;
    case "assessment":
      return `/resources/assessments-screeners/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    default:
      return `/${slug}`;
  }
}
