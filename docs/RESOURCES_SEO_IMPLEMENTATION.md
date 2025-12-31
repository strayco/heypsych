# RESOURCES SEO + UX AUDIT + IMPLEMENTATION PLAN

## STEP 0: CONSISTENCY MEMO — Patterns to Reuse from Conditions/Medications

### What We'll Mirror from Conditions

**1. Routing Structure**
- **Hub → Category Hub → Detail** pattern
- Hub: `/resources` (overview of all resource categories)
- Category Hubs: `/resources/{category-slug}` (e.g., `/resources/assessments-screeners`)
- Detail Pages: `/resources/{resource-slug}` (e.g., `/resources/phq-9`)
- Static generation with ISR (24h revalidation)
- `generateStaticParams()` for pre-rendering

**2. JSON Data Conventions**
- Location: `/data/resources/{category}/{slug}.json`
- Root fields: `name`, `slug`, `type`, `metadata`, `content`, `status`
- Status enum: `"active" | "draft" | "archived"`
- Category taxonomy in metadata
- Optional fields gracefully handled

**3. Category Configuration Pattern**
- Central config file: `/src/lib/config/resource-categories.ts` (NEW - to create)
- Each category has: `slug`, `displayTitle`, `subtitle`, `emoji`, `icon`, `gradient`, `description`, `keywords`
- Used for hub tiles, SEO, and navigation

**4. SEO Utilities**
- Metadata generators: `/src/lib/seo/metadata-generators/resource.ts` ✅ (already exists)
- Schema factory: `SchemaFactory.generateAll(entity)` pattern
- Canonical URLs: `${SITE_CONFIG.url}/resources/${slug}`
- Sitemap config: Priority 0.7, changefreq "monthly"

**5. UI Components**
- Hub component: Reuse tile grid pattern from `ConditionsOverviewClient`
- Category hub: Reuse list pattern from `ConditionsCategoryClient`
- Detail wrapper: Reuse breadcrumbs + back button + medical review badge patterns
- Alphabetical directory footer (critical for crawlability)

**6. Breadcrumbs**
- Pattern: `Home > Resources > {Category} > {Resource}`
- Component: Reuse `ConditionBreadcrumbs` pattern
- Structured data: `BreadcrumbList` schema

**7. Validation Approach**
- Server queries validate status="active"
- Type checking via TypeScript interfaces
- Runtime validation in entity mappers
- Build-time validation script (NEW - to create)

---

### What We'll Mirror from Medications

**1. Crosslinking Pattern**
- JSON field: `relatedConditionSlugs[]` (array of condition slugs)
- JSON field: `relatedMedicationSlugs[]` (array of medication slugs)
- JSON field: `relatedResourceSlugs[]` (array of resource slugs)
- Relationship types: `primary`, `related`, `see_also`

**2. Content Enhancement for Inline Links**
- Use `enhanceEntityContent()` from `/src/lib/linking/content-enhancer.ts`
- Auto-detects entity names in prose
- Injects `{link:type:slug:text}` syntax
- Crawlable links in initial HTML (SSR)

**3. ParsedContent Component**
- Use `/src/components/ui/parsed-content.tsx`
- Renders `{link:}` syntax as `<Link>` elements
- All links in initial DOM for crawlability

**4. Section-Based Rendering**
- Optional `sections[]` array in JSON for structured content
- Each section has: `type`, `heading`, `content`, `items`
- Section types: `overview`, `how_to_use`, `benefits`, `limitations`, `resources`, `references`, `faqs`
- Collapsible sections with smart defaults

**5. Medical Review Badge**
- Display review status from `editorial.medicalReviewerIds`
- Show `lastReviewed`, `lastUpdated`, `publishedDate`
- Medical disclaimer where appropriate

**6. FAQs Integration**
- `faqs[]` array in JSON
- Auto-render at bottom of detail page
- FAQPage schema for SEO

---

### What Differs for Resources

**1. Lighter Content Structure**
- Resources are educational/reference (vs clinical detail pages)
- Shorter content (1-3 screens vs 10+ screens for medications)
- Less medical jargon, more accessibility focus

**2. Multi-Tiered Categories**
- Resources have subcategories (e.g., `knowledge-hub/how-to-guides/`)
- Conditions/Medications have flat categories
- Resources index uses `metadata.pillar` for subcategory grouping

**3. Hybrid Data Sources**
- Some resources from database (digital-tools, assessments)
- Some from JSON files (knowledge-hub articles)
- Resources-index.json pre-built at build time

**4. Less Medical, More Educational**
- No diagnostic codes
- No drug interactions
- Citations still important but lighter
- Focus on "what, why, how" vs "clinical efficacy"

---

### Key Reusable Patterns Summary

| Pattern | Reuse From | Resources Implementation |
|---------|-----------|--------------------------|
| **Routing** | Conditions | Hub → Category → Detail (✅ already exists) |
| **JSON Storage** | Conditions | `/data/resources/{category}/{slug}.json` (✅ exists) |
| **Category Config** | Conditions | NEW: `/src/lib/config/resource-categories.ts` |
| **SEO Metadata** | Both | Use existing `ResourceMetadataGenerator` |
| **Schema/Structured Data** | Both | `Article` or `HowTo` schemas via `SchemaFactory` |
| **Crosslinking** | Medications | NEW: Add `relatedConditionSlugs`, `relatedResourceSlugs` to JSON |
| **Content Enhancement** | Medications | Opt-in `enhanceEntityContent()` for inline links |
| **ParsedContent** | Medications | Reuse for crawlable link rendering |
| **Breadcrumbs** | Conditions | Reuse component pattern |
| **A-Z Directory** | Conditions | Add to hub footer for crawlability |
| **Section Rendering** | Medications | Adapt section types for resources |
| **Validation** | Both | NEW: Build-time validation script |
| **Sitemap** | Both | Update priority/changefreq in config |

---

## STEP 1: INVENTORY + IA MAP

### Current Resources Inventory (RECONCILED - Final Count)

**Total Resources:** 93 JSON files (excluding 2 index.json files in support-community)

**Categories (Active):**
1. **Assessments & Screeners** (4 resources)
   - PHQ-9, GAD-7, ASRS v1.1, ASSIST v3
   - Route: `/resources/assessments-screeners`
   - Status: ✅ Fully functional

2. **Digital Tools** (15 resources)
   - Headspace, Calm, Talkspace, BetterHelp, etc.
   - Route: `/resources/digital-tools`
   - Status: ✅ Fully functional

3. **Knowledge Hub** (21 resources across 5 subcategories)
   - Subcategories: how-to-guides (7), research-and-science (6), community-and-stories (3), self-help-and-wellness (1), mental-health-trends (0)
   - Route: `/resources/knowledge-hub`
   - Status: ✅ Fully functional

4. **Support & Community** (53 resources across 2 subcategories, excluding 2 index.json files)
   - Subcategories: immediate-crisis (26), organizations-communities (29)
   - Route: `/resources/support-community`
   - Status: ✅ Fully functional with multi-tab UI

**Categories (Deprecated/Orphaned):**
1. `articles-blogs` - Not indexed, redirects don't exist
2. `articles-guides` - Not indexed properly
3. `crisis-helplines` - Merged into support-community
4. `education-guides` - Merged into articles-guides

**Orphaned Items:**
- ✅ **FIXED**: All 40 previously orphaned resources now have proper `metadata.category`
- ✅ All 93 resources now have `metadata.resourceType`
- ✅ All 93 resources now have `status: "active"`
- ✅ All 93 resources now have `type: "resource"`

---

### Information Architecture Map

```
/resources (Hub)
├── /assessments-screeners (Category Hub) [4 resources]
│   ├── /phq-9 (Detail)
│   ├── /gad-7 (Detail)
│   ├── /asrs-v1-1 (Detail)
│   └── /assist-v3 (Detail)
│
├── /digital-tools (Category Hub) [15 resources]
│   ├── /headspace (Detail)
│   ├── /calm (Detail)
│   ├── /talkspace (Detail)
│   └── ... [12 more]
│
├── /knowledge-hub (Category Hub) [21 resources]
│   ├── /finding-a-therapist (Detail)
│   ├── /understand-therapy-types (Detail)
│   ├── /cbt-explained (Detail)
│   └── ... [18 more]
│
└── /support-community (Category Hub) [55 resources]
    ├── /988-suicide-crisis-lifeline (Detail)
    ├── /crisis-text-line (Detail)
    ├── /nami (Detail)
    └── ... [52 more]
```

**Total Pages:**
- 1 Hub
- 4 Category Hubs
- 95 Detail Pages
- **100 total pages**

---

### Crawlability Audit

**Hub → Category Links:**
- ✅ `/resources` links to all 4 active categories (initial DOM)
- ⚠️ Missing: A-Z directory footer for crawlability

**Category → Resource Links:**
- ✅ All category hubs link to their resources (initial DOM)
- ⚠️ Some categories use client-side filtering (search/filters)
- ✅ But all links rendered in initial HTML

**Resource → Related Links:**
- ❌ No crosslinks to conditions yet (not in JSON)
- ❌ No crosslinks to medications yet (not in JSON)
- ❌ No crosslinks to related resources (some JSON has `related` but not rendered)

**Sitemap Coverage:**
- ✅ Hub included (priority 0.9)
- ✅ 4 category hubs included (priority 0.7-0.8)
- ⚠️ Only 93 of 95 detail pages in sitemap (orphaned items missing)

---

### Canonical Issues

**Current Status:**
- ✅ All pages have canonical URLs
- ✅ Trailing slash consistency enforced
- ❌ Deprecated category redirects not in `next.config.js` (could cause 404s)

**Duplicates Found:**
- None (URLs are unique)

---

### Orphaned Resources

**31 orphaned items in `resources-index.json`:**
- No `category` field or `metadata.category`
- Not rendered on any page
- Not in sitemap
- Not crawlable

**Action Required:**
1. Identify these 31 items
2. Assign proper categories
3. Update JSON files
4. Re-build resources-index.json
5. Verify sitemap inclusion

---

## STEP 2: GOLD STANDARD RESOURCES TEMPLATE SPEC

### Hub Template (`/resources`)

**Route:** `/src/app/resources/page.tsx`

**Above Fold:**
- Page title: "Mental Health Resources & Tools"
- Subtitle: "Evidence-based resources to support your mental health journey"
- **Search bar** with typeahead (searches across all resource titles + aliases)
- **Popular resource chips** (5-7 most accessed/useful resources)
  - Example: "PHQ-9 Depression Screener", "988 Suicide & Crisis Lifeline", "Finding a Therapist"

**Topic Grid:**
- 4 category cards (Apple-like design)
- Each card:
  - Emoji + icon (from category config)
  - Display title + subtitle
  - Gradient background (from category config)
  - Resource count badge (e.g., "21 resources")
  - Hover effect: translateY + shadow increase
  - CTA: "Explore {Category}"
- Responsive: 1 column mobile, 2 columns tablet, 2 columns desktop (4 categories)

**Footer:**
- **A-Z Directory** (critical for SEO)
  - Groups all 95 resources alphabetically
  - Collapsible per letter on mobile
  - Multi-column on desktop
  - All links in initial HTML (crawlable)

**SEO:**
- Title: "Mental Health Resources & Tools | Assessments, Support, Apps | HeyPsych"
- Description: "Evidence-based mental health resources including validated assessments, crisis support, digital tools, and educational guides. Find help and support for your mental health journey."
- Keywords: "mental health resources, depression screener, anxiety test, crisis helpline, mental health apps, therapy guide"
- Canonical: `https://www.heypsych.com/resources`
- Schema: `CollectionPage` with `hasPart` links to categories

---

### Category Hub Template (`/resources/{category}`)

**Route:** `/src/app/resources/[category]/page.tsx` (one file per category)

**Above Fold:**
- **Breadcrumbs:** Home > Resources > {Category}
- Category emoji + title (from config)
- Short overview paragraph (from category config or JSON)
- Optional: Educational disclaimer banner (for sensitive topics)

**Resource List:**
- Grid/list of all resources in category
- Each resource card:
  - Icon (resource type-specific)
  - Title
  - Short description (truncated at 120 chars)
  - Metadata badges (e.g., "5 min", "Free", "App")
  - Hover effect
  - Link to detail page
- All links in initial HTML (crawlable)

**Optional Filters** (if category has >10 resources):
- Type filter (e.g., "Assessment", "Guide", "App")
- Reading time filter (e.g., "< 5 min", "5-15 min")
- Cost filter (e.g., "Free", "Freemium", "Paid")
- Filters are client-side, but ALL resources still in initial DOM

**Back Button:**
- "← Back to All Resources"

**SEO:**
- Title: "{Category Name} | Mental Health Resources | HeyPsych"
  - Example: "Assessments & Screeners | Mental Health Resources | HeyPsych"
- Description: "{Category description from config}"
- Keywords: "{category keywords from config}"
- Canonical: `https://www.heypsych.com/resources/{category}`
- Schema: `CollectionPage` with `hasPart` links to resources

---

### Detail Template (`/resources/{resource}`)

**Route:** `/src/app/resources/[slug]/page.tsx`

**Above Fold:**
- **Back button** + **Breadcrumbs**
- **Title (H1)** + resource type badge (e.g., "Assessment", "Guide", "App")
- **1-2 sentence intro** (from `summary` or `description`)
- **Metadata row:**
  - Published date
  - Updated date
  - Author/reviewer (if available)
  - Reading time (if applicable)
- **Medical review badge** (if `editorial.lastReviewed` exists)

**Body Sections:**

1. **Overview**
   - Description (2-4 paragraphs)
   - What it is, why it matters

2. **How to Use** (if applicable)
   - Step-by-step instructions
   - Who it's for
   - When to use it

3. **Key Benefits** (if applicable)
   - Bullet list

4. **Limitations** (if applicable)
   - Disclaimers, cautions

5. **Related Conditions** (CROSSLINK)
   - List of conditions this resource relates to
   - Crawlable links: `<Link href="/conditions/{slug}">`

6. **Related Medications** (CROSSLINK - if relevant)
   - List of medications mentioned
   - Crawlable links: `<Link href="/treatments/{slug}">`

7. **Related Resources** (CROSSLINK)
   - 3-5 related resources
   - Crawlable links: `<Link href="/resources/{slug}">`

8. **Citations/References**
   - If resource makes medical claims
   - APA-style citations with links

9. **FAQs** (if `faqs[]` exists)
   - Auto-rendered from JSON

**Educational Disclaimer:**
- Standard disclaimer at bottom (resources are educational, not medical advice)

**CTA Section:**
- "Find more resources" → Link to category hub
- "Explore related conditions" → Link to conditions hub

**SEO:**
- Title: From JSON `seo.title` or auto-generated "{Name}: {Type} | HeyPsych"
  - Example: "PHQ-9: Depression Screening Tool | HeyPsych"
- Description: From JSON `seo.description` or auto-generated from `summary`
- Keywords: Resource name, type, related conditions, category
- Canonical: `https://www.heypsych.com/resources/{slug}`
- Schema:
  - `Article` (for guides/articles)
  - `HowTo` (for how-to guides)
  - `MedicalWebPage` (for assessments/clinical tools)
  - `BreadcrumbList`
  - `FAQPage` (if FAQs exist)
  - `Person` schemas (author/reviewer)

---

## STEP 3: JSON DATA CONTRACT

### Required Fields (All Resources)

```json
{
  "name": "string",              // Display name (required)
  "slug": "string",              // URL-safe identifier (required)
  "type": "resource",            // Entity type (required)
  "status": "active",            // "active" | "draft" | "archived" (required)
  "metadata": {
    "category": "string",        // Category slug (required)
    "resourceType": "string"     // "assessment" | "article" | "guide" | "app" | "support" | "reference"
  }
}
```

### Recommended Fields (SEO + UX)

```json
{
  "summary": "string",                     // 1-2 sentence intro (150-200 chars)
  "description": "string",                 // Full description (2-4 paragraphs)

  "seo": {
    "title": "string",                     // Custom SEO title (optional, auto-generated if missing)
    "description": "string",               // Custom meta description (optional)
    "keywords": ["string"],                // Custom keywords (optional)
    "canonical": "string",                 // Custom canonical URL (optional)
    "noIndex": false                       // Set true to prevent indexing (default: false)
  },

  "editorial": {
    "publishedDate": "YYYY-MM-DD",         // Publication date
    "lastUpdated": "YYYY-MM-DD",           // Last updated date
    "lastReviewed": "YYYY-MM-DD",          // Medical review date (optional)
    "authorName": "string",                // Author name (optional)
    "reviewerName": "string"               // Medical reviewer name (optional)
  }
}
```

### Optional Fields (Content Enhancement)

```json
{
  "aliases": ["string"],                   // Alternative names for search (e.g., ["PHQ-9", "Patient Health Questionnaire"])

  "relatedConditionSlugs": ["string"],     // Array of condition slugs (crosslink)
  "relatedMedicationSlugs": ["string"],    // Array of medication slugs (crosslink)
  "relatedResourceSlugs": ["string"],      // Array of resource slugs (crosslink)

  "sections": [                            // Dynamic content sections
    {
      "type": "string",                    // "overview" | "how_to_use" | "benefits" | "limitations" | "resources" | "faqs"
      "heading": "string",                 // Section title
      "content": "string",                 // Prose content (with {link:} syntax)
      "items": ["string"]                  // Optional bullet list
    }
  ],

  "faqs": [                                // Frequently asked questions
    {
      "question": "string",
      "answer": "string"                   // Can include {link:} syntax
    }
  ],

  "citations": [                           // References
    {
      "authors": "string",
      "title": "string",
      "journal": "string",
      "year": number,
      "doi": "string",
      "pmid": "string",
      "url": "string"
    }
  ],

  "readingTimeMinutes": number             // Estimated reading time
}
```

### Field → UI Mapping

| JSON Field | UI Rendering | Template Section |
|------------|--------------|------------------|
| `name` | H1 title | Above fold |
| `summary` | 1-2 sentence intro | Above fold |
| `description` | Overview section | Body |
| `metadata.resourceType` | Badge | Above fold |
| `editorial.publishedDate` | Published date | Metadata row |
| `editorial.lastUpdated` | Updated date | Metadata row |
| `editorial.lastReviewed` | Medical review badge | Above fold |
| `relatedConditionSlugs[]` | Related Conditions section | Body |
| `relatedResourceSlugs[]` | Related Resources section | Body |
| `sections[]` | Dynamic sections | Body (order preserved) |
| `faqs[]` | FAQs section | Bottom of body |
| `citations[]` | References section | Bottom of body |
| `seo.title` | `<title>` tag | `<head>` |
| `seo.description` | `<meta name="description">` | `<head>` |

### Schema Generation Logic

```typescript
function determineResourceSchema(entity: Entity): SchemaType {
  const resourceType = entity.metadata?.resourceType;

  if (resourceType === "assessment") {
    return "MedicalWebPage";
  }

  if (resourceType === "guide" && hasHowToSteps(entity)) {
    return "HowTo";
  }

  return "Article";  // Default for articles, references, etc.
}
```

---

## STEP 4: PHASE 1 IMPLEMENTATION PLAN

### Minimum Viable Improvements (MVP)

**Goal:** Fix critical SEO/crawlability issues, establish consistent patterns

#### 1. Data Cleanup (HIGH PRIORITY)

**Tasks:**
- [ ] Audit 31 orphaned resources in `resources-index.json`
- [ ] Assign proper `metadata.category` to each
- [ ] Update JSON files
- [ ] Remove deprecated categories (articles-blogs, crisis-helplines, education-guides)
- [ ] Consolidate overlapping categories (articles-guides → knowledge-hub)
- [ ] Re-build `resources-index.json`

**Script:** `/scripts/audit-resources.js`

#### 2. Category Configuration (HIGH PRIORITY)

**Create:** `/src/lib/config/resource-categories.ts`

```typescript
import { Brain, HeartPulse, Smartphone, Users } from "lucide-react";

export interface ResourceCategoryConfig {
  slug: string;
  displayTitle: string;
  subtitle: string;
  emoji: string;
  icon: typeof Brain;
  gradient: string;
  hoverGradient: string;
  bgColor: string;
  iconColor: string;
  href: string;
  description: string;
  keywords: string[];
}

export const RESOURCE_CATEGORIES: ResourceCategoryConfig[] = [
  {
    slug: "assessments-screeners",
    displayTitle: "Assessments & Screeners",
    subtitle: "Evidence-based screening tools",
    emoji: "📋",
    icon: Brain,
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "from-blue-600 to-indigo-700",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/resources/assessments-screeners",
    description: "Validated mental health screening tools and assessments to help identify symptoms and guide treatment.",
    keywords: ["depression screener", "anxiety test", "PHQ-9", "GAD-7", "mental health assessment"]
  },
  {
    slug: "support-community",
    displayTitle: "Support & Community",
    subtitle: "Crisis support & resources",
    emoji: "🤝",
    icon: Users,
    gradient: "from-green-500 to-emerald-600",
    hoverGradient: "from-green-600 to-emerald-700",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    href: "/resources/support-community",
    description: "24/7 crisis helplines, support organizations, and community resources for mental health support.",
    keywords: ["988", "crisis helpline", "suicide prevention", "NAMI", "mental health support"]
  },
  {
    slug: "digital-tools",
    displayTitle: "Digital Tools & Apps",
    subtitle: "Mental health apps & platforms",
    emoji: "📱",
    icon: Smartphone,
    gradient: "from-purple-500 to-pink-600",
    hoverGradient: "from-purple-600 to-pink-700",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/resources/digital-tools",
    description: "Curated mental health apps, online therapy platforms, and digital wellness tools.",
    keywords: ["mental health apps", "therapy apps", "meditation apps", "Headspace", "Calm", "BetterHelp"]
  },
  {
    slug: "knowledge-hub",
    displayTitle: "Knowledge Hub",
    subtitle: "Educational guides & articles",
    emoji: "📚",
    icon: HeartPulse,
    gradient: "from-orange-500 to-red-600",
    hoverGradient: "from-orange-600 to-red-700",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/resources/knowledge-hub",
    description: "Evidence-based guides, how-to articles, and mental health education resources.",
    keywords: ["therapy guide", "mental health education", "CBT explained", "finding a therapist"]
  }
];
```

#### 3. Add JSON Crosslink Fields (MEDIUM PRIORITY)

**Update JSON files to include:**

```json
{
  "relatedConditionSlugs": [
    "generalized-anxiety-disorder",
    "panic-disorder"
  ],
  "relatedResourceSlugs": [
    "gad-7",
    "finding-a-therapist"
  ]
}
```

**Start with top 20 most-accessed resources**

#### 4. Hub A-Z Directory (HIGH PRIORITY)

**Create:** `/src/components/resources/ResourcesAlphabeticalDirectory.tsx`

- Reuse pattern from `ConditionBreadcrumbs`
- Group all resources A-Z
- Collapsible per letter on mobile
- Multi-column on desktop
- All links in initial HTML

**Add to:** `/src/app/resources/page.tsx` (footer section)

#### 5. Detail Page Crosslinks (MEDIUM PRIORITY)

**Update:** `/src/app/resources/[slug]/client-wrapper.tsx`

Add sections:
- Related Conditions (from `relatedConditionSlugs[]`)
- Related Resources (from `relatedResourceSlugs[]`)

**Use:** `ParsedContent` component for crawlable links

#### 6. Validation Script (HIGH PRIORITY)

**Create:** `/scripts/validate-resources.js`

**Checks:**
- [ ] Every resource has `metadata.category`
- [ ] Every resource's category exists in `RESOURCE_CATEGORIES`
- [ ] Every resource in data files is in `resources-index.json`
- [ ] Every resource in index is in sitemap
- [ ] No orphaned resources
- [ ] No duplicate slugs
- [ ] All `relatedConditionSlugs` reference existing conditions
- [ ] All `relatedResourceSlugs` reference existing resources

**Exit code 1 if any check fails** (blocks build)

#### 7. Sitemap Updates (MEDIUM PRIORITY)

**Update:** `/src/lib/seo/sitemap-config.ts`

```typescript
export const ENTITY_SITEMAP_CONFIG: Record<EntityType, SitemapEntryConfig> = {
  condition: { priority: 0.9, changefreq: 'weekly' },
  medication: { priority: 0.8, changefreq: 'monthly' },
  therapy: { priority: 0.8, changefreq: 'monthly' },
  resource: { priority: 0.7, changefreq: 'monthly' },  // ← Update priority
  assessment: { priority: 0.7, changefreq: 'quarterly' },
};
```

**Ensure:** All 95 resources in sitemap (fix orphaned items)

#### 8. Schema Updates (LOW PRIORITY)

**Create:** `/src/lib/seo/schema-builders/resource.ts`

- `Article` schema for guides/articles
- `HowTo` schema for how-to guides
- `MedicalWebPage` schema for assessments

**Update:** `SchemaFactory.generateAll()` to handle resources

---

### Implementation Order

**Week 1: Data Foundation**
1. Data cleanup script (`audit-resources.js`)
2. Fix 31 orphaned resources
3. Category configuration file
4. Validation script (`validate-resources.js`)

**Week 2: SEO Infrastructure**
5. Sitemap updates
6. Schema builders for resources
7. Hub A-Z directory component

**Week 3: Crosslinking**
8. Add JSON crosslink fields (top 20 resources)
9. Detail page crosslink sections
10. Test crawlability

**Week 4: QA + Launch**
11. Full crawl test (screaming-frog or similar)
12. CWV testing
13. Fix any regressions
14. Deploy

---

## STEP 5: VALIDATION SCRIPT SPECIFICATION

### Script: `/scripts/validate-resources.js`

**Purpose:** Fail build if resources have SEO/crawlability issues

**Checks:**

1. **Category Validation**
   - [ ] Every resource has `metadata.category`
   - [ ] Category exists in `RESOURCE_CATEGORIES`
   - [ ] Category slug matches directory structure

2. **Slug Uniqueness**
   - [ ] No duplicate slugs across all resources

3. **Status Validation**
   - [ ] Only `status: "active"` resources in `resources-index.json`
   - [ ] No `status: "draft"` in production index

4. **Indexing Validation**
   - [ ] Every JSON file in `/data/resources/` is in `resources-index.json`
   - [ ] Every item in `resources-index.json` has a matching JSON file

5. **Sitemap Validation**
   - [ ] Every active resource in sitemap
   - [ ] Sitemap count matches active resource count

6. **Crosslink Validation**
   - [ ] All `relatedConditionSlugs[]` reference existing conditions
   - [ ] All `relatedMedicationSlugs[]` reference existing medications
   - [ ] All `relatedResourceSlugs[]` reference existing resources
   - [ ] No self-references

7. **Hub Linkability**
   - [ ] Hub links to all 4 categories (check page component)
   - [ ] Each category hub links to all its resources (check server query)

8. **SEO Metadata**
   - [ ] Every resource has `name`
   - [ ] Every resource has `description` or `summary`
   - [ ] SEO title ≤ 60 chars (if provided)
   - [ ] SEO description ≤ 160 chars (if provided)

**Exit Codes:**
- `0` - All checks passed
- `1` - One or more checks failed (blocks build)

**Output Format:**
```
✅ Category Validation: 95/95 resources have valid categories
✅ Slug Uniqueness: No duplicates found
❌ Indexing Validation: 3 resources missing from index
   - /data/resources/knowledge-hub/example.json
   - /data/resources/digital-tools/example2.json
   - /data/resources/assessments-screeners/example3.json
✅ Sitemap Validation: 95/95 resources in sitemap
❌ Crosslink Validation: 2 broken references
   - phq-9.json references invalid condition: "major-depressive-disorder" (should be "major-depression")
   - gad-7.json references invalid resource: "anxiety-guide" (does not exist)

VALIDATION FAILED: 2/8 checks failed
```

---

## STEP 6: QA CHECKLIST

### Pre-Launch Validation

**Data Quality:**
- [ ] All 95 resources have `metadata.category`
- [ ] No orphaned resources (31 items fixed)
- [ ] No duplicate slugs
- [ ] All JSON files validate against schema

**Crawlability:**
- [ ] Hub links to all 4 categories (check DOM)
- [ ] Each category hub links to all resources (check DOM)
- [ ] A-Z directory footer exists on hub (check DOM)
- [ ] All crosslinks render as `<a href="...">` in initial HTML (check View Source)
- [ ] Breadcrumbs on all category + detail pages
- [ ] No broken links (check with screaming-frog or similar)

**SEO Metadata:**
- [ ] Every page has unique `<title>`
- [ ] Every page has unique `<meta name="description">`
- [ ] All titles ≤ 60 chars
- [ ] All descriptions ≤ 160 chars
- [ ] Canonical URLs correct on all pages
- [ ] No trailing slash inconsistencies

**Structured Data:**
- [ ] BreadcrumbList on category + detail pages
- [ ] Article/HowTo/MedicalWebPage schemas on detail pages
- [ ] FAQPage schema where FAQs exist
- [ ] All schemas validate (Google Rich Results Test)

**Sitemap:**
- [ ] Hub in sitemap (priority 0.9)
- [ ] 4 category hubs in sitemap (priority 0.7-0.8)
- [ ] All 95 detail pages in sitemap (priority 0.7)
- [ ] No duplicate URLs
- [ ] No 404s (validate all URLs)

**CWV / CLS:**
- [ ] No layout shift on hub (search bar reserved space)
- [ ] No layout shift on category pages (filters reserved space)
- [ ] No layout shift on detail pages (images have dimensions)
- [ ] Mobile CLS < 0.1
- [ ] Desktop CLS < 0.1

**Crosslinking:**
- [ ] Related Conditions section on detail pages (if `relatedConditionSlugs[]`)
- [ ] Related Resources section on detail pages (if `relatedResourceSlugs[]`)
- [ ] All links crawlable in initial HTML
- [ ] No broken crosslinks

**Internal Linking:**
- [ ] Hub → all categories (100% coverage)
- [ ] Categories → all resources (100% coverage)
- [ ] Resources → related resources (partial coverage OK for MVP)
- [ ] A-Z directory → all resources (100% coverage)

**Validation Script:**
- [ ] `npm run validate:resources` passes (exit code 0)
- [ ] CI/CD pipeline runs validation
- [ ] Build fails if validation fails

---

## SUCCESS METRICS

### 100/100 Definition

**Discoverability:**
- [ ] 100% of resources accessible from hub (via category or A-Z)
- [ ] 0 orphaned resources
- [ ] 0 broken internal links

**Crawlability:**
- [ ] 100% of critical links in initial HTML
- [ ] 100% of resources in sitemap
- [ ] 0 client-side-only navigation

**SEO:**
- [ ] 100% of pages have unique metadata
- [ ] 100% of pages have correct canonicals
- [ ] 100% of structured data validates

**UX:**
- [ ] Search works (title + aliases)
- [ ] Mobile CLS < 0.1
- [ ] Desktop CLS < 0.1
- [ ] Apple-like design consistency maintained

**Validation:**
- [ ] Validation script passes
- [ ] No build warnings/errors
- [ ] Backward compatible (no broken URLs)

---

## NEXT STEPS

1. Review this plan
2. Confirm approach aligns with vision
3. Prioritize tasks (reorder if needed)
4. Begin Phase 1 implementation
5. QA before launch

**Estimated Effort:** 2-3 weeks for Phase 1 MVP
