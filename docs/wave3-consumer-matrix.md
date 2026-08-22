# Wave 3 Consumer Matrix - Migration Status

## STATUS: Phases A-G Complete

The Central Indexation Firewall is now wired into production systems.
Trust modules are operationally integrated:
- Clinical source registry (quality credit, DOI validation)
- Medical claim ledger (high-risk claim tracking)
- Contributor registry (E-E-A-T assessment)
- Schema-content reconciler (structured data validation)
- Authority graph (PageRank-based link authority)

## Phase B Completed

### Quality Credit System (Gate 4 Enhancement)
High-value content signals now reduce word count requirements:
- +15% for comparison tables
- +15% for credentialed medical reviewer
- +10% for 2+ clinical references
- +5% for DOI-linked references
- +5% for quantitative clinical data (NNT, RCT, efficacy percentages)
- Maximum 50% reduction, absolute floor of 150 words

### Structured Topic Keys
Topic cluster identification now uses a structured-key-first approach:
- Entities can define explicit `topicKey` in data
- Auto-generated from entity type/category/slug
- Regex pattern matching is fallback only
- New functions: `buildTopicKeyFromEntity`, `topicKeyToClusterId`, `identifyTopicClusterFromEntity`

### Adversarial Test Coverage
10 adversarial quality gate tests document expected vs actual behavior:
- Boilerplate detection (TODO: information gain check)
- High-value short content (IMPLEMENTED: quality credit)
- Entity-name substitution detection (TODO)
- Identical FAQ deduplication (TODO)
- High-risk content source requirements (TODO)
- Review integrity validation (TODO)
- Cohort transition validation (passing)
- Canonical handling (passing)

## Phase C Completed

### Clinical Source Registry
New module: `src/lib/trust/clinical-source-registry.ts`

Features:
- Source registration with DOI/PMID/URL identifiers
- Automatic deduplication via DOI/PMID indexes
- Topic-based source indexing
- Source validation with evidence level consistency checks
- Entity-source linking for traceability
- Common sources pre-registration (Cipriani meta-analysis, DSM-5, FDA, NICE)

Types:
- `ClinicalSource`: Full source metadata with verification status
- `SourceType`: peer_reviewed, guideline, government, textbook, meta_analysis, clinical_trial, preprint, database
- `EvidenceLevel`: A (RCT/meta-analysis), B (cohort), C (case reports), D (unrated)

Test coverage: 18 tests passing

## Phase D Completed

### Medical Claim Ledger
New module: `src/lib/trust/medical-claim-ledger.ts`

Features:
- Claim registration with type classification
- Automatic confidence scoring based on source evidence levels
- Entity-claim and source-claim bidirectional linking
- Duplicate claim merging (same claim in multiple locations)
- Flag detection (needs_source, weak_evidence, outdated, sensitive)
- Claim review tracking

Claim Types:
- prevalence, dosage, efficacy, side_effect, interaction
- mechanism, contraindication, diagnostic, prognosis, comparison, general

Confidence Levels:
- high (≥0.8): Multiple high-quality sources
- moderate (0.5-0.8): At least one good source
- low (<0.5): Only weak evidence
- unsupported (0): No sources linked

Test coverage: 17 tests passing

## Phase C/D Operational Integration

The trust modules are now consumed by production code in `index-decision-service.ts`:

### Clinical Source Registry Integration
- `validateReferencesAgainstRegistry()` - Called during quality credit calculation
- Validates DOIs against the registry
- Deduplicates references (same DOI = 1 reference, not multiple)
- Auto-registers new DOIs with pending verification status
- Returns evidence level for high-quality DOI bonus

### Medical Claim Ledger Integration
- `trackHighRiskClaims()` - Called for treatment pages during index decisions
- Extracts claims from high-risk sections (dosage, interactions, contraindications, side effects)
- Registers claims in the ledger with linked sources
- Returns flags for unsupported or weak-evidence claims
- Adds `claimTracking` to IndexEvidence for downstream use

### Adversarial Quality Credit Tests (7 new tests)
- 150-word page with decorative comparison table must fail
- Named but uncredentialed reviewer receives no credit
- Generic "Medical Team" reviewer receives no credit
- Irrelevant references documented (TODO: validation)
- Duplicate references documented (TODO: deduplication in credit)
- Empty comparison table structure receives no credit
- 150-word absolute floor enforced regardless of credits

Total adversarial tests: 17 passing

## Phase E Completed

### Contributor Registry
New module: `src/lib/trust/contributor-registry.ts`

Features:
- Contributor registration with role classification (author, medical_reviewer, clinical_advisor, editor, fact_checker)
- Credential parsing and typed credential objects (MD, DO, PhD, PsyD, LCSW, LMFT, NPI, ORCID, board_cert)
- Automatic deduplication via slug, NPI, and ORCID indexes
- E-E-A-T integrity assessment (missing verifiable credentials, expired credentials, generic names)
- Entity-contributor linking for traceability
- Verification workflow support (pending → verified)

Integration:
- `assessContributorForEntity()` - Called during index decisions
- Contributors registered from entity.editorial.medicalReviewer
- Integrity flags added to IndexEvidence.contributorIntegrity
- E-E-A-T compliance check available for quality gating

Test coverage: 20 tests passing

## Phase F Completed

### Schema-Content Reconciler
New module: `src/lib/trust/schema-content-reconciler.ts`

Features:
- Validates JSON-LD structured data matches visible page content
- Detects schema-content mismatches (missing_in_content, missing_in_schema, value_mismatch, count_mismatch)
- Severity levels: critical (name mismatches), warning (code mismatches), info (missing optional fields)
- Rules for MedicalCondition, Drug, MedicalTherapy, FAQPage schema types
- Aggregated validation across all page schemas

API:
- `reconcileSchema(schema, entity)` - Check single schema against entity
- `reconcileAllSchemas(schemas, entity)` - Check all schemas for entity
- `schemasAreValid(schemas, entity)` - Boolean validation
- `getCriticalMismatches(schemas, entity)` - Get critical issues only

Test coverage: 11 tests passing

## Phase G Completed

### Internal Authority Graph
New module: `src/lib/trust/authority-graph.ts`

Features:
- Page registration with entity metadata and topic cluster assignment
- Link tracking with type-based weighting (inline > related > navigation > breadcrumb > footer)
- PageRank-inspired authority score calculation
- Topic cluster authority aggregation
- Answer king management (set, get, auto-elect)
- Orphan page and dead-end detection
- Graph statistics

API:
- `registerPage(config)` - Add page to graph
- `registerLink(link)` - Track link between pages
- `calculateAuthorityScores(iterations)` - Run PageRank algorithm
- `getClusterAuthority(clusterId)` - Get authority summary for cluster
- `setAnswerKing(path)` / `getAnswerKing(clusterId)` - Manage answer kings
- `autoElectAnswerKings()` - Auto-promote high-authority pages
- `findOrphanPages()` / `findDeadEndPages()` - Detect link issues

Test coverage: 20 tests passing

## Consumer Matrix (Updated)

| System | Uses Firewall | Uses Canonical Decision | Uses Cohort | Tested through Rendered Output |
|--------|:-------------:|:-----------------------:|:-----------:|:-----------------------------:|
| Guide metadata | ✅ (migrated) | ✅ | Partial | ❌ |
| Guide sitemap | ✅ | Partial | Partial | ❌ |
| Condition metadata | ✅ (migrated) | ❌ | ❌ | ❌ |
| Treatment metadata | ✅ (migrated) | ❌ | ❌ | ❌ |
| Resource metadata | ✅ (migrated) | ❌ | ❌ | ❌ |
| Tool metadata | ❌ | ❌ | ❌ | ❌ |
| Provider metadata | ❌ | ❌ | ❌ | ❌ |
| Markdown endpoints | ❌ | ❌ | ❌ | ❌ |
| Internal recommendations | ❌ | ❌ | ❌ | ❌ |

## Migration Completed

1. ✅ Deleted dead `metadata-integration.ts`
2. ✅ Wired firewall into base `MetadataGenerator.generateRobots()`
3. ✅ Uncommented robots in condition, medication, therapy, resource generators
4. ✅ Updated guide page to use `makeGuideIndexDecision` instead of legacy
5. ✅ Added deprecation notice to legacy `index-eligibility.ts`

## Migration Remaining

1. ❌ Tool metadata - needs to use MetadataFactory or direct firewall
2. ❌ Provider metadata - needs firewall integration
3. ❌ Markdown endpoints - need firewall integration
4. ❌ Internal recommendations - need `internallyPromotable` check
5. ❌ Content engine still imports legacy `checkIndexEligibility`
6. ❌ Rendered output tests for all route families

## Wave 2 Module Import Analysis (Post-Migration)

### index-decision-service.ts
**Consumers:**
- `metadata-generator.ts` - ✅ Now uses firewall for robots decisions
- `guide/[slug]/page.tsx` - ✅ Now uses firewall for guide indexability
- `sitemap-guide.xml/route.ts` - ✅ Uses firewall for sitemap eligibility
- `cohort-manager.ts` - partial usage
- `answer-king-registry.ts` - imports type only
- Test file

### answer-king-registry.ts
**Consumers:**
- `index-decision-service.ts` - internal use
- Test file

### cohort-manager.ts
**Consumers:**
- `sitemap-guide.xml/route.ts` - evaluateCohort called

### similarity-engine.ts
**Consumers:**
- `sitemap-guide.xml/route.ts` - used for uniqueness check

### metadata-integration.ts
**Status:** DELETED (was dead code)

## Unified Architecture

### Central Indexation Firewall Flow

```
Entity/Path → index-decision-service.ts → IndexDecision
                      ↓
              ┌───────┴───────┐
              │               │
    MetadataGenerator    Sitemap Generator
    (robots directive)   (sitemap eligibility)
              │               │
              ↓               ↓
       Page Metadata    sitemap-*.xml
```

### Deprecated Legacy System

- File: `src/lib/programmatic-seo/index-eligibility.ts`
- Status: DEPRECATED - marked for removal
- Remaining consumer: `content-engine.ts` (needs migration)

## Next Steps for Full Migration

1. Migrate `content-engine.ts` away from legacy `checkIndexEligibility`
2. Wire tool pages through MetadataFactory
3. Wire provider pages through MetadataFactory
4. Add firewall check to markdown endpoints
5. Add `internallyPromotable` checks to recommendation modules
6. Add rendered output tests that verify actual HTML robots tags
7. Remove legacy `index-eligibility.ts` after all consumers migrated

## Verification Checklist

After full migration, verify:

- [ ] All page metadata uses firewall for robots decisions
- [ ] Sitemaps use firewall for eligibility
- [ ] Internal promotion uses `internallyPromotable`
- [ ] Alternate formats use firewall
- [ ] CI tests rendered behavior
- [ ] No two systems can disagree on indexability
