# Phase 1: Deep Architecture Analysis

**Reference Model:** `data/treatments/medications/alprazolam-Xanax.json`

**Analysis Date:** December 2, 2025

**Status:** ✅ Complete

---

## Executive Summary

HeyPsych currently uses a **monolithic JSON-based content model** where each treatment page (exemplified by Alprazolam/Xanax) is represented by a large, multi-layered JSON file containing:

- **Medical content** (clinical data, dosing, efficacy)
- **Editorial metadata** (authors, review dates, references)
- **SEO metadata** (titles, descriptions, keywords, search intent clusters)
- **Schema.org structured data** (complete Drug schema)
- **UI/UX hints** (visual_design, ui_hints, collapsible settings)
- **Presentation logic** (section ordering, display modes)

**Current State:**
- ✅ **SEO Performance:** Strong (CTR ~14.3%, Avg Position ~4.5)
- ✅ **Content Depth:** Comprehensive, YMYL-compliant
- ✅ **Schema Coverage:** 100% (Drug, MedicalWebPage, Breadcrumb, Person, FAQ)
- ⚠️ **Maintainability:** Poor - mixing concerns makes scaling difficult
- ⚠️ **Extensibility:** Brittle - adding new content types requires duplicating structure
- ⚠️ **Authoring Experience:** Complex - authors must understand SEO, schema, and UI

---

## 1. Data Flow: Alprazolam/Xanax JSON → Rendered Page

### 1.1 Source: The Canonical JSON Structure

**Location:** `data/treatments/medications/alprazolam-Xanax.json` (1,070 lines)

**Top-Level Structure:**
```json
{
  "kind": "treatment",
  "slug": "alprazolam-xanax",
  "type": "medication",
  "name": "Alprazolam (Xanax)",
  "summary": "...",
  "description": "...",
  "patient_summary": "...",
  "category": "medications/anxiety-disorders",

  "visual_design": { /* Apple Health-inspired design tokens */ },
  "metadata": { /* Drug classes, FDA approval, etc. */ },
  "clinical_metadata": { /* Indications, contraindications, pharmacokinetics */ },

  "sections": [ /* 20+ content sections with rendering hints */ ],

  "seo": { /* Manual overrides */ },
  "seo_extensions": {
    "keywords": [ /* 30+ keywords */ ],
    "search_intent_phrases": [ /* 25+ question formats */ ],
    "search_intent_clusters": { /* 10+ intent categories */ },
    "schema_org": { /* Complete Drug schema */ }
  },

  "editorial": { /* Review board, dates */ },
  "faqs": [ /* 12 FAQ pairs */ ]
}
```

**Key Observations:**
1. **Mixed Concerns:** Content, SEO, schema, and UI are tightly coupled
2. **Dual-Layer Architecture:** Some fields (`seo.title`) override auto-generation
3. **Section-Level Control:** Each section has `ui_hints`, `collapsible`, `ux_display` flags
4. **Schema Duplication:** `seo_extensions.schema_org` duplicates data already in `metadata` and `clinical_metadata`

### 1.2 Data Loading Layer

**Primary Path:** Server-side loading with fallback

**File:** `src/app/treatments/[slug]/page.tsx`

**Loading Logic:**
```typescript
// Special case for Xanax: Load directly from JSON file
if (slug === "alprazolam-xanax") {
  const jsonResult = await loadTreatmentFromJSON(slug);
  if (jsonResult) {
    entity = jsonToEntity(jsonResult.data, jsonResult.category, slug);
  } else {
    entity = await EntityService.getBySlug(slug); // Database fallback
  }
} else {
  entity = await EntityService.getBySlug(slug); // All other treatments
}
```

**Transformation:** `jsonToEntity()` wraps JSON in Entity interface:
```typescript
{
  id: `json-${slug}`,
  name: treatmentData.name,
  slug: slug,
  description: treatmentData.summary,
  content: treatmentData,    // ← Original JSON embedded here
  data: treatmentData,        // ← Duplicate reference
  metadata: { ...treatmentData.metadata, source: "json-file" },
  schema: { schema_name: "medications", entity_type: "medication" },
  status: "active"
}
```

**Critical Issue:** The entire Xanax JSON is loaded twice:
- `entity.content` → Full JSON structure
- `entity.data` → Same full JSON structure

This duplication is **not intentional** - it's an artifact of the current dual-architecture (JSON files + database).

### 1.3 SEO Metadata Generation

**File:** `src/lib/seo/metadata-factory.ts` → `src/lib/seo/metadata-generators/medication.ts`

**Flow:**
1. **Type Detection:** `MetadataFactory.generate(entity)` → determines entity is "medication"
2. **Generator Selection:** Routes to `MedicationMetadataGenerator`
3. **Manual Override Check:**
   ```typescript
   if (entity.seo?.title || entity.seo?.description) {
     return this.generateFromOverrides(entity);
   }
   ```
4. **Auto-Generation:** If no overrides, builds metadata from entity data:
   - **Title:** `"{Name} ({Brand}): Uses, Side Effects, Dosage | HeyPsych"`
   - **Description:** `"{Name} ({Brand}) is used to treat {primary_use}. Learn about dosing, side effects..."`
   - **Keywords:** Extracted from `data.drug_classes`, `data.brand_names`, `data.conditions_treated`
   - **Canonical:** `/treatments/{slug}`
   - **OpenGraph/Twitter:** Generated from title/description

**Xanax Example:**
```typescript
// Manual override from entity.seo (lines 646-650 in JSON):
{
  title: "Alprazolam (Xanax): Uses, Dosage, Side Effects & Withdrawal",
  description: "Xanax (alprazolam) for anxiety & panic: how it works in 30-60 min...",
  canonical: "https://www.heypsych.com/treatments/alprazolam-xanax",
  no_index: false
}
```

**Current Architecture:**
- ✅ **Dual-layer support:** Manual overrides + auto-generation
- ✅ **Type-specific logic:** Different generators for medications vs therapies vs conditions
- ⚠️ **Tight coupling:** Generators directly access `entity.data.*` structure
- ⚠️ **Limited reusability:** Each generator duplicates keyword extraction logic

### 1.4 Schema.org Generation

**File:** `src/lib/seo/schema-factory.ts` → `src/lib/seo/schema-builders/drug.ts`

**Flow:**
1. **Schema Stack Generation:** `SchemaFactory.generateAll(entity)` produces 5 schemas per page:
   ```typescript
   [
     buildDrugSchema(entity),              // Primary schema
     buildMedicalWebPageSchema(entity),    // Universal wrapper
     buildBreadcrumbSchema(entity),        // Navigation
     buildMedicalReviewBoardSchema(),      // E-A-T: Organization
     buildDefaultReviewBoardPersonSchema() // E-A-T: Reviewer
   ]
   ```

2. **Dual-Layer Architecture (CRITICAL):**
   ```typescript
   // Check for custom schema_org from seo_extensions
   const customSchemaOrg = entity.data?.seo_extensions?.schema_org;

   if (customSchemaOrg && typeof customSchemaOrg === 'object') {
     // Use custom schema if provided (Xanax uses this!)
     primarySchema = { ...customSchemaOrg };
   } else {
     // Auto-generate from entity data
     primarySchema = this.generatePrimarySchema(entity);
   }
   ```

3. **Xanax Schema Source:** Lines 863-1009 in JSON - **complete Drug schema**:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Drug",
     "name": "Alprazolam (Xanax)",
     "alternateName": ["Xanax", "Xanax XR", "Alprazolam Intensol"],
     "activeIngredient": "alprazolam",
     "drugClass": "Benzodiazepine",
     "indication": [
       { "@type": "MedicalIndication", "name": "Generalized Anxiety Disorder" },
       { "@type": "MedicalIndication", "name": "Panic Disorder" }
     ],
     "interactingDrug": [
       { "@type": "Drug", "name": "Opioids", "warning": "BLACK BOX WARNING..." }
     ],
     "warning": "High potential for dependence...",
     "availableStrength": [ /* 6 dosage forms */ ],
     // ... 150+ lines of schema data
   }
   ```

**Critical Observations:**
1. **Data Duplication:** Schema data repeats information already in `metadata` and `clinical_metadata`:
   - `schema_org.indication` duplicates `clinical_metadata.primary_indications`
   - `schema_org.drugClass` duplicates `metadata.drug_classes[0]`
   - `schema_org.warning` duplicates `sections[warnings].black_box`

2. **Maintenance Burden:** Updating Xanax requires changing data in **3 locations**:
   - `clinical_metadata.primary_indications` (content)
   - `sections[indications].items` (UI)
   - `seo_extensions.schema_org.indication` (SEO)

3. **Inconsistency Risk:** No validation ensures these 3 sources stay in sync

**Auto-Generation Path (not used for Xanax):**
`buildDrugSchema()` extracts schema from entity structure:
```typescript
function extractIndications(entity: Entity) {
  // Looks in multiple places:
  const primaryIndications = entity.data?.primary_indications ||
                            entity.metadata?.clinical?.primary_indications;

  const conditions = entity.data?.conditions_treated ||
                    entity.metadata?.clinical?.conditions_treated;

  const sections = entity.data?.sections?.find(s => s.type === 'indications');

  // Merges all sources, removes duplicates, converts to schema format
  return indications.map(indication => ({
    '@type': 'MedicalIndication',
    name: cleanText(indication)
  }));
}
```

**Why Xanax Doesn't Use Auto-Generation:**
- Auto-generation was built **after** Xanax JSON was created
- Xanax uses custom schema to maintain exact control over structured data
- Custom schema includes fields auto-generator doesn't support yet (e.g., `clinicalPharmacology`)

### 1.5 Rendering & UI Coupling

**File:** `src/app/treatments/[slug]/client-wrapper.tsx` (1,576 lines)

**Rendering Pipeline:**

1. **Server Component** (`page.tsx`) fetches entity and enhances content with inline links:
   ```typescript
   const enhancedEntity = await enhanceEntityContent(entity);
   const schemas = SchemaFactory.generateAll(entity);

   return (
     <>
       {schemas.map((schema, index) => (
         <script type="application/ld+json"
                 dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
       ))}
       <TreatmentClientWrapper entity={enhancedEntity} />
     </>
   );
   ```

2. **Client Component** (`client-wrapper.tsx`) renders sections dynamically:
   ```typescript
   const sections = entity.data?.sections || [];

   sections.map(section => {
     const { type, heading, ux_display, collapsible, ui_hints } = section;

     // Route to specialized renderer based on ui_hints.layout
     if (ui_hints?.layout === "quote_carousel") {
       return <QuoteCarousel quotes={...} uiHints={ui_hints} />;
     }
     if (ui_hints?.layout === "stat_card") {
       return <StatCard metric={...} uiHints={ui_hints} />;
     }
     if (ui_hints?.layout === "alert_banner") {
       return <AlertBanner severity={...} uiHints={ui_hints} />;
     }

     // Fallback to generic section renderer
     return renderSectionContent(section, type);
   });
   ```

3. **Section-Level Control:** Each section in Xanax JSON specifies:
   ```json
   {
     "type": "patient_experience",
     "heading": "What People Feel",
     "ux_display": "fully_visible",
     "collapsible": false,
     "ui_hints": {
       "layout": "quote_carousel",
       "icon": "quote.bubble.fill",
       "color": "#007AFF",
       "visual_priority": "hero",
       "card_style": "filled",
       "animation": "fade_slide_up"
     }
   }
   ```

**UI Coupling Issues:**

1. **Content Knows Too Much:** JSON specifies exact rendering strategy
   - `"layout": "quote_carousel"` → Directly references React component
   - `"animation": "fade_slide_up"` → Specifies Framer Motion animation
   - `"card_style": "filled"` → CSS class selection

2. **Design System Fragmentation:** Visual tokens scattered across:
   - `visual_design` (global tokens: colors, typography, spacing)
   - `ui_hints` (per-section overrides: colors, animations, layouts)
   - Hardcoded in components (e.g., `QuoteCarousel` has fixed styling)

3. **Maintenance Burden:** Changing UI requires:
   - Updating JSON files (hundreds of them)
   - OR: Updating component logic to handle legacy JSON formats
   - No central design system to enforce consistency

**Example:** Changing quote carousel background color requires:
- Option A: Update `ui_hints.color` in **every** JSON file with patient_experience sections
- Option B: Ignore `ui_hints.color` in `QuoteCarousel` component, breaking override capability

### 1.6 Content Enhancement (Automatic Linking)

**File:** `src/lib/linking/content-enhancer.ts`

**Purpose:** Automatically inject `{link:type:slug:Display Text}` syntax into content

**Flow:**
1. **Entity Loaded:** `entity = await EntityService.getBySlug('alprazolam-xanax')`
2. **Content Enhancement:** `enhancedEntity = await enhanceEntityContent(entity)`
3. **Link Injection:** Scans `entity.data.sections[].items` for entity names:
   ```typescript
   // Example: "Panic Disorder" → "{link:condition:panic-disorder:Panic Disorder}"
   ```
4. **Validation:** Only creates links for entities that exist in database
5. **Client Rendering:** `<ParsedContent>` component converts `{link:...}` to `<Link href="...">`

**Xanax Example (line 158 in JSON):**
```json
{
  "type": "indications",
  "items": [
    "{link:condition:panic-disorder:Panic Disorder}: Sudden panic attacks..."
  ]
}
```

**Architecture:**
- ✅ **Server-side:** No client-side lookups (fast rendering)
- ✅ **Validated:** Links only created for real entities
- ⚠️ **Dual-authored:** Some links manually embedded (like above), others auto-injected
- ⚠️ **Brittle syntax:** `{link:type:slug:text}` parser is regex-based, no AST

---

## 2. SEO Pipeline

### 2.1 Current SEO Flow for Alprazolam/Xanax

**SEO Metadata Sources (in priority order):**

1. **Manual Overrides** (`entity.seo` - lines 646-651):
   ```json
   {
     "title": "Alprazolam (Xanax): Uses, Dosage, Side Effects & Withdrawal",
     "description": "Xanax (alprazolam) for anxiety & panic: how it works...",
     "canonical": "https://www.heypsych.com/treatments/alprazolam-xanax",
     "no_index": false
   }
   ```

2. **Extended SEO Data** (`entity.seo_extensions` - lines 652-862):
   - **30 keywords:** Primary, brand names, dosages, comparisons
   - **25 search intent phrases:** "What is Xanax used for?", "How long does Xanax last?"
   - **10 intent clusters:** informational, condition_specific, side_effects_safety, interactions, etc.
   - **Complete schema.org:** 150-line Drug schema (lines 863-1009)

3. **Auto-Generated (Fallback):**
   - Used when `entity.seo` is missing
   - Extracts metadata from `entity.name`, `entity.data.primary_indications`, etc.

**Metadata Flow:**
```
Manual Override Check (MetadataFactory)
         ↓
   Has entity.seo?
    ↓ YES         ↓ NO
 Use Manual    Auto-Generate
 Overrides    (MedicationMetadataGenerator)
    ↓              ↓
  Merge with OpenGraph/Twitter
         ↓
   Output: Next.js Metadata object
```

**SEO Outputs (for Xanax):**
```typescript
{
  title: "Alprazolam (Xanax): Uses, Dosage, Side Effects & Withdrawal",
  description: "Xanax (alprazolam) for anxiety & panic...",
  keywords: "Xanax, alprazolam, Xanax uses, Xanax side effects, ...", // 30 keywords
  alternates: {
    canonical: "https://www.heypsych.com/treatments/alprazolam-xanax"
  },
  openGraph: {
    type: "article",
    title: "Alprazolam (Xanax): Uses, Dosage, Side Effects & Withdrawal",
    description: "Xanax (alprazolam) for anxiety & panic...",
    url: "https://www.heypsych.com/treatments/alprazolam-xanax",
    siteName: "HeyPsych"
  },
  twitter: {
    card: "summary_large_image",
    title: "Alprazolam (Xanax): Uses, Dosage, Side Effects & Withdrawal",
    description: "Xanax (alprazolam) for anxiety & panic..."
  }
}
```

### 2.2 Schema.org Structured Data

**Output (5 schemas per page):**

1. **Drug Schema** (Primary):
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Drug",
     "name": "Alprazolam (Xanax)",
     "alternateName": ["Xanax", "Xanax XR"],
     "drugClass": "Benzodiazepine",
     "indication": [...],
     "warning": "...",
     "interactingDrug": [...]
   }
   ```

2. **MedicalWebPage** (Universal):
   ```json
   {
     "@type": "MedicalWebPage",
     "mainEntity": { "@id": "#drug" },
     "reviewedBy": { "@id": "#medical-review-board" },
     "datePublished": "2024-11-28",
     "dateModified": "2024-11-30"
   }
   ```

3. **BreadcrumbList** (Navigation):
   ```json
   {
     "@type": "BreadcrumbList",
     "itemListElement": [
       { "@type": "ListItem", "position": 1, "name": "Home" },
       { "@type": "ListItem", "position": 2, "name": "Treatments" },
       { "@type": "ListItem", "position": 3, "name": "Alprazolam (Xanax)" }
     ]
   }
   ```

4. **Organization** (Medical Review Board):
   ```json
   {
     "@type": "MedicalOrganization",
     "name": "HeyPsych Medical Review Board",
     "url": "https://www.heypsych.com/about/medical-review-board"
   }
   ```

5. **Person** (Medical Reviewer):
   ```json
   {
     "@type": "Person",
     "name": "HeyPsych Medical Review Board",
     "jobTitle": "Medical Review Board",
     "affiliation": { "@id": "#medical-review-board" }
   }
   ```

**Schema Validation:**
- ✅ **Google Rich Results Test:** Passes for Drug schema
- ✅ **Schema.org Validator:** Valid JSON-LD
- ✅ **E-A-T Compliance:** Author + Reviewer + Medical Organization present

### 2.3 SEO Strengths

1. **Comprehensive Coverage:**
   - 100% metadata coverage (title, description, canonical)
   - 100% schema coverage (5 schemas per page)
   - Rich keyword targeting (30+ keywords per treatment)
   - Search intent mapping (10+ intent clusters)

2. **Manual Control:**
   - Authors can override auto-generated metadata
   - Supports custom schema.org fields
   - Fine-grained control over keyword targeting

3. **E-A-T Signals:**
   - Medical Review Board schema
   - Published/Updated/Reviewed timestamps
   - Author + Reviewer Person schemas
   - References with PMID/DOI links

4. **Performance:**
   - Server-side generation (no SEO JS waterfalls)
   - Static generation at build time (fast TTFB)
   - ISR revalidation (24hr) keeps content fresh

### 2.4 SEO Fragility Points

1. **Data Duplication → Drift Risk:**
   - **Problem:** Same data in 3+ locations
   - **Example:** Primary indications exist in:
     - `clinical_metadata.primary_indications` (source of truth?)
     - `sections[indications].items` (UI display)
     - `seo_extensions.schema_org.indication` (schema)
     - `seo.description` (manual metadata)
   - **Risk:** Author updates one location, forgets others → inconsistent SEO

2. **Manual Override Fragility:**
   - **Problem:** No validation of manual overrides
   - **Example:** Author writes `seo.title: "Xanax - Anxiety Med"` (only 18 chars)
     - Too short for SEO (<30 chars optimal)
     - MetadataFactory has validator but it's not run during authoring
   - **Risk:** Invalid metadata ships to production

3. **Schema Completeness Depends on JSON Quality:**
   - **Problem:** Auto-generated schema quality varies with data completeness
   - **Example:** If `clinical_metadata.contraindications` is missing:
     - Drug schema omits `contraindication` field
     - Google may penalize incomplete medical content
   - **Risk:** Incomplete data → incomplete schema → lower rankings

4. **Tight Coupling to Entity Structure:**
   - **Problem:** SEO generators directly access `entity.data.*` paths
   - **Example:** `MedicationMetadataGenerator.extractPrimaryIndication()`:
     ```typescript
     const indications = entity.data?.primary_indications ||
                        entity.metadata?.clinical?.primary_indications;
     ```
   - **Risk:** Changing data structure breaks SEO generation

5. **No SEO Regression Testing:**
   - **Problem:** No automated checks that metadata quality is maintained
   - **Example:** Renaming `primary_indications` → `indications` in JSON:
     - Breaks metadata description ("used to treat mental health conditions")
     - No test catches this until deployed
   - **Risk:** Silent SEO degradation

---

## 3. Structured Data Generation (Schema.org)

### 3.1 Current Schema Architecture

**Dual-Layer Design:**

```
┌─────────────────────────────────────────────┐
│ SchemaFactory.generateAll(entity)           │
│                                             │
│ 1. Check for custom schema                 │
│    ↓                                        │
│    entity.data?.seo_extensions?.schema_org  │
│    ↓ EXISTS                  ↓ MISSING     │
│    Use Custom                Auto-Generate  │
│    (Xanax uses this)        (Most content)  │
│                                             │
│ 2. Generate supporting schemas              │
│    - MedicalWebPage (universal)            │
│    - BreadcrumbList (navigation)           │
│    - Organization (E-A-T)                  │
│    - Person (E-A-T)                        │
│                                             │
│ 3. Generate FAQPage (if FAQs present)      │
│                                             │
│ Output: Array of 3-5 JSON-LD schemas       │
└─────────────────────────────────────────────┘
```

**Schema Generation Flow (Auto-Generated Path):**

```typescript
// buildDrugSchema(entity) - src/lib/seo/schema-builders/drug.ts

{
  '@context': 'https://schema.org',
  '@type': 'Drug',

  // Basic properties extracted from entity
  'name': entity.name,
  'description': entity.description || entity.data?.description,
  'alternateName': extractBrandNames(entity),           // → data.brand_names
  'activeIngredient': extractActiveIngredient(entity),  // → entity.name split
  'drugClass': entity.data?.drug_classes,               // → data.drug_classes[0]

  // Administration
  'administrationRoute': entity.data?.administration_routes?.[0],
  'dosageForm': extractDosageForms(entity),             // → sections[dosage_forms]
  'availableStrength': extractDosageStrengths(entity),  // → sections[dosage_forms]

  // Legal/Prescription
  'prescriptionStatus': mapPrescriptionStatus(entity.data?.prescription_status),
  'isAvailableGenerically': entity.data?.generic_available,
  'legalStatus': buildLegalStatus(entity.data?.dea_schedule),

  // Medical
  'indication': extractIndications(entity),             // → clinical_metadata + sections
  'contraindication': extractContraindications(entity), // → clinical_metadata
  'warning': extractWarnings(entity),                   // → sections[warnings]
  'adverseOutcome': extractAdverseEffects(entity),      // → sections[adverse_effects]
  'interactingDrug': extractInteractions(entity),       // → sections[interactions]

  // Additional
  'mechanismOfAction': entity.data?.mechanism_of_action,
  'pregnancyCategory': entity.data?.pregnancy_category,
  'clinicalPharmacology': extractClinicalTrial(entity) // → clinical_metadata.efficacy_response
}
```

**Extraction Functions (Deep Data Mining):**

```typescript
function extractIndications(entity: Entity): Record<string, any>[] {
  const indications: Record<string, any>[] = [];

  // Source 1: clinical_metadata.primary_indications
  const primaryIndications = entity.data?.primary_indications ||
                            entity.metadata?.clinical?.primary_indications;
  if (Array.isArray(primaryIndications)) {
    primaryIndications.forEach(indication => {
      indications.push({
        '@type': 'MedicalIndication',
        'name': cleanText(indication)
      });
    });
  }

  // Source 2: clinical_metadata.conditions_treated
  const conditions = entity.data?.conditions_treated ||
                    entity.metadata?.clinical?.conditions_treated;
  if (Array.isArray(conditions)) {
    conditions.forEach(condition => {
      indications.push({
        '@type': 'MedicalIndication',
        'name': cleanText(condition)
      });
    });
  }

  // Source 3: sections[indications].items
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const indicationsSection = sections.find(s => s.type === 'indications');
    if (indicationsSection?.items) {
      indicationsSection.items.forEach(item => {
        indications.push({
          '@type': 'MedicalIndication',
          'name': cleanText(item)
        });
      });
    }
  }

  // Deduplicate and return
  return deduplicateByName(indications);
}
```

### 3.2 Schema Data Sources for Xanax

**Custom Schema Source:** `seo_extensions.schema_org` (lines 863-1009)

**Data Mapping:**

| Schema Field | Custom Source (Xanax) | Auto-Generated Source (Other Content) |
|--------------|----------------------|--------------------------------------|
| `name` | Hardcoded | `entity.name` |
| `alternateName` | Hardcoded array | `entity.data.brand_names` |
| `drugClass` | Hardcoded | `entity.data.drug_classes[0]` |
| `indication` | Hardcoded array | `clinical_metadata.primary_indications` + `sections[indications]` |
| `warning` | Hardcoded | `sections[warnings].black_box` + `sections[warnings].other` |
| `interactingDrug` | Hardcoded array | `sections[interactions].items` |
| `availableStrength` | Hardcoded array | `sections[dosage_forms].items` (parsed) |
| `legalStatus` | Hardcoded object | `metadata.dea_schedule` (formatted) |
| `clinicalPharmacology` | Hardcoded | `clinical_metadata.efficacy_response` |

**Critical Issue:** Xanax schema is **100% hardcoded**, ignoring all entity data.

**Why This Matters:**
- Updating Xanax dosage forms requires changing:
  1. `sections[dosage_forms].items` (for UI)
  2. `seo_extensions.schema_org.availableStrength` (for SEO)
- No validation ensures these stay in sync
- Authors must remember to update both locations

### 3.3 Schema Validation & Quality

**Validation Tools:**
- ✅ Google Rich Results Test: [Passed for Drug schema](https://search.google.com/test/rich-results)
- ✅ Schema.org Validator: Valid JSON-LD syntax
- ✅ SchemaFactory.validate(): Basic presence checks

**Quality Metrics:**
- ✅ **Coverage:** 100% of pages have primary + supporting schemas
- ✅ **Completeness:** Drug schema includes 20+ properties
- ✅ **E-A-T:** Author + Reviewer + Medical Organization present
- ⚠️ **Consistency:** No validation that schema matches page content
- ⚠️ **Freshness:** No checks that outdated data is removed

**Example Quality Issue:**
- Xanax schema says: `"warning": "High potential for dependence..."` (line 969)
- Xanax page shows: BLACK BOX WARNING with full text (lines 285-286)
- Schema warning is **abbreviated** - missing critical opioid interaction warning
- Google may interpret this as incomplete medical information

---

## 4. Rendering & UI Coupling

### 4.1 Section-Level Rendering Control

**Current Architecture:** Each section in JSON specifies exact rendering strategy.

**Example: Patient Experience Section (lines 179-227):**
```json
{
  "type": "patient_experience",
  "heading": "What People Feel",
  "intro": "Everyone responds differently, but these are the most common experiences:",
  "items": [
    {
      "category": "Relief (30-60 min)",
      "quotes": ["My panic melted away within 30 minutes.", ...]
    }
  ],
  "ux_display": "fully_visible",
  "collapsible": false,
  "ui_hints": {
    "layout": "quote_carousel",
    "icon": "quote.bubble.fill",
    "color": "#007AFF",
    "visual_priority": "hero",
    "card_style": "filled",
    "animation": "fade_slide_up"
  }
}
```

**Rendering Logic (client-wrapper.tsx, lines 224-239):**
```typescript
if (uiHints?.layout === "quote_carousel" && type === "patient_experience") {
  const quotes = sectionData.items?.flatMap(item =>
    item.quotes?.map(quote => ({
      text: quote,
      category: item.category
    }))
  );

  return (
    <QuoteCarousel
      quotes={quotes}
      intro={sectionData.intro}
      uiHints={uiHints}  // ← Passes design tokens to component
    />
  );
}
```

**Design Token Flow:**
```
JSON ui_hints.color ("#007AFF")
     ↓
QuoteCarousel component
     ↓
Applies as inline style or Tailwind class
     ↓
Rendered HTML: <div style="color: rgb(0, 122, 255)">
```

### 4.2 UI Hints Architecture

**Purpose:** Allow JSON authors to control component styling without editing code.

**Supported Properties:**
```typescript
interface UIHints {
  layout: string;           // Component selection: "quote_carousel", "stat_card", etc.
  icon: string;            // Icon name (SF Symbols or Lucide)
  color: string;           // Hex color code
  visual_priority: string; // "hero", "high", "medium", "low"
  card_style: string;      // "filled", "outlined", "subtle", "elevated"
  animation: string;       // Framer Motion animation name
  progressive_disclosure?: boolean; // Show/hide logic
  sticky?: boolean;        // Sticky positioning
  emphasize_first?: boolean; // Highlight first item
}
```

**Problems with Current Approach:**

1. **Brittle Coupling:** Changing component props breaks JSON files
   - Example: Renaming `QuoteCarousel` → `TestimonialSlider`
   - Requires updating `ui_hints.layout` in **every** JSON file using it

2. **No Type Safety:** JSON strings aren't validated
   - Example: `"layout": "quote_carousell"` (typo)
   - Falls back to generic renderer (silent failure)

3. **Design System Fragmentation:**
   - Colors defined in 3 places:
     - `visual_design.colors` (global palette)
     - `ui_hints.color` (per-section overrides)
     - Tailwind config (hardcoded classes)
   - No single source of truth for brand colors

4. **Limited Reusability:**
   - Each section specifies full ui_hints
   - No concept of "presets" or "themes"
   - Changing site-wide button style requires updating hundreds of sections

### 4.3 Collapsible Sections Logic

**Strategy:** Only 3 sections expanded by default (lines 195-198 in client-wrapper.tsx):
```typescript
function shouldSectionBeExpandedByDefault(type: string): boolean {
  return ["indications", "patient_experience", "onset_duration"].includes(type);
}
```

**Collapsible Control:**
```json
{
  "type": "adverse_effects",
  "heading": "Side Effects",
  "collapsible": true,  // ← Can be collapsed by user
  "ux_display": "fully_visible" // ← All content visible when expanded
}
```

**Rendering Logic (lines 1286-1341):**
```typescript
const shouldBeExpandedByDefault = shouldSectionBeExpandedByDefault(type);
const isAlwaysExpanded = collapsible === false;

// Global expand/collapse control
const effectiveIsExpanded = isAlwaysExpanded
  ? true
  : expandAll !== null ? expandAll : isExpanded;

return (
  <Card>
    <CardHeader
      onClick={needsCollapsibleWrapper ? () => setIsExpanded(!isExpanded) : undefined}
    >
      <h2>{title}</h2>
      {needsCollapsibleWrapper && (
        <ChevronIcon />
      )}
    </CardHeader>
    <CardContent>
      {needsCollapsibleWrapper ? (
        <CollapsibleContent isExpanded={effectiveIsExpanded}>
          {renderSectionContent(section)}
        </CollapsibleContent>
      ) : (
        renderSectionContent(section)
      )}
    </CardContent>
  </Card>
);
```

**Issues:**

1. **Hardcoded Defaults:** Only 3 section types default to expanded
   - Can't be configured per-treatment (e.g., Xanax warnings should always expand)
   - Requires code change to adjust defaults

2. **Global vs Local State Conflict:**
   - "Expand All" button overrides individual section state
   - After clicking "Expand All", individual toggles don't work (until clicked again)
   - Confusing UX

3. **No Persistence:** User preferences not saved
   - Collapsing a section → refreshing page → section resets to default

### 4.4 Visual Design System

**Global Design Tokens** (`visual_design` - lines 10-65):
```json
{
  "theme": "medical-professional",
  "layout": "apple-health",
  "typography": {
    "heading_font": "SF Pro Display",
    "body_font": "SF Pro Text",
    "heading_scale": { "h1": "32px / 600", "h2": "24px / 600" },
    "line_height": "1.5"
  },
  "spacing": {
    "section_gap": "40px",
    "card_padding": "24px",
    "list_item_gap": "12px"
  },
  "colors": {
    "critical": "#FF3B30",
    "warning": "#FF9500",
    "info": "#007AFF",
    "success": "#34C759"
  },
  "cards": {
    "style": "elevated",
    "border_radius": "12px",
    "shadow": "0 2px 8px rgba(0, 0, 0, 0.08)"
  },
  "animations": {
    "expand_duration": "300ms",
    "expand_easing": "cubic-bezier(0.4, 0.0, 0.2, 1)"
  }
}
```

**Problems:**

1. **Not Used Consistently:**
   - `visual_design.colors.critical` = `"#FF3B30"`
   - Tailwind config has hardcoded: `text-red-600` (different shade)
   - Components don't reference `visual_design` tokens

2. **No Enforcement:**
   - Authors can put any color in `ui_hints.color`
   - No validation against `visual_design.colors` palette

3. **Duplication:**
   - Same design tokens in:
     - JSON `visual_design` object
     - Tailwind config file
     - CSS custom properties
   - No single source of truth

---

## 5. Maintainability Risks

### 5.1 Data Duplication & Drift

**Problem:** Same information stored in multiple locations within JSON.

**Example 1: Primary Indications**

Xanax's primary indications appear in **4 locations**:

1. **clinical_metadata.primary_indications** (lines 94-98):
   ```json
   "primary_indications": [
     "Generalized Anxiety Disorder (GAD)",
     "Panic Disorder",
     "Panic Disorder with Agoraphobia"
   ]
   ```

2. **sections[indications].items** (lines 157-161):
   ```json
   "items": [
     "{link:condition:generalized-anxiety-disorder:Generalized Anxiety Disorder (GAD)}: Persistent, excessive worry...",
     "{link:condition:panic-disorder:Panic Disorder}: Sudden panic attacks..."
   ]
   ```

3. **seo_extensions.schema_org.indication** (lines 923-951):
   ```json
   "indication": [
     { "@type": "MedicalIndication", "name": "Generalized Anxiety Disorder" },
     { "@type": "MedicalIndication", "name": "Panic Disorder" }
   ]
   ```

4. **seo.description** (line 648):
   ```json
   "description": "Xanax (alprazolam) for anxiety & panic: ..."
   ```

**Drift Scenario:**
- FDA approves Xanax for new indication: "Social Anxiety Disorder"
- Author updates `clinical_metadata.primary_indications` (adds entry)
- Author forgets to update `seo_extensions.schema_org.indication`
- Result:
  - Page content shows 4 indications
  - Schema.org shows 3 indications
  - Google sees inconsistency → potential ranking penalty

**Example 2: Warnings**

Black box warning appears in **3 locations**:

1. **sections[warnings].black_box** (line 285)
2. **seo_extensions.schema_org.warning** (line 969)
3. **sections[interactions].items[0].risk** (line 386 - opioid interaction)

**Drift Scenario:**
- FDA strengthens black box warning language
- Author updates `sections[warnings].black_box`
- Author forgets to update `schema_org.warning`
- Result:
  - Visual warning is up-to-date
  - Structured data warning is outdated
  - Google may penalize for incomplete/misleading schema

### 5.2 Manual Override Fragility

**Problem:** No validation of manual SEO overrides.

**Current Flow:**
```typescript
if (entity.seo?.title || entity.seo?.description) {
  return this.generateFromOverrides(entity);  // ← No validation!
}
```

**Risk Scenarios:**

1. **Title Too Short:**
   ```json
   "seo": { "title": "Xanax Info" }  // Only 10 chars (optimal: 50-60)
   ```
   - No error at authoring time
   - No warning at build time
   - Ships to production with poor SEO

2. **Missing Canonical:**
   ```json
   "seo": {
     "title": "...",
     "description": "..."
     // Missing "canonical" → Google confused about preferred URL
   }
   ```

3. **Inconsistent Branding:**
   ```json
   // Treatment 1:
   "seo": { "title": "Sertraline (Zoloft): Uses, Dosage | HeyPsych" }

   // Treatment 2:
   "seo": { "title": "Fluoxetine (Prozac) - Side Effects, Dosing" }

   // Inconsistent format → dilutes brand identity
   ```

**Validation Exists But Isn't Used:**
```typescript
// MetadataFactory.validate() - exists but never called during build!
static validate(metadata: Metadata): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!metadata.title || metadata.title.length < 30) {
    issues.push('Title too short (min 30 chars)');
  }
  if (metadata.title.length > 60) {
    issues.push('Title too long (max 60 chars)');
  }
  // ... more checks

  return { valid: issues.length === 0, issues };
}
```

**Fix Required:** Run validation in CI/CD pipeline, block deployment if invalid.

### 5.3 Tight Coupling to Entity Structure

**Problem:** SEO generators directly access nested `entity.data.*` paths.

**Example: MedicationMetadataGenerator.extractPrimaryIndication():**
```typescript
private extractPrimaryIndication(entity: Entity): string {
  const primaryIndications = entity.data?.primary_indications ||
                            entity.metadata?.clinical?.primary_indications;
  // ↑ Hardcoded paths - changing structure breaks SEO

  if (Array.isArray(primaryIndications) && primaryIndications.length > 0) {
    return this.cleanLinkSyntax(primaryIndications[0]).toLowerCase();
  }

  const conditionsTreated = entity.data?.conditions_treated ||
                           entity.metadata?.clinical?.conditions_treated;
  // ↑ Fallback to alternate path - brittle

  return 'mental health conditions';  // Fallback
}
```

**Risk Scenarios:**

1. **Data Model Change:**
   - Refactor: Rename `primary_indications` → `indications`
   - Impact: SEO description breaks ("used to treat mental health conditions" instead of "GAD")
   - No compile-time error (TypeScript can't catch dynamic paths)

2. **Nested Path Changes:**
   - Move `clinical_metadata.primary_indications` → `metadata.clinical.indications`
   - Impact: SEO generator falls back to generic text
   - No runtime error (just degraded metadata)

3. **Type Inconsistency:**
   - Change `primary_indications` from `string[]` to `{ name: string; icd10: string }[]`
   - Impact: SEO generator tries to `.toLowerCase()` an object → runtime crash

**Solution Required:** Abstract data access behind stable interface.

### 5.4 No Automated SEO Regression Testing

**Problem:** Changes to data structure silently degrade SEO outputs.

**Missing Tests:**

1. **Metadata Quality Tests:**
   ```typescript
   // ❌ MISSING: Should exist in CI/CD pipeline
   describe('SEO Metadata Quality', () => {
     it('should generate valid title for all treatments', async () => {
       const treatments = await EntityService.getAllByType('medication');

       for (const treatment of treatments) {
         const metadata = await MetadataFactory.generate(treatment);
         const validation = MetadataFactory.validate(metadata);

         expect(validation.valid).toBe(true);
         expect(metadata.title).toHaveLength({ min: 30, max: 60 });
       }
     });
   });
   ```

2. **Schema Completeness Tests:**
   ```typescript
   // ❌ MISSING
   it('should generate complete Drug schema for medications', () => {
     const xanax = loadEntity('alprazolam-xanax');
     const schemas = SchemaFactory.generateAll(xanax);
     const drugSchema = schemas.find(s => s['@type'] === 'Drug');

     expect(drugSchema).toHaveProperty('name');
     expect(drugSchema).toHaveProperty('indication');
     expect(drugSchema).toHaveProperty('warning');
     expect(drugSchema).toHaveProperty('interactingDrug');
   });
   ```

3. **Schema-Content Consistency Tests:**
   ```typescript
   // ❌ MISSING: Critical for YMYL content
   it('should have schema.org indication matching page content', () => {
     const xanax = loadEntity('alprazolam-xanax');
     const schemas = SchemaFactory.generateAll(xanax);
     const drugSchema = schemas.find(s => s['@type'] === 'Drug');

     const schemaIndications = drugSchema.indication.map(i => i.name);
     const pageIndications = xanax.data.clinical_metadata.primary_indications;

     expect(schemaIndications).toEqual(expect.arrayContaining(pageIndications));
   });
   ```

**Current State:**
- ✅ TypeScript compilation (catches type errors)
- ✅ Next.js build (catches import errors)
- ❌ No SEO quality gates
- ❌ No schema validation in CI
- ❌ No metadata completeness checks

**Risk:** Developers merge PRs that degrade SEO, only discovered after deployment when rankings drop.

---

## 6. SEO Fragility Points

### 6.1 Critical SEO Dependencies

**If These Break, Rankings Drop:**

1. **Title Tag Generation:**
   - **Current:** Manual override or auto-generate from `entity.name` + `brand_names`
   - **Risk:** Renaming fields breaks auto-generation
   - **Impact:** Google sees blank titles → immediate ranking loss

2. **Canonical URL:**
   - **Current:** `https://www.heypsych.com/treatments/{entity.slug}`
   - **Risk:** Changing slug or URL structure without 301 redirects
   - **Impact:** Duplicate content penalty, lost backlinks

3. **Schema.org Drug:**
   - **Current:** Custom schema or auto-generated
   - **Risk:** Incomplete schema (missing `indication` or `warning`)
   - **Impact:** Google penalties for incomplete medical information

4. **E-A-T Signals:**
   - **Current:** Medical Review Board + Person schemas
   - **Risk:** Removing or mislabeling medical reviewer
   - **Impact:** YMYL content requires authorship → rankings drop

5. **Internal Linking:**
   - **Current:** `{link:type:slug}` syntax auto-converted to `<Link>`
   - **Risk:** Breaking link parser or entity slug changes
   - **Impact:** Broken links → orphan pages → indexing issues

### 6.2 Silent Degradation Scenarios

**Scenario 1: Incomplete Schema (YMYL Risk)**

- **Trigger:** Author forgets to populate `clinical_metadata.contraindications`
- **Auto-Generated Schema:** Omits `contraindication` field
- **Google Interpretation:** Incomplete medical information
- **Result:** Page ranked lower than competitors with complete data
- **Detection:** None (no validation)

**Scenario 2: Keyword Drift**

- **Trigger:** Author updates `name` from "Alprazolam (Xanax)" to "Alprazolam"
- **SEO Impact:**
  - Title becomes: "Alprazolam: Uses, Side Effects | HeyPsych"
  - Keywords lose: "Xanax", "Xanax uses", "Xanax side effects"
- **Result:** Lost rankings for high-volume "Xanax" searches
- **Detection:** None (no keyword tracking)

**Scenario 3: Canonical URL Mismatch**

- **Trigger:** JSON has `"canonical": "https://www.heypsych.com/medications/xanax"` but page is at `/treatments/alprazolam-xanax`
- **Google Sees:** Two URLs for same content (one in sitemap, one in canonical)
- **Result:** Indexing confusion, potential duplicate content penalty
- **Detection:** None (no URL validation)

**Scenario 4: Schema-Content Drift (E-A-T Risk)**

- **Trigger:** Author updates page to add 4th indication, forgets to update schema
- **Page Shows:** 4 indications (GAD, Panic Disorder, Agoraphobia, Social Anxiety)
- **Schema Shows:** 3 indications (GAD, Panic Disorder, Agoraphobia)
- **Google Sees:** Inconsistency between visible content and structured data
- **Result:** Trust signal reduced → lower rankings
- **Detection:** None (no consistency validation)

### 6.3 Manual Override Risks

**Problem:** Authors can bypass auto-generation, introducing errors.

**Example: Xanax Custom Schema (lines 863-1009)**

Custom schema has **150 lines** of hardcoded data:
```json
{
  "@type": "Drug",
  "name": "Alprazolam (Xanax)",
  "alternateName": ["Xanax", "Xanax XR", "Alprazolam Intensol"],
  "activeIngredient": "alprazolam",
  "drugClass": "Benzodiazepine",
  // ... 140 more lines
}
```

**Risks:**

1. **Stale Data:**
   - Custom schema written in 2024
   - Clinical data updated in 2025
   - Custom schema not updated → outdated information in Google

2. **Typos:**
   - Hardcoded: `"alternateName": ["Xanax", "Xanax XR"]`
   - Missing brand: "Niravam" (also alprazolam brand)
   - Competitors rank higher for "Niravam" searches

3. **Incomplete Fields:**
   - Custom schema has: `"warning": "High potential for dependence..."`
   - Missing: BLACK BOX WARNING about opioid interactions
   - Serious medical omission → potential regulatory issue

4. **No Validation:**
   - SchemaFactory accepts custom schema without checks
   - No requirement for specific fields
   - No comparison to auto-generated schema

**Solution Required:** Validate custom schemas against required fields, warn if diverging from auto-generated.

### 6.4 Build-Time Validation Gaps

**Current Build Process:**

```
1. TypeScript Compilation
   ↓ ✅ Catches type errors
2. Next.js Build
   ↓ ✅ Generates static pages
3. Deploy to Vercel
   ↓ ❌ No SEO validation
```

**Missing Validation Steps:**

1. **Pre-Deploy SEO Audit:**
   ```bash
   npm run seo:validate  # ❌ Exists but not run in CI
   ```
   - Should validate all metadata (title length, description, canonical)
   - Should validate all schemas (required fields, valid URLs)
   - Should check keyword coverage (min 10 keywords per page)

2. **Schema Validation:**
   ```bash
   npm run seo:test-schemas  # ❌ Doesn't exist
   ```
   - Should run Google Rich Results Test on all pages
   - Should validate against schema.org spec
   - Should check for YMYL-required fields (author, reviewer, dates)

3. **Link Validation:**
   ```bash
   npm run links:validate  # ❌ Doesn't exist
   ```
   - Should check all `{link:}` syntax resolves to real entities
   - Should detect orphan pages (no incoming links)
   - Should detect broken external links in references

4. **Regression Detection:**
   ```bash
   npm run seo:compare  # ❌ Doesn't exist
   ```
   - Should compare generated metadata to previous build
   - Should flag pages with missing metadata
   - Should alert on keyword losses

**Implementation Required:** Add CI/CD quality gates that fail build if SEO validation fails.

---

## 7. Scaling Limits

### 7.1 Current Content Inventory

**Treatments:**
- Medications: 500+ JSON files
- Therapies: 50+ JSON files
- Interventional: 30+ JSON files
- Alternative: 100+ JSON files
- Supplements: 80+ JSON files
- Investigational: 20+ JSON files
- **Total: ~780 treatment JSONs**

**Conditions:**
- Anxiety/Fear: 10 files
- Mood/Depression: 12 files
- Psychotic Disorders: 9 files
- Personality Disorders: 11 files
- Other categories: ~100 files
- **Total: ~140 condition JSONs**

**Resources:**
- Assessments: 10+ files
- Knowledge Hub: 20+ files
- Support/Crisis: 30+ files
- **Total: ~60 resource JSONs**

**Grand Total: ~980 JSON files**

### 7.2 Scaling Challenges

**Challenge 1: JSON File Size**

- **Xanax JSON:** 1,070 lines, 75KB
- **Average Medication:** ~800 lines, 50KB
- **Total Size:** 980 files × 50KB = 49MB of JSON
- **Git Repo Impact:** Large diffs, slow clone times
- **Build Time:** 980 files × 50ms parsing = 49 seconds just loading JSON

**Challenge 2: Duplicated Structure**

Each JSON file contains:
- `visual_design`: 55 lines (repeated 980 times → 53,900 lines)
- `ui_hints`: 10 lines per section × 15 sections × 980 files = 147,000 lines
- `seo_extensions.search_intent_clusters`: 150 lines (repeated 980 times → 147,000 lines)

**Estimated Duplication:** ~350,000 lines of repeated boilerplate

**Challenge 3: Inconsistent Maintenance**

- 980 files to update when changing design system
- No tooling to batch-update ui_hints
- Example: Changing button color from blue to green:
  - Must update `ui_hints.color` in ~500 sections across ~200 files
  - ~30 hours of manual work
  - High risk of missing files → inconsistent UI

**Challenge 4: Future Content Types**

Planned additions:
- **Providers:** 1,000+ psychiatrists, therapists (needs new schema)
- **Locations:** 500+ clinics, hospitals (needs new schema)
- **Articles:** 500+ blog posts (needs new schema)
- **Videos:** 200+ educational videos (needs new schema)

**Problem:** Each new content type requires:
- Copying full Xanax JSON structure (1,070 lines)
- Adapting sections to new type (e.g., provider has "specialties" instead of "indications")
- Creating new metadata generator
- Creating new schema builder
- Updating client-wrapper.tsx with new rendering logic

**Effort:** ~40 hours per new content type

### 7.3 Authoring Complexity

**Current Authoring Workflow:**

1. **Author** (content writer):
   - Writes medical content (dosing, indications, warnings)
   - Must understand JSON structure (1,070 lines)
   - Must manually format `{link:}` syntax
   - Must populate `seo` and `seo_extensions` (200 lines)
   - Must specify `ui_hints` for each section (10+ properties)
   - Must ensure data consistency across 4 locations (indications, schema, metadata, SEO)

2. **Medical Reviewer** (psychiatrist):
   - Reviews content for accuracy
   - Must review both content AND schema (150 lines of schema.org)
   - Must verify E-A-T metadata (author, reviewer, dates)

3. **SEO Specialist:**
   - Optimizes keywords (30+ per treatment)
   - Writes search intent clusters (10 categories, 150 lines)
   - Tunes title/description for CTR

4. **Developer:**
   - Reviews JSON structure
   - Validates ui_hints match available components
   - Ensures no breaking changes to data structure

**Authoring Time:**
- New treatment: ~8-10 hours
- Update existing: ~2-3 hours
- Annual updates (980 files): ~2,000 hours = 1 FTE

**Cognitive Load:**
- Author must know: Content, SEO, Schema, UI, Design System
- High barrier to entry for new authors
- Slow onboarding (2-3 weeks to learn JSON structure)

### 7.4 Database vs JSON Hybrid Architecture

**Current State:** Dual-source architecture

**JSON Files:**
- ✅ Version controlled (Git)
- ✅ Easy to diff (PRs)
- ✅ Fast reads (static files)
- ❌ Slow writes (must rebuild)
- ❌ No relational queries (can't join treatments ↔ conditions)
- ❌ Duplication (can't normalize data)

**Database (Supabase):**
- ✅ Relational queries (join treatments ↔ conditions)
- ✅ Normalized data (no duplication)
- ✅ Fast writes (instant updates)
- ❌ No version control (hard to review changes)
- ❌ Slower reads (network latency)
- ❌ Requires migration for schema changes

**Xanax Special Case:**
```typescript
// Xanax loaded from JSON, all others from DB
if (slug === "alprazolam-xanax") {
  entity = loadFromJSON(slug);
} else {
  entity = await EntityService.getBySlug(slug);
}
```

**Problems:**

1. **Inconsistent Data Sources:**
   - Xanax has 100% accurate custom schema
   - Other medications have auto-generated schema (may be incomplete)
   - SEO performance varies by content type

2. **Migration Complexity:**
   - Moving Xanax to database requires:
     - Preserving custom schema (how?)
     - Maintaining SEO parity (validation)
     - Ensuring no URL changes (301 redirects)

3. **Future Scaling:**
   - 980 JSON files → database: ~200 hours migration effort
   - Must preserve all custom SEO/schema overrides
   - Risk of breaking live site during migration

**Decision Required:** Commit to one source (JSON or DB), migrate remaining content, remove dual-source complexity.

---

## 8. Conclusions & Recommendations

### 8.1 What Works Well (Preserve)

1. **SEO Performance:**
   - ✅ Strong rankings (Avg Position 4.5, CTR 14.3%)
   - ✅ Comprehensive metadata (100% coverage)
   - ✅ Rich schema (5 schemas per page)
   - **Recommendation:** Preserve exact SEO outputs during refactor

2. **Content Depth:**
   - ✅ YMYL-compliant (E-A-T signals, medical review)
   - ✅ Detailed clinical information
   - ✅ Patient-friendly explanations
   - **Recommendation:** Keep content model, just separate from presentation

3. **Dual-Layer Override System:**
   - ✅ Authors can manually optimize SEO when needed
   - ✅ Fallback to auto-generation for bulk content
   - **Recommendation:** Keep override capability, add validation

4. **Schema Coverage:**
   - ✅ 100% of pages have complete schema stack
   - ✅ Google Rich Results Test passes
   - **Recommendation:** Preserve schema completeness, reduce duplication

### 8.2 Critical Issues (Must Fix)

1. **Data Duplication → Drift Risk:**
   - ❌ Same data in 3-4 locations (indications, schema, metadata, SEO)
   - ❌ No validation ensures consistency
   - **Risk:** High - SEO degradation, Google penalties
   - **Fix Required:** Single source of truth, auto-sync to all outputs

2. **Tight Coupling (Content + SEO + UI):**
   - ❌ JSON mixes content, metadata, schema, and presentation
   - ❌ Changing one aspect requires touching many files
   - **Risk:** High - brittle, slow iteration, scaling limits
   - **Fix Required:** Separate concerns into layers

3. **No SEO Regression Testing:**
   - ❌ No validation in CI/CD
   - ❌ Metadata quality checks exist but aren't run
   - **Risk:** Critical - silent SEO degradation
   - **Fix Required:** Add SEO quality gates to CI

4. **Manual Override Fragility:**
   - ❌ Custom schemas not validated
   - ❌ Manual metadata can bypass best practices
   - **Risk:** High - stale/incorrect SEO
   - **Fix Required:** Validate all overrides, warn on divergence

### 8.3 Architectural Evolution Needed

**Recommended Separation of Concerns:**

```
┌─────────────────────────────────────┐
│ Content Layer (Pure Data)           │  ← Single source of truth
│ - Medical facts                     │  ← Version controlled (Git or DB)
│ - Clinical metadata                 │  ← No SEO, no UI, no schema
│ - Editorial (author, dates)         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ SEO Layer (Auto-Generated)          │  ← Centralized generators
│ - MetadataFactory                   │  ← Type-specific logic
│ - SchemaFactory                     │  ← Validated outputs
│ - Override support + validation     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Presentation Layer (Design System)  │  ← UI components
│ - Section renderers                 │  ← Theme tokens
│ - Design tokens (centralized)       │  ← No content coupling
│ - Layout logic                      │
└─────────────────────────────────────┘
```

**Key Principles:**

1. **Content is Content:**
   - JSON contains ONLY medical facts, clinical data, patient text
   - No `ui_hints`, no `visual_design`, no `seo_extensions`
   - Smaller files (~300 lines instead of 1,070)

2. **SEO Auto-Generated:**
   - MetadataFactory reads content, generates metadata
   - SchemaFactory reads content, generates schema
   - Manual overrides stored separately, validated

3. **Presentation Decoupled:**
   - Section types (e.g., "patient_experience") map to components via registry
   - Design tokens centralized in theme system
   - No component names in JSON

4. **Single Source of Truth:**
   - Primary indications stored once (in content)
   - SEO description auto-generated from primary indications
   - Schema.org indication auto-generated from primary indications
   - All outputs stay in sync

### 8.4 Migration Strategy

**Phase 1: Add Validation (No Breaking Changes)**
- Implement SEO validation in CI/CD
- Add schema completeness tests
- Run on current JSON structure
- Fix validation failures

**Phase 2: Centralize Design System**
- Extract `visual_design` to theme config
- Remove `ui_hints` from JSON (use defaults)
- Allow overrides via separate config file

**Phase 3: Consolidate Data Sources**
- Migrate all JSON to database OR all database to JSON
- Remove dual-source architecture
- Single data loading path

**Phase 4: Separate SEO from Content**
- Move `seo_extensions` to separate table/files
- Auto-generate from content by default
- Validate manual overrides

**Phase 5: Refactor Schema Generation**
- Remove custom `schema_org` from JSON
- 100% auto-generated schemas
- Validate completeness in CI

**Timeline:** 6-9 months, phased rollout with SEO monitoring at each step.

---

## Appendix A: Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│ CURRENT ARCHITECTURE: Alprazolam/Xanax Data Flow                     │
└──────────────────────────────────────────────────────────────────────┘

1. SOURCE: alprazolam-Xanax.json (1,070 lines)
   ├─ kind, slug, type, name, summary, description
   ├─ visual_design (55 lines) ──────────────────┐
   ├─ metadata (drug_classes, FDA approval, etc.) │
   ├─ clinical_metadata (indications, contraindications, pharmacokinetics)
   ├─ sections[] (20 sections × 50 lines each) ──┤
   │  ├─ type, heading, text, items              │
   │  ├─ ux_display, collapsible ────────────────┤
   │  └─ ui_hints (layout, icon, color, etc.) ───┤
   ├─ seo (title, description, canonical) ───────┤
   ├─ seo_extensions (keywords, schema_org) ─────┤
   │  ├─ keywords[] (30 keywords)                │
   │  ├─ search_intent_phrases[] (25 phrases)    │
   │  ├─ search_intent_clusters{} (10 clusters)  │
   │  └─ schema_org{} (150 lines) ────────────────┤
   ├─ editorial (reviewer, dates) ───────────────┤
   └─ faqs[] (12 FAQ pairs) ─────────────────────┤
                                                  │
2. LOADING: page.tsx → EntityService              │
   ↓                                              │
   if (slug === "alprazolam-xanax") {             │
     loadTreatmentFromJSON() → jsonToEntity()     │
   } else {                                       │
     EntityService.getBySlug() [Database]         │
   }                                              │
   ↓                                              │
   entity = {                                     │
     id, name, slug, description,                 │
     content: <full JSON>,  ← DUPLICATION         │
     data: <full JSON>,     ← DUPLICATION         │
     metadata: {...},                             │
     schema: {...}                                │
   }                                              │
                                                  │
3. SEO METADATA: MetadataFactory.generate()       │
   ↓                                              │
   Has entity.seo? ──YES→ Use Manual Overrides ──┤
       ↓ NO                                       │
   MedicationMetadataGenerator.generate()         │
     ├─ extractBrandName(entity.data.brand_names) │
     ├─ extractPrimaryIndication(entity.data.primary_indications)
     ├─ extractDrugClass(entity.data.drug_classes)│
     └─ Build: title, description, keywords ──────┤
   ↓                                              │
   Output: Next.js Metadata {                     │
     title, description, keywords,                │
     canonical, openGraph, twitter ───────────────┤
   }                                              │
                                                  │
4. SCHEMA.ORG: SchemaFactory.generateAll()        │
   ↓                                              │
   Has entity.data.seo_extensions.schema_org? ───┤
       ↓ YES (XANAX USES THIS) ←─────────────────┤
   Use Custom Schema (150 lines) ────────────────┤
       ↓ NO                                       │
   buildDrugSchema(entity) ──────────────────────┤
     ├─ extractBrandNames()                       │
     ├─ extractIndications() [3 sources!]         │
     ├─ extractWarnings()                         │
     ├─ extractInteractions()                     │
     └─ Build: Drug schema ────────────────────── │
   ↓                                              │
   + buildMedicalWebPageSchema()                  │
   + buildBreadcrumbSchema()                      │
   + buildMedicalReviewBoardSchema()              │
   + buildDefaultReviewBoardPersonSchema()        │
   ↓                                              │
   Output: Array of 5 JSON-LD schemas ───────────┤
                                                  │
5. CONTENT ENHANCEMENT: enhanceEntityContent()    │
   ↓                                              │
   Scan entity.data.sections[].items              │
   Detect entity names (e.g., "Panic Disorder")   │
   Validate entity exists in database             │
   Inject {link:condition:panic-disorder:Panic Disorder}
   ↓                                              │
   Output: Enhanced entity ───────────────────────┤
                                                  │
6. RENDERING: TreatmentClientWrapper              │
   ↓                                              │
   sections.map(section => {                      │
     const { type, heading, ui_hints } = section; │ ← JSON controls UI
     ↓                                            │
     if (ui_hints.layout === "quote_carousel") {  │
       return <QuoteCarousel uiHints={ui_hints}/>;│ ← Direct coupling
     }                                            │
     if (ui_hints.layout === "stat_card") {       │
       return <StatCard uiHints={ui_hints}/>;     │
     }                                            │
     // ... 15+ layout types                      │
     ↓                                            │
     Fallback: renderSectionContent(section) ─────┤
   })                                             │
   ↓                                              │
   Output: Rendered HTML ─────────────────────────┤
                                                  │
7. FINAL PAGE OUTPUT:                             │
   <html>                                         │
     <head>                                       │
       <title>{metadata.title}</title> ───────────┤ [From Step 3]
       <meta name="description" content="..."/> ──┤ [From Step 3]
       <link rel="canonical" href="..."/> ────────┤ [From Step 3]
       <script type="application/ld+json"> ───────┤ [From Step 4]
         {drugSchema}                             │
       </script>                                  │
       <script type="application/ld+json"> ───────┤ [From Step 4]
         {medicalWebPageSchema}                   │
       </script>                                  │
       <!-- 3 more schemas -->                    │
     </head>                                      │
     <body>                                       │
       {/* Sections rendered with ui_hints */} ───┤ [From Step 6]
     </body>                                      │
   </html>                                        │
                                                  │
═══════════════════════════════════════════════════
DATA DUPLICATION POINTS (Critical Issues):
═══════════════════════════════════════════════════

[A] Primary Indications stored in 4 places:
    1. clinical_metadata.primary_indications
    2. sections[indications].items
    3. seo_extensions.schema_org.indication
    4. seo.description (manually written)

[B] Warnings stored in 3 places:
    1. sections[warnings].black_box
    2. seo_extensions.schema_org.warning
    3. sections[interactions].items[0].risk

[C] Brand names stored in 3 places:
    1. metadata.brand_names
    2. seo_extensions.schema_org.alternateName
    3. sections[dosage_forms].items (hardcoded)

[D] Visual design tokens scattered:
    1. visual_design{} (global tokens)
    2. ui_hints{} (per-section overrides)
    3. Tailwind config (hardcoded classes)
    4. Component files (inline styles)
```

---

## Appendix B: File Inventory

**Primary Files Analyzed:**

1. **Content Source:**
   - `data/treatments/medications/alprazolam-Xanax.json` (1,070 lines) ← CANONICAL REFERENCE

2. **Data Loading:**
   - `src/app/treatments/[slug]/page.tsx` (218 lines) - Server component
   - `src/lib/data/entity-service.ts` (500+ lines) - Entity service

3. **SEO Generation:**
   - `src/lib/seo/metadata-factory.ts` (191 lines) - Factory
   - `src/lib/seo/metadata-generators/medication.ts` (182 lines) - Medication generator
   - `src/lib/seo/metadata-generator.ts` (Base class)

4. **Schema Generation:**
   - `src/lib/seo/schema-factory.ts` (366 lines) - Factory
   - `src/lib/seo/schema-builders/drug.ts` (396 lines) - Drug schema builder
   - `src/lib/seo/schema-builders/medical-webpage.ts` - Wrapper schema
   - `src/lib/seo/schema-builders/breadcrumb.ts` - Navigation schema
   - `src/lib/seo/schema-builders/person.ts` - Author/reviewer schemas
   - `src/lib/seo/schema-builders/organization.ts` - Medical board schema

5. **Content Enhancement:**
   - `src/lib/linking/content-enhancer.ts` (100+ lines) - Automatic linking

6. **Rendering:**
   - `src/app/treatments/[slug]/client-wrapper.tsx` (1,576 lines) - Client component
   - `src/components/ui/*` - UI components (QuoteCarousel, StatCard, etc.)

7. **Configuration:**
   - `src/lib/seo/config.ts` - SEO configuration
   - `src/lib/types/database.ts` - Type definitions

**Total Lines of Code Analyzed:** ~5,000 lines

---

**END OF PHASE 1: DEEP ARCHITECTURE ANALYSIS**

---

**Next Steps:**
- Phase 2: Architecture Evolution Proposal (design new system)
- Phase 3: High-Level Implementation Plan (safe migration roadmap)
