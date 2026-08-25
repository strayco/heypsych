# SEO Indexation Firewall — Build Reference

Last updated: 2026-08-25

This is the source of truth for how HeyPsych decides what search engines may
index, how sitemaps are built, and how unknown URLs must fail. Read it before
changing metadata, sitemaps, `generateStaticParams`, middleware, or
`index-decision-service.ts`. The last time these were disconnected, Google was
asked to index pages that rendered `noindex`, and high-intent URLs returned
HTTP 200 with empty shells (soft 404s).

## What this pass fixed

Production and local production-parity crawls (`next build` + `next start`)
were used, not just `next dev`. Findings were treated as measurement bugs
until proven otherwise.

| Failure | Cause | Fix |
|---|---|---|
| `seo:validate` reported PASS with 0 entities | Empty loops look like success | Status is now `PASS` / `FAIL` / `INCOMPLETE`. Zero evaluations exit 2. Load env with `tsx --env-file-if-exists=.env.local`. |
| Duplicate titles (`\| HeyPsych \| HeyPsych`) | Root layout template plus generators already appending the brand | `stripBrandTitleSuffix()` in `src/lib/seo/title.ts` |
| Clinician category hubs 404 while listed in sitemap | Schema slug (`billing-rcm-insurance`) vs taxonomy slug (`billing-rcm`) | `resolveCategoryHubSlug()` — never emit a hub URL that the route cannot render |
| Conditions/treatments mass-`noindex` | Word count treated `description` objects as `"[object Object]"`; completeness looked for the wrong field names; disclaimer required a data field even when the template always renders one; medical review stored as IDs was never resolved | Firewall now measures real prose, real clinical fields, template-guaranteed disclaimers, and `EditorialService.resolveReviewerIds()` |
| `/treatments/sertraline` and brand names soft-404 | Loader only knew compound slugs (`sertraline-zoloft`); streaming `loading.tsx` committed HTTP 200 before `notFound()` | Build-time alias map → middleware 301; `dynamicParams = false` for unknown slugs |
| `/conditions/*` and `/resources/*` unknown slugs soft-404 | Database-backed routes are `on_demand`, so `generateStaticParams` is empty and `dynamicParams` must stay `true` | Build-time slug manifest → middleware rewrite to `/_not-found` with status 404 |
| Treatment sitemap advertised unrenderable URLs | Database had 592 rows; local JSON can render 484 | Renderability gate against `getAllTreatmentSlugs()`; firewall judges local JSON, sitemap `lastmod` still uses DB `updated_at` |
| Resource sitemap `X-Sitemap-Anomaly: all-candidates-excluded` | Route passed raw Supabase rows into the firewall instead of `EntityService` entities | Same path as conditions: `EntityService.getByType("resource")` |
| `/tools/compare/*` rendered a loading skeleton in production | Unused `useSearchParams()` forced CSR bailout | Removed the hook; added FAQPage / BreadcrumbList / ItemList / WebPage JSON-LD |
| Duplicate `prebuild` keys in `package.json` | JSON keeps the last key, so the alias generator never ran at build | One `prebuild` that runs index, validators, then both generators |

Verified locally on a production server (`next start`):

- `/treatments/sertraline` → 301 → `/treatments/sertraline-zoloft`
- `/treatments/no-such-treatment` → true 404
- `/conditions/this-does-not-exist` → true 404, `noindex`, real 404 UI
- `/conditions/generalized-anxiety-disorder` → 200, `index,follow`
- 266/268 real condition+resource slugs → 200 (the other 2 are pre-existing 308s)
- `/tools/compare/simplepractice-vs-therapynotes` → SSR with H1, ~874 words, JSON-LD
- Unit tests: 725 passed
- `npm run seo:validate`: 1,905 evaluations, 0 errors

## Architecture: one decision, many consumers

```
                    makeEntityIndexDecision(entity, path)
                    src/lib/seo/index-decision-service.ts
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   page robots meta          sitemap inclusion          seo:validate
   (MetadataFactory)         (sitemap-*.xml routes)     (scripts/validate-seo.ts)
```

If a page is `noindex`, it must not appear in a sitemap. If it appears in a
sitemap, the page must render `index`. There is no third state.

The firewall is `src/lib/seo/index-decision-service.ts`. Sitemap routes must
call `filterEntitiesForSitemapWithReport()` from
`src/lib/seo/sitemap-eligibility.ts`. Do not query the database and dump
rows into XML.

### Entity shape is part of the contract

The firewall judges a hydrated `Entity` (the same shape the page renders),
not a raw `entities` table row.

| Cohort | What the *page* renders from | What the *sitemap* must judge |
|---|---|---|
| Conditions | Database via `EntityService` | `EntityService.getByType("condition")` |
| Resources | Database via `EntityService` | `EntityService.getByType("resource")` |
| Treatments | Local JSON via `loadTreatment` + `treatmentV3ToEntity` | Local JSON for the decision; DB row only for `updated_at` / `lastmod` |

Passing a raw Supabase row into the firewall will fail every gate (visibility,
content, completeness). The safety valve then republishes the unfiltered list
and sets `X-Sitemap-Anomaly: all-candidates-excluded`. That header means the
filter is judging the wrong shape, not that the cohort is empty.

Treatments additionally drop DB rows with no local JSON file (unrenderable).
Do not put those URLs in the sitemap.

## Soft 404s: two different fixes, do not mix them

A Next.js `loading.tsx` streams a shell with HTTP 200. If the page later
calls `notFound()`, the status cannot change. Google sees 200 + thin content.

### Treatments — local JSON, fully SSG

`src/app/treatments/[slug]/page.tsx`:

- `generateStaticParams()` must return every canonical slug.
- If it returns `[]`, **throw**. With `dynamicParams = false`, an empty list
  404s the entire section.
- `export const dynamicParams = false` so unknown slugs 404 at the router,
  before the loading shell.

Bare generic/brand URLs (`/treatments/sertraline`, `/treatments/zoloft`) are
not pages. Middleware 301s them using
`src/lib/treatments/treatment-aliases.generated.ts`.

### Conditions and resources — database-backed, on-demand

`static-generation-policy.ts` classifies these as `on_demand`, so
`generateStaticParams` is empty. Setting `dynamicParams = false` would 404
every page in the section.

Instead, `scripts/generate-entity-slugs.ts` snapshots every real slug
(database rows **plus** static hub directories like `anxiety-fear`) into
`src/lib/entities/entity-slugs.generated.ts`. Middleware rewrites unknown
single-segment paths to `/_not-found` with status 404.

Nested paths (`/conditions/other/sleep-disorders`) are left to their own
route files.

**Do not** copy the treatments `dynamicParams = false` pattern onto
conditions or resources.

## Prebuild generators (must run on every production build)

`package.json` has **one** `prebuild`:

```
build:index
validate:resources
validate:tools:v4
generate:treatment-aliases
generate:entity-slugs
```

JSON cannot have two `"prebuild"` keys. The last one wins and the first is
silently ignored.

| Script | Output | Failure mode |
|---|---|---|
| `generate:treatment-aliases` | `src/lib/treatments/treatment-aliases.generated.ts` | Ambiguous aliases (shared brand names) are omitted, not guessed. Placeholder brands (`various brands`) are dropped. |
| `generate:entity-slugs` | `src/lib/entities/entity-slugs.generated.ts` | Throws if the DB returns fewer than 100 conditions or 50 resources. Requires `.env.local` / production secrets. |

`generate:entity-slugs` uses `tsx --env-file-if-exists=.env.local`. CI must
have database credentials or the build fails closed (good) rather than
shipping a middleware that 404s live pages.

Regenerate without a full build:

```
npm run generate:treatment-aliases
npm run generate:entity-slugs
```

Commit the generated files. Middleware and the edge bundle cannot read the
filesystem at request time.

## Quality gates (do not "fix" them by lowering the bar)

`index-decision-service.ts` now:

1. Counts **prose**, not JSON keys, IDs, or `"[object Object]"`.
2. Scores clinical completeness against **actual field names**
   (`risk_factors`, `diagnostic_criteria`, `clinical_profile`,
   `adverse_effects`, `dosing` — not `causes` / `side_effects` / `dosage`).
3. Treats condition and treatment **templates** as guaranteeing a YMYL
   disclaimer. Do not require a duplicate field in entity data.
4. Credits medical review only when a reviewer ID resolves through
   `EditorialService` to a credentialed reviewer. Every condition currently
   stores `medicalReviewerIds: ["john-lee-md"]` and `reviewBoard: "official"`.
   The resolved `medicalReviewer` object is **not** on the entity. Reading
   only the resolved object gave 0/133 conditions review credit.

Quality credit can cut the word-count gate by at most 50%, with an absolute
floor of 150 words. It cannot waive clinical completeness or an explicit
`seo.noindex`.

Honest non-indexable content (do not force these into the sitemap):

- Most `/resources/*` directory entries (crisis lines, orgs). Median ~138 words.
- `inhalant-use-disorder` and `phencyclidine-use-disorder` still miss the
  word-count gate after review credit (~649–666 vs effective 680). They lack
  the `comparisons` block the other 130 conditions have. Expand content;
  do not lower the gate.
- `opioid-use-disorder` **does** pass once review IDs resolve.

## Metadata rules

- Titles must not include a trailing ` | HeyPsych`. The root layout template
  adds it. Run every title through `stripBrandTitleSuffix()`.
- Canonical, Open Graph URL, sitemap `<loc>`, and JSON-LD `url` must be the
  same URL. If they disagree, Google picks, and it will not pick in our favor.
- Comparison pages must SSR. Do not put `useSearchParams()` in a comparison
  client component unless the value is actually read **and** there is a
  server-rendered fallback of the same content.
- Category hub URLs must go through `resolveCategoryHubSlug()`.

## Commands for every production build

```
npm run generate:treatment-aliases
npm run generate:entity-slugs          # needs DB credentials
SKIP_DB_DURING_BUILD=false npm run build
npx vitest run
npm run seo:validate                   # must evaluate >0; INCOMPLETE is a fail
```

Then, against `next start` (not `next dev`):

```
# aliases and unknown slugs
curl -I localhost:PORT/treatments/sertraline          # 301
curl -I localhost:PORT/treatments/no-such-treatment   # 404
curl -I localhost:PORT/conditions/this-does-not-exist # 404
curl -I localhost:PORT/resources/definitely-not-real  # 404

# sitemaps must not set X-Sitemap-Anomaly
curl -D - localhost:PORT/sitemap-conditions.xml -o /dev/null
curl -D - localhost:PORT/sitemap-treatments.xml -o /dev/null
curl -D - localhost:PORT/sitemap-resources.xml  -o /dev/null
```

`seo:validate` reporting PASS after evaluating nothing is a regression. The
script must print `evaluated=N` with N > 0.

Audit indexation without a full crawl:

```
npx tsx --env-file-if-exists=.env.local scripts/audit-index-decisions.ts conditions
npx tsx --env-file-if-exists=.env.local scripts/audit-index-decisions.ts resources
npx tsx --env-file-if-exists=.env.local scripts/audit-index-decisions.ts treatments-local
```

`treatments-local` is the truthful cohort. Auditing DB treatment rows will
look worse because those rows are not what the page renders.

## Expected sitemap shape (local production, 2026-08-25)

Approximate, after the firewall:

| Sitemap | URLs | Notes |
|---|---|---|
| conditions | ~131 | 133 exist; inhalant + PCP honestly excluded |
| treatments | ~478 | DB had 592; drop unrenderable; judge local JSON |
| resources | ~28 indexable of ~110 | Thin directory entries stay `noindex` and out of the sitemap. If the count is ~110 **and** `X-Sitemap-Anomaly` is set, the route is judging raw rows again. |
| tools | hundreds | Hub slugs must be taxonomy slugs |
| guide | 0 | Empty on purpose today. Populate or stop advertising the sitemap. |

## Remaining work (do not paper over)

1. **Empty `sitemap-guide.xml`.** Either emit real guide URLs or remove it
   from the sitemap index.
2. **Four duplicate treatment pairs** (pick one canonical, 301 the other):
   - `esketamine-spravato` / `spravato-esketamine`
   - `valproate-depakote` / `valproate-divalproex`
   - `fluoxetine-olanzapine-symbyax` / `olanzapine-fluoxetine-symbyax`
   - `vitamin-d` / `vitamin-d3`
3. **Thin conditions:** inhalant-use-disorder, phencyclidine-use-disorder.
   Expand sourced clinical content (and a `comparisons` block) rather than
   weakening gates.
4. **Four curated `/tools/compare/*` pages still 404** because the underlying
   tools are not publishable. Unblock the tools, do not special-case the route.
5. **`SKIP_DB_DURING_BUILD=true` still cannot produce a full production
   build** for database-backed routes. Production builds must run with
   `SKIP_DB_DURING_BUILD=false` and real credentials. `generate:entity-slugs`
   will refuse a short manifest.

## Files that own this system

| Path | Role |
|---|---|
| `src/lib/seo/index-decision-service.ts` | Index / noindex / sitemap eligibility |
| `src/lib/seo/sitemap-eligibility.ts` | Sitemap filter + anomaly report |
| `src/lib/seo/title.ts` | Brand suffix collapsing |
| `src/lib/seo/metadata-factory.ts` | Page metadata; must consume the firewall |
| `src/lib/tools/category-hub-slug.ts` | Schema → taxonomy hub slug |
| `src/lib/data/editorial-service.ts` | Reviewer ID → credentials |
| `src/middleware.ts` | Treatment alias 301s; unknown condition/resource 404s |
| `scripts/generate-treatment-aliases.ts` | Alias map generator |
| `scripts/generate-entity-slugs.ts` | Condition/resource slug manifest |
| `scripts/validate-seo.ts` | Honest PASS/FAIL/INCOMPLETE |
| `scripts/audit-index-decisions.ts` | Cohort diagnostics |
| `src/app/sitemap-*.xml/route.ts` | Must use the filter; treatments need the renderability gate |
| `src/app/treatments/[slug]/page.tsx` | `dynamicParams = false` |
| `src/app/tools/compare/compare-client.tsx` | No `useSearchParams()` |

Regression tests live next to the owners:

- `src/lib/seo/__tests__/quality-measurement.test.ts`
- `src/lib/seo/__tests__/sitemap-eligibility.test.ts`
- `src/lib/seo/__tests__/title-brand.test.ts`
- `src/lib/treatments/__tests__/treatment-aliases.test.ts`
- `src/lib/entities/__tests__/entity-slugs.test.ts`
- `src/lib/tools/__tests__/category-hub-slug.test.ts`

If a future change makes a gate "accidentally" pass by counting the wrong
fields, those tests should fail first.
