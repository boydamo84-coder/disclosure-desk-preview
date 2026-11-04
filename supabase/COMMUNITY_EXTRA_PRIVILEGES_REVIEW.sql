-- Disclosure Desk 2026-11-04 — REVIEW-ONLY least-privilege rehearsal.
-- Current live DB was inspected with SELECT-only catalog queries.
-- NEVER auto-apply to production. Even rollback-only privilege changes can
-- briefly acquire locks. Run ONLY in a disposable clone after human review.
-- NO permanent migration is authorised by this file.
-- The rollback at the end is deliberate: no lasting grants are modified.
--
-- The authenticated and/or anon roles currently have unnecessary TRUNCATE
-- and TRIGGER rights on the named tables. TRUNCATE bypasses row-level security.
-- This does not imply the website Data API exposes a TRUNCATE endpoint.
-- Preserve all SELECT/INSERT/UPDATE/DELETE privileges, RLS, service_role,
-- existing user documents, comments, Boards, and moderation.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

REVOKE TRUNCATE, TRIGGER ON TABLE
  public.dd_case_comment_flags,
  public.dd_case_comments,
  public.dd_email_backup_limit,
  public.dd_media_votes,
  public.dd_public_names,
  public.investigation_boards,
  public.research_assets,
  public.research_documents,
  public.research_reference_backups,
  public.video_progress
FROM anon, authenticated;

DO $review$
DECLARE
  names text[] := ARRAY['dd_case_comment_flags','dd_case_comments','dd_email_backup_limit','dd_media_votes','dd_public_names','investigation_boards','research_assets','research_documents','research_reference_backups','video_progress'];
  tbl text;
  relation_oid oid;
BEGIN
  FOREACH tbl IN ARRAY names LOOP
    relation_oid := to_regclass('public.'||tbl);
    IF relation_oid IS NULL THEN
      RAISE EXCEPTION 'Expected table missing in disposable review: %', tbl;
    END IF;
    IF has_table_privilege('anon', relation_oid, 'TRUNCATE')
        OR has_table_privilege('authenticated', relation_oid, 'TRUNCATE')
        OR has_table_privilege('anon', relation_oid, 'TRIGGER')
        OR has_table_privilege('authenticated', relation_oid, 'TRIGGER') THEN
      RAISE EXCEPTION 'Extra role privileges remain on %; inspect role inheritance', tbl;
    END IF;
  END LOOP;
  -- Existing browser-facing owner report delete/lookup must remain available
  -- under its independent ownership-enforcing RLS policies.
  IF NOT has_table_privilege('authenticated','public.dd_witness_reports','SELECT')
     OR NOT has_table_privilege('authenticated','public.dd_witness_reports','DELETE') THEN
    RAISE EXCEPTION 'Owner report access unexpectedly changed';
  END IF;
END
$review$;

-- Mandatory rollback: a zero-persistence permission rehearsal, NOT rollout.
ROLLBACK;
