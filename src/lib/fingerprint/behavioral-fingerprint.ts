/**
 * Behavioral Fingerprint System
 *
 * Captures implicit user signals without requiring explicit input.
 * Stores in localStorage and aggregates for personalization.
 *
 * Privacy: All data is stored locally. Only aggregated, anonymized
 * data is sent to server for analytics.
 */

import type { PracticeType, PracticeSizeBucket } from "@/domains/architect/schemas/fingerprint";

// ============================================================================
// TYPES
// ============================================================================

export interface ProductInteraction {
  slug: string;
  category: string;
  timestamp: number;
  action: "view" | "compare" | "shortlist" | "reject" | "demo_request";
  timeOnPage?: number;        // seconds
  scrollDepth?: number;       // 0-100%
}

export interface SearchInteraction {
  query: string;
  timestamp: number;
  resultsClicked: string[];   // product slugs clicked from this search
}

export interface CapabilityInteraction {
  capabilityId: string;
  timestamp: number;
  source: "filter" | "architect" | "category";
}

export interface BehavioralFingerprint {
  // Session info
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  sessionCount: number;

  // Product interactions
  productsViewed: ProductInteraction[];
  productsCompared: string[];       // slugs
  productsShortlisted: string[];    // slugs
  productsRejected: string[];       // slugs
  demoRequests: string[];           // slugs

  // Search behavior
  searches: SearchInteraction[];

  // Capability interests
  capabilityInterests: CapabilityInteraction[];

  // Category interests (weighted by recency and engagement)
  categoryInterests: Record<string, number>;

  // Inferred attributes
  inferred: {
    practiceType?: PracticeType;
    practiceSize?: PracticeSizeBucket;
    priceRange?: "budget" | "mid-market" | "premium" | "enterprise";
    urgency?: "exploring" | "evaluating" | "deciding" | "buying";
    sophistication?: "new" | "experienced" | "expert";
    primaryNeed?: string;           // most interested capability
    switchingIntent?: boolean;
    switchingFrom?: string;         // product slug if detected
  };

  // Explicit overrides (from questionnaire or profile)
  explicit?: {
    practiceType?: PracticeType;
    practiceSize?: PracticeSizeBucket;
    email?: string;
    hasAccount?: boolean;
  };
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY = "heypsych_behavioral_fingerprint";
const SESSION_KEY = "heypsych_session_id";

// ============================================================================
// HELPERS
// ============================================================================

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// ============================================================================
// FINGERPRINT MANAGER
// ============================================================================

class BehavioralFingerprintManager {
  private fingerprint: BehavioralFingerprint | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize or load existing fingerprint
   */
  initialize(): BehavioralFingerprint {
    if (typeof window === "undefined") {
      return this.createEmptyFingerprint();
    }

    // Try to load existing
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.fingerprint = JSON.parse(stored);
        // Update session info
        this.fingerprint!.lastSeen = Date.now();
        this.fingerprint!.sessionCount += 1;
        this.fingerprint!.sessionId = getOrCreateSessionId();
        this.debouncedSave();
        return this.fingerprint!;
      } catch {
        // Corrupted data, start fresh
      }
    }

    // Create new
    this.fingerprint = this.createEmptyFingerprint();
    this.save();
    return this.fingerprint;
  }

  /**
   * Create empty fingerprint
   */
  private createEmptyFingerprint(): BehavioralFingerprint {
    const now = Date.now();
    return {
      sessionId: getOrCreateSessionId(),
      firstSeen: now,
      lastSeen: now,
      sessionCount: 1,
      productsViewed: [],
      productsCompared: [],
      productsShortlisted: [],
      productsRejected: [],
      demoRequests: [],
      searches: [],
      capabilityInterests: [],
      categoryInterests: {},
      inferred: {},
    };
  }

  /**
   * Get current fingerprint
   */
  get(): BehavioralFingerprint {
    if (!this.fingerprint) {
      return this.initialize();
    }
    return this.fingerprint;
  }

  /**
   * Track product view
   */
  trackProductView(slug: string, category: string, timeOnPage?: number, scrollDepth?: number) {
    const fp = this.get();

    // Add to viewed list (cap at 100 most recent)
    fp.productsViewed = [
      {
        slug,
        category,
        timestamp: Date.now(),
        action: "view",
        timeOnPage,
        scrollDepth,
      },
      ...fp.productsViewed.slice(0, 99),
    ];

    // Update category interest
    fp.categoryInterests[category] = (fp.categoryInterests[category] || 0) + 1;

    // Update inferences
    this.updateInferences();
    this.debouncedSave();
  }

  /**
   * Track comparison
   */
  trackComparison(slugs: string[]) {
    const fp = this.get();

    // Add to compared (unique)
    const newCompared = new Set([...fp.productsCompared, ...slugs]);
    fp.productsCompared = Array.from(newCompared).slice(0, 50);

    // Track as interactions
    for (const slug of slugs) {
      fp.productsViewed.unshift({
        slug,
        category: this.getCategoryForSlug(slug) || "unknown",
        timestamp: Date.now(),
        action: "compare",
      });
    }

    // Signal: comparing = evaluating stage
    if (!fp.inferred.urgency || fp.inferred.urgency === "exploring") {
      fp.inferred.urgency = "evaluating";
    }

    this.updateInferences();
    this.debouncedSave();
  }

  /**
   * Track shortlist (user saved or favorited)
   */
  trackShortlist(slug: string) {
    const fp = this.get();

    if (!fp.productsShortlisted.includes(slug)) {
      fp.productsShortlisted.push(slug);
    }

    // Signal: shortlisting = deciding stage
    fp.inferred.urgency = "deciding";

    this.debouncedSave();
  }

  /**
   * Track rejection (user explicitly dismissed)
   */
  trackRejection(slug: string) {
    const fp = this.get();

    if (!fp.productsRejected.includes(slug)) {
      fp.productsRejected.push(slug);
    }

    // Remove from shortlist if present
    fp.productsShortlisted = fp.productsShortlisted.filter(s => s !== slug);

    this.debouncedSave();
  }

  /**
   * Track demo request
   */
  trackDemoRequest(slug: string) {
    const fp = this.get();

    if (!fp.demoRequests.includes(slug)) {
      fp.demoRequests.push(slug);
    }

    // Signal: demo request = buying stage
    fp.inferred.urgency = "buying";

    this.debouncedSave();
  }

  /**
   * Track search
   */
  trackSearch(query: string) {
    const fp = this.get();

    fp.searches.unshift({
      query,
      timestamp: Date.now(),
      resultsClicked: [],
    });

    // Cap at 50 searches
    fp.searches = fp.searches.slice(0, 50);

    // Check for switching intent signals
    const switchingSignals = [
      "alternative",
      "alternatives",
      "switch",
      "replace",
      "migrate",
      "instead of",
      "vs",
      "versus",
      "compare",
    ];

    const lowerQuery = query.toLowerCase();
    if (switchingSignals.some(signal => lowerQuery.includes(signal))) {
      fp.inferred.switchingIntent = true;
    }

    this.debouncedSave();
  }

  /**
   * Track search result click
   */
  trackSearchResultClick(query: string, clickedSlug: string) {
    const fp = this.get();

    const search = fp.searches.find(s => s.query === query);
    if (search && !search.resultsClicked.includes(clickedSlug)) {
      search.resultsClicked.push(clickedSlug);
    }

    this.debouncedSave();
  }

  /**
   * Track capability interest
   */
  trackCapabilityInterest(capabilityId: string, source: "filter" | "architect" | "category") {
    const fp = this.get();

    fp.capabilityInterests.unshift({
      capabilityId,
      timestamp: Date.now(),
      source,
    });

    // Cap at 100
    fp.capabilityInterests = fp.capabilityInterests.slice(0, 100);

    this.updateInferences();
    this.debouncedSave();
  }

  /**
   * Track alternatives page view (strong switching signal)
   */
  trackAlternativesPageView(productSlug: string) {
    const fp = this.get();

    fp.inferred.switchingIntent = true;
    fp.inferred.switchingFrom = productSlug;
    fp.inferred.urgency = "evaluating";

    this.debouncedSave();
  }

  /**
   * Set explicit user data (from questionnaire)
   */
  setExplicitData(data: BehavioralFingerprint["explicit"]) {
    const fp = this.get();
    fp.explicit = { ...fp.explicit, ...data };
    this.debouncedSave();
  }

  /**
   * Get category for a product slug (from recent views)
   */
  private getCategoryForSlug(slug: string): string | undefined {
    const fp = this.get();
    const interaction = fp.productsViewed.find(p => p.slug === slug);
    return interaction?.category;
  }

  /**
   * Update inferences based on behavior
   */
  private updateInferences() {
    const fp = this.get();

    // Infer primary category interest
    const categoryScores = Object.entries(fp.categoryInterests)
      .sort(([, a], [, b]) => b - a);

    if (categoryScores.length > 0) {
      // Map category to primary need
      const [topCategory] = categoryScores[0];
      fp.inferred.primaryNeed = topCategory;
    }

    // Infer practice size from price range behavior
    const viewedProducts = fp.productsViewed.slice(0, 20);
    // This would need product data - simplified for now

    // Infer sophistication from behavior
    if (fp.sessionCount > 5 && fp.productsViewed.length > 20) {
      fp.inferred.sophistication = "experienced";
    } else if (fp.sessionCount > 10 && fp.productsCompared.length > 10) {
      fp.inferred.sophistication = "expert";
    } else {
      fp.inferred.sophistication = "new";
    }

    // Infer urgency from recency and intensity
    const recentViews = fp.productsViewed.filter(
      p => Date.now() - p.timestamp < 7 * 24 * 60 * 60 * 1000 // 7 days
    );

    if (fp.demoRequests.length > 0) {
      fp.inferred.urgency = "buying";
    } else if (fp.productsShortlisted.length > 2 || fp.productsCompared.length > 4) {
      fp.inferred.urgency = "deciding";
    } else if (recentViews.length > 5 || fp.productsCompared.length > 0) {
      fp.inferred.urgency = "evaluating";
    } else {
      fp.inferred.urgency = "exploring";
    }
  }

  /**
   * Debounced save to localStorage
   */
  private debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.save(), 500);
  }

  /**
   * Save to localStorage
   */
  private save() {
    if (typeof window === "undefined" || !this.fingerprint) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.fingerprint));
    } catch (e) {
      // Storage full or disabled - fail silently
      console.warn("Failed to save behavioral fingerprint:", e);
    }
  }

  /**
   * Clear fingerprint (for privacy/testing)
   */
  clear() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(STORAGE_KEY);
    this.fingerprint = null;
  }

  /**
   * Export fingerprint for analytics (anonymized)
   */
  exportForAnalytics(): object {
    const fp = this.get();

    return {
      sessionCount: fp.sessionCount,
      daysSinceFirst: Math.floor((Date.now() - fp.firstSeen) / (24 * 60 * 60 * 1000)),
      productsViewedCount: fp.productsViewed.length,
      productsComparedCount: fp.productsCompared.length,
      productsShortlistedCount: fp.productsShortlisted.length,
      demoRequestsCount: fp.demoRequests.length,
      searchesCount: fp.searches.length,
      topCategories: Object.entries(fp.categoryInterests)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat),
      inferred: fp.inferred,
      hasExplicitData: !!fp.explicit,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const behavioralFingerprint = new BehavioralFingerprintManager();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useState, useCallback } from "react";

export function useBehavioralFingerprint() {
  const [fingerprint, setFingerprint] = useState<BehavioralFingerprint | null>(null);

  useEffect(() => {
    setFingerprint(behavioralFingerprint.initialize());
  }, []);

  const trackProductView = useCallback((slug: string, category: string) => {
    behavioralFingerprint.trackProductView(slug, category);
    setFingerprint({ ...behavioralFingerprint.get() });
  }, []);

  const trackComparison = useCallback((slugs: string[]) => {
    behavioralFingerprint.trackComparison(slugs);
    setFingerprint({ ...behavioralFingerprint.get() });
  }, []);

  const trackDemoRequest = useCallback((slug: string) => {
    behavioralFingerprint.trackDemoRequest(slug);
    setFingerprint({ ...behavioralFingerprint.get() });
  }, []);

  const trackSearch = useCallback((query: string) => {
    behavioralFingerprint.trackSearch(query);
    setFingerprint({ ...behavioralFingerprint.get() });
  }, []);

  return {
    fingerprint,
    trackProductView,
    trackComparison,
    trackDemoRequest,
    trackSearch,
    inferred: fingerprint?.inferred || {},
    isReturningUser: (fingerprint?.sessionCount || 0) > 1,
    hasShortlist: (fingerprint?.productsShortlisted.length || 0) > 0,
    urgency: fingerprint?.inferred.urgency || "exploring",
  };
}
