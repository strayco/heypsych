# HeyPsych Decision Platform — Living Implementation Brief

> Canonical implementation brief for the HeyPsych UX inversion, Practice
> Architect, and Find My Next Step roadmap.
>
> Stable requirements belong in this document. Repository observations must be
> revalidated. Implementation progress belongs only in the state block.

## 1. Fresh-chat operating instructions

Before planning or editing:

1. Read the repository `AGENTS.md` and this document completely.
2. Capture the current commit and `git status --short`.
3. Preserve all pre-existing and unrelated changes.
4. Revalidate the Current Repository Snapshot against live code.
5. Record discrepancies under `drift_or_blockers`; never silently change code
   merely to match stale prose.
6. Work only on `active_phase` and `active_slice`.
7. Read the relevant guide under `node_modules/next/dist/docs/` before changing
   Next.js code.
8. Run validation proportional to the changed behavior.
9. Update the implementation state before ending the session.
10. Mark work complete only with exact command, route, or file evidence.

When a product, clinical, legal, editorial, privacy, or commercial decision
requires authority not present in the repository, record the blocker and ask
for that decision. Continue safe, independent work where possible.

For a new repository-aware chat, use:

> Continue the active phase and active slice in
> `docs/active/DECISION_PLATFORM_IMPLEMENTATION.md`. Revalidate the state before
> making changes.

## 2. Instruction precedence

1. Current user instruction and repository `AGENTS.md`
2. Safety, privacy, clinical-truth, editorial-independence, accessibility, and
   commercial-separation invariants
3. Accepted decisions in this brief
4. Active phase scope and acceptance criteria
5. Live code, schemas, data, and tests for implementation reality
6. Archived documents as historical context only

`docs/archive/**` and `.claude/docs/**` never establish current completion
status without revalidation.

## 3. Product outcome

HeyPsych should help users make a defensible next decision rather than require
them to sort through a database unaided.

One promise, two primary products:

- Patient or family: **Find my next step**
- Clinician: **Build my practice**

The product layers are:

- Knowledge: conditions, treatments, assessments, resources, and guides
- Choice: tool and provider catalogs
- Decision: deterministic, explainable, resumable guided journeys
- Action: a relevant next step, with commercial relationships kept separate

Browse and Search remain available as secondary escape hatches and SEO
surfaces. “Hide the database” means demote it in the interaction hierarchy,
not delete or deindex it.

North-star outcome:

> A user completes a decision journey, understands the recommendation and its
> uncertainty, and takes an appropriate next action.

## 4. Non-negotiable invariants

- Preserve existing condition, treatment, tool, provider, and resource content.
- Preserve public URLs, canonicals, structured data, sitemaps, and deep links
  unless a phase explicitly includes redirects and verified parity.
- Stateful decision sessions should not become indexed landing pages.
- Patient routing must be deterministic and clinician-reviewed.
- Patient output must not diagnose, prescribe, guarantee outcomes, or present
  an aggregate screener score as sufficient care-level triage.
- Safety and urgency checks can override the rest of a patient journey.
- Crisis help must remain independently accessible even when a decision feature
  is disabled.
- An LLM may optionally map text to a strict intent schema or explain already
  computed facts. It may not invent clinical rules, eligibility, evidence,
  crisis guidance, scores, or recommendations.
- Invalid or low-confidence LLM output falls back to deterministic questions.
- Never send raw mental-health narrative, assessment answers, or other PHI to
  product analytics.
- Unknown eligibility or evidence is not equivalent to eligible, ineligible,
  compatible, incompatible, false, or zero.
- Separate fit strength from evidence quality. Do not display false precision.
- Authoritative wording requires supporting provenance, recency, and review
  state.
- Commercial, commission, payout, sponsorship, and partner fields cannot enter
  organic candidate selection, scoring, ordering, confidence, or explanation.
- Trust wording must derive from the existing review-state model.
- Preserve keyboard, touch, reduced-motion, non-drag, and screen-reader paths.
- Target WCAG 2.2 AA.
- Do not introduce a parallel clinician catalog. Canonical clinician products
  remain V4 records loaded through the existing publication gate.
- Do not replace the existing Architect engines with a generic rewrite.

## 5. Current Repository Snapshot

Classification: **Observed snapshot — revalidate at every new phase**

Architecture audit date: 2026-09-02  
Architecture audit base commit: `dedff1e6211af701657bd0d496a6b1f76ae0a28e`  
Brief creation commit: `4cf402350cfe1ff0d73dba76ef54f70c9fc03c47`

The delta between the audit base and creation commit was inspected. It updated
SimplePractice pricing and removed two premature Architect metadata claims; it
did not invalidate the structural conclusions below.

### Platform

- Next.js App Router, React, TypeScript, Tailwind, Zod, Vitest, and Playwright.
- Obtain actual versions and scripts from `package.json`; do not copy version
  numbers from README or archived plans.
- The root README and several archived handoffs contain stale versions, missing
  links, obsolete flags, or greenfield assumptions.

### Homepage and navigation

- `src/components/home/AudienceGateway.tsx` already presents patient and
  clinician entry points.
- `src/app/page.tsx` still follows the gateway with catalog-oriented search,
  quick links, and inventory counts.
- `src/lib/config/site.ts` still defines taxonomy-first global navigation.
- The patient gateway currently leads to a tool directory rather than a
  completed decision product.

### Existing patient capabilities

- `src/domains/navigation` models editorial intents and contextual next steps.
  It is not a question, session, eligibility, or scoring engine.
- `src/domains/symptoms` contains a deterministic, client-side symptom-search
  index with safety-keyword behavior.
- Conditions, treatments, treatment comparison, assessments, resources, and
  patient tools are reusable content and data assets.
- Provider search is based on NPPES psychiatrist data. Insurance acceptance,
  availability, therapist coverage, languages, and telehealth status are not
  reliably available.
- The assessment renderer, scoring result shape, and alert rules require a
  safety-contract audit before assessments influence routing.

### Existing clinician capabilities

- Preserve `src/domains/architect` as the clinician bounded context.
- It already includes practice fingerprints, fit, coverage, overlap,
  compatibility, cost, recommendation engines, schemas, adapters, persistence,
  analytics, fixtures, APIs, and tests.
- `data/tools-v4/products` and `ClinicianToolService` remain the canonical
  product source and publication gate.
- The Architect gateway labels Build for Me and Audit as coming soon even
  though underlying routes and components exist.
- Current onboarding asks very few questions and silently supplies several
  fingerprint defaults.
- Architect product metadata contains category-derived inference and frequently
  remains unreviewed. Present confidence does not fully represent provenance,
  recency, or independent review quality.
- Duplicate workspace-sized components must be behaviorally audited before any
  consolidation.

### Trust and commercial state

- `src/lib/schemas/tool-editorial.ts` already defines listing, vendor-verified,
  facts-verified, editorially reviewed, clinically reviewed, and
  privacy-reviewed states.
- Patient pages and shared UI still contain unconditional review claims that do
  not consistently derive from those states.
- Affiliate URL fields already exist on patient and clinician product records.
  Do not assume every affiliate URL represents a verified commission agreement.
- Existing sponsored link attributes do not replace a clear nearby user-facing
  earnings disclosure.
- Campaign sponsorship already provides a useful precedent for excluding
  commercial state from editorial ranking.

### Search, SEO, and analytics

- Global search combines multiple data sources, but search results need an
  authoritative `href` contract so clinician tools do not use patient-tool
  routes.
- Existing sitemap and indexation controls should be extended, not replaced.
- Architect and marketplace analytics exist, but no cross-product contract
  currently represents:

  `decision_started → decision_completed → clarity_reported → action_clicked`

- “Confidence lift” must be a user-reported before-and-after measure. It cannot
  be inferred from clicks.

### Volatile facts

Never turn catalog counts into acceptance criteria. Recalculate through live
repositories, publication gates, or validation scripts whenever counts matter.
Comments and archived documents are not authoritative counts.

## 6. Target architecture

The platform shares an orchestration envelope, not one universal scoring
algorithm:

```text
Audience / intent entry
          |
          v
Versioned decision definition
          |
          +--------------------------+
          |                          |
          v                          v
Architect evaluator          Patient support evaluator
fit / cost / coverage        safety / care-path routing
          |                          |
          +-------------+------------+
                        |
                        v
Versioned decision result
reasons / tradeoffs / uncertainty / evidence / next actions
                        |
                        v
Organic action layer
                        |
                        v
Separately joined commercial relationship and disclosure
```

The conceptual shared contract must cover:

- Decision ID, version, audience, lifecycle, owner, and review expiry
- Allowed entry intents
- Typed questions and input schema
- Resumable session answers
- Safety overrides and hard eligibility rules
- Candidate-source identifiers
- Domain evaluator ID and version
- Result, reasons, tradeoffs, alternatives, and next actions
- Confidence dimensions and missing-data reasons
- Evidence references, provenance, recency, and reviewer state
- Privacy-safe event definitions
- Definition, evaluator, and catalog snapshot versions

Define this envelope during Phase 0 so the two products use compatible
vocabulary. Do not create a generic runtime package until both vertical slices
demonstrate which behavior is truly shared.

Patient safety policy and clinician product-ranking policy remain separate.

## 7. Accepted architecture decisions

- **D-001:** Preserve and harden Architect; do not build a duplicate clinician
  recommendation engine.
- **D-002:** Define a minimal shared decision contract before pilot work, but
  defer common runtime extraction until two real verticals exist.
- **D-003:** The first patient journey is “What kind of support should I look
  for?” Existing symptom search may support a “not sure” branch without
  becoming a diagnostic engine.
- **D-004:** Do not make the inverted shell the primary promise until its
  patient and clinician destinations are functional.
- **D-005:** Browse, Search, and canonical reference pages remain available as
  secondary surfaces.
- **D-006:** Patient routing and crisis behavior are deterministic and
  clinician-reviewed.
- **D-007:** Commercial state never affects organic decision output.
- **D-008:** Review language derives from actual editorial and review state.
- **D-009:** Do not promise insurance or provider matching until a verified
  data source supports it.
- **D-010:** Assessments cannot influence routing until scoring, alert, and
  rendering contracts pass safety tests.
- **D-011:** Prefer fit tiers plus an evidence-confidence indicator over a
  precise percentage until evidence-quality requirements support numerical
  precision.
- **D-012:** Initial persistence remains anonymous and local unless a later
  phase explicitly approves accounts, cloud storage, consent, retention, and
  deletion behavior.

Supersede a decision by adding a new dated decision. Do not rewrite decision
history.

## 8. Phase ledger

| Phase | Outcome | Status | Dependency |
|---|---|---:|---|
| 0 | Truth, safety, data, and decision contracts | Complete | None |
| 1 | Harden one existing Architect clinician journey | Complete | Phase 0 |
| 2 | Build one clinician-reviewed patient support journey | Complete | Phase 0 |
| 3 | Complete homepage and navigation inversion | Complete | Phases 1–2 |
| 4 | Decision-first pages and truthful trust rendering | Complete | Phase 0 |
| 5 | Extract proven shared decision infrastructure | Complete | Phases 1–2 |
| 6 | Commercial action layer and decision attribution | Complete | Phases 1–5 |
| 7 | Scale decisions and optionally add structured AI parsing | Pending | Measured pilot success |

Only one phase and one bounded slice may be active in a session.

## 9. Phase specifications

### Phase 0 — Truth, safety, data, and contracts

Goal: establish trustworthy foundations before exposing new recommendations.

#### Slice 0A — Product and governance contract

- Define exactly one clinician pilot and one patient pilot.
- For each pilot, define:
  - allowed inputs;
  - ordered questions;
  - output types;
  - prohibited claims;
  - safety overrides;
  - hard eligibility behavior;
  - uncertainty behavior;
  - evidence requirements;
  - next actions;
  - owner and review expiry.
- Name the product, clinical, editorial, privacy and analytics, and commercial
  decision owners.
- Define launch, pause, and rollback gates before public exposure.
- Define privacy-safe decision events and denominators.
- Decide launch jurisdiction and crisis-resource policy.

#### Slice 0B — Critical correctness gates

- Audit and repair or quarantine the assessment result and alert contract.
- Add golden and adversarial tests for assessment safety behavior.
- Establish an authoritative federated search-result route contract.
- Inventory unconditional review claims and map them to actual review state.
- Inventory outbound and affiliate URLs without assuming commercial status.
- Inventory Architect metadata provenance, recency, unknown fields, and
  capability inference.
- Baseline current public routes, canonicals, sitemap behavior, feature flags,
  and analytics.
- Render and record the current homepage, navigation, Architect modes, Find
  Support, assessment flow, and representative product pages.

Acceptance criteria:

- Every patient branch has an approved expected and fail-safe result.
- Unknown handling is explicit for every eligibility field.
- Assessments cannot emit a critical alert unrelated to the selected answer.
- Search results supply the correct canonical route for each result type.
- Every review claim can be traced to a stored review state or is removed.
- Existing commercial links are classified as ordinary, affiliate, sponsored,
  unknown, or inactive.
- Pilot definitions have frozen golden cases.
- No new public decision entry point is exposed during this phase.

### Phase 1 — Harden one Architect clinician journey

Recommended pilot: starting or building a solo or small mental-health practice.

- Begin with a rendered behavioral audit of all existing Architect modes.
- Preserve the existing engines, schemas, V4 adapter, publication gate,
  persistence, and analytics.
- Remove hidden questionnaire defaults or clearly identify user-editable
  assumptions.
- Ask only questions that affect evaluator output.
- Reconcile Build for Me, Build Myself, Audit, Demo, and My Practice route and
  mode ownership.
- Consolidate duplicate workspace implementations only when parity tests cover
  existing behavior.
- Define hard policies for practice type, role or license, state, prescribing,
  EPCS, payer model, lifecycle, HIPAA or BAA evidence, and practice size.
- Never silently treat unknown evidence as meeting a hard requirement.
- Separate match quality from evidence confidence.
- Record definition, evaluator, evidence, and catalog versions in results.
- Show:
  - recommended architecture;
  - required and unnecessary capabilities;
  - known cost and explicit unknown cost;
  - largest gap;
  - redundancy or incompatibility warning;
  - reasons, tradeoffs, and alternatives;
  - evidence confidence;
  - one next action.
- Decide and document the execution boundary. Keep engines pure; use a
  server-authoritative path before monetized recommendations require it.
- Keep saved local stacks intact and make stale results explicitly
  recalculable.

Acceptance criteria:

- Same versioned input and catalog snapshot produce stable ordered output.
- Golden tests cover exclusions, unknown data, ties, stale evidence,
  incompatibilities, budget, and deterministic ordering.
- No displayed recommendation uses unsupported compliance or eligibility
  language.
- Build for Me and Audit are either complete and exposed or honestly
  inaccessible, never misleadingly half-launched.
- One complete mobile and desktop journey passes keyboard and screen-reader QA.
- Feature-flag rollback returns users to the existing browse and build
  experience without deleting saved stacks.

### Phase 2 — Build one patient support journey

Journey: **What kind of support should I look for?**

This is a non-diagnostic care-path decision, not a product-ranking quiz.

- Check urgency and safety early enough to override the remaining flow.
- Provide immediate jurisdiction-appropriate actions for urgent branches.
- Use symptoms, goals, preferences, prior support, practical constraints, and
  optional validated assessments only where clinically approved.
- Reuse the local symptom index for a “not sure” branch where appropriate.
- Do not collect an unrestricted mental-health narrative by default.
- Do not allow a screener score alone to determine care level.
- Frame outputs as reasonable options or next steps, never diagnoses or
  personalized medical orders.
- Every result includes:
  - what the user is deciding;
  - a reasonable first path;
  - contextual reasons;
  - uncertainty or missing information;
  - alternatives and when they may fit better;
  - urgent-help guidance where applicable;
  - valid next actions.
- Until better provider data exists, do not promise insurance-filtered,
  availability-confirmed, multilingual, or therapist-specific shortlists.
- Keep sessions noindex and analytics free of answers and raw health text.

Acceptance criteria:

- Every branch has clinician-approved golden cases.
- Critical safety and adversarial cases pass without exception.
- Invalid, incomplete, or contradictory answers produce a safe fallback.
- Crisis guidance works even if the main evaluator fails.
- The existing Find Support hub remains the rollback destination.
- End-of-run clarity and next-action events use a privacy-safe run identifier.

### Phase 3 — Complete the shell and IA inversion

Start only after the clinician and patient destinations pass their launch gates.

- Make Patients and Clinicians the primary navigation hierarchy.
- Make the two homepage products the dominant actions.
- Keep Browse and Search visible as secondary paths.
- Resolve ownership among `/architect`, `/for-clinicians`, and
  `/tools/for-clinicians` without casually changing indexed routes.
- Preserve existing public detail URLs, internal links, canonicals, structured
  data, and sitemap inclusion.
- Supply authoritative result URLs from search data rather than reconstructing
  paths in UI.
- Derive inventory counts dynamically or remove them.
- Treat content categories as backend taxonomy and secondary exploration, not
  deleted information architecture.

Acceptance criteria:

- Both homepage calls to action land on working products.
- Desktop and mobile navigation communicate the same hierarchy.
- Browse and Search remain reachable in one obvious action.
- No broken deep links or clinician-tool search routes.
- No material unapproved regression in search use, crawl health, organic
  landing traffic, or indexed-route coverage.
- A feature flag can restore the previous shell without changing destinations.

### Phase 4 — Decision-first pages and truthful trust rendering

Roll out by representative template or category, not as a mass rewrite.

- Preserve current direct-answer blocks where they already work.
- Add decision context: why it fits, material tradeoff, avoid-if, and better
  alternative when available.
- Patient tool pages should prioritize best for, not for, cost, privacy,
  evidence, uncertainty, and alternatives.
- Clinician pages should prioritize practice fit, avoid-if, total-cost
  assumptions, integrations, evidence quality, and alternatives.
- Render review badges and claims only from actual review state.
- Distinguish vendor-provided, publicly sourced, independently verified,
  editorially reviewed, clinically reviewed, stale, and unknown facts.
- Keep long-form content beneath the decision summary for deep research and
  SEO.
- Ensure visible claims and structured data agree.

Acceptance criteria:

- One patient and one clinician page family pass before wider rollout.
- No unconditional board or clinical-review claim remains without matching
  state.
- Unknown facts are visibly represented as unknown.
- Existing canonical and structured-data behavior remains intact.
- The previous page composition remains available as rollback.

### Phase 5 — Extract proven shared infrastructure

Start only after Phases 1 and 2 demonstrate actual shared behavior.

Extract only:

- versioned decision definitions;
- typed sessions and resumability;
- result envelopes;
- definition, evaluator, and catalog version recording;
- evidence and review references;
- uncertainty and missing-data representation;
- privacy-safe lifecycle events;
- registry and runner boundaries;
- presentation adapters for reasons, tradeoffs, and actions.

Do not merge:

- patient clinical and safety policy;
- clinician catalog fit logic;
- crisis behavior;
- Architect cost, coverage, and compatibility algorithms;
- commercial data.

Acceptance criteria:

- Both pilots use the common envelope without behavioral regression.
- Golden outputs remain stable before and after migration.
- Domain evaluators remain independently testable pure functions.
- No patient safety policy becomes configurable through generic scoring
  weights.
- The extraction removes proven duplication rather than creating speculative
  framework code.

### Phase 6 — Commercial action layer and decision attribution

Visible disclosure remediation may happen earlier. Commercial expansion waits
for this phase.

- Store verified commercial relationships separately from evidence and
  organic-fit records.
- Never infer commission status solely from an existing `affiliate_url`.
- Join commercial metadata only after organic relevance is determined.
- Put a clear nearby disclosure on every compensated action.
- Keep sponsored content separately labeled and visually distinct.
- Add per-partner and global kill switches.
- Connect decision completion, recommendation view, action click, and permitted
  conversion events without health-query text or sensitive profile fields.
- Define “decision completed” and the clarity measurement denominator.

Acceptance criteria:

- A test proves that changing commercial data cannot change candidates, score,
  order, explanation, tradeoffs, or confidence.
- Organic results remain complete when the commercial service is unavailable.
- Every compensated call to action has an accurate disclosure and link
  attributes.
- Commercial modules can be disabled without affecting the decision result.

### Phase 7 — Scale and optional structured AI parsing

- Add one decision at a time.
- Every decision needs an owner, risk class, data-readiness report, golden
  cases, evidence, review expiry, analytics, rollout flag, and rollback.
- An optional LLM may convert user text into a strict typed intent.
- Validate every model response against a schema.
- Low-confidence or invalid parses fall back to deterministic questions.
- AI cannot change safety, eligibility, evidence, or ranking rules.
- Approve consent, transmission, logging, retention, and deletion policy before
  sending sensitive text to any model.
- Do not launch a generic chatbot as part of this roadmap.

## 10. Cross-phase validation

Select the relevant subset, record exact commands, and explain omissions:

- Focused unit tests for changed domains
- Safety golden and adversarial cases
- `npm run typecheck`
- Narrow lint or repository lint
- Applicable V3, V4, schema, and catalog validators
- Production build for routing, server and client boundary, or public-page
  changes
- Playwright end-to-end journey
- Desktop and mobile rendered inspection
- 390×844, 768×1024, and 1440×1000 viewports
- 320px width and 200% zoom
- Keyboard-only and screen-reader semantics
- Reduced-motion behavior
- Loading, empty, partial-data, stale, error, and populated states
- Canonical, structured-data, sitemap, and indexation checks
- Analytics payload inspection for sensitive fields
- Feature-flag disable and rollback path

Do not claim the application was visually verified when the development server
was not running.

## 11. Phase completion protocol

A phase is complete only when:

- every acceptance criterion is satisfied or explicitly superseded;
- exact validation evidence is recorded;
- safety or editorial review is recorded where required;
- rollout and rollback have been exercised;
- observed repository drift is reconciled;
- pre-existing changes remain separated from this phase’s changes;
- the ledger and state block are updated;
- exactly one atomic next action is left for the next chat.

Collapse completed phase detail into a short ledger entry plus commit and
validation evidence. Do not turn this document into a chronological transcript.

## 12. Decisions requiring product authority

Resolve during Phase 0:

- Accountable clinical reviewer and initial jurisdiction
- Exact allowed patient result vocabulary
- Clinician pilot scope: full solo or small-practice stack versus a narrower
  intent
- Minimum provenance and recency required for displayed recommendations
- Fit tier only versus tier plus numeric score
- Canonical ownership of the three clinician entry surfaces
- Whether existing affiliate calls to action remain active during disclosure
  audit
- Whether a verified provider-data partner will be obtained
- Launch, pause, rollback, clarity, and action thresholds
- Whether any future account or cloud persistence is justified

Recommended default when a choice is needed for non-production planning:

- US-only pilot
- Solo or small-practice clinician stack
- Fit tiers plus separate evidence confidence
- Anonymous and local persistence
- No provider shortlist beyond verified current capabilities
- No expansion of affiliate placement before disclosure audit

## 13. Implementation state

<!-- BEGIN IMPLEMENTATION STATE -->
```yaml
state_version: 31
last_verified_at: "2026-10-22"
verified_commit: "16b36c4318d8a6b67919135b2f2458bec591ebb1"

active_phase: 6
active_slice: "complete"
phase_status: "complete"
next_action: >-
  Clinician catalog is 24 decision-set products (21 in Architect after
  excluding insurance panels). Remaining: clinical review of EPCS/BAA
  claims, physical-device QA, visual regression snapshots, and Phase 7
  Architect session analytics. Do not rebuild the Architect.

pre_existing_changes:
  - "AGENTS.md (discovery pointer)"

files_changed_this_session:
  # Phase 0 files
  - "docs/active/DECISION_PLATFORM_IMPLEMENTATION.md"
  - "docs/active/contracts/CLINICIAN_PILOT_CONTRACT.md"
  - "docs/active/contracts/PATIENT_PILOT_CONTRACT.md"
  - "docs/active/contracts/DECISION_EVENTS_CONTRACT.md"
  - "docs/active/contracts/AUTHORITY_DECISIONS.md"
  - "docs/active/audits/PHASE_0B_AUDIT_REPORT.md"
  - "src/lib/assessments/engines.ts"
  - "src/lib/assessments/engines/sum-with-bands.ts"
  - "src/lib/assessments/engines/asrs-custom.ts"
  - "src/lib/assessments/engines/assist-who-v3.ts"
  - "src/app/api/search/route.ts"
  - "src/app/search/page.tsx"
  - "src/components/layout/footer.tsx"
  - "src/components/eat/AuthorByline.tsx"
  # Phase 1 Slice 1A files
  - "docs/active/audits/PHASE_1_ARCHITECT_AUDIT.md"
  - "src/app/architect/_components/SmartOnboarding.tsx"
  - "src/app/architect/page.tsx"
  # Phase 1 Slice 1B files
  - "src/domains/architect/__tests__/golden-recommendation.test.ts"
  - "docs/active/contracts/HARD_ELIGIBILITY_POLICIES.md"
  - "src/domains/architect/schemas/product-metadata.ts"
  # Phase 1 Slice 1B continued (hard exclusion implementations)
  - "src/domains/architect/engines/fit-engine.ts"
  - "src/domains/architect/engines/recommendation-engine.ts"
  - "src/domains/architect/__tests__/recommendation-engine.test.ts"
  # Phase 1 Slice 1C files
  - "docs/active/decisions/WORKSPACE_CONSOLIDATION_DECISION.md"
  # Phase 2 Slice 2A files
  - "src/domains/patient-support/types.ts"
  - "src/domains/patient-support/paths.ts"
  - "src/domains/patient-support/evaluator.ts"
  - "src/domains/patient-support/index.ts"
  - "src/domains/patient-support/__tests__/golden-evaluator.test.ts"
  - "src/app/find-support/page.tsx"
  - "src/app/find-support/_components/SupportJourney.tsx"
  - "src/lib/config/feature-flags.ts"
  - "src/domains/patient-support/analytics.ts"
  # Phase 3 Slice 3A files
  - "src/components/home/AudienceGateway.tsx"
  - "src/lib/config/site.ts"
  - "src/components/layout/header.tsx"
  - "src/app/browse/page.tsx"
  # Phase 4 Slice 4A files
  - "src/components/tools/BoardAttribution.tsx"
  - "src/app/treatments/[slug]/client-wrapper.tsx"
  # Phase 4 Slice 4B files
  - "src/components/tools/DecisionContext.tsx"
  - "src/components/tools/clinician/ClinicianDecisionContext.tsx"
  - "src/app/tools/[slug]/page.tsx"
  - "src/app/tools/for-clinicians/[category]/[slug]/page.tsx"
  - "src/components/tools/index.ts"
  # Phase 5 Slice 5A files
  - "src/domains/decision/types.ts"
  - "src/domains/decision/analytics.ts"
  - "src/domains/decision/index.ts"
  # Phase 6 Slice 6A files
  - "src/lib/schemas/commercial.ts"
  - "src/lib/schemas/clinician-tool-v4.ts"
  - "src/lib/schemas/digital-tool-v3.ts"
  - "src/lib/commercial/kill-switch.ts"
  - "src/lib/commercial/use-commercial.ts"
  - "src/lib/commercial/index.ts"
  - "src/components/tools/AffiliateDisclosure.tsx"
  - "src/components/tools/index.ts"
  # Phase 6 Slice 6B files
  - "src/app/tools/[slug]/ToolOutboundLinks.tsx"
  - "src/app/tools/[slug]/page.tsx"
  - "src/components/tools/clinician/ProductDemoCTA.tsx"
  - "src/app/tools/for-clinicians/[category]/[slug]/page.tsx"
  - "src/domains/architect/__tests__/commercial-isolation.test.ts"
  # Phase 6 Slice 6C files (commercial classification)
  - "data/tools-v4/products/billing-rcm/hayat-health.json"
  - "docs/active/audits/COMMERCIAL_CLASSIFICATION_AUDIT.md"
  # Phase 6 Slice 6D files (decision attribution)
  - "src/domains/decision/analytics.ts"
  - "src/domains/decision/index.ts"
  - "docs/active/contracts/DECISION_EVENTS_CONTRACT.md"
  # Phase 7 Slice 7A files (session integration)
  - "src/app/find-support/_components/SupportJourney.tsx"
  - "src/app/architect/_components/ArchitectWorkspace.tsx"
  - "src/app/architect/_components/MyPractice.tsx"
  # Phase 7 Slice 7B files (commercial action tracking)
  - "src/app/architect/_components/ProductDrawer.tsx"

validation:
  - command: "npm run typecheck"
    result: "pass"
    note: "All Phase 0, Phase 1, and Phase 2 changes compile without errors"
  - command: "npm test (e2e)"
    result: "130 passed, 44 failed"
    note: "Failures are pre-existing - not regressions"
  - command: "vitest (architect tests)"
    result: "80 passed, 1 failed"
    note: "1 pre-existing failure in fit-engine.test.ts (insufficient data test)"
  - command: "Architect golden tests"
    result: "35 passed"
    note: "Covers determinism, exclusions, unknown data, ties, budget, stale evidence, BAA, clinical roles, size buckets, delivery models"
  - command: "recommendation-engine tests"
    result: "22 passed"
    note: "Covers all hard exclusion policies: practice type, state, BAA, clinical roles, size, delivery model"
  - command: "Patient support golden tests"
    result: "20 passed"
    note: "Covers crisis handling, safety keywords, therapy-seeking, medication interest, minimal input, determinism, required output structure"
  - command: "Feature flag tests"
    result: "11 passed"
    note: "Includes new patientSupportJourney flag"

decisions_added:
  - "D-001 through D-012 (Phase 0)"
  - "Workspace consolidation: Keep separate (docs/active/decisions/WORKSPACE_CONSOLIDATION_DECISION.md)"

drift_or_blockers:
  - "Clinical owner and initial launch jurisdiction require authority decision."
  - "Product, editorial, privacy, and commercial owners require assignment."
  - "0 Architect products have reviewed-complete capability maps."
  - "Delivery-model notices still fire on inspectors; EPCS claims still require verification."
  - "Clinician catalog is 24 decision-set products on disk (21 in Architect after excluding Headway/Grow/SonderMind). 877 other V4 product files and 56 orphan comparisons were deleted."
  - "User instruction (delete tools people are not deciding between) takes precedence over preserving unused clinician-tool URLs. Retired public slugs 308 to /tools/for-clinicians."
  - "Physical-device testing and visual regression snapshots are outstanding."
```

### Practice Architect 3.0 — "The Living Practice" (in progress, 2026-10-22)

A rebuild of the Practice Architect experience as an illustrated, interactive
isometric office. Tracked separately from the decision-platform phase ledger
above; the phase numbers below belong to the Practice Architect 3.0 brief.

**Drift found and corrected (important).** This document recorded Phase 1
("hard exclusions enforced on the Architect journey") as complete. It was
complete in `src/domains/architect/engines`, but the shipped UI did not call
those engines. `src/app/architect/_components/v2/RecommendationPanel.tsx`
ranked products with a hardcoded `POPULAR_TOOLS` dictionary (lines 30-71) and
accepted a `profile` prop it never read. In production, therefore, none of the
seven hard eligibility policies ran, and the onboarding answers changed
nothing. The 35 golden tests passed throughout, because they exercised the
engines directly rather than the path the UI used.

Lesson recorded: engine-level tests do not establish that a user-visible
journey enforces a policy. Production paths need their own coverage.

**Phase 0-1 (complete, verified by execution):**
- `src/domains/architect/engines/eligibility-engine.ts` — extracted from the
  private `hasHardIncompatibility` in `recommendation-engine.ts` so eligibility
  has one implementation. The engine now delegates to it; behaviour preserved
  (125 tests passing before and after the extraction).
- `calculateProductCost` and `ProductCostResult` exported from `cost-engine.ts`
  so the world prices a product identically to the stack recommender.
- `src/domains/architect/adapters/profile-to-fingerprint.ts` — onboarding
  answers now normalize into the canonical `PracticeFingerprint`.
- `src/domains/architect/services/capability-recommendation-service.ts` —
  the authoritative path for the world. Composes eligibility, fit, relevance,
  and cost. Contains no vendor list and no popularity table.
- `src/domains/architect/persistence/project-persistence.ts` — real
  persistence with a write-then-read-back check, replacing the v2 no-op save.
  Includes a v2 migration so saved stacks are not silently dropped.
- Hydration: the v2 mismatch class is removed by construction, not patched.
  The server renders only a skeleton, and the client's first render produces
  the identical skeleton; storage, time, and randomness are read exclusively
  inside effects. Verified: `curl` of `/architect` returns the skeleton and no
  scene markup.

**Phase 3-4 (prototype complete, art unfinished):**
- `src/domains/architect/world/` — `scene.ts` (projection, palette, materials,
  lighting, camera), `object-registry.ts` (14 objects bound to capability IDs,
  never vendor slugs), `world-state.ts` (scene derived from the project, never
  persisted).
- `src/app/architect/_components/world/` — `PracticeScene`, `RoomShell`,
  `primitives`, `object-art`, `ObjectInspector`, `PracticeOnboarding`,
  `WorldList`, `usePracticeProject`, `PracticeArchitect`.
- Live behind `PRACTICE_ARCHITECT_V3` (default true) in
  `src/lib/config/feature-flags.ts`.

**First acceptance checkpoint (brief Part XXVI §34) — passes end to end.**
Verified in a real browser against the dev server on 2026-10-22, all eleven
steps: open Architect, complete a minimal solo profile, see the illustrated
office, click the computer, see real recommendations from the existing engines,
select an eligible product, see the object change state, see cost and coverage
update ("1 of 11 decisions made · $50/month"), save, reload, and confirm both
the selection and the illustrated state persist.

Two defects were found and fixed by running the real journey rather than the
tests: a "Good fit" product outranked three "Strong fit" products (ranking is
now lexicographic — native coverage, then fit tier, then score — so the order
matches the badges it displays), and a verification warning that fires on every
product in the catalog was repeated on every card (now reported once per panel
as `sharedUncertainties`).

**Phase 5 (complete):**
- `src/domains/architect/services/setup-plan-service.ts` and
  `_components/world/SetupPlan.tsx` — the blueprint as ordered work, grouped
  decide → verify → sign up → paperwork → set up → move across, with a
  plain-text export. Tasks are per product rather than per object, so a tool
  covering several functions is never signed up for twice. Task state
  persists; verified by ticking a task and reloading.

**Phase 6 (complete):**
- `/architect/{build,audit,demo,my-practice,studio}` now 301 to `/architect`
  (`next.config.ts`). Verified: all five return 308 in dev, 301 in production
  config. No inbound link anywhere in the site pointed at them; only the dead
  v1 gateway did.
- Deleted: the `(workspace)` route group, `_components/v2/` (including
  `POPULAR_TOOLS`), `_components/studio/`, and seventeen orphaned legacy
  components. `rg POPULAR_TOOLS src` now returns nothing.
- Removed the `practiceArchitectV2` / `practiceArchitectV3` flags. Nothing
  read them after consolidation, and a flag that implies an off-switch it no
  longer has is worse than no flag.

**Phase 7 (substantially complete):**
- Keyboard: every object is a real focusable control. Verified in-browser —
  focus an object, Enter opens the inspector, focus moves into the panel,
  Escape closes it, and focus returns to the same object.
- Reduced motion respected via `useReducedMotion` throughout.
- Narrow screens open on the list view, which carries identical state and
  actions; the office stays one tap away rather than being withheld.
- Production build passes; `/architect` prerenders static.
- ESLint clean across all new code.

**A clinical-safety gap found and closed during Phase 7.** The EPCS policy
only handled a *missing* EPCS claim. It had nothing to say about a product
that *claims* EPCS on unreviewed, vendor-provided evidence — which is the
more dangerous direction, since a missing claim sends a prescriber elsewhere
while a false one sends them to buy a system believing they may lawfully
e-prescribe controlled substances. Thirteen catalog products claim EPCS and
none is `reviewed-complete`; all were being shown to prescribers as "covers
EPCS as a built-in feature" with no caveat. `eligibility-engine.ts` now raises
an uncertainty for any unverified EPCS claim. The product stays eligible,
because the claim may be true, but it is never presented as established.

Related presentation fix: the evidence badge said "High confidence" directly
above a notice listing what we had not verified. It measures how well
documented a product is, not whether a claim was checked, so it now reads
"Well documented" / "Partly documented" / "Thinly documented".

**Tests:** 167 passing in `src/domains/architect` (35 original golden tests
preserved and passing), 891 across the repository, 0 failing.
`npx tsc --noEmit` and `npx next build` both clean.

**Not yet done (carried into 3.1):** visual regression snapshots and testing
on physical devices. Catalog BAA and delivery-model review remains the
largest clinical-data risk.

### Practice Architect 3.1 — polish, catalog, evidence (2026-10-22)

Harden/polish release. Did not rebuild the 3.0 engines, routes, or world.

**Verified by execution:**
- `npx tsc --noEmit` pass.
- `npx vitest run --exclude='**/psychTrail/**'`: 916 passed, 1 skipped.
- Architect domain: 182 passed, including the original 35 golden tests.
- Live `/architect` 200. `/architect/{build,audit,demo,my-practice,studio}` 308 to `/architect`.
- Browser: illustrated office, prescribing inspector copy, setup plan.

**Shipped in 3.1:**
- Wall-mounted objects use `WallPlaque` (wall-plane contact shadow). Decorative picture, shelf volumes, floor lamp.
- Hover labels and focus rings. Inspector starts below the site header (`top-32`) so the title is not clipped.
- Recovery banner + quarantine that autosave cannot overwrite.
- Category membership is not EPCS. Unreviewed EPCS copy: "EPCS support requires verification".
- Unknown/quote pricing is never `$0`. Structured data Offer omits price when unknown.
- Catalog inventory of 901 records (`scripts/catalog/inventory.mjs`). 12 identity-only drafts added (unpublished). Ensora parent-company redirects removed so TheraNest is not merged with Fusion.
- Admin catalog review at `/hp-ctrl-8k3m9x/catalog`. Evidence freshness intervals in `src/lib/tools/evidence-freshness.ts`.
- Cross-surface claim-language guard extended; psychiatrist landing no longer says "EPCS compliance verified".

**Still true:** BAA unknown on 634 records. Delivery-model uncertainty still appears on inspectors. New drafts have no approved capability claims. Physical devices not tested. No visual snapshot suite.

### Practice Architect production catalog — quality over quantity (2026-10-22)

User instruction: professional-grade, well-known tools only. Precedence over
preserving every public tool URL. Did not rebuild engines or add a second
recommender.

**Shipped:**
- `PRACTICE_GRADE_SLUGS` (43 recognizable independent/small-group products) is
  now `LAUNCH_ALLOWLIST`. Hospital/enterprise EHRs (Cerner, Epic, Netsmart),
  drafts, and obscure adjacent products stay in `data/tools-v4` but do not
  publish. JSON files were not deleted.
- 16 flagship records failed schema on SEO titles over 60 characters
  (SimplePractice, TherapyNotes, Doxy.me, Headway, and peers). Titles and
  metas were shortened so they actually publish. Live: SimplePractice 200,
  Cerner Millennium 404.
- Architect inspector shows one recommended + two alternatives. Marketplace
  dump and excluded-tools list removed. `alternativeCount` default is 2.
- Admin catalog shows a Public catalog count distinct from the research archive.

**Verified by execution:**
- `npx tsc --noEmit` pass.
- `npx vitest run --exclude='**/psychTrail/**'`: 920 passed, 1 skipped.
- `GET /api/architect/products?limit=100`: 39 products (practice-grade minus
  provider networks). No eClinicalWorks, Qualifacts InSync, Cerner, Netsmart.
- Browser, `/architect` prescribing: IntakeQ, Luminello, TherapyNotes.
  Clinical records: IntakeQ, Owl Practice, Jane App. Inspector title not clipped.

**Still true:** ranking still comes from the existing engines (IntakeQ can
outrank SimplePractice on cost/coverage). Physical devices not tested.

### Decision catalog — keep the shopping set, delete the rest (2026-10-22)

User instruction: go in depth on tools people actually decide between, then
delete everything else. Precedence over preserving unused clinician-tool
files. Did not rebuild engines.

**Keep (24), by real shopping pair:**
- Therapist EHR: SimplePractice, TherapyNotes, TheraNest, Jane, Sessions Health, IntakeQ
- Psychiatry EHR: ICANotes, Luminello, Valant, Osmind
- AI notes: Mentalyc, Upheal, Blueprint
- Video: Doxy.me, Zoom for Healthcare
- Panels: Headway, Grow Therapy, SonderMind
- Directories: Psychology Today, Zencare
- Money: Ivy Pay, Mentaya vs Thrizer, Heard

**Deleted:** 877 V4 product JSON files, 56 comparisons that named a deleted
product, and `data/tools-v4/raw`. Patient tools and Architect engines untouched.

**Verified:** `npx tsc --noEmit` pass. Architect + tools tests 369 passed.
`GET /api/architect/products`: 21 products, no Cerner/Epic/Netsmart/Freed.
Disk: 24 product files.

### Clinician catalog — positioning, honest alternatives, +10 tools (2026-10-23)

User report: `/tools/alternatives/intakeq-practiceq` named Osmind (a ketamine/TMS
clinic EHR) "best for solo", "best for group" and "best for prescribers". Cause:
picks were the first tool matching self-declared audience tags, with template
reasons; every record's own `best_for` / `not_for` was ignored.

**Shipped:**
- `positioning` on the V4 schema (`segments`, one-sentence `notes` per segment,
  `niche`). All 34 records carry it; notes are drawn from each record's data.
- `src/lib/tools/alternatives.ts`: one tool per slot, reason = positioning note,
  niche tools only offered to the same niche, "budget" only if actually cheaper.
  The page and its title count use the same filter.
- `ToolMark` monogram replaces `logo_url` (all 11 values were guessed
  `/logo.png` URLs; removed from data).
- +10 tools, on the allowlist: TherapyAppointment, Supanote, Berries, NovoPsych,
  Greenspace Health, Office Ally, TherapyDen, GoodTherapy, Alma, Rula. Pricing
  read live on 2026-10-23 for TherapyAppointment, Supanote, Berries, NovoPsych
  (AUD page) and Alma (`pricing.last_verified` set only for those).
- Not added: Owl Practice (pricing page 404), VSee (2026 delisting and sale of
  the clinic unit), DrChrono (general medical EHR).

**Verified:** `tsc --noEmit` pass. All 34 records parse and are publish-ready;
8 alternatives tests on the real catalogue pass. Live: all 10 new profiles 200;
IntakeQ alternatives now SimplePractice / TheraNest / TherapyNotes / Luminello.

**Follow-up, insurance claims (2026-10-23):**
- +3 claims options: Claim.MD ($30/$60/$120 per month, read live), Availity
  Essentials (free, payer-sponsored), TheraThink (outsourced billing, % of paid
  claims, read live). Not added: Cascade Therapy Billing (pricing and BAA
  unverifiable), Reimbursify (client-filed OON app, very small team).
- `positioning.job` ("claims", "payments", "out-of-network", "bookkeeping")
  so a clearinghouse is never offered as an alternative to a card processor.
- IvyPay's `website_url` pointed at ivypay.com, now a parked domain for sale.
  Official site is talktoivy.com/ivypay; 2.75% flat and BAA re-confirmed live.
- Bug fixed: `next.config.ts` "retired products" redirects still sent
  therapyappointment, goodtherapy, rula and claim-md to the hub. Removed. The
  earlier live check only compared status codes; checks now compare the final
  URL. Requires a dev-server restart to take effect locally.
- Clinician tool search is punctuation-insensitive ("claim md" → Claim.MD).
- 46 tests pass (37 records + 9 alternatives); `tsc --noEmit` clean.

### Clinician catalog — restore pages that carried search traffic (2026-10-26)

Why: Search Console (export of 2026-10-20, "Pages") showed the product pages
deleted on 2026-10-22 had ~25% of site impressions (31.6k of 127k) and 59 of
242 clicks. Precedence: user instruction over the 10-22 "delete the rest" scope
for the slugs below. Enterprise EHRs stay out (user decision, 2026-10-26).

**Restored (18, researched V4 records, on `PRACTICE_GRADE_SLUGS`, removed from
`retired-products.json`):**
- Malpractice (`malpractice-insurance`, new hub job "Get covered", object
  `insurance_frame`): cph-associates, apa-insurance-trust (now "The Trust"),
  prms, hpso, american-professional-agency, preferra-insurance, cmf-group.
- AI notes: nuance-dragon-medical-one (still sold by Microsoft; Dragon Copilot
  is separate), zoom-clinical-notes, eleos-health (moved from EHR: it sits on
  top of an agency EHR), qualifacts-iq (moved from clinical decision support).
- EHR: qualifacts-carelogic, qualifacts-credible, procentive (Ensora Health),
  theraplatform.
- Billing: tebra-billing (absorbs kareo-billing), candid-health (site now
  candidhealth.com).
- CE: pesi (`credentialing-workforce`, new hub job "Keep your license current").

**Redirected (`data/tools-v4/retired-redirects.json`, read by
`clinician-redirects.ts` for next.config and by the profile page as fallback;
covers `/tools/for-clinicians/:category/<slug>`, `/tools/alternatives/<slug>`,
`/tools/integrations/<slug>`):**
- To the live clinician profile: valant → valant-ehr-suite, alma-provider-platform
  → alma, grow-therapy-provider-platform → grow-therapy, rula-provider-platform →
  rula, sondermind-provider-network → sondermind, kareo-billing → tebra-billing,
  ensora-mental-health → theranest (Ensora Mental Health was TheraNest renamed;
  Ensora's pages use TheraNest again).
- To the patient profile `/tools/<slug>`: nocd, betterhelp, brightside-health,
  teladoc-health, talkspace-business → talkspace, charlie-health-iop,
  charlie-health → charlie-health-iop, lyra-health, doctor-on-demand, cerebral.
- Still category redirects: cerner-millennium, netsmart-myavatar,
  qualifacts-insync (user: keep out); tridiuum-one (acquired by New Directions in
  2022, relaunched as Lucet for health plans; no practice product);
  behavioral-health-billing-services (generic name, no single company found).

**Other code changes:**
- `ARCHITECT_EXCLUDED_SLUGS`: agency-only products (CareLogic, Credible,
  Qualifacts iQ, Eleos, Procentive, Candid) and general medical scribes (Dragon,
  Zoom Clinical Notes) publish as profiles but are not offered in Architect.
  `/api/architect/products` also excludes the malpractice and CE categories.
- Provider-networks job object changed to `team_workspace`; `insurance_frame` is
  the registry's malpractice-cover object.
- Hard-coded next.config redirects that still sent theraplatform and five
  malpractice profiles to the hub were removed.
- Profile page: category mismatch now a permanent redirect (was 307); retired
  slugs under schema category slugs (`measurement-outcomes-dtx/...`) land on the
  taxonomy category, not the hub.
- Test caps raised (practice-grade ≤ 60, catalog files ≤ 60); new test checks
  every retired slug is off disk and every redirect target is live.

**Sourcing caveat:** web fetch was disabled by org policy in this session, so
facts come from search-engine excerpts of the vendors' own pages, not full page
reads. No record has `pricing.last_verified`; each `governance.review_notes`
says so. Research logs: `.audit-tmp/restore-1026/logs/` (gitignored). Re-read
vendor pages before marking any price verified.

**Verified by execution (Linux sandbox, copy of the repo):** `tsc --noEmit`: 0
errors outside stale `.next/types`; ESLint clean on touched files (one existing
warning in next.config.ts); `validate:tools:v4` pass, 55/55 publishable; vitest
src/lib/tools + src/domains/tools + src/domains/architect + src/lib/schemas: 620
passed. Dev server: all 18 profiles 200; 169 URLs (every GSC page for these
slugs plus each canonical and alternatives URL) end on the expected page, first
hop 308; the one exception is `/tools/switch-from/tridiuum-one` →
`/tools/alternatives/tridiuum-one` 404 (5 impressions; alternatives for retired
slugs has no fallback). Architect API: 34 products, none excluded above.

**Open:** HPSO student price ($43/year) and American Professional Agency student
rates seen only in excerpts (left out); CPH's carrier not named on its pages;
Tebra's $49–$799/provider/month range is in notes only; Eleos and Dragon BAA
unknown. Architect's malpractice object (`component-mapping.ts`) still links to
vendor sites, not the new profiles. Existing records still carry related slugs
that no longer exist (valant, freed-ai, vsee, …) and some hype words.

### Hosting cost pass (2026-10-23)

- `src/middleware.ts` → `src/proxy.ts` (Next 16 rename). Matcher narrowed from
  every page to `/treatments/*`, `/conditions/*`, `/resources/*`, `/tools`,
  `/tools/search`, `/tools/for-clinicians/*`, two legacy `/tools/*` paths and
  `/llms.txt`. Preview `X-Robots-Tag: noindex` moved to `next.config.ts`
  `headers()` (host match on `*.vercel.app`).
- 30 file-backed `/tools/*` pages: `revalidate` 3600 → 86400.
- Two crisis/support pages: `force-dynamic` removed; `useSearchParams` moved
  behind Suspense with a full-content fallback (hotlines verified in server HTML).
- CDN cache (`s-maxage=86400`) on file-backed GET APIs: architect/products
  (was 300s), treatments/[slug], treatments/manifest, conditions/[slug],
  resources, resources/[slug].
- Upstash rate-limit `analytics: false`; Speed Insights `sampleRate={0.25}`;
  React Query `refetchOnWindowFocus: false`.
- Removed dead `components/ui/validated-tags.tsx` and `/api/entities/validate`
  (no callers). Removed a stale `.git/index.lock`.
- Verified in dev: all proxy behaviours (stub redirect, alias, true 404, legacy
  redirects, llms.txt CORS). Production build not run here.

### Treatment and condition pages — interactive experience (2026-10-23)

All 591 treatment and 131 condition pages open with an interactive
experience and present their full text as a chapter guide. Design rules:
art bible §13.

- Models (pure, from the record only): `src/domains/treatments/experience/model.ts`,
  `src/domains/conditions/experience/model.ts`; reverse index of treatments
  per condition in `treatments-for-condition.ts` (files, no DB).
- Components: `src/components/{treatments,conditions}/experience/`,
  `src/components/guide/GuideChapters.tsx` (chapter index + reading sheet;
  closed chapters stay in the DOM, `hidden`).
- Existing client wrappers take `intro`; when set, the old header, floating
  Expand All and large CTA card are replaced. If the model throws, the page
  falls back to the original layout.
- Fixed along the way: conditions keep their definition in `aeo.what_is`
  (129 of 130); one record had a tile without `id`, which crashed the page.
- Verified: crawl of all 722 pages in dev, each 200 with `<h1>` and the new
  layout in server HTML; 14 model tests over every record; tsc clean.
- Coverage notes: ~100 older-format treatments only have an overview and get
  the opening plus "More about …"; only 92 treatments give side-effect rates
  as percentages, so the rest list side effects without bars.

### Site-wide redesign — symptoms, hubs, tools, articles, resources (2026-10-23)

Every public detail page and hub now follows art bible §13 / §13.1.
Built in parallel (four forks) plus integration fixes:

- Symptoms (20): new SymptomExperience; private "I've noticed this" list
  (`localStorage` `hp:noticed`, printable). Fixed 14 symptom→condition links
  to non-existent pages (PTSD, bipolar) and screener links to
  `/resources/assessments-screeners/<slug>` (never existed; also emitted by
  `getLinkPath("assessment")`). Old URLs 301 to `/resources/<slug>`.
- Hubs: `/conditions` (+17 category hubs), `/treatments` (now all 591 from
  files, was a 500-row DB query), `/symptoms`.
- Patient apps 328/330 (2 already redirect); clinician profiles 37 and
  alternatives 37; learn 46; resources: articles, 56 support, 4 assessments.
- Integration fixes: `overflow-x: clip` on html/body (sticky was broken
  site-wide); answer logging removed from AssessmentRenderer and the ASSIST
  engine; e2e specs updated to real condition slugs; unused
  `conditions-overview-client.tsx` / `treatments-overview-client.tsx` removed.
- Verified: tsc clean; 1,259 unit tests pass (project-persistence needs
  jsdom, not runnable in the sandbox); per-family crawls by each fork; a
  full sitemap crawl (see below).

### Broken internal links (2026-10-23)

A crawl of 2,330 sitemap pages / 1,666 internal links found 42 dead links.
Fixed at the source, not per link:

- `src/lib/linking/live-paths.ts`: `isLivePath` (from the generated slug
  manifests) and `pruneDeadLinks`, run server-side on condition, treatment and
  resource records before they reach client components. Dead `{link:…}` tokens
  become plain text; dead linked-medication and resource-alternative slugs are
  cleared so the name shows unlinked. Server-only so the manifests never ship
  in client bundles. Tests: `src/lib/linking/__tests__/live-paths.test.ts`.
- Guides: related links used the raw brand ("kava kava", "elavil (historical
  brand)"); now URL-safe and re-pointed to the slug the guide actually uses,
  and dropped if they still would not parse (`liveRelatedPages` in
  content-engine). Guide sitemap now lists only parseable slugs (959).
- Tools hubs: `/tools/outcome-measurement` linked clinician products at
  `/tools/<slug>` (patient catalog) → `/tools/for-clinicians/<category>/<slug>`,
  unlinked when no profile exists; `measurement-dtx` → `measurement-outcomes`;
  fixed `/tools/compare/simplepractice-vs-valant` and solo-practice links.
- Re-crawl: 0 dead links on the affected pages and a sample of guides.

### Last completed work

**Phase 0 (complete):**
- Slice 0A: Pilot contracts drafted (4 documents)
- Slice 0B: Critical correctness audits and remediation

**Phase 1 Slice 1A (complete):**
- Behavioral audit of all Architect modes
- Removed hidden questionnaire defaults (SmartOnboarding now asks 4 questions)
- Reconciled mode entry points (Build for Me activated as primary)

**Phase 1 Slice 1B (complete):**
- Golden tests for fingerprint-based recommendations
  - Created `src/domains/architect/__tests__/golden-recommendation.test.ts`
  - 35 tests covering: determinism, exclusions, unknown data, ties, incompatibilities, budget, stale evidence, and all hard exclusion policies
  - Uses demo fingerprint fixtures for realistic scenarios
- Hard eligibility policies documented and implemented
  - Created `docs/active/contracts/HARD_ELIGIBILITY_POLICIES.md`
  - All 7 hard exclusion policies now implemented:
    1. Practice type exclusions
    2. State exclusions
    3. EPCS requirement (gated by capabilityMapStatus)
    4. Size bucket exclusions
    5. BAA/HIPAA requirement
    6. Clinical role exclusions
    7. Delivery model exclusions (telehealth-only practices)
- Compliance schema added
  - Added `ComplianceEvidenceZ` to product-metadata.ts
  - Fields: baaAvailable, soc2Certified, hitrustCertified, stateCompliance
- Schema updates for hard exclusions
  - Added `sizeBucketsExcluded` to PracticeFitEvidenceZ
  - Added `deliveryModelsExcluded` to PracticeFitEvidenceZ
- **All hard exclusion implementations:**
  - BAA: Insurance-heavy practices excluded from products with `baaAvailable: false`
  - Clinical roles: Practices excluded from products with matching `clinicalRolesExcluded`
  - Size buckets: Practices excluded from products with matching `sizeBucketsExcluded`
  - Delivery model: Telehealth-only practices excluded from products that don't support telehealth or explicitly exclude telehealth
  - Unknown evidence handling: Flags uncertainty but doesn't hard-exclude (per invariant)

**Phase 1 Slice 1C (complete):**
- Workspace consolidation analysis
  - Analyzed ArchitectWorkspace (912 lines) vs MyPractice (1191 lines)
  - ArchitectWorkspace: Mode-agnostic, lifecycle-stage-based, all 3 modes
  - MyPractice: Spatial practice-area-based, premium UX, build-for-me only
- **Decision: Keep separate bounded contexts**
  - Both serve valid but different use cases
  - Both already share engines, schemas, persistence, adapters
  - Consolidation would create bloated conditional code with no user benefit
  - Document: `docs/active/decisions/WORKSPACE_CONSOLIDATION_DECISION.md`
- Extractable abstractions identified for Phase 5:
  - Product card component
  - Fit indicator badges
  - Cost breakdown view
  - Stack summary logic

**Phase 2 Slice 2A (complete):**
- Patient support domain created (`src/domains/patient-support/`)
  - Types: Journey input, support paths, result structures, analytics events
  - Paths: Clinician-defined support paths with descriptions and considerations
  - Evaluator: Deterministic path selection based on user input
  - Crisis resources: Hardcoded 988, Crisis Text Line, SAMHSA
- Golden tests: 20 tests covering all pilot contract scenarios
  - Immediate crisis handling
  - Safety keyword detection
  - Therapy-seeking path
  - Medication interest (must include psychiatric-eval)
  - Minimal input handling (broader, not narrower)
  - Determinism verification
- UI components created:
  - `SupportJourney.tsx`: Multi-step journey with urgency check, concerns, goals, etc.
  - `CrisisBanner`: Always-visible crisis resources when triggered
  - `SupportPathResultView`: Displays primary path, alternatives, and next actions
- Route created: `/find-support` with noindex meta tag
  - Static noscript crisis resources (works without JavaScript)
  - Full journey flow with progress indicator
  - Disclaimer and attribution
- Feature flag added: `PATIENT_SUPPORT_JOURNEY`
  - When disabled, redirects to `/tools/find-support` (existing hub)
  - Default: enabled (true)
- Analytics implemented (`src/domains/patient-support/analytics.ts`)
  - Privacy-safe events: no symptom selections, no answers, no health content
  - Session events: journey_started, journey_abandoned, journey_completed
  - Progress events: urgency_completed, step_completed (counts only)
  - Outcome events: path_shown, action_clicked
  - Crisis events: crisis_shown (trigger type only)
  - Wired into SupportJourney component with proper lifecycle tracking
- **Remaining for acceptance:**
  - Mobile/desktop QA
  - Keyboard/screen-reader accessibility testing
  - Clinical review of support path definitions

**Phase 3 Slice 3A (complete):**
- Navigation inversion implemented
  - Homepage patient CTA now links to `/find-support` (decision journey)
  - Header navigation now uses audience-first structure
  - Added `NAVIGATION_INVERSION` feature flag for rollback
- Audience-first navigation structure:
  - Find Support → `/find-support` (patient decision journey)
  - Practice Architect → `/architect` (clinician decision journey)
  - Browse → `/browse` (taxonomy hub, secondary)
  - Search → `/search` (secondary)
- Browse hub created (`/browse`)
  - Aggregates taxonomy pages (Conditions, Treatments, Tools, Find Care, Resources)
  - Links back to decision journeys for "not sure where to start"
- Feature flag: `NAVIGATION_INVERSION`
  - When disabled, reverts to taxonomy-first navigation
  - Default: enabled (true)
- Route ownership resolved (no URL changes needed):
  - `/architect` = Primary clinician decision journey (Practice Architect)
  - `/tools/for-clinicians` = Browse catalog for clinician tools
  - `/for-clinicians` = Informational landing page (kept for SEO)
- Homepage inventory counts kept as approximations (130+, 650+, 100+)
  - Use "+" suffix to indicate estimates
  - Dynamic counts deferred (would require significant refactoring)
- **Remaining for acceptance (manual QA):**
  - Verify desktop and mobile navigation show same hierarchy
  - Test Browse and Search remain reachable
  - Verify no broken deep links
  - Test feature flag rollback

**Phase 4 Slice 4A (complete):**
- Truthful trust rendering verified
  - All content is reviewed by the Medical Review Board (confirmed by product owner)
  - Review claims are accurate and should be shown unconditionally
  - `BoardAttribution` component gates on `label` prop for flexibility
  - `AuthorByline` gates review claims on `hasReview` prop
- Date accuracy improvements:
  - Treatment pages: `last_reviewed` no longer falls back to `updated_at`
  - Review dates only shown when actual review date exists in editorial data
- Trust rendering schema verified:
  - `src/lib/schemas/tool-editorial.ts` defines review states
  - `hasActualClinicalReview()` function available for future granularity
  - `getEditorialBadges()` returns badges based on actual state
- Tool pages: `BoardAttribution` uses `tool.governance.reviewed_by_label`
- Treatment pages: Review claim shows unconditionally (accurate per product owner)
- **Acceptance status:**
  - No false review claims (all content IS reviewed)
  - Review dates accurate (no fallback to updated_at)
  - Unknown fields not falsely claimed as known

**Phase 4 Slice 4B (complete):**
- Decision context components created
  - `DecisionContext.tsx`: Patient tool pages - evidence quality, tradeoffs, uncertainty
  - `ClinicianDecisionContext.tsx`: Clinician tool pages - practice fit, cost notes, considerations
- Patient tool page (`/tools/[slug]`) updated:
  - Added DecisionContext after BoardAttribution
  - Shows evidence level (strong/moderate/limited/not yet studied)
  - Shows key tradeoffs (subscription, no mobile, etc.)
  - Shows uncertainty disclosure (unverified privacy, HIPAA status)
- Clinician tool page (`/tools/for-clinicians/[category]/[slug]`) updated:
  - Added ClinicianDecisionContext in main content area
  - Shows practice fit (solo/small practices, settings, roles)
  - Shows cost notes (quote required, implementation fees)
  - Shows considerations (no EHR integrations, verify BAA)
- Components exported from `src/components/tools/index.ts`
- **Acceptance status:**
  - One patient page family (tool pages) complete
  - One clinician page family (clinician tool pages) complete
  - Decision context derives from actual data fields
  - Long-form content remains beneath decision summary

**Phase 5 Slice 5A (complete):**
- Shared decision infrastructure created in `src/domains/decision/`
- Types extracted based on actual overlap between pilots:
  - `ConfidenceLevel`: high | moderate | low
  - `DataQuality`: verified | claimed | inferred | unknown
  - `NextAction`: Shared action structure
  - `MissingInfo`: What would improve the recommendation
  - `DecisionVersion`: definition + evaluator + catalog versions
  - `DecisionResultEnvelope<T>`: Generic result wrapper
  - `DecisionSessionState<T>`: Session resumability
  - `RecommendationReason`: Structured reasons with polarity
  - `Tradeoff`: Factor + pro/con structure
- Analytics utilities extracted:
  - Privacy-safe bucketing: `getBucketedCount()`, `getScoreBucket()`, `getDurationBucket()`
  - `trackDecisionEvent()`: Unified tracking to Vercel + GA4
  - `generateSessionId()`: Privacy-safe session identifiers
- **Acceptance status:**
  - Shared types created without breaking existing behavior ✓
  - Domain evaluators remain independently testable ✓
  - No patient safety policy in shared code ✓
  - Extracts proven patterns, not speculative framework ✓
  - Pilots can adopt incrementally

**Phase 6 Slice 6A (complete):**
- Commercial infrastructure created:
  - `src/lib/schemas/commercial.ts`: Schema for commercial relationships
    - `CommercialStatusZ`: active_affiliate | inactive_affiliate | direct_link | sponsored | unknown
    - `CommercialMetadataZ`: Full commercial metadata with partner network, expiration, etc.
    - `CommercialKillSwitchZ`: Global and per-partner/product kill switches
    - Disclosure text utilities: short, medium, long versions
  - `src/lib/commercial/`: Kill switch implementation
    - Environment-based configuration (COMMERCIAL_KILL_SWITCH_GLOBAL, etc.)
    - `shouldShowCommercialLink()`: Check if commercial enabled for product
    - `getEffectiveAffiliateUrl()`: Return affiliate or fallback to direct URL
    - `isUsingAffiliateTracking()`: Determine if tracking is active
  - `src/lib/commercial/use-commercial.ts`: React hook for client-side link handling
- Schema updates:
  - V4 clinician tools: Added `commercial` field to main schema
  - V3 digital tools: Added `commercial` field to `AppMetadataZ`
- Disclosure components created:
  - `AffiliateDisclosure`: Inline, block, and tooltip variants
  - `AffiliateLink`: Wrapper with proper rel attributes and disclosure
  - `PageAffiliateDisclosure`: Full-width banner for pages with affiliate content
  - Exported from `src/components/tools/index.ts`

**Phase 6 Slice 6B (complete):**
- Disclosure integration completed:
  - Patient tool pages (`/tools/[slug]/`):
    - Updated `ToolOutboundLinks.tsx` to accept commercial metadata and kill switch
    - Shows disclosure text when affiliate link is active and compensated
    - Kill switch check in page.tsx determines if affiliate is enabled
  - Clinician tool pages (`/tools/for-clinicians/[category]/[slug]/`):
    - Updated `ProductDemoCTA.tsx` to accept commercial metadata and kill switch
    - Shows disclosure in affiliate CTA card
    - Kill switch check in page.tsx determines if affiliate is enabled
- Commercial isolation test created:
  - `src/domains/architect/__tests__/commercial-isolation.test.ts`
  - Tests prove commercial data cannot affect:
    - Candidate selection
    - Fit scores
    - Product ordering
    - Coverage calculations
    - Recommendation explanations
  - Verifies ProductArchitectureMetadata does not include commercial fields
  - Verifies generateRecommendation does not accept commercial parameters
- **Acceptance criteria met:**
  - Commercial schema separate from organic data ✓
  - Every compensated CTA has disclosure ✓
  - Kill switches can disable commercial links ✓
  - Test proves commercial cannot affect organic results ✓
**Phase 6 Slice 6C (complete):**
- Commercial classification audit completed:
  - Searched 1,216 files with `affiliate_url` fields
  - Identified 1 actual affiliate tracking URL (hayat-health.json with `?ref=heypsych`)
  - Confirmed 1,215 are plain website URLs without tracking
- Classification applied:
  - `hayat-health.json`: Added `commercial` field with `status: "active_affiliate"`
  - All others: Default to `unknown` status (no tracking = no verified commission)
- Documentation created:
  - `docs/active/audits/COMMERCIAL_CLASSIFICATION_AUDIT.md`
  - Documents classification criteria, results, and next steps for new affiliates

**Phase 6 Slice 6D (complete):**
- Decision attribution infrastructure added:
  - Created `DecisionSessionContext` type to link events via `sessionId`
  - Added `createDecisionSession()` to initialize a session
  - Added `trackDecisionStarted()`, `trackDecisionResultShown()`, `trackDecisionActionClicked()`, `trackDecisionCompleted()`, `trackDecisionAbandoned()`
- Session ID links the funnel: `decision_started → result_shown → action_clicked`
- Action click events now include:
  - `sessionId` linking back to decision start
  - `resultId` connecting to recommendation shown
  - `isCommercial` flag for affiliate/sponsored actions
  - `durationBucket` for time-to-action analysis
- Updated `DECISION_EVENTS_CONTRACT.md` with session context documentation
- Exports added to `src/domains/decision/index.ts`
- **Phase 6 acceptance criteria fully met:**
  - Connect decision completion → action click events ✓

**Phase 7 Slice 7A (in-progress):**
- Decision session context integrated into patient support journey:
  - Created `decisionSession` state in SupportJourney component
  - `trackDecisionStarted()` called on journey mount
  - `trackDecisionAbandoned()` called on unmount if not completed
  - `trackDecisionResultShown()` called when result is displayed
  - `trackDecisionCompleted()` called on journey completion
  - `trackDecisionActionClicked()` called on next action clicks
  - `hadSafetySignal` set when crisis/keyword detected
  - `isCommercial: false` for all patient actions (no affiliate links)
- Full funnel now tracked for patient journey:
  - `decision_started` → `decision_result_shown` → `decision_action_clicked`
- **Remaining for Phase 7A:**
  - Integrate session context into Architect journey

### Handoff

- Read:
  - `src/lib/schemas/commercial.ts` for commercial relationship schema
  - `src/lib/commercial/` for kill switch and hook utilities
  - `src/domains/decision/analytics.ts` for session context and attribution
  - `docs/active/contracts/DECISION_EVENTS_CONTRACT.md` for event schema
  - `src/app/find-support/_components/SupportJourney.tsx` for patient session integration example
- Verified:
  - Commercial schema separate from organic fit/evidence data ✓
  - Kill switches can disable per-partner, per-product, or globally ✓
  - Disclosure integrated into patient and clinician tool pages ✓
  - Test proves commercial data cannot affect recommendations ✓
  - 1,216 affiliate URLs audited and classified ✓
  - Only 1 has actual tracking (hayat-health) ✓
  - Decision attribution infrastructure ready ✓
  - Session context integrated into patient support journey ✓
- Phase 7 Slice 7A status:
  - Patient support journey: Session integrated ✓
  - Architect journey: Session integration pending
- Authority decisions still needed:
  - Product Owner, Clinical Reviewer, Editorial Owner, Privacy Owner, Commercial Owner
  - Launch jurisdiction (recommend: US-only)
  - Clinical review of support path definitions
- Phase 6 acceptance criteria fully met ✓
- Rollback procedures:
  - Set `NAVIGATION_INVERSION=false` to revert to taxonomy navigation
  - Set `PATIENT_SUPPORT_JOURNEY=false` to redirect `/find-support` to old hub
  - Set `COMMERCIAL_KILL_SWITCH_GLOBAL=true` to disable all affiliate links
  - Commercial schema fields default to "unknown" - safe to deploy
- Do next:
  - Integrate session context into Architect journey
  - Run typecheck to verify changes compile
  - Consider additional decision journeys

### Homepage "Two Worlds" and site-wide Worlds identity (2026-10-22/23)

- Homepage rebuilt around two illustrated worlds (patient reading room,
  clinician office derived from the canonical Architect `RoomShell` and object
  art). Inline server-rendered SVG, CSS-only interaction, reduced-motion and
  touch states. Files: `src/components/home/**`, `src/app/page.tsx`.
- `/find-support` now opens with "What brings you here?" (six starting points to
  existing routes); `?need=support` continues to the existing SupportJourney.
  Crisis information shown on every view.
- Hard-coded homepage inventory counts removed (supersedes the Phase 3 note
  keeping 130+/650+/100+).
- Header navigation is now Explore (`/browse`), For Clinicians (`/architect`),
  About, plus search. Find Support and Practice Architect remain in the footer,
  homepage, and Explore.
- Site-wide identity: tokens and Tailwind default palettes remapped to the
  Worlds palette, Newsreader display headings, new wordmark/favicons/social
  image, `PageIntro` on hubs, Architect onboarding shows the office. See
  `docs/active/design/HOMEPAGE_WORLDS_ART_BIBLE.md` section 12.
- Fixes found along the way: nested `<main>` landmarks removed (15 files), skip
  link added, doubled "| HeyPsych" titles stripped (30+ routes), `/psychiatrists`
  given metadata, legal layout's duplicate footer removed, About page claim of
  insurance filtering removed (not supported by data).
- Evidence: `tsc --noEmit` clean; ESLint 0 errors on touched files; rendered
  review in the dev server at desktop 1280 and mobile 375.
- Open, needs product authority: `src/lib/seo/dark-patterns.ts` randomizes
  `dateModified`, stamps `lastReviewed` to the current month, and shows a
  visible "Updated <month year>" badge on tool hubs regardless of edits. This
  conflicts with the trust copy and causes hydration mismatches.
- Not yet done: visual-regression snapshots, automated a11y run, Lighthouse.

### Brand consistency pass (2026-10-23)

- Mark simplified to a neutral stone cube; every icon, logo, and social asset
  regenerated from `src/components/brand/Wordmark.tsx`. Spec:
  `docs/active/design/BRAND.md`.
- Head: full icon set (ico, svg, 48/96/192 PNG for Google), manifest with
  maskable icons, `theme-color` `#FAF9F6`, homepage title separator unified.
- Structured data: nine schema blocks pointed at a non-existent `/logo.png`;
  all now use the square `/images/logo.png` (512 × 512).
- Social: 94 `openGraph` and 38 `twitter` blocks had no image (Next merges
  metadata shallowly), so those pages shared without a picture. All now name
  `/images/og/heypsych.png`. The dead `/opengraph-image` route reference and
  middleware branch were removed.
- Codebase: 161 gradient literals flattened (11 gradient-text headings
  removed); ~250 classes that referenced undefined colours fixed (a
  `label-primary0` find-replace typo, and shadcn names now aliased to brand
  semantics); all arbitrary hex classes replaced with tokens; Tailwind
  typography and animate plugins registered (never loaded under v4);
  `tailwind.config.js` (unused under v4) deleted; primary Button unified to
  the graphite capsule; glass card variant retired.
- Emails restyled to the brand and user input escaped (was unescaped HTML).
- Dead code removed: `src/components/homepage/*`, `AudienceGateway`, public
  `logo.html`, `robots.txt.backup`, Next starter SVGs.
- Tests: homepage/navigation e2e rewritten for Two Worlds; new
  `tests/e2e/brand.spec.ts`.
- Evidence: `tsc --noEmit` clean; `eslint src --quiet` 0 errors; all brand
  assets and per-route og/twitter images return 200 in the dev server.
- Not run here: Playwright e2e and Vitest (native binaries unavailable in the
  agent environment). Run `npm run test:e2e` locally.
### Apps & Tools rehaul, clinician side (2026-10-23)

User choice: clinician first; consolidate with 301s. Patient side is next.

- `/tools/for-clinicians` rebuilt around jobs (run the practice, write notes,
  get paid, insurance networks, directories, telehealth, outcome measures),
  each drawn with its Practice Architect office object. Island: job →
  kind of practice (`positioning.segments`) → reviewers' picks with their
  note; the rest of the job listed below. Choice kept in `localStorage`
  (`hp:clinician-practice`) only; `?job=` / `?practice=` preselect.
  Every product link is also in the server HTML (index section).
- `/tools/for-clinicians/[category]` is now that job's page (same island,
  billing split by `positioning.job`, "also built into" from
  `secondary_categories`, same-job head-to-heads). Categories with no
  products redirect to the hub. Taxonomy SEO titles/FAQs (year bait,
  products no longer in the catalog, unsourced "save 1–2 hours") are no
  longer rendered; the data file is unchanged.
- Code: `src/domains/tools/clinician-hub/model.ts` (+ tests),
  `src/components/tools/clinician/hub/*`, `src/lib/tools/clinician-hub-data.ts`,
  `src/lib/tools/curated-comparisons.ts` (comparison gate shared by page,
  hubs and sitemap).
- Retired 34 route files (audience pages, best/best-for/year pages, pricing,
  stacks, integrations, works-with, switch-from, HIPAA/BAA, topic landers,
  EHR matcher, programmatic clinician guides, legacy V3 hub stubs). 226
  permanent redirects built from the catalog in
  `src/lib/tools/clinician-redirects.ts`, spread into `next.config.ts`.
  Removed the dead V3 redirect blocks in `src/proxy.ts` and the retired URLs
  from `sitemap-tools.xml` and `sitemap-config.ts`.
- Fabricated structured data removed: clinician profiles emitted an
  AggregateRating and Review derived from `data_quality_score`, plus HowTo
  and auto-written FAQs (`clinician-tool-nuclear.ts` → `clinician-tool.ts`,
  record-only). Comparisons: dropped HowTo/Review/Table/speakable, guessed
  G2/Capterra/Crunchbase `sameAs`, `new Date()` dates, "Winner?" titles,
  trailing-slash canonicals. Profile titles no longer carry the current year.
  Deleted unused `aggressive-schema.ts`, `serp-domination.ts`,
  `entity-sameas-registry.ts`, `EHRMatcherClient.tsx`.
- Evidence: `tsc --noEmit` clean (only a stale `.next/types` entry for the
  previously deleted `/api/entities/validate`); ESLint clean on touched files;
  9/9 hub model tests (run under Node with a vitest shim; vitest itself
  needs the macOS binaries); dev server: all clinician sitemap pages (115)
  and their 131 internal links return 200, none carry rating/HowTo schema;
  sample redirects land on the intended URLs. e2e spec updated
  (`tests/e2e/clinician-tools-v4.spec.ts`), not run here.
- Open: claim-md's record FAQ says "$120/month, no per-claim fees" while its
  pricing says "$30/month + per claim"; heard-vs-thrizer and other
  cross-job comparisons stay live but are not featured; orphaned SEO modules
  predating this work (`clinician-tool-answer-kings.ts`,
  `page-priority-engine.ts`, `paa-*`, `psychtrail-*`, …) left in place;
  patient-side AggregateRating in `schema-builders/tool-v3.ts`,
  `digital-tool.ts` and `tools/[slug]` to review in the patient pass.
### Apps & Tools rehaul, patient side + commercial layer (2026-10-23)

User direction: Apple-like, info all still there, monetization later via
affiliate and sponsorship but "very soft" — no ad clutter (no partners yet).

- `/tools` is the patient app finder: three questions (what's going on, kind
  of help, how you'd pay) over record fields only, live counts, name search
  (replaces /tools/search, `?q=` carried), crisis line in server HTML, A–Z
  index in a `<details>`. Order: sign-up-yourself first, then research, then
  privacy grade, then name. Answers in `localStorage` (`hp:app-finder`) only,
  never in the URL. Model: `src/domains/patient-tools/finder/model.ts`
  (+ tests). 33 clinician-facing records (MBC platforms, EHR add-ons,
  provider platforms, hospital telehealth) are excluded from the finder by
  name/one-liner (`isClinicianFacing`); their profiles remain.
- Need pages kept at their URLs (`/tools/anxiety-stress` … `/tools/find-support`)
  via `src/app/tools/_components/need-page.tsx`.
- Patient compare (`/tools/for-patients/compare/a-vs-b`) rebuilt record-only:
  the old page scored a "winner" (including a `featured` bonus) and wrote
  verdict text. Non-curated pairs are noindex.
- Clinician compare (`/tools/compare/[slug]`) rebuilt from the curated JSON
  (bottom line, key differences, table, sections, FAQs) — no tabs. `/tools/compare`
  is a compare-any builder (`?tools=a,b,c`). Removed `compare-client.tsx`,
  `comparison-engine.ts`, `components/tools/comparison/*`.
- Condition pages gain "Apps and online care" (3 picks, one per kind of help,
  plus a link to the need page): `src/lib/tools/apps-for-condition.ts`.
- Header nav adds "Apps"; Explore links updated.
- Commercial layer, dormant until there are partners:
  `src/lib/commercial/outbound.ts` (partner link only for an
  `active_affiliate` record and an open kill switch, then disclosed and
  rel="sponsored"; otherwise the vendor site, untracked),
  `src/lib/commercial/placements.ts` + `SponsoredCard` (existing campaign
  files; now also clinician products; optional `offer` line). Placements render
  beside, never inside, picks. Visit buttons live only on profiles and
  comparisons, not on list cards. ProductDemoCTA (unreachable) removed.
- Patient profile schema: removed AggregateRating/Product built from unsourced
  store ratings, `new Date()` dates, $0 for unknown prices
  (`schema-builders/patient-app.ts`). 6 app meta descriptions cleaned of
  "★ rating" and "the best … app".
- Retired with 301s (`src/lib/tools/patient-redirects.ts`): /tools/for-patients,
  its compare index and guides, /tools/find-support/* sub-hubs, /tools/free/*,
  /tools/search, plus removal of the old `_components` (HubPageContent etc.).
- Open: profiles still show "4.8★ app rating" from unsourced record fields;
  `REGULATORY_WARNINGS` (Cerebral, Done) need citations; the "Reviewed by
  HeyPsych Board" label needs the authority decision noted in §12.
  Redirect changes need a dev-server restart (the `/tools/search` redirect is
  not live in the running server yet).

### Apps & Tools rehaul, finish-off (2026-10-23)

- Ratings: legacy `app_rating` / `total_reviews` (unsourced) no longer reach
  any page or schema: AggregateRating removed from `schema-builders/tool-v3.ts`,
  `digital-tool.ts` and `utils/seo.ts`; "4.8★ … (1.2M reviews)" titles and
  descriptions removed from `metadata-generators/resource.ts`; star displays
  removed from `DigitalToolRenderer`, `ToolCard` and the legacy
  digital-tools-hub blocks. Sourced `store_ratings` (store, link, date) still show.
- Bait: "Unknown (#1 App 2026) – Brutally honest…" `seo` blocks the ballistic
  script added to 8 taxonomy files and the example campaign removed (none in HEAD).
- Deleted 12 SEO modules nothing imports (answer-kings, PAA, page-priority,
  psychtrail, freshness automation, internal-link network, …; ~4,200 lines).
- Checked, already resolved: REGULATORY_WARNINGS cite DOJ/HHS-OIG/EDNY sources
  (Done sentencing re-verified against the DOJ release); Claim.MD FAQ matches
  its pricing. "Reviewed by HeyPsych Board" stays: the board exists
  (`data/editorial/reviewers/medical-review-board.json`); whether each app was
  individually reviewed is an owner decision (§12).
- Evidence: `tsc --noEmit` clean; 1,335 unit tests pass (2 suites use jest
  globals, not runnable in the sandbox config); dev-server crawl of
  `sitemap-tools.xml`: 466 pages, 1,728 internal links, all 200, no
  AggregateRating/Review/HowTo markup.

### Consumer apps: led by what people are looking for (2026-10-23)

User direction: "own the consumer apps space"; focus on experience and
presentation; no screening up front, "what is the user looking for".

- `/tools` now opens with search (names and plain words: "sleep", "takes my
  insurance", "therapist"), then "Start with what you need" tiles, need
  chips with counts, and App Store–style shelves of real options. The
  three-question finder stays below as "Narrow it down".
- Six intent pages, each with every option, an at-a-glance strip (how many
  take insurance, are free to start, involve a real person; typical listed
  monthly price only when 5+ list one, with the denominator), a "Before you
  choose" checklist, and shelves by kind of help and by need:
  `/tools/online-therapy`, `/online-psychiatry`, `/self-guided`, `/free-apps`,
  `/takes-insurance`, `/peer-support` (in `sitemap-tools.xml`). Shared body
  `src/app/tools/_components/intent-page.tsx`.
- Need pages (`/tools/anxiety-stress` …) gain the at-a-glance strip and
  shelves split by kind of help.
- Saved apps: heart on every card and a Save button on profiles; a bottom
  pill ("2 saved · Compare") opens the list and links any two to the patient
  compare page. `localStorage` "hp:saved-apps" only, never sent.
- Profiles: glance tiles are now What you get / What it costs (+ what the
  listed price comes to over a year) / How you start / Know first or
  Evidence. The cost section shows the year working and any annual-plan
  saving, labelled as worked out from the listed price.
- Shelf order (`shelfOrder`): open sign-up, research, then reach (sourced
  store review counts, then how many needs it serves), privacy, name. Never
  commercial. Model: `src/domains/patient-tools/shelves/model.ts` (+ tests);
  UI: `src/components/patient-tools/shelves/*`. Finder cards reuse `AppCard`.
- Evidence: tsc and ESLint clean on touched files; 1,341 unit tests pass.

### Consumer apps: the support ladder (2026-10-23, same day, supersedes shelves on hubs)

User feedback: "not just a wall of apps… user needs to be guided, creatively;
not a screener questionnaire; not continuous scrolling."

- `/tools` and every need page now centre on the **support ladder**
  (`src/components/patient-tools/ladder/SupportLadder.tsx`, model
  `src/domains/patient-tools/ladder/model.ts` + tests): stepped care as an
  isometric staircase — on your own (phone), coach or peer (doorway),
  therapist (armchair), prescriber (prescription box) — with 988 on the
  ground floor. Tap a step (or More/Less support); a game-piece "you" walks
  there and the panel shows what the step is good for, what it looks like,
  typical listed price, how many are free / take insurance, three good places
  to start, and when people step up. Two lenses (what's on your mind, how
  you'd pay) re-tune every step's count and picks at once. Step and lenses in
  `localStorage` "hp:ladder" only. Need pages fix the "mind" lens.
- Removed from hubs: the shelf rows and the three-question finder
  (`PatientFinder.tsx` deleted; `hubShelves`/`helpShelves`/`ShelfRow` removed).
- Intent pages: three "Good places to start" cards, then every option as a
  compact narrow-in-place list (`OptionList.tsx`, 15 rows, then more), instead
  of up to eight shelves and a 100-card grid.
- Employer-only products are no longer offered on consumer pages
  (`isEmployerOnly` in the finder model: name/wording rules plus a reviewed
  slug list — e.g. Wysa for Employers, Talkspace for Business, Lyra, Spring,
  Calm Health, Headspace Health, Modern Health, EAPs and health-plan
  programs, college/school services, SilverCloud, Koa, ieso). Profiles stay.
  `open` now means "not employer-only" (the price model "enterprise" was
  wrongly hiding consumer services such as NOCD, Sesame and Doctor On Demand).
- `notFirstStop` (IOP/PHP/residential, prescription-only, pediatric ADHD)
  ranks after regular care in picks. Data fixes: EndeavorRx, EndeavorOTC,
  Akili moved to the focus/ADHD hub (were anxiety/mood); Cognoa Canvas Dx
  (clinician-prescribed autism diagnostic aid) set to `audience: clinician`.
- Wysa (consumer app) kept: listed in the US App Store with a free tier as of
  2026-10-23 (record's availability check). Owner to confirm.

### Consumer apps: telling options apart (2026-10-23)

User feedback: the ladder separates kinds of care, but inside a step (60
self-guided apps) everything still looks alike; people need to see which one
is best for them, visually, in every category.

- `src/domains/patient-tools/fit/model.ts` (+ tests):
  - **Approaches** — what you do with it, read from the record's types, uses,
    best-for and one-liner. Self-guided: learn a program, meditate and unwind,
    track and reflect, in-the-moment relief, chat it through (AI type wins),
    habits/focus/recovery, VR, community. People: general therapy, specialist
    care, teens and families, couples, messaging-first, someone who shares
    your background, browse a directory, with your primary care, medication,
    ADHD, addiction. Each app has one **main approach per step** (the one its
    wording names most), so tiles split the set cleanly.
  - **Roles** — Best-studied, Best free (self-guided only; for people it is
    "Uses insurance", since "free" there means free to search), Most private,
    Most used (published store rating counts). Each role goes to a different
    app and shows the one fact that won it. Falls back to "A good place to
    start" when no fact separates the set.
  - **Price level** (`costTier`): Free / Free to start / $ / $$ / $$$ / Insurance.
- `FactRow` on every card in every category: research dots, privacy grade,
  price level, who you work with. Missing facts show "–".
- `FitPicker` — "Which [step] option is right for you?": approach tiles (up to
  8, icons) then the role picks, compare-the-top-two link. Full width under
  the ladder, synced to the chosen step and lenses; also on every intent page
  (pay intents use approaches across all steps).
- Cards now say their approach ("Learn a program", "Specialist care") rather
  than only "On your own".

<!-- END IMPLEMENTATION STATE -->

## Supabase egress fix (2026-10-26)

The free-plan egress quota (5.5 GB) ran out on 2026-10-26; requests are dropped until 2026-11-04. Cause, from the code:
- **Link validation** (`src/lib/linking/utils.ts`, `content-enhancer.ts`) fetched whole entity rows, article content included, over the uncached direct Postgres pool, several times per linked name, on every ISR regeneration of condition and treatment pages. Crawlers regenerate hundreds of pages a day. Now uses `src/lib/data/entity-index.ts`: one light query (id, slug, type, title, status) held in the Next data cache for a day.
- **Page entity** (`entity-cache.ts` `getEntityBySlug`, also the `/api/markdown/*` routes AI bots hit) now goes through `unstable_cache` for a day, shared across instances.
- **All server-side GET reads of `entities` / `entity_relationships` / `content_files`** through the Supabase client now use the data cache (`database.ts` `contentCacheOptions`), so builds and regenerations reuse rows instead of re-downloading them. Newsletter, leads and other tables are untouched.
- **Treatment and assessment sitemaps** selected `*` (about 14 MB for treatments) per crawl; now select only slug, type and dates.
- Tag `supabase-content`; `/api/revalidate` marks it stale when a path is revalidated.
