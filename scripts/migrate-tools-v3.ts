#!/usr/bin/env tsx
// scripts/migrate-tools-v3.ts
// Migration script for converting legacy digital tools to v3 format

import fs from "fs";
import path from "path";

const LEGACY_DIR = path.join(process.cwd(), "data/resources/digital-tools");
const V3_DIR = path.join(process.cwd(), "data/resources/tools");

// Hub mapping based on app category and conditions
const HUB_MAPPINGS: Record<string, string[]> = {
  sleep: ["sleep", "insomnia", "cbt-i"],
  "anxiety-stress": ["anxiety", "stress", "panic", "worry", "relaxation"],
  "mood-depression": ["depression", "mood", "positive psychology"],
  "focus-adhd": ["adhd", "focus", "attention", "productivity"],
  "trauma-ptsd": ["ptsd", "trauma"],
  "substance-use": ["addiction", "recovery", "sobriety", "alcohol", "substance"],
  "serious-mental-illness": ["bipolar", "schizophrenia", "psychosis"],
  "find-support": ["therapy", "therapist", "psychiatry", "counseling"],
};

interface LegacyTool {
  slug: string;
  name: string;
  summary?: string;
  description?: string;
  patient_summary?: string;
  metadata?: any;
  app_rating?: number;
  total_reviews?: number;
  clinical_metadata?: any;
  privacy_rating?: any;
  sections?: any[];
  faqs?: Array<{ q: string; a: string }>;
  seo?: any;
  editorial?: any;
  app_store_url?: string;
  google_play_url?: string;
  website?: string;
  order?: number;
  featured?: boolean;
  status?: string;
}

interface V3Tool {
  schema_version: "3.0";
  kind: "tool";
  slug: string;
  name: string;
  one_liner: string;
  best_for: string[];
  not_for: string[];
  support_level: "self-help" | "coached" | "clinical" | "crisis";
  short_description: string;
  long_description: string;
  patient_summary?: string;
  primary_hubs: string[];
  sub_hubs?: string[];
  conditions: string[];
  tool_types: string[];
  ai_attributes: string[];
  platforms: {
    ios: boolean;
    android: boolean;
    web: boolean;
    desktop: boolean;
    wearable: boolean;
  };
  pricing: {
    model: string;
    free_tier: boolean;
    starting_price?: string;
    notes?: string;
  };
  privacy: {
    grade: string;
    hipaa_compliant: boolean;
    gdpr_compliant: boolean;
    data_sold: boolean;
    notes?: string;
  };
  app_rating?: number;
  total_reviews?: number;
  seo: {
    title: string;
    meta_description: string;
    canonical_url: string;
    faqs: Array<{ q: string; a: string }>;
  };
  governance: {
    reviewed_by_label: "Reviewed by HeyPsych Board";
    reviewed_by_url: "https://heypsych.com/about/medical-review-board";
    last_reviewed: string;
  };
  app_metadata?: any;
  clinical_metadata?: any;
  related_tools?: string[];
  related_conditions?: string[];
  order?: number;
  featured: boolean;
  status: "active" | "draft" | "archived";
}

function inferHubs(tool: LegacyTool): string[] {
  const hubs: string[] = [];
  const searchText = [
    tool.metadata?.app_category || "",
    tool.summary || "",
    tool.description || "",
    ...(tool.clinical_metadata?.primary_uses || []),
    ...(extractConditions(tool)),
  ]
    .join(" ")
    .toLowerCase();

  for (const [hub, keywords] of Object.entries(HUB_MAPPINGS)) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      hubs.push(hub);
    }
  }

  // Default to mood-depression if no match
  return hubs.length > 0 ? hubs : ["mood-depression"];
}

function extractConditions(tool: LegacyTool): string[] {
  const conditions: string[] = [];
  if (tool.clinical_metadata?.linked_conditions) {
    for (const lc of tool.clinical_metadata.linked_conditions) {
      if (typeof lc === "string") {
        conditions.push(lc);
      } else if (lc.slug) {
        conditions.push(lc.slug);
      }
    }
  }
  return conditions;
}

function inferToolTypes(tool: LegacyTool): string[] {
  const types: string[] = [];
  const category = (tool.metadata?.app_category || "").toLowerCase();
  const name = (tool.name || "").toLowerCase();

  if (category.includes("chatbot") || name.includes("woebot") || name.includes("wysa")) {
    types.push("ai-therapist");
  }
  if (category.includes("therapy platform") || name.includes("betterhelp") || name.includes("talkspace")) {
    types.push("therapy-platform");
  }
  if (category.includes("meditation") || category.includes("mindfulness") || name.includes("calm") || name.includes("headspace")) {
    types.push("meditation");
  }
  if (category.includes("mood") || category.includes("tracking") || name.includes("daylio")) {
    types.push("mood-tracker");
  }
  if (category.includes("sleep") || name.includes("cbt-i")) {
    types.push("sleep-tracker");
  }

  return types.length > 0 ? types : ["app"];
}

function inferAIAttributes(tool: LegacyTool): string[] {
  const category = (tool.metadata?.app_category || "").toLowerCase();
  const name = (tool.name || "").toLowerCase();

  if (category.includes("chatbot") || name.includes("woebot") || name.includes("wysa")) {
    return ["ai-powered", "chatbot"];
  }
  if (category.includes("ai")) {
    return ["ai-assisted"];
  }
  return ["no-ai"];
}

function inferSupportLevel(tool: LegacyTool): "self-help" | "coached" | "clinical" | "crisis" {
  const category = (tool.metadata?.app_category || "").toLowerCase();
  const name = (tool.name || "").toLowerCase();

  if (name.includes("betterhelp") || name.includes("talkspace") || name.includes("talkiatry")) {
    return "clinical";
  }
  if (category.includes("coach")) {
    return "coached";
  }
  return "self-help";
}

function extractBestFor(tool: LegacyTool): string[] {
  const bestForSection = tool.sections?.find((s) => s.type === "best_for");
  if (bestForSection?.items?.length) {
    return bestForSection.items.slice(0, 5);
  }
  if (tool.clinical_metadata?.primary_uses?.length) {
    return tool.clinical_metadata.primary_uses.slice(0, 5);
  }
  return ["General mental health support", "Self-help and wellness"];
}

function extractNotFor(tool: LegacyTool): string[] {
  const bestForSection = tool.sections?.find((s) => s.type === "best_for");
  if (bestForSection?.not_recommended?.length) {
    return bestForSection.not_recommended.slice(0, 3);
  }
  if (tool.clinical_metadata?.contraindications?.length) {
    return tool.clinical_metadata.contraindications.slice(0, 3);
  }
  return ["Severe mental illness requiring immediate professional treatment"];
}

function inferPricingModel(tool: LegacyTool): string {
  if (tool.metadata?.free_tier_available && !tool.metadata?.subscription_model) {
    return "free";
  }
  return "freemium";
}

function extractPricingNotes(tool: LegacyTool): string {
  const pricingSection = tool.sections?.find((s) => s.type === "pricing");
  if (pricingSection?.text) {
    return pricingSection.text.slice(0, 200);
  }
  return "";
}

function migrateTool(legacy: LegacyTool): V3Tool {
  const v3: V3Tool = {
    schema_version: "3.0",
    kind: "tool",
    slug: legacy.slug,
    name: legacy.name,

    // Hero content
    one_liner: (legacy.patient_summary || legacy.summary || legacy.description || "").slice(0, 200),
    best_for: extractBestFor(legacy),
    not_for: extractNotFor(legacy),
    support_level: inferSupportLevel(legacy),

    // Descriptions
    short_description: (legacy.summary || legacy.description || "").slice(0, 160),
    long_description: legacy.description || legacy.patient_summary || "",
    patient_summary: legacy.patient_summary,

    // Classification
    primary_hubs: inferHubs(legacy) as any,
    conditions: extractConditions(legacy),
    tool_types: inferToolTypes(legacy) as any,
    ai_attributes: inferAIAttributes(legacy) as any,

    // Platforms
    platforms: {
      ios: legacy.metadata?.platforms?.includes("iOS") || false,
      android: legacy.metadata?.platforms?.includes("Android") || false,
      web: legacy.metadata?.platforms?.includes("Web") || false,
      desktop: false,
      wearable: false,
    },

    // Pricing
    pricing: {
      model: inferPricingModel(legacy),
      free_tier: legacy.metadata?.free_tier_available || false,
      notes: extractPricingNotes(legacy),
    },

    // Privacy
    privacy: {
      grade: legacy.privacy_rating?.grade || "unknown",
      hipaa_compliant: legacy.metadata?.hipaa_compliant || false,
      gdpr_compliant: legacy.privacy_rating?.gdpr_compliant ?? true,
      data_sold: legacy.privacy_rating?.data_sold || false,
      notes: legacy.privacy_rating?.certification,
    },

    // Ratings
    app_rating: legacy.app_rating,
    total_reviews: legacy.total_reviews,

    // SEO
    seo: {
      title: legacy.seo?.title || `${legacy.name} | HeyPsych`,
      meta_description: legacy.seo?.description || (legacy.summary || "").slice(0, 160),
      canonical_url: `https://heypsych.com/tools/${legacy.slug}/`,
      faqs: legacy.faqs?.slice(0, 10) || [],
    },

    // Governance - REQUIRED
    governance: {
      reviewed_by_label: "Reviewed by HeyPsych Board",
      reviewed_by_url: "https://heypsych.com/about/medical-review-board",
      last_reviewed: legacy.editorial?.lastReviewed || new Date().toISOString().slice(0, 10),
    },

    // App metadata
    app_metadata: {
      publisher: legacy.metadata?.publisher,
      release_date: legacy.metadata?.release_date,
      latest_version: legacy.metadata?.latest_version,
      app_size: legacy.metadata?.app_size,
      content_rating: legacy.metadata?.content_rating,
      languages: legacy.metadata?.languages,
      app_store_url: legacy.app_store_url,
      google_play_url: legacy.google_play_url,
      website: legacy.website,
      wikidata_qid: legacy.metadata?.wikidata_qid,
    },

    // Clinical metadata
    clinical_metadata: legacy.clinical_metadata,

    // Status
    order: legacy.order,
    featured: legacy.featured || false,
    status: (legacy.status as any) || "active",
  };

  return v3;
}

async function main() {
  console.log("🚀 Starting v3 migration...\n");

  // Ensure v3 directory exists
  if (!fs.existsSync(V3_DIR)) {
    fs.mkdirSync(V3_DIR, { recursive: true });
  }

  // Get all legacy tools
  const files = fs.readdirSync(LEGACY_DIR).filter((f) => f.endsWith(".json") && !f.includes(".v1-backup"));

  console.log(`📂 Found ${files.length} legacy tools to migrate\n`);

  const results = {
    success: [] as string[],
    failed: [] as string[],
    dataGaps: [] as string[],
  };

  for (const file of files) {
    try {
      const filePath = path.join(LEGACY_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const legacy = JSON.parse(content) as LegacyTool;

      const v3 = migrateTool(legacy);

      // Check for data gaps
      const gaps: string[] = [];
      if (!v3.seo.faqs || v3.seo.faqs.length < 3) {
        gaps.push("Missing minimum 3 FAQs");
      }
      if (!v3.one_liner || v3.one_liner.length < 20) {
        gaps.push("Missing/short one-liner");
      }
      if (v3.privacy.grade === "unknown") {
        gaps.push("Missing privacy grade");
      }

      if (gaps.length > 0) {
        results.dataGaps.push(`${v3.slug}: ${gaps.join(", ")}`);
      }

      // Write v3 file (but don't overwrite - store for review)
      const v3Path = path.join(V3_DIR, `${v3.slug}.v3.json`);
      fs.writeFileSync(v3Path, JSON.stringify(v3, null, 2));

      results.success.push(v3.slug);
      console.log(`✅ Migrated: ${v3.slug}`);
    } catch (error) {
      results.failed.push(file);
      console.error(`❌ Failed: ${file}`, error);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Data gaps: ${results.dataGaps.length}`);

  if (results.dataGaps.length > 0) {
    console.log("\n📋 DATA GAPS (need attention):");
    results.dataGaps.forEach((gap) => console.log(`   - ${gap}`));
  }

  if (results.failed.length > 0) {
    console.log("\n❌ FAILED FILES:");
    results.failed.forEach((f) => console.log(`   - ${f}`));
  }

  console.log("\n✨ Migration complete!");
  console.log(`📁 V3 files written to: ${V3_DIR}`);
}

main().catch(console.error);
