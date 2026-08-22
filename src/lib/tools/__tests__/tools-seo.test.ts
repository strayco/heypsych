/**
 * Tools SEO Integration Tests
 *
 * Tests for SEO control plane integration:
 * - Tool indexability decisions
 * - Sitemap eligibility
 * - Search page noindex behavior
 * - Canonical URL consistency
 * - Sponsorship isolation from indexation
 */
import { describe, it, expect } from "vitest";
import {
  makeToolIndexDecision,
  makeToolSearchIndexDecision,
  isToolSitemapEligible,
  getToolCanonicalUrl,
  getToolSearchCanonicalUrl,
  getToolRobotsMeta,
  getToolSearchRobotsMeta,
  verifySponsorshipIsolation,
} from "../tools-seo";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

// Mock tool for testing
const createMockTool = (overrides: Partial<DigitalToolV3> = {}): DigitalToolV3 => ({
  schema_version: "3.0",
  kind: "tool",
  slug: "test-tool",
  name: "Test Tool",
  one_liner: "A test tool for mental health",
  best_for: ["anxiety", "depression"],
  not_for: ["crisis situations"],
  support_level: "self-help",
  short_description: "A comprehensive test tool for mental health management",
  long_description: "This is a longer description that provides more detail about the tool. It should be at least 100 characters to pass validation requirements. This tool helps users manage their mental health through various features and evidence-based approaches.",
  primary_hubs: ["anxiety-stress"],
  conditions: ["anxiety"],
  tool_types: ["app"],
  ai_attributes: ["no-ai"],
  platforms: {
    ios: true,
    android: true,
    web: true,
    desktop: false,
    wearable: false,
  },
  pricing: {
    model: "freemium",
    free_tier: true,
  },
  privacy: {
    grade: "B",
    hipaa_compliant: false,
    gdpr_compliant: true,
    data_sold: false,
  },
  seo: {
    title: "Test Tool - Mental Health App",
    meta_description: "A comprehensive mental health app for managing anxiety and depression.",
    canonical_url: "https://heypsych.com/tools/test-tool/",
    faqs: [
      { q: "What is Test Tool?", a: "Test Tool is a mental health app for anxiety and depression." },
      { q: "Is Test Tool free?", a: "Test Tool offers a free tier with optional premium features." },
      { q: "Is Test Tool evidence-based?", a: "Test Tool uses evidence-based approaches." },
    ],
  },
  governance: {
    reviewed_by_label: "Reviewed by HeyPsych Board",
    reviewed_by_url: "https://heypsych.com/about/medical-review-board",
    last_reviewed: "2024-01-15",
  },
  status: "active",
  ...overrides,
});

describe("Tool Index Decisions", () => {
  it("active tool with sufficient content is indexable", () => {
    const tool = createMockTool();
    const decision = makeToolIndexDecision(tool);

    expect(decision.indexable).toBe(true);
    expect(decision.sitemapEligible).toBe(true);
    expect(decision.cohort).toBe("indexable_pilot");
  });

  it("archived tool is not indexable", () => {
    const tool = createMockTool({ status: "archived" });
    const decision = makeToolIndexDecision(tool);

    expect(decision.indexable).toBe(false);
    expect(decision.sitemapEligible).toBe(false);
    expect(decision.cohort).toBe("retired");
  });

  it("draft tool is not indexable", () => {
    const tool = createMockTool({ status: "draft" });
    const decision = makeToolIndexDecision(tool);

    expect(decision.indexable).toBe(false);
    expect(decision.sitemapEligible).toBe(false);
  });

  it("tool with short description is not indexable", () => {
    const tool = createMockTool({ long_description: "Too short" });
    const decision = makeToolIndexDecision(tool);

    expect(decision.indexable).toBe(false);
    expect(decision.sitemapEligible).toBe(false);
    expect(decision.reasons).toContainEqual(
      expect.stringContaining("Description length")
    );
  });

  it("tool with insufficient FAQs is not indexable", () => {
    const tool = createMockTool({
      seo: {
        title: "Test",
        meta_description: "Test description",
        canonical_url: "https://heypsych.com/tools/test-tool/",
        faqs: [{ q: "Only one FAQ?", a: "Yes, only one FAQ which is not enough." }],
      },
    });
    const decision = makeToolIndexDecision(tool);

    expect(decision.indexable).toBe(false);
    expect(decision.reasons).toContainEqual(
      expect.stringContaining("FAQ count")
    );
  });
});

describe("Search Page Index Decisions", () => {
  it("search pages are always noindex", () => {
    const decision = makeToolSearchIndexDecision("/tools/search?q=anxiety");

    expect(decision.indexable).toBe(false);
    expect(decision.sitemapEligible).toBe(false);
    expect(decision.reasons).toContainEqual(
      expect.stringContaining("noindex")
    );
  });

  it("search pages with filters are noindex", () => {
    const decision = makeToolSearchIndexDecision(
      "/tools/search?q=therapy&audience=patient&hipaa=true"
    );

    expect(decision.indexable).toBe(false);
    expect(decision.sitemapEligible).toBe(false);
  });

  it("search pages are crawlable (follow)", () => {
    const decision = makeToolSearchIndexDecision("/tools/search");

    expect(decision.crawlable).toBe(true);
  });
});

describe("Canonical URL Consistency", () => {
  it("tool canonical URL uses siteConfig", () => {
    const url = getToolCanonicalUrl("betterhelp");

    // Should not contain hardcoded domain
    expect(url).not.toContain("heypsych.com");
    expect(url).toContain("/tools/betterhelp/");
    expect(url.endsWith("/")).toBe(true);
  });

  it("search canonical URL canonicalizes to audience page", () => {
    const patientUrl = getToolSearchCanonicalUrl("patient");
    const clinicianUrl = getToolSearchCanonicalUrl("clinician");
    const defaultUrl = getToolSearchCanonicalUrl();

    expect(patientUrl).toContain("/tools/for-patients/");
    expect(clinicianUrl).toContain("/tools/for-clinicians/");
    expect(defaultUrl).toContain("/tools/");
  });
});

describe("Robots Meta Tags", () => {
  it("active tool returns index,follow", () => {
    const tool = createMockTool();
    const robots = getToolRobotsMeta(tool);

    expect(robots).toBe("index, follow");
  });

  it("archived tool returns noindex,follow", () => {
    const tool = createMockTool({ status: "archived" });
    const robots = getToolRobotsMeta(tool);

    expect(robots).toContain("noindex");
  });

  it("search page returns noindex,follow", () => {
    const robots = getToolSearchRobotsMeta();

    expect(robots).toBe("noindex, follow");
  });
});

describe("Sitemap Eligibility", () => {
  it("active tool with good content is eligible", () => {
    const tool = createMockTool();
    const eligible = isToolSitemapEligible(tool);

    expect(eligible).toBe(true);
  });

  it("archived tool is not eligible", () => {
    const tool = createMockTool({ status: "archived" });
    const eligible = isToolSitemapEligible(tool);

    expect(eligible).toBe(false);
  });

  it("thin content tool is not eligible", () => {
    const tool = createMockTool({ long_description: "Too short" });
    const eligible = isToolSitemapEligible(tool);

    expect(eligible).toBe(false);
  });
});

describe("Sponsorship Isolation", () => {
  it("sponsorship has no effect on indexation decision", () => {
    const tool = createMockTool();

    // Get decision without sponsorship context
    const decisionWithoutSponsorship = makeToolIndexDecision(tool);

    // Verify sponsorship isolation
    const isolation = verifySponsorshipIsolation(tool, true);
    const isolationNotSponsored = verifySponsorshipIsolation(tool, false);

    // Both should be isolated (no violations)
    expect(isolation.isolated).toBe(true);
    expect(isolationNotSponsored.isolated).toBe(true);

    // The makeToolIndexDecision function does not accept sponsorship parameter
    // This is by design - sponsorship cannot influence indexation
    expect(typeof makeToolIndexDecision).toBe("function");
    expect(makeToolIndexDecision.length).toBe(2); // tool, editorial
  });

  it("sponsored tool cannot become indexable if quality gates fail", () => {
    const lowQualityTool = createMockTool({
      long_description: "Too short",
      status: "active",
    });

    // Even if sponsored, should not be indexable
    const decision = makeToolIndexDecision(lowQualityTool);
    expect(decision.indexable).toBe(false);

    // Verify isolation
    const isolation = verifySponsorshipIsolation(lowQualityTool, true);
    expect(isolation.isolated).toBe(true);
  });

  it("non-sponsored tool with good content is indexable", () => {
    const goodTool = createMockTool();

    const decision = makeToolIndexDecision(goodTool);
    expect(decision.indexable).toBe(true);

    // Same result whether sponsored or not
    const isolation = verifySponsorshipIsolation(goodTool, false);
    expect(isolation.isolated).toBe(true);
  });
});
