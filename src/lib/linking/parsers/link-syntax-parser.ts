/**
 * Link Syntax Parser
 *
 * Handles parsing and manipulation of {link:type:slug:text} syntax
 */

export interface ParsedLink {
  type: string;
  slug: string;
  text: string | null;
}

/**
 * Parse {link:type:slug:text} syntax from content
 *
 * Supports formats:
 * - {link:type:slug:text} - Full format with custom text
 * - {link:type:slug} - Type and slug only
 * - {link:slug} - Simple format (defaults to condition type)
 *
 * @param text - Text containing link syntax
 * @returns Parsed link object or null if invalid
 */
export function parseLinkSyntax(text: string): ParsedLink | null {
  // Full format: {link:type:slug:text} or {link:type:slug}
  const fullLinkRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/;
  const fullMatch = text.match(fullLinkRegex);

  if (fullMatch) {
    return {
      type: fullMatch[1],
      slug: fullMatch[2],
      text: fullMatch[3] || null,
    };
  }

  // Simple format: {link:slug} - assume condition type
  const simpleLinkRegex = /\{link:([^:}]+)\}/;
  const simpleMatch = text.match(simpleLinkRegex);

  if (simpleMatch) {
    return {
      type: 'condition', // Default to condition for simple format
      slug: simpleMatch[1],
      text: null,
    };
  }

  return null;
}

/**
 * Clean link syntax from text, leaving just the display text
 *
 * @param text - Text with link syntax
 * @returns Text with link syntax removed
 */
export function cleanLinkSyntax(text: string): string {
  return text.replace(/\{link:[^:}]+:([^:}]+)(?::([^}]+))?\}/g, (_, slug, displayText) => {
    return displayText || slug.replace(/-/g, ' ');
  });
}

/**
 * Extract all {link:} references from text
 *
 * @param text - Text to search
 * @returns Array of parsed link objects
 */
export function extractAllLinkReferences(text: string): ParsedLink[] {
  const linkRegex = /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g;
  const references: ParsedLink[] = [];
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    references.push({
      type: match[1],
      slug: match[2],
      text: match[3] || null,
    });
  }

  return references;
}

/**
 * Check if text contains link syntax
 *
 * @param text - Text to check
 * @returns True if text contains {link:...} syntax
 */
export function hasLinkSyntax(text: string): boolean {
  return /\{link:[^}]+\}/.test(text);
}

/**
 * Replace link syntax with rendered HTML anchor
 *
 * @param text - Text with link syntax
 * @param baseUrl - Base URL for links (e.g., '/conditions')
 * @returns HTML string with anchor tags
 */
export function renderLinkSyntax(text: string, baseUrl: string = ''): string {
  return text.replace(
    /\{link:([^:}]+):([^:}]+)(?::([^}]+))?\}/g,
    (_, type, slug, displayText) => {
      const href = `${baseUrl}/${type}s/${slug}`;
      const text = displayText || slug.replace(/-/g, ' ');
      return `<a href="${href}">${text}</a>`;
    }
  );
}
