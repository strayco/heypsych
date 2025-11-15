// src/lib/utils/link-parser.ts
import { ReactElement } from "react";

export interface ParsedLink {
  type: "text" | "link";
  content: string;
  slug?: string;
  linkType?: "condition" | "treatment" | "provider" | "resource";
}

/**
 * Parse text containing link tokens like {link:condition:major-depressive-disorder}
 * or {link:treatment:cognitive-behavioral-therapy}
 */
export function parseLinks(text: string): ParsedLink[] {
  const linkRegex = /{link:([^:}]+):([^}]+)}/g;
  const simpleLinkRegex = /{link:([^}]+)}/g;

  const parts: ParsedLink[] = [];
  let lastIndex = 0;

  // First try the full format: {link:type:slug}
  let match = linkRegex.exec(text);
  const matches: { index: number; length: number; type: string; slug: string }[] = [];

  while (match) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: match[1], // condition, treatment, provider
      slug: match[2],
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

    // Add the link
    parts.push({
      type: "link",
      content: formatSlugToName(match.slug),
      slug: match.slug,
      linkType: match.type as "condition" | "treatment" | "provider",
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
 * Get the appropriate URL path for a link type and slug
 */
export function getLinkPath(
  linkType: "condition" | "treatment" | "provider" | "resource",
  slug: string
): string {
  switch (linkType) {
    case "condition":
      return `/conditions/${slug}`;
    case "treatment":
      return `/treatments/${slug}`;
    case "provider":
      return `/providers/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    default:
      return `/${slug}`;
  }
}
