import { useMemo } from "react";

interface Hotline {
  id: string;
  name: string;
  summary: string;
  labels: {
    focus?: string[];
    audience?: string[];
  };
  taxonomy: {
    topics?: string[];
    conditions?: string[];
    identities?: string[];
  };
  search: {
    keywords?: string[];
    aka?: string[];
  };
}

interface SearchResult<T> {
  item: T;
  score: number;
  matchType: "exact" | "prefix" | "keyword" | "fuzzy";
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching with typo tolerance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalize string by removing diacritics and converting to lowercase
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Check if a string matches the query with typo tolerance
 */
function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);

  // Exact match
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // Check if query words match with typo tolerance
  const maxDistance = query.length <= 5 ? 1 : 2;
  const words = normalizedText.split(/\s+/);

  for (const word of words) {
    const distance = levenshteinDistance(word, normalizedQuery);
    if (distance <= maxDistance) {
      return true;
    }
  }

  return false;
}

/**
 * Score a match based on match type and position
 */
function scoreMatch(text: string, query: string): SearchResult<never>["score"] {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);

  // Exact match
  if (normalizedText === normalizedQuery) {
    return 100;
  }

  // Prefix match
  if (normalizedText.startsWith(normalizedQuery)) {
    return 90;
  }

  // Contains match
  if (normalizedText.includes(normalizedQuery)) {
    // Score based on position (earlier is better)
    const position = normalizedText.indexOf(normalizedQuery);
    return 80 - (position / normalizedText.length) * 20;
  }

  // Fuzzy match
  const maxDistance = query.length <= 5 ? 1 : 2;
  const words = normalizedText.split(/\s+/);

  for (const word of words) {
    const distance = levenshteinDistance(word, normalizedQuery);
    if (distance <= maxDistance) {
      return 50 - distance * 10;
    }
  }

  return 0;
}

/**
 * Custom hook for fuzzy searching hotlines with typo tolerance
 * Supports ranking: exact > prefix > keyword/tag > summary fuzzy
 */
export function useFuzzySearch<T extends Hotline>(items: T[], query: string): T[] {
  return useMemo(() => {
    if (!query || query.trim().length === 0) {
      return items;
    }

    const trimmedQuery = query.trim();
    const results: SearchResult<T>[] = [];

    for (const item of items) {
      let bestScore = 0;
      let matchType: SearchResult<T>["matchType"] = "fuzzy";

      // Build searchable text arrays
      const nameText = item.name;
      const summaryText = item.summary;
      const focusTexts = item.labels.focus || [];
      const audienceTexts = item.labels.audience || [];
      const topicTexts = item.taxonomy.topics || [];
      const conditionTexts = item.taxonomy.conditions || [];
      const identityTexts = item.taxonomy.identities || [];
      const keywordTexts = item.search.keywords || [];
      const akaTexts = item.search.aka || [];

      // Score name (highest priority)
      const nameScore = scoreMatch(nameText, trimmedQuery);
      if (nameScore > bestScore) {
        bestScore = nameScore;
        matchType = nameScore >= 90 ? "exact" : nameScore >= 60 ? "prefix" : "fuzzy";
      }

      // Score AKA (aliases)
      for (const aka of akaTexts) {
        const score = scoreMatch(aka, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = score >= 90 ? "exact" : score >= 60 ? "prefix" : "keyword";
        }
      }

      // Score focus tags (high priority)
      for (const focus of focusTexts) {
        const score = scoreMatch(focus, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = score >= 80 ? "keyword" : "fuzzy";
        }
      }

      // Score keywords
      for (const keyword of keywordTexts) {
        const score = scoreMatch(keyword, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = "keyword";
        }
      }

      // Score identities
      for (const identity of identityTexts) {
        const score = scoreMatch(identity, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = "keyword";
        }
      }

      // Score audience
      for (const audience of audienceTexts) {
        const score = scoreMatch(audience, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = "keyword";
        }
      }

      // Score topics
      for (const topic of topicTexts) {
        const score = scoreMatch(topic, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = "keyword";
        }
      }

      // Score conditions
      for (const condition of conditionTexts) {
        const score = scoreMatch(condition, trimmedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchType = "keyword";
        }
      }

      // Score summary (lowest priority, fuzzy only)
      if (fuzzyMatch(summaryText, trimmedQuery)) {
        const score = Math.max(30, bestScore);
        if (score > bestScore) {
          bestScore = score;
          matchType = "fuzzy";
        }
      }

      // Add to results if we have a match
      if (bestScore > 0) {
        results.push({
          item,
          score: bestScore,
          matchType,
        });
      }
    }

    // Sort by score (highest first), then by name
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.item.name.localeCompare(b.item.name);
    });

    return results.map((r) => r.item);
  }, [items, query]);
}
