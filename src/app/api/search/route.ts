// OPTIMIZED SEARCH API - Uses direct Postgres connection for maximum performance
// Bypasses Supabase PostgREST overhead to achieve <300ms search times

import { NextRequest, NextResponse } from "next/server";
import { queryWithRetry } from "@/lib/config/db-pool";
import { EntityService } from "@/lib/data/entity-service";
import { logger } from "@/lib/utils/logger";

type SearchSnippet = { term: string; field: string; snippet: string };

type SearchResult = {
  type: string;
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  snippets: SearchSnippet[];
};

type CategoryResults = {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
};

type GroupedSearchResponse = {
  conditions: CategoryResults;
  treatments: CategoryResults;
  resources: CategoryResults;
  loadTimeMs: number;
  fallbackUsed: boolean;
};

type LegacySearchPayload = {
  results: SearchResult[];
  totalCount: number;
};

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 100);
    const type = searchParams.get("type"); // Optional: filter by single type

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        conditions: { results: [], totalCount: 0, hasMore: false },
        treatments: { results: [], totalCount: 0, hasMore: false },
        resources: { results: [], totalCount: 0, hasMore: false },
        loadTimeMs: 0,
        fallbackUsed: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const searchTerm = query.trim();
    const normalizedSearchPhrase = normalizeSearchPhrase(searchTerm);
    const searchTerms = getSearchTerms(searchTerm);

    if (searchTerms.length === 0) {
      return NextResponse.json({
        conditions: { results: [], totalCount: 0, hasMore: false },
        treatments: { results: [], totalCount: 0, hasMore: false },
        resources: { results: [], totalCount: 0, hasMore: false },
        loadTimeMs: 0,
        fallbackUsed: false,
        message: "Search query must contain at least one keyword",
      });
    }

    let source: "db" | "legacy" = "db";

    try {
      // Always try direct database query first - it should always work
      if (type) {
        const result = await queryWithRetry(
          'SELECT * FROM search_entities($1, $2, $3, $4)',
          [searchTerm, limit, 0, type]
        );

        const resultArray = result.rows;
        const totalCount = resultArray.length > 0 ? (resultArray[0].total_count || 0) : 0;
        const normalizedResults = resultArray
          .map((row: any) => normalizeSearchResult(row, searchTerms, type))
          .filter(Boolean) as SearchResult[];

        const loadTime = Date.now() - startTime;
        logger.info(`✅ Search completed: "${searchTerm}" (type=${type}) in ${loadTime}ms`, {
          results: normalizedResults.length,
          total: totalCount,
          source,
        });

        return NextResponse.json({
          results: normalizedResults,
          totalCount,
          hasMore: normalizedResults.length < totalCount,
          loadTimeMs: loadTime,
          fallbackUsed: false,
        });
      }

      // Use grouped search for all types (single DB query)
      const result = await queryWithRetry(
        'SELECT * FROM search_entities_grouped($1, $2)',
        [searchTerm, limit]
      );

      const allResults = result.rows;

      // Group by entity_type
      const conditionsArray = allResults.filter(r => r.entity_type === 'condition');
      const treatmentsArray = allResults.filter(r => r.entity_type === 'treatment');
      const resourcesArray = allResults.filter(r => r.entity_type === 'resource');

      const conditionsTotal = conditionsArray.length > 0 ? (conditionsArray[0].type_total_count || 0) : 0;
      const treatmentsTotal = treatmentsArray.length > 0 ? (treatmentsArray[0].type_total_count || 0) : 0;
      const resourcesTotal = resourcesArray.length > 0 ? (resourcesArray[0].type_total_count || 0) : 0;

      const conditionsResults = conditionsArray
        .map((row: any) => normalizeSearchResult(row, searchTerms))
        .filter(Boolean) as SearchResult[];

      const treatmentsResults = treatmentsArray
        .map((row: any) => normalizeSearchResult(row, searchTerms))
        .filter(Boolean) as SearchResult[];

      const resourcesResults = resourcesArray
        .map((row: any) => normalizeSearchResult(row, searchTerms))
        .filter(Boolean) as SearchResult[];

      const loadTime = Date.now() - startTime;
      logger.info(
        `✅ Search completed: "${searchTerm}" in ${loadTime}ms (source=${source})`,
        {
          conditions: conditionsResults.length,
          treatments: treatmentsResults.length,
          resources: resourcesResults.length,
          totalMatches: conditionsTotal + treatmentsTotal + resourcesTotal,
        }
      );

      if (loadTime > 400) {
        logger.warn("Slow search query detected", {
          query: searchTerm,
          duration: loadTime,
          threshold: "400ms",
          source,
        });
      }

      const response: GroupedSearchResponse = {
        conditions: {
          results: conditionsResults,
          totalCount: conditionsTotal,
          hasMore: conditionsResults.length < conditionsTotal,
        },
        treatments: {
          results: treatmentsResults,
          totalCount: treatmentsTotal,
          hasMore: treatmentsResults.length < treatmentsTotal,
        },
        resources: {
          results: resourcesResults,
          totalCount: resourcesTotal,
          hasMore: resourcesResults.length < resourcesTotal,
        },
        loadTimeMs: loadTime,
        fallbackUsed: false,
      };

      // Add cache headers for performance
      const headers = new Headers();
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

      return NextResponse.json(response, { headers });

    } catch (dbError: any) {
      // Database query failed - log and fall back to legacy search
      logger.warn("Database search failed, falling back to legacy search", {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
        query: searchTerm,
      });

      source = "legacy";
      const fallback = await runLegacySearch(normalizedSearchPhrase, searchTerms, 1000, 0, type);

      if (type) {
        const loadTime = Date.now() - startTime;
        return NextResponse.json({
          results: fallback.results,
          totalCount: fallback.totalCount,
          hasMore: fallback.results.length < fallback.totalCount,
          loadTimeMs: loadTime,
          fallbackUsed: true,
        });
      }

      const conditionsResults = fallback.results.filter(r => r.type === "condition").slice(0, limit);
      const treatmentsResults = fallback.results.filter(r => r.type === "treatment").slice(0, limit);
      const resourcesResults = fallback.results.filter(r => r.type === "resource").slice(0, limit);

      const loadTime = Date.now() - startTime;
      const response: GroupedSearchResponse = {
        conditions: {
          results: conditionsResults,
          totalCount: fallback.results.filter(r => r.type === "condition").length,
          hasMore: conditionsResults.length < fallback.results.filter(r => r.type === "condition").length,
        },
        treatments: {
          results: treatmentsResults,
          totalCount: fallback.results.filter(r => r.type === "treatment").length,
          hasMore: treatmentsResults.length < fallback.results.filter(r => r.type === "treatment").length,
        },
        resources: {
          results: resourcesResults,
          totalCount: fallback.results.filter(r => r.type === "resource").length,
          hasMore: resourcesResults.length < fallback.results.filter(r => r.type === "resource").length,
        },
        loadTimeMs: loadTime,
        fallbackUsed: true,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    const loadTime = Date.now() - startTime;
    logger.error("Search failed", error, { loadTime });

    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}

function normalizeSearchPhrase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTerms(searchTerm: string): string[] {
  return searchTerm
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9]/gi, "").trim())
    .filter(Boolean);
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function getNameValue(item: any): string {
  return (
    toStringValue(item?.name) ||
    toStringValue(item?.title) ||
    toStringValue(item?.content?.name) ||
    toStringValue(item?.data?.name) ||
    toStringValue(item?.data?.full_name) ||
    toStringValue(item?.slug)
  ).trim();
}

function getDescriptionValue(item: any): string {
  return (
    toStringValue(item?.description) ||
    toStringValue(item?.content?.description) ||
    toStringValue(item?.data?.description)
  ).trim();
}

function getCategoryValue(item: any): string {
  return (
    toStringValue(item?.category) ||
    toStringValue(item?.metadata?.category) ||
    toStringValue(item?.data?.category)
  ).trim();
}

function extractSnippet(text: string, term: string, surrounding = 80): string | null {
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(term);
  if (index === -1) return null;
  const start = Math.max(0, index - surrounding);
  const end = Math.min(text.length, index + term.length + surrounding);
  const snippet = text.substring(start, end).replace(/\s+/g, " ").trim();
  return (start > 0 ? "..." : "") + snippet + (end < text.length ? "..." : "");
}

function cleanJsonSnippet(raw: string): string {
  return raw.replace(/[{}\[\]":,]/g, " ").replace(/\s+/g, " ").trim();
}

function buildSnippets(item: any, searchTerms: string[]): SearchSnippet[] {
  const snippets: SearchSnippet[] = [];
  const name = getNameValue(item);
  const description = getDescriptionValue(item);
  const category = getCategoryValue(item);
  const isCondition = item?.type === 'condition';

  // For grouped search results, we only have title/description/category (no full content/metadata)
  const hasFullData = Boolean(item?.content || item?.metadata);

  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase();

    if (name && name.toLowerCase().includes(lowerTerm)) {
      const snippet = extractSnippet(name, lowerTerm, 120);
      if (snippet) {
        snippets.push({ term, field: "Name", snippet });
        continue;
      }
    }

    if (description && description.toLowerCase().includes(lowerTerm)) {
      const snippet = extractSnippet(description, lowerTerm);
      if (snippet) {
        snippets.push({ term, field: "Description", snippet });
        continue;
      }
    }

    // Skip category snippets for conditions (internal categorization only)
    if (!isCondition && category && category.toLowerCase().includes(lowerTerm)) {
      snippets.push({ term, field: "Category", snippet: category });
      continue;
    }

    // Only build content/metadata snippets if we have the full data (type-filtered search)
    if (hasFullData) {
      const metadata = item?.metadata || {};
      const metadataForSnippet = isCondition
        ? { ...metadata, category: undefined, file_path: undefined }
        : metadata;
      const metadataStr = JSON.stringify(metadataForSnippet);
      const contentStr = JSON.stringify(item?.content || item?.data || {});

      // Skip metadata snippets for conditions (contains technical codes, sync dates, etc.)
      if (!isCondition) {
        const metadataIndex = metadataStr.toLowerCase().indexOf(lowerTerm);
        if (metadataIndex !== -1) {
          const rawSnippet = metadataStr.substring(
            Math.max(0, metadataIndex - 60),
            Math.min(metadataStr.length, metadataIndex + lowerTerm.length + 60)
          );
          const cleaned = cleanJsonSnippet(rawSnippet);
          if (cleaned.toLowerCase().includes(lowerTerm)) {
            snippets.push({ term, field: "Metadata", snippet: cleaned });
            continue;
          }
        }
      }

      const contentIndex = contentStr.toLowerCase().indexOf(lowerTerm);
      if (contentIndex !== -1) {
        const rawSnippet = contentStr.substring(
          Math.max(0, contentIndex - 80),
          Math.min(contentStr.length, contentIndex + lowerTerm.length + 80)
        );
        const cleaned = cleanJsonSnippet(rawSnippet);
        if (cleaned.toLowerCase().includes(lowerTerm)) {
          snippets.push({ term, field: "Content", snippet: cleaned });
        }
      }
    }
  }

  return snippets;
}

function getSearchableText(item: any): string {
  const name = getNameValue(item);
  const description = getDescriptionValue(item);
  const slug = toStringValue(item?.slug);
  const category = getCategoryValue(item);
  const metadata = JSON.stringify(item?.metadata || {});
  const content = JSON.stringify(item?.content || item?.data || {});

  return `${name} ${description} ${slug} ${category} ${metadata} ${content}`.toLowerCase();
}

function matchesAllTerms(item: any, searchTerms: string[]): boolean {
  if (searchTerms.length === 0) return false;
  const searchable = getSearchableText(item);
  return searchTerms.every((term) => searchable.includes(term));
}

function countMatchingTerms(item: any, searchTerms: string[]): number {
  const searchable = getSearchableText(item);
  return searchTerms.filter((term) => searchable.includes(term)).length;
}

function normalizeSearchResult(item: any, searchTerms: string[], typeOverride?: string): SearchResult | null {
  const type = typeOverride || item?.entity_type || item?.type;
  const slug = toStringValue(item?.slug);
  const id = toStringValue(item?.id || slug);
  const name = getNameValue(item);

  if (!type || !slug || !id || !name) {
    return null;
  }

  const description = getDescriptionValue(item) || null;
  const category = getCategoryValue(item) || null;

  // Use database-generated snippet if available (from grouped search)
  let snippets: SearchSnippet[];
  if (item?.snippet && typeof item.snippet === 'string') {
    // Database provided a snippet - clean up JSON artifacts and HTML tags
    const cleanedSnippet = item.snippet
      .replace(/<b>/g, '')
      .replace(/<\/b>/g, '')
      // Remove JSON field syntax: "fieldname": or fieldname":
      .replace(/"\w+"\s*:\s*"/g, '') // "title": "
      .replace(/\w+"\s*:\s*"/g, '') // title": "
      // Remove all quote-comma combinations (array/object separators)
      .replace(/"\s*,\s*"/g, ' ') // ", " or "," or " ," → space
      .replace(/"\s*,/g, ' ') // ", at end → space
      .replace(/,\s*"/g, ' ') // ," at start → space
      // Remove standalone quoted field values (e.g., "treatment", "medication", "slug")
      .replace(/\s+"[\w-]+"\s*,?\s*/g, ' ') // " value",
      // Remove JSON braces/brackets
      .replace(/[{}\[\]]/g, '')
      // Remove JSON field names (snake_case or camelCase patterns)
      .replace(/\s+\w+_\w+["':\s]*/g, ' ') // black_box", generic_name:
      .replace(/\s+"\w+_\w+/g, ' ') // "black_box
      // Remove common JSON field names and values
      .replace(/\s+(items|null|undefined|false|true)["':\s,]*/gi, ' ')
      .replace(/\s*(seo|metadata|slug|type|category|title|description|name)["':\s]+/gi, ' ') // SEO and metadata fields (with optional leading space)
      // Remove URLs
      .replace(/https?:\/\/[^\s,)"]+/g, '')
      .replace(/\([^\)]*https?[^\)]*\)/g, '') // Remove parentheses containing URLs
      .replace(/\(\s*\)/g, '') // Remove empty parentheses
      .replace(/\s+\)\s*/g, ' ') // Remove orphaned closing parentheses
      // Remove trailing metadata patterns (e.g., "treatment Medication medication SSRI")
      // These appear when ts_headline captures JSON field values at the end
      .replace(/\s+(treatment|medication|supplement|therapy|intervention|condition|resource)\s+[\w\s()-]+\s+(medication|supplement|therapy|SSRI|SNRI|antidepressant|benzodiazepine)[\w\s-]*$/i, '')
      // Clean up multiple periods from fragment delimiters
      .replace(/\.{2,}/g, '...')
      // Clean up multiple commas
      .replace(/,\s*,+/g, ',')
      // Remove leading/trailing junk
      .replace(/^["'\s:,\.]+|["'\s:,\.]+$/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Use cleaned snippet if it has content, otherwise fall back to buildSnippets
    if (cleanedSnippet.length > 0) {
      snippets = [{
        term: searchTerms[0] || '',
        field: 'Content',
        snippet: cleanedSnippet
      }];
    } else {
      snippets = buildSnippets(item, searchTerms);
    }
  } else {
    // Fall back to client-side snippet building
    snippets = buildSnippets(item, searchTerms);
  }

  return {
    type,
    id,
    slug,
    name,
    description,
    category,
    snippets,
  };
}

function hasBrandMatch(brandNames: string[] | undefined, searchTermLower: string, searchTerms: string[]): boolean {
  if (!Array.isArray(brandNames)) return false;
  return brandNames.some((brand) => {
    const normalized = brand.toLowerCase();
    return normalized === searchTermLower || searchTerms.some((term) => normalized === term);
  });
}

function startsWithAnyTerm(name: string, searchTerms: string[]): boolean {
  const lowerName = name.toLowerCase();
  return searchTerms.some((term) => lowerName.startsWith(term));
}

async function runLegacySearch(
  searchTerm: string,
  searchTerms: string[],
  limit: number,
  offset: number,
  typeFilter?: string | null
): Promise<LegacySearchPayload> {
  if (searchTerms.length === 0) {
    return { results: [], totalCount: 0 };
  }

  const [treatments, conditions, resources] = await Promise.all([
    EntityService.getAllTreatments(),
    EntityService.getByEntityType("condition"),
    EntityService.getByEntityType("resource"),
  ]);

  const typedItems = [
    ...treatments.map((item) => ({ item, type: "treatment" as const })),
    ...conditions.map((item) => ({ item, type: "condition" as const })),
    ...resources.map((item) => ({ item, type: "resource" as const })),
  ];

  const withMatches = typedItems
    .map(({ item, type }) => {
      if (!matchesAllTerms(item, searchTerms)) return null;
      const normalized = normalizeSearchResult({ ...item, type }, searchTerms, type);
      if (!normalized) return null;
      return {
        normalized,
        matchCount: countMatchingTerms(item, searchTerms),
        brandNames: ((item?.metadata as any)?.brand_names || []) as string[],
      };
    })
    .filter(Boolean) as Array<{
      normalized: SearchResult;
      matchCount: number;
      brandNames: string[];
    }>;

  const searchTermLower = searchTerm.toLowerCase();

  withMatches.sort((a, b) => {
    if (a.matchCount !== b.matchCount) {
      return b.matchCount - a.matchCount;
    }

    const aExact = a.normalized.name.toLowerCase() === searchTermLower;
    const bExact = b.normalized.name.toLowerCase() === searchTermLower;
    if (aExact !== bExact) {
      return aExact ? -1 : 1;
    }

    const aBrandMatch = hasBrandMatch(a.brandNames, searchTermLower, searchTerms);
    const bBrandMatch = hasBrandMatch(b.brandNames, searchTermLower, searchTerms);
    if (aBrandMatch !== bBrandMatch) {
      return aBrandMatch ? -1 : 1;
    }

    const aStartsWithQuery = a.normalized.name.toLowerCase().startsWith(searchTermLower);
    const bStartsWithQuery = b.normalized.name.toLowerCase().startsWith(searchTermLower);
    if (aStartsWithQuery !== bStartsWithQuery) {
      return aStartsWithQuery ? -1 : 1;
    }

    const aStartsAny = startsWithAnyTerm(a.normalized.name, searchTerms);
    const bStartsAny = startsWithAnyTerm(b.normalized.name, searchTerms);
    if (aStartsAny !== bStartsAny) {
      return aStartsAny ? -1 : 1;
    }

    return 0;
  });

  const filteredMatches = typeFilter
    ? withMatches.filter((entry) => entry.normalized.type === typeFilter)
    : withMatches;

  const totalCount = filteredMatches.length;
  const paged = filteredMatches.slice(offset, offset + limit).map((entry) => entry.normalized);

  return {
    results: paged,
    totalCount,
  };
}
