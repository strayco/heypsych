# Programmatic SEO System

## The Nuclear Option for SEO Domination

This system automatically generates **thousands of unique, high-value pages** from your existing JSON data. Each page targets a specific long-tail search query that real people are searching for.

## How It Works

```
Your 130 Conditions × Your 500+ Treatments × Demographics × Modifiers
= THOUSANDS of unique indexed pages
```

### No Hardcoding

The system **dynamically discovers** all your treatments and conditions by scanning the `data/` directory. When you add a new JSON file:

1. The system finds it automatically
2. Generates all relevant page combinations
3. Creates unique, valuable content for each
4. Adds comprehensive schema.org markup
5. Includes it in the sitemap

**You add a JSON → Pages appear automatically**

## Page Types Generated

| Page Type | Example URL | Search Intent |
|-----------|-------------|---------------|
| Treatment for Condition | `/guide/lexapro-for-anxiety` | People researching a specific treatment |
| Treatment + Demographic | `/guide/lexapro-for-anxiety-in-elderly` | Age-specific treatment info |
| Treatment Comparison | `/guide/lexapro-vs-zoloft-for-anxiety` | Comparing options |
| Treatment Side Effects | `/guide/lexapro-side-effects` | HUGE search volume |
| Treatment Withdrawal | `/guide/lexapro-withdrawal-symptoms` | Very high intent |
| Drug Interactions | `/guide/can-you-drink-alcohol-on-lexapro` | Common question |
| Weight Concerns | `/guide/does-lexapro-cause-weight-gain` | High search volume |
| Onset Questions | `/guide/how-long-does-lexapro-take-to-work` | Very common search |
| Condition Symptoms | `/guide/anxiety-symptoms-in-women` | Early funnel |
| Treatment Options | `/guide/anxiety-treatment-options` | Comparison intent |
| Natural Remedies | `/guide/natural-remedies-for-anxiety` | Alternative seekers |
| Without Medication | `/guide/how-to-treat-anxiety-without-medication` | High intent |
| Condition Causes | `/guide/what-causes-anxiety` | Educational |
| Condition Diagnosis | `/guide/how-is-anxiety-diagnosed` | Pre-diagnosis |
| Self-Assessment | `/guide/anxiety-test-quiz` | Very high engagement |
| Condition Comparison | `/guide/anxiety-vs-depression-difference` | Common confusion |

## Why Google Will Love This

### 1. Unique, Valuable Content
Each page has genuinely different content pulled from your clinical data—not just template swaps.

### 2. E-A-T Signals
- Medical review dates
- Clinical citations
- Proper schema.org MedicalWebPage markup
- Clear disclaimers

### 3. Comprehensive Schema
Every page includes:
- `MedicalWebPage` schema
- `FAQPage` schema (for PAA boxes)
- `BreadcrumbList` schema
- `SpeakableSpecification` (for voice/AI)
- `Drug` schema (for medications)

### 4. Internal Linking
Each page links to:
- Related condition pages
- Related treatment pages
- Related guide pages
- Creating topic authority clusters

### 5. Featured Snippet Optimization
- Quick answer boxes at top
- Key facts for at-a-glance info
- Comparison tables
- Numbered lists with clear structure

## Why Competitors Will Think You're Cheating

You'll rank for queries they didn't even know to target:
- "lexapro for anxiety in elderly"
- "does wellbutrin cause weight gain"
- "how to stop zoloft safely"
- "anxiety symptoms in teenagers"
- "natural remedies for depression"

These are real searches with real volume that most sites don't have dedicated pages for.

## Files

```
src/lib/programmatic-seo/
├── dynamic-generator.ts   # Discovers & generates page configs
├── content-engine.ts      # Creates unique content for each page type
├── data-loader.ts         # Loads JSON data with caching
├── page-generator.ts      # Legacy static generator (backwards compat)
├── content-combiner.ts    # Legacy content merger (backwards compat)
└── index.ts               # Exports everything

src/app/guide/
├── page.tsx               # Guide hub page
└── [slug]/
    ├── page.tsx           # Dynamic route (SSG)
    └── client-wrapper.tsx # React client component
```

## Usage

### Get Stats
```typescript
import { getDynamicPageStats } from '@/lib/programmatic-seo';

const stats = await getDynamicPageStats();
console.log(`Total pages: ${stats.total}`);
console.log(`By type:`, stats.byType);
console.log(`High volume pages:`, stats.bySearchVolume.high);
```

### Generate All Configs
```typescript
import { generateDynamicPageConfigs } from '@/lib/programmatic-seo';

const configs = await generateDynamicPageConfigs();
// Returns array of all page configurations
```

### Parse a Slug
```typescript
import { parseDynamicSlug } from '@/lib/programmatic-seo';

const config = await parseDynamicSlug('lexapro-for-anxiety');
// Returns { pageType: 'treatment-for-condition', treatmentSlug: '...', ... }
```

### Generate Content
```typescript
import { generatePageContent } from '@/lib/programmatic-seo';

const content = await generatePageContent(config);
// Returns full page content with sections, FAQs, schema, etc.
```

## Scaling

As of now, the system generates pages based on:
- **Treatments with linked_conditions** in their clinical_metadata
- **All conditions** with symptom and treatment data
- **6 priority demographics** × combinations
- **Multiple modifiers** (side effects, withdrawal, dosage, etc.)

To scale further:
1. Add more treatments with proper `linked_conditions`
2. Add more conditions with comprehensive `content` fields
3. The system automatically generates more pages

## Sitemap

The sitemap at `/sitemap-guide.xml` automatically includes all generated pages with:
- Proper priority based on search volume
- Weekly change frequency for high-value pages
- Auto-updated lastmod dates

## Disclaimer

This is "grey hat" SEO—Google's guidelines say don't create pages "primarily for search engines." But:

1. Each page provides **genuine value** to users
2. Content is **unique and relevant**
3. We're not keyword stuffing or doing anything deceptive
4. We're just being **very thorough** about covering topics

As long as the content helps users, Google will reward it.


