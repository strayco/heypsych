/**
 * Site search API
 *
 *   GET /api/search?q=adderall              grouped: conditions, treatments,
 *                                            resources, tools (5 each)
 *   GET /api/search?q=adderall&limit=10     grouped, 10 each (max 100)
 *   GET /api/search?q=adderall&type=tool    one section: { results, totalCount, hasMore }
 *
 * Candidates come from one Postgres full-text query (`search_entities_grouped`)
 * plus the clinician tool catalogue. Every candidate then goes through
 * `@/lib/search/shape-results`, which files it in the right section, links it
 * to the page that actually exists, removes duplicates, and ranks direct name
 * matches first. Grouped and single-section requests share that path, so
 * "Show more" never disagrees with the summary it expands.
 *
 * If the database query fails, entities are searched in memory instead and the
 * response says `fallbackUsed: true`. The endpoint never returns a 500 for a
 * search; an empty result set with `error` is easier for the page to handle.
 */

import { NextRequest, NextResponse } from "next/server";
import { queryWithRetry } from "@/lib/config/db-pool";
import { EntityService } from "@/lib/data/entity-service";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, searchRateLimit } from "@/lib/rate-limit";
import { getCategoryBySlug } from "@/lib/config/condition-categories";
import { loadRecord } from "@/lib/search/record-files";
import {
  buildSnippets,
  contextSnippet,
  getSearchTerms,
  groupResults,
  isRelevant,
  normalizeText,
  orderSections,
  rowToResult,
  SECTION_FOR_TYPE,
  snippetShowsMatch,
  type EntityRow,
  type GroupedResults,
  type SearchResult,
  type SearchResultType,
  type SearchSection,
} from "@/lib/search/shape-results";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;
/** Candidates fetched per database bucket before shaping and trimming. */
const CANDIDATES_PER_TYPE = 100;
const MAX_QUERY_LENGTH = 100;
const SLOW_QUERY_MS = 400;

const SECTIONS: SearchSection[] = ["conditions", "treatments", "resources", "tools"];
const RESULT_TYPES = new Set<SearchResultType>(["condition", "treatment", "resource", "tool"]);

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

type SectionPayload = { results: SearchResult[]; totalCount: number; hasMore: boolean };

type Candidates = {
  results: SearchResult[];
  /**
   * Whether every match was fetched. When the database has more matches than
   * we asked for, section totals are lower bounds and `hasMore` stays true.
   */
  complete: boolean;
  /** Per-section match counts reported by the database, for incomplete sets. */
  reportedTotals: Partial<Record<SearchSection, number>>;
  fallbackUsed: boolean;
};

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, searchRateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();
  const { searchParams } = new URL(req.url);

  const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const limit = parseLimit(searchParams.get("limit"));
  const typeParam = searchParams.get("type");
  const type = typeParam && RESULT_TYPES.has(typeParam as SearchResultType)
    ? (typeParam as SearchResultType)
    : null;

  if (query.length < 2) {
    return emptyResponse(type, "Search query must be at least 2 characters");
  }
  if (getSearchTerms(query).length === 0) {
    return emptyResponse(type, "Search query must contain at least one keyword");
  }

  try {
    const candidates = await findCandidates(query);
    const grouped = groupResults(candidates.results, query);
    const loadTimeMs = Date.now() - startTime;

    if (loadTimeMs > SLOW_QUERY_MS) {
      logger.warn("Slow search query", { query, loadTimeMs, fallback: candidates.fallbackUsed });
    }

    const terms = getSearchTerms(query);

    if (type) {
      const section = toSection(grouped, SECTION_FOR_TYPE[type], limit, candidates, terms);
      await fillSnippetsFromDatabase([section], terms, candidates.fallbackUsed);
      return NextResponse.json(
        { ...section, loadTimeMs, fallbackUsed: candidates.fallbackUsed },
        { headers: candidates.fallbackUsed ? undefined : CACHE_HEADERS }
      );
    }

    const body = Object.fromEntries(
      SECTIONS.map((section) => [section, toSection(grouped, section, limit, candidates, terms)])
    ) as Record<SearchSection, SectionPayload>;
    await fillSnippetsFromDatabase(Object.values(body), terms, candidates.fallbackUsed);
    return NextResponse.json(
      {
        ...body,
        // Best-matching section first; the page renders in this order.
        order: orderSections(grouped, query),
        loadTimeMs,
        fallbackUsed: candidates.fallbackUsed,
      },
      // A degraded answer should not be cached at the edge for five minutes.
      { headers: candidates.fallbackUsed ? undefined : CACHE_HEADERS }
    );
  } catch (error) {
    logger.error("Search failed", error, { query, loadTimeMs: Date.now() - startTime });
    return emptyResponse(type, undefined, "Search temporarily unavailable");
  }
}

// ============================================================================
// CANDIDATES
// ============================================================================

async function findCandidates(query: string): Promise<Candidates> {
  const terms = getSearchTerms(query);
  const clinicianTools = searchClinicianTools(query, terms);

  try {
    const { rows } = await queryWithRetry(
      "SELECT * FROM search_entities_grouped($1, $2)",
      [query, CANDIDATES_PER_TYPE]
    );

    const typedRows = rows as Array<EntityRow & { type_total_count?: number | string }>;
    const shaped = typedRows.map((row) => rowToResult(row, terms));

    // The database's buckets (condition / resource / everything else) are not
    // our sections: resource rows include app stubs that belong under tools,
    // and the treatment bucket holds hotlines. When a bucket has more matches
    // than we fetched, each section's total is estimated by scaling the
    // bucket's count by how the fetched sample split across sections.
    const buckets = new Map<string, { total: number; fetched: number; bySection: Map<SearchSection, number> }>();
    typedRows.forEach((row, i) => {
      const key = row.entity_type ?? "";
      const bucket = buckets.get(key) ?? {
        total: Number(row.type_total_count) || 0,
        fetched: 0,
        bySection: new Map(),
      };
      bucket.fetched += 1;
      const result = shaped[i];
      if (result) {
        const section = SECTION_FOR_TYPE[result.type];
        bucket.bySection.set(section, (bucket.bySection.get(section) ?? 0) + 1);
      }
      buckets.set(key, bucket);
    });

    const complete = [...buckets.values()].every((b) => b.total <= b.fetched);
    const reportedTotals: Partial<Record<SearchSection, number>> = {};
    for (const bucket of buckets.values()) {
      for (const [section, count] of bucket.bySection) {
        const estimate = Math.round((bucket.total * count) / Math.max(bucket.fetched, 1));
        reportedTotals[section] = (reportedTotals[section] ?? 0) + estimate;
      }
    }

    return {
      // Clinician tools first: where a product exists in both catalogues, the
      // curated clinician page is the better destination.
      results: [...(await clinicianTools), ...shaped.filter(isResult)],
      complete,
      reportedTotals,
      fallbackUsed: false,
    };
  } catch (dbError) {
    logger.warn("Database search failed; searching in memory", {
      message: (dbError as Error)?.message,
      code: (dbError as { code?: string })?.code,
      query,
    });

    return {
      results: [...(await clinicianTools), ...(await searchInMemory(terms))],
      complete: true,
      reportedTotals: {},
      fallbackUsed: true,
    };
  }
}

async function searchClinicianTools(query: string, terms: string[]): Promise<SearchResult[]> {
  try {
    const { tools } = await ClinicianToolService.searchClinicianTools(query);
    const results = tools.map((tool) => {
      const category =
        SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY] ||
        tool.primary_category;
      const description = tool.short_description || tool.one_liner || null;
      return {
        type: "tool" as const,
        id: tool.slug,
        slug: tool.slug,
        name: tool.name,
        description,
        category: null,
        snippets: buildSnippets(tool.name, description, terms),
        href: `/tools/for-clinicians/${category}/${tool.slug}`,
      };
    });
    return results.filter((result) => isRelevant(result, query));
  } catch (error) {
    logger.warn("Clinician tool search failed", { error });
    return [];
  }
}

/** Database-free fallback: every term must appear in the entity's text. */
async function searchInMemory(terms: string[]): Promise<SearchResult[]> {
  const [treatments, conditions, resources] = await Promise.all([
    EntityService.getAllTreatments(),
    EntityService.getByEntityType("condition"),
    EntityService.getByEntityType("resource"),
  ]);

  const entities = [
    ...conditions.map((e) => ({ entity: e, type: "condition" })),
    ...treatments.map((e) => ({ entity: e, type: (e as { type?: string }).type || "treatment" })),
    ...resources.map((e) => ({ entity: e, type: "resource" })),
  ];

  const results: SearchResult[] = [];
  for (const { entity, type } of entities) {
    const e = entity as unknown as Record<string, unknown> & EntityRow;
    const haystack = normalizeText(
      [e.name, e.title, e.description, e.slug, JSON.stringify(e.metadata ?? {})]
        .filter(Boolean)
        .join(" ")
    );
    if (!terms.every((t) => haystack.includes(t))) continue;

    const result = rowToResult(
      {
        id: e.id,
        slug: e.slug,
        title: e.title ?? e.name,
        description: e.description,
        type,
        category: e.category ?? e.metadata?.category,
      },
      terms
    );
    if (result) results.push(result);
  }
  return results;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function toSection(
  grouped: GroupedResults,
  section: SearchSection,
  limit: number,
  candidates: Candidates,
  terms: string[]
): SectionPayload {
  const all = grouped[section];
  const results = all.slice(0, limit).map(withCategoryLabel).map((r) => withContextSnippet(r, terms));

  // With every match in hand the count is exact. Otherwise the database's
  // count for the matching bucket is the better estimate, never below what
  // we can actually show.
  const reported = candidates.reportedTotals[section];
  const totalCount =
    candidates.complete || reported === undefined ? all.length : Math.max(all.length, reported);

  return {
    results,
    totalCount,
    hasMore: results.length < totalCount,
  };
}

/**
 * When neither the name nor the description shows the search term, show the
 * sentence from the full record that does ("Cannot prescribe controlled
 * substances (no Adderall, …)"). Only returned results are enriched, and the
 * text comes from data/ files, not the database.
 */
function withContextSnippet(result: SearchResult, terms: string[]): SearchResult {
  if (snippetShowsMatch(result, terms)) return result;
  const record = loadRecord(result.type, result.slug);
  const snippet = record ? contextSnippet(record, terms) : null;
  if (!snippet) return result;
  const term = terms.find((t) => snippet.toLowerCase().includes(t)) ?? terms[0];
  return { ...result, snippets: [{ term, field: "Match", snippet }] };
}

/**
 * Last resort for snippets: records that exist only in the database (most
 * Knowledge Hub articles have no file under data/). One batched query for
 * just the returned results that still do not show the match, so a search
 * costs at most one extra round trip, and the response is CDN-cached.
 */
async function fillSnippetsFromDatabase(
  sections: SectionPayload[],
  terms: string[],
  databaseUnavailable: boolean
): Promise<void> {
  if (databaseUnavailable) return;
  const missing = sections
    .flatMap((s) => s.results)
    .filter((r) => r.type !== "tool" && !snippetShowsMatch(r, terms));
  if (missing.length === 0) return;

  try {
    const { rows } = await queryWithRetry(
      "SELECT slug, content FROM entities WHERE slug = ANY($1::text[]) AND status = 'active'",
      [[...new Set(missing.map((r) => r.slug))]],
      1, // no retries: a snippet is not worth a second round trip
      3000 // and never hold the search up for long
    );
    const contentBySlug = new Map<string, unknown>(
      (rows as Array<{ slug: string; content: unknown }>).map((row) => [row.slug, row.content])
    );
    for (const section of sections) {
      section.results = section.results.map((result) => {
        if (!missing.includes(result)) return result;
        const content = contentBySlug.get(result.slug);
        const snippet = content ? contextSnippet(content, terms) : null;
        if (!snippet) return result;
        const term = terms.find((t) => snippet.toLowerCase().includes(t)) ?? terms[0];
        return { ...result, snippets: [{ term, field: "Match", snippet }] };
      });
    }
  } catch (error) {
    // A missing snippet is cosmetic; never fail the search over it.
    logger.warn("Snippet lookup failed", { message: (error as Error)?.message });
  }
}

/** Condition categories are slugs ("attention-learning"); show their title. */
function withCategoryLabel(result: SearchResult): SearchResult {
  if (result.type !== "condition" || !result.category) return result;
  return { ...result, category: getCategoryBySlug(result.category)?.displayTitle ?? null };
}

function emptyResponse(type: SearchResultType | null, message?: string, error?: string) {
  const empty: SectionPayload = { results: [], totalCount: 0, hasMore: false };
  const extra = { loadTimeMs: 0, fallbackUsed: false, ...(message && { message }), ...(error && { error }) };

  if (type) return NextResponse.json({ ...empty, ...extra });
  return NextResponse.json({
    ...Object.fromEntries(SECTIONS.map((s) => [s, empty])),
    results: [],
    ...extra,
  });
}

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function isResult(value: SearchResult | null): value is SearchResult {
  return value !== null;
}
