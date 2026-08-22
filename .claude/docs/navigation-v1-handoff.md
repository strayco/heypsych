# Navigation V1 Handoff Documentation

**Completion Date:** 2026-08-19
**Implementation Status:** Release 0 + Release 1 Complete

---

## Executive Summary

HeyPsych has been transformed from a PsychTrails-focused product into **Navigation V1**: a mental health navigation platform that helps users find conditions, treatments, tools, and care providers.

### Key Changes
- Homepage now features intent-based navigation (6 entry points)
- Primary navigation: Conditions | Treatments | Tools | Find Care | For Clinicians
- PsychTrails preserved but removed from homepage/primary nav
- OCD vertical slice demonstrates full navigation journey
- Feature flags enable rapid rollback

---

## Architecture Overview

### Domain Structure

```
src/domains/
├── navigation/
│   ├── types.ts      # NextStep, Audience, NavigationIntent types
│   ├── schema.ts     # Zod validation schemas
│   └── service.ts    # Converts catalog relationships to NextSteps
└── catalog/
    ├── types.ts      # CatalogRelationship type
    ├── schema.ts     # Zod validation schemas
    └── repository.ts # Loads relationships from JSON files
```

### Data Flow

```
JSON Files (data/relationships/*.json)
    ↓
Catalog Repository (caches parsed JSON)
    ↓
Navigation Service (transforms to NextSteps)
    ↓
Server Component (fetches on server)
    ↓
Client Component (renders with interactivity)
```

---

## Feature Flags

Located in `src/lib/config/feature-flags.ts`:

| Flag | Default | Purpose |
|------|---------|---------|
| `navigationV1Enabled` | `true` | Enable Navigation V1 homepage and nav |
| `ocdJourneyEnabled` | `true` | Enable OCD vertical slice features |
| `psychtrailsPublicDiscovery` | `false` | Show PsychTrails in navigation/homepage |
| `contextualNextSteps` | `true` | Enable next-steps on condition pages |
| `forCliniciansPage` | `true` | Enable /for-clinicians page |

### Rollback Procedure

Set environment variables to disable features:

```bash
NAVIGATION_V1_ENABLED=false
OCD_JOURNEY_ENABLED=false
CONTEXTUAL_NEXT_STEPS_ENABLED=false
```

---

## Key Files Modified

### Homepage
- `src/app/page.tsx` - Transformed from PsychTrails hero to Navigation V1

### Navigation Components
- `src/components/navigation/IntentGrid.tsx` - Intent-based entry points
- `src/components/navigation/NextStepCard.tsx` - Contextual next step card
- `src/components/navigation/NextStepsSection.tsx` - Section with multiple cards
- `src/components/navigation/index.ts` - Barrel export

### Configuration
- `src/lib/config/site.ts` - Updated navigation array
- `src/components/layout/header.tsx` - Updated icons and navigation

### OCD Integration
- `src/app/conditions/[slug]/page.tsx` - Fetches next steps for OCD
- `src/app/conditions/[slug]/client-wrapper.tsx` - Renders NextStepsSection
- `data/relationships/obsessive-compulsive-disorder.json` - OCD relationships

### New Pages
- `src/app/for-clinicians/page.tsx` - Clinician resources landing page

### Analytics
- `src/lib/analytics/product-events.ts` - Added Navigation V1 events

---

## Test Coverage

### Unit Tests (54 passing)

Run with: `npm run test:unit`

- Feature flags tests: `src/lib/config/__tests__/feature-flags.test.ts`
- Navigation component tests: `src/components/navigation/__tests__/`
- Core utilities: `tests/unit/core-suite.test.ts`

### Test Setup

- `vitest.config.ts` - Configured with React plugin and jest-dom
- `tests/setup.ts` - Imports jest-dom matchers
- `tsconfig.test.json` - TypeScript config for tests

---

## Analytics Events

New events added for Navigation V1:

| Event | Trigger |
|-------|---------|
| `nav_intent_select` | Homepage intent card clicked |
| `nav_primary_click` | Primary navigation item clicked |
| `nav_next_step_click` | Contextual next step clicked |
| `nav_condition_view` | Condition page viewed |
| `nav_treatment_view` | Treatment page viewed |
| `nav_find_care_click` | Find Care action taken |
| `nav_search_submit` | Search performed |
| `nav_for_clinicians_click` | For Clinicians engagement |

---

## PsychTrails Status

PsychTrails has been **preserved but de-emphasized**:

- ✅ All routes remain accessible: `/psychtrails`, `/psychtrails/play/[scenarioId]`
- ✅ Code preserved in `src/lib/psychTrail/` and `src/components/psychTrail/`
- ✅ Not added to noindex (SEO preserved)
- ❌ Removed from homepage
- ❌ Removed from primary navigation
- ⚙️ Can be re-enabled via `ENABLE_PSYCHTRAILS_PUBLIC_DISCOVERY=true`

---

## Schema Safety

Destructive database operations in `scripts/setup/create-schemas.js` now require:

1. `--destructive` flag, OR
2. `ALLOW_DESTRUCTIVE_SCHEMA_SETUP=true` environment variable

Production databases additionally require `--i-know-this-is-production`.

---

## SEO Baseline

A baseline for SEO regression testing has been created at `tests/seo/baseline.json`.

Key preserved routes:
- `/` - Homepage
- `/conditions` - Conditions index
- `/conditions/[slug]` - Condition detail pages
- `/treatments` - Treatments index
- `/treatments/[slug]` - Treatment detail pages
- `/tools` - Tools index
- `/resources` - Resources index
- `/psychiatrists` - Find Care
- `/search` - Search (noindex)
- `/for-clinicians` - Clinician resources

---

## Extending the System

### Adding a New Condition Journey

1. Create relationships file: `data/relationships/[condition-slug].json`
2. Follow the schema in `src/domains/catalog/types.ts`
3. Next steps will automatically appear when feature flags permit

### Adding New Next Step Kinds

1. Add to `NextStepKind` type in `src/domains/navigation/types.ts`
2. Add icon mapping in `NextStepCard.tsx`
3. Add color mapping in `NextStepCard.tsx`

### Adding New Analytics Events

1. Add to `ProductEvent` type in `src/lib/analytics/product-events.ts`
2. Add to `EventProperties` interface if needed
3. Create convenience function

---

## Build Commands

```bash
# Type check
npm run typecheck

# Unit tests
npm run test:unit

# All tests (excluding PsychTrails-specific)
npm run test:core

# Development server
npm run dev

# Production build
npm run build
```

---

## Outstanding Items

The following were explicitly out of scope for this implementation:

- [ ] Patient accounts / auth
- [ ] Provider claiming
- [ ] Referrals / lead-gen
- [ ] Billing / subscriptions
- [ ] AI chat / copilot features
- [ ] Database migrations (use Supabase migrations for production)

---

## Contact

For questions about this implementation, refer to:
- This documentation
- The `.claude/` directory
- Inline code comments
