/**
 * Text Normalization Utilities
 *
 * Functions for normalizing, slugifying, and cleaning text for entity matching
 */

/**
 * Convert text to slug format
 *
 * @param text - Text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize condition name by removing abbreviations in parentheses
 *
 * @example
 * "Obsessive-Compulsive Disorder (OCD)" → "Obsessive-Compulsive Disorder"
 *
 * @param text - Condition name with possible abbreviation
 * @returns Normalized name without abbreviation
 */
export function normalizeConditionName(text: string): string {
  return text.replace(/\s*\([^)]+\)\s*/g, '').trim();
}

/**
 * Normalize text for matching (remove punctuation, extra spaces)
 *
 * @param text - Text to normalize
 * @returns Normalized text for fuzzy matching
 */
export function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if text is a single word (no spaces)
 *
 * @param text - Text to check
 * @returns True if single word
 */
export function isSingleWord(text: string): boolean {
  return !text.trim().includes(' ');
}

/**
 * Count words in text
 *
 * @param text - Text to count
 * @returns Number of words
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Capitalize first letter of each word
 *
 * @param text - Text to capitalize
 * @returns Title-cased text
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
