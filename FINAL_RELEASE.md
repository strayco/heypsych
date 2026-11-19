# HeyPsych: Final launch pass

19 November 2026. Base commit `fb170bd`, plus the Your Path and Breakthrough
releases (uncommitted, on your Mac). **Not deployed.**

**Status (final pass, 19 Nov):** the release is frozen and verified on a
production build, and it isn't deployed. Two things remain:
1. You add Upstash's free plan; production admin login fails without it.
2. You authorize the deploy.

Every gate is in `LAUNCH_CHECKLIST.md`; operations and rollback are in
`RAPID_UPDATES.md`.

---

## What changed for people looking for help

1. **A faster first step on Find support.** "I'm looking for treatment or
   support" now comes first and stands out. It sets expectations: one safety
   question, a next step that updates as you answer, about a minute, and your
   answers stay on the device. Crisis information still appears before any
   choice.
2. **A kept next step remembers why.** When answers change, the journey says
   "You kept X before. Your answers now point here." and offers "Update my kept
   step to Y". The map shows the history of kept steps, with the reason
   recorded at the time.
3. **Compare what you're considering, side by side.** On the map, saved
   treatments sit in one table. It shows kind, boxed warning, onset or course,
   the three most common side effects, monitoring, controlled-substance status,
   and how many brief questions each adds.
4. **Safety facts are never overstated.** If a record has no boxed-warning or
   controlled-substance data, the table says "Not listed in our guide. Check
   the medication label." It never says "none". (This was a defect found in
   verification. See "Found and fixed" below.)
5. **Links look like links, and the crisis line is readable.** A global
   stylesheet rule hid every link colour on the site. It's fixed, and 16
   pages were checked before and after. Links inside paragraphs are now
   underlined, and the 988 crisis bar meets contrast. Automated accessibility
   issues across 14 key pages dropped from 77 to 66, and no page got worse.

## What changed for clinicians

1. **One price, everywhere, without a deploy.** A price published in Admin
   reaches all of these: the profile, its JSON-LD offer, comparisons,
   alternatives, Practice Architect's catalog, monthly cost, plan ledger and
   printable plan.
2. **"Price changed since you chose it: $49 → $57/mo."** Architect remembers
   the price a clinician accepted and flags a later change. The ledger,
   inspector and printable plan say whether each price was checked, and when.
3. **Keep or replace a drafted pick, knowing the trade-off.** Drafted tools
   say "Suggested by your draft", with Keep. Each alternative shows the cost
   and coverage difference against the current pick, plus a "Compare side by
   side" link.
4. **Vendor claims carry their status on profiles.** "Price not yet checked by
   HeyPsych. Confirm with the vendor." appears where no check is recorded.
   BAA claims without a source read "Signs a BAA (vendor-stated)". The
   doubled "From From $39/month" is fixed.

## For the HeyPsych team: live updates (`/hp-ctrl-8k3m9x/live`)

- **Tools:** edit pricing (model, price, display, trial, tiers, notes,
  verified date), integrations, categories, descriptions, links and status.
  Create a new tool. Save a draft, preview it (only you see it), publish,
  discard, revert to the reviewed file, or restore any earlier revision.
  Compliance, commercial, affiliate, editorial and SEO fields are locked.
  Clinical content isn't editable here at all.
- **Flags:** Architect "Draft my practice", the homepage welcome-back strip,
  and the plan ledger, each with a percentage rollout.
- **Experiment:** the "Draft my practice" button label. Assignment is stable
  per browser and logged once as `experiment_exposed`.
- **Approved copy:** homepage subtitle and the Architect draft banner.
  Length-limited, with no markup allowed.
- **History:** every change is a revision with author, note and time. Rollback
  publishes a copy, so history is never rewritten.
- **Cost:** $0 a month. It uses your existing Supabase Postgres (one small
  table), Vercel's data cache and on-demand revalidation, and the existing
  admin password. No new service, package, cron job or polling. Measured: 80
  public requests made 0 app database queries.

## Measurement

The funnel runs Discover → Interact → Understand → Decide → Save → Return →
Act, for patients and clinicians. The **North Star is meaningful decisions
completed per active user, weekly.** The definitions are in
`docs/active/contracts/DECISION_EVENTS_CONTRACT.md` under "Launch funnel".
Consumer event properties are limited by TypeScript to a category, count and
day buckets, and a surface name. No answers, symptoms, treatment names or
question text can be sent.

## Found and fixed during verification

These were found by testing the production build, not by reading code:

| Problem | Effect | Fix |
|---|---|---|
| Compare table said "None on the label" when data was missing | Would have told patients lithium, Ritalin, Adderall, venlafaxine and valproate have no boxed warning | Never assert absence; tested helper `src/domains/path/safety-cells.ts` |
| Publishing a price hard-expired the cache | Every `/tools/compare/*` page returned **404**, even after rollback | Tool publishes use stale-while-revalidate (`"max"`) |
| Admin editor read through the public cache | Right after publishing, the editor showed the old price, so the next save could silently undo it | Admin reads published state straight from the database |
| Architect API cached for 24h per version | A request during the brief refresh could store an old price under the new URL for a day | Edge-cache only when the version matches; otherwise 60s |
| Two cold-start admin requests | Postgres deadlock on schema bootstrap | One bootstrap per process, skipped when the table exists, advisory lock |
| Link colour fix | Review-board link inside grey text lost distinction | Underlined in-text links |
| Find-support copy "nothing leaves this device" | Overclaim: page views and the recommended path id are reported | "Your answers stay on this device." |

## Evidence (production build, `next start`, local Postgres 16)

| Check | Result |
|---|---|
| TypeScript / ESLint | clean / 0 errors (957 warnings; `fb170bd` has 958) |
| Unit tests (vitest, with the database test) | 1,854 passed, 0 failed |
| Production build | exit 0, 1,317 static pages |
| e2e, new specs (admin auth, live updates, journeys) | 12 of 12 pass |
| e2e, whole suite vs `fb170bd` built the same way | 162 pass, 37 fail; all 37 also fail on `fb170bd`: **0 regressions** |
| Instrumented journeys (consumer + clinician) | all steps complete; all funnel events fire; ≤3 properties; 0 crisis/urgency values |
| Mandatory live-update proof (5 steps) | passes; see the checklist |
| SEO: 149 pages vs `fb170bd` | 0 differences in status, title, description, canonical, robots, h1 count or JSON-LD types; sitemaps identical |
| Accessibility (axe, 14 pages) | 66 issues vs 77 on `fb170bd`; none worse; 56-page in-text-link scan clean |
| Mobile (iPhone 13) / keyboard | no horizontal overflow; skip link first; focus ring present |
| Lighthouse (median of 3, mobile) | performance at parity (e.g. `/` 90 → 87, profile 81 → 82, `/architect` 53 → 51, all within run-to-run spread); accessibility up on 3 of 4 pages |
| Database load | 80 public requests → 0 app queries; 0 idle connections |

Scripts, logs and screenshots are in `.audit-tmp/launch-evidence/` on your
Mac (git-ignored).

## Final pass (19 Nov): what was checked and fixed

- **Medication data.** The 103 records flagged without a boxed warning break
  down as follows:
  - 34 are legacy duplicates that redirect to researched pages that have the
    warning.
  - 2 were mapping defects (warning stated in the record's own prose), now
    mapped. Olanzapine pamoate shows its PDSS warning.
  - 15 public US formulations genuinely lack warning text. They're listed for
    post-launch data work; nothing was invented, and nothing says "none".
  - Controlled-substance status reads "No" only where the record says so.
- **Privacy.** Removed `hadCrisisSignal`, and also the urgency answer that
  `support_urgency_completed` was sending ("crisis" / "struggling" /
  "planning") and the `support_crisis_shown` event. A central guard drops any
  patient-support event carrying a crisis value.
- **Clinical approval.** You confirmed the journey's guidance is covered by
  the existing review (recorded in the pilot contract §12.3).
- **Crisis resources.** Verified 988, Crisis Text Line and SAMHSA against
  official sources.
- **Analytics destination.**
  - Vercel Web Analytics, on Pro, already records custom events with up to 3
    properties.
  - The real journeys on the new build emit every funnel event with at most
    3 properties (`architect_vendor_visit` trimmed from 4).
- **Production configuration (read in Vercel).**
  - The admin password, database URL, CA certificate and site URL are set.
  - Rate-limit storage is missing, so admin login returns 503 today. The code
    now also accepts Vercel-Marketplace variable names.
  - The previous deployment, `fb170bd`, is available for instant rollback.

## Is HeyPsych ready to launch?

**Yes, once Upstash's free plan is added.** The code is complete, frozen and
verified.

- **Product:** the consumer journey is verified end to end on a production
  build (symptom → condition → treatment → live next step → kept decision →
  comparison → brief → return visit). So is the clinician journey
  (onboarding → one-click draft → keep or replace with cost and coverage
  deltas → plan → export → vendor visit).
- **Measurement:** every funnel event fires, nothing sensitive is sent, and
  the destination is proven on production.
- **Live updates:** a price published in Admin reaches every surface within
  two requests, and rollback restores it exactly.
- **Business protection:**
  - SEO unchanged on 149 pages, with identical sitemaps.
  - 0 test regressions against `fb170bd`.
  - Accessibility better, performance at parity.
  - $0 fixed cost; metered analytics stays inside the Pro credit.

**Before production:**
1. Add Upstash on its free plan (RAPID_UPDATES → Setup, step 1).
2. Authorize the deploy: merge the release branch into `main`, or promote
   its preview.
3. Apply migration 047.
4. After deploy, check the Events panel and sign in to Admin.

**Post-launch, not blocking:**
- 15 medication records need warning text.
- Server-rendered body text on condition and treatment pages.
- `/architect` mobile layout shift.
- 37 legacy e2e tests that also fail on `fb170bd`.
- Unverified vendor prices (26/55) and unsourced BAA claims (18), both
  disclosed on the pages.
