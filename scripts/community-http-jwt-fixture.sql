-- DISPOSABLE HTTP/JWT ACCEPTANCE ONLY — DO NOT RUN ON ANY SUPABASE PROJECT.
-- Used in GitHub Actions together with the existing fictional-user fixture.
-- PostgREST authenticates signed JWTs and sets request.jwt.claims; this local
-- auth shim represents the relevant request context, not Supabase Auth itself.
create role dd_http_authenticator login noinherit password 'isolated-http-qa-only';
grant anon,authenticated to dd_http_authenticator;
grant usage on schema public to dd_http_authenticator;
create or replace function auth.uid() returns uuid
 language sql stable set search_path=pg_catalog,public as $$
 select coalesce(
  nullif(current_setting('request.jwt.claim.sub',true),''),
  nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub'
 )::uuid
$$;
create or replace function auth.jwt() returns jsonb
 language sql stable set search_path=pg_catalog,public as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
-- Every fictional test person individually opts in; no real user is affected.
update public.dd_public_names set chat_contact_opt_in=true;
