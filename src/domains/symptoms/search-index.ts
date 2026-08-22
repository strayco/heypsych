/**
 * Symptom Search Index
 *
 * Client-side search over symptom entities using a compact prebuilt index.
 * Designed for privacy (no server calls with user query text) and performance.
 */

import type {
  SymptomEntity,
  SymptomSearchResult,
  SymptomSearchIndexEntry,
  SymptomCategory,
} from "./types";
import { getIndexableSymptoms } from "./registry";

/**
 * Build a compact search index from symptom entities
 * This should be called at build time and the result sent to the client
 */
export function buildSearchIndex(): SymptomSearchIndexEntry[] {
  const symptoms = getIndexableSymptoms();

  return symptoms.map((symptom) => {
    // Combine all searchable text
    const searchableText = [
      symptom.name,
      ...symptom.aliases,
      ...symptom.searchPhrases,
      symptom.shortDefinition,
      // Include example text snippets (first 50 chars each)
      ...symptom.examples.map((ex) => ex.text.slice(0, 50)),
    ]
      .join(" ")
      .toLowerCase();

    return {
      s: symptom.slug,
      n: symptom.name,
      c: symptom.category,
      d: symptom.shortDefinition.slice(0, 120),
      t: searchableText,
    };
  });
}

/**
 * Normalize query text for matching
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize a string into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

/**
 * Calculate match score between query and symptom
 */
function calculateScore(
  query: string,
  entry: SymptomSearchIndexEntry,
  queryTokens: string[]
): { score: number; matchType: SymptomSearchResult["matchType"]; matchedText: string } {
  const normalizedQuery = normalizeQuery(query);
  const normalizedName = entry.n.toLowerCase();

  // Exact name match - highest score
  if (normalizedName === normalizedQuery) {
    return { score: 100, matchType: "canonical", matchedText: entry.n };
  }

  // Name starts with query
  if (normalizedName.startsWith(normalizedQuery)) {
    return { score: 90, matchType: "canonical", matchedText: entry.n };
  }

  // Name contains query
  if (normalizedName.includes(normalizedQuery)) {
    return { score: 80, matchType: "canonical", matchedText: entry.n };
  }

  // Check searchable text for matches
  const searchText = entry.t;

  // Phrase match in searchable text
  if (searchText.includes(normalizedQuery)) {
    // Check if it's an alias match
    const aliasMatch = searchText
      .split(" ")
      .some((word) => word.startsWith(normalizedQuery));

    if (aliasMatch && normalizedQuery.length > 3) {
      return { score: 70, matchType: "alias", matchedText: entry.n };
    }

    return { score: 60, matchType: "phrase", matchedText: entry.n };
  }

  // Token-based matching
  const entryTokens = tokenize(searchText);
  let matchedTokens = 0;
  let partialMatches = 0;

  for (const queryToken of queryTokens) {
    if (queryToken.length < 2) continue;

    // Exact token match
    if (entryTokens.includes(queryToken)) {
      matchedTokens++;
    }
    // Partial token match (prefix)
    else if (entryTokens.some((t) => t.startsWith(queryToken))) {
      partialMatches++;
    }
  }

  if (matchedTokens > 0 || partialMatches > 0) {
    const tokenScore =
      (matchedTokens * 10 + partialMatches * 5) / queryTokens.length;
    return {
      score: Math.min(50, 20 + tokenScore * 5),
      matchType: "keyword",
      matchedText: entry.n,
    };
  }

  return { score: 0, matchType: "keyword", matchedText: "" };
}

/**
 * Search the symptom index
 */
export function searchSymptoms(
  query: string,
  index: SymptomSearchIndexEntry[],
  options: {
    limit?: number;
    categoryFilter?: SymptomCategory;
  } = {}
): SymptomSearchResult[] {
  const { limit = 10, categoryFilter } = options;

  if (!query.trim()) {
    return [];
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const results: SymptomSearchResult[] = [];

  for (const entry of index) {
    // Apply category filter if specified
    if (categoryFilter && entry.c !== categoryFilter) {
      continue;
    }

    const { score, matchType, matchedText } = calculateScore(
      query,
      entry,
      queryTokens
    );

    if (score > 0) {
      results.push({
        slug: entry.s,
        name: entry.n,
        category: entry.c,
        shortDefinition: entry.d,
        matchedText,
        matchType,
        score,
      });
    }
  }

  // Sort by score (descending), then by name (alphabetical)
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });

  return results.slice(0, limit);
}

/**
 * Get suggested search prompts
 * These are example phrases users might search for
 */
export function getSuggestedPrompts(): Array<{ text: string; slug: string }> {
  return [
    { text: "My mind won't slow down", slug: "racing-thoughts" },
    { text: "Nothing feels enjoyable lately", slug: "loss-of-interest" },
    { text: "I can't stay focused", slug: "difficulty-concentrating" },
    { text: "I'm exhausted but can't sleep", slug: "trouble-sleeping" },
    { text: "I feel sad all the time", slug: "low-mood" },
    { text: "I worry about everything", slug: "persistent-worry" },
    { text: "I keep avoiding things", slug: "avoidance" },
    { text: "I snap at everyone", slug: "irritability" },
  ];
}

/**
 * Get category suggestions based on query
 */
export function suggestCategories(
  query: string,
  index: SymptomSearchIndexEntry[]
): SymptomCategory[] {
  const results = searchSymptoms(query, index, { limit: 20 });

  // Count occurrences of each category
  const categoryCounts = new Map<SymptomCategory, number>();

  for (const result of results) {
    const current = categoryCounts.get(result.category) || 0;
    categoryCounts.set(result.category, current + 1);
  }

  // Sort by count and return top categories
  return Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 3);
}

/**
 * Check if a query might indicate crisis/safety concerns
 * This does NOT transmit the query - it's a local check
 */
export function checkForSafetyKeywords(query: string): boolean {
  const safetyTerms = [
    "suicide",
    "suicidal",
    "kill myself",
    "end my life",
    "want to die",
    "hurt myself",
    "self-harm",
    "self harm",
    "cutting",
    "overdose",
    "no reason to live",
    "better off dead",
    "harm others",
    "hurt someone",
    "voices telling me",
    "can't go on",
    "ending it",
  ];

  const normalizedQuery = normalizeQuery(query);

  return safetyTerms.some(
    (term) =>
      normalizedQuery.includes(term) ||
      normalizedQuery.includes(term.replace(/-/g, " "))
  );
}

/**
 * Pregenerate the search index for static export
 */
export function getPrebuiltSearchIndex(): SymptomSearchIndexEntry[] {
  return buildSearchIndex();
}
