# Phase 3: High-Level Implementation Plan

**Objective:** Safe, SEO-preserving migration to new architecture

**Timeline:** 6-9 months (phased rollout with validation gates)

**Date:** December 2, 2025

---

## Executive Summary

This plan outlines a **6-phase, 9-month migration** from the current monolithic JSON architecture to the proposed three-layer system. Each phase has clear success criteria, SEO validation gates, and rollback procedures.

**Key Principles:**

1. **SEO First:** Every deployment validated for SEO parity before proceeding
2. **Incremental:** Small batches (50 files per week) with monitoring
3. **Reversible:** Rollback capability at every phase
4. **Validated:** Automated testing prevents regressions
5. **Transparent:** Daily dashboard tracks migration progress and SEO health

**Risk Mitigation:**

- ✅ **Zero Downtime:** Gradual migration with dual-format support
- ✅ **SEO Protection:** Automated parity validation blocks breaking changes
- ✅ **Rollback Ready:** Legacy loader maintained for 90 days post-migration
- ✅ **Monitored:** Real-time SEO dashboard tracks rankings, CTR, indexing

---

## Phase 1: Foundation & Validation (Weeks 1-4)

**Goal:** Build new system components without touching production.

### Week 1-2: Core Infrastructure

**Deliverables:**

1. **Design System Implementation**
   - File: `src/lib/design-system/tokens.ts`
   - Content: Centralized design tokens (colors, typography, spacing)
   - Testing: Type-safe token imports in all components
   - **Acceptance:** TypeScript compilation success, no hardcoded design values

2. **Section Registry Implementation**
   - File: `src/lib/rendering/section-registry.ts`
   - Content: Registry mapping section types to renderers
   - Renderers: QuoteCarousel, StatCard, AlertBanner, Timeline, Default
   - **Acceptance:** All renderers unit-tested, 100% code coverage

3. **Metadata Factory V2**
   - File: `src/lib/seo/metadata-factory-v2.ts`
   - Content: Auto-generation with explicit rules
   - **Acceptance:** Generates identical metadata for Xanax compared to V1

4. **Schema Factory V2**
   - File: `src/lib/seo/schema-factory-v2.ts`
   - Content: 100% auto-generated schemas, no custom overrides
   - **Acceptance:** Generates identical schema for Xanax compared to V1

**Testing:**
```bash
npm run test:metadata-factory-v2
npm run test:schema-factory-v2
npm run test:section-registry
```

**Success Criteria:**
- ✅ All unit tests passing
- ✅ Type-safe interfaces for all components
- ✅ No production code using new components yet (isolated development)

### Week 3: Validation Layer

**Deliverables:**

1. **Metadata Validator**
   - File: `src/lib/seo/validators/metadata-validator.ts`
   - Checks: Title length, description length, keyword count, canonical URL
   - **Acceptance:** Validates all 980 existing entities, reports issues

2. **Schema Validator**
   - File: `src/lib/seo/validators/schema-validator.ts`
   - Checks: Required fields, YMYL compliance, Google Rich Results Test
   - **Acceptance:** Validates all existing schemas, reports issues

3. **Consistency Validator**
   - File: `src/lib/seo/validators/consistency-validator.ts`
   - Checks: Schema matches content, metadata matches content
   - **Acceptance:** Detects mismatches in current data

**Testing:**
```bash
npm run seo:validate-all
```

**Expected Issues:**
- ~50 metadata warnings (titles too short/long)
- ~20 schema incompleteness issues (missing contraindications)
- ~30 consistency mismatches (schema ≠ content)

**Resolution:**
- Fix critical issues (blocking deployment)
- Document warnings (address in migration)

**Success Criteria:**
- ✅ All critical validation issues resolved
- ✅ Validators integrated into CI/CD pipeline
- ✅ No false positives (100% accurate detection)

### Week 4: CI/CD Integration

**Deliverables:**

1. **SEO Validation Workflow**
   - File: `.github/workflows/seo-validation.yml`
   - Triggers: PR to `data/entities/**`
   - Actions: Run metadata, schema, consistency validators
   - **Acceptance:** Blocks PR if validation fails

2. **Migration Tooling**
   - File: `scripts/migrate-to-v2.ts`
   - Function: Converts legacy JSON to V2 format
   - **Acceptance:** Migrates Xanax with 100% parity

3. **Parity Validation**
   - File: `scripts/validate-seo-parity.ts`
   - Function: Compares SEO outputs before/after migration
   - **Acceptance:** Detects any metadata/schema differences

**Testing:**
```bash
# Test migration
npm run migrate:v2 -- --dry-run data/treatments/medications/alprazolam-Xanax.json

# Test parity validation
npm run validate:parity -- alprazolam-Xanax
```

**Success Criteria:**
- ✅ CI blocks PRs with invalid SEO
- ✅ Migration script produces V2 JSON
- ✅ Parity validator confirms byte-for-byte metadata match

**Phase 1 Completion Gate:**
- [ ] All new components implemented and tested
- [ ] All validators passing on current data
- [ ] CI/CD integrated and enforcing quality gates
- [ ] Team trained on new tools

**Status Check:**
```
┌────────────────────────────────────────────────────┐
│ Phase 1 Status: ██████████████████░░ 90% Complete │
│                                                    │
│ ✅ Design System implemented                      │
│ ✅ Section Registry implemented                   │
│ ✅ Metadata/Schema Factory V2 implemented         │
│ ✅ Validators implemented                         │
│ ⏳ CI/CD integration in progress                  │
│ ⏹️ Migration tooling not started                  │
└────────────────────────────────────────────────────┘
```

---

## Phase 2: Pilot Migration - Xanax (Weeks 5-6)

**Goal:** Migrate Alprazolam/Xanax to V2 format, validate SEO parity.

### Week 5: Xanax Migration

**Steps:**

1. **Create V2 Content**
   ```bash
   # Run automated migration
   npm run migrate:v2 -- data/treatments/medications/alprazolam-Xanax.json

   # Output:
   # - data/entities/medications/alprazolam-xanax.json (300 lines)
   # - data/seo/overrides/medications/alprazolam-xanax.json (if needed)
   ```

2. **Manual Review**
   - Content team reviews V2 JSON (300 lines vs 1,070 lines)
   - Medical reviewer validates clinical data unchanged
   - SEO specialist validates overrides (if any)

3. **Automated Validation**
   ```bash
   npm run validate:parity -- alprazolam-xanax
   ```
   - Expected: `✅ 100% parity - metadata and schema identical`

4. **Visual Regression Testing**
   - Capture screenshots: before (legacy) and after (V2)
   - Compare pixel-by-pixel using Percy or Chromatic
   - **Acceptance:** <1% pixel difference (minor anti-aliasing allowed)

**Deliverables:**
- ✅ `alprazolam-xanax.json` (V2 format, 300 lines)
- ✅ Parity report (metadata + schema comparison)
- ✅ Visual regression report (screenshot diff)

### Week 6: Xanax Deployment & Monitoring

**Deployment:**

1. **Deploy to Staging**
   - Deploy V2 entity loader (supports both formats)
   - Deploy V2 metadata/schema factories (support both formats)
   - **Test:** Staging URL renders identically

2. **Deploy to Production**
   ```bash
   # Feature flag: Enable V2 for Xanax only
   NEXT_PUBLIC_V2_ENTITIES=["alprazolam-xanax"]

   # Deploy
   npm run deploy:production
   ```

3. **Monitoring (7 days)**
   - Daily SEO check: Rankings, CTR, impressions
   - Daily technical check: Schema validation, internal links
   - Daily user check: Page views, bounce rate, time on page

**Monitoring Dashboard:**
```
┌──────────────────────────────────────────────────────────────┐
│ Xanax Migration - Day 7 Status                               │
├──────────────────────────────────────────────────────────────┤
│ SEO Health: ✅ Stable                                        │
│ - Avg Position: 4.5 → 4.4 (▲ improved slightly)             │
│ - CTR: 14.3% → 14.5% (▲ improved)                           │
│ - Impressions: 12.3K → 12.5K (▲ stable)                     │
│ - Clicks: 1,760 → 1,813 (▲ stable)                          │
│                                                               │
│ Technical Health: ✅ Perfect                                 │
│ - Schema Valid: ✅ Passes Google Rich Results Test          │
│ - Internal Links: 52 links (was 52) ✅                      │
│ - Metadata Complete: ✅ 100%                                 │
│ - Load Time: 1.2s → 1.1s (▲ improved)                       │
│                                                               │
│ User Experience: ✅ Stable                                   │
│ - Page Views: 3,200 → 3,250 (▲ stable)                      │
│ - Bounce Rate: 42% → 41% (▲ improved)                       │
│ - Avg Time on Page: 3:15 → 3:20 (▲ stable)                  │
│                                                               │
│ Decision: ✅ PROCEED TO PHASE 3 (Batch Migration)           │
└──────────────────────────────────────────────────────────────┘
```

**Rollback Criteria (If Any of These):**
- ❌ Avg Position drops >2 positions
- ❌ CTR drops >5%
- ❌ Schema validation fails
- ❌ Page errors >0.1%

**Phase 2 Completion Gate:**
- [ ] Xanax migrated to V2 format
- [ ] SEO parity validated (100% match)
- [ ] 7-day monitoring shows stable/improved metrics
- [ ] No rollback criteria triggered

**Go/No-Go Decision:**
- **GO:** Proceed to batch migration (Phase 3)
- **NO-GO:** Investigate issues, fix, re-test

---

## Phase 3: Batch Migration - Medications (Weeks 7-16)

**Goal:** Migrate all 500+ medications to V2 format in batches of 50/week.

### Migration Strategy

**Batch Schedule:**
```
Week  7: Batch 1 (50 medications)   - Benzodiazepines group
Week  8: Batch 2 (50 medications)   - SSRIs group
Week  9: Batch 3 (50 medications)   - SNRIs group
Week 10: Batch 4 (50 medications)   - Atypical antipsychotics
Week 11: Batch 5 (50 medications)   - Mood stabilizers
Week 12: Batch 6 (50 medications)   - Stimulants
Week 13: Batch 7 (50 medications)   - Antipsychotics
Week 14: Batch 8 (50 medications)   - Tricyclics + MAOIs
Week 15: Batch 9 (50 medications)   - Anxiolytics
Week 16: Batch 10 (50 medications)  - Remaining medications
```

**Weekly Cycle:**

**Monday:** Migrate batch
```bash
npm run migrate:batch -- medications/batch-N.txt
# Output: 50 V2 JSON files + SEO overrides
```

**Tuesday:** Validate batch
```bash
npm run validate:batch -- medications/batch-N.txt
# Check: 100% parity for all 50 files
```

**Wednesday:** Deploy to staging
```bash
npm run deploy:staging
# Test: All 50 pages render identically
```

**Thursday:** Deploy to production
```bash
npm run deploy:production
# Monitor: Real-time SEO dashboard
```

**Friday-Sunday:** Monitor & adjust
- Track rankings for all 50 pages
- Identify any anomalies
- Rollback if needed (automatic)

**Monitoring Dashboard (Per Batch):**
```
┌──────────────────────────────────────────────────────────────┐
│ Batch 3 (SSRIs) - Status: Week 2 of 3                        │
├──────────────────────────────────────────────────────────────┤
│ Migrated: 50 / 50 (100%)                                     │
│ Parity Validated: ✅ 50 / 50 (100%)                          │
│                                                               │
│ SEO Health:                                                   │
│ - Rankings Improved: ▲ 12 pages                              │
│ - Rankings Stable: → 35 pages                                │
│ - Rankings Declined: ▼ 3 pages (investigating)              │
│ - Net Change: +9 (positive trend)                            │
│                                                               │
│ - Avg CTR: 13.8% → 14.1% (▲ +2.2%)                          │
│ - Total Impressions: 156K → 158K (▲ +1.3%)                  │
│ - Total Clicks: 21.5K → 22.3K (▲ +3.7%)                     │
│                                                               │
│ Technical Health:                                             │
│ - Schema Valid: ✅ 50 / 50 (100%)                            │
│ - Metadata Complete: ✅ 50 / 50 (100%)                       │
│ - Internal Links Avg: 48 links/page ✅                       │
│                                                               │
│ Issues:                                                       │
│ ⚠️  3 pages with CTR decline (sertraline-zoloft -2.1%)      │
│    Action: Investigating title optimization                   │
│                                                               │
│ Decision: ✅ PROCEED TO BATCH 4                              │
└──────────────────────────────────────────────────────────────┘
```

**Automated Rollback:**
```typescript
// Rollback trigger (automatic)
if (
  batch.avgPositionChange > 2.0 ||
  batch.ctrChange < -5.0 ||
  batch.schemaValidationRate < 100 ||
  batch.errorRate > 0.5
) {
  console.log('🔴 Rollback criteria met - reverting batch');
  revertBatch(batchId);
  notifyTeam('Batch rollback triggered', { reason, metrics });
}
```

**Phase 3 Completion Gate:**
- [ ] All 500+ medications migrated
- [ ] SEO parity maintained (avg position ±0.5)
- [ ] No unresolved rollbacks
- [ ] All technical health checks passing

---

## Phase 4: Expand to Other Content Types (Weeks 17-22)

**Goal:** Migrate therapies, interventional, alternative treatments.

### Week 17-18: Therapies Migration

**Scope:** 50+ therapy JSON files

**Adapter Required:**
- Therapy schema differs from medication schema
- Need TherapyMetadataGenerator (new)
- Need MedicalTherapySchema builder (existing, adapt)

**Process:**
```bash
# Implement therapy-specific generators
npm run implement:therapy-generators

# Migrate therapies
npm run migrate:batch -- therapies/all.txt

# Validate parity
npm run validate:batch -- therapies/all.txt

# Deploy
npm run deploy:production
```

**Monitoring:** Same as medications (7-day window per batch)

### Week 19-20: Interventional Treatments Migration

**Scope:** 30+ interventional treatment JSONs

**Process:** Same as therapies

### Week 21-22: Alternative & Supplements Migration

**Scope:** 180+ alternative/supplement JSONs

**Process:** Same as therapies, larger batches (100/week)

**Phase 4 Completion Gate:**
- [ ] All treatment types migrated
- [ ] Type-specific generators validated
- [ ] SEO parity maintained across all types

---

## Phase 5: Conditions & Resources (Weeks 23-28)

**Goal:** Migrate conditions and resource pages.

### Week 23-25: Conditions Migration

**Scope:** 140+ condition JSON files

**Adapter Required:**
- Condition schema different from treatment
- Need ConditionMetadataGenerator (existing, adapt to V2)
- Need MedicalConditionSchema builder (existing, adapt to V2)

**Unique Challenges:**
- Conditions have different section types (symptoms, causes, risk_factors)
- Need condition-specific section renderers

**Process:**
```bash
# Implement condition-specific components
npm run implement:condition-components

# Migrate conditions in batches of 25/week
npm run migrate:batch -- conditions/batch-1.txt

# Deploy & monitor
npm run deploy:production
```

**Monitoring Focus:**
- Condition pages often rank for high-volume terms
- Extra caution on top 20 ranking conditions
- 14-day monitoring window (longer than treatments)

### Week 26-28: Resources Migration

**Scope:** 60+ resource JSON files (assessments, guides, tools)

**Adapter Required:**
- Resources have varied schemas (MedicalRiskEstimator, Article, HowTo)
- Need flexible resource adapter

**Process:** Same as conditions

**Phase 5 Completion Gate:**
- [ ] All conditions migrated
- [ ] All resources migrated
- [ ] All schema types validated
- [ ] SEO parity maintained

---

## Phase 6: Cleanup & Optimization (Weeks 29-36)

**Goal:** Remove legacy code, optimize new system.

### Week 29-30: Legacy Code Removal

**Deprecated Code:**
- ❌ `EntityLoader` (legacy) → Remove
- ❌ `MetadataFactory` (V1) → Remove
- ❌ `SchemaFactory` (V1) → Remove
- ❌ Support for `visual_design`, `ui_hints`, `seo_extensions` fields → Remove

**Process:**
```bash
# Find all legacy imports
npm run find:legacy-imports

# Remove legacy code
npm run remove:legacy-code

# Update all imports to V2
npm run update:imports

# Test
npm run test:all
npm run build:production
```

**Testing:**
- Full regression test suite
- Visual regression tests
- SEO validation (all 980 pages)

### Week 31-32: Performance Optimization

**Optimizations:**

1. **Build Time:**
   - Current: 49 seconds
   - Target: <15 seconds
   - Method: Parallel JSON parsing, optimized imports

2. **Runtime Performance:**
   - Lazy-load section renderers
   - Code-split by entity type
   - Optimize metadata generation (memoization)

3. **Bundle Size:**
   - Remove unused design tokens
   - Tree-shake section registry
   - Optimize schema builders

**Measurements:**
```bash
npm run benchmark:build    # Before: 49s, After: 14s
npm run analyze:bundle     # Before: 450KB, After: 320KB
npm run lighthouse:all     # Before: 92, After: 97
```

### Week 33-34: Documentation

**Deliverables:**

1. **Developer Guide**
   - File: `docs/DEVELOPER_GUIDE.md`
   - Content: How to create new content, extend system, add content types

2. **Content Authoring Guide**
   - File: `docs/CONTENT_AUTHORING_GUIDE.md`
   - Content: JSON structure, section types, validation rules

3. **SEO Best Practices**
   - File: `docs/SEO_BEST_PRACTICES.md`
   - Content: When to use overrides, keyword strategies, schema requirements

4. **Architecture Documentation**
   - File: `docs/ARCHITECTURE.md`
   - Content: Three-layer design, data flow, extensibility

### Week 35-36: Training & Handoff

**Training Sessions:**

1. **Engineering Team (2 days)**
   - New architecture deep-dive
   - How to add content types
   - How to extend section renderers
   - How to debug SEO issues

2. **Content Team (1 day)**
   - New JSON format walkthrough
   - Validation tools usage
   - Common pitfalls and solutions

3. **SEO Team (1 day)**
   - Override system usage
   - When to override vs auto-generate
   - How to monitor SEO health

**Handoff:**
- Knowledge base articles published
- Support channels established (Slack, documentation)
- Point of contact for questions

**Phase 6 Completion Gate:**
- [ ] All legacy code removed
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Team trained

---

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HeyPsych Architecture Migration Timeline (36 weeks)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Phase 1: Foundation (Weeks 1-4)           ████                              │
│   ├─ Core Infrastructure                  ██                                │
│   ├─ Validation Layer                     █                                 │
│   └─ CI/CD Integration                    █                                 │
│                                                                              │
│ Phase 2: Pilot - Xanax (Weeks 5-6)        ██                                │
│   ├─ Migration                             █                                │
│   └─ Monitoring                            █                                │
│                                                                              │
│ Phase 3: Medications (Weeks 7-16)         ██████████                        │
│   ├─ Batch 1-5                             █████                            │
│   └─ Batch 6-10                            █████                            │
│                                                                              │
│ Phase 4: Other Treatments (Weeks 17-22)   ██████                            │
│   ├─ Therapies                             ██                               │
│   ├─ Interventional                        ██                               │
│   └─ Alternative/Supplements               ██                               │
│                                                                              │
│ Phase 5: Conditions/Resources (Weeks 23-28) ██████                          │
│   ├─ Conditions                            ███                              │
│   └─ Resources                             ███                              │
│                                                                              │
│ Phase 6: Cleanup (Weeks 29-36)            ████████                          │
│   ├─ Legacy Removal                        ██                               │
│   ├─ Optimization                          ██                               │
│   ├─ Documentation                         ██                               │
│   └─ Training                              ██                               │
│                                                                              │
│ Total Duration: 36 weeks (~9 months)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Critical Path:**
1. Phase 1 (Foundation) → Phase 2 (Pilot)
2. Phase 2 (Pilot) → Phase 3 (Medications) **[Go/No-Go Decision]**
3. Phase 3 (Medications) → Phase 4 (Other Treatments)
4. Phase 5 (Conditions/Resources) → Phase 6 (Cleanup)

**Parallel Workstreams:**
- Documentation can start in Week 20 (Phase 4)
- Training materials can start in Week 25 (Phase 5)
- Performance optimization can start in Week 15 (Phase 3)

---

## Resource Requirements

### Engineering Team

**Full-Time:**
- 1 Senior Engineer (Architecture Lead) - 36 weeks
- 2 Mid-Level Engineers (Implementation) - 36 weeks
- 1 QA Engineer (Testing & Validation) - 24 weeks

**Part-Time:**
- 1 DevOps Engineer (CI/CD) - 8 weeks (Weeks 1-4, 29-32)
- 1 Frontend Engineer (UI Components) - 12 weeks (Weeks 1-12)

**Total Engineering Effort:** ~120 person-weeks

### Content Team

**Part-Time:**
- 1 Senior Content Editor (Validation) - 20 weeks (Weeks 5-24)
- 1 Medical Reviewer (Clinical Validation) - 16 weeks (Weeks 5-20)

**Total Content Effort:** ~36 person-weeks

### SEO Team

**Part-Time:**
- 1 SEO Specialist (Validation & Monitoring) - 28 weeks (Weeks 5-32)

**Total SEO Effort:** ~28 person-weeks

**Total Project Effort:** ~184 person-weeks (~4.6 FTE for 9 months)

---

## Budget Estimate

**Engineering Costs:**
- Senior Engineer: 36 weeks × $2,500/week = $90,000
- Mid-Level Engineers: 2 × 36 weeks × $2,000/week = $144,000
- QA Engineer: 24 weeks × $1,800/week = $43,200
- DevOps Engineer: 8 weeks × $2,200/week = $17,600
- Frontend Engineer: 12 weeks × $2,000/week = $24,000

**Content Costs:**
- Senior Editor: 20 weeks × $1,500/week = $30,000
- Medical Reviewer: 16 weeks × $2,000/week = $32,000

**SEO Costs:**
- SEO Specialist: 28 weeks × $1,800/week = $50,400

**Tooling & Infrastructure:**
- Visual Regression Testing (Percy): $500/month × 9 = $4,500
- SEO Monitoring (Ahrefs/SEMrush): $500/month × 9 = $4,500
- CI/CD Compute (GitHub Actions): $300/month × 9 = $2,700

**Total Estimated Budget:** ~$443,000

**ROI Analysis:**
- Current annual maintenance: 2,000 hours × $100/hour = $200,000/year
- New annual maintenance: 800 hours × $100/hour = $80,000/year
- **Annual Savings:** $120,000/year
- **Payback Period:** 3.7 years

---

## Risk Register

### High-Impact Risks

**Risk 1: SEO Regression**
- **Impact:** Critical (business)
- **Probability:** Medium
- **Mitigation:**
  - Automated parity validation before every deployment
  - 7-day monitoring after each batch
  - Automatic rollback if rankings drop >2 positions
- **Contingency:** Rollback to legacy format, investigate root cause

**Risk 2: Team Bandwidth**
- **Impact:** High (timeline)
- **Probability:** Medium
- **Mitigation:**
  - Buffer weeks built into timeline (4 weeks)
  - Parallel workstreams to reduce critical path
  - External contractor support if needed
- **Contingency:** Extend timeline by 8 weeks (acceptable)

**Risk 3: Unexpected Schema Changes**
- **Impact:** High (technical)
- **Probability:** Low
- **Mitigation:**
  - Google Rich Results Test in CI
  - Schema.org validator in CI
  - Manual review of first 10 migrations per content type
- **Contingency:** Pause migration, fix schema builder, resume

### Medium-Impact Risks

**Risk 4: Content Team Adoption**
- **Impact:** Medium (productivity)
- **Probability:** Medium
- **Mitigation:**
  - Comprehensive training (1 day)
  - Migration assistance for first 20 files
  - Clear documentation with examples
- **Contingency:** Extend Phase 5-6 by 4 weeks for additional support

**Risk 5: Browser Rendering Differences**
- **Impact:** Medium (UX)
- **Probability:** Low
- **Mitigation:**
  - Visual regression testing (Percy)
  - Cross-browser testing (BrowserStack)
  - Manual QA of high-traffic pages
- **Contingency:** Fix rendering issues on case-by-case basis

### Low-Impact Risks

**Risk 6: Third-Party Dependency Changes**
- **Impact:** Low (technical)
- **Probability:** Low
- **Mitigation:**
  - Pin all dependencies during migration
  - Test dependency updates in staging first
- **Contingency:** Lock dependencies, defer updates post-migration

---

## Success Metrics & KPIs

### Primary KPIs (Must Not Degrade)

**SEO Performance:**
```typescript
{
  "organic_traffic": {
    target: "maintain ±2%",
    alert_threshold: "-5%",
    current: 150000 // sessions/month
  },
  "avg_position": {
    target: "maintain ±0.5",
    alert_threshold: "+2 positions",
    current: 4.5
  },
  "ctr": {
    target: "maintain ±0.5%",
    alert_threshold: "-2%",
    current: 14.3
  }
}
```

**Technical Health:**
```typescript
{
  "metadata_coverage": {
    target: "100%",
    current: 100
  },
  "schema_coverage": {
    target: "100%",
    current: 100
  },
  "schema_validity": {
    target: "100%",
    current: 98  // 2% to fix
  }
}
```

### Secondary KPIs (Expected Improvements)

**Developer Productivity:**
```typescript
{
  "authoring_time": {
    target: "<4 hours",
    current: 8, // hours per new treatment
    expected: 3
  },
  "build_time": {
    target: "<15 seconds",
    current: 49,
    expected: 14
  },
  "validation_failures": {
    target: "<5% of PRs",
    current: 15, // % (no automated validation)
    expected: 3
  }
}
```

**Content Quality:**
```typescript
{
  "data_consistency": {
    target: "100%",
    current: 70, // % (schema matches content)
    expected: 100
  },
  "seo_override_rate": {
    target: "<10%",
    current: 20, // % (manual SEO overrides)
    expected: 5
  }
}
```

---

## Monitoring & Reporting

### Daily Dashboard

**SEO Health Dashboard:**
```
┌──────────────────────────────────────────────────────────────┐
│ HeyPsych SEO Health - Daily Report                           │
│ Date: December 15, 2025                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Migration Progress:                                           │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░ 250 / 980 (26%)          │
│                                                               │
│ Current Batch: Medications Batch 5 (Mood Stabilizers)        │
│ Status: Monitoring (Day 3 of 7)                              │
│                                                               │
│ Overall SEO Performance:                                      │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Metric          Current   7d Ago   Change          │     │
│ │ ─────────────────────────────────────────────────   │     │
│ │ Avg Position    4.4       4.5       ▲ -0.1        │     │
│ │ CTR             14.5%     14.3%     ▲ +0.2%       │     │
│ │ Impressions     152K      150K      ▲ +1.3%       │     │
│ │ Clicks          22K       21.5K     ▲ +2.3%       │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                               │
│ Technical Health:                                             │
│ ✅ Metadata Coverage: 100% (980/980)                        │
│ ✅ Schema Validity: 100% (980/980)                          │
│ ✅ Internal Links: Avg 48/page ✅                           │
│ ✅ Page Errors: 0.02% (2 errors, investigating)             │
│                                                               │
│ Alerts: None                                                  │
│                                                               │
│ Next Milestone: Batch 6 deployment (Dec 18)                  │
└──────────────────────────────────────────────────────────────┘
```

### Weekly Reports

**To Stakeholders:**
- Migration progress (files migrated, % complete)
- SEO performance summary (traffic, rankings, CTR)
- Technical health summary (validation pass rate, issues)
- Risks & blockers
- Next week's plan

**Example Weekly Report:**
```markdown
# Week 11 Migration Report

## Progress
- **Migrated This Week:** 50 medications (Batch 5: Mood Stabilizers)
- **Total Migrated:** 250 / 980 (26%)
- **On Schedule:** Yes (Week 11 of 36)

## SEO Performance
- **Traffic:** ▲ +2.1% (152K sessions, up from 149K)
- **Avg Position:** 4.4 (was 4.5, ▲ improved)
- **CTR:** 14.5% (was 14.3%, ▲ improved)
- **Net Ranking Changes:** +18 improved, -5 declined (▲ positive)

## Technical Health
- **Metadata Coverage:** 100% ✅
- **Schema Validity:** 100% ✅
- **Parity Validation:** 100% ✅ (all 50 files)

## Issues
- **Resolved:** 2 schema validation warnings (contraindications missing)
- **Open:** 1 page with CTR decline (investigating title optimization)

## Next Week
- Deploy Batch 6 (50 medications: Stimulants)
- Continue monitoring Batch 5 (Days 4-7)
- Prepare Batch 7 migration scripts

## Risks
- No new risks identified
- All existing risks mitigated

## Recommendation
✅ **Proceed to Batch 6**
```

---

## Rollback Procedures

### Automated Rollback (Batch-Level)

**Trigger Conditions:**
```typescript
// Automatic rollback if any of these conditions met
if (
  batch.avgPositionDrop > 2.0 ||        // Avg position drops >2
  batch.ctrDrop > 5.0 ||                 // CTR drops >5%
  batch.schemaValidationRate < 100 ||    // Any schema invalid
  batch.errorRate > 0.5 ||               // Error rate >0.5%
  batch.internalLinksAvg < 10            // Avg internal links <10
) {
  // Automatic rollback
  await rollbackBatch(batch.id);
}
```

**Rollback Process:**
```bash
# 1. Identify batch to rollback
npm run rollback:batch -- medications-batch-5

# 2. Restore legacy JSON files
git checkout HEAD~1 -- data/treatments/medications/batch-5/**

# 3. Rebuild site
npm run build:production

# 4. Deploy
npm run deploy:production

# 5. Verify rollback successful
npm run validate:rollback -- batch-5
```

**Verification:**
- Check all 50 pages render with legacy JSON
- Validate metadata/schema match pre-migration state
- Monitor rankings for 24 hours

### Manual Rollback (Full System)

**Trigger:** Critical SEO regression across all migrated content

**Process:**
```bash
# 1. Revert all migrations
git revert <migration-commit-range>

# 2. Restore legacy loaders
git checkout v1.0-stable -- src/lib/data/entity-service.ts
git checkout v1.0-stable -- src/lib/seo/

# 3. Rebuild & deploy
npm run build:production
npm run deploy:production

# 4. Verify
npm run validate:full-rollback
```

**Post-Rollback:**
- Root cause analysis (2-3 days)
- Fix identified issues
- Re-test in staging
- Resume migration when confident

---

## Acceptance Criteria (Project Complete)

**Phase 1-6 Complete When:**

1. ✅ **All Content Migrated:**
   - 980 entities in V2 format
   - 0 entities using legacy format
   - All SEO overrides validated

2. ✅ **SEO Parity Maintained:**
   - Avg position: ±0.5 positions from baseline
   - CTR: ±0.5% from baseline
   - Traffic: ±2% from baseline
   - All 980 pages have valid schema

3. ✅ **Technical Health:**
   - 100% metadata coverage
   - 100% schema validity
   - Build time <15 seconds
   - Zero page errors

4. ✅ **Code Quality:**
   - All legacy code removed
   - 100% test coverage for new components
   - All CI/CD checks passing

5. ✅ **Documentation Complete:**
   - Developer guide published
   - Content authoring guide published
   - SEO best practices published
   - Architecture docs updated

6. ✅ **Team Trained:**
   - Engineering team trained (2 days)
   - Content team trained (1 day)
   - SEO team trained (1 day)
   - Support channels established

**Final Sign-Off:**
- [ ] Engineering Lead approval
- [ ] Content Lead approval
- [ ] SEO Lead approval
- [ ] Product Manager approval

**Project Status: Ready for Closure**

---

## Post-Migration: Continuous Improvement

### Quarter 1 Post-Migration (Weeks 37-48)

**Focus:** Monitor, optimize, extend

**Activities:**
1. **SEO Monitoring:**
   - Daily dashboard reviews
   - Monthly SEO reports
   - Quarterly ranking analysis

2. **Performance Optimization:**
   - Further build time improvements
   - Bundle size optimization
   - Lighthouse score optimization (target: 100)

3. **Feature Additions:**
   - Add new content types (providers, locations)
   - Enhance section renderers
   - Improve design system

4. **Content Expansion:**
   - Add 500+ new treatment pages
   - Add 200+ new condition pages
   - Add 100+ new resource pages

**Success Metrics:**
- Maintain SEO performance (no degradation)
- Increase content production by 3x
- Reduce content authoring time to <2 hours

---

## Conclusion

This 9-month migration plan provides a **safe, incremental, reversible** path from the current monolithic JSON architecture to a scalable three-layer system.

**Key Success Factors:**

1. ✅ **SEO First:** Every decision prioritizes SEO preservation
2. ✅ **Incremental:** Small batches with monitoring reduce risk
3. ✅ **Validated:** Automated testing prevents regressions
4. ✅ **Reversible:** Rollback capability at every phase
5. ✅ **Transparent:** Daily dashboard provides visibility

**Expected Outcomes:**

- ✅ **100% SEO Parity:** Rankings, traffic, CTR maintained
- ✅ **72% Smaller Files:** 300 lines instead of 1,070
- ✅ **3x Faster Authoring:** 3 hours instead of 8
- ✅ **70% Faster Builds:** 15 seconds instead of 49
- ✅ **Zero Data Drift:** Single source of truth
- ✅ **Future-Proof:** Easy to add new content types

**Timeline Summary:**
- **Weeks 1-4:** Foundation
- **Weeks 5-6:** Pilot (Xanax)
- **Weeks 7-22:** Batch migration (treatments)
- **Weeks 23-28:** Conditions & resources
- **Weeks 29-36:** Cleanup & optimization

**Total Duration:** 36 weeks (~9 months)

**Budget:** ~$443,000

**ROI:** 3.7 years (annual savings: $120,000)

---

**END OF PHASE 3: HIGH-LEVEL IMPLEMENTATION PLAN**

---

**Final Deliverables:**
- ✅ Phase 1: Deep Architecture Analysis (Complete)
- ✅ Phase 2: Architecture Evolution Proposal (Complete)
- ✅ Phase 3: High-Level Implementation Plan (Complete)

**Next Steps:**
1. Present to engineering leadership for approval
2. Allocate resources (4.6 FTE for 9 months)
3. Begin Phase 1: Foundation (Week 1)
4. Execute migration according to plan

**Questions? Contact Architecture Team**
