# Hard Eligibility Policies — Architect Clinician Journey

**Version:** 1.0
**Created:** 2026-09-02
**Status:** Active

## Purpose

This document defines the hard eligibility policies for the Practice Architect
clinician recommendation system. Hard policies result in complete exclusion from
recommendations — they are not soft preferences that affect ranking.

## Invariant

> **Never silently treat unknown evidence as meeting a hard requirement.**

When evidence is unknown or unreviewed, the system must:
1. Not claim the product meets the requirement
2. Document the uncertainty in the result
3. Either exclude or clearly flag the uncertainty to users

## Hard Exclusion Policies

### 1. Practice Type Exclusions

**Policy:** Products explicitly excluded for a practice type are never recommended.

| Fingerprint Field | Product Field | Logic |
|-------------------|---------------|-------|
| `practiceType` | `fitEvidence.practiceTypesExcluded[]` | If fingerprint practice type is in exclusion list → **EXCLUDE** |

**Unknown Handling:**
- If `practiceType` undefined in fingerprint: Skip check (incomplete fingerprint)
- If `practiceTypesExcluded` undefined/empty: Pass (no explicit exclusions)

**Example:**
- Product excludes "solo-clinician" → Not recommended for solo practices
- Product excludes "iop-php" → Not recommended for IOP/PHP programs

---

### 2. State Exclusions

**Policy:** Products unavailable in a practice's states are excluded.

| Fingerprint Field | Product Field | Logic |
|-------------------|---------------|-------|
| `statesServed[]` | `fitEvidence.statesExcluded[]` | If ANY fingerprint state is in exclusion list → **EXCLUDE** |

**Unknown Handling:**
- If `statesServed` is empty: Skip check (location unknown)
- If `statesExcluded` undefined/empty: Pass (no state restrictions)

**Example:**
- Product excludes ["CA", "NY"] → Excluded if practice serves CA or NY
- Multi-state practice in ["CA", "TX", "FL"] with product excluding CA → **EXCLUDED**

---

### 3. EPCS Requirement

**Policy:** Practices prescribing controlled substances require EPCS capability.

| Fingerprint Field | Product Field | Logic |
|-------------------|---------------|-------|
| `prescribingLevel` = "controlled-substances-epcs" | Capability "epcs" with strength "core" or "strong" | If practice needs EPCS AND product lacks it → **EXCLUDE** |

**Gated By:** `capabilityMapStatus === "reviewed-complete"`

**Unknown Handling:**
- If `capabilityMapStatus` is NOT "reviewed-complete": Flag uncertainty, do not hard-exclude
- If prescribing level unknown: Skip check

**Example:**
- Psychiatrist needing EPCS evaluating EHR without EPCS → **EXCLUDED**
- Same psychiatrist evaluating EHR with unreviewed capabilities → **FLAGGED** (not excluded)

---

### 4. Size Exclusions

**Policy:** Products with explicit size exclusions are hard-excluded.

| Fingerprint Field | Product Field | Logic |
|-------------------|---------------|-------|
| `sizeBucket` | `fitEvidence.sizeBucketsExcluded[]` | If fingerprint size is in exclusion list → **EXCLUDE** |

**Unknown Handling:**
- If `sizeBucket` undefined: Skip check
- If `sizeBucketsExcluded` undefined/empty: Pass

**Example:**
- Enterprise product excludes ["solo", "2-5"] → Not for solo or small practices
- Solo-focused product excludes ["51-100", "101-250", "250+"] → Not for large practices

---

### 5. HIPAA/BAA Requirement (NEW)

**Policy:** Insurance-billing practices require products with valid BAA availability.

| Fingerprint Field | Product Field | Logic |
|-------------------|---------------|-------|
| `primaryPayerType` in ["commercial-insurance", "medicare", "medicaid", "mixed"] | `compliance.baaAvailable` | If practice bills insurance AND product has no BAA → **EXCLUDE** |

**Unknown Handling:**
- If `baaAvailable` is undefined: Flag uncertainty for insurance practices
- Cash-pay-only practices: Skip check (no BAA needed)

**Example:**
- Insurance-heavy practice evaluating product with `baaAvailable: false` → **EXCLUDED**
- Insurance practice evaluating product with `baaAvailable: undefined` → **FLAGGED**
- Cash-pay practice: BAA check skipped

---

## Soft Policy Summary (Not Hard Exclusions)

The following are soft policies that affect **ranking/scoring** but not eligibility:

| Dimension | Current Treatment | Score Impact |
|-----------|-------------------|--------------|
| Payer type mismatch | Soft | 0.5–1.0 |
| Delivery model mismatch | Soft | 0.5–1.0 |
| Multi-state support mismatch | Soft | 0.5–1.0 |
| Size outside ideal range | Soft | 0.5–0.7 |
| Prescribing for non-prescribers | Soft | Not penalized |
| Clinical role mismatch | Not checked | No impact |

---

## Incompatibility Policies

### Product-to-Product Incompatibilities

**Policy:** Products marked incompatible with already-selected products are excluded.

| Source | Target | Type | Logic |
|--------|--------|------|-------|
| Selected product | Candidate product | `type: "incompatible"` | If integration marked incompatible → **EXCLUDE** from recommendations |

**Unknown Handling:**
- No integration data: Pass (assume compatible)
- Manual integration: Soft penalty (not hard exclude)

---

## Evidence Quality Gates

Hard exclusions are **only applied when evidence is reliable:**

| Check | Applied When |
|-------|--------------|
| Practice type exclusion | Always (explicit exclusion is authoritative) |
| State exclusion | Always (explicit exclusion is authoritative) |
| EPCS requirement | Only when `capabilityMapStatus === "reviewed-complete"` |
| Prescribing requirement | Only when `capabilityMapStatus === "reviewed-complete"` |
| Size exclusion | Always |
| BAA requirement | Only when `compliance.baaAvailable` is explicitly `false` |

---

## Implementation Checklist

- [x] Practice type exclusions (fit-engine.ts)
- [x] State exclusions (fit-engine.ts)
- [x] EPCS requirement (fit-engine.ts, gated by capabilityMapStatus)
- [x] Size exclusions (fit-engine.ts, recommendation-engine.ts)
- [x] BAA/HIPAA requirement (fit-engine.ts, recommendation-engine.ts)
- [x] Clinical role exclusions (fit-engine.ts, recommendation-engine.ts)
- [x] Delivery model hard exclusions for telehealth-only (fit-engine.ts, recommendation-engine.ts)

---

## Golden Test Coverage

The following scenarios must have golden tests:

1. **Practice type exclusion**: Solo practice excluded from enterprise-only product
2. **State exclusion**: NY practice excluded from CA-only product
3. **EPCS requirement**: Psychiatrist prescribing controlled substances requires EPCS
4. **Size exclusion**: Solo excluded from large-practice-only product
5. **Incompatibility**: Product incompatible with selected product
6. **Unknown handling**: Unreviewed product not hard-excluded but flagged
7. **BAA exclusion**: Insurance practices excluded from no-BAA products
8. **BAA cash-pay pass**: Cash-pay practices not excluded from no-BAA products
9. **BAA unknown flag**: Products with unknown BAA status not hard-excluded
10. **Clinical role exclusion**: Psychiatry practice excluded from therapy-only products
11. **Clinical role pass**: Therapist practice not excluded by prescriber-focused exclusions
12. **Size bucket exclusion**: Solo practice excluded from enterprise-only products
13. **Size bucket pass**: Enterprise practice not excluded by small-practice exclusions
14. **Delivery model exclusion**: Telehealth practice excluded from in-person-only products
15. **Delivery model explicit exclusion**: Product with deliveryModelsExcluded excludes practice
16. **Delivery model unknown pass**: Products without explicit deliveryModels not hard-excluded

All golden tests are in `src/domains/architect/__tests__/golden-recommendation.test.ts`.
