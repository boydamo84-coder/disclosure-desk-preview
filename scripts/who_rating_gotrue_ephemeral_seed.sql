\set ON_ERROR_STOP on
-- M24 test-only fact-free registry row; not a migration or reviewed real claim.
DO $block$
BEGIN
 IF current_database()<>'who_evidence_ci' THEN
  RAISE EXCEPTION 'Fixture creation refused outside isolated DB';
 END IF;
END $block$;
INSERT INTO public.dd_who_reviewable_claims
 (claim_id,person_id,primary_source_url,editorial_version,
 source_reviewer_name,second_editor_name,
 original_record_reviewed_at,second_editor_approved_at,enabled)
VALUES
 ('m24-claim-fixture','fictional-profile','https://example.org/no-real-claim',
 'ci-fictional-only','Not Real Editor One','Not Real Editor Two',
 now(),now(),true),
 ('m24-disabled-fixture','fictional-profile','https://example.org/no-real-claim',
 'ci-fictional-only',NULL,NULL,NULL,NULL,false);
