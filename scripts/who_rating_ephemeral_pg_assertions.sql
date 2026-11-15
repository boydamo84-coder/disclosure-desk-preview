\set ON_ERROR_STOP on
-- EPHEMERAL M22 HARNESS ONLY. Operates exclusively on synthetic fixtures.
DO $guard$
BEGIN
 IF current_database() <> 'who_evidence_ci' THEN
  RAISE EXCEPTION 'Refusing to test a shared/production database: %', current_database();
 END IF;
END $guard$;
CREATE SCHEMA ci_test;
CREATE FUNCTION ci_test.expect_error(p_sql TEXT,p_state TEXT,p_label TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $test$
DECLARE got TEXT := NULL;
BEGIN
 BEGIN
  EXECUTE p_sql;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS got = RETURNED_SQLSTATE;
 END;
 IF got IS DISTINCT FROM p_state THEN
  RAISE EXCEPTION 'TEST %: expected SQLSTATE %, actually %',p_label,p_state,coalesce(got,'no error');
 END IF;
END $test$;
GRANT USAGE ON SCHEMA ci_test TO anon,authenticated;
GRANT EXECUTE ON FUNCTION ci_test.expect_error(TEXT,TEXT,TEXT) TO anon,authenticated;

-- Both roles exist only in this throwaway runner. NO production accounts.
INSERT INTO auth.users(id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333'),
 ('44444444-4444-4444-8444-444444444444'),
 ('55555555-5555-4555-8555-555555555555');

-- No claim may become reviewable with incomplete or same-person signoffs.
SELECT ci_test.expect_error($bad$
 INSERT INTO public.dd_who_reviewable_claims(claim_id,person_id,primary_source_url,editorial_version,enabled)
 VALUES('claim-missing-review','fictional-person','https://example.org/fictional','synthetic',true)
$bad$,'23514','no reviewer metadata rejects enabled');
SELECT ci_test.expect_error($bad$
 INSERT INTO public.dd_who_reviewable_claims
 (claim_id,person_id,primary_source_url,editorial_version,source_reviewer_name,second_editor_name,original_record_reviewed_at,second_editor_approved_at,enabled)
 VALUES('claim-same-reviewer','fictional-person','https://example.org/fictional','synthetic',
 'Same Editor','Same Editor',now(),now(),true)
$bad$,'23514','two identical reviewer names cannot approve');

INSERT INTO public.dd_who_reviewable_claims
(claim_id,person_id,primary_source_url,editorial_version,source_reviewer_name,second_editor_name,original_record_reviewed_at,second_editor_approved_at,enabled)
VALUES
('claim-fixture-2026','fictional-person','https://example.org/fictional','CI-only-v1','Fictional Editor One','Fictional Editor Two',now(),now(),true),
('claim-disabled-2026','fictional-person','https://example.org/fictional','CI-only-v1',NULL,NULL,NULL,NULL,false);

-- Raw table privileges intentionally denied despite security-definer RPCs.
SET ROLE anon;
SET request.jwt.claim.sub = '';
SET request.jwt.claims = '{"is_anonymous":true}';
SELECT ci_test.expect_error('SELECT count(*) FROM public.dd_who_claim_ratings',
 '42501','guest cannot inspect raw votes');
SELECT ci_test.expect_error('SELECT count(*) FROM public.dd_who_reviewable_claims',
 '42501','guest cannot inspect registry');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',50)',
 '42501','guest cannot invoke write RPC');
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_summary(ARRAY['claim-fixture-2026']);
 IF s.rating_count<>0 OR s.community_mean IS NOT NULL OR s.my_rating IS NOT NULL THEN
  RAISE EXCEPTION 'Guest summary leaks rating or presents nonexistent evidence';
 END IF;
END $test$;
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_summary(ARRAY[]::TEXT[])',
 '22023','reject empty guest summary');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_summary(NULL::TEXT[])',
 '22023','reject null guest summary');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_summary(ARRAY[''BAD id''])',
 '22023','reject malformed guest claim ID');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_summary(ARRAY[NULL::TEXT])',
 '22023','reject null guest array element');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_summary(array_fill(''claim-fixture-2026''::TEXT,ARRAY[21]))',
 '22023','reject oversized summary arrays');
DO $test$
BEGIN
 IF EXISTS(SELECT 1 FROM public.dd_who_claim_rating_summary(ARRAY['claim-disabled-2026'])) THEN
  RAISE EXCEPTION 'A disabled claim was disclosed to a guest';
 END IF;
END $test$;

-- Authenticated identity ONE. Request metadata is a FAKE JWT in this harness,
-- unlike production middleware that must verify a genuine signed token.
RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SET request.jwt.claims = '{"is_anonymous":false}';
SELECT ci_test.expect_error('SELECT count(*) FROM public.dd_who_claim_ratings',
 '42501','member cannot query raw vote table');
SELECT ci_test.expect_error($bad$
 INSERT INTO public.dd_who_claim_ratings(claim_id,voter_id,score)
 VALUES('claim-fixture-2026','22222222-2222-4222-8222-222222222222',80)
$bad$,'42501','member cannot impersonate someone via direct insert');
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_set('claim-fixture-2026',80);
 IF s.rating_count<>1 OR s.community_mean IS NOT NULL OR s.my_rating<>80 THEN
  RAISE EXCEPTION 'First vote should be one private member score with suppressed mean';
 END IF;
END $test$;
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',75)',
 '22023','editing too soon must reject');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-disabled-2026'',55)',
 '22023','disabled claim must reject');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''missing-claim-2026'',55)',
 '22023','unknown claim must reject');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',101)',
 '22023','greater than 100 must reject');
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',-1)',
 '22023','negative score must reject');

-- Even with an authenticated Postgres role, anonymous Supabase sign-in cannot vote.
SET request.jwt.claims = '{"is_anonymous":true}';
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',70)',
 '28000','anonymous identity must reject');
SET request.jwt.claim.sub = '';
SET request.jwt.claims = '{"is_anonymous":false}';
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',70)',
 '28000','missing authenticated subject must reject');

-- Four more independent synthetic accounts. These prove only DB count/ownership,
-- NOT independence of real UAP witnesses or legitimacy of a public ballot.
RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
SET request.jwt.claims = '{"is_anonymous":false}';
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_set('claim-fixture-2026',100);
 IF s.rating_count<>2 OR s.my_rating<>100 OR s.community_mean IS NOT NULL THEN
  RAISE EXCEPTION 'Second account must see only its own vote, no low-turnout average';
 END IF;
END $test$;
SET request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
SELECT * FROM public.dd_who_claim_rating_set('claim-fixture-2026',70);
SET request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
SELECT * FROM public.dd_who_claim_rating_set('claim-fixture-2026',30);
SET request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_set('claim-fixture-2026',20);
 IF s.rating_count<>5 OR s.community_mean<>60.0 OR s.my_rating<>20 THEN
  RAISE EXCEPTION 'Five accounts must enable average 60, preserving current own rating';
 END IF;
END $test$;

SET ROLE anon;
SET request.jwt.claim.sub = '';
SET request.jwt.claims = '{"is_anonymous":true}';
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_summary(ARRAY['claim-fixture-2026']);
 IF s.rating_count<>5 OR s.community_mean<>60.0 OR s.my_rating IS NOT NULL THEN
  RAISE EXCEPTION 'Guest must see total and threshold mean, never account rating';
 END IF;
END $test$;

-- Deleting an auth user cascades their vote and hides mean below five again.
RESET ROLE;
DELETE FROM auth.users WHERE id='55555555-5555-4555-8555-555555555555';
SET ROLE anon;
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_summary(ARRAY['claim-fixture-2026']);
 IF s.rating_count<>4 OR s.community_mean IS NOT NULL OR s.my_rating IS NOT NULL THEN
  RAISE EXCEPTION 'Deleted user vote did not cascade or average was leaked under five';
 END IF;
END $test$;
RESET ROLE;

-- Disabled claim must disappear from summary and reject new votes.
UPDATE public.dd_who_reviewable_claims SET enabled=false WHERE claim_id='claim-fixture-2026';
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SET request.jwt.claims = '{"is_anonymous":false}';
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-fixture-2026'',80)',
 '22023','moderator disabling a claim blocks votes immediately');
DO $test$
BEGIN
 IF EXISTS(SELECT 1 FROM public.dd_who_claim_rating_summary(ARRAY['claim-fixture-2026'])) THEN
  RAISE EXCEPTION 'Disabled claim is still returned';
 END IF;
END $test$;
RESET ROLE;
UPDATE public.dd_who_reviewable_claims SET enabled=true WHERE claim_id='claim-fixture-2026';

-- Once cooldown elapsed, an edit updates SAME row rather than counting as a
-- second vote; also demonstrate the 30-new-vote rolling-day limit.
UPDATE public.dd_who_claim_ratings SET updated_at=now()-interval '4 minutes'
 WHERE claim_id='claim-fixture-2026' AND voter_id='11111111-1111-4111-8111-111111111111';
INSERT INTO public.dd_who_reviewable_claims
(claim_id,person_id,primary_source_url,editorial_version,source_reviewer_name,second_editor_name,original_record_reviewed_at,second_editor_approved_at,enabled)
SELECT 'claim-batch-'||lpad(n::text,3,'0'), 'fictional-person','https://example.org/fictional','CI-only-v1',
 'Fictional Editor One','Fictional Editor Two',now(),now(),true
FROM generate_series(1,30) n;
INSERT INTO public.dd_who_claim_ratings(claim_id,voter_id,score)
SELECT 'claim-batch-'||lpad(n::text,3,'0'),'11111111-1111-4111-8111-111111111111',50
FROM generate_series(1,29) n;
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SELECT ci_test.expect_error('SELECT * FROM public.dd_who_claim_rating_set(''claim-batch-030'',50)',
 '22023','more than 30 new daily ratings rejected');
DO $test$
DECLARE s RECORD;
BEGIN
 SELECT * INTO STRICT s FROM public.dd_who_claim_rating_set('claim-fixture-2026',75);
 IF s.rating_count<>4 OR s.my_rating<>75 THEN
  RAISE EXCEPTION 'Allowed old-vote edit duplicated a row or altered someone else';
 END IF;
END $test$;
RESET ROLE;
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.dd_who_claim_ratings
     WHERE claim_id='claim-fixture-2026')<>4 THEN
  RAISE EXCEPTION 'PK/UPSERT did not enforce one row per account per claim';
 END IF;
END $test$;
\echo 'Who M22 ephemeral PostgreSQL: pass synthetic guest/member/approval/score/privacy/cooldown/rate-limit/delete checks; NO PRODUCTION DATA.'
