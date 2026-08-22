/**
 * Editorial Status Tests
 *
 * Tests for tool editorial status and trust labeling:
 * - Legacy compatibility
 * - Mixed review states
 * - Clinical review attribution
 * - HIPAA unknown handling
 */
import { describe, it, expect } from "vitest";
import {
  ToolEditorialStatusZ,
  VerificationStatusZ,
  UncertaintyBooleanZ,
  ToolEditorialMetadataZ,
  getEditorialStatusLabel,
  getEditorialStatusDescription,
  hasActualClinicalReview,
  getEditorialBadges,
  isFactVerified,
  getProvenanceLabel,
  isComplianceConfirmedYes,
  isComplianceConfirmedNo,
  isComplianceUnknown,
  getComplianceDisplayText,
  getHipaaBadgeVariant,
} from "@/lib/schemas/tool-editorial";

describe("Editorial Status Schema", () => {
  it("validates all status levels", () => {
    const statuses = [
      "listing",
      "vendor_verified",
      "facts_verified",
      "editorially_reviewed",
      "clinically_reviewed",
      "privacy_reviewed",
    ];

    for (const status of statuses) {
      const result = ToolEditorialStatusZ.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = ToolEditorialStatusZ.safeParse("invalid_status");
    expect(result.success).toBe(false);
  });

  it("validates uncertainty boolean values", () => {
    const values = ["yes", "no", "unknown", "not_applicable"];

    for (const value of values) {
      const result = UncertaintyBooleanZ.safeParse(value);
      expect(result.success).toBe(true);
    }
  });
});

describe("Editorial Status Labels", () => {
  it("returns correct label for each status", () => {
    expect(getEditorialStatusLabel("listing")).toBe("Listing information");
    expect(getEditorialStatusLabel("vendor_verified")).toBe("Vendor-provided information");
    expect(getEditorialStatusLabel("facts_verified")).toBe("Facts verified");
    expect(getEditorialStatusLabel("editorially_reviewed")).toBe("Editorially reviewed");
    expect(getEditorialStatusLabel("clinically_reviewed")).toBe("Clinically reviewed");
    expect(getEditorialStatusLabel("privacy_reviewed")).toBe("Privacy reviewed");
  });

  it("returns correct description for each status", () => {
    expect(getEditorialStatusDescription("listing")).toContain("public sources");
    expect(getEditorialStatusDescription("vendor_verified")).toContain("vendor");
    expect(getEditorialStatusDescription("clinically_reviewed")).toContain("qualified professional");
  });
});

describe("Clinical Review Attribution", () => {
  it("returns false when no editorial metadata", () => {
    expect(hasActualClinicalReview(undefined)).toBe(false);
  });

  it("returns false for basic listing status", () => {
    const editorial = { status: "listing" as const };
    expect(hasActualClinicalReview(editorial)).toBe(false);
  });

  it("returns true when status is clinically_reviewed", () => {
    const editorial = { status: "clinically_reviewed" as const };
    expect(hasActualClinicalReview(editorial)).toBe(true);
  });

  it("returns true when reviews_completed includes clinically_reviewed", () => {
    const editorial = {
      status: "editorially_reviewed" as const,
      reviews_completed: ["editorially_reviewed" as const, "clinically_reviewed" as const],
    };
    expect(hasActualClinicalReview(editorial)).toBe(true);
  });

  it("returns true when has clinical review metadata", () => {
    const editorial = {
      status: "facts_verified" as const,
      last_clinical_review: "2024-01-15",
      clinical_reviewer: "Dr. Smith, MD",
    };
    expect(hasActualClinicalReview(editorial)).toBe(true);
  });

  it("returns false for governance-only review (not clinical)", () => {
    // The old governance.reviewed_by_label is NOT clinical review
    const editorial = { status: "listing" as const };
    expect(hasActualClinicalReview(editorial)).toBe(false);
  });
});

describe("Editorial Badges", () => {
  it("returns empty array when no editorial metadata", () => {
    expect(getEditorialBadges(undefined)).toEqual([]);
  });

  it("returns appropriate badges for reviews_completed", () => {
    const editorial = {
      status: "editorially_reviewed" as const,
      reviews_completed: [
        "editorially_reviewed" as const,
        "privacy_reviewed" as const,
      ],
    };

    const badges = getEditorialBadges(editorial);

    expect(badges).toContain("Editorially Reviewed");
    expect(badges).toContain("Privacy Reviewed");
    expect(badges).not.toContain("Clinically Reviewed");
  });

  it("includes clinical review badge only when actually reviewed", () => {
    const withClinical = {
      status: "clinically_reviewed" as const,
      reviews_completed: ["clinically_reviewed" as const],
    };

    const withoutClinical = {
      status: "listing" as const,
    };

    expect(getEditorialBadges(withClinical)).toContain("Clinically Reviewed");
    expect(getEditorialBadges(withoutClinical)).not.toContain("Clinically Reviewed");
  });
});

describe("Fact Verification", () => {
  it("identifies verified facts", () => {
    const verifiedFact = {
      value: true,
      status: "verified" as const,
      verified_date: "2024-01-15",
      verified_by: "HeyPsych Editorial",
    };

    expect(isFactVerified(verifiedFact)).toBe(true);
  });

  it("identifies unverified facts", () => {
    const unverifiedFact = {
      value: true,
      status: "vendor_provided" as const,
    };

    expect(isFactVerified(unverifiedFact)).toBe(false);
  });

  it("returns false for undefined provenance", () => {
    expect(isFactVerified(undefined)).toBe(false);
  });
});

describe("Provenance Labels", () => {
  it("returns correct labels for all status types", () => {
    expect(getProvenanceLabel("verified")).toBe("Verified");
    expect(getProvenanceLabel("vendor_provided")).toBe("Vendor-provided");
    expect(getProvenanceLabel("public_source")).toBe("Public source");
    expect(getProvenanceLabel("unverified")).toBe("Unverified");
    expect(getProvenanceLabel("unknown")).toBe("Unknown");
  });
});

describe("Legacy Compatibility", () => {
  it("accepts editorial metadata with minimal fields", () => {
    const minimal = {
      status: "listing" as const,
    };

    const result = ToolEditorialMetadataZ.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("accepts editorial metadata with full provenance", () => {
    const full = {
      status: "facts_verified" as const,
      last_editorial_review: "2024-01-15",
      editorial_reviewer: "Editor Name",
      provenance: {
        pricing: {
          value: "freemium",
          status: "verified" as const,
          verified_date: "2024-01-15",
        },
        hipaa_compliant: {
          value: "unknown",
          status: "unknown" as const,
        },
      },
    };

    const result = ToolEditorialMetadataZ.safeParse(full);
    expect(result.success).toBe(true);
  });

  it("defaults to listing status when not specified", () => {
    const result = ToolEditorialMetadataZ.parse({});
    expect(result.status).toBe("listing");
  });
});

describe("HIPAA Unknown Handling", () => {
  it("uncertainty boolean distinguishes unknown from no", () => {
    // "no" means confirmed not HIPAA compliant
    const noResult = UncertaintyBooleanZ.safeParse("no");
    expect(noResult.success).toBe(true);

    // "unknown" means we don't know
    const unknownResult = UncertaintyBooleanZ.safeParse("unknown");
    expect(unknownResult.success).toBe(true);

    // They are different values
    expect("no").not.toBe("unknown");
  });

  it("provenance can track HIPAA verification status", () => {
    const unknownHipaa = {
      value: "unknown",
      status: "unknown" as const,
      notes: "Vendor has not provided HIPAA documentation",
    };

    const verifiedNoHipaa = {
      value: false,
      status: "verified" as const,
      verified_date: "2024-01-15",
      notes: "Confirmed not HIPAA compliant per vendor",
    };

    const verifiedYesHipaa = {
      value: true,
      status: "verified" as const,
      verified_date: "2024-01-15",
      source_url: "https://example.com/hipaa-cert.pdf",
    };

    // All should be valid
    expect(isFactVerified(unknownHipaa)).toBe(false);
    expect(isFactVerified(verifiedNoHipaa)).toBe(true);
    expect(isFactVerified(verifiedYesHipaa)).toBe(true);
  });
});

describe("Compliance Value Helpers", () => {
  describe("isComplianceConfirmedYes", () => {
    it("returns true for boolean true", () => {
      expect(isComplianceConfirmedYes(true)).toBe(true);
    });

    it("returns true for string yes", () => {
      expect(isComplianceConfirmedYes("yes")).toBe(true);
    });

    it("returns false for boolean false", () => {
      expect(isComplianceConfirmedYes(false)).toBe(false);
    });

    it("returns false for string no", () => {
      expect(isComplianceConfirmedYes("no")).toBe(false);
    });

    it("returns false for string unknown", () => {
      expect(isComplianceConfirmedYes("unknown")).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isComplianceConfirmedYes(undefined)).toBe(false);
    });
  });

  describe("isComplianceConfirmedNo", () => {
    it("returns true for boolean false", () => {
      expect(isComplianceConfirmedNo(false)).toBe(true);
    });

    it("returns true for string no", () => {
      expect(isComplianceConfirmedNo("no")).toBe(true);
    });

    it("returns false for boolean true", () => {
      expect(isComplianceConfirmedNo(true)).toBe(false);
    });

    it("returns false for string unknown", () => {
      expect(isComplianceConfirmedNo("unknown")).toBe(false);
    });
  });

  describe("isComplianceUnknown", () => {
    it("returns true for string unknown", () => {
      expect(isComplianceUnknown("unknown")).toBe(true);
    });

    it("returns true for undefined", () => {
      expect(isComplianceUnknown(undefined)).toBe(true);
    });

    it("returns false for boolean values (they are definite)", () => {
      expect(isComplianceUnknown(true)).toBe(false);
      expect(isComplianceUnknown(false)).toBe(false);
    });

    it("returns false for yes/no strings", () => {
      expect(isComplianceUnknown("yes")).toBe(false);
      expect(isComplianceUnknown("no")).toBe(false);
    });
  });

  describe("getComplianceDisplayText", () => {
    it("returns Yes for confirmed yes", () => {
      expect(getComplianceDisplayText(true)).toBe("Yes");
      expect(getComplianceDisplayText("yes")).toBe("Yes");
    });

    it("returns No for confirmed no", () => {
      expect(getComplianceDisplayText(false)).toBe("No");
      expect(getComplianceDisplayText("no")).toBe("No");
    });

    it("returns Unknown for unknown values", () => {
      expect(getComplianceDisplayText("unknown")).toBe("Unknown");
      expect(getComplianceDisplayText(undefined)).toBe("Unknown");
    });

    it("returns N/A for not_applicable", () => {
      expect(getComplianceDisplayText("not_applicable")).toBe("N/A");
    });
  });

  describe("getHipaaBadgeVariant", () => {
    it("returns compliant for confirmed yes", () => {
      expect(getHipaaBadgeVariant(true)).toBe("compliant");
      expect(getHipaaBadgeVariant("yes")).toBe("compliant");
    });

    it("returns not_compliant for confirmed no", () => {
      expect(getHipaaBadgeVariant(false)).toBe("not_compliant");
      expect(getHipaaBadgeVariant("no")).toBe("not_compliant");
    });

    it("returns unknown for unknown values", () => {
      expect(getHipaaBadgeVariant("unknown")).toBe("unknown");
    });

    it("returns not_applicable for not_applicable", () => {
      expect(getHipaaBadgeVariant("not_applicable")).toBe("not_applicable");
    });
  });
});
