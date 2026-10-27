-- 046: Supabase Security Advisor warnings (2026-10-27).
--
-- 1. exec_sql(sql text) is SECURITY DEFINER and was executable by anyone with
--    the public key: arbitrary SQL as the function owner. Only maintenance
--    scripts in scripts/ call it, with the service-role key. Revoke it from
--    everyone else.
-- 2. "Function Search Path Mutable": pin search_path on the flagged functions
--    so they can't be pointed at look-alike objects. public stays first, so
--    pg_trgm (installed in public) keeps resolving for the search functions.
--
-- Left as is: "Extension in Public" (pg_trgm). Moving it to the extensions
-- schema would need every search function updated; low risk, separate change.
-- Safe to re-run.

begin;

do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'exec_sql'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'touch_updated_at', 'update_updated_at_column', 'exec_sql', 'update_search_vector',
      'jsonb_extract_text_values', 'set_updated_at', 'search_entities', 'search_entities_grouped',
      'update_demo_requests_updated_at'
    )
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', f);
  end loop;
end $$;

commit;

-- Check: should return only service_role (and the owner) for exec_sql.
select p.oid::regprocedure as function, r.rolname as can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public' and p.proname = 'exec_sql'
  and r.rolname in ('anon', 'authenticated', 'service_role')
  and has_function_privilege(r.oid, p.oid, 'EXECUTE');
