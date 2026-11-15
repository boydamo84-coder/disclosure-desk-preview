\set ON_ERROR_STOP on
-- M22: Emulate only the minimum auth schema in an ephemeral runner database.
-- Never run this bootstrap in an actual Supabase project or shared Postgres.
DO $guard$
BEGIN
 IF current_database() <> 'who_evidence_ci' THEN
  RAISE EXCEPTION 'M22 test bootstrap refuses non-ephemeral database %', current_database();
 END IF;
END $guard$;

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id UUID PRIMARY KEY);
-- This shim mimics the request metadata passed by PostgREST, not JWT verification.
CREATE FUNCTION auth.uid() RETURNS UUID
LANGUAGE SQL STABLE SET search_path = ''
AS $$
 SELECT nullif(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::UUID;
$$;
CREATE FUNCTION auth.jwt() RETURNS JSONB
LANGUAGE SQL STABLE SET search_path = ''
AS $$
 SELECT coalesce(nullif(pg_catalog.current_setting('request.jwt.claims',true),''),'{}')::JSONB;
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated;
