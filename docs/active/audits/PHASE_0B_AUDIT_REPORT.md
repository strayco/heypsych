# Phase 0B Audit Report: Critical Correctness Gates

> Audit date: 2026-09-02
> Audited by: Claude (automated exploration)
> Status: Findings documented, remediation pending

## Executive Summary

Phase 0B audited six critical correctness areas. **All areas have documented findings.** Three areas have critical issues that block patient routing (assessment alerts, search routes, review claims). Three areas require remediation but don't block Phase 1 work.

| Area | Status | Critical Issues | Action Required |
|------|--------|-----------------|-----------------|
| Assessment alerts | ⚠️ CRITICAL GAPS | 7 safety gaps | Block patient routing until fixed |
| Search routes | ⚠️ BROKEN | Clinician tools link wrong | Fix before Phase 3 |
| Review claims | ⚠️ UNCONDITIONAL | 6 hardcoded claims | Audit and gate claims |
| Affiliate URLs | ✓ DOCUMENTED | No verified commission data | Add classification field |
| Architect metadata | ✓ DOCUMENTED | 0 reviewed products | Create review workflow |
| Routes/sitemap/flags | ✓ DOCUMENTED | Baseline captured | No immediate action |

---

## 1. Assessment Scoring & Alert Contract

**Files audited:**
- `src/lib/assessments/engines.ts`
- `src/lib/assessments/engines/asrs-custom.ts`
- `src/lib/assessments/engines/assist-who-v3.ts`
- `src/lib/assessments/engines/sum-with-bands.ts`
- `src/components/resource-renderers/AssessmentRenderer.tsx`

### Critical Safety Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| Question alerts disconnected | CRITICAL | `items[].alert` decorators not validated by engine |
| EngineResult lacks typed alerts | HIGH | Alerts hidden in `interpretation` string |
| No alert severity tiers | HIGH | Suicide risk styled same as ADHD threshold |
| No acknowledgment gate | HIGH | User can print results with active suicide alert |
| Injection drug use not escalated | MEDIUM | No emergency pathway for recent injection |
| Recommendations not standardized | MEDIUM | Only ASSIST returns recommendations |
| Medical disclaimer position | LOW | Appears before questions, not with alerts |

### Recommended Golden Test Cases

1. **PHQ-9 Suicide Risk Gate**: q9 ≥ 1 triggers critical alert, blocks print until acknowledged
2. **ASRS Part A Threshold**: Part A ≥ 14 produces alert with evaluation recommendation
3. **ASSIST Injection Escalation**: q60 = 2 triggers critical alert with harm reduction routing
4. **Alert Type Consistency**: All engines return typed `EngineResult.alerts` array
5. **Question Alert Validation**: `items[].alert` items have corresponding scoring rules
6. **Clinical Interpretations**: All bands have interpretation text

### Implementation Priority

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Add `alerts: Alert[]` field to EngineResult | 2h |
| P0 | Classify alerts by severity (CRITICAL/WARNING/INFO) | 3h |
| P0 | Implement acknowledgment gate for CRITICAL alerts | 4h |
| P1 | Validate items[].alert items are in scoring rules | 1h |
| P1 | Standardize recommendations field | 2h |
| P2 | Route CRITICAL alerts to crisis helplines | 4h |

---

## 2. Search Result Route Contract

**Files audited:**
- `src/app/search/page.tsx`
- `src/app/api/search/route.ts`
- `src/components/tools/clinician/ClinicianToolCard.tsx`

### Critical Issue

**Clinician tools link to wrong route in global search.**

| Result Type | Current Route | Correct Route |
|-------------|---------------|---------------|
| condition | `/conditions/{slug}` | ✓ Correct |
| treatment | `/treatments/{slug}` | ✓ Correct |
| resource | `/resources/{slug}` | ✓ Correct |
| tool (clinician V4) | `/tools/{slug}` | `/tools/for-clinicians/{category}/{slug}/` ❌ |

### Root Cause

- SearchResult type has no `href` field
- Frontend `getResultUrl()` doesn't distinguish clinician tools
- API returns `category` in schema format, not taxonomy slug

### Recommended Fix

Add `href` field to API response:

```typescript
// In route.ts toolsResults mapping:
const taxonomyCategory = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category];
return {
  ...result,
  href: `/tools/for-clinicians/${taxonomyCategory}/${tool.slug}/`,
};
```

---

## 3. Unconditional Review Claims Inventory

**Files audited:**
- `src/lib/schemas/tool-editorial.ts`
- `src/components/layout/footer.tsx`
- `src/components/tools/BoardAttribution.tsx`
- `src/components/eat/AuthorByline.tsx`
- `src/app/treatments/[slug]/client-wrapper.tsx`

### Unconditional Claims Found

| Component | File:Line | Claim | Check |
|-----------|-----------|-------|-------|
| Footer | footer.tsx:89 | "Clinical content reviewed by mental health professionals" | None |
| BoardAttribution | BoardAttribution.tsx:20 | "Reviewed by HeyPsych Board" | None |
| AuthorByline | AuthorByline.tsx:66 | "Always show Medical Review Board" | None |
| Treatments Hero | treatments/client-wrapper.tsx:1746 | "Reviewed by...Medical Review Board" | None |
| Tool Schema | digital-tool-v3.ts:141 | Literal "Reviewed by Board" required | Schema-enforced |

### Correctly Gated Claims

| Component | Check | Behavior |
|-----------|-------|----------|
| MedicalReviewBadge | `reviewInfo?.reviewed` | Returns null if false |
| Conditions Badge | `entity.metadata?.medical_review?.reviewed` | Conditional render |

### Review State Fields Available

From `src/lib/schemas/tool-editorial.ts`:
- `status`: listing → vendor_verified → facts_verified → editorially_reviewed → clinically_reviewed → privacy_reviewed
- `reviews_completed`: Array of completed review types
- `last_editorial_review`, `last_clinical_review`: Date strings
- `clinical_reviewer`, `clinical_reviewer_credentials`: Strings

### Recommended Fixes

1. Footer claim: Gate on page-level review state
2. BoardAttribution: Check `tool.governance.reviewed_by_label` actually exists
3. AuthorByline: Allow null return when no review data
4. Treatments Hero: Check `editorial.status` before rendering
5. Tool Schema: Make `governance.reviewed_by_label` optional

---

## 4. Affiliate URL Inventory

**Files audited:**
- `src/lib/schemas/digital-tool-v3.ts`
- `src/lib/schemas/clinician-tool-v4.ts`
- `src/app/tools/[slug]/ToolOutboundLinks.tsx`
- `src/app/tools/_components/SponsoredToolCardClient.tsx`

### Affiliate URL Prevalence

| Schema | Field | Populated |
|--------|-------|-----------|
| V3 Patient Tools | `affiliate_url` | 339/339 (100%) |
| V4 Clinician Tools | `affiliate_url` | 890/890 (100%) |

### Disclosure Implementation

| Link Type | rel Attribute | Visual Disclosure |
|-----------|---------------|-------------------|
| Affiliate | `noopener nofollow sponsored` | None visible |
| Sponsored campaign | `sponsored noopener noreferrer` | "Sponsored" badge |
| Non-affiliate external | `noopener noreferrer` | None |

### Missing Classification

No field distinguishes:
- **Active affiliate** (verified commission agreement)
- **Inactive affiliate** (URL exists, no active agreement)
- **Direct link** (vendor URL, no commission)
- **Sponsored** (paid placement)

### Recommended Schema Addition

```typescript
commercial_status: z.enum([
  "active_affiliate",    // Verified commission agreement
  "inactive_affiliate",  // Was affiliate, no current agreement
  "direct_link",         // No commission, just vendor URL
  "sponsored",           // Paid placement
  "unknown",             // Not yet classified
]).default("unknown")
```

---

## 5. Architect Metadata Provenance Inventory

**Files audited:**
- `src/domains/architect/schemas/product-metadata.ts`
- `src/domains/architect/engines/fit-engine.ts`
- `src/domains/architect/adapters/v4-product-adapter.ts`

### Provenance Levels

```typescript
ProvenanceStatusZ = z.enum([
  "verified",          // HeyPsych editorial confirmed
  "vendor_provided",   // Vendor claimed, not verified
  "public_source",     // From documentation/website
  "unverified",        // Added without verification
  "unknown",           // No source information
]);
```

### Capability Map Status

```typescript
CapabilityMapStatusZ = z.enum([
  "reviewed-complete",  // All capabilities reviewed
  "reviewed-partial",   // Some capabilities pending
  "unreviewed",         // Not yet reviewed
]);
```

### Current Review State

| Status | Count | Percentage |
|--------|-------|------------|
| reviewed-complete | 0 | 0% |
| reviewed-partial | 0 | 0% |
| unreviewed | 887 | 100% |

All real products derive metadata from V4 data and default to `unreviewed`.

### Impact on Recommendations

- Products with < 25% dataConfidence: `fitScore: null`
- Products with < 50% dataConfidence: `isLimitedData: true`
- Reviewed products get up to 20% selection boost

### Missing Editorial Workflow

1. No UI to update `capabilityMapStatus`
2. No audit trail for review actions
3. No staleness alerts for old `lastVerified` dates
4. No source URLs for inferred capabilities

---

## 6. Public Routes, Sitemap, Feature Flags Baseline

### Route Summary

- **Total routes**: 126 (101 static, 25 dynamic)
- **Sitemap files**: 11 generated dynamically
- **Feature flags**: 3 active

### Feature Flags

| Flag | Environment Variable | Default | Purpose |
|------|---------------------|---------|---------|
| ocdJourneyEnabled | `OCD_JOURNEY_ENABLED` | true | OCD "What's Next?" section |
| contextualNextSteps | `CONTEXTUAL_NEXT_STEPS_ENABLED` | true | Contextual next-steps |
| forCliniciansPage | `FOR_CLINICIANS_PAGE_ENABLED` | true | /for-clinicians landing |

### Indexation Strategy

| Page Type | robots | Sitemap |
|-----------|--------|---------|
| Entity detail | index, follow | Yes (priority 0.7-0.9) |
| Search pages | noindex, follow | No |
| Filter states | noindex, follow | No |
| Admin/dashboard | noindex, nofollow | No |
| Empty categories | noindex, follow | No |

### Canonical Strategy

- Metadata base: `https://heypsych.com`
- Treatment aliases: 301 redirect to compound slug
- Filter states: canonical to base URL
- Dynamic comparisons: canonical to base

### Analytics

- Vercel Analytics (Web Vitals)
- Vercel Speed Insights
- GA4 (optional)
- AI bot tracking (Google-Extended, GPTBot, Claude-Web, etc.)

---

## Slice 0B Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Every patient branch has approved expected/fail-safe result | ⚠️ PENDING | Contracts drafted, no clinical approval |
| Unknown handling explicit for every eligibility field | ⚠️ PENDING | Documented in contracts, not implemented |
| Assessments cannot emit unrelated critical alert | ❌ FAIL | Question alerts disconnected from engine |
| Search results supply correct canonical route | ❌ FAIL | Clinician tools link to patient route |
| Every review claim traced to stored state or removed | ❌ FAIL | 6 unconditional claims found |
| Commercial links classified | ⚠️ PARTIAL | All have affiliate_url but no status field |
| Pilot definitions have frozen golden cases | ⚠️ PENDING | Cases defined in contracts, not tests |
| No new public decision entry point exposed | ✓ PASS | No production code changes |

---

## Next Actions

### Immediate (Before Phase 1)

1. **Assessment Safety** — Add typed alerts to EngineResult, implement severity tiers
2. **Search Routes** — Add href to SearchResult API response
3. **Review Claims** — Gate footer/AuthorByline on actual review state

### Before Phase 2 (Patient Routing)

1. **Assessment Acknowledgment** — Block result export until critical alert acknowledged
2. **Crisis Routing** — Link CRITICAL alerts to crisis resources
3. **Golden Tests** — Implement assessment safety test cases

### Before Phase 3 (Navigation Inversion)

1. **Commercial Classification** — Add commercial_status field to tool schemas
2. **Architect Review Workflow** — Create UI to update capabilityMapStatus
3. **Review Claims Remediation** — Remove or gate all unconditional claims

---

*Report version: 1.0.0*
*Audit date: 2026-09-02*
