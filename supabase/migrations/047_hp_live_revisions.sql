-- 047: Live updates (HeyPsych Admin): one revisions table in the existing
-- database. Additive and safe to re-run. No existing table is touched.
--
-- Each row is a complete desired value for one editable thing:
--   kind 'tool'      key = tool slug      value = field overlay (allow-listed)
--   kind 'tool-new'  key = tool slug      value = full V4 record
--   kind 'flag'      key = flag key       value = {"enabled": bool, "rollout": 0-100}
--   kind 'copy'      key = copy key       value = {"text": string}
--   kind 'experiment' key = experiment    value = {"active": bool}
-- value NULL means "no override": the file in data/ applies.
--
-- At most one row per (kind, key) is 'published'. Publishing supersedes the
-- previous one; rollback publishes a copy of an earlier revision, so history
-- is append-only and every state can be restored.
--
-- Private: RLS on with no policies, so the public REST API cannot read or
-- write it. The app uses the direct Postgres connection (db-pool.ts).

begin;

create table if not exists public.hp_live_revisions (
  id            bigserial primary key,
  kind          text not null check (kind in ('tool', 'tool-new', 'flag', 'copy', 'experiment')),
  key           text not null check (char_length(key) between 1 and 120),
  value         jsonb,
  status        text not null check (status in ('draft', 'published', 'superseded', 'discarded')),
  note          text check (note is null or char_length(note) <= 500),
  author        text not null default 'admin',
  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  restores      bigint references public.hp_live_revisions(id)
);

create index if not exists hp_live_revisions_kind_key on public.hp_live_revisions (kind, key, id desc);
create unique index if not exists hp_live_revisions_one_published
  on public.hp_live_revisions (kind, key) where status = 'published';
create unique index if not exists hp_live_revisions_one_draft
  on public.hp_live_revisions (kind, key) where status = 'draft';

alter table public.hp_live_revisions enable row level security;

commit;
