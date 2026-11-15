\set ON_ERROR_STOP on
-- M23 ONLY: create fake roles/fixtures in the disposable who_evidence_ci database.
-- This file is not a migration, is not production-safe, and never contains real users.
DO $guard$
BEGIN
 IF current_database() <> 'who_evidence_ci' THEN
  RAISE EXCEPTION 'M23 HTTP harness refuses to seed %', current_database();
 END IF;
END $guard$;

CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD 'm23-ephemeral-only-pgrst';
GRANT anon, authenticated TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

INSERT INTO auth.users(id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333'),
 ('44444444-4444-4444-8444-444444444444'),
 ('55555555-5555-4555-8555-555555555555');
INSERT INTO auth.sessions(id,user_id) SELECT id,id FROM auth.users;


INSERT INTO public.dd_who_reviewable_claims (
 claim_id,person_id,primary_source_url,editorial_version,
 source_reviewer_name,second_editor_name,original_record_reviewed_at,
 second_editor_approved_at,enabled
) VALUES
 ('claim-http-synthetic','fictional-person','https://example.org/fictional',
 'ci-only-synthetic','Synthetic Editor One','Synthetic Editor Two',
 now(),now(),true),
 ('claim-http-disabled','fictional-person','https://example.org/fictional',
 'ci-only-synthetic',NULL,NULL,NULL,NULL,false);
