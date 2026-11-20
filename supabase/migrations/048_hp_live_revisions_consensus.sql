-- 048: HeyPsych Consensus Score. Allows kind 'consensus' in the live
-- revisions table (key = pilot product slug, value = private evidence,
-- original summaries and the frozen approval snapshot). Additive: widens one
-- check constraint; no data changes. Safe to re-run.
--
-- The table stays private (RLS on, no policies): source observations are
-- read only by HeyPsych Admin through the direct Postgres connection. Public
-- pages receive only the approved projection, built server-side.

begin;

alter table public.hp_live_revisions drop constraint if exists hp_live_revisions_kind_check;
alter table public.hp_live_revisions
  add constraint hp_live_revisions_kind_check
  check (kind in ('tool', 'tool-new', 'flag', 'copy', 'experiment', 'consensus'));

commit;
