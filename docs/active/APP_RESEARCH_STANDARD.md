# App and online-care research standard

Every consumer-facing record in `data/resources/tools/*.json` (DigitalToolV3,
`src/lib/schemas/digital-tool-v3.ts`) is researched to this standard. People
use these pages to choose where to get help, so every fact is sourced, dated,
and never guessed. If a fact cannot be found, leave it out or mark it
"unknown". Do not invent it, and do not copy marketing claims as fact.

Check date for this pass: **2026-10-23**.

## Sources, in order of preference

1. The vendor's own pages: pricing, FAQ, privacy policy, terms, help center.
2. The App Store (apps.apple.com) and Google Play (play.google.com) listings.
3. Peer-reviewed studies (PubMed, journal sites, DOI), FDA databases.
4. Regulators: FTC, HHS OCR, DOJ, state attorneys general.
5. Reputable press (for shutdowns, acquisitions, changes). Avoid affiliate
   "review" sites as sources of fact.

## Fields

### Availability (`availability`)
`state`: `available` | `limited` | `discontinued`, plus `checked` and `sources`
(vendor URL, or a press or vendor notice of shutdown). Use `limited` with a
`note` when it is only in some states or countries, has a waitlist, or is only
for some ages. Use `discontinued` if it has shut down or no longer takes new
users. Acquired products that still work stay `available`, with a note.

### What it is (`one_liner`, `patient_summary`, `short_description`, `long_description`, `best_for`, `not_for`)
- `one_liner`: up to about 140 characters. Plain and specific: what you
  actually do with it and for whom. No hype, no superlatives, no "leading".
- `patient_summary`: 2 to 3 sentences in second person. What it is, what using
  it looks like, how you pay or start.
- `short_description`: 1 to 2 sentences. `long_description`: a factual paragraph.
- `best_for` and `not_for`: at least 2 each, concrete. `not_for` must include
  crisis when relevant ("Anyone in crisis: call or text 988").
- Remove all template filler ("is a online therapy and virtual mental health
  care platform designed to support mental wellness", "offers comprehensive
  mental health support with easy-to-use features", "Pricing information
  needs verification").

### Price (`pricing`)
- `model`: `free` | `freemium` | `subscription` | `one-time` |
  `insurance-covered` | `enterprise`. Use `enterprise` only if a person cannot
  pay for it themselves.
- `free_tier`: true only if there is a lasting free version, not just a trial.
- `starting_price`: state it with a unit so it can be compared:
  "$69.99/year or $12.99/month", "$65–$100/week", "$299 first visit, then
  $129/visit", "Free". For insurance-based care: "Copay with insurance;
  $X/session self-pay" when a self-pay price is published.
- `notes`: trials, discounts, what the free tier includes, insurance details.
- `sources` and `checked`.

### Privacy (`privacy`)
Read the privacy policy (and any consumer health data notice). Fill
`privacy.basis`:

| field | meaning |
|---|---|
| `policy_url` | the policy you read |
| `checked` | date |
| `sells_or_ads` | `yes` if it sells personal data or shares it for targeted or cross-context advertising (including "sharing" under CCPA, ad pixels with health data); `no` if the policy says it does not; `unknown` if it doesn't say |
| `deletion` | `yes` if any user can request deletion (not only one state's residents) |
| `hipaa` | `covered` if it acts as a HIPAA covered entity or business associate for your health information; `not-covered` if it says HIPAA does not apply; `unknown` |
| `on_device_only` | true if data is stored only on your device |
| `account_required` | false if it can be used without an account |
| `regulatory_action` | a regulator's finding or settlement about health data or privacy in the last five years, in plain words (e.g. "FTC order, 2023: shared health data with advertisers"), else null |
| `regulatory_source` | URL for that action |

`grade` is then computed by `gradeFromBasis` (`src/domains/patient-tools/privacy.ts`).
Set `grade` to exactly what the rule gives:

- **A+**: on device only, no account, no sale or ad sharing
- **A**: no sale or ad sharing, deletion, and HIPAA-covered (or on device only)
- **B+**: no sale or ad sharing, deletion
- **B**: no sale or ad sharing
- **C**: sells or shares for ads, OR regulatory action
- **D**: both
- **unknown**: the policy doesn't say whether it sells or shares for ads

Also set `hipaa_compliant` (`"yes"`/`"no"`/`"unknown"`), `data_sold`
(`"yes"`/`"no"`/`"unknown"`), a one-line `notes`, and `sources` (policy URL
plus any regulatory URL).

### Research (`clinical_metadata`)
`evidence_level` is about studies of **this product or service itself**:

- **high**: at least two randomized controlled trials of the product, or FDA
  clearance or authorization based on trial data
- **moderate**: at least one RCT or peer-reviewed controlled study of the product
- **low**: published uncontrolled studies only (pre-post, cohort, real-world)
- **emerging**: built on an evidence-based method (CBT, DBT, MAT, licensed
  therapy) but no published study of the product itself
- **none**: neither

For `high`, `moderate` and `low`, list the studies in `clinical_trials`
(`study`, and `citation` with `authors`, `title`, `journal`, `year`, and `doi`
or `url`, plus `study_design`, and `sample_size` if known). Verify each study
exists. Never fabricate a DOI. If you can't verify it, don't list it, and
lower the level. `evidence_based`: true if it uses an evidence-based method.
`primary_uses`: 3 to 6 concrete uses.

### Store ratings (`store_ratings`)
For apps on iOS or Android: `{ store, rating, count, url, checked }` from the
App Store or Google Play listing itself (rating to one decimal, count as an
integer, url of the listing). Only include what you read from the listing or
from a search result that is the listing. Omit it if you can't find it. Keep
`platforms` true only for platforms that really exist.

### Housekeeping
- `audience`: set `"clinician"` if it is really for clinicians or
  organisations, not people seeking help.
- `governance.last_reviewed`: the check date.
- Keep valid JSON, 2-space indent, and every existing required field. Don't
  touch `seo`, `governance.reviewed_by_*`, `slug`, `kind` or `schema_version`.

## Validation
```
cd <repo> && STRICT_SLUGS=slug-a,slug-b /tmp/fulltest/node_modules/.bin/vitest run \
  --config /tmp/fulltest/tools.config.mjs src/lib/schemas/__tests__/patient-tool-records.test.ts
```

## Progress log

- **2026-10-26, round 1:** 10 parallel research passes. 48 records researched to this standard (logs in `.audit-tmp/out/_log_*.md`). Merged as duplicates: teladoc-betterhelp → betterhelp, magellan-behavioral-health → magellan-health, koa-health-foundations → koa-health. koa-health-perspectives set to draft (not launched). NOCD, Headway, Brightline, Grow and Alma SEO titles rewritten for patients (they were written for therapists seeking work). 88 of 192 consumer records now pass `STRICT`.
- **Open:** brightside-health price is sourced from a HelpGuide review, not the vendor; confirm on brightside.com. Octave and Valera SEO copy still targets clinicians; fix during their research pass. Suspected duplicates still to resolve: sesamerx/sesame, silvercloud-space-from-* → silvercloud, ieso-digital-cbt/ieso-digital-health, included-health-*, doctor-on-demand-behavioral-health → doctor-on-demand, ginger/headspace-health → headspace, happify-twill/happify, wysa-for-employers/wysa, talkspace-business/talkspace.
