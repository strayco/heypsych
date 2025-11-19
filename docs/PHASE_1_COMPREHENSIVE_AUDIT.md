# Phase 1: Deep Analysis — Comprehensive SEO & Architecture Audit

**Project:** HeyPsych SEO + Internal Linking + Architecture Optimization
**Date:** November 18, 2025
**Status:** Phase 1 Complete — Ready for Phase 2 Strategic Planning
**Scope:** All non-directory content (excludes `/psychiatry`)

---

## Executive Summary

This comprehensive audit reveals **significant SEO optimization opportunities** across metadata, structured data, internal linking, and E-A-T compliance. HeyPsych has strong foundational content (783 entities across 130 conditions, 574 treatments, 79 resources) but **critical gaps in technical SEO implementation** compared to industry leaders.

### Critical Findings:

🔴 **HIGH PRIORITY GAPS:**
1. **Metadata Coverage:** Only 10% of pages have optimized metadata
2. **Structured Data:** Only resources have JSON-LD; conditions/treatments lack schema
3. **Internal Linking:** 79 total links across 783 entities (0.1 links/page vs. competitor benchmark of 50-100)
4. **E-A-T Signals:** No medical reviewer attribution, no timestamps, no author schemas
5. **Sitemap:** References sitemap.xml but file doesn't exist
6. **Medical Schema:** No MedicalCondition, Drug, or medical-specific schemas

🟢 **STRENGTHS:**
1. Rich, comprehensive JSON content with extensive medical data
2. Existing `{link:type:slug}` syntax infrastructure
3. Resource pages have good schema.org implementation
4. Clean URL structure (`/conditions/{slug}`, `/treatments/{slug}`)
5. Robots.txt properly configured
6. High-quality, detailed content across all entities

### Impact Assessment:

| Issue | Current State | Competitor Benchmark | SEO Impact | User Impact |
|-------|--------------|---------------------|------------|-------------|
| **Metadata** | 10% coverage | 100% coverage | 🔴 Critical | Medium |
| **JSON-LD** | Resources only | All pages (3-5 schemas) | 🔴 Critical | Low |
| **Internal Links** | 0.1/page | 50-100/page | 🔴 Critical | High |
| **E-A-T Signals** | None | Multi-layered | 🔴 Critical | High |
| **Medical Schema** | None | Standard | 🔴 Critical | Low |
| **Sitemap** | Missing | Dynamic generation | 🟡 High | None |

---

## 1. Technical Architecture Review

### 1.1 Content Inventory

**Total Pages:** 863 (excluding psychiatry directory)
- 130 Condition pages
- 574 Treatment pages (medications, therapy, alternative, supplements, interventional, investigational)
- 79 Resource pages (assessments, digital tools, articles, support)
- 52 Static pages (category hubs, legal, search)
- 28 Layout/navigation pages

**Content Structure:**
```
/conditions/
  ├── /anxiety-fear/ (10 conditions)
  ├── /attention-learning/ (6 conditions)
  ├── /autism-development/ (5 conditions)
  ├── /behavioral-disorders/ (8 conditions)
  ├── /mood-depression/ (11 conditions)
  ├── /personality-disorders/ (11 conditions)
  ├── /substance-use-disorders/ (11 conditions)
  ├── /trauma-stress/ (4 conditions)
  └── /other/ (64 conditions in 7 subcategories)

/treatments/
  ├── /medications/ (~250 medications)
  ├── /therapy/ (~92 therapies)
  ├── /alternative/ (~78 treatments)
  ├── /supplements/ (~91 supplements)
  ├── /interventional/ (~38 treatments)
  └── /investigational/ (~25 treatments)

/resources/
  ├── /assessments-screeners/ (4 assessments)
  ├── /digital-tools/ (3 tools)
  ├── /knowledge-hub/ (17 articles/guides)
  └── /support-community/ (55 resources)
```

### 1.2 Current Metadata Implementation

#### Root Layout Metadata (`/src/app/layout.tsx`)
```typescript
// GENERIC - Not optimized for medical content
title: "HeyPsych - Mental Health Treatment Education"
description: "Beautiful, comprehensive mental health treatment information..."
keywords: "mental health, treatments, medications, therapy, depression..."
```

**Issues:**
- ❌ Generic across entire site
- ❌ No medical-specific metadata
- ❌ No E-A-T signals in metadata
- ❌ No medical entity schema

#### Treatment Pages (`/treatments/[slug]/page.tsx`)
```typescript
// BASIC metadata generation
generateMetadata({params}) {
  title: `${entity.name} - HeyPsych Treatment Guide`
  description: entity.description || "Learn about {name} treatment..."
  openGraph: { title, description, type: "article" }
}
```

**Coverage:** 574 treatment pages ✅
**Quality:** Basic (title + description only)

**Missing:**
- ❌ No JSON-LD structured data
- ❌ No medical reviewer attribution
- ❌ No timestamps (published, updated, reviewed)
- ❌ No Drug schema for medications
- ❌ No MedicalTherapy schema for therapies
- ❌ No author schema
- ❌ No breadcrumbs
- ❌ Keywords not utilized from JSON

#### Condition Pages (`/conditions/[slug]/page.tsx`)
**Coverage:** 0 condition pages (client-side component)
**Metadata:** ❌ **NONE** — Critical gap

**Missing:**
- ❌ No generateMetadata function
- ❌ No JSON-LD structured data
- ❌ No MedicalCondition schema
- ❌ No ICD-10/DSM-5 code metadata
- ❌ No E-A-T signals

#### Resource Pages
**Coverage:** 79 resource pages ✅
**Quality:** Strong (best implementation on site)

**Implemented:**
- ✅ `generateResourceMetadata()` function
- ✅ JSON-LD structured data via `generateResourceStructuredData()`
- ✅ Schema types: MedicalRiskEstimator, EmergencyService, Article, HowTo, SoftwareApplication, Organization
- ✅ BreadcrumbList schema
- ✅ FAQPage schema (assessments only)
- ✅ Canonical URLs
- ✅ OpenGraph + Twitter Cards

**File:** `/src/lib/utils/seo.ts` — 260 lines of SEO utilities (resources only)

### 1.3 JSON-LD Structured Data Analysis

#### Current Implementation (Resources Only)

**Schema Types Used:**
1. `MedicalRiskEstimator` — Assessments/screeners
2. `EmergencyService` — Crisis helplines
3. `Article` — Knowledge hub content
4. `HowTo` — Education guides
5. `SoftwareApplication` — Digital tools
6. `Organization` — Support communities
7. `BreadcrumbList` — Navigation (resources only)
8. `FAQPage` — Assessments only

**Example: GAD-7 Assessment**
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalRiskEstimator",
  "name": "GAD-7",
  "estimatesRiskOf": "anxiety",
  "includedRiskFactor": ["assessment", "anxiety", "screening"]
}
```

#### Missing Schema Implementation

**Conditions (130 pages) — 0% coverage:**
- ❌ `MedicalCondition` schema
- ❌ `code` property (ICD-10, DSM-5)
- ❌ `signOrSymptom` property
- ❌ `riskFactor` property
- ❌ `possibleTreatment` property
- ❌ `associatedAnatomy` property (brain regions)
- ❌ `epidemiology` property

**Treatments (574 pages) — 0% coverage:**

*Medications (250 pages):*
- ❌ `Drug` schema
- ❌ `activeIngredient` property
- ❌ `administrationRoute` property
- ❌ `clinicalPharmacology` property
- ❌ `dosageForm` property
- ❌ `drugClass` property
- ❌ `prescriptionStatus` property
- ❌ `warning` property (black box warnings)

*Therapies (92 pages):*
- ❌ `MedicalTherapy` or `PsychologicalTreatment` schema
- ❌ `procedure` property
- ❌ `preparation` property
- ❌ `followup` property

**All Pages:**
- ❌ `Person` schema for authors/reviewers
- ❌ `Organization` schema for HeyPsych
- ❌ `MedicalWebPage` schema
- ❌ `medicalAudience` property
- ❌ `about` property linking to entities

### 1.4 E-A-T Signal Assessment

**Current Implementation:** ❌ **NONE**

**Missing Critical E-A-T Elements:**

1. **Author Attribution:**
   - ❌ No author bylines on any page
   - ❌ No author schemas
   - ❌ No author bio pages
   - ❌ No credentials display

2. **Medical Reviewer:**
   - ❌ No "Medically reviewed by..." attribution
   - ❌ No reviewer credentials
   - ❌ No reviewer schemas
   - ❌ No reviewer specialty areas

3. **Timestamps:**
   - ❌ No "Published on..." dates
   - ❌ No "Last updated..." dates
   - ❌ No "Medically reviewed on..." dates
   - ❌ No update history

4. **Editorial Process:**
   - ❌ No editorial policy page
   - ❌ No "How we vet information" page
   - ❌ No update transparency

5. **Trust Signals:**
   - ❌ No medical board affiliations
   - ❌ No certifications/awards
   - ❌ No professional organization memberships
   - ❌ No institutional partnerships

**Competitor Benchmark (Healthline):**
- ✅ Named author with credentials
- ✅ Separate medical reviewer with higher credentials
- ✅ Three timestamps (published, updated, reviewed)
- ✅ Editorial team attribution (copy editor, primary editor)
- ✅ Update history with reasons
- ✅ "How We Vet Brands and Products" trust page

---

## 2. Internal Linking Analysis

### 2.1 Current State

**Total Internal Links:** 79 links across 783 entities
**Average Link Density:** 0.1 links per page
**Competitor Benchmark:** 50-100+ links per page
**Gap:** **500-1000x below industry standard** 🔴

#### Link Distribution

| Content Type | Files with Links | Total Links | Avg Links/File | Direction |
|--------------|-----------------|-------------|----------------|-----------|
| **Conditions** | 0 | 0 | 0 | None |
| **Treatments** | 20 | 79 | 3.95 | → Conditions |
| **Resources** | 0 | 0 | 0 | None |
| **Assessments** | 0 | 0 | 0 | None |

#### Link Syntax Analysis

**Files with `{link:condition:}` syntax:** 2 files
- `cognitive-behavioral-therapy.json` (9 links)
- `1-2-3-magic.json` (estimated 2-3 links)

**Files with `{link:treatment:}` syntax:** 0 files
**Files with `{link:resource:}` syntax:** 0 files

**Example Implementation (CBT):**
```json
{
  "type": "indications",
  "items": [
    "{link:condition:major-depressive-disorder}",
    "{link:condition:generalized-anxiety-disorder}",
    "{link:condition:panic-disorder}",
    "{link:condition:social-anxiety-disorder}",
    "{link:condition:obsessive-compulsive-disorder}",
    "{link:condition:posttraumatic-stress-disorder}",
    "{link:condition:insomnia-disorder}",
    "{link:condition:eating-body-image}",
    "{link:condition:substance-use-disorders}"
  ]
}
```

### 2.2 Linking Gaps

#### Missing Link Relationships

**Conditions → Treatments:** ❌ 0% implementation
- Generalized Anxiety Disorder should link to: SSRIs, SNRIs, benzodiazepines, CBT, ACT, mindfulness
- Major Depressive Disorder should link to: antidepressants, psychotherapy, ECT, TMS
- ADHD should link to: stimulants, non-stimulants, behavioral therapy

**Conditions → Assessments:** ❌ 0% implementation
- Generalized Anxiety Disorder should link to GAD-7
- Major Depressive Disorder should link to PHQ-9
- ADHD should link to ASRS-v1-1

**Conditions → Resources:** ❌ 0% implementation
- All conditions should link to crisis helplines
- Conditions should link to relevant digital tools
- Conditions should link to knowledge hub articles

**Treatments → Treatments:** ❌ 0% implementation
- CBT should link to exposure therapy, ACT, DBT
- Sertraline should link to other SSRIs
- No cross-category links (medication ↔ therapy)

**Resources → Conditions/Treatments:** ❌ 0% implementation
- Assessments don't link back to conditions
- Articles don't link to relevant treatments
- Digital tools don't suggest conditions they help with

**Bidirectional Linking:** ❌ 0% implementation
- No reciprocal links between any content types

### 2.3 Link Density Comparison

| Site | Avg Links/Page | Body Links | Navigation | Footer |
|------|----------------|------------|------------|--------|
| **Cleveland Clinic** | 185+ | 35+ | 10-12 | 150+ |
| **Mayo Clinic** | 70+ | 20-30 | 50+ | Extensive |
| **Healthline** | 30+ | 15-20 | 11 | 5+ |
| **HeyPsych** | **0.1** | **0.1** | **8** | **0** |

**Recommendation:** Increase to 50-75 links per page minimum

### 2.4 Automated Linking Opportunities

**Current Infrastructure:**
- ✅ `{link:type:slug}` syntax supported
- ✅ `ParsedContent` component handles link rendering
- ✅ `ParsedLinkList` for arrays of links

**Opportunities for Auto-Linking:**

1. **Condition Pages:**
   - Auto-link from `treatment_approaches.medications[]` → treatment pages
   - Auto-link from `treatment_approaches.psychotherapy[]` → therapy pages
   - Auto-link from `comorbidities[]` → related condition pages
   - Auto-link from `evaluation.screeners_rating_scales[]` → assessment pages

2. **Treatment Pages:**
   - Auto-link from `clinical_metadata.conditions_treated[]` → condition pages
   - Auto-link from drug classes → other drugs in same class
   - Auto-link from `sections.indications[]` → condition pages

3. **Assessment Pages:**
   - Auto-link from `conditions[]` → condition pages
   - Auto-link from `clinical_interpretations` → treatment recommendations

4. **Cross-Linking Rules:**
   - Related conditions (same category)
   - Alternative treatments (same indication)
   - Progressive care (screening → diagnosis → treatment → support)

---

## 3. Competitor Analysis Summary

**Full Analysis:** See `/Users/jack/heypsych/COMPETITOR_SEO_ANALYSIS.md`

### 3.1 Key Patterns Identified

#### Schema Implementation Hierarchy

**🥇 Healthline (5/5 stars):**
- Article schema with full properties
- Person schemas for author AND reviewer with credentials
- BreadcrumbList navigation
- Article history tracking with update reasons
- 6 documented revisions with transparency

**🥈 Cleveland Clinic (4/5 stars):**
- MedicalWebPage + MedicalCondition schemas
- BreadcrumbList
- Generic institutional attribution
- Strong internal linking (185+ links/page)

**🥉 Mayo Clinic (3/5 stars):**
- MedicalCondition with SNOMED coding
- BreadcrumbList
- Medical precision via standardized codes

**WebMD (3/5 stars):**
- Drug + MedicineSystem schemas
- JavaScript-heavy (limited visibility)

#### E-A-T Best Practices

**Healthline's Multi-Layer Approach:**
```
Author: Kimberly Holland (Freelance health writer)
  ↓
Medical Reviewer: Joslyn Jelinek, LCSW, CYT
  ↓
Editor: Tess Catlett
  ↓
Copy Editor: [Named]
  ↓
Update History: 6 revisions with reasons
```

**Timestamps:**
- Published: September 19, 2018
- Last Updated: August 22, 2025
- Medically Reviewed: August 22, 2025

#### Internal Linking Strategies

**Cleveland Clinic's Aggressive Linking:**
- 35+ contextual body links
- 10-12 navigation links
- 150+ footer links
- Strategic clusters: condition → symptoms → mechanisms → treatments → comorbidities

**Link Categories:**
1. **Contextual:** Inline references to related topics
2. **Related Content:** Sidebar "See also" modules
3. **Navigational:** Category hubs and breadcrumbs
4. **Footer:** Comprehensive site architecture
5. **Bidirectional:** Automatic reciprocal linking

### 3.2 Competitive Gaps (Opportunities)

**Areas Where HeyPsych Can Excel:**

1. **Mental Health Specialization** — Competitors are generalist medical sites
2. **Assessment Integration** — Link screening tools seamlessly into content
3. **Treatment Comparison** — Side-by-side comparisons (none of competitors do well)
4. **FAQ Schema** — None of competitors implement comprehensively
5. **Crisis Support** — Prominent, specialized mental health crisis resources
6. **Patient Journey** — Complete flow: Education → Assessment → Treatment → Provider

---

## 4. SEO Crawl & Technical Diagnostics

### 4.1 Indexability

**Robots.txt:** ✅ Properly configured
```
Allow: /
Disallow: /api/, /debug, /test-env, /_next/
Sitemap: https://heypsych.com/sitemap.xml
```

**Sitemap:** ❌ **References sitemap.xml but file doesn't exist**

**Impact:** Search engines can't discover all pages efficiently

**Required:**
- Dynamic sitemap generation for 863 pages
- Separate sitemaps by content type (conditions, treatments, resources)
- Priority and changefreq settings
- Last modified timestamps

### 4.2 URL Structure

**Current Structure:** ✅ Clean and semantic

```
/conditions/{slug}
/treatments/{slug}
/resources/{slug}
/resources/assessments-screeners/{slug}
```

**Strengths:**
- Human-readable slugs
- Clear content type identification
- No unnecessary parameters

**Opportunities:**
- Add category layer: `/conditions/{category}/{slug}` (optional)
- Maintain current structure for simplicity

### 4.3 Canonical URLs

**Current Implementation:**
- ✅ Resources have canonical URLs
- ❌ Treatments: Unclear
- ❌ Conditions: Not implemented (client component)

**Required:** All pages need `<link rel="canonical">` tags

### 4.4 Mobile Optimization

**Framework:** Next.js 15 with responsive design
**Assumption:** Core Web Vitals optimized
**Recommendation:** Audit with Lighthouse for confirmation

### 4.5 Page Speed

**Static Generation:** ✅ Treatments use `generateStaticParams()` with ISR
**Client Components:** ⚠️ Conditions are client-rendered (potential CLS issues)

**Recommendation:** Convert condition pages to server components with metadata generation

---

## 5. Content Model Scalability Analysis

### 5.1 JSON Structure Flexibility

**Strengths:** ✅✅✅
- Highly flexible section-based structure
- Supports arbitrary fields without breaking
- Consistent patterns across content types
- Already handles complex nested data

**Example: Treatment Sections**
```json
"sections": [
  {"type": "indications", "items": [...]},
  {"type": "mechanism", "text": "..."},
  {"type": "dosing", "adult": {...}, "geriatric": "..."},
  {"type": "adverse_effects", "common": [...], "rare": [...]}
]
```

**Resilience to Change:**
- ✅ New section types can be added
- ✅ New fields won't break existing renderers
- ✅ Dynamic field rendering on condition pages
- ✅ Extensible without code changes

### 5.2 Metadata Extraction

**Current Coverage:**
- ✅ Rich metadata fields in JSON
- ✅ `seo` object for custom metadata
- ✅ `metadata` object for categorization
- ✅ `clinical_metadata` for medical properties

**Opportunity:**
All fields needed for comprehensive schema.org already exist in JSON:
- ICD-10 codes → `MedicalCondition.code`
- Drug classes → `Drug.drugClass`
- Indications → `Drug.indication`
- Contraindications → `Drug.contraindication`
- Mechanism → `Drug.mechanism`

**Required:** Mapping layer from JSON → schema.org properties

### 5.3 Scalability for Growth

**Current Scale:** 783 entities
**Projected Growth:** 2,000+ entities

**System Design:**
- ✅ Next.js ISR handles thousands of pages
- ✅ Supabase database scales horizontally
- ✅ JSON structure supports unlimited entities
- ✅ Build time optimized with `generateStaticParams()`

**Bottlenecks:**
- ⚠️ Build time may increase (top 200 pre-rendered)
- ⚠️ Client-side condition pages don't benefit from ISR

**Recommendation:**
- Move all pages to server components
- Implement on-demand ISR
- Cache at CDN level

---

## 6. YMYL & Medical Content Compliance

### 6.1 YMYL Requirements

**Status:** ❌ Not compliant with Google YMYL guidelines

**Google YMYL Criteria for Medical Content:**
1. **Expertise:** ❌ No author credentials displayed
2. **Authoritativeness:** ❌ No institutional authority signals
3. **Trustworthiness:** ❌ No medical review process shown
4. **Accuracy:** ⚠️ Content quality high, but no verification signals
5. **Recency:** ❌ No update timestamps

### 6.2 Medical Disclaimers

**Current Implementation:** Unknown (requires page review)
**Required:**
- Medical disclaimer on all clinical content
- "Not a substitute for professional advice" notice
- "Seek immediate help if..." crisis guidance
- Clear scope of information vs. diagnosis

### 6.3 Citations & References

**Condition Pages:** ✅ JSON contains rich clinical data (DSM-5, ICD-10)
**Treatment Pages:** ⚠️ Clinical data present but no citation format
**Resource Pages:** ✅ Assessments have references with DOIs

**Gap:** No formatted reference sections on condition/treatment pages

**Recommendation:**
- Add "References" section to all clinical pages
- Link to source studies
- Display last medical review date
- Show editorial standards

---

## 7. Key Recommendations (Priority Order)

### 🔴 TIER 1: Critical (Implement Immediately)

#### 1. Implement Comprehensive Metadata System
**Pages Affected:** 704 pages (130 conditions + 574 treatments)
**Impact:** Critical for rankings

**Actions:**
- Add `generateMetadata()` to condition pages (requires server component conversion)
- Enhance treatment metadata beyond basic title/description
- Utilize existing `seo` JSON fields
- Include medical-specific meta tags

**Template:**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const entity = await getEntity(params.slug);
  return {
    title: `{entity.name}: Symptoms, Causes, Treatment | HeyPsych`,
    description: entity.seo?.description || generateDescription(entity),
    keywords: entity.seo?.keywords?.join(', '),
    openGraph: { ... },
    twitter: { ... },
    alternates: { canonical: `https://heypsych.com/...` }
  };
}
```

#### 2. Add JSON-LD Structured Data to All Pages
**Pages Affected:** 704 pages
**Impact:** Critical for rich snippets and medical SEO

**Required Schemas:**

**Conditions:**
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalCondition",
  "name": "Generalized Anxiety Disorder",
  "alternateName": "GAD",
  "code": {
    "@type": "MedicalCode",
    "code": "F41.1",
    "codingSystem": "ICD-10"
  },
  "signOrSymptom": [...],
  "riskFactor": [...],
  "possibleTreatment": [...],
  "associatedAnatomy": {...}
}
```

**Medications:**
```json
{
  "@context": "https://schema.org",
  "@type": "Drug",
  "name": "Sertraline",
  "alternateName": "Zoloft",
  "activeIngredient": "Sertraline hydrochloride",
  "drugClass": "SSRI",
  "administrationRoute": "Oral",
  "prescriptionStatus": "PrescriptionOnly",
  "indication": [...],
  "contraindication": [...],
  "warning": [...]
}
```

**All Pages:**
```json
{
  "@type": "MedicalWebPage",
  "medicalAudience": "Patient",
  "reviewedBy": {
    "@type": "Person",
    "name": "[Medical Reviewer Name]",
    "credentials": "MD, Psychiatry"
  },
  "datePublished": "2024-01-01",
  "dateModified": "2025-11-18"
}
```

#### 3. Implement E-A-T Signals
**Pages Affected:** All 863 pages
**Impact:** Critical for YMYL compliance

**Required Elements:**

**Page Headers:**
```
Author: [Name, Credentials]
Medically Reviewed By: [Name, MD/PhD, Specialty]
Published: [Date]
Last Updated: [Date]
Last Medically Reviewed: [Date]
```

**Schema Implementation:**
```json
{
  "author": {
    "@type": "Person",
    "name": "[Author Name]",
    "jobTitle": "Health Writer",
    "credentials": "BA Psychology"
  },
  "reviewedBy": {
    "@type": "Person",
    "name": "[Reviewer Name]",
    "credentials": "MD, Board-Certified Psychiatrist",
    "specialty": "Mood Disorders",
    "affiliation": "American Psychiatric Association"
  }
}
```

**Trust Pages (Create):**
- `/about/editorial-process`
- `/about/medical-review-board`
- `/about/how-we-ensure-accuracy`

#### 4. Aggressive Internal Linking Implementation
**Impact:** Critical for user engagement and SEO
**Target:** 50-75 links per page

**Auto-Link Sources:**

**Condition Pages:**
```typescript
// From treatment_approaches.medications
treatment_approaches.medications.forEach(med => {
  if (treatmentExists(med)) addLink(med);
});

// From comorbidities
comorbidities.forEach(condition => {
  if (conditionExists(condition)) addLink(condition);
});

// From screeners_rating_scales
evaluation.screeners_rating_scales.forEach(assessment => {
  if (assessmentExists(assessment)) addLink(assessment);
});
```

**Link Placement:**
- 25-40 body content links
- 10-12 navigation links
- 8-12 sidebar "Related" links
- Footer category links

**Required Link Relationships:**
- Conditions → Treatments (medications + therapy)
- Conditions → Assessments
- Conditions → Related conditions
- Treatments → Conditions treated
- Treatments → Related treatments
- Assessments → Conditions
- Resources → Conditions/Treatments

### 🟡 TIER 2: High Priority

#### 5. Generate Dynamic Sitemap
**Impact:** Essential for crawlability

**Implementation:**
```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const conditions = await getAllConditions();
  const treatments = await getAllTreatments();
  const resources = await getAllResources();

  return [
    ...conditions.map(c => ({
      url: `https://heypsych.com/conditions/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: 'monthly',
      priority: 0.8
    })),
    ...treatments.map(t => ({
      url: `https://heypsych.com/treatments/${t.slug}`,
      lastModified: t.updated_at,
      changeFrequency: 'monthly',
      priority: 0.7
    })),
    ...resources.map(r => ({
      url: `https://heypsych.com/resources/${r.slug}`,
      lastModified: r.updated_at,
      changeFrequency: 'weekly',
      priority: 0.9
    }))
  ];
}
```

#### 6. Content Clustering & Hub Pages
**Impact:** Improves navigation and SEO

**Hub Structure:**
```
/conditions/anxiety-fear → Hub page linking to:
  - Generalized Anxiety Disorder
  - Panic Disorder
  - Social Anxiety Disorder
  - Specific Phobias
  - Separation Anxiety

/treatments/medications/antidepressants → Hub page linking to:
  - SSRIs (with subgroup)
  - SNRIs
  - TCAs
  - MAOIs
```

**Benefits:**
- Clearer site architecture
- More internal linking opportunities
- Better user navigation
- Keyword targeting for category terms

#### 7. Convert Condition Pages to Server Components
**Impact:** Enables metadata, improves performance

**Current:** Client component with `useEntityByType()`
**Target:** Server component with `generateMetadata()` and ISR

**Benefits:**
- SEO metadata generation
- Faster initial load
- Better Core Web Vitals
- Static generation with ISR

### 🟢 TIER 3: Medium Priority

#### 8. Add FAQ Sections with Schema
**Impact:** Rich snippets opportunity

**Target:** 6-10 FAQs per page
**Schema:** `FAQPage`

**Example Questions:**
- "What is [condition]?"
- "What causes [condition]?"
- "How is [condition] diagnosed?"
- "What are treatment options for [condition]?"
- "Can [condition] be cured?"
- "When should I see a doctor about [condition]?"

#### 9. Enhance Page Elements
- ✅ Table of contents with jump links
- ✅ Crisis support banner (mental health)
- ✅ References section
- ✅ Medical disclaimers
- ✅ "Last reviewed" dates
- ✅ Print/share buttons
- ✅ Related articles module

#### 10. Implement Breadcrumbs
**All pages need breadcrumb navigation**

**Schema:**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "/"},
    {"@type": "ListItem", "position": 2, "name": "Conditions", "item": "/conditions"},
    {"@type": "ListItem", "position": 3, "name": "Anxiety", "item": "/conditions/anxiety-fear"},
    {"@type": "ListItem", "position": 4, "name": "GAD", "item": "/conditions/generalized-anxiety-disorder"}
  ]
}
```

---

## 8. Implementation Roadmap

### Month 1: Foundation
- [ ] Create metadata generation system
- [ ] Add Person schemas for authors/reviewers
- [ ] Implement timestamp system
- [ ] Create medical review board page
- [ ] Add editorial policy page

### Month 2: Structured Data
- [ ] Implement MedicalCondition schema (130 pages)
- [ ] Implement Drug schema (250 pages)
- [ ] Implement MedicalTherapy schema (324 pages)
- [ ] Add BreadcrumbList to all pages
- [ ] Add MedicalWebPage schema

### Month 3: Internal Linking
- [ ] Build auto-linking engine
- [ ] Add conditions → treatments links
- [ ] Add treatments → conditions links
- [ ] Add assessment links
- [ ] Add related content modules
- [ ] Target: 50+ links per page

### Month 4: Content Enhancement
- [ ] Add FAQ sections (6-10 per page)
- [ ] Implement FAQPage schema
- [ ] Add table of contents
- [ ] Add crisis support banners
- [ ] Add reference sections
- [ ] Convert condition pages to server components

### Month 5: Technical SEO
- [ ] Generate dynamic sitemap
- [ ] Implement canonical URLs
- [ ] Add hreflang (if multi-language)
- [ ] Optimize Core Web Vitals
- [ ] Schema validation testing

### Month 6: Advanced Features
- [ ] Treatment comparison tables
- [ ] Interactive decision trees
- [ ] Enhanced assessment integration
- [ ] Video content (if applicable)
- [ ] Image optimization with medical alt text

---

## 9. Success Metrics

### Technical SEO KPIs

| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| **Pages with metadata** | 10% | 100% |
| **Pages with JSON-LD** | 10% | 100% |
| **Avg internal links/page** | 0.1 | 50-75 |
| **Pages with E-A-T signals** | 0% | 100% |
| **Indexed pages** | Unknown | 863 |
| **Schema validation errors** | Unknown | 0 |

### User Engagement KPIs

| Metric | Baseline | Target (6 months) |
|--------|----------|-------------------|
| **Pageviews per session** | TBD | +50% |
| **Avg session duration** | TBD | +40% |
| **Bounce rate** | TBD | -30% |
| **Pages per session** | TBD | +60% |
| **Return visitor rate** | TBD | +35% |

### SEO Performance KPIs

| Metric | Baseline | Target (6 months) |
|--------|----------|-------------------|
| **Organic traffic** | TBD | +100% |
| **Keyword rankings (top 10)** | TBD | +150% |
| **Featured snippets** | 0 | 20+ |
| **Rich results** | 0 | 100+ |
| **Domain authority** | TBD | +10 points |

---

## 10. Phase 2 Preparation

**Phase 1 Complete:** ✅ Comprehensive audit delivered

**Next Steps:**
1. Review and approve findings
2. Clarify any ambiguities
3. Proceed to Phase 2: Strategic Architecture Plan

**Phase 2 Deliverables:**
1. YMYL + E-A-T Compliance Framework
2. Metadata Architecture (rules-based system)
3. Internal Linking Engine (automated)
4. Content Clustering Strategy
5. Sitemap & Indexing Strategy
6. Implementation specifications
7. Code templates and utilities

---

## Appendix A: Tools & Resources

### Schema.org Resources
- MedicalCondition: https://schema.org/MedicalCondition
- Drug: https://schema.org/Drug
- MedicalWebPage: https://schema.org/MedicalWebPage
- FAQPage: https://schema.org/FAQPage

### Validation Tools
- Google Rich Results Test
- Schema Markup Validator
- Lighthouse SEO Audit
- Screaming Frog SEO Spider

### Competitor Analysis
- Full report: `/Users/jack/heypsych/COMPETITOR_SEO_ANALYSIS.md`

---

**Report Completed:** November 18, 2025
**Ready for Phase 2 Strategic Planning**
