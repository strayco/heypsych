-- 045: Enable Row-Level Security on every public table (Supabase advisor
-- "rls_disabled_in_public", 2026-10-25).
--
-- Without RLS, anyone holding the project URL and the public (publishable /
-- anon) key could read, edit and delete these tables through the REST API.
--
-- How the app uses each table:
--   * Content tables (entity_relationships, content_files, collections,
--     entity_schemas) are READ by the site with the public key, and only
--     written by scripts with the service-role key. They get a public
--     read-only policy; no public insert/update/delete.
--   * newsletter_subscribers holds email addresses. It is only touched by
--     /api/newsletter/subscribe, which now uses the service-role key. No
--     public policy at all.
--   * entities, leads, demo_requests already have RLS (migrations 039-044).
--
-- The service-role key bypasses RLS, so server writes keep working.
-- Safe to re-run.

begin;

-- Private: subscriber emails. RLS on, no policies = no public access.
alter table if exists public.newsletter_subscribers enable row level security;
drop policy if exists "Public read access" on public.newsletter_subscribers;

-- Public content: read-only for everyone, writes only via service role.
do $$
declare t text;
begin
  foreach t in array array['entity_relationships', 'content_files', 'collections', 'entity_schemas'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "Public read access" on public.%I', t);
      execute format('create policy "Public read access" on public.%I for select to anon, authenticated using (true)', t);
    end if;
  end loop;
end $$;

-- Belt and braces: re-assert the ones from earlier migrations.
alter table if exists public.entities enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.demo_requests enable row level security;

commit;

-- After running, this should return no rows. Any table it lists still has RLS
-- off and needs a decision (public read policy, or private with none):
--
--   select tablename from pg_tables
--   where schemaname = 'public' and not rowsecurity;
