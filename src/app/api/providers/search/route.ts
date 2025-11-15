// src/app/api/providers/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, searchRateLimit } from "@/lib/rate-limit";
import { validateQuery } from "@/lib/validation";
import { providerSearchSchema } from "@/lib/schemas/api";

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
  // Rate limiting - FIRST line of defense
  const rateLimitResponse = await checkRateLimit(req, searchRateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  // Input validation - SECOND line of defense
  const { data: qParams, error: validationError } = validateQuery(req, providerSearchSchema);
  if (validationError) return validationError;
  if (!qParams) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const startTime = Date.now();

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

    if (qParams.city) {
      query = query.ilike("content->address->>city", `%${qParams.city.trim()}%`);
    }

    if (qParams.zip) {
      query = query.eq("content->address->>zip", qParams.zip.trim());
    }

    if (qParams.gender) {
      query = query.eq("content->>gender", qParams.gender);
    }

    if (qParams.specialization) {
      const specializations = qParams.specialization.split(",").map((s) => s.trim());

      // Filter for ALL specializations (AND logic) on server-side
      for (const spec of specializations) {
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

    // Add timeout handling
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout after 15 seconds")), 15000)
    );

    const queryPromise = query;
    const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      logger.error("Supabase query error", error);

      // Handle specific timeout errors more gracefully
      if (error.code === "57014") {
        return NextResponse.json({
          providers: [],
          totalCount: 0,
          error: "Search timeout - please try a more specific search or filter",
        });
      }

      throw error;
    }

    const loadTime = Date.now() - startTime;
    logger.debug(`✅ Found ${data?.length || 0} providers (${count} total) in ${loadTime}ms`);

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

    return NextResponse.json({
      providers,
      totalCount: count ?? 0,
      loadTimeMs: Date.now() - startTime,
    });
  } catch (e: any) {
    const loadTime = Date.now() - startTime;
    logger.error("Provider search failed", e, { loadTime });

    // Return more specific error messages
    let errorMessage = "Search failed";

    if (e.message?.includes("timeout")) {
      errorMessage = "Search timeout - please try a more specific search";
    } else if (e.code === "57014") {
      errorMessage = "Database timeout - please try filtering your search";
    }

    return NextResponse.json(
      {
        providers: [],
        totalCount: 0,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? e.toString() : undefined,
      },
      { status: 500 }
    );
  }
}
