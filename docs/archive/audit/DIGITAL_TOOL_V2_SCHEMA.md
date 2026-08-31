# Digital Tool V2 Schema - Official Template

**Status**: FROZEN
**Version**: 2.0
**Last Updated**: December 9, 2025
**Canonical Reference**: [Headspace V2 JSON](/data/resources/digital-tools/headspace.json)

---

## Overview

This document defines the official V2 schema for all digital mental health tools in the HeyPsych directory. The schema is **frozen** based on Headspace as the canonical "Bible" template.

## Design Principles

1. **Medications V2 Pattern**: Mirrors medication JSON structure (clinical_metadata, privacy_rating, sections, faqs)
2. **JSON-First**: No database schema changes required
3. **Backwards Compatible**: V1 tools continue working via fallback
4. **Section-Based Rendering**: Each section type has a specialized component
5. **E-A-T Compliant**: Clinical evidence, citations, editorial metadata
6. **schema.org Markup**: SoftwareApplication + FAQPage schemas

---

## Required Fields

### Core Identity
```json
{
  "kind": "resource",
  "slug": "tool-name",
  "type": "digital-tool",
  "name": "Tool Name",
  "version": "2.0",
  "lifecycle_state": "published"
}
```

### Summaries
```json
{
  "summary": "One-line summary with rating (30-60 chars)",
  "description": "Detailed description for SEO (150-200 chars)",
  "patient_summary": "Plain-language explanation of what the tool does, who it's for, and what it's NOT (100-150 words)"
}
```

### Metadata
```json
{
  "metadata": {
    "category": "digital-tools",
    "app_category": "Meditation & Mindfulness | Sleep | Mood Tracking | etc.",
    "platforms": ["iOS", "Android", "Web"],
    "publisher": "Company Name",
    "release_date": "YYYY-MM-DD",
    "latest_version": "X.Y.Z",
    "last_updated": "YYYY-MM-DD",
    "app_size": "XXX MB",
    "content_rating": "4+ | 12+ | 17+",
    "languages": ["English", "Spanish", ...],
    "system_requirements": "iOS X.X+ or Android X.X+",
    "offline_access": true | false,
    "data_export": true | false,
    "privacy_certified": true | false,
    "hipaa_compliant": true | false,
    "free_tier_available": true | false
  }
}
```

### Ratings
```json
{
  "app_rating": 4.8,
  "total_reviews": 1200000,
  "rating_breakdown": {
    "five_star": 800000,
    "four_star": 280000,
    "three_star": 80000,
    "two_star": 25000,
    "one_star": 15000
  }
}
```

---

## Clinical Metadata (Required)

Following Medications V2 pattern:

```json
{
  "clinical_metadata": {
    "evidence_based": true | false,
    "evidence_level": "high" | "moderate" | "low" | "anecdotal",

    "clinical_trials": [
      {
        "study": "Brief description of study",
        "citation": {
          "authors": "LastName F, LastName F, et al.",
          "title": "Full study title",
          "journal": "Journal Name",
          "year": 2024,
          "volume": "X",
          "issue": "Y",
          "pages": "XXX-YYY",
          "doi": "10.XXXX/...",
          "pmid": "12345678",
          "url": "https://..."
        },
        "outcome": "Key findings and outcomes",
        "sample_size": 238,
        "study_design": "RCT" | "meta-analysis" | "observational" | "case study"
      }
    ],

    "primary_uses": [
      "Use case 1",
      "Use case 2",
      "Use case 3"
    ],

    "linked_conditions": [
      {
        "slug": "condition-slug",
        "relationship": "supportive" | "adjunctive" | "complementary" | "investigational",
        "context": "Explanation of how this tool relates to this condition (2-3 sentences)",
        "evidence_level": "high" | "moderate" | "low" | "anecdotal"
      }
    ],

    "contraindications": [
      "When NOT to use this tool",
      "Safety warnings",
      "Important limitations"
    ],

    "efficacy_data": {
      "metric": "What was measured (e.g., stress reduction after 10 days)",
      "percentage_value": "14%" | "Significant" | "Validated",
      "comparison_data": "Control group or comparison",
      "patient_text": "Plain-language explanation of the efficacy data",
      "citation_tag": "Author YEAR"
    },

    "target_population": {
      "age_min": 13,
      "conditions": ["Condition 1", "Condition 2"],
      "severity_levels": ["mild", "moderate", "severe"],
      "exclusions": ["Who should NOT use this tool"]
    }
  }
}
```

---

## Privacy Rating (Required)

```json
{
  "privacy_rating": {
    "grade": "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F",
    "data_collected": [
      "Email address",
      "Usage data",
      "etc."
    ],
    "data_shared": [
      "Who data is shared with"
    ],
    "data_sold": true | false,
    "encryption": true | false,
    "gdpr_compliant": true | false,
    "ccpa_compliant": true | false,
    "certification": "Relevant certifications or compliance statements"
  }
}
```

### Privacy Grade Guidelines
- **A+ / A / A-**: Local storage only, no ads, no tracking, optional encrypted backup
- **B+ / B / B-**: Usage data collected, not sold, GDPR/CCPA compliant
- **C+ / C / C-**: Usage data collected and shared with partners, ads present
- **D / F**: Data sold to third parties, poor encryption, non-compliant

---

## Sections (Required Array)

Each section has a `type` field that maps to a specialized rendering component.

### Section Types

#### 1. Overview
```json
{
  "type": "overview",
  "heading": "What [Tool Name] Does",
  "text": "Paragraph explaining the tool's core functionality, unique features, and approach. 100-150 words."
}
```
**Component**: Generic text renderer

#### 2. Efficacy
```json
{
  "type": "efficacy",
  "heading": "How Well Does It Work?",
  "metric": "What was measured (e.g., Stress Reduction after 10 days)",
  "value": "14%" | "Significant" | "Validated",
  "comparison": "6% (control group)" | "vs. waitlist control",
  "text": "Detailed explanation of the study and findings. 100-150 words.",
  "patient_text": "Plain-language explanation for patients. 50-100 words.",
  "citation": {
    "authors": "LastName F, et al.",
    "title": "Study title",
    "journal": "Journal name",
    "year": 2024,
    "doi": "10.XXXX/...",
    "url": "https://..."
  }
}
```
**Component**: [EfficacySection.tsx](/src/components/resource-renderers/sections/EfficacySection.tsx)

#### 3. Best For
```json
{
  "type": "best_for",
  "heading": "Who Should Use [Tool Name]?",
  "text": "Intro sentence (optional)",
  "items": [
    "Bullet point 1",
    "Bullet point 2",
    "Bullet point 3"
  ],
  "not_recommended": [
    "Who should NOT use this",
    "Contraindications",
    "Important warnings"
  ]
}
```
**Component**: [BestForSection.tsx](/src/components/resource-renderers/sections/BestForSection.tsx)

#### 4. Features Detail
```json
{
  "type": "features_detail",
  "heading": "Key Features Explained",
  "items": [
    {
      "feature": "Feature Name",
      "description": "Detailed explanation of the feature. 50-100 words.",
      "evidence": "Evidence or validation for this feature (optional)"
    }
  ]
}
```
**Component**: [FeaturesSection.tsx](/src/components/resource-renderers/sections/FeaturesSection.tsx)

#### 5. Pricing
```json
{
  "type": "pricing",
  "heading": "Cost & Subscription",
  "text": "Intro sentence (e.g., '7-day free trial, then choose a plan:')",
  "plans": [
    {
      "name": "Plan Name",
      "price": "$X.XX/month" | "$X.XX/year",
      "best_for": "Who this plan is for",
      "annual_cost": "$XXX.XX/year" (optional),
      "recommended": true | false
    }
  ],
  "free_features": [
    "Feature 1",
    "Feature 2"
  ],
  "discounts": [
    "Student discount description",
    "Other discounts"
  ],
  "insurance": "Insurance coverage note"
}
```
**Component**: [PricingSection.tsx](/src/components/resource-renderers/sections/PricingSection.tsx)

#### 6. Platform Comparison
```json
{
  "type": "platform_comparison",
  "heading": "Platform Availability",
  "platforms": [
    {
      "name": "iOS (iPhone/iPad)" | "Android" | "Web Browser" | "Apple Watch",
      "features": "List of features available on this platform",
      "download": "https://apps.apple.com/..." (optional),
      "url": "https://..." (optional),
      "rating": "4.9★ (800K+ reviews)" (optional)
    }
  ]
}
```
**Component**: [PlatformComparisonSection.tsx](/src/components/resource-renderers/sections/PlatformComparisonSection.tsx)

#### 7. Privacy & Security
```json
{
  "type": "privacy_security",
  "heading": "Privacy & Data Security",
  "summary": "One-sentence summary including grade",
  "items": [
    "Privacy feature 1",
    "Privacy feature 2"
  ],
  "data_collected": [
    "Data type 1",
    "Data type 2"
  ],
  "data_shared": [
    "Who data is shared with"
  ],
  "concerns": [
    "Privacy concern 1",
    "Privacy concern 2"
  ],
  "hipaa_note": "HIPAA compliance note"
}
```
**Component**: [PrivacySecuritySection.tsx](/src/components/resource-renderers/sections/PrivacySecuritySection.tsx)

#### 8. Getting Started
```json
{
  "type": "getting_started",
  "heading": "How to Start Using [Tool Name]",
  "steps": [
    "Step 1",
    "Step 2",
    "Step 3"
  ],
  "tips": [
    "Pro tip 1",
    "Pro tip 2"
  ],
  "common_mistakes": [
    "Mistake to avoid 1",
    "Mistake to avoid 2"
  ]
}
```
**Component**: [GettingStartedSection.tsx](/src/components/resource-renderers/sections/GettingStartedSection.tsx)

#### 9. Alternatives
```json
{
  "type": "alternatives",
  "heading": "Similar Apps to Consider",
  "items": [
    {
      "slug": "other-tool-slug",
      "name": "Other Tool Name" (optional, inferred from slug if missing),
      "comparison": "Comparison explanation (50-100 words)"
    }
  ]
}
```
**Component**: [AlternativesSection.tsx](/src/components/resource-renderers/sections/AlternativesSection.tsx)

#### 10. References
```json
{
  "type": "references",
  "heading": "Clinical Evidence & Resources",
  "items": [
    {
      "label": "Reference label",
      "url": "https://...",
      "description": "Brief description"
    }
  ]
}
```
**Component**: [ReferencesTable](/src/components/resource-renderers/shared.tsx) (existing)

---

## FAQs (Required Array)

```json
{
  "faqs": [
    {
      "q": "Question text?",
      "a": "Answer text. 50-150 words."
    }
  ]
}
```

**Component**: [FAQSection.tsx](/src/components/resource-renderers/sections/FAQSection.tsx)

**schema.org Markup**: FAQPage schema automatically generated

**Guidelines**:
- 8-12 FAQs per tool
- Answer common user questions
- Include questions like:
  - "Is [Tool] free or paid?"
  - "Does [Tool] work for [condition]?"
  - "Can [Tool] replace therapy or medication?" (answer: No)
  - "What data does [Tool] collect?"
  - "How long does it take to see results?"
  - "Can kids use [Tool]?"

---

## Links & Media

```json
{
  "app_store_url": "https://apps.apple.com/...",
  "google_play_url": "https://play.google.com/...",
  "website": "https://...",

  "app_logo": "/images/apps/tool-logo.png",
  "screenshots": [
    "/images/apps/tool-screenshot-1.png",
    "/images/apps/tool-screenshot-2.png",
    "/images/apps/tool-screenshot-3.png"
  ]
}
```

**Note**: Image assets are optional for now (Phase 4 optimization). Reference fields but don't create images yet.

---

## SEO Overrides (Optional)

```json
{
  "seo": {
    "title": "Custom title (overrides auto-generated)",
    "description": "Custom description (overrides auto-generated)",
    "keywords": ["keyword1", "keyword2"],
    "canonical": "https://heypsych.com/resources/tool-slug",
    "no_index": false
  }
}
```

**Auto-Generated Metadata**: If `seo` is omitted, metadata is generated using V2 data:
- Title: "[Name]: [Rating]★ [Category] App ([Reviews] reviews) | HeyPsych"
- Description: "[Name] ([Rating]★, [Reviews] reviews) [efficacy claim]. [Platforms]. [Pricing]. Free trial."

---

## Editorial Metadata (Required)

```json
{
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "YYYY-MM-DD",
    "lastUpdated": "YYYY-MM-DD",
    "reviewStatement": "App content and clinical claims reviewed and verified against published peer-reviewed studies...",
    "citations": [
      "https://study-url-1",
      "https://study-url-2"
    ]
  }
}
```

---

## Feature Flags & Ordering

```json
{
  "order": 1,
  "featured": true
}
```

---

## Validation Checklist

Before adding a new tool, ensure:

- [ ] `version: "2.0"` field present
- [ ] `patient_summary` written (plain language)
- [ ] `clinical_metadata` complete with at least 1 clinical trial
- [ ] `privacy_rating` grade assigned (A-F)
- [ ] `linked_conditions` array with 2-4 conditions
- [ ] `sections` array with at least 6 section types:
  - [ ] overview
  - [ ] efficacy
  - [ ] best_for
  - [ ] pricing
  - [ ] privacy_security
  - [ ] getting_started
- [ ] `faqs` array with 8-12 questions
- [ ] All clinical trials have complete citations (authors, title, journal, year, DOI/PMID, URL)
- [ ] All linked conditions have context and evidence level
- [ ] Editorial metadata complete (medical reviewer, review date, citations)

---

## Example: Minimal V2 Tool

```json
{
  "kind": "resource",
  "slug": "example-app",
  "type": "digital-tool",
  "name": "Example App",
  "version": "2.0",

  "summary": "Mindfulness app with 4.5★ rating",
  "description": "Example App helps you meditate and track mood. iOS, Android. $9.99/month.",
  "patient_summary": "Example App is a simple mindfulness app. Best for beginners. Not a replacement for therapy.",

  "metadata": {
    "category": "digital-tools",
    "platforms": ["iOS", "Android"],
    "publisher": "Example Inc.",
    "last_updated": "2025-12-01",
    "offline_access": true,
    "free_tier_available": true
  },

  "app_rating": 4.5,
  "total_reviews": 10000,

  "clinical_metadata": {
    "evidence_based": true,
    "evidence_level": "moderate",
    "clinical_trials": [
      {
        "study": "Brief study description",
        "citation": { ... },
        "outcome": "Key findings",
        "sample_size": 100,
        "study_design": "RCT"
      }
    ],
    "linked_conditions": [
      {
        "slug": "generalized-anxiety-disorder",
        "relationship": "supportive",
        "context": "Helps with mild anxiety...",
        "evidence_level": "moderate"
      }
    ],
    "contraindications": ["Not for severe cases"],
    "efficacy_data": { ... },
    "target_population": { ... }
  },

  "privacy_rating": {
    "grade": "B",
    "data_collected": ["Email", "Usage data"],
    "data_shared": ["Analytics partners"],
    "data_sold": false,
    "encryption": true,
    "gdpr_compliant": true,
    "ccpa_compliant": true
  },

  "sections": [ ... ],
  "faqs": [ ... ],

  "app_store_url": "https://...",
  "website": "https://...",

  "editorial": { ... }
}
```

---

## Comparison: V1 vs V2

| Field | V1 | V2 |
|-------|----|----|
| Structure | Flat | Nested (clinical_metadata, privacy_rating) |
| Clinical Evidence | None | clinical_trials array with citations |
| Privacy | boolean flag | privacy_rating object with grade |
| Sections | Generic text | Specialized types with components |
| FAQs | None | Array with schema.org markup |
| Condition Links | Simple array | Object with relationship, context, evidence |
| Metadata | Auto-generated title | V2-enhanced title with rating + reviews |
| Internal Linking | None | Bidirectional (conditions, alternatives) |

---

## Resources

- **Canonical Reference**: [Headspace V2 JSON](/data/resources/digital-tools/headspace.json)
- **V2 Examples**: Headspace, Calm, Daylio
- **Rendering Components**: [/src/components/resource-renderers/sections/](/src/components/resource-renderers/sections/)
- **Metadata Generator**: [/src/lib/seo/metadata-generators/resource.ts](/src/lib/seo/metadata-generators/resource.ts)
- **Schema Builder**: [/src/lib/seo/schema-builders/digital-tool.ts](/src/lib/seo/schema-builders/digital-tool.ts)

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-09 | 2.0 | Initial V2 schema frozen (Headspace as template) |

---

**Status**: This schema is **FROZEN**. All future digital tools must follow this exact structure. Do not modify without team approval and version bump.
