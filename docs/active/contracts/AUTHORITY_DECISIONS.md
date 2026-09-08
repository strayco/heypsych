# Decisions Requiring Product Authority

> Phase 0A deliverable for the HeyPsych Decision Platform.
> These decisions require human authority before pilots can launch.

## Status Legend

| Status | Meaning |
|--------|---------|
| **REQUIRED** | Must be decided before pilot launch |
| **RECOMMENDED** | Should be decided; has a sensible default |
| **DEFERRED** | Can be decided in a later phase |

---

## 1. Ownership Assignments

### 1.1 Product Owner

**Status:** REQUIRED

**Question:** Who approves changes to pilot definitions, question flows, and output formats?

**Applies to:** Both pilots

**Options:**
- Single owner for both pilots
- Separate owners per audience (patient vs. clinician)

**Current:** Unassigned

---

### 1.2 Clinical Reviewer

**Status:** REQUIRED (Patient pilot MANDATORY)

**Question:** Who approves clinical content, routing rules, path definitions, and safety behavior?

**Applies to:** Patient pilot (mandatory), Clinician pilot (advisory)

**Requirements:**
- Licensed mental health professional
- Authority to approve patient-facing health guidance
- Availability for quarterly review cycles

**Current:** Unassigned

---

### 1.3 Editorial Owner

**Status:** REQUIRED

**Question:** Who approves product descriptions, trust claims, and public-facing copy?

**Applies to:** Both pilots

**Current:** Unassigned

---

### 1.4 Privacy/Analytics Owner

**Status:** REQUIRED

**Question:** Who approves analytics event definitions and verifies no health content leakage?

**Applies to:** Both pilots

**Current:** Unassigned

---

### 1.5 Commercial Owner

**Status:** RECOMMENDED

**Question:** Who manages vendor relationships, affiliate disclosures, and commercial CTAs?

**Applies to:** Clinician pilot (primary), future commercial expansion

**Default if unassigned:** No commercial CTAs until owner assigned

**Current:** Unassigned

---

## 2. Pilot Scope Decisions

### 2.1 Launch Jurisdiction

**Status:** REQUIRED (Patient pilot)

**Question:** Which geographic jurisdiction for initial launch?

**Options:**
- US-only (recommended default)
- US + Canada
- International (requires crisis resource localization)

**Implications:**
- Crisis resources must be verified for jurisdiction
- Some paths may need jurisdiction-specific guidance
- Analytics may need geographic bucketing

**Recommended:** US-only for initial pilot

---

### 2.2 Clinician Pilot Scope

**Status:** RECOMMENDED

**Question:** What practice types and sizes are in scope?

**Options:**
- Solo and small practice only (1-25 providers) — recommended
- All practice types and sizes
- Specific practice type focus (e.g., therapy-only)

**Recommended:** Solo and small practice (1-25 providers)

---

### 2.3 Patient Age Scope

**Status:** RECOMMENDED

**Question:** Does the patient pilot serve all ages or adults only?

**Options:**
- Adults only (18+)
- All ages with age-appropriate considerations
- Separate child/adolescent path

**Implications:**
- Child/adolescent paths require different clinical review
- May need guardian involvement guidance
- Different crisis resources for minors

**Recommended:** Adults only for initial pilot; add age consideration notes without separate paths

---

## 3. Display and UX Decisions

### 3.1 Fit Score Display

**Status:** RECOMMENDED

**Question:** How should fit/match quality be displayed to users?

**Options:**
- Tiers only: "Excellent / Good / Fair / Poor" (recommended)
- Tiers + numeric: "Excellent (87)"
- Numeric only: "87% fit"

**Implications:**
- Numeric scores imply false precision given evidence quality
- Tiers are more defensible with current metadata provenance

**Recommended:** Tiers only until evidence quality improves

---

### 3.2 Confidence Indicator

**Status:** RECOMMENDED

**Question:** How should evidence/data confidence be shown?

**Options:**
- Separate indicator: "Good fit (limited data)" (recommended)
- Combined: Reduce displayed fit when confidence is low
- Hidden: Don't show confidence

**Recommended:** Separate indicator; never conflate fit with evidence quality

---

### 3.3 Unknown Field Display

**Status:** RECOMMENDED

**Question:** How should unknown/missing data be displayed?

**Options:**
- Explicit: "Unknown" or "Not verified" (recommended)
- Omitted: Don't show fields without data
- Estimated: Show inferred values with disclaimer

**Recommended:** Explicit "Unknown" — never omit or estimate

---

## 4. Evidence and Quality Decisions

### 4.1 Minimum Evidence Threshold

**Status:** RECOMMENDED

**Question:** Can products with unreviewed metadata appear in recommendations?

**Options:**
- Yes, with "Limited confidence" indicator (recommended)
- Yes, but deprioritized in ranking
- No, only reviewed products can be recommended

**Recommended:** Allow with confidence indicator; don't hide useful products due to incomplete review

---

### 4.2 Stale Data Handling

**Status:** RECOMMENDED

**Question:** How old can evidence be before warning?

**Options:**
- 6 months (pricing)
- 12 months (features/capabilities)
- No warnings, just track internally

**Recommended:**
- Pricing: Warning after 6 months
- Features: Warning after 12 months

---

### 4.3 Assessment Routing

**Status:** DEFERRED to Phase 0B

**Question:** Can assessment results influence patient routing?

**Current answer:** NO — assessments are informational only until safety audit completes

**Audit requirements:**
- Scoring contract verified
- Alert behavior tested
- Clinical approval for routing rules
- No score-only routing allowed

---

## 5. Entry Surface Decisions

### 5.1 Clinician Entry Ownership

**Status:** RECOMMENDED

**Question:** Which route is canonical for clinician tools?

**Routes:**
- `/architect` — current practice stack builder
- `/for-clinicians` — marketing/landing page
- `/tools/for-clinicians` — tool catalog

**Options:**
- `/architect` canonical; others redirect (recommended)
- Keep all three with clear differentiation
- Consolidate to single route

**Recommended:** `/architect` is canonical for decision product; `/for-clinicians` is marketing landing; `/tools/for-clinicians` is browse catalog

---

### 5.2 Patient Entry Ownership

**Status:** RECOMMENDED

**Question:** Which route is canonical for patient decision journey?

**Routes:**
- `/find-support` — new decision journey
- `/tools/find-support` — existing tool hub

**Options:**
- `/find-support` for decision; `/tools/find-support` for browse (recommended)
- Single route with mode toggle
- Replace existing hub entirely

**Recommended:** New route `/find-support` for decision journey; existing `/tools/find-support` becomes fallback and browse destination

---

## 6. Commercial Decisions

### 6.1 Affiliate Links During Audit

**Status:** REQUIRED before commercial expansion

**Question:** Should existing affiliate links remain active during disclosure audit?

**Options:**
- Keep active with existing disclosure (if present)
- Add standard disclosure to all affiliate links immediately
- Disable until audit complete

**Recommended:** Keep active; add disclosure audit to Phase 0B scope

---

### 6.2 Commercial Separation

**Status:** REQUIRED (already decided in D-007)

**Question:** Can commercial relationships affect organic recommendations?

**Answer:** NO — this is a non-negotiable invariant (D-007)

---

## 7. Launch Gates

### 7.1 Launch Thresholds

**Status:** RECOMMENDED

**Question:** What metrics must be met before public launch?

**Proposed thresholds:**
- All golden test cases pass
- Manual QA on mobile and desktop
- Keyboard navigation complete
- No P0 bugs in staging
- Clinical review signed off (patient pilot)
- Analytics verified (no health content)

**Decision needed:** Are these sufficient?

---

### 7.2 Pause Thresholds

**Status:** RECOMMENDED

**Question:** What triggers an automatic pause?

**Proposed triggers:**
- Any crisis path failure (patient)
- Any diagnostic language detected (patient)
- Any health content in analytics
- Material ranking errors (clinician)
- User-reported safety concern

**Decision needed:** Are these the right triggers?

---

### 7.3 Rollback Thresholds

**Status:** RECOMMENDED

**Question:** What triggers a full rollback?

**Proposed triggers:**
- Multiple pause triggers in 24 hours
- Clinical reviewer requests rollback
- Legal/compliance concern raised

**Decision needed:** Who can authorize rollback?

---

## 8. Future Decisions (Deferred)

These do not block Phase 0/1/2 but should be tracked:

| Decision | Phase | Description |
|----------|-------|-------------|
| Account/cloud persistence | Phase 6+ | Whether to offer saved sessions across devices |
| Provider data partner | Phase 2+ | Whether to integrate verified availability/insurance data |
| International expansion | Phase 7+ | Additional jurisdictions and crisis resources |
| AI intent parsing | Phase 7 | Whether to use LLM for free-text → structured input |
| Generic chatbot | Never | Explicitly out of scope per roadmap |

---

## Decision Log

Record decisions here as they are made:

| ID | Date | Decision | Made By | Notes |
|----|------|----------|---------|-------|
| — | — | No decisions recorded yet | — | — |

---

*Document version: 0.1.0-draft*
*Created: 2025-09-02*
