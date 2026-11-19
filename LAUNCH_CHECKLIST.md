# HeyPsych launch checklist

19 November 2026. Status values: **PASS**, **FAIL**, **BLOCKED** (needs a
person or access I don't have) and **NOT TESTED**. "Pre-existing" means the
same result on the original code (`fb170bd`), built and run the same way.

Test environment: production build (`next build`, then `next start`) against
local Postgres 16. Google Fonts was unreachable here, so the build used a
local font file, reverted after each build. Comparisons with `fb170bd` used a
separate production build of that commit, exported read-only from your Mac
with `git archive`.

**Verdict (final pass, 19 Nov):** the code is frozen and verified. Deployment
waits on two things only:
- **G3:** you add Upstash's free plan, without which admin login fails in
  production.
- **G7:** your authorization.

Everything else is PASS, or a pre-existing issue recorded as post-launch
work.

---

## A. Clinical and safety (hard gate)

| # | Item | Status | Evidence / what's needed |
|---|---|---|---|
| A1 | Crisis-first: the urgency question comes first, alone, never pre-filled; "in crisis" shows crisis help only | PASS | e2e "crisis stops everything and shows only crisis help"; evaluator golden tests in vitest; crisis info renders before any choice on `/find-support`; 988 in the footer of every page |
| A2 | Clinical evaluator unchanged in this release | PASS | `src/domains/patient-support/*` byte-identical to the mission-2 copy on your Mac (`EVALUATOR_VERSION` 1.1.0) |
| A3 | Live config can't change clinical recommendations | PASS | No file in `src/domains/patient-support`, `src/domains/path` or the journey imports live config. Only `/`, `/architect`, the resume strip and Architect read flags or copy. |
| A4 | Clinical sign-off for new patient guidance | PASS | The founder confirmed on 19 Nov that the journey's routing, "what would change it" and the brief questions are covered by the existing clinical review, and authorized launch (pilot contract §12.3; AUTHORITY_DECISIONS "Recorded decisions"). Other new wording is presentation of reviewed facts or interface text. |
| A5 | Medication boxed warnings: mapping vs genuinely missing | PASS (15 genuinely missing → post-launch) | Of 103 medication records without a mapped warning:<br>• **34** are legacy duplicates that 301-redirect to a researched page, and every target has its warning (lithium → lithium-lithobid, Ritalin, Adderall, venlafaxine, methadone, trazodone…).<br>• **2** were mapping defects: warning stated in the record's own reviewed prose, now mapped. Olanzapine pamoate shows its PDSS warning.<br>• **15** public US formulations genuinely lack warning text (quetiapine XR, paliperidone and risperidone LAIs, Ambien CR, Daytrana, valproate sodium, valproic acid, fluphenazine decanoate, felbamate, perampanel, maprotiline, perphenazine-amitriptyline…). These pages are already live today. Nothing was invented, and no surface presents a missing warning as "none".<br>• The rest are non-US or withdrawn products, or labels without one.<br>List: `.audit-tmp/launch-evidence/medications-without-boxed-warning-field.txt` |
| A6 | Missing safety data never shown as "none" | PASS | Fixed this release: `safety-cells.ts`, unit test, and seen in the browser ("Not listed in our guide. Check the medication label." for lithium) |
| A7 | Controlled-substance status never inferred | PASS | "No" only when the record explicitly says not controlled. A missing field reads "Not listed in our guide". The latent `null` → "not controlled" mapping was removed. |
| A8 | Crisis resources verified | PASS | 19 Nov, against samhsa.gov (1-800-662-4357, 24/7), DoD/VA publications (988 call/text/chat; veterans press 1) and Crisis Text Line materials (HOME to 741741). The site never mentions the 988 "press 3" option that ended in July 2025. Recorded in pilot contract Appendix B. |
| A9 | No analytics reveal a crisis or the urgency answer | PASS | Removed: `hadCrisisSignal`; the urgency answer that `support_urgency_completed` sent as `branch: "crisis"/"struggling"/"planning"`; and `support_crisis_shown`. A central guard drops any patient-support event carrying a crisis value. Unit tests, plus instrumented journeys: 0 events carry crisis or urgency values. |

### Clinical review packet (for the clinical owner)

Everything below is patient-facing wording or logic added since `fb170bd`.
Contract record: `docs/active/contracts/PATIENT_PILOT_CONTRACT.md` §12, §12.1
and §12.2.

1. **Appointment brief questions** (`src/domains/path/questions.ts`,
   `QUESTIONS_VERSION` 1.0.0): generated questions per condition, treatment
   and symptom.
2. **Journey departures from the pilot contract** (§12):
   - no mid-journey crisis goal (urgency handles crisis first);
   - no modality question (the evaluator doesn't read it);
   - "I'm not sure" continues with a broader result instead of leaving.
3. **Pre-filling** (§12): concerns and duration may be pre-selected from the
   visitor's own notes. Each is labelled on screen and editable. Urgency is
   never pre-filled.
4. **"What would change it"** and **"Changed from X because…"**
   (`src/domains/path/what-if.ts`, §12.1): evaluator re-runs on single-answer
   variations. These never vary urgency and never yield the crisis path.
5. **Confidence meter** (§12.1): three segments mapped from the evaluator's
   own confidence.
6. **"Connects to your path"** on condition and treatment pages (§12.1).
7. **New in this release** (§12.2):
   - the Find support entry wording;
   - the kept-step reconciliation text ("This matches the step you kept." /
     "You kept X before. Your answers now point here." / "Update my kept step
     to Y");
   - the treatment comparison table and its rows;
   - the "Not listed in our guide. Check the medication label." wording.
8. **Data findings** that block sign-off: A5 and A7.

---

## B. Mandatory live-update proof (on the production build)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| B1 | Update a tool's price through Admin without deploying code | PASS | The Admin UI in a browser changed SimplePractice from $49 to $57 (starting price, display, tier 1, verified date), then Save draft and Publish. The draft wasn't public before publishing (profile still $49). Straight after publishing, the editor showed 57 and "Changes from the reviewed record: pricing". Screenshots 1–2. |
| B2 | Updated price appears consistently across the product | PASS | Anonymous requests saw $57 everywhere by the second request (about 0.8s):<br>• profile (11 mentions, JSON-LD offer price 57);<br>• `/tools/alternatives/simplepractice`;<br>• both compare pages (JSON-LD 57);<br>• Architect API (`minPriceCents` 5700, new `v`);<br>• Architect monthly total, ledger line and printable plan ($57, with "Price changed since you chose it: $49 → $57/mo").<br>Screenshots 3, 6, 7. |
| B3 | Toggle a nonclinical feature without rebuilding | PASS | Switched "Draft my practice" off in Admin; a new visitor's onboarded Architect had 0 draft buttons, and 1 again after switching it back. Published homepage subtitle copy appeared in server HTML on the next request; "Use default" removed it. |
| B4 | Roll back and verify restoration | PASS | "Revert to reviewed record" restored $49 on every surface (no differences from the baseline snapshot). "Restore this" in History: $61 → restored revision $57, then back to $49. Flag and copy restored. Screenshots 5, 5b. |
| B5 | Public URLs and SEO metadata correct | PASS | Before vs after the whole proof: 0 differences in status, title, canonical, robots, h1 or JSON-LD on 10 pages. Against `fb170bd`: 149 pages, 0 differences; all 10 sitemaps list identical URLs. |
| B6 | Cache invalidation is correct and cheap | PASS | Tool publishes use stale-while-revalidate (fixes a 404 regression found in testing). Config expires immediately. The API is edge-cached 24h only when the version matches, otherwise 60s. Steady state: 80 public requests, 0 app database queries. |
| B7 | Concurrency / cold start | PASS | 8 simultaneous admin requests on a cold server with no table: all 200, no deadlock (fixed this release) |

## C. Admin authentication and authorization

| # | Item | Status | Evidence |
|---|---|---|---|
| C1 | Live API rejects reads and writes without a session (401) | PASS | e2e `admin-live.spec.ts` |
| C2 | Forged, tampered and expired session cookies rejected (401) | PASS | e2e (signature with the wrong secret, edited timestamp, 25-hour-old token) |
| C3 | Writes need a same-origin request (missing or foreign Origin → 403) | PASS | e2e |
| C4 | Invalid values refused, nothing published | PASS | e2e: unknown flag, `<script>` in copy, overlong copy, locked compliance field, negative price → 4xx |
| C5 | Admin pages redirect to login and are `noindex` | PASS | e2e |
| C6 | Login in production fails closed without rate limiting | PASS | `POST /api/hp-ctrl-8k3m9x/login` → 503 without Upstash, so Upstash is required in production (see G3) |
| C7 | Login works end to end with Upstash configured | NOT TESTED | No Redis here; the signed-session path was tested directly |

## D. Engineering quality

| # | Item | Status | Evidence |
|---|---|---|---|
| D1 | TypeScript | PASS | `tsc --noEmit` clean |
| D2 | ESLint | PASS | 0 errors; 957 warnings (958 on `fb170bd`, no file gained warnings) |
| D3 | Unit tests | PASS | vitest 1,854 passed, 0 failed, 25 skipped (including the Postgres store test) |
| D4 | Production build | PASS | `next build` exit 0, 1,317 pages |
| D5 | New e2e (admin, live updates, journeys) + instrumented journeys | PASS | 12 of 12; instrumented consumer and clinician journeys complete with every funnel event |
| D6 | Legacy e2e suite | FAIL (pre-existing) | 162 pass, 37 fail. **All 37 also fail on `fb170bd`; 0 regressions.** The failures:<br>• 14 no-JS content (old microdata selectors, plus D8);<br>• 8 clinician-tools (5 demo-request API tests get 503 without Redis; 3 expect elements the current tools hub and product page don't have);<br>• 7 E-A-T visibility;<br>• 2 entity grounding, 2 internal linking, 2 navigation, 1 answer-objects.<br>One search-page test is flaky on both builds. |
| D7 | Performance | PASS (parity) | Lighthouse mobile, median of 3, baseline → new:<br>• `/` 90 → 87<br>• `/find-support` 88 → 88<br>• `/architect` 53 → 51<br>• SimplePractice profile 81 → 82<br>All within run-to-run spread. Measured on the build before the last two fixes (an admin-only API change and one line of profile text). |
| D8 | Condition and treatment pages server-render their main text | FAIL (pre-existing) | `<main>` holds only the loading skeleton in server HTML; the article text is in JSON-LD and the React payload. Without JS a reader sees 576 characters. Same on `fb170bd`. Google renders JS; crawlers that don't run JS see little. Recommend fixing before launch; it changes server HTML for 680 pages (130 conditions, 550 treatments), so it wasn't done here. |
| D9 | `/architect` layout shift | FAIL (pre-existing) | CLS 0.479 on both builds |
| D10 | Homepage canonical tag | FAIL (pre-existing, minor) | `/` has no `<link rel="canonical">` (same on `fb170bd`) |

## E. Accessibility, mobile, keyboard

| # | Item | Status | Evidence |
|---|---|---|---|
| E1 | Automated accessibility (axe, WCAG 2.2 AA rules, 14 key pages) | PASS (improved) | 66 issues vs 77 on `fb170bd`; no page worse. The rest are pre-existing (mostly grey-on-white contrast, ladder dots on `/tools`). `/my-path`, `/architect` and `/find-support` have 0. |
| E2 | Link colour fix assessed before changing | PASS | 16 pages screenshotted before and after; footer 988 contrast and in-text link distinction fixed; 56-page `link-in-text-block` scan clean |
| E3 | Mobile layout (iPhone 13) | PASS | 0px horizontal overflow on all 14 pages; screenshots in the evidence folder |
| E4 | Keyboard | PASS (sampled) | Skip link is the first tab stop on every page; the first 12 tab stops show a focus ring (the header search ring fades in over 200ms) |
| E5 | Screen reader (VoiceOver / NVDA) | NOT TESTED | No screen reader here |
| E6 | Physical devices | NOT TESTED | Emulated only |

## F. Analytics and privacy

| # | Item | Status | Evidence |
|---|---|---|---|
| F1 | Funnel events for patients and clinicians, plus North Star definition | PASS | `DECISION_EVENTS_CONTRACT.md`, "Launch funnel and North Star" |
| F2 | No sensitive health data in new events | PASS | Consumer props are typed to `kind` / buckets / `surface`; no slugs, answers, symptoms, treatment names or text. Clinician events carry vendor product slugs only. |
| F3 | Events reach the analytics destination | PASS (pipeline); new names: post-deploy check | Vercel Web Analytics is the only destination (no GA is loaded). The project is on **Pro**, and its Events panel already records custom events with 3 properties (`tools_vendor_outbound_click`: toolSlug, source, filterType). On the new build, the real consumer and clinician journeys emitted all funnel events with at most 3 properties each (`architect_vendor_visit` trimmed from 4 to 3). New event names appear once deployed; check the Events panel within an hour of release. |
| F4 | Crisis signals in analytics | PASS | see A9 |
| F5 | Metered analytics cost | PASS (within included credit) | Each page view and custom event costs $0.03 per 1,000, drawn from Pro's $20 monthly credit ($0.55 used this cycle). Last 30 days: 13,780 page views. Estimated added events: roughly 10–30K a month (≈ $0.30–0.90), inside the credit. Risk: bot traffic (48% Singapore, 82% Windows, 84% bounce) inflates counts. Consider a Spend Management alert. |

## G. Deployment configuration (needs your action)

| # | Item | Status | What to do |
|---|---|---|---|
| G1 | Migration `047_hp_live_revisions.sql` | Deploy step | Additive (one new table that current production never reads), so it's backward compatible and rollback-safe. Idempotent: applied twice on Postgres 16. Apply in the Supabase SQL editor before or right after deploy; the app also creates the table on first Admin use. |
| G2 | `ADMIN_PASSWORD` in Vercel | PASS | Present (Vercel → heypsych → Environment Variables, names read 19 Nov) |
| G3 | Upstash Redis for admin login | **FAIL → your action** | Production `POST /api/hp-ctrl-8k3m9x/login` returns 503 "Service not properly configured" today. No `UPSTASH_*` variables and no store on the team. You chose Upstash's free plan (500K commands/month, $0; don't add a card). Steps in RAPID_UPDATES.md. The code accepts `UPSTASH_REDIS_REST_*` or `KV_REST_API_*`. |
| G4 | Production site URL | PASS | `NEXT_PUBLIC_SITE_URL` present; production sitemaps and canonicals use `https://heypsych.com` |
| G5 | Database connectivity at runtime | PASS (config) | `SUPABASE_DB_URL` and `DATABASE_CA_CERT` present; production already reads Postgres over this connection (forms, manifest) |
| G6 | Additional recurring cost | PASS | $0 fixed: existing Postgres, data cache, auth and hosting; Upstash free plan. Metered: analytics events within the Pro credit (F5). |
| G7 | Previous deployment for rollback | PASS | Production is `fb170bd` (Nov 12, Ready); `df11022` and earlier are also Ready. Instant Rollback in Vercel restores it in seconds. |
| G8 | Database backups | NOT TESTED | Supabase dashboard not signed in. The release writes no existing data (one new table), so a restore isn't needed to roll back. |
| G9 | Deploy authorization | BLOCKED | Waiting for you, after G3 |

## H. Vendor data disclosure

| # | Item | Status | Evidence |
|---|---|---|---|
| H1 | Unverified prices disclosed | PASS | Profile: "Price not yet checked by HeyPsych. Confirm with the vendor."; Architect ledger, inspector and plan: "unverified price" |
| H2 | Prices verified | FAIL | 26 of 55 clinician products have never had a price check recorded |
| H3 | BAA claims disclosed | PASS | Compliance section labels everything "vendor-stated" with sources; the headline now says "Signs a BAA (vendor-stated)" where there's no source |
| H4 | BAA and HIPAA claims sourced | FAIL | 18 of 38 "BAA available" and 43 HIPAA claims have no source |
| H5 | E-prescribing claims disclosed | PASS | Existing "unverified" EPCS headline and detail on profiles and in Architect (17 products mention e-prescribing) |
| H6 | Delivery models disclosed | PASS | Architect flags "Supported delivery models have not been verified" under "Verify before you sign" |
| H7 | Integrations disclosed as unverified where unverified | NOT TESTED | 3 products have integrations not marked verified; the profile display of that flag wasn't checked |
