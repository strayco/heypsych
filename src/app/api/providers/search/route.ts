// src/app/api/providers/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, searchRateLimit } from "@/lib/rate-limit";
import { validateQuery } from "@/lib/validation";
import { providerSearchSchema } from "@/lib/schemas/api";

// Lazy-initialize Supabase client to avoid build-time failures
// when credentials are not available
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  _supabaseAdmin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return _supabaseAdmin;
}

// Cache version - read from env var to allow updates without code deploy
// Format: YYYY-MM (e.g., "2025-12" for December 2025 data)
// Set in .env: PROVIDER_DATA_VERSION=2025-12
// Update after monthly NPPES imports to bust edge cache
const PROVIDER_DATA_VERSION = process.env.PROVIDER_DATA_VERSION || "2025-12";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const queryStartTime = performance.now();

  // Check for Vercel cache headers to detect cached responses
  const vercelCacheHeader = req.headers.get('x-vercel-cache');
  const isCachedResponse = vercelCacheHeader === 'HIT' || vercelCacheHeader === 'STALE';

  // Check Supabase availability before proceeding
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    logger.warn("Provider search unavailable - Supabase not configured");
    return NextResponse.json(
      {
        providers: [],
        totalCount: 0,
        error: "Provider search is temporarily unavailable",
      },
      { status: 503 }
    );
  }

  // Rate limiting - FIRST line of defense
  const rateLimitResponse = await checkRateLimit(req, searchRateLimit);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Input validation - SECOND line of defense
  const { data: qParams, error: validationError } = validateQuery(req, providerSearchSchema);
  if (validationError) {
    return validationError;
  }
  if (!qParams) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  try {
    const limit = qParams.limit;
    const offset = qParams.offset;

    // Normalize query params to improve cache hit rate
    // This ensures variations like "CA" vs "ca" or " Los Angeles " vs "los angeles" cache the same
    const normalizedParams = {
      q: qParams.q?.trim().toLowerCase() || undefined,
      state: qParams.state?.trim().toUpperCase() || undefined,
      city: qParams.city?.trim().toLowerCase() || undefined,
      zip: qParams.zip?.trim() || undefined,
      gender: qParams.gender || undefined,
      specialization: qParams.specialization?.split(',').map(s => s.trim()).sort().join(',') || undefined,
      acceptingOnly: qParams.acceptingOnly || undefined,
      telehealthOnly: qParams.telehealthOnly || undefined,
      limit: limit,
      offset: offset,
    };

    // Generate cache key for debugging (hash of normalized params)
    const cacheKeyData = JSON.stringify(normalizedParams);
    const cacheKey = `prov:${PROVIDER_DATA_VERSION}:${Buffer.from(cacheKeyData).toString('base64').substring(0, 16)}`;

    // Extract version param for cache busting (optional)
    const requestedVersion = req.nextUrl.searchParams.get('v');
    const isVersionMismatch = requestedVersion && requestedVersion !== PROVIDER_DATA_VERSION;

    logger.debug("🔍 Provider search:", {
      limit,
      offset,
      originalParams: qParams,
      normalizedParams,
      cacheKey,
      dataVersion: PROVIDER_DATA_VERSION,
      requestedVersion,
      isVersionMismatch,
      isCachedResponse,
      vercelCacheHeader
    });

    // Select only necessary fields to reduce query size and improve performance
    let query = supabaseAdmin
      .from("entities")
      .select("slug, content", { count: "exact" })
      .eq("type", "provider")
      .not("content", "is", null)
      .order("slug"); // Add consistent ordering for pagination

    // Use normalized params for queries to ensure consistent cache behavior
    // Free-text search (name only)
    if (normalizedParams.q) {
      const searchTerm = `%${normalizedParams.q}%`;
      query = query.ilike("content->>full_name", searchTerm);
    }

    if (normalizedParams.state) {
      query = query.eq("content->address->>state", normalizedParams.state);
    }

    // City search optimization: use exact match first, fallback to prefix match
    // This is much faster than substring search (%city%)
    if (normalizedParams.city) {
      // For better performance, use prefix match instead of substring match
      // Users typically search "Los Angeles" not "Angeles"
      query = query.ilike("content->address->>city", `${normalizedParams.city}%`);
    }

    if (normalizedParams.zip) {
      query = query.eq("content->address->>zip", normalizedParams.zip);
    }

    if (normalizedParams.gender) {
      query = query.eq("content->>gender", normalizedParams.gender);
    }

    if (normalizedParams.specialization) {
      const specializations = normalizedParams.specialization.split(",").filter(Boolean);

      // Filter for ALL selected specializations (AND logic) on server-side
      for (const spec of specializations) {
        // Use json containment on the whole content object to ensure the array check works reliably
        query = query.contains("content", { specialties: [spec] });
      }
    }


    // Server-side filtering for accepting patients (when data is available)
    if (normalizedParams.acceptingOnly === "true") {
      query = query.eq("content->>accepting_new_patients", true);
    }

    // Server-side filtering for telehealth (when data is available)
    if (normalizedParams.telehealthOnly === "true") {
      query = query.eq("content->>telehealth_available", true);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    logger.debug("⚙️ Executing query...");

    // Add timeout handling with better error messages
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout after 15 seconds")), 15000)
    );

    const queryPromise = query;
    let data, error, count;

    try {
      ({ data, error, count } = await Promise.race([queryPromise, timeoutPromise]));
    } catch (timeoutError: any) {
      // Handle timeout gracefully - return empty results instead of throwing
      logger.warn("Provider search timed out", { filters: normalizedParams });
      return NextResponse.json({
        providers: [],
        totalCount: 0,
        timeout: true,
        message: "No psychiatrists found matching your search criteria. Try using fewer filters or a different location.",
      }, { status: 200 }); // Return 200 so frontend doesn't treat it as an error
    }

    if (error) {
      logger.error("Supabase query error", error);

      // Handle specific database timeout errors more gracefully
      if (error.code === "57014") {
        return NextResponse.json({
          providers: [],
          totalCount: 0,
          timeout: true,
          message: "No psychiatrists found matching your search criteria. Try using fewer filters or a different location.",
        }, { status: 200 }); // Return 200 so frontend doesn't treat it as an error
      }

      throw error;
    }

    const queryEndTime = performance.now();
    const queryDurationMs = queryEndTime - queryStartTime;
    const loadTime = Date.now() - startTime;

    // Estimate egress: ~850 bytes per provider record (average from database analysis)
    const estimatedEgressBytes = (data?.length || 0) * 850;
    const estimatedEgressKB = (estimatedEgressBytes / 1024).toFixed(2);

    logger.info(`✅ Provider search complete`, {
      resultCount: data?.length || 0,
      totalCount: count || 0,
      queryTimeMs: Math.round(queryDurationMs),
      totalTimeMs: loadTime,
      estimatedEgressKB,
      estimatedEgressBytes,
      dataVersion: PROVIDER_DATA_VERSION,
      cacheKey,
      isCachedResponse,
      vercelCacheHeader,
      normalizedParams,
      filters: {
        hasState: !!normalizedParams.state,
        hasCity: !!normalizedParams.city,
        hasZip: !!normalizedParams.zip,
        hasSpecialization: !!normalizedParams.specialization,
        hasQuery: !!normalizedParams.q
      }
    });

    if (loadTime > 250) {
      logger.warn("Slow provider search query detected", {
        duration: loadTime,
        threshold: "250ms",
        cached: isCachedResponse,
        result_count: data?.length || 0,
        total_count: count,
        filters: normalizedParams,
      });
    }

    // Validate and map to expected format with better error handling
    const providers = (data ?? []).map((row: any) => {
      const content = row.content || {};

      // Validate required fields for provider cards
      // Critical fields: first_name, last_name, credentials, address, specialties
      const missingFields: string[] = [];
      if (!content.first_name) missingFields.push('first_name');
      if (!content.last_name) missingFields.push('last_name');
      if (!content.credentials) missingFields.push('credentials');
      if (!content.address?.city || !content.address?.state) missingFields.push('address');
      if (!Array.isArray(content.specialties) || content.specialties.length === 0) {
        missingFields.push('specialties');
      }

      if (missingFields.length > 0) {
        logger.warn(`⚠️ Provider ${row.slug} missing fields:`, missingFields);
      }

      // Handle missing or malformed data gracefully
      const firstName = content.first_name || "";
      const lastName = content.last_name || "";
      const specialties = Array.isArray(content.specialties)
        ? content.specialties
        : ["general_psychiatry"];

      return {
        npi: content.npi || row.id,
        slug: row.slug || `provider-${row.id}`,
        name: {
          first: firstName,
          last: lastName,
          suffix: content.suffix || null,
          credential: content.credentials || null,
        },
        taxonomy: {
          primary: {
            code: content.taxonomy_code || null,
            specialization: specialties[0] || "General Psychiatry",
          },
        },
        specialties: specialties,
        business: {
          practiceAddress: {
            city: content.address?.city || "",
            state: content.address?.state || "",
          },
          phone: content.phone || null,
        },
      };
    });

    // Add aggressive edge caching headers to reduce Supabase egress
    // Cache at Vercel Edge for 1 hour, serve stale for up to 24 hours while revalidating
    // Note: Update PROVIDER_DATA_VERSION env var after monthly uploads to bust cache
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    headers.set('X-Provider-Data-Version', PROVIDER_DATA_VERSION);
    headers.set('X-Estimated-Egress-KB', estimatedEgressKB);
    headers.set('X-Cache-Key', cacheKey);

    // Add cache status for debugging
    if (isCachedResponse) {
      headers.set('X-Cache-Status', vercelCacheHeader || 'HIT');
    } else {
      headers.set('X-Cache-Status', 'MISS');
    }

    logger.debug(`📦 Sending response with cache headers:`, {
      cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
      dataVersion: PROVIDER_DATA_VERSION,
      cacheKey,
      cacheStatus: isCachedResponse ? (vercelCacheHeader || 'HIT') : 'MISS',
      egressKB: estimatedEgressKB
    });

    return NextResponse.json({
      providers,
      totalCount: count ?? 0,
      loadTimeMs: Date.now() - startTime,
      dataVersion: PROVIDER_DATA_VERSION, // Include version in response for debugging
      cacheKey, // Include cache key for debugging
      cached: isCachedResponse, // Indicate if response was cached
    }, { headers });
  } catch (e: any) {
    const loadTime = Date.now() - startTime;
    logger.error("Provider search failed", e, { loadTime });

    // Return more specific error messages
    let message = "Search failed - please try again";
    let isTimeout = false;

    if (e.message?.includes("timeout")) {
      message = "No psychiatrists found matching your search criteria. Try using fewer filters or a different location.";
      isTimeout = true;
    } else if (e.code === "57014") {
      message = "No psychiatrists found matching your search criteria. Try using fewer filters or a different location.";
      isTimeout = true;
    }

    // For timeout errors, return 200 with empty results so frontend shows "no results" instead of error
    if (isTimeout) {
      return NextResponse.json(
        {
          providers: [],
          totalCount: 0,
          timeout: true,
          message,
        },
        { status: 200 }
      );
    }

    // For other errors, return 500
    return NextResponse.json(
      {
        providers: [],
        totalCount: 0,
        error: message,
        details: process.env.NODE_ENV === "development" ? e.toString() : undefined,
      },
      { status: 500 }
    );
  }
}
