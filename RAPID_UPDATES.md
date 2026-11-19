# Rapid updates: changing HeyPsych without a deploy

Admin → **Live updates** (`/hp-ctrl-8k3m9x/live`). You sign in with the
existing admin password. Nothing here needs a code change, a build or a
deploy.

## What you can change

| Area | What | Who sees it, and when |
|---|---|---|
| **Tools** | name, company, one-liner, descriptions, website/pricing/demo/support links, **pricing** (model, starting price, display text, trial, free tier, quote, notes, tiers, last-verified date), integrations, capabilities, categories, best for / not for, positioning, related and competitor tools, status | Profile, its JSON-LD, comparisons, alternatives, category hubs, Practice Architect (catalog, monthly cost, ledger, printable plan). The first visit after publishing may still get the old page while it rebuilds; later visits get the new one (about a second in tests). |
| **New tools** | Create from the Tools tab. Validated against the full tool schema. | Same, once published with status `active` |
| **Feature flags** | "Draft my practice" in Architect; homepage welcome-back strip; Architect plan ledger. On/off plus 0–100% rollout. | Next page load |
| **Experiment** | "Draft my practice" button label (control vs "Build my first draft"). Start/stop. | Next page load; each browser keeps its variant |
| **Approved copy** | Homepage subtitle (120 chars), Architect draft banner title (60) and text (320). No `<` or `>`. | Next page load |

**Not editable here, by design:**

- HIPAA/BAA/SOC 2/HITRUST status and their sources.
- Affiliate and commercial fields, editorial and review fields, SEO fields.
- All clinical content: conditions, treatments, symptoms, the support
  journey, brief questions and crisis resources.

These change only in the reviewed files, through code review. Flags and
experiments can't reach the patient journey or its evaluator; nothing in
`src/domains/patient-support` or `src/domains/path` reads live config.

## How to change a price (the common case)

1. **Tools** → search → click the tool.
2. Change **Starting price (USD)** and **Price as shown**. Also update the
   matching tier row if the tier price changed.
3. Only after checking the vendor's own pricing page, click **Today** next to
   *Price last verified*. Leave it alone otherwise; the site then says "Price
   not yet checked by HeyPsych".
4. Add a note (e.g. "Checked pricing page 19 Nov") and click **Save draft**.
5. Optional: **Preview draft ↗** opens the site with your draft. Only your
   browser sees it. Click **Exit preview** at the top of Admin when done.
6. Click **Publish**. The editor shows the published values straight away.

Rules the form enforces:

- An unknown price is left empty, never 0. Empty shows as "not published" or
  "Pricing by quote".
- A change that fails the tool schema is refused, and the reviewed record
  stays live.
- Only fields that differ from the reviewed file are stored, so a later fix
  to the file still shows through for everything you didn't touch.

## Undo

- **Revert to reviewed record** (tool editor): drops all live changes for that
  tool. The reviewed file shows again.
- **Restore this** (History, on any superseded revision): republishes that
  exact earlier version as a new revision.
- **Use default** (copy) and the flag switch: return copy and flags to their
  defaults.

Nothing is deleted. Every publish, revert and restore is a row in history with
time, author and note.

## Flags, rollouts and experiments

- Rollout uses a stable hash of an anonymous browser id (`hp:bid`, local
  storage) and the flag key. Raising 25% → 50% keeps the first 25% in.
- Turning an experiment off sends everyone to the control.
- Flags and experiments may change presentation only. They must never change
  what is recommended to a patient or which product is ranked first. The
  registry (`src/lib/live/registry.ts`) is the only place new ones can be
  added, and that's a code change, so it gets reviewed.

## How it works, and why it costs $0

- **Storage:** one table, `public.hp_live_revisions`, in the existing Supabase
  Postgres (migration `supabase/migrations/047_hp_live_revisions.sql`). It
  has row-level security on with no policies, so only the server connection
  can read it. At most one published row and one draft per item.
- **Reads:** pages read published rows through Next's data cache with no
  expiry, so normal traffic makes **no** database queries. Measured: 80
  public requests, 0 queries, 0 open connections.
- **Publishing** expires the cache once, on demand:
  - Tool changes use stale-while-revalidate. It's required: routes such as
    `/tools/compare/[slug]` only allow prebuilt paths, and a hard-expired page
    there returns 404.
  - Flag and copy changes expire immediately.
- **Practice Architect** fetches its catalog from
  `/api/architect/products?v=<version>`. Each publish changes the version, so
  the edge cache (24 hours) never serves an old price under a new version. If
  the version asked for isn't the one served, which happens for about a
  second after publishing, the response is cached for only 60 seconds.
- **If the database is unreachable,** pages fall back to
  `data/live/published.json`. Use **Export snapshot** in Admin to refresh it
  and commit it with your next deploy. Database errors trip a 60-second
  breaker, so an outage can't slow pages down.
- **Nothing new is billed:** no new service, package, cron job, polling or
  client-side config fetch. Admin requests and publishes are the only extra
  function runs.

## Do and don't

- **Don't edit `hp_live_revisions` with SQL.** The cache only refreshes when
  you publish through Admin. A hand edit stays invisible until the next
  publish, and the editor and pages can disagree until then.
- **Send the whole pricing block** if you use the API directly. A `pricing`
  overlay replaces the reviewed block, so leaving out `tiers` or `add_ons`
  removes them. The Admin form always sends everything.
- **Set "Price last verified" only after checking the vendor.** That date is
  what the site uses to say "price checked".

## Setup for production (one time)

Checked on 19 Nov:
- Vercel already has `ADMIN_PASSWORD`, `SUPABASE_DB_URL`, `DATABASE_CA_CERT`
  and `NEXT_PUBLIC_SITE_URL`.
- **Missing: rate-limit storage.** Admin login fails closed and production
  answers 503 today.

1. **Add Upstash Redis on the free plan** ($0: 500K commands, 256 MB,
   10 GB/month; HeyPsych uses a few thousand commands a month).
   - Vercel → Storage → Create → **Upstash** → Redis → plan **Free** → name it
     (e.g. `heypsych-ratelimit`) → connect it to the **heypsych** project for
     **Production** (Preview is optional).
   - Or create the database at upstash.com, then add `UPSTASH_REDIS_REST_URL`
     and `UPSTASH_REDIS_REST_TOKEN` to Vercel → heypsych → Environment
     Variables (Production).
   - Either name set works: the code reads `UPSTASH_REDIS_REST_*` or
     `KV_REST_API_*`.
   - Don't add a credit card to Upstash; that moves the database to
     pay-as-you-go. On the free plan, going over the cap makes commands fail;
     it's never billed.
   - Environment changes apply to the next deployment, so do this before
     deploying.
2. **Apply** `supabase/migrations/047_hp_live_revisions.sql` in the Supabase
   SQL editor. It's additive and idempotent. If you skip it, the first Admin
   action creates the same table.
3. **After deploying:**
   - Sign in at `/hp-ctrl-8k3m9x/login` and open Live updates.
   - Click **Export snapshot**, save it as `data/live/published.json`, and
     commit it with the next code change.
4. **Optional:** set a Vercel Spend Management alert (e.g. $15) so metered
   analytics events can't surprise you.

## Rollback

- **A content or price change:** Admin → Revert to reviewed record, or
  History → Restore this. No deploy.
- **The whole release:** Vercel → heypsych → Deployments → the previous
  production deployment (`fb170bd`, 12 Nov) → **Instant Rollback**. The only
  database change is the new `hp_live_revisions` table, which the previous
  code ignores, so no data step is needed. Keep the table; it holds your
  revision history.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Admin shows "Database not configured" | `SUPABASE_DB_URL` missing in that environment |
| Login says the service isn't configured (503) | Rate-limit storage missing (step 1 above); login fails closed by design |
| Published, but a page still shows the old value | Reload once. Tool pages rebuild on the first visit after publishing. |
| A tool edit is rejected | The message names the field. Locked fields (compliance, commercial, SEO) can't be changed here. |
| "Live errors" banner in Admin | A published overlay no longer fits the reviewed file (e.g. a renamed slug). Revert that tool. |
