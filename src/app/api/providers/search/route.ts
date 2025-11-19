// src/app/api/providers/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, searchRateLimit } from "@/lib/rate-limit";
import { validateQuery } from "@/lib/validation";
import { providerSearchSchema } from "@/lib/schemas/api";

// Import Sentry if available
let Sentry: any = null;
try {
  Sentry = require("@sentry/nextjs");
} catch {
  // Sentry not available, performance tracking disabled
}

// Use service role for server-side queries to bypass RLS and improve performance
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // Start Sentry transaction if available
  const transaction =
    typeof Sentry?.startTransaction === "function"
      ? Sentry.startTransaction({
          op: "api.providers.search",
          name: "Provider Search API",
        })
      : null;

  // Rate limiting - FIRST line of defense
  const rateLimitResponse = await checkRateLimit(req, searchRateLimit);
  if (rateLimitResponse) {
    transaction?.finish();
    return rateLimitResponse;
  }

  // Input validation - SECOND line of defense
  const { data: qParams, error: validationError } = validateQuery(req, providerSearchSchema);
  if (validationError) {
    transaction?.finish();
    return validationError;
  }
  if (!qParams) {
    transaction?.finish();
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  try {
    const limit = qParams.limit;
    const offset = qParams.offset;

    logger.debug("🔍 Provider search:", { limit, offset, params: qParams });

    // Select only necessary fields to reduce query size and improve performance
    let query = supabaseAdmin
      .from("entities")
      .select("slug, content", { count: "exact" })
      .eq("type", "provider")
      .not("content", "is", null)
      .order("slug"); // Add consistent ordering for pagination

    // Free-text search (name only)
    if (qParams.q) {
      const searchTerm = `%${qParams.q.trim()}%`;
      query = query.ilike("content->>full_name", searchTerm);
    }

    if (qParams.state) {
      query = query.eq("content->address->>state", qParams.state.toUpperCase());
    }

    // City search optimization: use exact match first, fallback to prefix match
    // This is much faster than substring search (%city%)
    if (qParams.city) {
      const cityTerm = qParams.city.trim();
      // For better performance, use prefix match instead of substring match
      // Users typically search "Los Angeles" not "Angeles"
      query = query.ilike("content->address->>city", `${cityTerm}%`);
    }

    if (qParams.zip) {
      query = query.eq("content->address->>zip", qParams.zip.trim());
    }

    if (qParams.gender) {
      query = query.eq("content->>gender", qParams.gender);
    }

    if (qParams.specialization) {
      const specializations = Array.from(
        new Set(
          qParams.specialization
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );

      // Filter for ALL selected specializations (AND logic) on server-side
      for (const spec of specializations) {
        // Use json containment on the whole content object to ensure the array check works reliably
        query = query.contains("content", { specialties: [spec] });
      }
    }


    // Server-side filtering for accepting patients (when data is available)
    if (qParams.acceptingOnly === "true") {
      query = query.eq("content->>accepting_new_patients", true);
    }

    // Server-side filtering for telehealth (when data is available)
    if (qParams.telehealthOnly === "true") {
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
      logger.warn("Provider search timed out", { filters: qParams });
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

    const loadTime = Date.now() - startTime;
    logger.debug(`✅ Found ${data?.length || 0} providers (${count} total) in ${loadTime}ms`);

    // Track performance metric in Sentry
    const metrics = Sentry?.metrics;
    if (metrics && typeof metrics.distribution === "function") {
      metrics.distribution("provider_search.duration", loadTime, {
        unit: "millisecond",
        tags: {
          has_state: !!qParams.state,
          has_city: !!qParams.city,
          has_specialization: !!qParams.specialization,
          result_count: data?.length || 0,
        },
      });
    }

    if (loadTime > 250 && typeof Sentry?.captureMessage === "function") {
      Sentry.captureMessage("Slow provider search query detected", {
        level: "warning",
        tags: {
          duration: loadTime,
          threshold: "250ms",
        },
        extra: {
          result_count: data?.length || 0,
          total_count: count,
          filters: qParams,
        },
      });
    }

    // Map to expected format with better error handling
    const providers = (data ?? []).map((row: any) => {
      const content = row.content || {};

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

    // Add cache headers for performance (shorter cache due to dynamic filters)
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=300');

    return NextResponse.json({
      providers,
      totalCount: count ?? 0,
      loadTimeMs: Date.now() - startTime,
    }, { headers });
  } catch (e: any) {
    const loadTime = Date.now() - startTime;
    logger.error("Provider search failed", e, { loadTime });

    // Track error in Sentry
    Sentry?.captureException(e, {
      tags: {
        api: "provider_search",
        duration: loadTime,
      },
      extra: {
        filters: qParams,
      },
    });

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
  } finally {
    transaction?.finish();
  }
}
