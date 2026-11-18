-- Ephemeral CI-only Supabase-style auth roles. NEVER run on production.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, created_at timestamptz not null default now());
grant usage on schema auth to anon,authenticated;
create function auth.jwt() returns jsonb language sql stable security invoker
set search_path='' as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;
$$;
create function auth.uid() returns uuid language sql stable security invoker
set search_path='' as $$
 select nullif(auth.jwt()->>'sub','')::uuid;
$$;
grant execute on function auth.uid() to anon,authenticated;
grant execute on function auth.jwt() to anon,authenticated;
grant usage on schema public to anon,authenticated;
