\set ON_ERROR_STOP on
-- M24 ephemeral GoTrue integration ONLY. NEVER execute against real Supabase.
-- GoTrue must have started and created its authentic auth.users schema first.
DO $safety$
BEGIN
 IF current_database() <> 'who_evidence_ci' THEN
  RAISE EXCEPTION 'M24 blocks any other database: %',current_database();
 END IF;
 IF NOT EXISTS (SELECT 1 FROM information_schema.tables
   WHERE table_schema='auth' AND table_name='users') THEN
  RAISE EXCEPTION 'GoTrue actual auth.users missing; refusing a fabricated table';
 END IF;
END $safety$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD 'm24-GOTRUE-only-pgrst-local';
GRANT anon,authenticated TO authenticator;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
-- The public draft uses auth.uid()/auth.jwt(); emulate Supabase DB helper
-- functions, but the *signed tokens* are issued by real local GoTrue and
-- verified by actual local PostgREST, NOT by this SQL.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
 LANGUAGE SQL STABLE SET search_path = ''
 AS $$
 SELECT nullif((coalesce(nullif(pg_catalog.current_setting('request.jwt.claims',true),''),'{}')::JSONB ->> 'sub'),'')::UUID;
 $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB
 LANGUAGE SQL STABLE SET search_path = ''
 AS $$
 SELECT coalesce(nullif(pg_catalog.current_setting('request.jwt.claims',true),''),'{}')::JSONB;
 $$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated;
