-- ONLY for short-lived GitHub Actions postgres:17/PostgREST; never run on Supabase.
-- A signed web JWT determines auth.uid(), not a browser-provided user_id.
create role dd_http_authenticator login noinherit password 'isolated-http-qa-only';
grant anon,authenticated to dd_http_authenticator;
grant usage on schema public to dd_http_authenticator;
create or replace function auth.uid() returns uuid language sql stable set search_path=pg_catalog,public as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
  nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
create or replace function auth.jwt() returns jsonb language sql stable set search_path=pg_catalog,public as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
-- Owner user 3 is fake, created by forum-isolated-fixture.sql.
insert into public.dd_forum_owner_admins(user_id) values('00000000-0000-0000-0000-000000000003');
