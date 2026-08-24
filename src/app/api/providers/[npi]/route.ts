// src/app/api/providers/[npi]/route.ts
// Fetch individual provider from NPI Registry API
import { NextRequest, NextResponse } from "next/server";

const NPI_API_BASE = "https://npiregistry.cms.hhs.gov/api/";

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
      address_2?: string;
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ npi: string }> }
) {
  const { npi } = await context.params;

  // Validate NPI format (10 digits)
  if (!/^\d{10}$/.test(npi)) {
    return NextResponse.json({ error: "Invalid NPI format" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      version: "2.1",
      number: npi,
    });

    const response = await fetch(`${NPI_API_BASE}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`NPI API error: ${response.status}`);
    }

    const data: NPIResult = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const npiResult = data.results[0];
    const practiceAddress = npiResult.addresses?.find(
      (a) => a.address_purpose === "LOCATION"
    ) || npiResult.addresses?.[0];

    const primaryTaxonomy = npiResult.taxonomies?.find((t) => t.primary) || npiResult.taxonomies?.[0];

    // Check if this is a psychiatrist
    const isPsychiatrist = npiResult.taxonomies?.some(
      (t) => t.desc?.toLowerCase().includes("psychiatry") || t.code?.startsWith("2084")
    );

    if (!isPsychiatrist) {
      return NextResponse.json({ error: "Provider is not a psychiatrist" }, { status: 404 });
    }

    // Transform to provider format expected by the detail page
    const provider = {
      npi: npiResult.number,
      slug: `dr-${npiResult.basic.first_name}-${npiResult.basic.last_name}-${npiResult.number}`.toLowerCase().replace(/\s+/g, "-"),
      type: "provider",
      status: "active",
      title: `${npiResult.basic.first_name} ${npiResult.basic.last_name}, ${npiResult.basic.credential || "MD"}`,
      description: `${primaryTaxonomy?.desc || "Psychiatrist"} in ${practiceAddress?.city || "Unknown"}, ${practiceAddress?.state || ""}`,
      data: {
        full_name: `${npiResult.basic.first_name} ${npiResult.basic.last_name}, ${npiResult.basic.credential || "MD"}`,
        credentials: npiResult.basic.credential || "MD",
        gender: npiResult.basic.gender,
        specialties: npiResult.taxonomies?.map((t) => t.desc).filter(Boolean) || ["Psychiatry"],
        subspecialties: npiResult.taxonomies
          ?.filter((t) => !t.primary)
          .map((t) => t.desc)
          .filter(Boolean) || [],
        address: practiceAddress ? {
          street: [practiceAddress.address_1, practiceAddress.address_2].filter(Boolean).join(", "),
          city: practiceAddress.city,
          state: practiceAddress.state,
          zip: practiceAddress.postal_code?.substring(0, 5),
        } : null,
        phone: practiceAddress?.telephone_number || null,
        license_state: primaryTaxonomy?.state || practiceAddress?.state || null,
        license_number: primaryTaxonomy?.license || null,
        enumeration_date: npiResult.basic.enumeration_date,
        // Fields that would come from enhanced data (not in NPI registry)
        bio: null,
        medical_school: null,
        residency: null,
        fellowship: null,
        practice_name: null,
        website: null,
        insurance_accepted: null,
        languages: null,
        treatment_approaches: null,
        treatment_philosophy: null,
        hospital_affiliations: null,
        research_interests: null,
        online_presence: null,
      },
      metadata: {
        npi: npiResult.number,
        source: "npi-registry",
        taxonomy_code: primaryTaxonomy?.code,
      },
    };

    // Cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

    return NextResponse.json({ provider }, { headers });
  } catch (e: any) {
    console.error("NPI lookup failed:", e);
    return NextResponse.json(
      { error: "Provider lookup temporarily unavailable" },
      { status: 500 }
    );
  }
}
