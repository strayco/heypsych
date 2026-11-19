# HeyPsych Next — Your Path

## The breakthrough in one sentence

HeyPsych stops being a set of excellent pages you read and leave. Everything
you notice, read about, weigh and decide now adds up to one private working
file, **Your Path**. Your Path turns into a decision (a reasonable next step,
with its reasons and how sure it is) and an artifact: an **appointment brief**
that you bring to the conversation that actually changes care.

> Browse → collect → decide → walk in prepared.

## What we found (the five limitations)

1. **The product forgot you on every page.** Visitor state lived in seven
   separate browser stores that never read each other: noticed symptoms
   (`hp:noticed`), saved apps (`hp:saved-apps`), self-help ticks
   (`hp:selfhelp:*`), the ladder, treatment compare, clinician practice, and
   the Architect project. A condition or a treatment couldn't be kept at all.
   Whatever you learned stayed on the page you learned it on.
2. **The decision engine was orphaned.** The patient-support evaluator, with
   20 clinician-reviewed golden tests and the pilot journey from decision D-003,
   was never called from any page. "Find my way → treatment or support" was
   three static links, and all three pointed at retired URLs that bounced
   through 308 redirects. It was the same class of drift as Architect's
   `POPULAR_TOOLS`.
3. **No finish line.** The platform promises "a defensible next decision", but
   exploring never ended in an outcome. The only artifact was a printout of the
   noticed-symptoms list.
4. **The knowledge graph never got personal.** Symptoms, conditions and
   treatments are richly linked, but never in terms of *your* set: what a
   clinician will check for the condition you're reading about, or which of the
   treatments you saved are used for it.
5. **Returning visitors were strangers.** The homepage and Find Support asked
   "where would you like to begin?" on every visit.

## What we built, and how it changes what existed

| Existing capability | What it becomes |
|---|---|
| `patient-support` evaluator (unused) | **Find your next step**, the real journey at `/find-support?need=support`. Safety question first, and "in crisis" stops the journey. Answers are pre-filled from your own notes and labelled so you can change them. The result shows its reasons, a "how sure is this?" label with a link to the answer that would sharpen it, alternatives, live next actions (pay-aware), and "Keep in my path". |
| "I've noticed this" (symptom pages) | Feeds the journey's concerns and duration, and becomes the brief's "What I've noticed" (durations editable in the workspace) plus "Other things that can cause this", drawn from the reviewed symptom guides. |
| Condition pages | **Save to your path.** The brief gains what an evaluation involves, the questionnaires that may be used, and what the condition can be confused with. Each is a question with its source and review date. |
| Treatment pages | **Add to your path.** The brief gains questions from the record: a boxed warning (always first), onset, side effects, monitoring, controlled-substance refills, interactions, pregnancy. Therapies get course, format and training questions. Saved treatments can be compared side by side. |
| Self-help checklist | Becomes "What I've tried", the standard intake question. It is now stored as text, and old index-based ticks are migrated on read. |
| Saved apps | Show in the path, with a compare-two link. |
| Architect project | Shown on `/my-path` as "For your practice", so a clinician has one "my HeyPsych" place too. |
| Homepage / header | The header shows a **Your path · N** link once you've kept anything. Returning visitors get a "Welcome back" strip under the worlds. First visits are unchanged. |

**`/my-path`** brings it together: your next step (sticky on desktop, first on
mobile), what you've noticed, the conditions you're reading about (linked to
your saved treatments), the treatments you're considering (boxed warnings shown
up front), saved apps, what you've tried, and the **appointment brief**. The
brief prints or saves as a PDF on its own, copies as plain text for a portal
message, and takes up to eight of your own questions.

### Design rules held

- **Local only (D-012).** No network requests and no account. Facts are
  snapshots of reviewed records taken at save time and refreshed whenever you
  reopen the page. The workspace and the stores can be cleared in two taps.
- **Never diagnostic.** The brief organises what the visitor kept. It never
  ranks conditions by symptom overlap and never recommends a treatment, and
  tests enforce this (advice-phrase and ranking-language guards over all 130
  condition and 484 treatment records).
- **Deterministic and provenance-first.** Every generated question carries the
  fact that prompted it and "From HeyPsych guide, reviewed ⟨date⟩".
  Versioned: `brief-1.0.0+q1.0.0`; evaluator `1.1.0` (hrefs only).
- **Privacy-safe analytics.** Event kinds and buckets only, never slugs, names,
  answers or question text (`DECISION_EVENTS_CONTRACT.md`).
- **Commercial separation (D-007).** The path contains no commercial
  placement. Its actions lead to the existing intent pages and profiles, where
  the existing disclosed-affiliate layer (dormant until there are partners)
  applies.
- **SEO preserved.** No public URL changed. `/my-path` is `noindex` and
  disallowed in `robots.txt`. Condition and treatment pages keep their server
  HTML and structured data; the save control is a small island.
- **Rollback.** `NEXT_PUBLIC_PATH_WORKSPACE=false` hides the save controls,
  header count and resume strip, redirects `/my-path` to `/find-support`, and
  restores the previous three links (now pointed at live routes). Nothing in
  visitors' browsers is deleted.

## The 10x questions, answered honestly

- **Why would a consumer prefer this?** Other mental-health sites end at an
  article. HeyPsych now ends with the visitor holding a one-page brief: what
  they've noticed and for how long, what they've tried, other causes worth
  asking about, and the specific questions for the condition and treatments on
  their mind, each traced to a reviewed source. No account, nothing uploaded.
- **What can users do now that they couldn't before?** Keep a condition or a
  treatment; get a reasoned next step that knows what they already noted; see
  their whole picture on one page; print or paste an appointment brief; pick up
  where they left off.
- **Why is the interaction better?** It accumulates. Each page you save makes
  the journey shorter and the brief more specific, so the site becomes more
  useful the more you use it, rather than just longer.
- **Why would people return?** Their path is there, and the next appointment
  (or the next one after that) is a reason to update it.
- **Where does engagement create commercial value?** A kept next step leads to
  the matching intent page (online therapy, psychiatry, takes-insurance), which
  is where disclosed partner relationships will sit. Saved apps lead to
  compare and then to the profile. For clinicians, Architect stays the
  monetisable path (setup-plan sign-ups). Kept next steps and printed briefs
  are the measurable proxies for "decision completed".
- **What is the distinctive advantage?** Reviewed structured data turned into
  personal, sourced questions, entirely on the device. A competitor needs both
  the reviewed corpus and the privacy posture to copy it.
- **Clinicians?** Clinicians already had the strongest product (Architect 3.x),
  so this release links it in rather than rebuilding it, per D-001. That's
  honest scope: the clinician side gains a home on `/my-path`, not a new
  engine.

## Launch verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| ESLint on every touched file | 0 errors, 0 warnings in new code |
| `vitest --exclude psychTrail` | 82 files, **1,806 passed**, 1 skipped, 0 failed (22 new Path tests; patient-support golden tests unchanged and passing) |
| Facts over every record | 130 conditions, 484 treatments: no empty or `[object Object]` text, no advice phrasing |
| Production build | See the build line in the implementation brief (built with mocked Google Fonts, because the build sandbox has no access to fonts.googleapis.com) |
| Browser journey (headless Chrome, dev server) | Symptoms noted → condition and treatments saved → header "Your path, 5 items" → journey pre-filled (Mood & Motivation, Sleep; "More than three months") → Integrated Care → kept → brief shows everything. No hydration or runtime errors. |
| Crisis branch (keyboard only) | Space on "I'm in crisis" → focus moves to the crisis heading; three `tel:988` links; no way to continue the journey |
| Keyboard focus | Each step moves focus to its question heading |
| Responsive | 1440, 390 and 320 px: no horizontal overflow; next step first on mobile |
| e2e spec | `tests/e2e/your-path.spec.ts` (first visit, full journey, crisis, noindex/robots) |

## Unresolved blockers (honest list)

1. **Clinical review required before public launch:** the brief's question
   templates (`src/domains/path/questions.ts`) and three departures from the
   patient pilot contract (no mid-journey crisis goal, no modality question,
   "not sure" continues instead of branching; see `PATIENT_PILOT_CONTRACT.md`
   §12). The clinical owner is still unassigned (an existing blocker).
2. **Pre-existing site-wide link-colour bug:** `globals.css` has an unlayered
   `a { color: inherit }` that overrides every Tailwind v4 `text-*` utility on
   links, so `text-accent` on a link never shows. Your Path works around it.
   The global fix (moving the rule into `@layer base`) changes link colours
   site-wide and needs a visual review. It hasn't been made.
3. **Not run here:** the Playwright suite under the repo's own runner (the new
   spec was written and its steps were exercised with a script), physical
   devices, a screen-reader pass with VoiceOver or NVDA, and Lighthouse.
4. **Not deployed.** Nothing has been pushed or deployed. Deploying to
   production needs approval.
5. **Treatment facts depend on record quality.** About 100 older-format
   treatments (for example lithium) have little structured safety data, so
   their questions fall back to general ones without a cited basis.
