/**
 * Blacklist Filter
 *
 * Filters out generic words and phrases that should not be automatically linked.
 * Loads configuration from JSON file for easy content team updates.
 */

import blacklistsData from '../../../../data/linking-config/blacklists.json';

/**
 * Blacklist configuration loaded from JSON
 */
export const BLACKLISTS = {
  genericWords: new Set(blacklistsData.genericWords),
  genericPhrases: new Set(blacklistsData.genericPhrases),
  drugFormulations: new Set(blacklistsData.drugFormulations.map(f => f.toLowerCase())),
  drugClasses: new Set(blacklistsData.drugClasses.map(c => c.toLowerCase())),
};

/**
 * Check if text is a generic word that should not be linked
 *
 * @param text - Text to check
 * @returns True if text is blacklisted
 */
export function isGenericWord(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return BLACKLISTS.genericWords.has(lower);
}

/**
 * Check if text is a generic phrase that should not be linked
 *
 * @param text - Text to check
 * @returns True if text is a blacklisted phrase
 */
export function isGenericPhrase(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return BLACKLISTS.genericPhrases.has(lower);
}

/**
 * Check if text is a drug formulation (not a specific drug name)
 *
 * @param text - Text to check
 * @returns True if text is a drug formulation
 */
export function isDrugFormulation(text: string): boolean {
  const lower = text.toLowerCase().trim();

  // Check exact matches
  if (BLACKLISTS.drugFormulations.has(lower)) {
    return true;
  }

  // Check if text starts with a formulation pattern
  for (const formulation of BLACKLISTS.drugFormulations) {
    if (lower === formulation || lower.startsWith(formulation + ' ')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text is a drug class (not a specific drug)
 *
 * @param text - Text to check
 * @returns True if text is a drug class
 */
export function isDrugClass(text: string): boolean {
  const lower = text.toLowerCase().trim();

  // Check exact matches
  if (BLACKLISTS.drugClasses.has(lower)) {
    return true;
  }

  // Check if text starts with a class name
  for (const className of BLACKLISTS.drugClasses) {
    if (lower === className || lower.startsWith(className + ' ')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text should be blacklisted from linking
 *
 * Combines all blacklist checks with word count logic
 *
 * @param text - Text to check
 * @returns True if text should NOT be linked
 */
export function isBlacklisted(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;

  // Single words: check generic word blacklist
  if (wordCount === 1 && isGenericWord(lower)) {
    return true;
  }

  // Two-word phrases: check generic phrases
  if (wordCount === 2 && isGenericPhrase(lower)) {
    return true;
  }

  // Check drug formulations and classes
  if (isDrugFormulation(lower) || isDrugClass(lower)) {
    return true;
  }

  return false;
}

/**
 * Filter array of entity names, removing blacklisted terms
 *
 * @param names - Array of entity names
 * @returns Filtered array
 */
export function filterBlacklisted(names: string[]): string[] {
  return names.filter(name => !isBlacklisted(name));
}

/**
 * Get blacklist statistics
 *
 * @returns Blacklist stats
 */
export function getBlacklistStats() {
  return {
    version: blacklistsData.version,
    lastUpdated: blacklistsData.lastUpdated,
    updatedBy: blacklistsData.updatedBy,
    counts: {
      genericWords: BLACKLISTS.genericWords.size,
      genericPhrases: BLACKLISTS.genericPhrases.size,
      drugFormulations: BLACKLISTS.drugFormulations.size,
      drugClasses: BLACKLISTS.drugClasses.size,
      total:
        BLACKLISTS.genericWords.size +
        BLACKLISTS.genericPhrases.size +
        BLACKLISTS.drugFormulations.size +
        BLACKLISTS.drugClasses.size,
    },
  };
}
