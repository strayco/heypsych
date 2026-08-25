// src/lib/seo/__tests__/sitemap-eligibility.test.ts
// Regression tests for the sitemap/indexability contradiction.
//
// Production evidence (2026-08-25): 35/35 sampled /conditions/* URLs and
// 20/25 sampled /resources/* URLs listed in the XML sitemaps rendered
// `<meta name="robots" content="noindex, follow">`. The sitemap routes queried
// the database and emitted every `status === "active"` entity without ever
// consulting the central indexation firewall.

import { describe, it, expect } from "vitest";
import type { Entity } from "@/lib/types/database";
import {
  filterEntitiesForSitemapWithReport,
  resolveSitemapEntities,
  sitemapReportHeaders,
} from "../sitemap-eligibility";
import { makeEntityIndexDecision } from "../index-decision-service";

/**
 * Build an entity that passes the firewall's quality gates for /conditions.
 * Conditions require ~800 words and 70% clinical completeness.
 */
function createIndexableCondition(slug: string): Entity {
  const paragraph = "clinically meaningful content ".repeat(200);

  return {
    id: slug,
    slug,
    name: `Condition ${slug}`,
    type: "condition",
    schema_id: "condition-v1",
    status: "active",
    visibility: "public",
    description: paragraph,
    data: {
      content: {
        symptoms: { core: ["symptom a", "symptom b"] },
        causes: ["cause a"],
        diagnosis: "diagnostic criteria",
        treatment_approaches: "evidence-based approaches",
        prognosis: "prognosis detail",
        overview: paragraph,
      },
    },
    metadata: {
      dsm5_code: "F41.1",
      references: [
        { title: "Reference A", doi: "10.1000/a" },
        { title: "Reference B", doi: "10.1000/b" },
      ],
    },
  } as unknown as Entity;
}

/** A thin entity - the shape that was being submitted to Google as indexable. */
function createThinCondition(slug: string): Entity {
  return {
    id: slug,
    slug,
    name: `Condition ${slug}`,
    type: "condition",
    schema_id: "condition-v1",
    status: "active",
    visibility: "public",
    description: "Short stub.",
    data: {},
    metadata: {},
  } as unknown as Entity;
}

describe("filterEntitiesForSitemapWithReport", () => {
  it("excludes entities the indexation firewall marks noindex", () => {
    const thin = createThinCondition("thin-condition");

    // Precondition: the firewall really does refuse to index this entity.
    const decision = makeEntityIndexDecision(thin, "/conditions/thin-condition");
    expect(decision.indexable).toBe(false);
    expect(decision.sitemapEligible).toBe(false);

    const report = filterEntitiesForSitemapWithReport(
      [thin],
      (e) => `/conditions/${e.slug}`
    );

    expect(report.included).toBe(0);
    expect(report.excluded).toBe(1);
    expect(report.eligible).toEqual([]);
  });

  it("never emits a URL whose page would render noindex", () => {
    const entities = [
      createThinCondition("thin-a"),
      createThinCondition("thin-b"),
      createIndexableCondition("rich-a"),
    ];

    const report = filterEntitiesForSitemapWithReport(
      entities,
      (e) => `/conditions/${e.slug}`
    );

    // The core invariant: everything that survives the filter is indexable.
    for (const entity of report.eligible) {
      const decision = makeEntityIndexDecision(entity, `/conditions/${entity.slug}`);
      expect(decision.indexable).toBe(true);
    }
  });

  it("reports expected, included and excluded counts that reconcile", () => {
    const entities = [
      createThinCondition("thin-a"),
      createThinCondition("thin-b"),
      createIndexableCondition("rich-a"),
    ];

    const report = filterEntitiesForSitemapWithReport(
      entities,
      (e) => `/conditions/${e.slug}`
    );

    expect(report.expected).toBe(3);
    expect(report.included + report.excluded).toBe(report.expected);
    expect(report.included).toBe(report.eligible.length);
  });

  it("records a reason for every exclusion", () => {
    const report = filterEntitiesForSitemapWithReport(
      [createThinCondition("thin-a")],
      (e) => `/conditions/${e.slug}`
    );

    const totalReasonCount = Object.values(report.exclusionReasons).reduce(
      (sum, n) => sum + n,
      0
    );
    expect(totalReasonCount).toBe(report.excluded);
  });

  it("treats an entity whose decision throws as excluded, not as a pass", () => {
    const report = filterEntitiesForSitemapWithReport(
      [createThinCondition("thin-a")],
      () => {
        throw new Error("path resolution failed");
      }
    );

    expect(report.included).toBe(0);
    expect(report.excluded).toBe(1);
    expect(Object.keys(report.exclusionReasons).join()).toContain("decision-error");
  });

  it("handles an empty input without inventing eligibility", () => {
    const report = filterEntitiesForSitemapWithReport(
      [],
      (e: Entity) => `/conditions/${e.slug}`
    );

    expect(report.expected).toBe(0);
    expect(report.included).toBe(0);
    expect(report.eligible).toEqual([]);
  });
});

describe("resolveSitemapEntities (total-exclusion safety valve)", () => {
  it("flags a non-empty cohort that was entirely excluded", () => {
    const candidates = [
      createThinCondition("thin-a"),
      createThinCondition("thin-b"),
    ];
    const report = filterEntitiesForSitemapWithReport(
      candidates,
      (e) => `/conditions/${e.slug}`
    );

    expect(report.anomalousTotalExclusion).toBe(true);
  });

  it("preserves discovery instead of shipping an empty cohort", () => {
    const candidates = [
      createThinCondition("thin-a"),
      createThinCondition("thin-b"),
    ];
    const report = filterEntitiesForSitemapWithReport(
      candidates,
      (e) => `/conditions/${e.slug}`
    );

    // A cohort where every candidate was rejected signals a data-shape problem,
    // not a genuine "nothing is indexable" result.
    expect(resolveSitemapEntities("conditions", report, candidates)).toEqual(
      candidates
    );
  });

  it("uses the filtered set when the filter behaved plausibly", () => {
    const candidates = [
      createThinCondition("thin-a"),
      createIndexableCondition("rich-a"),
    ];
    const report = filterEntitiesForSitemapWithReport(
      candidates,
      (e) => `/conditions/${e.slug}`
    );

    expect(report.anomalousTotalExclusion).toBe(false);
    expect(resolveSitemapEntities("conditions", report, candidates)).toEqual(
      report.eligible
    );
  });

  it("does not flag an empty input as anomalous", () => {
    const report = filterEntitiesForSitemapWithReport(
      [],
      (e: Entity) => `/conditions/${e.slug}`
    );

    expect(report.anomalousTotalExclusion).toBe(false);
    expect(resolveSitemapEntities("conditions", report, [])).toEqual([]);
  });
});

describe("sitemapReportHeaders", () => {
  it("exposes counts so a silently empty sitemap is detectable", () => {
    const report = filterEntitiesForSitemapWithReport(
      [createThinCondition("thin-a"), createIndexableCondition("rich-a")],
      (e) => `/conditions/${e.slug}`
    );

    const headers = sitemapReportHeaders(report, "database");

    expect(headers["X-Sitemap-Source"]).toBe("database");
    expect(headers["X-Sitemap-Expected"]).toBe("2");
    expect(Number(headers["X-Sitemap-Included"])).toBe(report.included);
    expect(Number(headers["X-Sitemap-Excluded"])).toBe(report.excluded);
  });
});
