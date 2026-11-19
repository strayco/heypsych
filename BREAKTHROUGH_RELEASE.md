# HeyPsych: The Breakthrough Release

## Three problems solved

1. **The decision was a wizard that ended in a document.** Six screens, then a
   static page. Seeing how a different answer changed the result meant
   stepping back through screens.
2. **Your Path was lists stacked on top of a long brief.** The connections
   between symptoms, conditions and treatments were invisible, nothing showed
   progress or what was missing, and the printable brief dominated the page.
3. **Practice Architect started empty.** A clinician faced 13 separate
   decisions before seeing any value, and cost, tradeoffs and the plan were
   scattered across a header line, a separate tab and a .txt download.

## The interaction model: a live decision board

Your state sits on one side and its live consequences on the other. Every edit
recomputes immediately, and the board shows what changed and why, what's
missing, and what would lead somewhere else. The artifact is a one-tap output,
not the experience. The same model runs everywhere:

| Surface | Your state | Live consequence |
|---|---|---|
| **Find your next step** (`/find-support?need=support`) | Answer chips, pre-filled from your notes, editable in any order | The evaluator's next step, recomputed on every tap: "Changed from Talk Therapy because you added…", a 3-segment confidence meter, "what would change it" (tap to try), actions |
| **Your Path** (`/my-path`) | Noticed → Exploring → Considering → Next step, as a map | Select anything and its connections light up (lines on desktop); the inspector shows the reviewed facts, warnings first, and what it adds to the brief. A readiness strip shows the next useful step and fixes it in place. Appointment date with a countdown. The brief is a tab. |
| **Condition and treatment pages** | What you kept elsewhere | "Connects to your path: Low Mood (you noticed it)", before you even save |
| **Practice Architect** | The office | **Draft my practice**: one tap fills every needed function with the engines' best eligible pick (all-in-one first; a solo therapist goes from 0 to 10 of 13 decided). A live **plan ledger** shows monthly cost (unknown prices never counted as $0), coverage, tools, items to verify and suggestions to keep. A printable **practice plan** shows the stack, what each tool covers, monthly and first-year cost, checks before signing, and what's still open, with each tool linked to its HeyPsych profile. |

## What's built

- **New pure, tested logic:**
  - `src/domains/path/what-if.ts` re-runs the evaluator on one-answer variations.
  - `readiness.ts` measures how complete the notes are, never the person.
  - `graph.ts` derives connections from reviewed content only, never scored.
  - `src/domains/architect/services/draft-stack-service.ts` drafts a stack from the existing eligibility, recommendation and coverage engines. It never overwrites the clinician's own choices.
- **Rebuilt UI:**
  - `NextStepJourney.tsx` is now the live board.
  - `PathMap.tsx` and `PathWorkspace.tsx` are the map, inspector, readiness strip and tabs.
  - `PlanLedger.tsx` and `PracticePlanSheet.tsx` serve Practice Architect.
  - `SaveToPath` shows connections.
- **Return and revenue signals** (privacy-safe, in `DECISION_EVENTS_CONTRACT.md`):
  - `path_returned` (days bucket)
  - `path_next_step_kept` (decision completed)
  - `path_qualified_action` (decision → options, profiles or directories)
  - Architect: `architect_blueprint_generated` and `architect_stack_export`
  - Clinical and commercial paths stay separate: no commercial input reaches any evaluator, draft or connection.
- **Unchanged:** crisis handling (safety question first, never pre-filled; the crisis screen shows only crisis help), deterministic evaluator selection logic, local-only storage, provenance on every question, URLs, server HTML, structured data and canonicals.

## Verified

- `tsc --noEmit` clean.
- ESLint: 0 errors on touched files.
- Vitest: **1,816 passed** across 83 files. New tests cover what-ifs (never crisis, consistent with the evaluator), readiness, the graph (no scoring language) and drafting (against the real catalog: eligible only, deterministic, matches the inspector's pick, never overwrites the clinician's choices, keeps EPCS verification flags).
- Production build passes. Font shim used in the build sandbox only, then reverted.
- Playwright `tests/e2e/your-path.spec.ts`: **5 of 5 pass** against `next start`. Covers the empty map, the full consumer journey (live recompute, change note, map connections, in-place readiness fix, brief), crisis, noindex, and the clinician journey (onboarding → draft → ledger → plan).
- axe-core (WCAG 2.2 AA rules): **0 violations** on the board, map, map with inspector open, brief, drafted office and plan. Fixed along the way: a site-wide footer line at 2.46:1 contrast.
- No horizontal overflow at 320, 390 and 768 px. Keyboard: focus moves to each result and into the inspector, and Escape returns focus to the node.

## Blockers before launch

1. **Clinical review (still unassigned) is required** for:
   - the brief's question templates
   - "what would change it" and the "changed because" wording
   - "Connects to your path" on condition pages
   - the journey departures recorded in `PATIENT_PILOT_CONTRACT.md` §12 and §12.1

   **This release is not clinically ready until that review is done.**
2. **Practice Architect drafts inherit the engine's ranking.** For example, ICANotes is drafted first for a solo therapist. Catalog BAA and delivery-model review is still the largest data risk, and drafted picks carry its "verify" flags.
3. **Pre-existing site-wide issue:** an unlayered `a { color: inherit }` overrides Tailwind link colours. The new code works around it; the global fix needs a visual review.
4. **Not done:** physical devices, VoiceOver/NVDA, Lighthouse, and the full legacy Playwright suite.
5. **Not deployed.** Production deployment needs your approval.
