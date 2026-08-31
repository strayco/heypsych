# HeyPsych Architect — one-pass production build prompt

Copy everything below this line into the coding agent with the HeyPsych repository open.

---

You are the principal product engineer and product designer responsible for shipping one coherent production vertical slice inside the existing HeyPsych application.

# Goal

Build HeyPsych Architect: a calm, fast, Apple-caliber, HeyPsych-native workspace where a mental-health practice can describe itself, map its current technology stack across the practice lifecycle, understand gaps and overlap, compare replacements, and receive transparent product recommendations.

Tagline:

Architect your practice.

Supporting copy:

Build, compare, and optimize the technology stack behind your mental-health practice.

The product model is:

- Lifecycle capabilities describe what the practice must accomplish.
- Products are different ways to cover those capabilities.
- The practice is the primary object, not the product catalog.
- A product is added once and may cover many capabilities.
- Recommendation quality and trust matter more than catalog volume.

This is not a chatbot, a generic dashboard, a static directory, a table with filters, or a free-form node graph.

# Definition of done

The task is complete only when the P0 production slice below works end to end with real interactions, deterministic engines, honest data states, responsive behavior, automated tests, and rendered visual inspection.

A successful result lets a user:

1. Choose Build for me, Build myself, or Audit my current stack.
2. Create or edit a concise Practice Fingerprint.
3. See the relevant mental-health practice lifecycle without processing all 40 capabilities at once.
4. Add a product once and immediately see every capability it covers.
5. Understand important gaps, meaningful overlap, compatibility concerns, cost, Fit Score, and Stack Health.
6. Open a concise shortlist of up to five products for the selected capability.
7. See why every recommendation ranks where it does and how complete the underlying data is.
8. Preview a replacement without mutating the stack, apply it deliberately, and undo it.
9. Save and restore an anonymous stack on the same device.
10. Complete the core workflow with pointer, touch, or keyboard on desktop and mobile.

Do not claim completion while a P0 path is a placeholder, a control is inert, a test is failing because of this work, or the rendered interface has clipping, overlap, unusable density, or broken responsive states.

# Instruction precedence

When requirements compete, use this order:

1. Preserve existing user work and repository conventions.
2. Protect data truth, privacy, security, and editorial independence.
3. Complete the P0 acceptance workflow.
4. Preserve accessibility, responsive behavior, and performance.
5. Apply Apple-caliber interaction and visual polish.
6. Implement P1 follow-on integrations.

Never sacrifice a higher item to make a lower item look complete.

# Repository contract

Start by inspecting the current repository and git status. Verify these facts rather than assuming they are still current:

- Next.js App Router, TypeScript, React, and Tailwind are already installed.
- Supabase/PostgreSQL is the existing database path; Prisma is not part of the application.
- Zod is the canonical validation approach.
- The clinician catalog is file-backed under data/tools-v4/products and is loaded through src/lib/tools/clinician-tool-service.ts.
- src/lib/schemas/clinician-tool-v4.ts is the fail-closed clinician product contract.
- Architect uses Clinician Tool V4, not the separate patient-facing Digital Tool V3 catalog.
- Existing clinician discovery, matching, comparison, sponsorship, analytics, and demo-request flows live under src/app/tools, src/components/tools, and src/lib/tools.
- Canonical clinician detail URLs use /tools/for-clinicians/[primary-category]/[slug], and the existing lead endpoint is POST /api/tools/demo-request.
- Live visual tokens are defined in src/app/globals.css and tailwind.config.js.
- Reusable controls live in src/components/ui.
- The repository includes Vitest and Playwright.
- End-user authentication may not yet exist even though server-side Supabase and admin auth utilities do.

Read the relevant live code before changing it. Use docs/APPLE_VISUAL_DESIGN.md, docs/APPLE_VISUAL_IMPLEMENTATION.md, and docs/PREMIUM_DESIGN_SYSTEM.md as historical intent, but live tokens and components win when the documents conflict with current code.

Preserve every pre-existing modified or untracked file. Do not revert, overwrite, reformat, stage, or otherwise absorb unrelated work. If an in-scope file already contains user changes, integrate around them carefully.

Do not:

- introduce Prisma, a second ORM, a second design system, or a new component library;
- duplicate clinician products into a parallel product catalog;
- weaken the existing publication gate or editorial verification rules;
- rewrite existing product, comparison, patient, or navigation surfaces;
- modify an already-applied migration;
- deploy, push, commit, or run a migration against a linked or production database;
- expose secrets or patient-level data.

Create additive migration files when persistence requires them. Apply migrations only to a clearly local test database. Otherwise validate the SQL statically and report the exact local command.

# Autonomy

This is an implementation request. Inspect, design, edit, test, render, inspect, and refine without stopping after a plan.

Make reasonable, reversible implementation decisions when the repository answers the question. Ask only if a missing decision would materially alter the product or require external, destructive, production, or paid action.

Use parallel analysis or test work when the environment supports it, but keep one coherent architecture. Continue fixing in-scope failures until the completion bar passes or a genuine external blocker remains.

# Scope

## P0 — complete in this pass

1. /architect entry experience with three modes, plus /architect/build and /architect/audit deep links backed by the same domain state.
2. Shared Practice Fingerprint.
3. Data-driven lifecycle navigation.
4. Interactive architecture workspace.
5. Search and personalized product shortlist.
6. Multi-capability product coverage.
7. Add, remove, reset, and undo.
8. Replacement preview and apply.
9. Gap, overlap, and compatibility analysis.
10. Deterministic Fit Score with data confidence.
11. Explainable Stack Health.
12. Honest cost estimation.
13. Why this product details.
14. Build for me and Audit my current stack.
15. Anonymous local persistence behind a replaceable persistence adapter.
16. Existing demo-request integration where the current product data supports it.
17. Privacy-safe analytics for the core workflow.
18. Responsive, accessible desktop, tablet, and mobile behavior.
19. Unit and end-to-end coverage of the acceptance workflow.
20. Rendered visual QA at representative viewports.

## P1 — implement only after every P0 gate passes

Keep the architecture ready for these, but do not dilute P0 with partial implementations:

1. Authenticated cloud persistence and guest-to-account conversion.
2. Revocable, privacy-controlled public share pages.
3. Home-page CTA integration.
4. Existing product-page and comparison-page deep links into Architect.
5. Vendor architecture-data submission.
6. Quote, notify-me, suggest-product, and vendor-submission workflows beyond existing real endpoints.
7. Ratings, popularity sorting, reviews, or marketplace signals that lack trustworthy source data.
8. Procurement, RFP, contract, migration-service, team, enterprise, version-history, bidding, or vendor-analytics features.
9. Desktop drag and drop if the canonical Add to stack interaction is already complete and accessible.

Do not render P1 controls as though they work. An absent control is better than a dead control. If P0 finishes and P1 is implemented, hold it to the same tests and polish.

# Product experience

## Entry

The first screen must communicate the product without a tutorial modal.

Headline:

Architect your practice.

Subheadline:

Build your ideal mental-health practice stack. See what you need, what you already have, where tools overlap, and which products fit your practice.

Modes:

- Build for me — Answer a few high-signal questions and generate a recommended architecture.
- Build myself — Explore the lifecycle and add products directly.
- Audit my current stack — Add current products first, then identify gaps, overlap, compatibility concerns, and opportunities.

Show a lightweight, unmistakably labeled Example architecture using fictional demo products so the page never fabricates facts about real vendors. The example teaches that one product can cover several needs.

Example mode is an isolated sandbox. Demo products never persist into a real stack, mix with real products, emit product analytics, enter public search, or trigger lead actions. Users may interact inside the sandbox, but Start your stack exits demo mode into clean real state while preserving only explicitly re-entered fingerprint answers.

Within 10 seconds, a first-time visitor should understand:

- the lifecycle is the set of practice needs;
- products form the stack;
- one product can cover many needs;
- recommendations adapt to the practice;
- gaps and overlap are explainable.

Within 60 seconds, the visitor should be able to add a product, see coverage change, open a recommendation explanation, and undo a change.

## Practice Fingerprint

Ask only questions that change relevance, ranking, cost, or compatibility. Use progressive disclosure and allow skipping optional fields. Skipped evidence lowers confidence; it does not become a mismatch.

High-signal fields:

- Practice type: solo clinician, therapy group, psychiatry, therapy plus psychiatry, psychological testing, community behavioral health, SUD/addiction, IOP/PHP, telehealth-first, or other.
- Size bucket: solo, 2–5, 6–10, 11–25, 26–50, 51–100, 101–250, or 250+.
- Exact provider count when known or when a selected price formula needs it. Never derive an exact count from the bucket.
- Clinical roles: therapists, psychologists, psychiatrists, psychiatric NPs, social workers, counselors, care coordinators, administrators, and billers.
- Population: adults, children, adolescents, families, couples, or mixed.
- Payer model: cash, commercial insurance, Medicare, Medicaid, EAP, or mixed. Percentages are optional and must either total 100 or be clearly labeled approximate.
- Geography: states served and one-state versus multi-state.
- Prescribing: none, prescribing, or controlled substances/EPCS.
- Delivery: in-person, hybrid, or telehealth.
- Current stack: fuzzy product search and add.
- Priorities: ranked low cost, ease of use, clinical workflow, billing and collections, integrations, automation, AI, patient experience, reporting, scalability, and implementation simplicity.
- Optional monthly budget.
- Optional location count, encounter volume, prescriber count, transaction volume, and monthly collections, requested only when a selected pricing formula needs them.

Show a concise practice summary that remains editable. Preserve answers when moving between modes.

All three modes share the same fingerprint, stack, engines, and persistence model:

- Build for me requires practice type, size bucket, payer model, prescribing, delivery, and three ranked priorities. It produces a recommended starting architecture with one primary option and up to two alternatives for each important need, then opens the same workspace through Customize this architecture.
- Build myself requires nothing before entry. It opens the workspace immediately, labels recommendations Limited data until enough evidence exists, and makes the next uncovered high-relevance capability obvious once relevance can be derived.
- Audit my current stack requires at least one current product plus practice type, size bucket, payer model, and prescribing. It shows the audit before signup and opens the same workspace through Improve my architecture.

If authenticated user infrastructure does not exist, do not bolt on a fake account system. Persist a versioned anonymous profile and stack locally, label Save as saved on this device, isolate storage behind a PracticeStackPersistence interface, and make later server persistence possible without changing the domain model.

Autosave each valid local mutation after a short debounce and expose a quiet Saving / Saved on this device status. A Save action must flush immediately. Store schema version and updated-at time, retain data until the user resets it or clears browser storage, and recover safely from unavailable, corrupt, or obsolete storage without discarding the current in-memory state.

## Canonical lifecycle

Capabilities must be data, not hardcoded layout branches or a closed Architect enum. Use stable slug validation plus a data registry so adding a future capability does not require layout or engine rewrites. Bridge existing V4 capability enums into this registry explicitly. Seed these ordered groups:

- GROW: patient acquisition; referral management; CRM/lead management; reputation/reviews.
- ACCESS: intake; screening/triage; insurance eligibility/benefits verification; provider matching; scheduling; waitlist management.
- ENGAGE: patient portal; secure messaging; phone/contact center; appointment reminders; forms/e-signature.
- CARE: EHR/clinical record; clinical documentation; AI documentation/scribe; treatment planning; telehealth; prescribing/eRx; EPCS; assessments/measurement-based care; care coordination; referrals/transitions of care.
- REVENUE: coding; claims submission; clearinghouse; billing/RCM; denial management; patient payments; patient financing; credentialing/payer enrollment.
- OPERATE: analytics/BI; workforce management; payroll/compensation; accounting; compliance/security; clinical supervision; quality assurance.

For the selected fingerprint, assign each capability one derived relevance level: required, strongly recommended, useful, optional, or irrelevant. Relevance rules must be deterministic, typed, and unit tested. Let the user override relevance while preserving the derived default, the override, and a plain-language explanation of both.

Do not give one overloaded status to a capability. Model and display these independent dimensions:

- coverage: unknown, missing, partial, covered, or strong;
- overlap: none, useful specialization, benign overlap, or probable redundancy;
- compatibility: compatible, concern, incompatible, or unknown;
- relevance: required, strongly recommended, useful, optional, or irrelevant.

A capability can be covered and also have benign overlap or a compatibility concern.

## Desktop workspace

At 1280 CSS px and wider, create a coordinated three-pane workspace beneath the existing HeyPsych header:

- Lifecycle navigator: approximately 240–280 px.
- Architecture canvas: fluid and visually dominant.
- Contextual shortlist/inspector: approximately 340–400 px.

Allow the secondary panes to collapse so the architecture can gain space. Preserve the selected capability, product, mode, and scroll context.

Lifecycle pane:

- sticky grouped navigation;
- collapsed stage summaries by default;
- capability name, relevance, coverage text/icon, overlap or compatibility flag, and selected state;
- search;
- count of selected products that cover the capability;
- no color-only state.

Architecture canvas:

- render each selected product exactly once;
- use an ordered lifecycle coverage ribbon or matrix rather than a free-form graph;
- each product card shows its six-stage coverage at a glance and reveals exact capabilities on selection;
- selecting a product highlights all capabilities it covers;
- selecting a capability spotlights matching selected products and dims unrelated detail without hiding it;
- distinguish core from supplemental coverage;
- keep connector or highlight treatment restrained and readable;
- never produce crossing-line spaghetti;
- show a concise empty state with the next action.

Adding a product is global. Dropping or adding from a selected capability records interaction context but does not place the product into a capability box. Coverage is always derived from product metadata.

Add to stack is the canonical P0 interaction on every device. Do not install a drag-and-drop dependency or ship a fragile custom drag system merely for spectacle. If desktop drag and drop is added after P0 passes, it must invoke the same command and have an equally capable click, tap, and keyboard path.

Shortlist/inspector:

- show up to five qualified organic products, never pad the list;
- order by the deterministic organic ranking value; integration is already one Fit dimension and must not be counted twice;
- group only when useful: Best fit, Works with your stack, Specialized options, and Already covered;
- put View all after the shortlist;
- keep sponsored inventory in a separate, visibly labeled unit;
- sponsorship must never change Fit Score, organic rank, Stack Health, or comparison conclusions.

Initial product card content:

- logo or stable fallback;
- name and one-line positioning;
- Fit Score plus data-confidence label;
- honest price indication;
- ideal practice size;
- up to three specific fit reasons;
- current-stack integration state;
- coverage breadth;
- verified or vendor-supplied status;
- Add, Replace, Compare, Details, and Request demo only when each action is real in the current context.

Move limitations, complete score math, provenance, integration notes, and migration detail into an accessible Why this fits drawer.

## Tablet and mobile

Do not shrink the desktop layout.

At intermediate widths, keep the lifecycle rail and canvas when space permits, and move one contextual pane into a labeled sheet or drawer.

Below 768 CSS px use a focused sequence:

1. practice summary and Stack Health;
2. mode and lifecycle stage selector;
3. selected capability and current coverage;
4. architecture product cards;
5. personalized shortlist;
6. sticky contextual stack action when useful.

Use tap to add as the primary mobile action. Drag and drop is optional on touch. Preserve selection and entered data across responsive transitions.

# Core interactions

## Add, remove, reset, and undo

- Add immediately updates the stack, coverage, gaps, overlap, fit context, health, and cost.
- Adding a selected product again does not duplicate it. Focus its existing card and explain that it is already in the stack.
- Add, Remove, Clear stack, relevance or priority changes, and Apply replacement are atomic reversible history entries.
- Maintain at least the 10 most recent local stack mutations.
- Undo restores the exact previous stack and derived state.
- Clear stack removes products but preserves the fingerprint and is undoable.
- Reset preferences restores derived relevance and default priorities but preserves products and is undoable.
- Delete local Architect data clears fingerprint, stack, and history. It is explicitly named, requires a specific confirmation, and cannot be undone.
- Local mutations should feel immediate; never use a full-page spinner.
- A failed persistence action must preserve the in-memory stack and explain the recovery path.

Every drag action must have an equally capable click, tap, and keyboard alternative.

## Replacement

Replace opens a before/after preview and does not mutate the stack.

Compare:

- Fit Score and confidence;
- capabilities gained and lost;
- monthly and annual estimated cost;
- integration changes;
- overlap removed or introduced;
- new gaps;
- implementation complexity;
- migration complexity and any unknowns.

Only Apply replacement commits the change. Treat the remove-and-add as one atomic history entry. Cancel leaves the stack byte-for-byte equivalent to its prior state.

## Why this fits

Every recommendation exposes:

- why it fits;
- requirements satisfied;
- requirements not satisfied or unknown;
- current-product overlap;
- integrations and provenance;
- limitations;
- estimated pricing and assumptions;
- implementation and migration complexity when sourced;
- compliance and security facts with provenance;
- alternatives.
- a canonical full product-page link under /tools/for-clinicians/[primary-category]/[slug] when the real product is publishable.

Use factual language. Reuse the existing verification vocabulary: verified, vendor_provided, public_source, unverified, and unknown. Keep editorial review status separate. Mark estimated or derived values as calculation origin, not as a competing provenance status. Never turn marketing copy into product truth.

# Domain and data architecture

Create an Architect bounded context, preferably under src/domains/architect, with pure, typed engines separated from React rendering.

At minimum model and validate:

- PracticeFingerprint;
- LifecycleStage and Capability;
- ProductArchitectureMetadata, including whether its capability mapping is reviewed complete, reviewed partial, or unreviewed;
- ProductCapability;
- ProductIntegration;
- ProductFitEvidence for practice type, size, specialties, roles, payer model, prescribing, delivery, geography, implementation, and migration fit;
- PracticeStack and selected product;
- FitResult and evidence contribution;
- CapabilityAssessment;
- OverlapAssessment;
- CostEstimate;
- StackHealthResult;
- persistence envelope with schema version.

Use Zod at data and persistence boundaries.

Reuse the canonical clinician product slug and existing product record. Store additive Architect metadata keyed by that slug, or add backward-compatible optional fields to the existing V4 schema when that is demonstrably cleaner. Do not create a second Product truth source.

ProductCapability must support:

- product slug and capability id;
- strength: core, strong, partial, addon, or integration-only;
- base-price inclusion;
- add-on requirement;
- limitation text;
- provenance status;
- source URL;
- last verified date.

ProductIntegration must support:

- source and target product slugs;
- type: native, API, third-party, browser extension, import/export, manual, incompatible, or unknown;
- direction: one-way or bidirectional;
- notes;
- provenance status;
- source URL;
- last verified date.

Pricing must support:

- per provider;
- per practice;
- per location;
- per encounter;
- percentage of collections;
- transaction based;
- custom quote;
- freemium;
- one-time implementation;
- tiered ranges;
- ISO currency, billing cadence, unit, effective or last-verified date, and structured tier boundaries.

Never parse prose pricing notes into arithmetic. If the structured fields needed by a formula are absent, return Unknown.

Do not assume the existing single category or capability array is sufficiently expressive. Preserve it for existing pages and add the many-to-many strength/provenance layer Architect needs.

Only recommend real products that pass the existing publication gate. Keep fictional example records in an isolated, clearly marked Architect demo fixture; never let them appear in public product pages, organic search, sitemaps, analytics as real products, or demo-request lead flows.

At the time this prompt was prepared, the strict V4 loader exposed only nine publishable products and all were EHR/practice-management products. Recount from the live loader and data/tools-v4/generated/canonical-validation-report.json. Do not expose draft, invalid, or non-allowlisted records to fill other lifecycle stages.

Generate a preflight inventory report by lifecycle capability: publishable products, reviewed-complete mappings, reviewed-partial mappings, and unmapped products. A capability may show Best fit only when at least one publishable product has sufficient provenance-backed Architect metadata. If important lifecycle groups remain data-incomplete, show a restrained Catalog coverage: beta notice and describe current coverage honestly. The engine may be production-complete while ecosystem data remains incomplete; do not claim full-market recommendation coverage.

When product metadata is incomplete, the engine and UI must still work and show unknown or insufficient data. Never fabricate price, integration, compliance, review, popularity, implementation, or compatibility facts.

For Architect scoring, an empty V4 audience, specialty, capability, or integration array means unknown unless reviewed Architect metadata explicitly marks that mapping complete. It does not mean universal fit, no coverage, or incompatibility.

# Deterministic engines

All engines must be pure functions over validated inputs. UI components consume results; they do not reimplement scoring rules.

## Fit Score and confidence

Fit Score is 0–100 and uses these applicable dimension weights:

- hard requirements: 25;
- needed capability alignment: 20;
- practice type and size: 15;
- clinical, payer, delivery, prescribing, and geography fit: 15;
- integration with the current stack: 10;
- stated priorities: 10;
- cost fit: 5.

For each applicable dimension, classify sourced evidence as match 1.0, partial 0.5, mismatch 0, or unknown.

When a dimension contains several atomic criteria, calculate its value as their equal-weight mean unless the capability registry defines explicit criterion weights. Count each fact once. In particular, current-stack integration is already a Fit dimension and receives no second shortlist boost.

Calculate:

- Fit Score = rounded weighted match across known dimensions only.
- Data confidence = rounded weight of known dimensions divided by total applicable weight.
- Organic ranking value = round(0.70 × Fit Score + 0.30 × Data confidence).

Do not expose the organic ranking value as though it were the Fit Score.

Rules:

- Verified hard incompatibility excludes the product from ordinary recommendations and explains why.
- Unknown is not an incompatibility and does not become a factual mismatch.
- Confidence below 50 must be labeled Limited data.
- If no applicable dimension has known evidence, show Insufficient data, return no numeric Fit Score, and exclude the product from Best fit.
- A sparse product cannot receive a Best fit label solely from a high score on one known field.
- The Why drawer shows positive, negative, partial, and unknown contributions.
- User priority changes rerank results from the same rules.
- Sponsorship is never an input.
- Break equal ranking values by higher confidence, then higher Fit Score, then canonical slug for stable output.

## Coverage

Map reviewed ProductCapability strength to coverage:

- core = strong coverage, numeric contribution 1.0;
- strong = covered, numeric contribution 0.8;
- partial = partial, numeric contribution 0.5;
- addon = partial, numeric contribution 0.35;
- integration-only = partial, numeric contribution 0.2.

For a capability, use the highest reviewed selected-product contribution:

- missing when the stack has no selected products;
- unknown when no affirmative mapping covers it and at least one relevant selected product has an unreviewed or partial capability map;
- missing only when all relevant selected products have reviewed-complete capability maps and none covers it;
- partial when the best affirmative mapping is partial, addon, or integration-only;
- covered when the best affirmative mapping is strong;
- strong when the best affirmative mapping is core.

Coverage expresses sourced product capability only. Fit Score never changes coverage strength.

Relevance weights:

- required = 1.0;
- strongly recommended = 0.75;
- useful = 0.4;
- optional = 0.15;
- irrelevant = 0.

The coverage subscore is the relevance-weighted average of known capability contributions. Coverage confidence is the sum of relevance weights with known coverage divided by all non-irrelevant relevance weights. Unknown coverage is excluded from the score and lowers confidence. Irrelevant capabilities do not penalize the stack.

## Gaps

A product gap is a required or strongly recommended capability whose reviewed coverage is missing or partial. Unknown coverage is a separate data gap and must not become a factual claim that the practice lacks a product. Sort required/missing first, then strongly recommended/missing, then partial gaps. Every product gap opens the corresponding shortlist; every data gap explains what mapping evidence is missing.

Profile examples:

- Prescribers make prescribing required.
- Controlled substances make EPCS required.
- Insurance-heavy practices elevate eligibility, claims, billing/RCM, denial management, and credentialing.
- Cash-pay solo therapists reduce claims and credentialing relevance while increasing scheduling, intake, payments, and patient experience.

Encode these as readable decision tables with tests, not scattered conditionals.

## Overlap

Evaluate overlap independently from coverage.

Create an overlap candidate when two selected products both provide core or strong coverage for the same capability.

Classify:

- useful specialization when one product adds a sourced specialized workflow or meaningful adjacent capability;
- benign overlap when duplication is limited or commonly bundled;
- probable redundancy when two products have materially duplicate core coverage and neither has a sourced differentiator relevant to the profile.

Never tell the user to cancel a product solely because feature names overlap. Explain the shared capabilities and differentiators.

## Compatibility

Treat product-pair compatibility as compatible, concern, incompatible, or unknown. Direction matters.

Only sourced explicit incompatibility may produce incompatible. Missing integration evidence produces unknown, never incompatible. Surface provenance and last-verified date.

## Stack Health

Calculate only these explainable P0 subscores:

- coverage, 35%: the relevance-weighted known coverage contribution above;
- practice fit, 25%: the weighted mean Fit Score of selected products, where each product weight is the total relevance weight of the known capabilities it covers;
- compatibility, 20%: mean of known selected-product pair states, scored compatible 100, concern 50, and incompatible 0; with fewer than two selected products this dimension is not applicable;
- cost efficiency, 10%: only when a budget and complete comparable monthly cost range exist; score 100 when maximum cost is within budget, 70 when the budget falls inside the range, otherwise max(0, round(100 × budget / minimum cost));
- data confidence, 10%: equal-weight mean of capability-map completeness, mean selected-product Fit confidence, known selected-product-pair integration coverage, and structured-pricing coverage. Score mapping completeness as reviewed complete 100, reviewed partial 50, and unreviewed 0; score integration and pricing coverage as known applicable records divided by applicable records.

If a subscore lacks required evidence, show Not enough data rather than zero. Calculate overall Stack Health as the weighted average of known applicable subscores. Stack Health confidence is the known applicable weight divided by total applicable weight. Below 60% confidence, label the result Limited data and do not present it as a definitive grade.

Report automation and scalability as sourced opportunities or limitations, not numeric P0 subscores. A later version may score them only after the metadata contract and fixtures define deterministic formulas.

Summarize clickable counts for important gaps, overlaps by class, compatibility concerns, and optimization opportunities.

## Cost

Return structured minimum, maximum, billing basis, assumptions, formulas, one-time fees, variable components, and unknown-product count.

- Per-provider pricing uses the relevant clinician count.
- Per-prescriber pricing uses prescriber count.
- Per-location pricing uses exact location count.
- Per-encounter pricing uses encounter volume.
- Transaction pricing uses the matching transaction volume and unit.
- Revenue-share pricing requires monthly collections.
- Custom quote stays Custom quote.
- Unknown stays Unknown, never zero.
- If some products are unknown, show the known subtotal as a range plus the number of custom or unknown items. Do not present it as total stack cost.
- Show monthly, annual, and per-clinician values only when the inputs support them.
- Never combine unlike currencies, periods, or units until they are explicitly normalized.

# Apple-caliber craft, HeyPsych-native identity

Interpret Apple-caliber as exceptional clarity, hierarchy, agency, familiarity, adaptability, restraint, feedback, accessibility, and attention to detail.

Do not imitate Apple branding, apple.com layouts, device chrome, proprietary assets, SF Symbols, or fake macOS controls. Use the existing HeyPsych identity, semantic tokens, system font stack, Lucide icons, and UI components.

## Hierarchy and composition

- Make the architecture, not dashboard chrome, the visual hero.
- Use spacing, alignment, type, and contrast before adding containers.
- Do not wrap every row or metric in a card.
- Keep one high-emphasis primary action per view.
- Keep controls visually distinct from content.
- Use one restrained accent family and semantic status colors.
- Pair every status color with text and a distinct icon or shape.
- Use no more than three perceived elevation levels in one view.
- Reserve translucency and backdrop blur for a small number of floating navigation, toolbar, drawer, or sheet layers.
- Keep primary content opaque and legible.
- Avoid decorative gradients, glows, glass everywhere, pill overload, giant headings, arbitrary colors, card mosaics, and ornamental metrics.

Initial product cards show only what supports the decision. Advanced details belong in the drawer. Never stack drawers inside drawers or create modal chains.

## Typography and copy

- Use the live HeyPsych type scale and system font stack; do not bundle Apple fonts.
- Default body copy should remain comfortably readable at approximately 16–17 CSS px.
- Use regular, medium, semibold, and bold deliberately; avoid thin text.
- Use sentence case, plain language, active voice, and verb-led labels.
- Prefer Add to stack, Compare options, Apply replacement, and Pricing assumptions over vague labels.
- Avoid hype, exclamation points, cute clinical copy, Click here, generic Error, and unsupported AI-powered claims.
- Let important labels wrap rather than truncate.

## Motion and feedback

Motion explains cause and effect; it is not decoration.

- Use approximately 120–200 ms for hover, press, and small state feedback.
- Use approximately 200–350 ms for panes, drawers, reorder, and architecture changes.
- Prefer opacity, transform, and restrained highlight transitions.
- When a product is added, connect the initiating action to its single architecture location and softly highlight newly covered capabilities.
- When Fit Score, cost, or health changes, animate only the changed value and explain the cause in text.
- Avoid bounce, parallax, ambient loops, pulsing status, confetti, and long count-up animations.
- Under prefers-reduced-motion, remove travel, scale, blur, parallax, and decorative loops. Preserve meaning with instant updates or a brief fade.
- Never delay access to content for animation.

Every custom control needs the applicable default, hover, pressed, focus-visible, selected, disabled, loading, success, and error states.

## Loading, empty, stale, error, and success

Every asynchronous region must handle loading, partial, empty, stale, error, success, and recovery independently.

- Render the stable shell immediately.
- Use geometry-preserving skeletons for lists and cards.
- Use a compact progress indicator inside the initiating control for local actions.
- Never replace the full workspace with a spinner when useful context is available.
- Distinguish empty stack, no filter results, no verified products, and data unavailable.
- Explain why a region is empty and give one useful next action.
- Preserve user input, focus, selection, and stack state after errors.
- Put field errors beside the field.
- State what failed, what was preserved, and what the user can do.
- Confirm routine success near the changed element and offer Undo when relevant.
- Avoid blocking success modals.

When no verified products exist, say:

We’re still mapping this part of the ecosystem.

Offer a real follow-up only if its handler exists. Never invent recommendations to fill the screen.

## Accessibility

Meet WCAG 2.2 AA.

- Use semantic HTML before ARIA.
- Keep pointer and touch targets at least 44 by 44 CSS px.
- Support the complete core flow without drag, hover, color perception, precise pointer input, or animation.
- Tab order follows visual order.
- Focus is clearly visible.
- Escape closes transient layers.
- Modal sheets and dialogs trap focus, name themselves, make the background inert, and return focus to their trigger. A persistent desktop inspector is nonmodal, remains in normal tab order, and does not trap focus or inert the workspace.
- Announce meaningful coverage, score, save, and replacement changes through restrained live regions.
- Provide a structured nonvisual representation of products, covered capabilities, strength, gaps, overlap, and compatibility.
- Support 200% browser zoom without lost content or function.
- Honor reduced motion and forced/high contrast modes.
- No canvas-only information.

# Search and recommendation behavior

Support fuzzy search by product name, capability, vendor, and use case. Reuse Fuse.js or the repository’s existing search pattern where appropriate.

Do not fetch a giant catalog into the browser. Use server-side loading, a bounded candidate set, caching, and pagination as the catalog grows.

Default order is best fit for the current practice. Only offer price, popularity, rating, and implementation sorting when trustworthy fields exist. Never synthesize missing popularity or ratings.

Recommendations rerank when practice size, type, payer mix, prescribing, state footprint, delivery, selected products, priorities, or budget changes.

The interaction should update immediately from local deterministic data when possible. If a server result is required, preserve the prior useful state, mark it Updating, debounce rapid changes, and reject stale responses.

# Trust, privacy, security, and monetization

- No patient PHI is needed or permitted.
- Never ask for patient names, diagnoses, records, free-text clinical notes, or identifiers.
- Treat practice profile and stack data as private unless a future explicit share action says otherwise.
- Validate all inputs.
- Use row-level security for any future user-owned tables.
- Use high-entropy, revocable identifiers for future shares; never put private profile data in URLs.
- Rate-limit abuse-prone write endpoints.
- Keep server-only credentials server-only.
- Do not place exact geography, budget, free text, contact data, or patient data in analytics.
- Product slug and coarse anonymized practice segment may be tracked when consistent with the current analytics contract.

Fit Score cannot be purchased.

Show this concise explainer beside recommendation results:

HeyPsych Fit Scores are based on practice compatibility and cannot be purchased by vendors.

Sponsored products may appear only in a separate labeled unit. They cannot affect organic rank, score, gap analysis, Stack Health, or comparison conclusions. Reuse the existing sponsorship and demo-request trust patterns.

The current campaign service is associated with the V3 catalog. Do not infer a V3-to-V4 sponsorship mapping from names. Show no Architect sponsored item until an explicit canonical-slug mapping passes validation.

# Analytics

Reuse and extend the current typed analytics layer. Instrument only real events:

- architect_started;
- architect_mode_selected;
- practice_profile_completed;
- stack_audit_started and completed;
- product_viewed;
- product_added and removed;
- replacement_previewed and applied;
- gap_opened;
- overlap_opened;
- fit_explanation_opened;
- stack_saved_local;
- demo_requested when the existing real flow is used.

Include only the minimum useful product slug, capability slug, coarse practice segment, source, and recommendation position. Never include sensitive free text or patient-level data.

# Fixed demo fixture and acceptance scenario

Create a small isolated fixture of fictional products with conspicuous demo status. Give it enough validated capability strengths, integrations, fit facts, and pricing to exercise every engine. Include at least:

- a broad EHR/practice suite;
- an RCM product;
- an AI documentation specialist;
- an eRx/EPCS specialist;
- a communications specialist;
- a credible replacement EHR with different gains, losses, price, and integrations.

The fixture must make this scenario deterministic:

A user runs an 18-provider therapy plus psychiatry practice in California and New York, accepts mostly insurance, has prescribers who need controlled-substance support, and starts with the demo EHR and communications products.

Automated tests must assert exact numeric outputs for the fixture’s Fit, confidence, coverage, health, and cost calculations rather than only snapshotting markup. They must also prove:

1. The fingerprint marks prescribing and EPCS required and elevates insurance revenue capabilities.
2. Each selected product exists once even when it covers many capabilities.
3. The broad EHR covers several lifecycle groups.
4. Communications overlap is classified independently from coverage and is not automatically called redundant.
5. The initial stack has at least one required prescribing gap and one insurance-workflow gap.
6. Adding the AI documentation specialist covers its capability and classifies documentation overlap as useful specialization.
7. Adding a product creates one undo entry; adding the same product twice remains idempotent.
8. The shortlist contains no more than five qualified products and never pads an empty result.
9. Fit Score is deterministic, explains every contribution, and displays data confidence.
10. Sponsorship changes neither organic rank nor any score.
11. Unknown integration remains unknown rather than becoming incompatible.
12. Unknown price remains unknown rather than becoming zero.
13. Replacement preview changes no persisted or in-memory stack state.
14. Applying replacement is atomic, reports gains and losses, and creates one undo entry.
15. Undo restores the exact prior stack.
16. Cost reports known range plus unknown or formula-based items without a false grand total.
17. Local persistence rehydrates the same versioned fingerprint, stack, and history after reload.
18. Corrupt or older local data fails safely, migrates when supported, and never crashes the route.
19. Keyboard-only operation completes fingerprint, add, details, replace, apply, undo, remove, and save.
20. Mobile completes the same workflow without horizontal page scrolling.
21. Absent capability metadata produces unknown/data gap unless a reviewed-complete map proves missing.
22. Demo state never persists, mixes with real stack state, emits product analytics, or triggers a lead.
23. A user relevance override changes gap and health calculations, persists separately from the derived default, and explains the override.

Do not use fictional products outside the example and test paths.

# Performance and resilience

Targets for representative production conditions:

- LCP at or below 2.5 seconds at the 75th percentile;
- INP at or below 200 ms;
- CLS at or below 0.1;
- cached shortlist updates at or below 300 ms;
- uncached shortlist feedback begins immediately and ordinarily resolves within 1 second.

Use these as engineering targets, not fabricated claims. Measure what the local environment permits and report what could not be measured.

- Lazy-load heavy builder-only interactions.
- Keep scoring engines pure and cheap.
- Memoize derived state from stable inputs.
- Index future relational product-capability, product-integration, stack-owner, and share-token access paths.
- Cache public product metadata.
- Paginate View all.
- Do not ship the full raw catalog or source metadata to the client.
- Reject stale asynchronous recommendation results.
- Let one failed pane degrade without taking down the workspace.

# Implementation shape

Prefer a structure that makes domain behavior testable and UI pieces replaceable:

- src/domains/architect for schemas, types, fixtures, relevance, fit, coverage, overlap, compatibility, health, cost, selectors, and tests;
- src/components/architect for the workspace, lifecycle, architecture, shortlist, drawers, fingerprint, audit, and responsive components;
- src/app/architect for routes and server boundaries;
- additive data/architect metadata keyed by canonical clinician product slug when needed;
- additive Supabase migrations only when P0 truly needs server persistence.

Names may vary when repository conventions indicate a better fit. Do not force this folder map if it conflicts with an established bounded-context pattern.

Keep server components by default. Use client components only around interaction boundaries. Keep domain calculations independent of React, storage, network, and time.

# Validation and visual QA

Before finishing:

1. Run focused unit tests for every engine and persistence behavior.
2. Run Architect end-to-end tests for the fixed scenario.
3. Run the repository type check.
4. Run lint on changed files or the narrowest reliable equivalent.
5. Run a production build if the environment supports it.
6. Run npm run validate:tools:v4 if the V4 schema or Architect metadata bridge changes.
7. Render and inspect the real pages, not just source code.
8. Capture representative screenshots around 390 by 844, 768 by 1024, and 1440 by 1000.
9. Also check 320 CSS px width and 200% zoom.
10. Exercise reduced motion and keyboard-only operation.
11. Inspect loading, empty, limited-data, error, populated, overlap, and replacement-preview states.

Visually reject and revise any result with:

- clipped or overlapping text;
- page-level horizontal scrolling;
- equal emphasis across all 40 capabilities;
- excessive cards, borders, pills, blur, gradients, or shadows;
- multiple competing primary CTAs;
- dense unreadable connectors;
- ambiguous selected state;
- color-only status;
- desktop panes squeezed onto mobile;
- layout shift from mismatched skeletons;
- controls that look interactive but do nothing;
- generic dashboard or SaaS-template appearance.

Do not silence unrelated failures or rewrite unrelated code to make a command green. Distinguish pre-existing failures from regressions with evidence.

# Stop rules

Stop only when:

- every P0 acceptance criterion is implemented and validated; or
- a genuine external dependency prevents completion after safe local alternatives are exhausted.

If blocked, leave the application in the strongest working state, name the exact missing dependency, and provide evidence. Do not replace missing functionality with mock success.

# Final response

Lead with the outcome. Keep it concise and include:

1. what was built;
2. key domain or schema changes;
3. routes and major files added;
4. validation run and results;
5. visual QA viewports inspected;
6. honest data limitations or P1 items not implemented;
7. exact local commands to run and test.

Do not provide a long retrospective or repeat this specification.
