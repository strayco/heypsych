# Phase 2: SEO Architecture Overview

**Project:** HeyPsych SEO + E-A-T + Internal Linking System
**Version:** 1.0
**Date:** November 18, 2025
**Status:** Ready for Implementation

---

## Executive Summary

This document describes the **complete SEO architecture** for HeyPsych Phase 2, building on the existing entity system to deliver:

- ✅ **YMYL/E-A-T Compliance** — Medical credibility signals across all content
- ✅ **Dynamic Metadata Engine** — Rules-based SEO for all 863+ pages
- ✅ **Automated Internal Linking** — 50+ contextual links per page from JSON relationships
- ✅ **Schema.org Stack** — Multi-schema structured data for all entity types
- ✅ **Content Clustering** — Hub-and-spoke architecture for topic authority
- ✅ **Scalable to 5,000+ pages** — Zero code changes needed for growth

**Architecture Constraint:** The system is built on a **stable Entity abstraction layer** that treats JSON as an implementation detail, ensuring resilience to future data structure changes.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                              │
│                     (e.g., /conditions/gad)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Page Component (Server Component)                        │  │
│  │  - Calls EntityService.getBySlug(slug)                    │  │
│  │  - Calls MetadataFactory.generate(entity)                 │  │
│  │  - Calls SchemaFactory.generateAll(entity)                │  │
│  │  - Calls LinkExtractorRegistry.extractAll(entity)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE ABSTRACTION LAYER                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Entity Service (Single Source)            │    │
│  │  • getBySlug(slug): Entity                             │    │
│  │  • getBySchemaType(type): Entity[]                     │    │
│  │  • getAllTreatments(): Entity[]                        │    │
│  │  • getConditionsByCategory(cat): Entity[]              │    │
│  │  • searchEntities(query): Entity[]                     │    │
│  └────────────┬──────────────────────────┬────────────────┘    │
│               │                          │                      │
│               ▼                          ▼                      │
│  ┌────────────────────┐    ┌────────────────────────┐         │
│  │   Database Layer    │    │   JSON File Layer      │         │
│  │  (Supabase/Postgres)│    │  (Static JSON files)   │         │
│  │  - entities table   │    │  - data/treatments/    │         │
│  │  - relationships    │    │  - data/conditions/    │         │
│  │  - schemas          │    │  - data/resources/     │         │
│  └────────────────────┘    └────────────────────────┘         │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ENTITY NORMALIZATION LAYER                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Entity Mappers (src/lib/data/entity-mappers.ts)         │  │
│  │  • mapRowToEntity(dbRow): Entity                         │  │
│  │  • mapJSONToEntity(json): Entity                         │  │
│  │  • normalizeEntityContent(content): normalized           │  │
│  │  • buildEntitySchema(type): schema config                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│           Produces: Universal Entity Interface                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  interface Entity {                                       │  │
│  │    id, slug, name, description                            │  │
│  │    type: "condition" | "medication" | "therapy" | ...     │  │
│  │    data: Record<string, any>  // Full normalized content  │  │
│  │    metadata: any               // Type-specific fields    │  │
│  │    schema: { entity_type, field_definitions, ... }        │  │
│  │    status, visibility, created_at, updated_at             │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEO GENERATION LAYER                          │
│                  (Operates on Entity interface only)             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. MetadataFactory                                     │    │
│  │     ├─ ConditionMetadataGenerator                       │    │
│  │     ├─ MedicationMetadataGenerator                      │    │
│  │     ├─ TherapyMetadataGenerator                         │    │
│  │     ├─ ResourceMetadataGenerator                        │    │
│  │     └─ DefaultMetadataGenerator (fallback)              │    │
│  │                                                          │    │
│  │  Generates: { title, description, keywords, OG, ... }   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  2. SchemaFactory                                       │    │
│  │     ├─ MedicalCondition schema builder                  │    │
│  │     ├─ Drug schema builder                              │    │
│  │     ├─ MedicalTherapy schema builder                    │    │
│  │     ├─ MedicalWebPage (all pages)                       │    │
│  │     ├─ Person (author + reviewer)                       │    │
│  │     ├─ BreadcrumbList (navigation)                      │    │
│  │     └─ FAQPage (auto-generated)                         │    │
│  │                                                          │    │
│  │  Generates: [schema1, schema2, ...] (JSON-LD objects)   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  3. LinkExtractorRegistry                               │    │
│  │     ├─ TreatmentLinkExtractor (conditions → treatments) │    │
│  │     ├─ AssessmentLinkExtractor (conditions → assess.)   │    │
│  │     ├─ RelatedConditionExtractor (condition → cond.)    │    │
│  │     ├─ IndicationLinkExtractor (treatments → conds.)    │    │
│  │     ├─ RelatedTreatmentExtractor (treatment → treat.)   │    │
│  │     └─ ResourceLinkExtractor (resources → entities)     │    │
│  │                                                          │    │
│  │  Generates: [{ text, url, context }, ...] (Link[])      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  4. ContentClusterBuilder                               │    │
│  │     • buildCluster(entity): Cluster                     │    │
│  │     • findRelatedConditions(entity)                     │    │
│  │     • findTreatments(entity)                            │    │
│  │     • findAssessments(entity)                           │    │
│  │     • findResources(entity)                             │    │
│  │     • getCategoryHub(category)                          │    │
│  │                                                          │    │
│  │  Returns: { center, related, treatments, ... }          │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    E-A-T COMPONENT LAYER                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Reusable E-A-T UI Components                           │    │
│  │  • <AuthorByline />          (displays author info)     │    │
│  │  • <MedicalReviewBadge />    (displays reviewer)        │    │
│  │  • <ContentTimestamps />     (published/updated dates)  │    │
│  │  • <MedicalDisclaimer />     (YMYL disclaimer)          │    │
│  │  • <CrisisSupportBanner />   (emergency resources)      │    │
│  │  • <CitationList />          (references section)       │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LINK PLACEMENT & RENDERING LAYER                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Link Placement Engine                                  │    │
│  │  • allocateToSlots(links): PlacedLinks                  │    │
│  │  • enforceMaxLimits(links, template)                    │    │
│  │  • varyAnchorText(links)                                │    │
│  │  • prioritizeLinks(links, rules)                        │    │
│  │                                                          │    │
│  │  Slots:                                                 │    │
│  │  - Body content (contextual)                            │    │
│  │  - Treatment options section                            │    │
│  │  - Related conditions sidebar                           │    │
│  │  - Assessment tools CTA                                 │    │
│  │  - FAQ section                                          │    │
│  │  - Footer navigation                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Link Rendering Components                              │    │
│  │  • <RelatedConditions links={...} />                    │    │
│  │  • <TreatmentOptions links={...} />                     │    │
│  │  • <AssessmentCTA links={...} />                        │    │
│  │  • <RelatedArticles links={...} />                      │    │
│  │  • <ParsedContent /> (inline link replacement)          │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL HTML OUTPUT                             │
│                                                                  │
│  <html>                                                          │
│    <head>                                                        │
│      <title>{metadata.title}</title>                            │
│      <meta name="description" content="{metadata.description}"/>│
│      <meta property="og:..." />                                 │
│      <script type="application/ld+json">                        │
│        {JSON.stringify(schemas)}                                │
│      </script>                                                  │
│    </head>                                                       │
│    <body>                                                        │
│      <AuthorByline />                                           │
│      <MedicalReviewBadge />                                     │
│      <ContentTimestamps />                                      │
│      <article>                                                  │
│        <ParsedContent /> {/* Body with inline links */}         │
│        <RelatedConditions />                                    │
│        <TreatmentOptions />                                     │
│        <AssessmentCTA />                                        │
│      </article>                                                 │
│      <aside><RelatedArticles /></aside>                         │
│      <MedicalDisclaimer />                                      │
│      <CrisisSupportBanner />                                    │
│    </body>                                                       │
│  </html>                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Components

### 1. Entity Service (Data Access Layer)

**Purpose:** Single source of truth for all entity data. Abstracts database vs. JSON file storage.

**Location:** `src/lib/data/entity-service.ts`

**Key Methods:**
```typescript
class EntityService {
  static async getBySlug(slug: string): Promise<Entity | null>
  static async getBySchemaType(schemaName: string): Promise<Entity[]>
  static async getAllTreatments(): Promise<Entity[]>
  static async getConditionsByCategory(category: string): Promise<Entity[]>
  static async searchEntities(query: string): Promise<Entity[]>
}
```

**Resilience:** Falls back to JSON files if database unavailable.

**Phase 2 Enhancement:** No changes needed to this layer.

---

### 2. Entity Normalization Layer

**Purpose:** Maps heterogeneous data sources (database rows, JSON files) to a universal Entity interface.

**Location:** `src/lib/data/entity-mappers.ts`

**Universal Entity Interface:**
```typescript
interface Entity {
  id: string;
  schema_id: string;
  name: string;
  slug: string;
  description?: string | null;
  data: Record<string, any>;        // Normalized content
  metadata?: any;                    // Type-specific metadata
  status: "active" | "draft" | "archived";
  visibility: "public" | "admin" | "research";
  created_at: string;
  updated_at: string;
  schema?: {
    entity_type: string;             // "medication", "therapy", "condition"
    display_name: string;
    icon: string;
    color: string;
    field_definitions: Record<string, any>;
  };
}
```

**Key Functions:**
```typescript
function mapRowToEntity(dbRow: any, schemaName: string): Entity
function normalizeEntityContent(content: any): Record<string, any>
function buildEntitySchema(schemaName: string): EntitySchema
```

**Phase 2 Enhancement:** Add editorial fields normalization (author, reviewer, dates).

---

### 3. MetadataFactory (SEO Metadata Generation)

**Purpose:** Rules-based title/description/keywords generation for all entity types.

**Location:** `src/lib/seo/metadata-factory.ts` (NEW)

**Architecture:**
```typescript
abstract class MetadataGenerator {
  abstract generate(entity: Entity): Promise<Metadata>;
  protected truncate(text: string, maxLength: number): string;
  protected generateCanonical(entity: Entity): string;
  protected abstract getPath(entity: Entity): string;
}

class ConditionMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Rules from Phase 2 plan:
    // Title: "{Name}: Symptoms, Causes, Treatment & Support | HeyPsych"
    // Description: "Learn about {condition} symptoms, causes..."
  }
}

class MedicationMetadataGenerator extends MetadataGenerator { /* ... */ }
class TherapyMetadataGenerator extends MetadataGenerator { /* ... */ }
class ResourceMetadataGenerator extends MetadataGenerator { /* ... */ }

export class MetadataFactory {
  static generate(entity: Entity): Promise<Metadata> {
    const generator = this.getGenerator(entity.type);
    return generator.generate(entity);
  }

  private static getGenerator(type: string): MetadataGenerator {
    switch(type) {
      case 'condition': return new ConditionMetadataGenerator();
      case 'medication': return new MedicationMetadataGenerator();
      case 'therapy': return new TherapyMetadataGenerator();
      case 'resource': return new ResourceMetadataGenerator();
      default: return new DefaultMetadataGenerator();
    }
  }
}
```

**Usage in Page:**
```typescript
// app/conditions/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const entity = await EntityService.getBySlug(params.slug);
  return MetadataFactory.generate(entity);
}
```

**Scalability:** Adding new entity type = add new generator class, register in factory.

---

### 4. SchemaFactory (JSON-LD Structured Data)

**Purpose:** Generates 3-5 schema.org schemas per page for rich results.

**Location:** `src/lib/seo/schema-factory.ts` (NEW)

**Schema Stack per Page:**
1. **Primary schema** (MedicalCondition, Drug, MedicalTherapy)
2. **MedicalWebPage** (all pages)
3. **BreadcrumbList** (navigation context)
4. **Person** (author + medical reviewer)
5. **FAQPage** (if FAQ section exists)

**Architecture:**
```typescript
export class SchemaFactory {
  static generateAll(entity: Entity): object[] {
    const schemas: object[] = [];

    // 1. Primary entity schema
    schemas.push(this.generatePrimarySchema(entity));

    // 2. MedicalWebPage (universal)
    schemas.push(this.generateMedicalWebPageSchema(entity));

    // 3. BreadcrumbList (universal)
    schemas.push(this.generateBreadcrumbSchema(entity));

    // 4. Person schemas (if editorial data exists)
    if (entity.data.editorial?.author) {
      schemas.push(this.generateAuthorSchema(entity.data.editorial.author));
    }
    if (entity.data.editorial?.medicalReviewer) {
      schemas.push(this.generateReviewerSchema(entity.data.editorial.medicalReviewer));
    }

    // 5. FAQPage (if FAQs exist or can be auto-generated)
    const faqs = this.generateFAQs(entity);
    if (faqs.length > 0) {
      schemas.push(this.generateFAQSchema(faqs));
    }

    return schemas;
  }

  private static generatePrimarySchema(entity: Entity): object {
    switch(entity.type) {
      case 'condition': return this.generateMedicalConditionSchema(entity);
      case 'medication': return this.generateDrugSchema(entity);
      case 'therapy': return this.generateMedicalTherapySchema(entity);
      default: return this.generateArticleSchema(entity);
    }
  }

  // Schema builders use SchemaBuilder utility
  private static generateMedicalConditionSchema(entity: Entity): object {
    return new SchemaBuilder()
      .setContext("https://schema.org")
      .setType("MedicalCondition")
      .addProperty("name", entity.name)
      .addPropertyIfExists("alternateName", this.extractAlternateNames(entity))
      .addPropertyIfExists("code", this.extractMedicalCodes(entity))
      .addPropertyIfExists("signOrSymptom", this.extractSymptoms(entity))
      .addPropertyIfExists("riskFactor", this.extractRiskFactors(entity))
      .addPropertyIfExists("possibleTreatment", this.extractTreatments(entity))
      .build();
  }

  // ... Drug, MedicalTherapy, MedicalWebPage, etc. builders
}
```

**Graceful Degradation:** All `addPropertyIfExists()` methods skip missing data, never emit invalid JSON-LD.

**Usage in Page:**
```typescript
// app/conditions/[slug]/page.tsx
export default async function ConditionPage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const schemas = SchemaFactory.generateAll(entity);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Page content */}
    </>
  );
}
```

---

### 5. LinkExtractorRegistry (Internal Linking Engine)

**Purpose:** Automatically extracts 50+ contextual internal links per page from entity relationships.

**Location:** `src/lib/seo/link-extractor-registry.ts` (NEW)

**Architecture:**
```typescript
export interface Link {
  text: string;       // Anchor text
  url: string;        // Target URL
  context: string;    // Source context (e.g., "treatment_approaches.medications")
  priority?: number;  // For sorting/pruning
}

export abstract class LinkExtractor {
  abstract extract(entity: Entity): Link[];

  protected cleanLinkSyntax(text: string): string {
    return text.replace(/\{link:[^:]+:([^}]+)\}/g, '$1');
  }

  protected findEntityByName(name: string, type: string): string | null {
    // Fuzzy match against entity database
    return EntityMatcher.findSlug(name, type);
  }
}

// Condition → Treatment links
export class TreatmentLinkExtractor extends LinkExtractor {
  extract(entity: Entity): Link[] {
    if (entity.type !== 'condition') return [];

    const links: Link[] = [];
    const approaches = entity.data.treatment_approaches;

    // Extract medication links
    approaches?.medications?.forEach((med: string) => {
      const slug = this.findEntityByName(this.cleanLinkSyntax(med), 'medication');
      if (slug) {
        links.push({
          text: this.cleanLinkSyntax(med),
          url: `/treatments/${slug}`,
          context: 'treatment_approaches.medications',
          priority: 10
        });
      }
    });

    // Extract psychotherapy links
    approaches?.psychotherapy?.forEach((therapy: string) => {
      const slug = this.findEntityByName(this.cleanLinkSyntax(therapy), 'therapy');
      if (slug) {
        links.push({
          text: this.cleanLinkSyntax(therapy),
          url: `/treatments/${slug}`,
          context: 'treatment_approaches.psychotherapy',
          priority: 9
        });
      }
    });

    return links;
  }
}

// Condition → Assessment links
export class AssessmentLinkExtractor extends LinkExtractor { /* ... */ }

// Condition → Related Condition links
export class RelatedConditionExtractor extends LinkExtractor { /* ... */ }

// Treatment → Condition links (indications)
export class IndicationLinkExtractor extends LinkExtractor { /* ... */ }

// Treatment → Related Treatment links (same drug class)
export class RelatedTreatmentExtractor extends LinkExtractor { /* ... */ }

// Registry manages all extractors
export class LinkExtractorRegistry {
  private extractors = new Map<string, LinkExtractor[]>();

  register(entityType: string, extractor: LinkExtractor) {
    if (!this.extractors.has(entityType)) {
      this.extractors.set(entityType, []);
    }
    this.extractors.get(entityType)!.push(extractor);
  }

  extractAll(entity: Entity): Link[] {
    const extractors = this.extractors.get(entity.type) || [];
    return extractors.flatMap(e => e.extract(entity));
  }
}

// Initialize registry at app startup
export const linkRegistry = new LinkExtractorRegistry();
linkRegistry.register('condition', new TreatmentLinkExtractor());
linkRegistry.register('condition', new AssessmentLinkExtractor());
linkRegistry.register('condition', new RelatedConditionExtractor());
linkRegistry.register('medication', new IndicationLinkExtractor());
linkRegistry.register('medication', new RelatedTreatmentExtractor());
linkRegistry.register('therapy', new IndicationLinkExtractor());
linkRegistry.register('therapy', new RelatedTreatmentExtractor());
```

**Extensibility:** Adding new link pattern = create new LinkExtractor subclass, register with registry.

**Link Limits & Prioritization:**
```typescript
export class LinkPlacementEngine {
  static allocateToSlots(links: Link[], template: string): PlacedLinks {
    const limits = LINK_LIMITS[template]; // e.g., { body: 40, sidebar: 12, footer: 100 }

    // Sort by priority
    links.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Enforce max limits
    if (links.length > limits.total) {
      links = links.slice(0, limits.total);
    }

    // Vary anchor text for same URLs
    links = this.varyAnchorText(links);

    // Allocate to slots
    return {
      body: links.filter(l => l.context.includes('treatment_approaches')).slice(0, limits.body),
      sidebar: links.filter(l => l.context.includes('related')).slice(0, limits.sidebar),
      footer: /* category links */
    };
  }

  private static varyAnchorText(links: Link[]): Link[] {
    // If multiple links to same URL, vary anchor text
    // E.g., "GAD" vs "Generalized Anxiety Disorder" vs "anxiety disorder"
  }
}
```

---

### 6. ContentClusterBuilder (Hub-and-Spoke Architecture)

**Purpose:** Builds content clusters showing relationships between entities.

**Location:** `src/lib/seo/content-cluster-builder.ts` (NEW)

**Architecture:**
```typescript
export interface Cluster {
  center: Entity;                    // Central entity
  relatedConditions: Entity[];       // Related conditions
  treatments: Entity[];              // Treatments for this condition
  assessments: Entity[];             // Screening tools
  resources: Entity[];               // Articles, guides, tools
  categoryHub: CategoryHub;          // Parent category page
}

export class ContentClusterBuilder {
  static async buildCluster(entity: Entity): Promise<Cluster> {
    return {
      center: entity,
      relatedConditions: await this.findRelatedConditions(entity),
      treatments: await this.findTreatments(entity),
      assessments: await this.findAssessments(entity),
      resources: await this.findResources(entity),
      categoryHub: await this.getCategoryHub(entity)
    };
  }

  private static async findRelatedConditions(entity: Entity): Promise<Entity[]> {
    // From comorbidities
    const comorbidities = entity.data.comorbidities || [];
    const slugs = comorbidities.map(c => this.extractSlug(c));
    return await EntityService.getBySlugs(slugs);
  }

  private static async findTreatments(entity: Entity): Promise<Entity[]> {
    // From treatment_approaches
    const approaches = entity.data.treatment_approaches;
    const medications = approaches?.medications || [];
    const therapies = approaches?.psychotherapy || [];

    const allTreatmentNames = [...medications, ...therapies];
    const slugs = allTreatmentNames.map(name => this.findTreatmentSlug(name));

    return await EntityService.getBySlugs(slugs.filter(Boolean));
  }

  // ... similar methods for assessments, resources
}
```

**Usage in Page:**
```typescript
export default async function ConditionPage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const cluster = await ContentClusterBuilder.buildCluster(entity);

  return (
    <>
      {/* Main content */}
      <RelatedConditions conditions={cluster.relatedConditions} />
      <TreatmentOptions treatments={cluster.treatments} />
      <AssessmentCTA assessments={cluster.assessments} />
      <RelatedArticles resources={cluster.resources} />
    </>
  );
}
```

---

### 7. E-A-T Component Library

**Purpose:** Reusable UI components for YMYL/E-A-T compliance.

**Location:** `src/components/seo/` (NEW)

**Components:**

```typescript
// AuthorByline.tsx
export function AuthorByline({ author }: { author: AuthorInfo }) {
  return (
    <div className="author-byline">
      <span className="author-label">Written by:</span>
      <Link href={`/about/authors/${author.slug}`}>
        {author.name}, {author.credentials}
      </Link>
    </div>
  );
}

// MedicalReviewBadge.tsx
export function MedicalReviewBadge({ reviewer }: { reviewer: ReviewerInfo }) {
  return (
    <div className="medical-review-badge">
      <VerifiedIcon />
      <div>
        <span className="review-label">Medically Reviewed By:</span>
        <Link href={`/about/medical-review-board/${reviewer.slug}`}>
          {reviewer.name}, {reviewer.credentials}
        </Link>
        <span className="specialty">{reviewer.specialty}</span>
      </div>
    </div>
  );
}

// ContentTimestamps.tsx
export function ContentTimestamps({ dates }: { dates: EditorialDates }) {
  return (
    <div className="content-dates">
      <span>Published: <time dateTime={dates.published}>{formatDate(dates.published)}</time></span>
      <span>Updated: <time dateTime={dates.lastUpdated}>{formatDate(dates.lastUpdated)}</time></span>
      <span>Medically Reviewed: <time dateTime={dates.lastMedicallyReviewed}>{formatDate(dates.lastMedicallyReviewed)}</time></span>
    </div>
  );
}

// MedicalDisclaimer.tsx
export function MedicalDisclaimer() {
  return (
    <aside className="medical-disclaimer">
      <h4>⚕️ Medical Disclaimer</h4>
      <p>
        This content is for informational and educational purposes only.
        It is not intended to be a substitute for professional medical advice...
      </p>
      <p>
        <strong>If you are experiencing a mental health crisis or emergency,
        please call 988 (Suicide & Crisis Lifeline)...</strong>
      </p>
    </aside>
  );
}

// CrisisSupportBanner.tsx
export function CrisisSupportBanner() {
  return (
    <div className="crisis-banner">
      <AlertIcon />
      <span>In crisis? Call 988 or text "HELLO" to 741741</span>
      <Link href="/resources/crisis-helplines">View All Crisis Resources</Link>
    </div>
  );
}

// CitationList.tsx
export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <section className="references">
      <h2>Medical References</h2>
      <ol>
        {citations.map((cite, i) => (
          <li key={i} id={`ref-${i + 1}`}>
            <span className="citation">{cite.text}</span>
            {cite.doi && <a href={cite.doi} target="_blank">DOI: {cite.doi}</a>}
          </li>
        ))}
      </ol>
    </section>
  );
}
```

**Usage:**
```typescript
// In any page component
export default async function ConditionPage({ params }) {
  const entity = await EntityService.getBySlug(params.slug);
  const { author, medicalReviewer, dates } = entity.data.editorial || {};

  return (
    <>
      {author && <AuthorByline author={author} />}
      {medicalReviewer && <MedicalReviewBadge reviewer={medicalReviewer} />}
      {dates && <ContentTimestamps dates={dates} />}

      <article>{/* Content */}</article>

      <MedicalDisclaimer />
      <CrisisSupportBanner />
    </>
  );
}
```

---

## Data Flow Examples

### Example 1: Condition Page Load

```
1. User requests: /conditions/generalized-anxiety-disorder

2. Next.js App Router:
   - Calls generateMetadata({ params: { slug: 'generalized-anxiety-disorder' } })
   - Calls ConditionPage({ params: { slug: 'generalized-anxiety-disorder' } })

3. Metadata Generation:
   entity = await EntityService.getBySlug('generalized-anxiety-disorder')
   metadata = await MetadataFactory.generate(entity)
   // Returns: {
   //   title: "Generalized Anxiety Disorder: Symptoms, Causes, Treatment & Support | HeyPsych",
   //   description: "Learn about GAD symptoms, causes, risk factors...",
   //   keywords: "GAD, anxiety, worry, generalized anxiety disorder treatment...",
   //   openGraph: { title, description, type: "article" }
   // }

4. Page Rendering:
   entity = await EntityService.getBySlug('generalized-anxiety-disorder')
   schemas = SchemaFactory.generateAll(entity)
   // Returns: [
   //   { @type: "MedicalCondition", name: "GAD", ... },
   //   { @type: "MedicalWebPage", ... },
   //   { @type: "BreadcrumbList", ... },
   //   { @type: "Person", name: "Dr. Jennifer Chen" },
   //   { @type: "FAQPage", mainEntity: [...] }
   // ]

   links = linkRegistry.extractAll(entity)
   // Returns: [
   //   { text: "Cognitive Behavioral Therapy", url: "/treatments/cbt", context: "psychotherapy" },
   //   { text: "Escitalopram", url: "/treatments/escitalopram", context: "medications" },
   //   { text: "GAD-7", url: "/resources/assessments-screeners/gad-7", context: "screeners" },
   //   { text: "Panic Disorder", url: "/conditions/panic-disorder", context: "comorbidities" },
   //   ... (50+ total links)
   // ]

   cluster = await ContentClusterBuilder.buildCluster(entity)
   // Returns: {
   //   center: entity,
   //   relatedConditions: [panicDisorder, socialAnxiety, mdd],
   //   treatments: [cbt, act, escitalopram, paroxetine, ...],
   //   assessments: [gad7, bai, hads],
   //   resources: [managingAnxietyArticle, headspaceApp],
   //   categoryHub: { slug: 'anxiety-fear', name: 'Anxiety & Fear Disorders' }
   // }

5. HTML Output:
   <head>
     <title>{metadata.title}</title>
     <meta name="description" content={metadata.description} />
     <script type="application/ld+json">{schemas[0]}</script>
     <script type="application/ld+json">{schemas[1]}</script>
     ...
   </head>
   <body>
     <AuthorByline author={entity.data.editorial.author} />
     <MedicalReviewBadge reviewer={entity.data.editorial.medicalReviewer} />
     <ContentTimestamps dates={entity.data.editorial.dates} />

     <article>
       <ParsedContent content={entity.data.description} /> {/* Inline links */}
     </article>

     <RelatedConditions conditions={cluster.relatedConditions} />
     <TreatmentOptions treatments={cluster.treatments} />
     <AssessmentCTA assessments={cluster.assessments} />

     <MedicalDisclaimer />
     <CrisisSupportBanner />
   </body>
```

---

## Configuration & Extensibility

### Adding a New Entity Type

**Scenario:** You want to add a new entity type "ClinicalGuideline".

**Steps:**

1. **Add to Entity type enum** (`src/lib/types/database.ts`):
   ```typescript
   export type EntityType =
     | "treatment" | "medication" | "therapy"
     | "condition" | "resource" | "provider"
     | "clinical-guideline";  // NEW
   ```

2. **Create metadata generator** (`src/lib/seo/metadata-factory.ts`):
   ```typescript
   class ClinicalGuidelineMetadataGenerator extends MetadataGenerator {
     async generate(entity: Entity): Promise<Metadata> {
       return {
         title: `${entity.name} - Clinical Practice Guideline | HeyPsych`,
         description: `Evidence-based clinical guideline for ${entity.name}...`,
         // ...
       };
     }
   }

   // Register in factory
   case 'clinical-guideline': return new ClinicalGuidelineMetadataGenerator();
   ```

3. **Create schema generator** (`src/lib/seo/schema-factory.ts`):
   ```typescript
   private static generateClinicalGuidelineSchema(entity: Entity): object {
     return {
       "@context": "https://schema.org",
       "@type": "MedicalGuideline",
       "name": entity.name,
       "guidelineSubject": entity.data.subject,
       "evidenceLevel": entity.data.evidenceLevel,
       // ...
     };
   }

   // Register in primary schema switch
   case 'clinical-guideline': return this.generateClinicalGuidelineSchema(entity);
   ```

4. **Add link extractors** (if needed):
   ```typescript
   class GuidelineLinkExtractor extends LinkExtractor {
     extract(entity: Entity): Link[] {
       // Extract links from guidelines to conditions/treatments
     }
   }

   linkRegistry.register('clinical-guideline', new GuidelineLinkExtractor());
   ```

5. **Create page route** (`src/app/guidelines/[slug]/page.tsx`):
   ```typescript
   export async function generateMetadata({ params }): Promise<Metadata> {
     const entity = await EntityService.getBySlug(params.slug);
     return MetadataFactory.generate(entity);  // Automatically uses new generator
   }

   export default async function GuidelinePage({ params }) {
     const entity = await EntityService.getBySlug(params.slug);
     const schemas = SchemaFactory.generateAll(entity);  // Automatically includes new schema
     // ...
   }
   ```

**Result:** Entire SEO system automatically supports the new entity type.

---

### Adding a New Link Pattern

**Scenario:** You want to link treatments to "Related Research Articles".

**Steps:**

1. **Create new link extractor** (`src/lib/seo/link-extractors/research-link-extractor.ts`):
   ```typescript
   export class ResearchLinkExtractor extends LinkExtractor {
     extract(entity: Entity): Link[] {
       if (entity.type !== 'medication' && entity.type !== 'therapy') return [];

       const links: Link[] = [];
       const researchArticles = entity.data.research_articles || [];

       researchArticles.forEach((article: string) => {
         const slug = this.findEntityByName(article, 'resource');
         if (slug) {
           links.push({
             text: article,
             url: `/resources/${slug}`,
             context: 'research_articles',
             priority: 5
           });
         }
       });

       return links;
     }
   }
   ```

2. **Register extractor** (`src/lib/seo/link-extractor-registry.ts`):
   ```typescript
   linkRegistry.register('medication', new ResearchLinkExtractor());
   linkRegistry.register('therapy', new ResearchLinkExtractor());
   ```

3. **Add placement slot** (if needed):
   ```typescript
   // In LinkPlacementEngine
   const researchLinks = links.filter(l => l.context === 'research_articles');
   return {
     body: ...,
     sidebar: ...,
     researchSection: researchLinks  // NEW SLOT
   };
   ```

4. **Create rendering component**:
   ```typescript
   // src/components/seo/RelatedResearch.tsx
   export function RelatedResearch({ links }: { links: Link[] }) {
     return (
       <section className="related-research">
         <h3>Related Research</h3>
         <ul>
           {links.map(link => (
             <li key={link.url}>
               <Link href={link.url}>{link.text}</Link>
             </li>
           ))}
         </ul>
       </section>
     );
   }
   ```

5. **Use in page template**:
   ```typescript
   const links = linkRegistry.extractAll(entity);
   const placedLinks = LinkPlacementEngine.allocateToSlots(links, 'treatment');

   return (
     <>
       {/* ... */}
       <RelatedResearch links={placedLinks.researchSection} />
     </>
   );
   ```

**Result:** New link pattern is automatically extracted and rendered across all applicable pages.

---

## Observability & Guardrails

### Metrics Dashboard

**Location:** `src/lib/seo/metrics.ts` (NEW)

```typescript
export interface SEOMetrics {
  metadata: {
    totalPages: number;
    pagesWithTitle: number;
    pagesWithDescription: number;
    pagesWithKeywords: number;
    coveragePercent: number;
  };
  schemas: {
    totalPages: number;
    pagesWithSchema: number;
    schemaValidationErrors: number;
    coveragePercent: number;
  };
  links: {
    avgLinksPerPage: number;
    avgLinksByTemplate: Record<string, number>;
    brokenLinkCount: number;
  };
}

export async function generateSEOMetrics(): Promise<SEOMetrics> {
  const allEntities = await EntityService.getAllEntities();

  const metadataMetrics = {
    totalPages: allEntities.length,
    pagesWithTitle: allEntities.filter(e => hasTitle(e)).length,
    pagesWithDescription: allEntities.filter(e => hasDescription(e)).length,
    pagesWithKeywords: allEntities.filter(e => hasKeywords(e)).length,
    coveragePercent: /* calculate */
  };

  // ... similar for schemas, links

  return { metadata: metadataMetrics, schemas: schemaMetrics, links: linkMetrics };
}
```

**Usage:** CLI command or admin dashboard page.

```bash
npm run seo:metrics
# Output:
# Metadata Coverage: 863/863 (100%)
# Schema Coverage: 863/863 (100%)
# Avg Internal Links: 52.3 per page
# Broken Links: 0
```

### Guardrails

**Link Limits:**
```typescript
// src/lib/seo/config.ts
export const LINK_LIMITS = {
  condition: { body: 40, sidebar: 12, footer: 100, total: 75 },
  medication: { body: 35, sidebar: 10, footer: 100, total: 70 },
  therapy: { body: 35, sidebar: 10, footer: 100, total: 70 },
  resource: { body: 30, sidebar: 8, footer: 100, total: 60 }
};
```

**CI/CD Checks:**
```typescript
// tests/seo/coverage.test.ts
test('All entities have metadata', async () => {
  const entities = await EntityService.getAllEntities();
  const withoutMetadata = entities.filter(e => !hasMetadata(e));

  expect(withoutMetadata).toHaveLength(0);
  // If fails, CI build fails
});

test('All entities have valid schema', async () => {
  const entities = await EntityService.getAllEntities();

  for (const entity of entities) {
    const schemas = SchemaFactory.generateAll(entity);
    for (const schema of schemas) {
      const errors = validateSchema(schema);
      expect(errors).toHaveLength(0);
    }
  }
});

test('Link density within limits', async () => {
  const entities = await EntityService.getAllEntities();

  for (const entity of entities) {
    const links = linkRegistry.extractAll(entity);
    const limits = LINK_LIMITS[entity.type];

    expect(links.length).toBeLessThanOrEqual(limits.total);
  }
});
```

---

## Deployment & Rollout

### Phase 1: Foundation (No User-Visible Changes)

1. Build core SEO infrastructure:
   - MetadataFactory
   - SchemaFactory
   - LinkExtractorRegistry
   - E-A-T components

2. Add editorial data to entities:
   - author, medicalReviewer, dates fields
   - Populate for top 50 entities as proof-of-concept

3. Deploy without UI changes (schemas in `<head>`, but not visible)

4. Validate with tools:
   - Google Rich Results Test
   - Schema Markup Validator

### Phase 2: Gradual Rollout

1. Enable E-A-T components on 10 condition pages
2. Monitor Google Search Console for rich results
3. If successful, enable on all condition pages
4. Repeat for treatments, then resources

### Phase 3: Full Launch

1. Enable all SEO features across all 863+ pages
2. Submit updated sitemap to Google
3. Monitor indexing progress
4. Track rich results in GSC

---

## Success Criteria

### Technical Metrics (Month 1)

- ✅ 100% metadata coverage (863/863 pages)
- ✅ 100% JSON-LD coverage (863/863 pages)
- ✅ 0 schema validation errors
- ✅ 863 pages in sitemap
- ✅ Lighthouse SEO score >95

### SEO Metrics (Month 3)

- ✅ 90%+ indexed pages
- ✅ 50+ avg internal links per page
- ✅ 100+ rich results in SERP
- ✅ 20+ featured snippets

### Business Metrics (Month 6)

- ✅ +100% organic traffic
- ✅ +150% keyword rankings (top 10)
- ✅ +200% impressions in Search Console

---

## Maintenance

### Quarterly Reviews

- Medical review of all clinical content
- Update treatment guidelines
- Refresh statistics and prevalence data
- Review and update references

### Automated Monitoring

- Weekly: Schema validation errors
- Weekly: Broken link checks
- Monthly: Metadata coverage checks
- Monthly: Link density audits

---

**End of Architecture Overview**
