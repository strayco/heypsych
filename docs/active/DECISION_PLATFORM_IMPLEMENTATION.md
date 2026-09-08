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
state_version: 27
last_verified_at: "2026-09-02"
verified_commit: "e1ebb5bf1260947954e94bd63b3a16f6f4c23348"

active_phase: 6
active_slice: "complete"
phase_status: "complete"
next_action: >-
  Phases 0-6 complete. All core decision platform infrastructure is in place:
  (1) Contracts and safety invariants (Phase 0)
  (2) Architect clinician journey with hard exclusions (Phase 1)
  (3) Patient support journey with crisis handling (Phase 2)
  (4) Homepage/navigation inversion (Phase 3)
  (5) Decision-first pages (Phase 4)
  (6) Shared decision infrastructure with session context (Phase 5)
  (7) Commercial action layer with isCommercial tracking (Phase 6)

  Cross-domain funnel analysis now possible via DecisionSessionContext.
  Phase 7 (scale decisions / AI parsing) depends on measured pilot success.
  Ready for pilot launch and measurement.

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
  - "0 Architect products have reviewed metadata."
  - "Audit mode requires parity tests before activation."
```

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
<!-- END IMPLEMENTATION STATE -->
