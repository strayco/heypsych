/**
 * Programmatic Page Generator
 *
 * This module generates data for thousands of long-tail pages that
 * target specific search queries. Each page is technically unique
 * and provides value, avoiding thin content penalties.
 *
 * PAGE TYPES:
 * 1. "[Tool] Alternative" - Intercept competitor brand searches
 * 2. "[Tool] Pricing" - High commercial intent
 * 3. "[Tool] vs [Tool]" - Comparison queries (80+ existing)
 * 4. "Best [Category] for [Specialty]" - Long-tail combinations
 * 5. "[Tool] for [Use Case]" - Feature-specific landing pages
 * 6. "[Category] [Year]" - Time-sensitive ranking pages
 *
 * SCALE: This can generate 1000+ unique pages from existing data
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const CURRENT_YEAR = new Date().getFullYear();

// Specialties that practices serve
const SPECIALTIES = [
  "Psychiatrists",
  "Psychologists",
  "Therapists",
  "Counselors",
  "Social Workers",
  "Psychiatric NPs",
  "Group Practices",
  "Solo Practitioners",
  "Telehealth Practices",
  "Child Psychiatrists",
  "Addiction Specialists",
  "Eating Disorder Specialists",
  "Trauma Therapists",
  "Couples Therapists",
  "ADHD Specialists",
];

// Tool categories
const CATEGORIES = [
  "EHR Software",
  "Practice Management",
  "Billing Software",
  "Telehealth Platforms",
  "AI Scribes",
  "Patient Portals",
  "Scheduling Software",
  "Insurance Verification",
  "Outcome Tracking",
  "E-Prescribing",
];

// Use cases / features
const USE_CASES = [
  "insurance billing",
  "telehealth",
  "patient scheduling",
  "progress notes",
  "treatment planning",
  "outcome measurement",
  "e-prescribing",
  "patient intake",
  "superbills",
  "claims submission",
  "appointment reminders",
  "HIPAA compliance",
  "group therapy",
  "couples therapy",
  "child therapy",
];

// Practice sizes
const PRACTICE_SIZES = [
  "Solo Practice",
  "Small Group (2-5)",
  "Medium Group (6-20)",
  "Large Group (20+)",
  "Enterprise",
];

// =============================================================================
// PAGE GENERATORS
// =============================================================================

export interface ProgrammaticPage {
  slug: string;
  type: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  breadcrumbs: Array<{ name: string; url: string }>;
  relatedPages: string[];
}

/**
 * Generate all "Best [Category] for [Specialty]" pages
 * Example: "Best EHR Software for Psychiatrists"
 */
export function generateBestForSpecialtyPages(): ProgrammaticPage[] {
  const pages: ProgrammaticPage[] = [];

  for (const category of CATEGORIES) {
    for (const specialty of SPECIALTIES) {
      const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
      const specialtySlug = specialty.toLowerCase().replace(/\s+/g, "-");
      const slug = `best-${categorySlug}-for-${specialtySlug}`;

      pages.push({
        slug,
        type: "best-for-specialty",
        title: `Best ${category} for ${specialty} (${CURRENT_YEAR}) | Top Picks`,
        h1: `Best ${category} for ${specialty}`,
        description: `Compare the best ${category.toLowerCase()} options for ${specialty.toLowerCase()}. See pricing, features, and real reviews from mental health professionals. Updated ${CURRENT_YEAR}.`,
        keywords: [
          `best ${category.toLowerCase()} for ${specialty.toLowerCase()}`,
          `${specialty.toLowerCase()} ${category.toLowerCase()}`,
          `${category.toLowerCase()} ${specialty.toLowerCase()} ${CURRENT_YEAR}`,
          `top ${category.toLowerCase()} ${specialty.toLowerCase()}`,
          `${specialty.toLowerCase()} software`,
          `${category.toLowerCase()} mental health`,
        ],
        breadcrumbs: [
          { name: "Tools", url: "/tools/" },
          { name: "For Clinicians", url: "/tools/for-clinicians/" },
          { name: category, url: `/tools/for-clinicians/${categorySlug}/` },
          { name: `For ${specialty}`, url: `/tools/best-for/${specialtySlug}/` },
        ],
        relatedPages: SPECIALTIES
          .filter((s) => s !== specialty)
          .slice(0, 4)
          .map((s) => `best-${categorySlug}-for-${s.toLowerCase().replace(/\s+/g, "-")}`),
      });
    }
  }

  return pages;
}

/**
 * Generate all "Best [Category] for [Use Case]" pages
 * Example: "Best EHR Software for Insurance Billing"
 */
export function generateBestForUseCasePages(): ProgrammaticPage[] {
  const pages: ProgrammaticPage[] = [];

  for (const category of CATEGORIES) {
    for (const useCase of USE_CASES) {
      const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
      const useCaseSlug = useCase.toLowerCase().replace(/\s+/g, "-");
      const slug = `best-${categorySlug}-for-${useCaseSlug}`;

      pages.push({
        slug,
        type: "best-for-usecase",
        title: `Best ${category} for ${useCase.charAt(0).toUpperCase() + useCase.slice(1)} (${CURRENT_YEAR})`,
        h1: `Best ${category} for ${useCase.charAt(0).toUpperCase() + useCase.slice(1)}`,
        description: `Find the best ${category.toLowerCase()} with strong ${useCase} features. Compare options, see pricing, and choose the right fit. Updated ${CURRENT_YEAR}.`,
        keywords: [
          `best ${category.toLowerCase()} ${useCase}`,
          `${category.toLowerCase()} with ${useCase}`,
          `${useCase} ${category.toLowerCase()}`,
          `${category.toLowerCase()} ${useCase} features`,
        ],
        breadcrumbs: [
          { name: "Tools", url: "/tools/" },
          { name: "For Clinicians", url: "/tools/for-clinicians/" },
          { name: category, url: `/tools/for-clinicians/${categorySlug}/` },
        ],
        relatedPages: [],
      });
    }
  }

  return pages;
}

/**
 * Generate all "Best [Category] for [Practice Size]" pages
 * Example: "Best EHR Software for Solo Practice"
 */
export function generateBestForPracticeSizePages(): ProgrammaticPage[] {
  const pages: ProgrammaticPage[] = [];

  for (const category of CATEGORIES) {
    for (const size of PRACTICE_SIZES) {
      const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
      const sizeSlug = size.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const slug = `best-${categorySlug}-for-${sizeSlug}`;

      pages.push({
        slug,
        type: "best-for-size",
        title: `Best ${category} for ${size} (${CURRENT_YEAR}) | Pricing & Reviews`,
        h1: `Best ${category} for ${size}`,
        description: `Find the best ${category.toLowerCase()} for ${size.toLowerCase()} mental health practices. See pricing that fits your size and budget. Updated ${CURRENT_YEAR}.`,
        keywords: [
          `best ${category.toLowerCase()} ${size.toLowerCase()}`,
          `${category.toLowerCase()} for ${size.toLowerCase()}`,
          `${size.toLowerCase()} ${category.toLowerCase()}`,
          `affordable ${category.toLowerCase()} ${size.toLowerCase()}`,
        ],
        breadcrumbs: [
          { name: "Tools", url: "/tools/" },
          { name: "For Clinicians", url: "/tools/for-clinicians/" },
          { name: category, url: `/tools/for-clinicians/${categorySlug}/` },
        ],
        relatedPages: [],
      });
    }
  }

  return pages;
}

/**
 * Generate "[Category] [Year]" pages for freshness
 * Example: "Best EHR Software 2026"
 */
export function generateYearPages(): ProgrammaticPage[] {
  return CATEGORIES.map((category) => {
    const categorySlug = category.toLowerCase().replace(/\s+/g, "-");

    return {
      slug: `best-${categorySlug}-${CURRENT_YEAR}`,
      type: "year-page",
      title: `Best ${category} ${CURRENT_YEAR}: Complete Guide & Rankings`,
      h1: `Best ${category} ${CURRENT_YEAR}`,
      description: `The definitive guide to ${category.toLowerCase()} in ${CURRENT_YEAR}. See our rankings, pricing updates, and new features. Updated monthly.`,
      keywords: [
        `best ${category.toLowerCase()} ${CURRENT_YEAR}`,
        `top ${category.toLowerCase()} ${CURRENT_YEAR}`,
        `${category.toLowerCase()} ${CURRENT_YEAR}`,
        `${category.toLowerCase()} rankings ${CURRENT_YEAR}`,
        `new ${category.toLowerCase()} ${CURRENT_YEAR}`,
      ],
      breadcrumbs: [
        { name: "Tools", url: "/tools/" },
        { name: "For Clinicians", url: "/tools/for-clinicians/" },
        { name: `${category} ${CURRENT_YEAR}`, url: `/tools/best/${categorySlug}-${CURRENT_YEAR}/` },
      ],
      relatedPages: [],
    };
  });
}

/**
 * Generate "Free [Category]" pages
 * Example: "Free EHR Software for Therapists"
 */
export function generateFreePages(): ProgrammaticPage[] {
  const pages: ProgrammaticPage[] = [];

  for (const category of CATEGORIES) {
    const categorySlug = category.toLowerCase().replace(/\s+/g, "-");

    pages.push({
      slug: `free-${categorySlug}`,
      type: "free-page",
      title: `Free ${category} (${CURRENT_YEAR}): Best No-Cost Options`,
      h1: `Free ${category} for Mental Health Practices`,
      description: `Find completely free ${category.toLowerCase()} options for your practice. No credit card, no trial - actually free. Updated ${CURRENT_YEAR}.`,
      keywords: [
        `free ${category.toLowerCase()}`,
        `${category.toLowerCase()} free`,
        `free ${category.toLowerCase()} for therapists`,
        `no cost ${category.toLowerCase()}`,
        `${category.toLowerCase()} free trial`,
        `open source ${category.toLowerCase()}`,
      ],
      breadcrumbs: [
        { name: "Tools", url: "/tools/" },
        { name: "For Clinicians", url: "/tools/for-clinicians/" },
        { name: `Free ${category}`, url: `/tools/free/${categorySlug}/` },
      ],
      relatedPages: [],
    });
  }

  return pages;
}

/**
 * Generate all pages
 */
export function generateAllProgrammaticPages(): ProgrammaticPage[] {
  return [
    ...generateBestForSpecialtyPages(),      // ~150 pages
    ...generateBestForUseCasePages(),         // ~150 pages
    ...generateBestForPracticeSizePages(),    // ~50 pages
    ...generateYearPages(),                    // ~10 pages
    ...generateFreePages(),                    // ~10 pages
  ];
}

/**
 * Get page count summary
 */
export function getPageCountSummary(): Record<string, number> {
  return {
    "best-for-specialty": generateBestForSpecialtyPages().length,
    "best-for-usecase": generateBestForUseCasePages().length,
    "best-for-size": generateBestForPracticeSizePages().length,
    "year-pages": generateYearPages().length,
    "free-pages": generateFreePages().length,
    total: generateAllProgrammaticPages().length,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const ProgrammaticPages = {
  generateBestForSpecialtyPages,
  generateBestForUseCasePages,
  generateBestForPracticeSizePages,
  generateYearPages,
  generateFreePages,
  generateAllProgrammaticPages,
  getPageCountSummary,
  SPECIALTIES,
  CATEGORIES,
  USE_CASES,
  PRACTICE_SIZES,
};

export default ProgrammaticPages;
