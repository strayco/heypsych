# Phase 2: Developer Guide

**Project:** HeyPsych SEO System
**Version:** 1.0
**Date:** November 18, 2025
**Audience:** Engineering Team

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [How to Add a New Entity Type](#how-to-add-a-new-entity-type)
3. [How to Add a New Link Rule](#how-to-add-a-new-link-rule)
4. [How to Add or Modify a Schema Type](#how-to-add-or-modify-a-schema-type)
5. [How to Extend Metadata Generation](#how-to-extend-metadata-generation)
6. [Testing & Validation](#testing--validation)
7. [Common Patterns](#common-patterns)
8. [Debugging Guide](#debugging-guide)
9. [Performance Considerations](#performance-considerations)

---

## Quick Start

### Project Structure

```
src/
├── lib/
│   ├── seo/                          # NEW: SEO system
│   │   ├── metadata-factory.ts       # Metadata generation
│   │   ├── schema-factory.ts         # JSON-LD generation
│   │   ├── link-extractor-registry.ts # Link extraction
│   │   ├── link-extractors/          # Individual extractors
│   │   │   ├── treatment-link-extractor.ts
│   │   │   ├── assessment-link-extractor.ts
│   │   │   ├── related-condition-extractor.ts
│   │   │   └── ... (more extractors)
│   │   ├── content-cluster-builder.ts # Relationship builder
│   │   ├── link-placement-engine.ts  # Link allocation
│   │   ├── config.ts                 # SEO config (limits, rules)
│   │   ├── metrics.ts                # Observability
│   │   └── utils.ts                  # Shared utilities
│   │
│   ├── data/                         # EXISTING: Data layer
│   │   ├── entity-service.ts         # Data access
│   │   ├── entity-mappers.ts         # JSON → Entity
│   │   └── server-queries.ts         # Server fetching
│   │
│   └── types/                        # EXISTING: Type definitions
│       ├── database.ts               # Entity, Collection, Schema
│       └── resource.ts               # Resource types
│
└── components/
    └── seo/                          # NEW: E-A-T components
        ├── AuthorByline.tsx
        ├── MedicalReviewBadge.tsx
        ├── ContentTimestamps.tsx
        ├── MedicalDisclaimer.tsx
        ├── CrisisSupportBanner.tsx
        ├── CitationList.tsx
        ├── RelatedConditions.tsx
        ├── TreatmentOptions.tsx
        └── AssessmentCTA.tsx
```

### Running the SEO System

**In a page component:**
```typescript
// app/conditions/[slug]/page.tsx
import { EntityService } from '@/lib/data/entity-service';
import { MetadataFactory } from '@/lib/seo/metadata-factory';
import { SchemaFactory } from '@/lib/seo/schema-factory';
import { linkRegistry } from '@/lib/seo/link-extractor-registry';

// Generate metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const entity = await EntityService.getBySlug(params.slug);
  return MetadataFactory.generate(entity);
}

// Render page
export default async function ConditionPage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const schemas = SchemaFactory.generateAll(entity);
  const links = linkRegistry.extractAll(entity);

  return (
    <>
      {/* Inject schemas */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Render content with E-A-T signals */}
      <AuthorByline author={entity.data.editorial?.author} />
      <MedicalReviewBadge reviewer={entity.data.editorial?.medicalReviewer} />

      <article>{/* Content */}</article>

      <RelatedConditions links={links.filter(l => l.context.includes('comorbidities'))} />
      <TreatmentOptions links={links.filter(l => l.context.includes('treatment'))} />
    </>
  );
}
```

---

## How to Add a New Entity Type

**Scenario:** You want to add a new entity type called "ClinicalGuideline".

### Step 1: Update Type Definitions

**File:** `src/lib/types/database.ts`

```typescript
// Add to EntityType union
export type EntityType =
  | "treatment" | "medication" | "therapy" | "interventional"
  | "investigational" | "alternative" | "supplement"
  | "condition" | "resource" | "provider"
  | "clinical-guideline";  // NEW

// Add schema configuration (if using entity-mappers.ts pattern)
const SCHEMA_CONFIG = {
  // ... existing schemas
  "clinical-guideline": {
    id: "schema-clinical-guideline",
    entity_type: "clinical-guideline",
    schema_name: "clinical-guideline",
    display_name: "Clinical Guideline",
    icon: "book-medical",        // lucide-react icon name
    color: "teal",
    field_definitions: {},       // Define expected fields
    ui_config: {},
    validation_rules: {}
  }
};
```

### Step 2: Create Metadata Generator

**File:** `src/lib/seo/metadata-factory.ts`

```typescript
class ClinicalGuidelineMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Use override if provided
    if (entity.seo?.title) {
      return this.generateFromOverrides(entity);
    }

    // Generate from rules
    const title = this.generateTitle(entity);
    const description = this.generateDescription(entity);
    const keywords = this.extractKeywords(entity);
    const canonical = this.generateCanonical(entity);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'article',
        siteName: 'HeyPsych'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description
      }
    };
  }

  private generateTitle(entity: Entity): string {
    // Rule: "{Name} - Clinical Practice Guideline | HeyPsych"
    const title = `${entity.name} - Clinical Practice Guideline | HeyPsych`;
    return this.truncate(title, 60);
  }

  private generateDescription(entity: Entity): string {
    // Rule: "Evidence-based clinical guideline for {name}. Learn about {subject}, recommendations, and implementation."
    const subject = entity.data.subject || entity.name;
    const desc = `Evidence-based clinical guideline for ${entity.name}. Learn about ${subject}, recommendations, and implementation.`;
    return this.truncate(desc, 160);
  }

  private extractKeywords(entity: Entity): string[] {
    const keywords = new Set<string>();

    keywords.add(entity.name);
    keywords.add('clinical guideline');
    keywords.add(`${entity.name} guidelines`);

    // Add subject areas
    entity.data.subject_areas?.forEach((area: string) => keywords.add(area));

    // Add conditions covered
    entity.data.conditions_covered?.forEach((condition: string) => {
      keywords.add(condition);
    });

    // From SEO overrides
    entity.seo?.keywords?.forEach(kw => keywords.add(kw));

    return Array.from(keywords).slice(0, 15);
  }

  protected getPath(entity: Entity): string {
    return `/guidelines/${entity.slug}`;
  }
}

// Register in factory
export class MetadataFactory {
  private static getGenerator(type: string): MetadataGenerator {
    switch(type) {
      case 'condition': return new ConditionMetadataGenerator();
      case 'medication': return new MedicationMetadataGenerator();
      case 'therapy': return new TherapyMetadataGenerator();
      case 'resource': return new ResourceMetadataGenerator();
      case 'clinical-guideline': return new ClinicalGuidelineMetadataGenerator();  // NEW
      default: return new DefaultMetadataGenerator();
    }
  }
}
```

### Step 3: Create Schema Generator

**File:** `src/lib/seo/schema-factory.ts`

```typescript
export class SchemaFactory {
  private static generatePrimarySchema(entity: Entity): object {
    switch(entity.type) {
      case 'condition': return this.generateMedicalConditionSchema(entity);
      case 'medication': return this.generateDrugSchema(entity);
      case 'therapy': return this.generateMedicalTherapySchema(entity);
      case 'clinical-guideline': return this.generateMedicalGuidelineSchema(entity);  // NEW
      default: return this.generateArticleSchema(entity);
    }
  }

  private static generateMedicalGuidelineSchema(entity: Entity): object {
    return new SchemaBuilder()
      .setContext("https://schema.org")
      .setType("MedicalGuideline")
      .setId(`${SITE_URL}/guidelines/${entity.slug}#guideline`)
      .addProperty("name", entity.name)
      .addProperty("description", entity.description || entity.data.description)
      .addPropertyIfExists("guidelineSubject", this.extractGuidelineSubject(entity))
      .addPropertyIfExists("evidenceLevel", entity.data.evidence_level)
      .addPropertyIfExists("evidenceOrigin", entity.data.evidence_origin)
      .addPropertyIfExists("guidelineDate", entity.data.publication_date)
      .addPropertyIfExists("guideline", entity.data.recommendations?.map(r => ({
        "@type": "MedicalGuidelineRecommendation",
        "recommendationStrength": r.strength,
        "guidelineSubject": r.subject,
        "text": r.text
      })))
      .build();
  }

  private static extractGuidelineSubject(entity: Entity): object | null {
    // If guideline covers specific conditions
    const conditions = entity.data.conditions_covered;
    if (!conditions || conditions.length === 0) return null;

    return conditions.map((condition: string) => ({
      "@type": "MedicalCondition",
      "name": condition
    }));
  }
}
```

### Step 4: Create Link Extractors (Optional)

**If your new entity type should link to/from other entities:**

**File:** `src/lib/seo/link-extractors/guideline-link-extractor.ts`

```typescript
import { LinkExtractor, Link } from '../link-extractor-registry';
import { Entity } from '@/lib/types/database';

export class GuidelineLinkExtractor extends LinkExtractor {
  extract(entity: Entity): Link[] {
    if (entity.type !== 'clinical-guideline') return [];

    const links: Link[] = [];

    // Link to conditions covered by guideline
    entity.data.conditions_covered?.forEach((condition: string) => {
      const slug = this.findEntityByName(condition, 'condition');
      if (slug) {
        links.push({
          text: condition,
          url: `/conditions/${slug}`,
          context: 'conditions_covered',
          priority: 8
        });
      }
    });

    // Link to recommended treatments
    entity.data.recommended_treatments?.forEach((treatment: string) => {
      const slug = this.findEntityByName(treatment, 'treatment');
      if (slug) {
        links.push({
          text: treatment,
          url: `/treatments/${slug}`,
          context: 'recommended_treatments',
          priority: 7
        });
      }
    });

    return links;
  }
}

// Also create reverse extractors if conditions/treatments should link to guidelines
export class ConditionToGuidelineLinkExtractor extends LinkExtractor {
  extract(entity: Entity): Link[] {
    if (entity.type !== 'condition') return [];

    const links: Link[] = [];

    // Find guidelines that cover this condition
    const guidelines = await this.findGuidelinesForCondition(entity.slug);

    guidelines.forEach((guideline) => {
      links.push({
        text: guideline.name,
        url: `/guidelines/${guideline.slug}`,
        context: 'clinical_guidelines',
        priority: 6
      });
    });

    return links;
  }

  private async findGuidelinesForCondition(conditionSlug: string): Promise<Entity[]> {
    // Query database for guidelines that cover this condition
    return EntityService.searchEntities({
      type: 'clinical-guideline',
      field: 'data.conditions_covered',
      contains: conditionSlug
    });
  }
}
```

**Register extractors:**

**File:** `src/lib/seo/link-extractor-registry.ts`

```typescript
import { GuidelineLinkExtractor, ConditionToGuidelineLinkExtractor } from './link-extractors/guideline-link-extractor';

export const linkRegistry = new LinkExtractorRegistry();

// ... existing registrations

// NEW: Register guideline extractors
linkRegistry.register('clinical-guideline', new GuidelineLinkExtractor());
linkRegistry.register('condition', new ConditionToGuidelineLinkExtractor());
```

### Step 5: Create Page Route

**File:** `src/app/guidelines/[slug]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { EntityService } from '@/lib/data/entity-service';
import { MetadataFactory } from '@/lib/seo/metadata-factory';
import { SchemaFactory } from '@/lib/seo/schema-factory';
import { linkRegistry } from '@/lib/seo/link-extractor-registry';
import { AuthorByline, MedicalReviewBadge } from '@/components/seo';

export async function generateMetadata({ params }): Promise<Metadata> {
  const entity = await EntityService.getBySlug(params.slug);
  if (!entity) return { title: 'Guideline Not Found' };

  return MetadataFactory.generate(entity);  // Uses ClinicalGuidelineMetadataGenerator
}

export default async function GuidelinePage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  if (!entity || entity.type !== 'clinical-guideline') {
    notFound();
  }

  const schemas = SchemaFactory.generateAll(entity);
  const links = linkRegistry.extractAll(entity);

  return (
    <>
      {/* Inject schemas */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* E-A-T signals */}
      {entity.data.editorial?.author && (
        <AuthorByline author={entity.data.editorial.author} />
      )}
      {entity.data.editorial?.medicalReviewer && (
        <MedicalReviewBadge reviewer={entity.data.editorial.medicalReviewer} />
      )}

      {/* Content */}
      <article>
        <h1>{entity.name}</h1>
        <div>{entity.description}</div>

        {/* Recommendations */}
        {entity.data.recommendations?.map((rec, i) => (
          <div key={i}>
            <h3>{rec.subject}</h3>
            <p><strong>Strength:</strong> {rec.strength}</p>
            <p>{rec.text}</p>
          </div>
        ))}
      </article>

      {/* Related links */}
      <aside>
        <h3>Conditions Covered</h3>
        <ul>
          {links
            .filter(l => l.context === 'conditions_covered')
            .map(link => (
              <li key={link.url}>
                <Link href={link.url}>{link.text}</Link>
              </li>
            ))}
        </ul>
      </aside>
    </>
  );
}

export const revalidate = 86400;  // ISR: 24 hours
```

### Step 6: Add to Sitemap

**File:** `src/app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ... existing static pages

  // Add guidelines
  const guidelines = await EntityService.getBySchemaType('clinical-guideline');
  const guidelinePages: MetadataRoute.Sitemap = guidelines.map(guideline => ({
    url: `${baseUrl}/guidelines/${guideline.slug}`,
    lastModified: guideline.updated_at || new Date(),
    changeFrequency: 'monthly',
    priority: 0.75
  }));

  return [
    ...staticPages,
    ...conditionPages,
    ...treatmentPages,
    ...resourcePages,
    ...guidelinePages  // NEW
  ];
}
```

### Step 7: Test

```bash
# Start dev server
npm run dev

# Visit page
open http://localhost:3000/guidelines/your-test-guideline-slug

# Validate schema
# Paste page HTML into https://validator.schema.org/

# Check metadata
curl -s http://localhost:3000/guidelines/your-test-guideline-slug | grep '<title>'
curl -s http://localhost:3000/guidelines/your-test-guideline-slug | grep 'meta name="description"'

# Run tests
npm test -- src/lib/seo/metadata-factory.test.ts
```

---

## How to Add a New Link Rule

**Scenario:** You want to link treatments to "Related Research Articles" (resources of type "knowledge-hub").

### Step 1: Create Link Extractor

**File:** `src/lib/seo/link-extractors/research-link-extractor.ts`

```typescript
import { LinkExtractor, Link } from '../link-extractor-registry';
import { Entity } from '@/lib/types/database';
import { EntityService } from '@/lib/data/entity-service';

export class ResearchLinkExtractor extends LinkExtractor {
  /**
   * Extracts links from treatments to research articles
   *
   * Data source: entity.data.research_articles (array of article names/slugs)
   */
  extract(entity: Entity): Link[] {
    // Only run for medications and therapies
    if (entity.type !== 'medication' && entity.type !== 'therapy') {
      return [];
    }

    const links: Link[] = [];
    const researchArticles = entity.data.research_articles || [];

    researchArticles.forEach((article: string) => {
      // Try to find resource by name
      const slug = this.findResourceByName(article);

      if (slug) {
        links.push({
          text: this.formatArticleTitle(article),
          url: `/resources/knowledge-hub/${slug}`,
          context: 'research_articles',
          priority: 5  // Medium priority
        });
      }
    });

    return links;
  }

  private findResourceByName(name: string): string | null {
    // Use fuzzy matching to find resource slug
    return this.findEntityByName(name, 'resource');
  }

  private formatArticleTitle(articleName: string): string {
    // Clean up article name for display
    return this.cleanLinkSyntax(articleName);
  }
}
```

### Step 2: Register Extractor

**File:** `src/lib/seo/link-extractor-registry.ts`

```typescript
import { ResearchLinkExtractor } from './link-extractors/research-link-extractor';

// Register for both medications and therapies
linkRegistry.register('medication', new ResearchLinkExtractor());
linkRegistry.register('therapy', new ResearchLinkExtractor());
```

### Step 3: Create Rendering Component

**File:** `src/components/seo/RelatedResearch.tsx`

```typescript
import Link from 'next/link';
import type { Link as LinkType } from '@/lib/seo/link-extractor-registry';

interface RelatedResearchProps {
  links: LinkType[];
}

export function RelatedResearch({ links }: RelatedResearchProps) {
  if (links.length === 0) return null;

  return (
    <section className="related-research">
      <h3 className="text-xl font-semibold mb-4">Related Research</h3>
      <ul className="space-y-2">
        {links.map((link, i) => (
          <li key={link.url + i}>
            <Link
              href={link.url}
              className="text-blue-600 hover:underline"
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### Step 4: Add to Link Placement Config

**File:** `src/lib/seo/config.ts`

```typescript
export const LINK_LIMITS = {
  medication: {
    body: 35,
    sidebar: 10,
    researchSection: 8,      // NEW: Max 8 research links
    footer: 100,
    total: 75
  },
  therapy: {
    body: 35,
    sidebar: 10,
    researchSection: 8,      // NEW
    footer: 100,
    total: 75
  }
};
```

**File:** `src/lib/seo/link-placement-engine.ts`

```typescript
export class LinkPlacementEngine {
  static allocateToSlots(links: Link[], template: string): PlacedLinks {
    const limits = LINK_LIMITS[template];

    // Sort by priority
    links.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Allocate research links to their own slot
    const researchLinks = links
      .filter(l => l.context === 'research_articles')
      .slice(0, limits.researchSection);

    // Remove research links from main pool
    const remainingLinks = links.filter(l => l.context !== 'research_articles');

    return {
      body: remainingLinks.filter(/* body criteria */).slice(0, limits.body),
      sidebar: remainingLinks.filter(/* sidebar criteria */).slice(0, limits.sidebar),
      researchSection: researchLinks,  // NEW
      footer: /* footer links */
    };
  }
}
```

### Step 5: Use in Page Template

**File:** `src/app/treatments/[slug]/page.tsx`

```typescript
import { RelatedResearch } from '@/components/seo/RelatedResearch';

export default async function TreatmentPage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const links = linkRegistry.extractAll(entity);
  const placedLinks = LinkPlacementEngine.allocateToSlots(links, entity.type);

  return (
    <>
      {/* ... existing content */}

      {/* NEW: Related research section */}
      <RelatedResearch links={placedLinks.researchSection} />
    </>
  );
}
```

### Step 6: Test

**Add test data to a treatment JSON:**

```json
{
  "name": "Sertraline (Zoloft)",
  "slug": "sertraline-zoloft",
  "type": "medication",
  "research_articles": [
    "SSRI Efficacy Meta-Analysis 2024",
    "Long-term Safety of Sertraline",
    "Sertraline vs Placebo in MDD"
  ]
}
```

**Write unit test:**

```typescript
// tests/seo/research-link-extractor.test.ts
import { ResearchLinkExtractor } from '@/lib/seo/link-extractors/research-link-extractor';

describe('ResearchLinkExtractor', () => {
  it('extracts research links from medications', () => {
    const entity = {
      type: 'medication',
      slug: 'sertraline-zoloft',
      data: {
        research_articles: [
          'SSRI Efficacy Meta-Analysis 2024',
          'Long-term Safety of Sertraline'
        ]
      }
    };

    const extractor = new ResearchLinkExtractor();
    const links = extractor.extract(entity);

    expect(links).toHaveLength(2);
    expect(links[0].context).toBe('research_articles');
    expect(links[0].url).toContain('/resources/knowledge-hub/');
  });

  it('returns empty array for non-treatment entities', () => {
    const entity = { type: 'condition', slug: 'gad', data: {} };

    const extractor = new ResearchLinkExtractor();
    const links = extractor.extract(entity);

    expect(links).toHaveLength(0);
  });
});
```

---

## How to Add or Modify a Schema Type

**Scenario:** You want to enhance the MedicalCondition schema to include "naturalHistory" (disease progression).

### Step 1: Identify Schema Builder Method

**File:** `src/lib/seo/schema-factory.ts`

Find the schema builder for your entity type:

```typescript
private static generateMedicalConditionSchema(entity: Entity): object {
  return new SchemaBuilder()
    .setContext("https://schema.org")
    .setType("MedicalCondition")
    .addProperty("name", entity.name)
    // ... existing properties
    .build();
}
```

### Step 2: Add New Property

```typescript
private static generateMedicalConditionSchema(entity: Entity): object {
  return new SchemaBuilder()
    .setContext("https://schema.org")
    .setType("MedicalCondition")
    .addProperty("name", entity.name)
    .addPropertyIfExists("alternateName", this.extractAlternateNames(entity))
    .addPropertyIfExists("code", this.extractMedicalCodes(entity))

    // ... existing properties

    // NEW: Add natural history
    .addPropertyIfExists("naturalHistory", this.extractNaturalHistory(entity))

    .build();
}

// Helper method to extract natural history
private static extractNaturalHistory(entity: Entity): string | null {
  // Check if entity has natural history data
  const naturalHistory = entity.data.natural_history || entity.data.course;

  if (!naturalHistory) return null;

  // If it's an object with timeline, format it
  if (typeof naturalHistory === 'object' && naturalHistory.timeline) {
    return `Typical course: ${naturalHistory.timeline}. Prognosis: ${naturalHistory.prognosis || 'varies'}`;
  }

  // If it's a string, return as-is
  return typeof naturalHistory === 'string' ? naturalHistory : null;
}
```

### Step 3: Update Entity Data Structure (if needed)

**Add to JSON files:**

```json
{
  "name": "Major Depressive Disorder",
  "slug": "major-depressive-disorder",
  "type": "condition",
  "data": {
    "natural_history": {
      "timeline": "Episodes typically last 6-12 months if untreated. Recurrence common.",
      "prognosis": "Good with treatment; 50-80% remission rate with first-line therapies"
    }
  }
}
```

**Or update database migration:**

```sql
-- migrations/XXX_add_natural_history.sql
ALTER TABLE entities
ADD COLUMN natural_history TEXT;

-- Add to existing records
UPDATE entities
SET natural_history = content->'natural_history'
WHERE type = 'condition'
  AND content->'natural_history' IS NOT NULL;
```

### Step 4: Validate Schema

**Use Google's Schema Validator:**

1. Generate schema for test entity:
   ```typescript
   const entity = await EntityService.getBySlug('major-depressive-disorder');
   const schemas = SchemaFactory.generateAll(entity);
   console.log(JSON.stringify(schemas[0], null, 2));
   ```

2. Copy output and paste into https://validator.schema.org/

3. Check for errors (should be 0)

### Step 5: Add Test

```typescript
// tests/seo/schema-factory.test.ts
describe('SchemaFactory - MedicalCondition', () => {
  it('includes naturalHistory when present', () => {
    const entity = {
      type: 'condition',
      name: 'Major Depressive Disorder',
      data: {
        natural_history: {
          timeline: 'Episodes last 6-12 months',
          prognosis: 'Good with treatment'
        }
      }
    };

    const schema = SchemaFactory.generateAll(entity)[0];

    expect(schema['@type']).toBe('MedicalCondition');
    expect(schema.naturalHistory).toContain('Episodes last 6-12 months');
  });

  it('omits naturalHistory when missing', () => {
    const entity = {
      type: 'condition',
      name: 'Test Condition',
      data: {}
    };

    const schema = SchemaFactory.generateAll(entity)[0];

    expect(schema.naturalHistory).toBeUndefined();
  });
});
```

---

## How to Extend Metadata Generation

**Scenario:** You want to add special metadata for high-severity conditions (e.g., suicidality warning in description).

### Step 1: Update Metadata Generator

**File:** `src/lib/seo/metadata-factory.ts`

```typescript
class ConditionMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // ... existing logic

    const description = this.generateDescription(entity);

    return {
      title,
      description,
      keywords,
      alternates: { canonical },

      // NEW: Add structured warnings
      other: {
        'crisis-warning': this.hasCrisisRisk(entity) ? 'true' : 'false',
        'severity-level': this.getSeverityLevel(entity)
      },

      openGraph: {
        title,
        description,
        url: canonical,
        type: 'article',
        siteName: 'HeyPsych',

        // NEW: Add OG warning for high-severity conditions
        ...(this.hasCrisisRisk(entity) && {
          'article:section': 'Crisis Resources',
          'article:tag': 'Mental Health Crisis'
        })
      }
    };
  }

  private generateDescription(entity: Entity): string {
    if (entity.seo?.description) return entity.seo.description;

    const basedesc = `Learn about ${entity.name} symptoms, causes, risk factors, and evidence-based treatments.`;

    // NEW: Append crisis warning for high-risk conditions
    if (this.hasCrisisRisk(entity)) {
      return this.truncate(
        `${basedesc} If you are experiencing a mental health crisis, call 988 immediately.`,
        160
      );
    }

    return this.truncate(basedesc, 160);
  }

  private hasCrisisRisk(entity: Entity): boolean {
    // Check if condition has high suicide/crisis risk
    const riskIndicators = [
      entity.data.suicidality_risk === 'high',
      entity.data.tags?.includes('suicidal ideation'),
      entity.data.tags?.includes('self-harm'),
      entity.slug === 'major-depressive-disorder',
      entity.slug === 'bipolar-disorder'
    ];

    return riskIndicators.some(indicator => indicator);
  }

  private getSeverityLevel(entity: Entity): string {
    if (entity.data.severity_level) return entity.data.severity_level;
    if (this.hasCrisisRisk(entity)) return 'high';
    return 'moderate';
  }
}
```

### Step 2: Update Entity Data

**Add severity metadata to JSON:**

```json
{
  "name": "Major Depressive Disorder",
  "slug": "major-depressive-disorder",
  "type": "condition",
  "data": {
    "suicidality_risk": "high",
    "severity_level": "high"
  },
  "tags": ["depression", "suicidal ideation", "mood disorder"]
}
```

### Step 3: Create Conditional UI Component

**File:** `src/components/seo/CrisisWarningBanner.tsx`

```typescript
interface CrisisWarningBannerProps {
  show: boolean;
}

export function CrisisWarningBanner({ show }: CrisisWarningBannerProps) {
  if (!show) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-red-800">Crisis Support Available</h3>
          <p className="text-red-700 mt-1">
            If you are experiencing a mental health crisis or thinking about suicide,
            please call <strong>988</strong> (Suicide & Crisis Lifeline) or text
            <strong> "HELLO"</strong> to <strong>741741</strong> (Crisis Text Line).
          </p>
          <Link
            href="/resources/crisis-helplines"
            className="text-red-800 underline font-medium mt-2 inline-block"
          >
            View All Crisis Resources →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Use in Page

```typescript
// app/conditions/[slug]/page.tsx
export default async function ConditionPage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const hasCrisisRisk = entity.data.suicidality_risk === 'high';

  return (
    <>
      {/* Metadata already includes crisis warning */}

      <CrisisWarningBanner show={hasCrisisRisk} />

      {/* Rest of page */}
    </>
  );
}
```

---

## Testing & Validation

### Unit Tests

**File:** `tests/seo/metadata-factory.test.ts`

```typescript
import { MetadataFactory } from '@/lib/seo/metadata-factory';
import { Entity } from '@/lib/types/database';

describe('MetadataFactory', () => {
  describe('ConditionMetadataGenerator', () => {
    it('generates correct title format', async () => {
      const entity: Entity = {
        id: '1',
        slug: 'generalized-anxiety-disorder',
        name: 'Generalized Anxiety Disorder',
        type: 'condition',
        data: {},
        status: 'active'
      };

      const metadata = await MetadataFactory.generate(entity);

      expect(metadata.title).toBe(
        'Generalized Anxiety Disorder: Symptoms, Causes, Treatment & Support | HeyPsych'
      );
    });

    it('respects SEO overrides', async () => {
      const entity: Entity = {
        id: '1',
        slug: 'gad',
        name: 'GAD',
        type: 'condition',
        data: {},
        seo: {
          title: 'Custom GAD Title',
          description: 'Custom description'
        },
        status: 'active'
      };

      const metadata = await MetadataFactory.generate(entity);

      expect(metadata.title).toBe('Custom GAD Title');
      expect(metadata.description).toBe('Custom description');
    });

    it('truncates long titles to 60 chars', async () => {
      const entity: Entity = {
        name: 'Very Long Condition Name That Exceeds Sixty Characters For SEO Purposes',
        type: 'condition',
        data: {}
      };

      const metadata = await MetadataFactory.generate(entity);

      expect(metadata.title.length).toBeLessThanOrEqual(60);
    });
  });
});
```

### Schema Validation Tests

```typescript
// tests/seo/schema-factory.test.ts
import { SchemaFactory } from '@/lib/seo/schema-factory';
import Ajv from 'ajv';

const ajv = new Ajv();

describe('SchemaFactory - Schema.org Compliance', () => {
  it('generates valid MedicalCondition schema', () => {
    const entity = {
      type: 'condition',
      name: 'Test Condition',
      data: {
        symptoms: { core: ['Symptom 1'] },
        dsm5_code: 'F41.1',
        icd10_code: '300.02'
      }
    };

    const schemas = SchemaFactory.generateAll(entity);
    const conditionSchema = schemas.find(s => s['@type'] === 'MedicalCondition');

    expect(conditionSchema).toBeDefined();
    expect(conditionSchema['@context']).toBe('https://schema.org');
    expect(conditionSchema.name).toBe('Test Condition');

    // Validate against schema.org spec
    const valid = validateAgainstSchemaOrg(conditionSchema);
    expect(valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/seo-pipeline.test.ts
import { EntityService } from '@/lib/data/entity-service';
import { MetadataFactory } from '@/lib/seo/metadata-factory';
import { SchemaFactory } from '@/lib/seo/schema-factory';
import { linkRegistry } from '@/lib/seo/link-extractor-registry';

describe('SEO Pipeline Integration', () => {
  it('generates complete SEO package for condition', async () => {
    const entity = await EntityService.getBySlug('generalized-anxiety-disorder');

    // Metadata
    const metadata = await MetadataFactory.generate(entity);
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();

    // Schemas
    const schemas = SchemaFactory.generateAll(entity);
    expect(schemas.length).toBeGreaterThan(0);
    schemas.forEach(schema => {
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBeDefined();
    });

    // Links
    const links = linkRegistry.extractAll(entity);
    expect(links.length).toBeGreaterThan(0);
    links.forEach(link => {
      expect(link.text).toBeTruthy();
      expect(link.url).toMatch(/^\/[a-z]/);
      expect(link.context).toBeTruthy();
    });
  });
});
```

### Manual Validation

**Google Rich Results Test:**
```bash
# 1. Start dev server
npm run dev

# 2. Use ngrok to expose localhost
npx ngrok http 3000

# 3. Test URL
# Paste ngrok URL into https://search.google.com/test/rich-results
```

**Schema Markup Validator:**
```bash
# Extract schema from page
curl -s http://localhost:3000/conditions/gad | \
  grep -o '<script type="application/ld+json">.*</script>' | \
  sed 's/<[^>]*>//g'

# Paste output into https://validator.schema.org/
```

---

## Common Patterns

### Pattern 1: Conditional Schema Properties

**Use `addPropertyIfExists()` for optional fields:**

```typescript
new SchemaBuilder()
  .setType("Drug")
  .addProperty("name", entity.name)  // Always present
  .addPropertyIfExists("drugClass", entity.data.drug_classes)  // May be missing
  .addPropertyIfExists("warning", extractWarnings(entity))  // Complex extraction
  .build();
```

### Pattern 2: Nested Schema Objects

**Build complex nested structures:**

```typescript
private static extractSymptoms(entity: Entity): object[] | null {
  const symptoms = entity.data.symptoms?.core;
  if (!symptoms || symptoms.length === 0) return null;

  return symptoms.map(symptom => ({
    "@type": "MedicalSymptom",
    "name": this.cleanLinkSyntax(symptom),
    "description": this.extractSymptomDescription(entity, symptom)
  }));
}
```

### Pattern 3: Fuzzy Entity Matching

**Find entities by name with tolerance for variations:**

```typescript
protected findEntityByName(name: string, type: string): string | null {
  const cleanName = this.cleanLinkSyntax(name).toLowerCase();

  // Exact match first
  const exact = entityCache.find(e =>
    e.type === type && e.name.toLowerCase() === cleanName
  );
  if (exact) return exact.slug;

  // Partial match (contains)
  const partial = entityCache.find(e =>
    e.type === type &&
    (e.name.toLowerCase().includes(cleanName) ||
     cleanName.includes(e.name.toLowerCase()))
  );
  if (partial) return partial.slug;

  // Match against alternate names
  const alternate = entityCache.find(e =>
    e.type === type &&
    e.data.alternate_names?.some(alt =>
      alt.toLowerCase() === cleanName
    )
  );
  if (alternate) return alternate.slug;

  return null;
}
```

### Pattern 4: Link Priority & Sorting

**Assign priorities to control link order:**

```typescript
export class TreatmentLinkExtractor extends LinkExtractor {
  extract(entity: Entity): Link[] {
    const links: Link[] = [];

    // First-line treatments = high priority
    entity.data.treatment_approaches?.first_line?.forEach(treatment => {
      links.push({
        text: treatment,
        url: `/treatments/${slug}`,
        context: 'first_line',
        priority: 10  // Highest
      });
    });

    // Second-line = medium priority
    entity.data.treatment_approaches?.second_line?.forEach(treatment => {
      links.push({
        text: treatment,
        url: `/treatments/${slug}`,
        context: 'second_line',
        priority: 7
      });
    });

    // Adjunctive = low priority
    entity.data.treatment_approaches?.adjunctive?.forEach(treatment => {
      links.push({
        text: treatment,
        url: `/treatments/${slug}`,
        context: 'adjunctive',
        priority: 4
      });
    });

    return links;
  }
}
```

### Pattern 5: Graceful Degradation

**Always handle missing data:**

```typescript
private static extractMedicalCodes(entity: Entity): object[] {
  const codes: object[] = [];

  // ICD-10 code
  if (entity.data.icd10_code || entity.metadata?.icd10_code) {
    codes.push({
      "@type": "MedicalCode",
      "code": entity.data.icd10_code || entity.metadata.icd10_code,
      "codingSystem": "ICD-10"
    });
  }

  // DSM-5 code
  if (entity.data.dsm5_code || entity.metadata?.dsm5_code) {
    codes.push({
      "@type": "MedicalCode",
      "code": entity.data.dsm5_code || entity.metadata.dsm5_code,
      "codingSystem": "DSM-5"
    });
  }

  // Return empty array if no codes (NOT null)
  return codes;
}
```

---

## Debugging Guide

### Problem: Metadata not showing up

**Check:**
1. Is `generateMetadata()` exported from page?
2. Is it async and awaiting entity fetch?
3. Is MetadataFactory returning valid Metadata object?
4. Check browser DevTools → Elements → `<head>` for `<title>` and `<meta>` tags

**Debug:**
```typescript
export async function generateMetadata({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const metadata = await MetadataFactory.generate(entity);

  console.log('Entity:', entity);
  console.log('Generated metadata:', metadata);

  return metadata;
}
```

### Problem: Schema not validating

**Check:**
1. Is schema valid JSON?
2. Does schema have `@context` and `@type`?
3. Are all property names correct per schema.org spec?
4. Run through https://validator.schema.org/

**Debug:**
```typescript
const schemas = SchemaFactory.generateAll(entity);
console.log('Generated schemas:', JSON.stringify(schemas, null, 2));

// Validate each schema
schemas.forEach((schema, i) => {
  try {
    JSON.stringify(schema);  // Will throw if not serializable
    console.log(`Schema ${i} is valid JSON`);
  } catch (error) {
    console.error(`Schema ${i} is invalid:`, error);
  }
});
```

### Problem: Links not extracting

**Check:**
1. Is extractor registered for entity type?
2. Is entity.type correct?
3. Does data field exist in entity?
4. Is findEntityByName() finding target entities?

**Debug:**
```typescript
const extractor = new YourLinkExtractor();
const links = extractor.extract(entity);

console.log('Entity type:', entity.type);
console.log('Data field:', entity.data.your_field);
console.log('Extracted links:', links);

// Test entity matching
const slug = extractor.findEntityByName('Some Treatment', 'medication');
console.log('Found slug:', slug);
```

### Problem: Build performance slow

**Check:**
1. How many entities are being statically generated?
2. Are you doing N+1 queries?
3. Is caching enabled?

**Debug:**
```typescript
// Add timing
export default async function Page({ params }) {
  console.time('Entity fetch');
  const entity = await EntityService.getBySlug(params.slug);
  console.timeEnd('Entity fetch');

  console.time('Metadata generation');
  const metadata = await MetadataFactory.generate(entity);
  console.timeEnd('Metadata generation');

  console.time('Schema generation');
  const schemas = SchemaFactory.generateAll(entity);
  console.timeEnd('Schema generation');

  console.time('Link extraction');
  const links = linkRegistry.extractAll(entity);
  console.timeEnd('Link extraction');

  return <Page />;
}
```

---

## Performance Considerations

### Caching Entity Lookups

```typescript
// lib/seo/entity-cache.ts
const entityCache = new Map<string, Entity>();

export async function getCachedEntity(slug: string): Promise<Entity | null> {
  if (entityCache.has(slug)) {
    return entityCache.get(slug)!;
  }

  const entity = await EntityService.getBySlug(slug);
  if (entity) {
    entityCache.set(slug, entity);
  }

  return entity;
}

// Preload cache at build time
export async function preloadEntityCache() {
  const entities = await EntityService.getAllEntities();
  entities.forEach(e => entityCache.set(e.slug, e));
  console.log(`Cached ${entities.length} entities`);
}
```

### Lazy Schema Generation

```typescript
// Only generate schemas when needed
export class SchemaFactory {
  static generateAll(entity: Entity, options?: { skipFAQ?: boolean }): object[] {
    const schemas: object[] = [];

    schemas.push(this.generatePrimarySchema(entity));
    schemas.push(this.generateMedicalWebPageSchema(entity));
    schemas.push(this.generateBreadcrumbSchema(entity));

    // Expensive operations
    if (entity.data.editorial) {
      schemas.push(...this.generatePersonSchemas(entity));
    }

    if (!options?.skipFAQ && this.hasFAQData(entity)) {
      schemas.push(this.generateFAQSchema(entity));
    }

    return schemas;
  }
}
```

### Batch Link Extraction

```typescript
// Extract links for multiple entities at once
export class LinkExtractorRegistry {
  extractBatch(entities: Entity[]): Map<string, Link[]> {
    const results = new Map<string, Link[]>();

    entities.forEach(entity => {
      const links = this.extractAll(entity);
      results.set(entity.slug, links);
    });

    return results;
  }
}
```

---

**End of Developer Guide**

**Next:** See [PHASE_2_IMPLEMENTATION_TIMELINE.md](./PHASE_2_IMPLEMENTATION_TIMELINE.md) for full implementation plan.
