# CODE STRUCTURE OVERVIEW

**Project:** HeyPsych - Mental Health Treatment Education Platform
**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase, Zod
**Version:** 0.1.0
**Status:** Early Development (Active)

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Architecture & Dependencies](#architecture--dependencies)
4. [Core Systems](#core-systems)
5. [Route Structure & Pages](#route-structure--pages)
6. [Data & Storage](#data--storage)
7. [Scripts & Automation](#scripts--automation)
8. [Issues & Recommendations](#issues--recommendations)

---

## PROJECT OVERVIEW

HeyPsych is a comprehensive mental health education platform providing information about conditions, treatments, resources, and providers. It combines static data (JSON files) with a Supabase database backend and features a modern React UI.

### Key Features
- **Conditions Hub**: 289+ mental health conditions organized by DSM-5 category
- **Treatments Comparison**: 50+ treatments across medications, therapy, alternative approaches
- **Clinical Resources**: Assessments, screeners, crisis lines, digital tools, articles, support communities
- **Provider Directory**: Mental health professionals search (powered by NPPES data)
- **Dynamic Routing**: Content-driven pages with slug-based navigation
- **API Routes**: RESTful endpoints for data delivery

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **Database**: Supabase (PostgreSQL)
- **Data Queries**: React Query (@tanstack/react-query)
- **State Management**: Zustand
- **Component UI**: Radix UI (primitives), shadcn-like patterns
- **Content**: Zod validation, JSON schema system

---

## DIRECTORY STRUCTURE

### Root-Level Organization

```
heypsych/
├── src/                          # Application source code
├── data/                         # Static JSON data files (conditions, treatments, resources)
├── scripts/                      # Build, seed, and maintenance scripts
├── public/                       # Static assets (SVG, images)
├── .next/                        # Next.js build artifacts
├── node_modules/                 # Dependencies
├── eslint.config.mjs            # ESLint configuration (Next.js rules)
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS theme and content config
├── postcss.config.mjs           # PostCSS with Tailwind v4 support
├── package.json                 # Dependencies and scripts
└── package-lock.json            # Dependency lock file
```

### Source Code Structure (`src/`)

```
src/
├── app/                         # Next.js 15 App Router
│   ├── (legal)/                # Route group for legal pages
│   │   ├── about/
│   │   ├── privacy/
│   │   ├── terms/
│   │   └── layout.tsx           # Legal pages layout wrapper
│   │
│   ├── api/                     # API routes (server-only)
│   │   ├── providers/search/    # Provider search endpoint
│   │   └── treatments/[slug]/   # Dynamic treatment detail endpoint
│   │
│   ├── conditions/              # Conditions section
│   │   ├── page.tsx             # Main conditions hub
│   │   ├── [slug]/              # Dynamic condition detail page
│   │   ├── [category]/          # Category-based listings
│   │   │   ├── anxiety-fear/
│   │   │   ├── attention-learning/
│   │   │   ├── autism-development/
│   │   │   ├── behavioral-disorders/
│   │   │   ├── dementia-memory/
│   │   │   ├── eating-body-image/
│   │   │   ├── mood-depression/
│   │   │   ├── obsessive-compulsive/
│   │   │   ├── personality-disorders/
│   │   │   ├── psychotic-disorders/
│   │   │   ├── substance-use-disorders/
│   │   │   ├── trauma-stress/
│   │   │   └── other/           # Subcategories (nested further)
│   │   ├── loading.tsx          # Loading state
│   │   ├── error.tsx            # Error boundary
│   │   └── (metadata)
│   │
│   ├── treatments/              # Treatments section (mirror conditions structure)
│   │   ├── page.tsx
│   │   ├── [slug]/
│   │   ├── medications/
│   │   ├── therapy/
│   │   ├── interventional/
│   │   ├── investigational/
│   │   ├── alternative/
│   │   ├── supplements/
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── resources/               # Resources section
│   │   ├── page.tsx             # Resources hub
│   │   ├── [slug]/              # Dynamic resource detail
│   │   ├── assessments-screeners/    # Clinical assessment tools
│   │   ├── crisis-helplines/         # Crisis resources
│   │   ├── digital-tools/            # Mental health apps
│   │   ├── education-guides/         # Educational content
│   │   ├── articles-blogs/           # Articles and blogs
│   │   ├── support-community/        # Support groups & communities
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── providers/               # Provider directory
│   │   ├── page.tsx             # Provider search/listing
│   │   ├── [slug]/              # Provider detail page
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── debug/                   # Development debugging page
│   │   ├── page.tsx
│   │   └── debug-component.tsx
│   │
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page with navigation tiles
│   ├── globals.css              # Global styles (Tailwind imports)
│   ├── error.tsx                # Global error boundary
│   ├── loading.tsx              # Global loading state
│   └── not-found.tsx            # 404 page
│
├── components/                  # React components (organized by type)
│   ├── blocks/                  # Feature blocks (larger, page-level components)
│   │   ├── treatment-card/      # Card component for single treatment
│   │   ├── treatment-grid/      # Grid layout for treatments
│   │   ├── provider-card/       # Card for provider
│   │   ├── comparison-table/    # Treatment comparison table
│   │   ├── articles-blogs-hub/  # Articles section display
│   │   ├── digital-tools-hub/   # Digital tools display
│   │   ├── crisis-helplines-hub/
│   │   ├── education-guides-hub/
│   │   ├── support-community-hub/
│   │   └── index.tsx            # Re-exports all blocks
│   │
│   ├── layout/                  # Layout components (persistent across pages)
│   │   ├── header.tsx           # Navigation header
│   │   ├── footer.tsx           # Footer with links and info
│   │   └── main-layout.tsx      # Main layout wrapper
│   │
│   ├── resource-renderers/      # Resource display components (type-specific)
│   │   ├── ArticleRenderer.tsx      # Display articles
│   │   ├── AssessmentRenderer.tsx   # Display assessments (with interactive UI)
│   │   ├── CrisisRenderer.tsx       # Crisis resources
│   │   ├── DigitalToolRenderer.tsx  # App/tool recommendations
│   │   ├── EducationRenderer.tsx    # Educational guides
│   │   ├── SupportRenderer.tsx      # Support communities
│   │   ├── GenericRenderer.tsx      # Fallback generic renderer
│   │   ├── shared/                  # Shared rendering utilities
│   │   │   └── index.tsx            # Link, button, and formatting helpers
│   │   └── index.ts                 # Renderer factory/registry
│   │
│   ├── ui/                      # Low-level UI components (shadcn-like)
│   │   ├── button.tsx           # Button component
│   │   ├── card.tsx             # Card wrapper
│   │   ├── badge.tsx            # Badge/tag component
│   │   ├── input.tsx            # Input field
│   │   ├── parsed-content.tsx   # Markdown/rich content renderer
│   │   └── index.ts             # Component exports
│   │
│   ├── providers/               # Context/Provider components
│   │   └── query-provider.tsx   # React Query provider setup
│   │
│   └── README.md                # Component usage documentation

├── lib/                         # Utilities, hooks, and shared logic
│   │
│   ├── config/                  # Configuration files
│   │   ├── site.ts              # Site metadata, navigation, feature flags
│   │   ├── database.ts          # Supabase client initialization
│   │   ├── treatments.ts        # Treatment type mappings/config
│   │   ├── comparison-metrics.ts # Treatment comparison metrics
│   │   ├── animations.ts        # Animation duration constants
│   │   └── README.md            # Configuration guide
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── database.ts          # DB schema types (Entity, Collection, Schema)
│   │   ├── resource.ts          # Resource type definitions
│   │   ├── nppes-provider.ts    # NPPES provider data types
│   │   └── README.md            # Type documentation
│   │
│   ├── data/                    # Data access and normalization
│   │   ├── entity-service.ts    # Main data service (Supabase + FS queries)
│   │   ├── resource-normalizer.ts # Resource data normalization
│   │   └── README.md            # Data layer documentation
│   │
│   ├── hooks/                   # React hooks
│   │   ├── use-entities.ts      # Main hook for fetching entities (custom + React Query)
│   │   ├── use-resource.ts      # Hook for single resource fetching
│   │   └── README.md            # Hooks documentation
│   │
│   ├── schemas/                 # Zod validation schemas
│   │   ├── resource.ts          # Resource data schema validation
│   │   ├── support-resource.ts  # Support resource schema
│   │   └── README.md            # Schema documentation
│   │
│   ├── stores/                  # Zustand state management
│   │   └── comparison-store.ts  # Treatment comparison store
│   │
│   ├── utils/                   # Utility functions
│   │   ├── cn.ts                # classname merge utility (clsx + tailwind-merge)
│   │   ├── format.ts            # Text/number/date formatting
│   │   ├── link-parser.ts       # Link and URL parsing
│   │   ├── seo.ts               # SEO utilities (metadata generation)
│   │   ├── component-variants.ts # CVA variant definitions for components
│   │   ├── category-manager.ts  # [UNUSED] Category discovery (dead code)
│   │   └── README.md            # Utils documentation
│   │
│   └── assessments/             # [SPECIALIZED] Assessment engines
│       ├── engines.ts           # Assessment engine registry
│       ├── engines/
│       │   ├── asrs-custom.ts   # ADHD screener (ASRS v1.1)
│       │   ├── assist-who-v3.ts # Substance abuse assessment
│       │   └── sum-with-bands.ts # Generic scoring engine
│       └── README.md            # Assessment documentation
```

### Data Structure (`data/`)

```
data/
├── conditions/                  # Mental health conditions (DSM-5 organized)
│   ├── anxiety-fear/            # 10 conditions
│   ├── attention-learning/      # 6 conditions
│   ├── autism-development/      # 5 conditions
│   ├── behavioral-disorders/    # 8 conditions
│   ├── dementia-memory/         # 2 conditions
│   ├── eating-body-image/       # 6 conditions
│   ├── mood-depression/         # 11 conditions
│   ├── obsessive-compulsive/    # 7 conditions
│   ├── personality-disorders/   # 11 conditions
│   ├── psychotic-disorders/     # 9 conditions
│   ├── substance-use-disorders/ # 11 conditions
│   ├── trauma-stress/           # 4 conditions
│   └── other-conditions/        # Nested subcategories
│       ├── dissociative-disorders/  # 3 conditions
│       ├── elimination-disorders/   # 2 conditions
│       ├── gender-disorders/        # 1 condition
│       ├── paraphilic-disorders/    # 8 conditions
│       ├── sexual-disorders/        # 8 conditions
│       ├── sleep-disorders/         # 14 conditions
│       └── somatic-disorders/       # 4 conditions
│
├── treatments/                  # Mental health treatments (type-organized)
│   ├── medications/             # Pharmaceutical treatments
│   ├── therapy/                 # Psychotherapy approaches
│   ├── interventional/          # Brain stimulation, advanced procedures
│   ├── investigational/         # Emerging/experimental treatments
│   ├── alternative/             # Alternative/complementary approaches
│   └── supplements/             # Nutritional supplements
│
├── resources/                   # Educational and clinical resources
│   ├── assessments-screeners/   # Clinical assessment tools
│   │   ├── phq-9.json          # Depression screener
│   │   ├── gad-7.json          # Anxiety screener
│   │   ├── pcl-5.json          # PTSD assessment
│   │   ├── audit-c.json        # Alcohol use disorder
│   │   ├── dast-10.json        # Drug abuse screening
│   │   ├── asrs-v1-1.json      # ADHD screener
│   │   ├── mdq.json            # Bipolar screening
│   │   ├── epds.json           # Postpartum depression
│   │   ├── psqi.json           # Sleep quality
│   │   ├── isi.json            # Insomnia severity
│   │   ├── ham-d-17.json       # Hamilton depression
│   │   ├── ham-a.json          # Hamilton anxiety
│   │   └── [others]
│   │
│   ├── crisis-helplines/        # Crisis resources
│   │   ├── 988-suicide-crisis-lifeline.json
│   │   ├── crisis-text-line.json
│   │   └── veterans-crisis-line.json
│   │
│   ├── digital-tools/           # Mental health apps & tools
│   │   ├── headspace.json
│   │   ├── calm.json
│   │   └── daylio.json
│   │
│   ├── education-guides/        # How-to and educational content
│   │   ├── finding-a-therapist.json
│   │   ├── understanding-therapy-types.json
│   │   └── insurance-navigation.json
│   │
│   ├── articles-blogs/          # Articles and blog posts
│   │   ├── how-to/              # How-to articles
│   │   ├── latest/              # Current events/trends
│   │   └── research/            # Research summaries
│   │   └── lived-experience/    # Personal stories
│   │
│   ├── support-community/       # Support groups and communities
│   │   ├── communities/         # Condition-specific communities
│   │   │   ├── adhd-autism/
│   │   │   ├── anxiety-ocd/
│   │   │   ├── depression-mood/
│   │   │   ├── eating-disorders/
│   │   │   ├── schizophrenia-psychosis/
│   │   │   └── trauma-ptsd/
│   │   ├── crisis/              # Crisis support organizations
│   │   ├── faith-spirituality/  # Faith-based support
│   │   ├── family-caregivers/   # Caregiver support
│   │   ├── recovery/            # Addiction recovery programs
│   │   ├── grief-loss/          # Bereavement support
│   │   └── identity/            # Identity-specific communities
│   │       ├── cultural/
│   │       ├── lgbtq/
│   │       ├── family/
│   │       ├── seniors/
│   │       ├── veterans/
│   │       └── youth/
│   │
│   └── README.md                # Data schema and format guide
```

### Scripts Directory (`scripts/`)

```
scripts/
├── setup/                       # Initial setup scripts
│   └── create-schemas.js        # Database schema initialization
│
├── seed-*.js                    # Data seeding scripts (from JSON files)
│   ├── seed-conditions-from-files.js
│   ├── seed-treatments-from-files.js
│   ├── seed-resources-from-files.js
│   ├── seed-assessments-from-files.js
│   └── seed-support-resources.js
│
├── seed-*.js                    # Data seeding scripts (deprecated/legacy)
│   ├── seed-conditions.js       # DEPRECATED: Legacy seeding
│   ├── seed-treatments.js       # DEPRECATED: Legacy seeding
│   ├── seed-resources.js        # DEPRECATED: Legacy seeding
│   ├── seed-articles.js         # DEPRECATED: Legacy articles seeding
│   └── seed-providers.js        # Provider data seeding from NPPES
│
├── populate-*.js                # Data population scripts (deprecated)
│   ├── populate-articles.js
│   └── populate-support-resources.js
│
├── providers/                   # Provider management
│   ├── nppes-importer.ts        # NPPES data import utility
│   ├── update-providers.js      # Provider update/maintenance
│   └── run-nppes-import.ts      # NPPES import runner
│
├── utils/                       # Shared utilities for scripts
│   ├── db.js                    # Database connection setup
│   ├── file-reader.js           # JSON file reading utilities
│   ├── data-validator.js        # Data validation for seeding
│   └── schema-manager.js        # Schema management utilities
│
├── config/                      # Script configuration
│   └── schemas.config.js        # Schema definitions for validation
│
└── generate-file-structure.mjs  # File structure documentation generator
```

### Root Configuration Files

```
✓ package.json                   # Dependencies (Next.js 15, React 19, etc.)
✓ package-lock.json              # Lockfile (npm)
✓ tsconfig.json                  # TypeScript compiler options
✓ next.config.ts                 # Next.js configuration (ESLint disabled)
✓ eslint.config.mjs              # ESLint rules (warnings for migration)
✓ tailwind.config.js             # Tailwind CSS v4 theme and config
✓ postcss.config.mjs             # PostCSS with Tailwind support
✓ .env.local                     # Environment variables (not in git)
✓ .gitignore                     # Git exclusions
✓ README.md                       # Project README
✓ RESOURCES_QUICK_START.md       # Resource management guide
✓ RESOURCES_IMPLEMENTATION.md    # Detailed resource implementation
```

### Public Assets (`public/`)

```
public/
├── animations/                  # Animation SVG assets
├── images/                      # Image assets
│   └── [various UI images]
├── file.svg
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

### Untracked/Unused Directories

```
content/                        # EMPTY - Legacy content directory (unused)
├── conditions/                 # No files
└── treatments/                 # No files

files/                          # EMPTY - Unused directory
Crisis/                         # EMPTY - Orphaned directory
```

---

## ARCHITECTURE & DEPENDENCIES

### Dependency Graph

```
Core Dependencies:
├── next@15.4.6                # Framework
├── react@19.1.0               # UI library
├── typescript@5               # Type checking
├── @supabase/supabase-js      # Database
├── @tanstack/react-query      # Data fetching
├── zod@4.0.15                 # Validation
├── zustand@5.0.7              # State management
├── framer-motion              # Animations
├── tailwindcss@4              # Styling
└── lucide-react               # Icons

UI Component Libraries:
├── @radix-ui/react-*          # Primitives (8 packages)
├── class-variance-authority   # Component variants
├── tailwind-merge             # Utility merging
└── tailwindcss-animate        # Animations

Development:
├── eslint & prettier          # Code quality
├── ts-node & tsx              # TypeScript execution
└── csv-parser                 # Data import

Notable Absences:
✗ No ORM (direct DB queries)
✗ No GraphQL (REST API only)
✗ No testing framework (Jest/Vitest absent)
✗ No static site generation (ISR not used)
```

### Import Path Aliases

```typescript
@/*  -> ./src/*     // Configured in tsconfig.json
```

### Key Integration Points

**1. Supabase Database**
- Configured in: `src/lib/config/database.ts`
- Used by: `EntityService`, hooks, API routes
- Tables: entities, schemas, collections (standard schema pattern)
- Auth: Service role key for admin operations

**2. React Query**
- Entry point: `src/components/providers/query-provider.tsx`
- Hooks: `src/lib/hooks/use-entities.ts`, `use-resource.ts`
- Query keys: Structured with entity type + slug pattern

**3. Zustand Store**
- Location: `src/lib/stores/comparison-store.ts`
- Purpose: Treatment comparison selection state
- Usage: Comparison table component

**4. API Routes**
- Dynamic treatments: `/api/treatments/[slug]` - File-based lookup
- Provider search: `/api/providers/search` - Database query

---

## CORE SYSTEMS

### 1. Entity System (Type-Safe Data Management)

**Purpose**: Unified data model for conditions, treatments, resources, providers

**Key Types** (`src/lib/types/database.ts`):
- `Entity` - Full database entity with schema metadata
- `MappedEntity<T>` - Type-safe UI entity with generic data payload
- `EntityType` - Union of all entity types
- `SchemaName` - Schema identifier mapping

**Flow**:
```
Data Files (JSON) → EntityService → React Query → Components
Database (Supabase) → EntityService → React Query → Components
```

**Entity Service** (`src/lib/data/entity-service.ts`):
- Fetches from Supabase tables
- File-system fallback for JSON data (server-side only)
- Schema mapping and type coercion
- Category → SchemaName conversion

**Hooks** (`src/lib/hooks/use-entities.ts`):
- `useConditionsByCategory(category)` - Fetch conditions
- `useMedications()`, `useTherapyTreatments()`, etc. - Typed hooks
- `useResources()` - Multi-type resource fetching
- Uses React Query with proper key management

### 2. Routing & Navigation

**Next.js 15 App Router Structure**:
- Root layout wraps QueryProvider and MainLayout
- Route groups `(legal)` organize related pages
- Dynamic routes: `[slug]` for entity details
- Nested categories: `/conditions/[category]/` with subcategories
- API routes: File-system routing

**Page Types**:
1. **Hub Pages**: `/conditions`, `/treatments`, `/resources` - Show all items
2. **Category Pages**: `/conditions/anxiety-fear` - Show category items
3. **Detail Pages**: `/conditions/[slug]`, `/treatments/[slug]` - Show single entity
4. **Listing Pages**: `/resources/assessments-screeners` - Category-specific listings

**Loading & Error Handling**:
- `loading.tsx` files for suspense boundaries
- `error.tsx` files for error boundaries
- Global `error.tsx` and `not-found.tsx`

### 3. Styling System

**Design System**: Apple-inspired minimalist approach

**Stack**:
- Tailwind CSS v4 with custom color system
- Component variants via CVA (`src/lib/utils/component-variants.ts`)
- Custom themes in `tailwind.config.js`
- Global styles via CSS in `src/app/globals.css`

**Color System**:
```
Primary: Blue (#3b82f6 → #1e40af)
Treatment Colors:
  - Medication: Blue (#3b82f6)
  - Supplement: Green (#10b981)
  - Intervention: Purple (#8b5cf6)
  - Therapy: Amber (#f59e0b)
Status: Green (success), Red (error), Amber (warning), Cyan (info)
```

### 4. Data Validation & Normalization

**Zod Schemas** (`src/lib/schemas/`):
- `resource.ts` - Complex resource validation
- `support-resource.ts` - Support community validation
- Ensures data consistency during seeding

**Data Normalizers** (`src/lib/data/resource-normalizer.ts`):
- Converts raw data to display format
- Handles missing fields gracefully
- Normalizes links and metadata

### 5. Resource Rendering System

**Problem**: Different resource types need different display logic

**Solution**: Type-specific renderers

**Registry** (`src/components/resource-renderers/index.ts`):
```typescript
export const resourceRenderers = {
  'articles-blogs': ArticleRenderer,
  'assessments-screeners': AssessmentRenderer,
  'crisis-helplines': CrisisRenderer,
  // ... etc
}
```

**Renderer Components**:
- `ArticleRenderer.tsx` - Blog/article display
- `AssessmentRenderer.tsx` - Interactive assessment tool
- `CrisisRenderer.tsx` - Crisis resource formatting
- `DigitalToolRenderer.tsx` - App recommendations
- `EducationRenderer.tsx` - Guide display
- `SupportRenderer.tsx` - Community formatting
- `GenericRenderer.tsx` - Fallback for unknown types

**Shared Utilities** (`shared/index.tsx`):
- Link parser and button generator
- Content formatter for rich text
- Icon mapping

---

## ROUTE STRUCTURE & PAGES

### Main Routes

| Route | Type | Component | Purpose |
|-------|------|-----------|---------|
| `/` | Static | `page.tsx` | Home page with navigation tiles |
| `/conditions` | Static | `page.tsx` | Conditions hub/listing |
| `/conditions/[slug]` | Dynamic | `page.tsx` | Single condition detail |
| `/conditions/[category]` | Static | `page.tsx` | Category listing (12 categories) |
| `/conditions/other/[subcategory]` | Static | `page.tsx` | Nested subcategories |
| `/treatments` | Static | `page.tsx` | Treatments hub |
| `/treatments/[slug]` | Dynamic | `page.tsx` | Single treatment detail |
| `/treatments/[type]` | Static | `page.tsx` | Treatment type listings (6 types) |
| `/resources` | Static | `page.tsx` | Resources hub |
| `/resources/[slug]` | Dynamic | `page.tsx` | Single resource detail |
| `/resources/[category]` | Static | `page.tsx` | Resource category listings (6 categories) |
| `/psychiatrists` | Static | `page.tsx` | Provider search |
| `/psychiatrists/[slug]` | Dynamic | `page.tsx` | Single provider detail |
| `/about` | Static | `page.tsx` | About page |
| `/privacy` | Static | `page.tsx` | Privacy policy |
| `/terms` | Static | `page.tsx` | Terms of service |
| `/debug` | Dev | `page.tsx` | Development debug page |
| `/api/treatments/[slug]` | API | `route.ts` | Fetch single treatment |
| `/api/providers/search` | API | `route.ts` | Search providers |

### Route Group: `(legal)`

Organizes legal/policy pages with shared layout:
- `/about` - About page
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### Dynamic Routes

**Page Generation**:
- `[slug]` routes use `generateStaticParams()` for static generation
- Built at compile time from Supabase/JSON data
- Supports ISR (incremental static regeneration)

**Category Organization**:
```
/conditions/
├── anxiety-fear
├── attention-learning
├── autism-development
├── behavioral-disorders
├── dementia-memory
├── eating-body-image
├── mood-depression
├── obsessive-compulsive
├── personality-disorders
├── psychotic-disorders
├── substance-use-disorders
├── trauma-stress
└── other/ (nested subcategories)
    ├── dissociative-disorders
    ├── elimination-disorders
    ├── gender-disorders
    ├── paraphilic-disorders
    ├── sexual-disorders
    ├── sleep-disorders
    └── somatic-disorders

/treatments/
├── medications
├── therapy
├── interventional
├── investigational
├── alternative
└── supplements
```

---

## DATA & STORAGE

### Data Flow Architecture

```
Data Sources:
├── Static JSON Files (data/*) ──┐
└── Supabase Database ──────────┤
                                 ↓
                          EntityService
                                 ↓
                          React Query Cache
                                 ↓
                          React Components
```

### JSON Data Files

**Structure**:
```json
{
  "kind": "resource|treatment|condition",
  "slug": "unique-identifier",
  "name": "Display Name",
  "description": "Long-form description",
  "metadata": { "category": "path/to/category" },
  "tags": ["tag1", "tag2"],
  "content": { /* type-specific fields */ },
  "data": { /* extended fields */ }
}
```

**Data Categories**:

1. **Conditions** (164 total)
   - Fields: name, slug, description, prevalence, onset, symptoms, risk_factors, treatments
   - Organized by DSM-5 category
   - ~10-20 JSON files per category

2. **Treatments** (50+ total)
   - Fields: name, slug, type, summary, description, effectiveness, side_effects, cost
   - Organized by treatment type (medication, therapy, interventional, etc.)
   - Rich metadata for comparison

3. **Resources** (300+ total)
   - Sub-types:
     - Assessments (20+) - Clinical screening tools
     - Crisis Resources (11) - Emergency helplines
     - Digital Tools (3) - Mental health apps
     - Education Guides (3) - How-to content
     - Articles (13) - Blog posts and news
     - Support Communities (150+) - Support groups and forums

### Seeding System

**Process**:
1. JSON files placed in `data/[type]/[category]/`
2. Run seed script: `npm run seed:conditions` etc.
3. Scripts read JSON, validate with Zod, upsert to Supabase

**Scripts**:
- `seed-conditions-from-files.js` - Conditions
- `seed-treatments-from-files.js` - Treatments
- `seed-resources-from-files.js` - Resources
- `seed-assessments-from-files.js` - Assessment tools
- `seed-support-resources.js` - Support communities
- `seed-providers.js` - NPPES provider data

**Validation**:
- Zod schemas enforce required fields
- `data-validator.js` checks consistency
- Logging for missing/invalid data

### Database Schema (Supabase)

**Tables** (inferred from EntityService):
```
entities
├── id (UUID)
├── schema_id (FK)
├── slug (TEXT, unique)
├── name (TEXT)
├── title (TEXT)
├── description (TEXT)
├── type (TEXT)
├── content (JSONB)
├── data (JSONB)
├── metadata (JSONB)
├── status (VARCHAR: active|draft|archived)
├── visibility (VARCHAR: public|admin|research)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)

schemas
├── id (UUID)
├── entity_type (TEXT)
├── schema_name (TEXT)
├── display_name (TEXT)
├── icon (TEXT)
├── color (TEXT)
├── field_definitions (JSONB)
├── ui_config (JSONB)
├── validation_rules (JSONB)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)

collections
├── id (UUID)
├── name (TEXT)
├── slug (TEXT)
├── collection_type (TEXT)
├── icon (TEXT)
├── color (TEXT)
├── description (TEXT)
├── config (JSONB)
├── parent_id (UUID, FK)
├── created_at (TIMESTAMP)
```

---

## SCRIPTS & AUTOMATION

### Available Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Run ESLint

# Database & Seeding
npm run db:ensure          # Create database schemas
npm run seed:conditions    # Seed conditions from JSON
npm run seed:treatments    # Seed treatments from JSON
npm run seed:resources     # Seed resources from JSON
npm run seed:assessments   # Seed assessment tools
npm run seed:providers     # Seed NPPES providers
npm run seed:all           # Run all seeds in order
npm run seed               # Full setup: db:ensure + all seeds

# Provider Management
npm run seed-small         # Seed 25 providers (testing)
npm run seed-large         # Seed 500 providers
npm run import-nppes       # Import NPPES data (ts-node)
npm run import-nppes-sample # Import 1000 NPPES records
npm run update-providers   # Update provider database
npm run cleanup-providers  # Clean provider data
npm run provider-stats     # Show provider statistics
npm run provider-maintenance # Full provider maintenance
```

### Script Organization

**Setup Scripts** (`scripts/setup/`):
- `create-schemas.js` - Initialize Supabase schemas

**Data Seeding** (`scripts/seed-*.js`):
- **From Files** (Recommended):
  - `seed-conditions-from-files.js` - Read data/conditions/*.json
  - `seed-treatments-from-files.js` - Read data/treatments/*.json
  - `seed-resources-from-files.js` - Read data/resources/*.json
  - `seed-assessments-from-files.js` - Read data/resources/assessments/*.json
  - `seed-support-resources.js` - Read support community files

- **Legacy** (Deprecated):
  - `seed-conditions.js` - Hardcoded conditions (no files)
  - `seed-treatments.js` - Hardcoded treatments
  - `seed-resources.js` - Hardcoded resources
  - `seed-articles.js` - Hardcoded articles

**Data Population** (`scripts/populate-*.js`):
- `populate-articles.js` - Deprecated article population
- `populate-support-resources.js` - Deprecated support seeding

**Provider Management** (`scripts/`):
- `nppes-importer.ts` - NPPES import utility
- `update-providers.js` - Provider maintenance
- `seed-providers.js` - Main provider seeding script

**Utilities** (`scripts/utils/`):
- `db.js` - Supabase client initialization
- `file-reader.js` - JSON file reading with recursion
- `data-validator.js` - Schema validation
- `schema-manager.js` - Schema CRUD operations

**Configuration**:
- `scripts/config/schemas.config.js` - Schema definitions

---

## ISSUES & RECOMMENDATIONS

### Critical Issues

#### 1. **Deprecated Seeding Scripts** (CLEANUP NEEDED)
- **Files**: `scripts/seed-*.js` (legacy), `scripts/populate-*.js`
- **Issue**: Multiple seeding approaches create confusion
- **Status**: Deprecated but still in use
- **Recommendation**:
  - Archive or remove legacy scripts
  - Use only `-from-files` variants
  - Document migration path in README

**Action Items**:
```bash
# Proposed cleanup
rm scripts/seed-conditions.js
rm scripts/seed-treatments.js
rm scripts/seed-resources.js
rm scripts/seed-articles.js
rm scripts/populate-*.js
```

#### 2. **Unused Utility (CategoryManager)**
- **Location**: `src/lib/utils/category-manager.ts`
- **Issue**: Exports are never imported anywhere in codebase
- **Evidence**: Grep shows only self-references (exports)
- **Recommendation**: Remove or document intended use

**Action Items**:
```bash
# Check if actually used
grep -r "getTreatmentCategories\|getConditionCategories" src --exclude-dir=utils
# Result: No matches (only self-references)

# Remove if confirmed unused
rm src/lib/utils/category-manager.ts
```

#### 3. **Empty/Orphaned Directories**
- **Locations**:
  - `content/conditions` - Empty directory
  - `content/treatments` - Empty directory
  - `files/` - Empty directory
  - `Crisis/` - Empty directory

- **Recommendation**: Remove or document purpose

**Action Items**:
```bash
rm -rf content files Crisis
# OR document their intended purpose
```

#### 4. **Debug Page in Production**
- **Location**: `src/app/debug/page.tsx`
- **Issue**: Publicly accessible debugging interface
- **Recommendation**: 
  - Protect with authentication
  - Move to `(admin)` route group if auth added
  - Conditionally render based on environment

**Action Items**:
```typescript
// Conditional rendering by environment
if (process.env.NODE_ENV !== 'development') {
  return <AccessDeniedPage />
}
```

#### 5. **ESLint Configuration Warnings**
- **Location**: `eslint.config.mjs` and `next.config.ts`
- **Issue**: Multiple TODOs for downgrading rules to warnings
- **Evidence**: 
  - `@typescript-eslint/no-explicit-any`: warn
  - `@typescript-eslint/no-unused-vars`: warn
  - `eslint: ignoreDuringBuilds: true`

- **Recommendation**: Create issue tracking for TypeScript fixes
- **Migration Path**:
  1. Phase 1: Fix `any` types
  2. Phase 2: Fix unused variables
  3. Phase 3: Enable strict ESLint

#### 6. **Duplicate/Conflicting Resource Paths**
- **Issue**: Support community resources organized in multiple ways
- **Locations**:
  - `data/resources/support-community/communities/` - Condition-based
  - `data/resources/support-community/crisis/` - Crisis-specific
  - `data/resources/support-community/faith-spirituality/` - Identity-based
  - `data/resources/support-community/identity/` - Also identity-based

- **Observation**: `identity/` subsection duplicates some resources
- **Recommendation**: Consolidate structure or clarify taxonomy

**Example Duplicates**:
```
support-community/faith-spirituality/buddhist-recovery-network.json
support-community/identity/faith/buddhist-recovery.json
# Same resource, different locations?
```

### Moderate Issues

#### 7. **Resource Renderer Incomplete Coverage**
- **Issue**: Not all resource types may have proper renderers
- **Evidence**: `GenericRenderer.tsx` as fallback
- **Recommendation**: Document supported types, add missing renderers

**Action Items**:
```typescript
// Audit in resource-renderers/index.ts
const supportedTypes = Object.keys(resourceRenderers)
const allTypes = ['articles-blogs', 'assessments-screeners', ...]
const missing = allTypes.filter(t => !supportedTypes.includes(t))
```

#### 8. **Entity Service Server-Side Only Issue**
- **Location**: `src/lib/data/entity-service.ts`
- **Issue**: Imports `fs` and `path` with server-side check
- **Risk**: Bundle bloat if not tree-shaken properly
- **Recommendation**: Create separate server-only module

**Proposed Fix**:
```typescript
// entity-service.ts (remove fs imports)
// entity-service.server.ts (add fs imports, mark with "use server")
```

#### 9. **Assessment Engine Architecture**
- **Location**: `src/lib/assessments/engines/`
- **Issue**: Only 3 engines implemented, many assessments have no engine
- **Recommendation**:
  - Document assessment-to-engine mapping
  - Create generic scoring engine for simpler assessments
  - Add validation schemas for assessment inputs

#### 10. **API Route Error Handling**
- **Location**: `/api/treatments/[slug]/route.ts`
- **Issue**: Detailed error messages may leak file structure
- **Recommendation**: Sanitize production error responses

```typescript
// Current (too verbose in production)
return NextResponse.json({
  error: 'Treatment not found',
  available_categories: categories,
  suggestion: `Check if the file exists...`
}, { status: 404 })

// Recommended
const isDev = process.env.NODE_ENV === 'development'
return NextResponse.json({
  error: 'Treatment not found',
  ...(isDev && { available_categories: categories })
}, { status: 404 })
```

### Minor Issues & Observations

#### 11. **Inconsistent Import Styles**
- **Observation**: Mix of `import` and `import type` without consistent ordering
- **Recommendation**: Apply Prettier to enforce consistency

#### 12. **Missing Component Documentation**
- **Location**: `src/components/`
- **Issue**: No JSDoc or README explaining prop interfaces
- **Recommendation**: Add Storybook or component docs

#### 13. **Type Any Usage**
- **Evidence**: ESLint rule warns about `any` usage (downgraded to warn)
- **Recommendation**: Replace with proper types (see issue #5)

#### 14. **Provider Search Implementation**
- **Location**: `/api/providers/search`
- **Observation**: Route exists but search page shows no results
- **Recommendation**: 
  - Verify NPPES import successful
  - Document expected query parameters
  - Add example search usage

#### 15. **Feature Flags**
- **Location**: `src/lib/config/site.ts`
- **Observation**: Some flags disabled (showProviderDirectory: false)
- **Recommendation**: Document why disabled, add migration path

---

## DEPENDENCY USAGE SUMMARY

### Heavy Usage
| Module | Used By | Purpose |
|--------|---------|---------|
| React Query | 13+ files | Data fetching & caching |
| Supabase JS | 4+ files | Database access |
| TypeScript Types | 20+ files | Type safety |
| Tailwind CSS | All components | Styling |
| Zod | 2 files | Validation |
| Zustand | 1 file | State management |

### Unused/Minimal Usage
- `framer-motion` - Imported but rarely used (1 animation)
- `d3` - Installed but no imports found
- `recharts` - Installed but no usage found
- `csv-parser` - Only for admin scripts
- `p-limit` - Dependency but no direct usage

### Testing
- **Status**: No testing framework installed
- **Recommendation**: Consider adding Jest + React Testing Library

---

## RECOMMENDATIONS PRIORITY

### 🔴 HIGH PRIORITY
1. Remove deprecated seeding scripts
2. Clean up orphaned directories
3. Protect debug page from public access
4. Fix ESLint/TypeScript issues systematically

### 🟡 MEDIUM PRIORITY
5. Consolidate resource taxonomy
6. Document assessment engines
7. Audit resource renderers coverage
8. Add proper error handling to API routes

### 🟢 LOW PRIORITY
9. Add component documentation
10. Implement Storybook or component library docs
11. Investigate unused dependencies (d3, recharts)
12. Add test coverage

---

## CONCLUSION

The HeyPsych codebase is well-structured for a mental health education platform. The Next.js 15 App Router architecture, type-safe entity system, and comprehensive data organization provide a solid foundation. However, several cleanup tasks and architectural refinements would improve maintainability:

**Strengths**:
- Clear separation of concerns (data, components, utilities)
- Type-safe entity system with Zod validation
- Comprehensive data organization (289+ conditions, 50+ treatments)
- Proper use of React hooks and Query
- Tailwind CSS design system

**Weaknesses**:
- Deprecated code and scripts still present
- Empty/orphaned directories
- Some utility functions unused
- ESLint warnings not fully addressed
- Incomplete test coverage

**Next Steps**: 
1. Execute cleanup phase (remove deprecated code)
2. Document current state in wiki/docs
3. Establish coding standards (ESLint, TypeScript strictness)
4. Plan testing strategy
5. Consolidate resource taxonomy

