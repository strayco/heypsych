# Clinician Pilot Contract: Practice Stack Builder

> Phase 0A deliverable for the HeyPsych Decision Platform.
> Classification: Draft — requires product and clinical authority approval.

## 1. Pilot Definition

**Name:** Practice Stack Builder (Solo/Small Practice)

**Audience:** Mental health clinicians starting or building a solo or small practice (1-25 providers)

**Journey Question:** "What tools do I need to run my practice?"

**Entry Points:**
- `/architect` (primary)
- `/for-clinicians` (secondary, requires ownership resolution)
- Homepage clinician gateway

**Mode:** Build for Me (recommendation-driven) with Build Myself and Audit as alternatives

## 2. Allowed Inputs

### Required Fingerprint (Build for Me mode)

| Field | Type | Validation |
|-------|------|------------|
| `practiceType` | enum | solo-clinician, therapy-group, psychiatry, therapy-plus-psychiatry, psychological-testing, telehealth-first, other |
| `sizeBucket` | enum | solo, 2-5, 6-10, 11-25 (pilot scope) |
| `primaryPayerType` | enum | cash, commercial-insurance, medicare, medicaid, eap, mixed |
| `prescribingLevel` | enum | none, prescribing, controlled-substances-epcs |
| `deliveryModel` | enum | in-person, hybrid, telehealth |
| `priorities` | array(3+) | low-cost, ease-of-use, clinical-workflow, billing-collections, integrations, automation, ai, patient-experience, reporting, scalability, implementation-simplicity |

### Optional Inputs (improve precision)

| Field | Type | Purpose |
|-------|------|---------|
| `statesServed` | array | State exclusion rules, multi-state support |
| `clinicalRoles` | array | Role-specific capability weighting |
| `populations` | array | Population-specific fit |
| `monthlyBudget` | number | Budget-aware recommendations |
| `exactProviderCount` | number | Precise cost estimation |

### Prohibited Inputs

- Insurance panel credentials (not verified)
- Individual clinician identifiers or NPI
- Patient population health data

## 3. Ordered Questions

The fingerprint questionnaire follows this sequence:

1. **Practice Type** — "What best describes your practice?"
2. **Practice Size** — "How many providers work in your practice?"
3. **Payer Model** — "What is your primary payment model?"
4. **Prescribing** — "Does your practice include prescribers?"
5. **Delivery Model** — "How do you deliver care?"
6. **Priorities** — "What matters most? (Select 3+)"
7. **States Served** — "Which states do you serve?" (optional)
8. **Budget** — "What's your monthly software budget?" (optional)

No hidden defaults. Every fingerprint field that affects recommendations must be explicitly answered or visibly marked as "not specified."

## 4. Output Types

### Primary Output: Stack Recommendation

```typescript
interface StackRecommendation {
  products: RecommendedProduct[];      // Ordered by fit, max 10
  coveragePercent: number;             // 0-100, lifecycle capability coverage
  costEstimate: CostEstimate;          // Min/max monthly/annual
  gaps: CapabilityGap[];               // Uncovered required capabilities
  dataConfidence: number;              // 0-100, evidence quality
  budgetStatus: 'within' | 'over' | 'unknown';
  versions: {
    definition: string;                // Pilot contract version
    evaluator: string;                 // Engine version
    catalog: string;                   // Product catalog snapshot
  };
}

interface RecommendedProduct {
  slug: string;
  name: string;
  fitScore: number;                    // 0-100
  fitTier: 'excellent' | 'good' | 'fair' | 'poor';
  dataConfidence: number;              // 0-100
  reasons: string[];                   // Why it fits
  tradeoffs: string[];                 // Known limitations
  requiredCapabilities: string[];      // What it covers
  costRange: { min: number; max: number; basis: string };
  hasHardIncompatibility: boolean;
}
```

### Secondary Outputs

- **Coverage Analysis:** Per-lifecycle-stage coverage with gaps
- **Cost Breakdown:** Per-product and total stack costs
- **Overlap Warnings:** Probable redundancy between selected products
- **Compatibility Concerns:** Known integration issues

## 5. Prohibited Claims

The pilot MUST NOT:

- Claim a product is "HIPAA compliant" without `hipaaEvidence: 'baa-available'` in metadata
- Claim a product "meets" any compliance standard without verified provenance
- State pricing as exact when `pricingProvenance` is not `'verified'`
- Guarantee ROI, time savings, or revenue improvements
- Imply products are "recommended by HeyPsych" as clinical endorsement
- Display fit scores as percentages without adjacent confidence indicator
- Rank products by commercial relationship

## 6. Safety Overrides

Not applicable for clinician product recommendations. No clinical safety rules apply to practice management tooling.

## 7. Hard Eligibility Rules

Products are **excluded** from recommendations when:

| Rule | Condition | Evidence Required |
|------|-----------|-------------------|
| Practice Type Exclusion | `practiceFit.excludedPracticeTypes` includes user's type | `capabilityMapStatus: 'reviewed-complete'` |
| State Exclusion | `practiceFit.excludedStates` includes any state user serves | `capabilityMapStatus: 'reviewed-complete'` |
| EPCS Requirement | Practice needs EPCS but product lacks `epcs` capability at `core` or `strong` | `capabilityMapStatus: 'reviewed-complete'` |
| Prescribing Requirement | Practice has prescribers but EHR/PM product lacks prescribing capability | `capabilityMapStatus: 'reviewed-complete'` |
| Known Incompatibility | Product has documented incompatibility with another selected product | Integration mapping present |

**Unknown handling:** If evidence is missing (`capabilityMapStatus` not `'reviewed-complete'`), the rule does NOT apply. The product remains a candidate with reduced `dataConfidence`.

## 8. Uncertainty Behavior

### Data Confidence Display

| Confidence | Display | Meaning |
|------------|---------|---------|
| 80-100 | "High confidence" | Most dimensions have verified evidence |
| 60-79 | "Moderate confidence" | Some dimensions lack evidence |
| 40-59 | "Limited confidence" | Many dimensions unverified |
| 0-39 | "Low confidence" | Insufficient evidence for reliable scoring |

### Unknown Field Handling

- Unknown cost: Display "Contact for pricing" not $0
- Unknown capability: Display "Unknown" not absent
- Unknown integration: Display "Not verified" not "incompatible"
- Unknown fit dimension: Reduce confidence, do not exclude

### Stale Evidence

Products with `lastVerified` > 12 months show "Pricing/features may have changed" warning.

## 9. Evidence Requirements

### Minimum for Display

- `name`, `slug`, `description` present
- `status: 'published'` in V4 catalog
- At least one capability mapping

### Minimum for Recommendation

- `capabilityMapStatus` is `'reviewed-partial'` or `'reviewed-complete'`
- At least 3 capability mappings with strength values
- `pricingProvenance` is not `'unknown'`

### Provenance Tracking

Each capability, integration, and pricing field tracks:
- `provenance`: verified | vendor_provided | public_source | inferred | unknown
- `lastVerified`: ISO date
- `verifiedBy`: reviewer identifier (optional)

## 10. Next Actions

After completing a recommendation:

| Action | Destination | Type |
|--------|-------------|------|
| "Save my stack" | Local storage | Persistence |
| "Compare alternatives" | Build Myself mode | Navigation |
| "View product details" | `/tools/for-clinicians/{slug}` | Navigation |
| "Get a demo" | Vendor URL (if available) | External |
| "Request a quote" | Vendor URL (if available) | External |

Commercial actions (demo, quote) display only when vendor URL is present and are visually separated from organic recommendations.

## 11. Owner and Review

| Role | Owner | Status |
|------|-------|--------|
| Product Owner | **[REQUIRES DECISION]** | Unassigned |
| Clinical Reviewer | N/A (not clinical) | N/A |
| Editorial Owner | **[REQUIRES DECISION]** | Unassigned |
| Privacy/Analytics Owner | **[REQUIRES DECISION]** | Unassigned |
| Commercial Owner | **[REQUIRES DECISION]** | Unassigned |

### Review Expiry

- Pilot contract: Review every 6 months or on major engine change
- Product metadata: Review when `lastVerified` > 12 months
- Pricing data: Review when `pricingLastVerified` > 6 months

## 12. Privacy-Safe Events

Events use bucketed, non-identifying values only:

```typescript
// Entry
architect_mode_selected: { mode: 'build-for-me' | 'build-myself' | 'audit' }

// Fingerprint
fingerprint_step_completed: { step: string, practiceType?: string, sizeBucket?: string }
fingerprint_completed: { practiceType: string, sizeBucket: string, payerType: string }

// Recommendation
recommendation_generated: {
  productCount: number,
  coverageBucket: '0-25' | '26-50' | '51-75' | '76-100',
  confidenceBucket: 'low' | 'limited' | 'moderate' | 'high',
  budgetStatus: 'within' | 'over' | 'unknown' | 'not-set'
}

// Stack actions
product_added: { productSlug: string, source: 'recommendation' | 'browse' | 'search' }
product_removed: { productSlug: string }
stack_saved: { productCount: number }

// Commercial (separate)
vendor_cta_shown: { productSlug: string, ctaType: 'demo' | 'quote' | 'visit' }
vendor_cta_clicked: { productSlug: string, ctaType: 'demo' | 'quote' | 'visit' }
```

**Prohibited in events:**
- Exact budget amounts
- State lists
- Provider counts (use buckets)
- Any user-entered text

## 13. Rollback Gates

### Launch Gate

- [ ] All golden test cases pass
- [ ] Hard eligibility rules have test coverage
- [ ] Unknown data handling has test coverage
- [ ] Mobile and desktop journeys pass manual QA
- [ ] Keyboard navigation complete
- [ ] No unconditional compliance claims in UI
- [ ] Feature flag `architect-build-for-me` controls exposure
- [ ] Analytics events fire correctly (verified in dev)

### Pause Triggers

- Fit scores produce demonstrably incorrect rankings
- Hard eligibility rule fails to exclude known-bad product
- Pricing displays are materially incorrect
- User reports compliance claim that lacks evidence

### Rollback Procedure

1. Disable `architect-build-for-me` feature flag
2. Users see Build Myself mode as default
3. Saved stacks remain accessible
4. No data loss occurs

## 14. Golden Test Cases

### Case 1: Solo Therapist, Cash Pay

**Input:**
```yaml
practiceType: solo-clinician
sizeBucket: solo
primaryPayerType: cash
prescribingLevel: none
deliveryModel: hybrid
priorities: [ease-of-use, low-cost, patient-experience]
```

**Expected:**
- Recommends simple practice management (SimplePractice, Jane, TherapyNotes)
- Does NOT recommend enterprise EHRs
- Does NOT recommend billing-heavy solutions
- Cost estimate under $200/month
- Coverage focuses on: scheduling, documentation, patient portal

### Case 2: Small Psychiatry Group, Insurance Heavy

**Input:**
```yaml
practiceType: psychiatry
sizeBucket: 6-10
primaryPayerType: commercial-insurance
prescribingLevel: controlled-substances-epcs
deliveryModel: hybrid
priorities: [billing-collections, clinical-workflow, integrations]
statesServed: [CA, NY]
```

**Expected:**
- Recommends EHR with EPCS capability (core or strong)
- Recommends billing/RCM solution
- Excludes products without multi-state support
- Cost estimate reflects per-provider pricing
- Coverage includes: prescribing, EPCS, claims, eligibility

### Case 3: Unknown Capability Data

**Input:**
```yaml
practiceType: therapy-group
sizeBucket: 2-5
primaryPayerType: mixed
prescribingLevel: none
deliveryModel: telehealth
priorities: [ease-of-use, automation, ai]
```

**Expected:**
- Products with `capabilityMapStatus: 'unreviewed'` show reduced confidence
- No hard exclusions based on unverified data
- Confidence indicator shows "Limited" or "Moderate"
- Recommendations include disclaimer about evidence quality

### Case 4: Budget Constraint

**Input:**
```yaml
practiceType: solo-clinician
sizeBucket: solo
primaryPayerType: cash
prescribingLevel: none
deliveryModel: in-person
priorities: [low-cost]
monthlyBudget: 50
```

**Expected:**
- Prioritizes free and low-cost options
- Shows `budgetStatus: 'over'` if minimum viable stack exceeds $50
- Does NOT hide all options; shows lowest-cost path with warning

---

## Appendix A: Decisions Requiring Authority

The following require product owner decision before launch:

1. **Product Owner Assignment** — Who approves pilot changes?
2. **Editorial Owner Assignment** — Who reviews product descriptions and claims?
3. **Commercial Owner Assignment** — Who manages vendor relationships and disclosures?
4. **Privacy Owner Assignment** — Who approves analytics events?
5. **Fit Tier vs. Numeric Score** — Display "Excellent/Good/Fair/Poor" only, or include numeric score?
6. **Minimum Evidence Threshold** — Can products with `capabilityMapStatus: 'unreviewed'` appear in recommendations?
7. **Clinician Entry Surface Ownership** — Resolve `/architect` vs `/for-clinicians` vs `/tools/for-clinicians`

**Recommended defaults (for non-production development):**
- Fit tiers only (no numeric scores) until evidence quality improves
- Unreviewed products can appear with "Limited confidence" indicator
- `/architect` is the canonical entry; others redirect

---

*Document version: 0.1.0-draft*
*Created: 2025-09-02*
*Status: Requires authority approval*
