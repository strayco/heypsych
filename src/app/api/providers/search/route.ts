// src/app/api/providers/search/route.ts
// Uses NPI Registry API directly - no database storage needed
import { NextRequest, NextResponse } from "next/server";

// NPI Registry API - free, public, always up-to-date
const NPI_API_BASE = "https://npiregistry.cms.hhs.gov/api/";

// Psychiatry taxonomy codes - maps UI specialty names to NPI taxonomy descriptions
const SPECIALTY_TO_DESCRIPTION: Record<string, string> = {
  "general_psychiatry": "Psychiatry",
  "psychiatry": "Psychiatry",
  "child_adolescent": "Child & Adolescent Psychiatry",
  "child/adolescent": "Child & Adolescent Psychiatry",
  "geriatric_psychiatry": "Geriatric Psychiatry",
  "geriatric": "Geriatric Psychiatry",
  "addiction_psychiatry": "Addiction Psychiatry",
  "addiction": "Addiction Psychiatry",
  "forensic_psychiatry": "Forensic Psychiatry",
  "forensic": "Forensic Psychiatry",
  "consultation_liaison": "Psychiatry",
  "psychosomatic": "Psychiatry",
};

function getTaxonomyDescription(code: string): string {
  const descriptions: Record<string, string> = {
    "2084P0800X": "Psychiatry",
    "2084P0804X": "Child & Adolescent Psychiatry",
    "2084P0805X": "Geriatric Psychiatry",
    "2084P0015X": "Addiction Psychiatry",
    "2084P0802X": "Forensic Psychiatry",
  };
  return descriptions[code] || "Psychiatry";
}

interface NPIResult {
  result_count: number;
  results: Array<{
    number: string;
    basic: {
      first_name: string;
      last_name: string;
      credential: string;
      gender: string;
      enumeration_date: string;
    };
    addresses: Array<{
      address_purpose: string;
      address_1: string;
      city: string;
      state: string;
      postal_code: string;
      telephone_number: string;
    }>;
    taxonomies: Array<{
      code: string;
      desc: string;
      primary: boolean;
      state: string;
      license: string;
    }>;
  }>;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 200);
    const offset = Number(searchParams.get("offset")) || 0;
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const zip = searchParams.get("zip");
    const q = searchParams.get("q");
    const specialization = searchParams.get("specialization");
    const skip = Math.floor(offset / limit) + 1; // NPI uses page numbers

    // Build NPI API query
    const params = new URLSearchParams({
      version: "2.1",
      enumeration_type: "NPI-1", // Individual providers only
      limit: String(limit),
      skip: String(skip),
    });

    // Specialty filter - use specific taxonomy description if provided
    if (specialization) {
      const specialties = specialization.split(",").map(s => s.trim().toLowerCase().replace(/\s+/g, "_"));
      // Use the first specialty's description for the API
      const description = SPECIALTY_TO_DESCRIPTION[specialties[0]];
      if (description) {
        params.append("taxonomy_description", description);
      } else {
        params.append("taxonomy_description", "Psychiatry");
      }
    } else {
      // Default to all psychiatrists
      params.append("taxonomy_description", "Psychiatry");
    }

    // Location filters
    if (state) {
      params.append("state", state.toUpperCase());
    }
    if (city) {
      params.append("city", city);
    }
    if (zip) {
      params.append("postal_code", zip);
    }

    // Name search
    if (q) {
      const nameParts = q.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        params.append("first_name", nameParts[0] + "*");
        params.append("last_name", nameParts.slice(1).join(" ") + "*");
      } else {
        params.append("last_name", nameParts[0] + "*");
      }
    }

    // Debug: console.log("NPI API query:", Object.fromEntries(params));

    // Fetch from NPI Registry
    const response = await fetch(`${NPI_API_BASE}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`NPI API error: ${response.status}`);
    }

    const data: NPIResult = await response.json();

    // Transform NPI results to our format
    const providers = (data.results || []).map((npi) => {
      const practiceAddress = npi.addresses?.find(
        (a) => a.address_purpose === "LOCATION"
      ) || npi.addresses?.[0];

      const primaryTaxonomy = npi.taxonomies?.find((t) => t.primary) || npi.taxonomies?.[0];

      // Map taxonomy to specialty
      const specialties = npi.taxonomies
        ?.map((t) => t.desc)
        .filter(Boolean) || ["Psychiatry"];

      return {
        npi: npi.number,
        slug: `dr-${npi.basic.first_name}-${npi.basic.last_name}-${npi.number}`.toLowerCase().replace(/\s+/g, "-"),
        name: {
          first: npi.basic.first_name || "",
          last: npi.basic.last_name || "",
          suffix: null,
          credential: npi.basic.credential || "MD",
        },
        taxonomy: {
          primary: {
            code: primaryTaxonomy?.code || null,
            specialization: primaryTaxonomy?.desc || "Psychiatry",
          },
        },
        specialties,
        business: {
          practiceAddress: {
            city: practiceAddress?.city || "",
            state: practiceAddress?.state || "",
          },
          phone: practiceAddress?.telephone_number || null,
        },
      };
    });

    const loadTime = Date.now() - startTime;

    // console.log(`NPI search: ${providers.length} results in ${loadTime}ms`);

    // Cache at edge
    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

    return NextResponse.json(
      {
        providers,
        totalCount: data.result_count || 0,
        loadTimeMs: loadTime,
        source: "npi-registry",
      },
      { headers }
    );
  } catch (e: any) {
    console.error("NPI search failed:", e);

    return NextResponse.json(
      {
        providers: [],
        totalCount: 0,
        error: "Search temporarily unavailable",
      },
      { status: 500 }
    );
  }
}
