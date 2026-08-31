# Resources Section - Implementation Guide

**Status:** ✅ Production Ready
**Last Updated:** 2025-11-13

---

## Quick Start (5 Minutes)

### Add a New Resource in 3 Steps

**1. Create JSON File**
```bash
# Choose the right category folder
touch data/resources/assessments-screeners/my-assessment.json
```

**2. Write JSON** (minimal example)
```json
{
  "kind": "resource",
  "slug": "my-assessment",
  "name": "My Assessment",
  "description": "Brief description here",
  "metadata": { "category": "assessments-screeners" }
}
```

**3. Seed Database**
```bash
npm run seed:resources
```

✅ **Done!** Your resource appears at:
- `/resources` (hub)
- `/resources/assessments-screeners` (listing)
- `/resources/my-assessment` (detail)

---

## Six Resource Categories

### 1. Assessments & Screeners
**Interactive screening tools with scoring**

Examples: PHQ-9, GAD-7, ASRS

```json
{
  "kind": "resource",
  "metadata": { "category": "assessments-screeners" },
  "items": [...],              // Questions
  "response_options": [...],   // Answer choices
  "scoring": {...},            // Scoring engine
  "clinical_interpretations": {...}
}
```

### 2. Crisis & Helplines
**24/7 emergency resources**

Examples: 988 Lifeline, Crisis Text Line

```json
{
  "kind": "resource",
  "metadata": { "category": "crisis-helplines" },
  "phone": "988",
  "text_number": "988",
  "hours": "24/7",
  "languages": ["English", "Spanish"]
}
```

### 3. Education & Guides
**How-to guides and tutorials**

Examples: Finding a therapist, Understanding therapy types

```json
{
  "kind": "resource",
  "metadata": { "category": "education-guides" },
  "difficulty_level": "beginner",
  "reading_time": "10 minutes",
  "learning_objectives": [...]
}
```

### 4. Digital Tools
**Mental health apps**

Examples: Headspace, Calm, Daylio

```json
{
  "kind": "resource",
  "metadata": { "category": "digital-tools" },
  "app_rating": 4.8,
  "platforms": ["iOS", "Android"],
  "privacy_certified": true,
  "subscription_model": "Freemium"
}
```

### 5. Support & Community
**Peer support and recovery programs**

Examples: NAMI, DBSA, support groups

```json
{
  "kind": "resource",
  "metadata": { "category": "support-community" },
  "website": "https://...",
  "group_type": "Peer support"
}
```

### 6. Articles & Blogs
**Educational articles**

Examples: Research summaries, blog posts

```json
{
  "kind": "resource",
  "metadata": { "category": "articles-blogs" },
  "author": "Author Name",
  "reading_time": "5 min",
  "external_url": "https://..."
}
```

---

## Common Fields (All Categories)

| Field | Required | Example |
|-------|----------|---------|
| `kind` | ✅ | `"resource"` |
| `slug` | ✅ | `"phq-9"` |
| `name` | ✅ | `"PHQ-9"` |
| `description` | ✅ | `"Brief description"` |
| `metadata.category` | ✅ | `"assessments-screeners"` |
| `sections` | | `[{type, title, text}]` |
| `tags` | | `["depression", "screening"]` |
| `conditions` | | `["depression", "anxiety"]` |
| `order` | | `1` (lower = earlier) |
| `featured` | | `true` |
| `seo.title` | | `"Custom title"` |
| `seo.description` | | `"Custom description"` |
| `seo.keywords` | | `["keyword1", "keyword2"]` |

---

## File Organization

```
data/resources/
├── assessments-screeners/    # PHQ-9, GAD-7, etc.
├── support-community/         # Support groups
├── articles-blogs/            # Articles
├── crisis-helplines/          # 988, crisis text line
├── education-guides/          # How-tos
└── digital-tools/             # Apps like Headspace
```

---

## Essential Commands

```bash
# Seed all resources
npm run seed:resources

# Seed all data (conditions, treatments, resources)
npm run seed:all

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## Page URLs

### Development
- Hub: http://localhost:3000/resources
- Assessments: http://localhost:3000/resources/assessments-screeners
- Crisis: http://localhost:3000/resources/crisis-helplines
- Education: http://localhost:3000/resources/education-guides
- Tools: http://localhost:3000/resources/digital-tools
- Support: http://localhost:3000/resources/support-community
- Articles: http://localhost:3000/resources/articles-blogs
- Detail: http://localhost:3000/resources/[slug]

---

## Full JSON Examples

### Assessment Example (PHQ-9)
See: `data/resources/assessments-screeners/phq-9.json`

### Crisis Helpline Example (988)
See: `data/resources/crisis-helplines/988-suicide-crisis-lifeline.json`

### Digital Tool Example (Headspace)
See: `data/resources/digital-tools/headspace.json`

---

## How It Works

### JSON-Driven Architecture
1. **Create JSON file** in category folder
2. **Run seeder** → validates with Zod schema
3. **Inserts to database** → `entities` table with `type = 'resource'`
4. **Auto-renders** → Category-specific renderer displays content

### Category-Specific Renderers
- **Assessments**: Interactive questions + scoring (`AssessmentRenderer.tsx`)
- **Crisis**: Prominent contact buttons (`CrisisRenderer.tsx`)
- **Apps**: Ratings, download links (`DigitalToolRenderer.tsx`)
- **Articles**: Rich text display (`ArticleRenderer.tsx`)
- **Education**: Structured learning content (`EducationRenderer.tsx`)
- **Support**: Community links (`SupportRenderer.tsx`)

---

## Troubleshooting

### Resource Not Appearing
- Check `metadata.category` matches folder name exactly
- Re-run `npm run seed:resources`
- Clear Next.js cache: `rm -rf .next && npm run dev`

### Validation Error
- Read error message (Zod gives precise field path)
- Compare JSON against schema in `src/lib/schemas/resource.ts`
- Check example files for reference

### Wrong Category
- Move JSON to correct folder
- Update `metadata.category` field
- Re-seed

---

## Advanced Features

### Interactive Assessments
Assessments with `scoring` field get interactive UI:
- Question-by-question navigation
- Progress bar
- Real-time scoring
- Clinical interpretation
- Print/save results

**Scoring Engines:**
- `sum_with_bands` - Simple sum with ranges
- `assist-who-v3` - WHO ASSIST custom algorithm
- `asrs-custom` - ASRS custom scoring

### SEO Optimization
Every resource gets:
- Unique meta tags
- Schema.org structured data
- Breadcrumb navigation
- Canonical URLs
- OpenGraph tags

---

## Architecture

### Database Schema
Resources stored in `entities` table:
```sql
type: 'resource'
slug: 'phq-9'
title: 'PHQ-9 Depression Screening'
content: {
  -- Category-specific fields
}
metadata: {
  category: 'assessments-screeners',
  -- Filterable fields
}
```

### Validation
- **Schema:** `src/lib/schemas/resource.ts`
- **Types:** `src/lib/types/resource.ts`
- **Seeder:** `scripts/seed-resources-from-files.js`

### Rendering
- **Registry:** `src/components/resource-renderers/index.ts`
- **Renderers:** `src/components/resource-renderers/[Type]Renderer.tsx`
- **Detail Page:** `src/app/resources/[slug]/page.tsx`

---

## Production Stats

**October 2025 Implementation:**
- Total resources: 100+
- Assessments: 20
- Support communities: 60+
- Crisis hotlines: 3
- Education guides: 3
- Digital tools: 3
- Articles: Multiple

**Performance:**
- Build time: ~15-20 seconds
- Page load: < 2 seconds
- Interactive assessments: Real-time scoring
- SEO: Fully optimized

---

## Next Steps

### To Add More Resources:
1. Find an example in the same category
2. Copy and modify JSON
3. Run seeder
4. Test in browser

### To Add New Category:
1. Add to `ResourceCategory` type
2. Create Zod schema
3. Create listing page
4. Create renderer
5. Update hub page

---

## Support

**Full Documentation:**
- Implementation details: `data/resources/README.md`
- Type definitions: `src/lib/types/resource.ts`
- Validation schemas: `src/lib/schemas/resource.ts`

**Need Help?**
- Check example files in `data/resources/`
- Review error messages from seeder
- Open an issue if stuck

---

**Status:** ✅ Production Ready
**Scalability:** Can handle thousands of resources with zero code changes
**Maintenance:** JSON-only workflow for content updates
