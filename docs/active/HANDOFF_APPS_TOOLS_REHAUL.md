# Handoff: rehaul the Apps & Tools section (patients + clinicians)

Written 2026-10-23 at the end of a long session. Start the next chat with:
"Read docs/active/HANDOFF_APPS_TOOLS_REHAUL.md, then AGENTS.md, and continue."

## 0. Progress (2026-10-23, second session)

Clinician side done: job-based hub and job pages, 34 lander routes retired
behind 301s, fabricated rating/review schema removed. Details and open items:
"Apps & Tools rehaul, clinician side" in DECISION_PLATFORM_IMPLEMENTATION.md.
Patient side done (third session), and finished off (fourth): see the
"patient side" and "finish-off" entries in the implementation log. The
rehaul is complete. Remaining is owner work only: restart `next dev`, run
`npx vitest run` + `npx next build` locally, sync files to the database,
review the working tree (large pre-existing deletions) and commit in chunks,
set the Vercel spend cap.

## 1. Where the site is now

Every public page family follows the Worlds art bible §13 / §13.1
(`docs/active/design/HOMEPAGE_WORLDS_ART_BIBLE.md`): an isometric object
intro, a few interactive islands, and the full record as a calm chapter
index (`src/components/guide/GuideChapters.tsx`). Pattern for each family:

    pure model (record only, no inference)  →  server experience  →  small client islands
    (src/domains/<family>/experience/model.ts)  (src/components/<family>/experience/*)

Done this session (details in `docs/active/DECISION_PLATFORM_IMPLEMENTATION.md`):
treatments, conditions, symptoms, all hubs (incl. the six `/treatments/<kind>`
hubs, now `TreatmentKindHub` + `src/domains/hubs/treatment-hub.ts`), patient
app pages, clinician profiles + alternatives, learn, resources (articles,
support orgs incl. directory orgs, assessments with a score scale), search,
clinician catalog positioning, link guard (`src/lib/linking/live-paths.ts`),
calm SEO copy (`scripts/calm-seo-copy.mjs`; `scripts/ballistic-seo.ts` deleted).

## 2. The next job: Apps & Tools rehaul

The user wants the whole tools area reworked for both audiences, in the same
"sim-like, Apple-like" spirit as the homepage and Practice Architect. Ask the
user 1–2 scoping questions first (AskUserQuestion), e.g. which audience
first, and whether to consolidate routes (strongly recommended, see below).

### What exists (≈60 routes under `src/app/tools`)

- Patient: `/tools` (hub), `/tools/[slug]` (328 app pages, already on the new
  ToolExperience + FitCheck), `/tools/for-patients`, `/tools/for-patients/compare[/slug]`,
  `/tools/for-patients/guides/[slug]`, `/tools/find-support/*`, condition hubs
  (`anxiety-stress`, `mood-depression`, `focus-adhd`, `sleep`, `trauma-ptsd`,
  `substance-use`, `serious-mental-illness`) via `_components/HubPageContent.tsx`,
  `/tools/free/[category]`.
- Clinician: `/tools/for-clinicians` (hub), `[category]`, `[category]/[slug]`
  (37 profiles, new ClinicianToolExperience), `/tools/alternatives/[slug]`,
  `/tools/compare[/slug]` + `/tools/for-clinicians/compare/[slug]`,
  `/tools/for-clinicians/ehr-practice-management/match` (EHR matcher),
  `/tools/for-clinicians/guides/[slug]`, audience pages (`for-therapists`,
  `for-psychiatrists`, `for-counselors`, `for-solo-practice`,
  `for-group-practice`, `for-practices/[type]`), SEO landers (`best/[slug]`,
  `best-for/[specialty]`, `cheapest-ehr`, `pricing[/category]`, `switch-from[/slug]`,
  `hipaa-compliant`, `with-baa`, `integrations[/slug]`, `works-with/[a]/[b]`,
  `stacks[/type]`, `outcome-measurement`, `therapy-billing`, `credentialing`,
  `ai-documentation`, `telehealth-comparison`), business (`claim`,
  `list-your-tool`, `become-a-partner`), `/tools/search`.
- Also: `/architect` (Practice Architect) is the clinician "sim" to borrow from.

### Data and code

- Patient apps: `data/resources/tools/*.json` (332, DigitalToolV3,
  `src/lib/schemas/digital-tool-v3.ts`), loaded by `src/lib/tools/tool-service.ts`.
  Model: `src/domains/patient-tools/experience/model.ts`.
- Clinician products: `data/tools-v4/products/<category>/*.json` (37,
  `src/lib/schemas/clinician-tool-v4.ts`, incl. `positioning` segments/job/niche),
  `src/lib/tools/clinician-tool-service.ts`, curated set
  `src/lib/tools/practice-grade-catalog.ts` (caps in tests = 45), alternatives
  logic `src/lib/tools/alternatives.ts`, comparisons `data/tools-v4/comparisons/`.
  Model: `src/domains/tools/clinician-experience/model.ts`.
- Category slug mapping: `SCHEMA_TO_TAXONOMY_CATEGORY` in clinician-tool-v4.ts.
  Clinician URLs are `/tools/for-clinicians/<taxonomy-category>/<slug>`;
  `/tools/<slug>` is the patient catalog (mixing these caused 404s).
- Logos: `src/components/tools/ToolMark.tsx` (no remote logo URLs).

### Known problems to fix in the rehaul

1. Too many overlapping pages. Many SEO landers repeat the same lists.
   Recommend: one patient hub with a "find an app for me" sim, one clinician
   hub built around Practice Architect's jobs (document, bill, schedule,
   measure, prescribe…), profile + compare + alternatives, and redirect the
   rest (301 in `next.config.ts` `redirects()`; dev server must restart).
2. Hard-coded links and tables in landers (e.g. `outcome-measurement`
   comparison rows, audience pages' "related" lists) go stale. Build them
   from the catalog.
3. `src/lib/seo/dark-patterns.ts` (fake "updated this week" dates,
   "expert rating" AggregateRating, video placeholder schema) was deleted;
   tool hubs now show the newest real `governance.last_reviewed`. Check
   `src/lib/seo/aggressive-schema.ts` and `serp-domination.ts` for the same
   tactics. Never ship fabricated dates, ratings or review schema.
4. 7 app records still have bait in copy fields other than `seo`
   (e.g. "[#1 App 2026]"); grep `data/resources/tools` for `★|#1|\[`.
5. Clinician "Osmind" lesson: recommendations must respect segment/job
   (`isSensibleAlternative`). Keep that logic when redesigning.

### Guardrails (from the user and AGENTS.md)

- No diagnosis, scoring or inference beyond the record. Patient-side
  personalization stays on device (`localStorage`, never sent).
- Keep cost low: static/ISR pages, no per-request DB on hubs, CDN cache on
  APIs (see "Hosting cost pass" in the implementation log).
- Verify with a link crawl after route changes (snippet below).

## 3. Open items from this session

- Restart `next dev` (redirects only reload on restart).
- Run locally: `npx vitest run`, `npx next build`, `npx tsc --noEmit`.
  In the sandbox, vitest only runs from `/tmp/fulltest`; the
  project-persistence suite needs jsdom.
- Database sync: SEO titles were restored/calmed in `data/` files. Conditions
  and learn records are also served from the database; run the usual
  file→DB sync so production picks them up, then spot-check
  `/conditions/major-depressive-disorder` `<title>`.
- Review the working tree before committing (~2,300 changed paths). It
  includes large deletions this session did not make, e.g.
  `data/tools-v4/raw/master-records.json` (−25k lines) and several
  `data/tools-v4/products/provider-networks/*` files. Confirm those are
  intended before committing. Commit in chunks: catalog, cost pass, search,
  page redesigns, link guard, SEO copy, treatment kind hubs.
- Vercel spend limit (dashboard only, can't be set from code): Vercel →
  Team Settings → Billing → Spend Management → set a monthly cap and
  alert thresholds (e.g. 50/75/100%), and enable "pause projects" at the cap.

## 4. Link crawl snippet (run in the browser on localhost:3000)

```js
const idx = await (await fetch('/sitemap.xml')).text();
const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
// fetch each sitemap, collect pages, fetch pages, collect a[href^="/"], fetch each, report status >= 400
```

The guide sitemap is slow in dev (minutes); fetch it with `cache: 'no-store'`
and poll a window variable rather than awaiting it in one call.
