# HeyPsych Resources — Content Drop Zones

This directory contains all mental health resources for the HeyPsych platform, organized by category. Resources are stored as JSON files that are automatically seeded into the database and rendered with category-specific UIs.

## 📁 Directory Structure

```
data/resources/
├── assessments-screeners/    # PHQ-9, GAD-7, and other validated screening tools
├── support-community/         # Support groups, crisis resources, recovery programs
├── articles-blogs/            # Curated articles, personal stories, expert commentary
├── crisis-helplines/          # 988, crisis text line, emergency hotlines
├── education-guides/          # How-tos for finding care, therapy types, insurance
└── digital-tools/             # Mental health apps, mood trackers, meditation apps
```

## 🎯 Six Resource Categories

### 1. **Assessments & Screeners** (`assessments-screeners`)
Validated screening tools with interactive scoring:
- Depression (PHQ-9, PHQ-A, EPDS)
- Anxiety (GAD-7, HAM-A, SCARED)
- ADHD (ASRS, Vanderbilt)
- Trauma (PCL-5)
- Substance use (ASSIST, AUDIT-C, DAST-10)
- And more...

### 2. **Support & Community** (`support-community`)
Peer support, communities, and groups:
- Condition-specific communities (DBSA, NAMI, CHADD)
- 12-step and alternative recovery programs
- Identity-based support (faith, family, LGBTQ+)
- Online forums and communities

### 3. **Articles & Blogs** (`articles-blogs`)
Long-form educational content:
- Expert commentary and research explainers
- Personal stories and lived experience
- Lifestyle and wellness guides
- Treatment deep-dives

### 4. **Crisis & Helplines** (`crisis-helplines`)
24/7 crisis support resources:
- 988 Suicide & Crisis Lifeline
- Crisis Text Line
- Veterans Crisis Line
- International helplines

### 5. **Education & Guides** (`education-guides`)
Practical how-tos:
- Finding a therapist
- Understanding therapy types (CBT, DBT, EMDR, etc.)
- Navigating insurance
- Mental health rights
- Treatment decision guides

### 6. **Digital Tools** (`digital-tools`)
Mental health apps and tools:
- Meditation apps (Headspace, Calm)
- Mood trackers (Daylio)
- Therapy apps
- Sleep tools
- Crisis apps

## 📝 Adding a New Resource

### Step 1: Choose the Right Category

Place your JSON file in the appropriate subfolder based on the resource type.

### Step 2: Create the JSON File

Use the examples below or see existing files in each category. **Required fields:**

```json
{
  "kind": "resource",
  "slug": "unique-url-friendly-slug",
  "name": "Display Name",
  "description": "Brief description (1-2 sentences)",
  "metadata": { "category": "category-name" }
}
```

### Step 3: Add Category-Specific Fields

Each category has its own schema. See [Field Reference](#field-reference) below.

### Step 4: Run the Seeder

```bash
npm run seed:resources
```

The seeder will:
- ✅ Validate your JSON against the Zod schema
- ✅ Auto-generate slugs if missing
- ✅ Upsert into Supabase (idempotent on slug)
- ✅ Show clear error messages for validation failures

## 📋 Field Reference

### Assessment Resources

```json
{
  "kind": "resource",
  "slug": "phq-9",
  "name": "PHQ-9",
  "full_name": "Patient Health Questionnaire-9",
  "description": "A 9-item depression screening tool",
  "metadata": { "category": "assessments-screeners" },

  "items": [
    {
      "id": "q1",
      "text": "Little interest or pleasure in doing things",
      "type": "likert_0_3",
      "alert": false
    }
  ],

  "response_options": [
    {"value": 0, "label": "Not at all"},
    {"value": 1, "label": "Several days"},
    {"value": 2, "label": "More than half the days"},
    {"value": 3, "label": "Nearly every day"}
  ],

  "scoring": {
    "engine": "sum_with_bands",
    "rules": {
      "total": {
        "items": ["q1", "q2", "..."],
        "method": "sum"
      },
      "severity": {
        "input": "total",
        "bands": {
          "0-4": "Minimal",
          "5-9": "Mild",
          "10-14": "Moderate"
        }
      }
    }
  },

  "clinical_interpretations": {
    "Minimal": "Your score indicates minimal depression symptoms...",
    "Mild": "Your score suggests mild depression..."
  },

  "validated": true,
  "free": true,
  "duration": "2-3 minutes",
  "age_range": "Adults (18+)",
  "conditions": ["depression"],

  "sections": [
    {
      "type": "about",
      "title": "About the PHQ-9",
      "text": "The PHQ-9 is a multipurpose instrument..."
    }
  ],

  "references": [
    {
      "title": "The PHQ-9: validity of a brief depression severity measure",
      "authors": "Kroenke K, Spitzer RL, Williams JB",
      "year": 2001,
      "doi": "10.1046/j.1525-1497.2001.016009606.x"
    }
  ],

  "seo": {
    "title": "PHQ-9 Depression Screening Tool",
    "description": "Complete PHQ-9 with scoring and interpretation",
    "keywords": ["PHQ-9", "depression screening"]
  }
}
```

### Crisis Helpline Resources

```json
{
  "kind": "resource",
  "slug": "988-suicide-crisis-lifeline",
  "name": "988 Suicide & Crisis Lifeline",
  "description": "24/7 free and confidential support",
  "metadata": { "category": "crisis-helplines" },

  "phone": "988",
  "text_number": "988",
  "hours": "24/7",
  "coverage_area": "United States",
  "languages": ["English", "Spanish"],
  "specialties": ["Suicide prevention", "Mental health crisis"],
  "website": "https://988lifeline.org",

  "sections": [
    {
      "type": "about",
      "title": "About 988",
      "text": "The 988 Lifeline offers 24/7 support..."
    }
  ],

  "free": true,
  "featured": true,
  "order": 1
}
```

### Education Guide Resources

```json
{
  "kind": "resource",
  "slug": "finding-a-therapist",
  "name": "How to Find a Therapist",
  "description": "Complete guide to finding the right provider",
  "metadata": { "category": "education-guides" },

  "difficulty_level": "beginner",
  "reading_time": "10-15 minutes",
  "format": "guide",
  "downloadable": true,

  "learning_objectives": [
    "Understand different types of mental health professionals",
    "Learn how to search for therapists",
    "Know what questions to ask"
  ],

  "sections": [
    {
      "type": "introduction",
      "title": "Why This Matters",
      "text": "Finding the right therapist..."
    }
  ],

  "related_topics": ["Types of therapy", "Insurance navigation"]
}
```

### Digital Tool Resources

```json
{
  "kind": "resource",
  "slug": "headspace",
  "name": "Headspace",
  "description": "Meditation and mindfulness app",
  "metadata": { "category": "digital-tools" },

  "category": "meditation",
  "app_rating": 4.8,
  "total_reviews": 1200000,

  "platforms": ["iOS", "Android", "Web"],
  "privacy_certified": true,
  "free": false,
  "subscription_model": "Freemium (free trial + paid subscription)",

  "app_store_url": "https://apps.apple.com/...",
  "website": "https://www.headspace.com",

  "system_requirements": "iOS 14.0+ or Android 7.0+",
  "offline_access": true,

  "conditions": ["stress", "anxiety", "insomnia"],

  "sections": [
    {
      "type": "features",
      "title": "Key Features",
      "text": "• Guided meditations\n• Sleep sounds\n• Focus music"
    }
  ]
}
```

## 🔧 Common Fields (All Categories)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | ✅ | Always "resource" |
| `slug` | string | ✅ | Unique URL-friendly identifier |
| `name` | string | ✅ | Display name |
| `description` | string | ✅ | 1-2 sentence summary |
| `metadata.category` | string | ✅ | One of 6 categories |
| `sections` | array | | Content blocks with type, title, text |
| `tags` | array | | Searchable tags |
| `conditions` | array | | Related mental health conditions |
| `target_populations` | array | | Who this is for |
| `order` | number | | Display order (lower = earlier) |
| `featured` | boolean | | Show in featured section |
| `seo.title` | string | | Custom page title |
| `seo.description` | string | | Custom meta description |
| `seo.keywords` | array | | SEO keywords |

## ⚙️ Developer Workflows

### Create a New Resource Programmatically

```bash
# Future: scaffolder script
npm run make:resource -- --category assessment --name "GAD-7"
```

### Validate Without Seeding

```bash
node scripts/utils/validate-resources.js
```

### Seed a Single File

```bash
npm run seed:resources -- data/resources/assessments-screeners/phq-9.json
```

### Export Schema for External Tools

```bash
node scripts/utils/export-schema.js
```

## 🎨 Design Patterns

### Sections Format

Use `sections` array for structured content blocks:

```json
"sections": [
  {
    "type": "about",
    "title": "About This Resource",
    "text": "Full markdown-supported text..."
  },
  {
    "type": "how-to-use",
    "title": "How to Use",
    "text": "Step-by-step instructions..."
  }
]
```

Common section types:
- `about` — Overview/introduction
- `instructions` — Usage instructions
- `how-it-works` — Mechanism explanation
- `when-to-call` / `when-to-use`
- `what-to-expect`
- `privacy` — Privacy/security info
- `cost` — Pricing details
- `features` — Feature list

### Conditional Fields

Some fields trigger special UI:
- `alert: true` on assessment items → Shows warning UI
- `downloadable: true` → Shows PDF download button
- `privacy_certified: true` → Shows privacy badge
- `free: true` → Shows "Free" badge
- `featured: true` → Appears in featured section

## 🚫 What NOT to Include

- ❌ Personal health information
- ❌ Medical advice or diagnosis
- ❌ Unvalidated/non-evidence-based tools
- ❌ Commercial promotions (except in digital-tools with disclosure)
- ❌ Broken external links
- ❌ Copyrighted content without permission

## 📚 Examples

See these files for complete examples:
- **Assessment**: `assessments-screeners/phq-9.json`
- **Crisis**: `crisis-helplines/988-suicide-crisis-lifeline.json`
- **Guide**: `education-guides/finding-a-therapist.json`
- **App**: `digital-tools/headspace.json`

## 🐛 Troubleshooting

### "Validation failed" error
Check the exact field causing the error. Compare against schema in `src/lib/schemas/resource.ts`.

### Resource not appearing on site
1. Verify `status` is `"active"` (default)
2. Check `metadata.category` matches exactly
3. Re-run seeder: `npm run seed:resources`
4. Clear Next.js cache: `rm -rf .next && npm run dev`

### Slug collision
Slugs must be unique across all resources. Change your slug or the seeder will update the existing resource.

## 🤝 Contributing

Before adding resources:
1. Check if a similar resource already exists
2. Verify links are current and working
3. Follow the style guide for descriptions (clear, concise, neutral tone)
4. Test locally before committing

## 📖 Additional Documentation

- **Type definitions**: `src/lib/types/resource.ts`
- **Zod schemas**: `src/lib/schemas/resource.ts`
- **Seeding logic**: `scripts/seed-resources-from-files.js`
- **Renderers**: `src/components/resource-renderers/`

---

**Questions?** Open an issue or check the main [ARCHITECTURE.md](../../ARCHITECTURE.md)
