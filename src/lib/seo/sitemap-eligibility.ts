/**
 * SITEMAP ELIGIBILITY ENFORCEMENT
 *
 * A sitemap is a set of index requests. Submitting a URL that carries a
 * `noindex` directive is a direct contradiction: it asks Google to index a page
 * that the page itself refuses to be indexed. This module makes the central
 * indexation firewall (`index-decision-service`) the single gate that every
 * sitemap route must pass entities through.
 *
 * It also returns counts and exclusion reasons so a sitemap can never silently
 * ship zero (or the wrong) URLs. Routes surface these as `X-Sitemap-*` headers,
 * which gives tests and production monitoring an assertable signal.
 *
 * @see src/lib/seo/index-decision-service.ts - the decision engine
 */

import type { Entity } from '@/lib/types/database';
import { makeEntityIndexDecision } from './index-decision-service';

export interface SitemapEligibilityReport<T> {
  /** Entities that passed the firewall and belong in the sitemap */
  eligible: T[];
  /** How many entities were considered */
  expected: number;
  /** How many passed */
  included: number;
  /** How many were filtered out */
  excluded: number;
  /** Exclusion reason -> count, for diagnosis */
  exclusionReasons: Record<string, number>;
  /**
   * True when a non-empty input produced zero eligible URLs.
   *
   * Entity records reaching a sitemap route come from the database, while the
   * page that renders `robots` builds its entity from local JSON. When those
   * shapes diverge, the firewall can reject every candidate even though the
   * pages themselves render as indexable - which would silently delete an
   * entire cohort from discovery. That is a data-plumbing failure, not a
   * finding that nothing deserves indexation, so callers must handle it
   * explicitly rather than shipping an empty sitemap.
   */
  anomalousTotalExclusion: boolean;
}

/**
 * Filter entities down to those the indexation firewall considers
 * sitemap-eligible, recording why each exclusion happened.
 *
 * @param entities Candidate entities
 * @param pathFor Maps an entity to its canonical path (e.g. `/conditions/gad`)
 */
export function filterEntitiesForSitemapWithReport<T extends Entity>(
  entities: T[],
  pathFor: (entity: T) => string,
  /**
   * Optionally supply the entity the *page* renders, when it differs from the
   * one being emitted. Sitemap rows often come from the database while the page
   * builds its entity from local JSON; judging the database projection then
   * answers a question about a document the crawler will never see. Emission
   * still uses the original entity, which carries real timestamps.
   */
  decisionEntityFor?: (entity: T) => Entity
): SitemapEligibilityReport<T> {
  const eligible: T[] = [];
  const exclusionReasons: Record<string, number> = {};

  for (const entity of entities) {
    let decision;
    try {
      decision = makeEntityIndexDecision(
        decisionEntityFor ? decisionEntityFor(entity) : entity,
        pathFor(entity)
      );
    } catch (error) {
      // A decision that cannot be computed is not an implicit pass.
      const reason = `decision-error: ${error instanceof Error ? error.message : String(error)}`;
      exclusionReasons[reason] = (exclusionReasons[reason] ?? 0) + 1;
      continue;
    }

    if (decision.sitemapEligible) {
      eligible.push(entity);
      continue;
    }

    const reason = decision.reasons[0] ?? `cohort: ${decision.cohort}`;
    // Collapse per-entity numbers (word counts etc.) so reasons aggregate.
    const normalized = reason.replace(/\d+/g, 'N');
    exclusionReasons[normalized] = (exclusionReasons[normalized] ?? 0) + 1;
  }

  return {
    eligible,
    expected: entities.length,
    included: eligible.length,
    excluded: entities.length - eligible.length,
    exclusionReasons,
    anomalousTotalExclusion: entities.length > 0 && eligible.length === 0,
  };
}

/**
 * Choose the URLs a sitemap should actually emit.
 *
 * Normally this is the filtered set. If the filter rejected everything, the
 * inputs are untrustworthy, so the unfiltered set is emitted instead and the
 * anomaly is logged loudly - preserving discovery while making the failure
 * impossible to miss. Never silently ship an empty cohort.
 */
export function resolveSitemapEntities<T extends Entity>(
  label: string,
  report: SitemapEligibilityReport<T>,
  candidates: T[]
): T[] {
  if (!report.anomalousTotalExclusion) {
    return report.eligible;
  }

  console.error(
    `[Sitemap] ANOMALY: ${label} filter excluded all ${report.expected} candidates. ` +
      `This indicates the entity shape reaching the sitemap does not match the one ` +
      `the page uses to render robots meta. Emitting the unfiltered set to preserve ` +
      `discovery. Top reasons: ${
        Object.entries(report.exclusionReasons)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([reason, count]) => `${count}x ${reason}`)
          .join('; ') || 'none recorded'
      }`
  );

  return candidates;
}

/**
 * Build the `X-Sitemap-*` headers that expose a filter result to tests,
 * crawlers, and production monitoring.
 */
export function sitemapReportHeaders<T>(
  report: SitemapEligibilityReport<T>,
  source: string
): Record<string, string> {
  return {
    'X-Sitemap-Source': source,
    'X-Sitemap-Expected': String(report.expected),
    'X-Sitemap-Included': String(report.included),
    'X-Sitemap-Excluded': String(report.excluded),
    ...(report.anomalousTotalExclusion
      ? { 'X-Sitemap-Anomaly': 'all-candidates-excluded' }
      : {}),
  };
}

/**
 * Log a one-line summary of a sitemap filter decision, including the top
 * exclusion reasons, so build and runtime logs explain their own output.
 */
export function logSitemapReport<T>(
  label: string,
  report: SitemapEligibilityReport<T>,
  source: string
): void {
  const topReasons = Object.entries(report.exclusionReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => `${count}x ${reason}`)
    .join('; ');

  console.log(
    `[Sitemap] ${label} (${source}): expected=${report.expected} ` +
      `included=${report.included} excluded=${report.excluded}` +
      (topReasons ? ` | top exclusions: ${topReasons}` : '')
  );
}
