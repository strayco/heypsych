// src/app/api/architect/products/route.ts
// API route for loading Architect product data
//
// PUBLICATION SAFETY: Only returns publishable products that pass the publication gate.
// Uses the same rules as public clinician product pages.

import { NextResponse, type NextRequest } from "next/server";
import { ArchitectProductService, type ArchitectProductDisplay } from "@/domains/architect/services";
import type { ProductArchitectureMetadata } from "@/domains/architect/schemas";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";

// Maximum products per request to prevent payload bloat
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// In development, clear caches on each request to ensure fresh data
// This prevents stale data when editing tool files or allowlists
const isDev = process.env.NODE_ENV === "development";

export interface ArchitectProductsResponse {
  products: Array<{
    slug: string;
    metadata: ProductArchitectureMetadata;
    display: ArchitectProductDisplay;
  }>;
  count: number;
  total: number;
  hasMore: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse<ArchitectProductsResponse>> {
  try {
    // In development, clear caches to ensure fresh data after file edits
    if (isDev) {
      ClinicianToolService.clearCache();
      ArchitectProductService.clearCache();
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const capability = searchParams.get("capability");
    const category = searchParams.get("category");

    const { metadataMap, displayMap } = await ArchitectProductService.loadProducts();

    // Convert maps to array for JSON serialization
    let products: ArchitectProductsResponse["products"] = [];

    for (const [slug, metadata] of metadataMap) {
      const display = displayMap.get(slug);
      if (display) {
        // Filter by capability if specified
        if (capability && !metadata.capabilities.some(c => c.capabilityId === capability)) {
          continue;
        }
        // Filter by category if specified
        if (category && display.category !== category) {
          continue;
        }
        products.push({ slug, metadata, display });
      }
    }

    const total = products.length;

    // Apply pagination
    products = products.slice(offset, offset + limit);

    // Set cache headers for efficient caching (products change infrequently)
    const response = NextResponse.json({
      products,
      count: products.length,
      total,
      hasMore: offset + products.length < total,
    });

    // In production: Cache for 5 minutes, stale-while-revalidate for 10 minutes
    // In development: No caching to ensure fresh data
    if (isDev) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    } else {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600"
      );
    }

    return response;
  } catch (error) {
    console.error("[API] Failed to load architect products:", error);
    return NextResponse.json(
      { products: [], count: 0, total: 0, hasMore: false },
      { status: 500 }
    );
  }
}
