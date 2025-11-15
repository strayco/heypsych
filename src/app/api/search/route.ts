import { NextRequest, NextResponse } from "next/server";
import { EntityService } from "@/lib/data/entity-service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        message: "Search query must be at least 2 characters",
      });
    }

    const searchTerm = query.trim().toLowerCase();
    // Split search query into individual terms
    const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);

    // Search across all entity types
    const [treatments, conditions, resources] = await Promise.all([
      EntityService.getAllTreatments(), // Get all treatment types (medication, therapy, etc.)
      EntityService.getByEntityType("condition"),
      EntityService.getByEntityType("resource"),
    ]);

    logger.debug(`🔍 Search loaded: ${treatments.length} treatments, ${conditions.length} conditions, ${resources.length} resources`);

    // Helper to find snippets for each matching term
    const findMatchingSnippets = (item: any) => {
      const name = (item.name || item.title || "");
      // Check both root description AND content.description
      const description = item.description || item.content?.description || "";
      const category = item.category || item.metadata?.category || "";
      const contentStr = JSON.stringify(item.content || item.data || {});

      const snippets: Array<{ term: string; field: string; snippet: string }> = [];

      // Find snippet for each matching term
      for (const term of searchTerms) {
        let snippetAdded = false;

        // Check name first (highest priority)
        if (name.toLowerCase().includes(term)) {
          const cleanName = name.replace(/\s+/g, ' ').trim();
          if (cleanName.toLowerCase().includes(term)) {
            snippets.push({ term, field: "Name", snippet: cleanName });
            snippetAdded = true;
          }
        }

        // If not in name, check description
        if (!snippetAdded && description && description.toLowerCase().includes(term)) {
          const index = description.toLowerCase().indexOf(term);
          const start = Math.max(0, index - 80);
          const end = Math.min(description.length, index + term.length + 80);
          const rawSnippet = description.substring(start, end).replace(/\s+/g, ' ').trim();
          const fullSnippet = (start > 0 ? "..." : "") + rawSnippet + (end < description.length ? "..." : "");

          // Verify term still exists after cleanup
          if (fullSnippet.toLowerCase().includes(term)) {
            snippets.push({
              term,
              field: "Description",
              snippet: fullSnippet
            });
            snippetAdded = true;
          }
        }

        // If not found yet, check category
        if (!snippetAdded && category && category.toLowerCase().includes(term)) {
          const cleanCategory = category.replace(/\s+/g, ' ').trim();
          if (cleanCategory.toLowerCase().includes(term)) {
            snippets.push({ term, field: "Category", snippet: cleanCategory });
            snippetAdded = true;
          }
        }

        // Last resort: extract from JSON content carefully
        if (!snippetAdded && contentStr.toLowerCase().includes(term)) {
          const lowerContent = contentStr.toLowerCase();
          const termIndex = lowerContent.indexOf(term);

          // Extract original text (preserve case and search term)
          const start = Math.max(0, termIndex - 100);
          const end = Math.min(contentStr.length, termIndex + term.length + 100);
          const original = contentStr.substring(start, end);

          // Clean up AROUND the term, preserving the actual search term
          const cleaned = original
            .replace(/[{}\[\]":,]/g, ' ')  // Remove JSON chars
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .trim();

          // Verify term STILL exists after cleanup
          if (cleaned.toLowerCase().includes(term)) {
            // Extract a reasonable snippet centered on the term
            const cleanedIndex = cleaned.toLowerCase().indexOf(term);
            const snippetStart = Math.max(0, cleanedIndex - 60);
            const snippetEnd = Math.min(cleaned.length, cleanedIndex + term.length + 60);
            const snippet = cleaned.substring(snippetStart, snippetEnd).trim();

            // Final verification - only add if term exists
            if (snippet.toLowerCase().includes(term)) {
              snippets.push({
                term,
                field: "Content",
                snippet: (snippetStart > 0 ? "..." : "") + snippet + (snippetEnd < cleaned.length ? "..." : "")
              });
            }
          }
        }
      }

      return snippets;
    };

    // Helper to check if item matches all search terms
    const matchesAllTerms = (item: any) => {
      const name = (item.name || item.title || "").toLowerCase();
      const description = (item.description || item.content?.description || "").toLowerCase();
      const slug = item.slug?.toLowerCase() || "";
      const category = (item.category || item.metadata?.category || "").toLowerCase();
      const brandNames = (item.metadata?.brand_names || []).join(" ").toLowerCase();
      const metadata = JSON.stringify(item.metadata || {}).toLowerCase();
      const content = JSON.stringify(item.content || item.data || {}).toLowerCase();

      const searchableText = `${name} ${description} ${slug} ${category} ${brandNames} ${metadata} ${content}`;

      // Check if ALL terms are present
      return searchTerms.every(term => searchableText.includes(term));
    };

    // Helper to count matching terms (for ranking)
    const countMatchingTerms = (item: any) => {
      const name = (item.name || item.title || "").toLowerCase();
      const description = (item.description || item.content?.description || "").toLowerCase();
      const slug = item.slug?.toLowerCase() || "";
      const category = (item.category || item.metadata?.category || "").toLowerCase();
      const brandNames = (item.metadata?.brand_names || []).join(" ").toLowerCase();
      const metadata = JSON.stringify(item.metadata || {}).toLowerCase();
      const content = JSON.stringify(item.content || item.data || {}).toLowerCase();

      const searchableText = `${name} ${description} ${slug} ${category} ${brandNames} ${metadata} ${content}`;

      return searchTerms.filter(term => searchableText.includes(term)).length;
    };

    // Filter and rank results - search in title, description, content, metadata
    const searchResults = [
      ...treatments
        .filter(matchesAllTerms)
        .map((item) => {
          const snippets = findMatchingSnippets(item);
          return {
            type: "treatment" as const,
            id: item.id,
            slug: item.slug,
            name: item.name || (item as any).title,
            description: item.description || (item.data as any)?.description,
            category: (item.metadata as any)?.category || (item as any).category,
            snippets: snippets,
            matchCount: countMatchingTerms(item),
          };
        }),
      ...conditions
        .filter(matchesAllTerms)
        .map((item) => {
          const snippets = findMatchingSnippets(item);
          return {
            type: "condition" as const,
            id: item.id,
            slug: item.slug,
            name: item.name || (item as any).title,
            description: item.description || (item.data as any)?.description,
            category: (item.metadata as any)?.category || (item as any).category,
            snippets: snippets,
            matchCount: countMatchingTerms(item),
          };
        }),
      ...resources
        .filter(matchesAllTerms)
        .map((item) => {
          const snippets = findMatchingSnippets(item);
          return {
            type: "resource" as const,
            id: item.id,
            slug: item.slug,
            name: item.name || (item as any).title,
            description: item.description || (item.data as any)?.description,
            category: (item.metadata as any)?.category || (item as any).category,
            snippets: snippets,
            matchCount: countMatchingTerms(item),
          };
        }),
    ];

    const loadTime = Date.now() - startTime;
    logger.debug(`✅ Found ${searchResults.length} results in ${loadTime}ms`);

    // Rank by relevance
    const ranked = searchResults.sort((a, b) => {
      // First, prioritize by match count (items matching more terms rank higher)
      if (a.matchCount !== b.matchCount) {
        return b.matchCount - a.matchCount;
      }

      // Then, exact name match with full query
      const aNameMatch = a.name?.toLowerCase() === searchTerm;
      const bNameMatch = b.name?.toLowerCase() === searchTerm;

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      // Then, check brand name match (for medications)
      const aTreatment = treatments.find(t => t.id === a.id);
      const bTreatment = treatments.find(t => t.id === b.id);
      const aBrandMatch = aTreatment?.metadata?.brand_names?.some((bn: string) =>
        bn.toLowerCase() === searchTerm || searchTerms.some(term => bn.toLowerCase() === term)
      );
      const bBrandMatch = bTreatment?.metadata?.brand_names?.some((bn: string) =>
        bn.toLowerCase() === searchTerm || searchTerms.some(term => bn.toLowerCase() === term)
      );

      if (aBrandMatch && !bBrandMatch) return -1;
      if (!aBrandMatch && bBrandMatch) return 1;

      // Then, name starts with full query
      const aNameStartsWith = a.name?.toLowerCase().startsWith(searchTerm);
      const bNameStartsWith = b.name?.toLowerCase().startsWith(searchTerm);

      if (aNameStartsWith && !bNameStartsWith) return -1;
      if (!aNameStartsWith && bNameStartsWith) return 1;

      // Then, name starts with any of the search terms
      const aStartsWithTerm = searchTerms.some(term => a.name?.toLowerCase().startsWith(term));
      const bStartsWithTerm = searchTerms.some(term => b.name?.toLowerCase().startsWith(term));

      if (aStartsWithTerm && !bStartsWithTerm) return -1;
      if (!aStartsWithTerm && bStartsWithTerm) return 1;

      return 0;
    });

    // Return results already ranked by relevance (don't re-group by type)
    // This ensures name/brand matches appear before content-only matches
    const limitedResults = ranked;

    return NextResponse.json({
      results: limitedResults,
      totalCount: searchResults.length,
      loadTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    logger.error("Search failed", error, { loadTime: Date.now() - startTime });
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}
