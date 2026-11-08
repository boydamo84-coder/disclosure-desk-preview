-- DISCLOSURE DESK / MILESTONE 26 / OFFLINE WRITE-FENCE DRAFT — NOT APPLIED.
-- REVIEW GATE: Requires ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql first.
-- DO NOT RUN on live production as-is; initial rollout requires backup + verified
-- disposable restore, account-paired RLS tests and auditor review.
-- No CREATE/ALTER TABLE in storage schema. Only approved Storage RLS policies.
-- Deliberately does NOT install dd_deletion_write_fence_active: the separate
-- execution function must still FAIL CLOSED. A complete Auth cascade test,
-- service-role Storage audit and all SECURITY DEFINER delete RPC protections
-- must precede its installation.
BEGIN;

-- Race-safe, owner-scoped state check. FOR SHARE serialises a client write
-- with the UPDATE to the same deletion ledger row inside dd_deletion_claim.
-- An older JWT still resolves to the same auth.uid and is therefore blocked.
CREATE OR REPLACE FUNCTION public.dd_deletion_write_allowed(p_user uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=''
AS $$
DECLARE v_phase text;
        v_lease uuid;
        v_expires timestamptz;
BEGIN
  IF p_user IS NULL THEN RETURN true; END IF;
  SELECT j.phase,j.lease_token,j.lease_expires_at
   INTO v_phase,v_lease,v_expires
  FROM public.dd_account_deletion_jobs j
  WHERE j.account_id=p_user FOR SHARE;
  IF NOT FOUND OR v_phase='prepared' THEN RETURN true; END IF;
  -- The one and only server-only cleanup exemption: a validated claim lease
  -- set in a service-role RPC transaction; ordinary authenticated clients
  -- cannot spoof service_role by setting this custom session variable.
  IF current_setting('request.jwt.claim.role',true)='service_role'
     AND v_lease IS NOT NULL AND v_expires>now()
     AND v_lease::text=current_setting('dd.cleanup_lease',true)
     AND v_phase IN ('approved','forum_redacted','storage_cleared','auth_removed')
  THEN RETURN true; END IF;
  RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_write_allowed(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dd_deletion_write_allowed(uuid) TO authenticated,service_role;

-- BEFORE INSERT/UPDATE trigger protects original Auth owner even inside
-- SECURITY DEFINER RPCs which bypass normal RLS, including old bearer tokens.
-- Applies to BOTH prior and new account-owned row fields so an UPDATE cannot
-- move rows into/out of a frozen account. The mutable table name and columns
-- are fixed in the audited trigger deployment below, NEVER browser-supplied.
CREATE OR REPLACE FUNCTION public.dd_deletion_guard_owned_mutation()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_before jsonb;
        v_after jsonb;
        v_candidate uuid;
        v_column text;
        v_actor uuid;
        i integer;
BEGIN
  IF TG_OP NOT IN ('INSERT','UPDATE') THEN
    RAISE EXCEPTION 'invalid deletion write fence operation' USING ERRCODE='42501';
  END IF;
  v_actor:=auth.uid();
  IF v_actor IS NOT NULL AND NOT public.dd_deletion_write_allowed(v_actor)
  THEN RAISE EXCEPTION 'account deletion in progress' USING ERRCODE='42501'; END IF;
  v_before:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  v_after:=to_jsonb(NEW);
  IF TG_NARGS=0 THEN RAISE EXCEPTION 'missing account fence columns' USING ERRCODE='42501'; END IF;
  FOR i IN 0..TG_NARGS-1 LOOP
    v_column:=TG_ARGV[i];
    IF NOT v_after ? v_column OR (TG_OP='UPDATE' AND NOT v_before ? v_column)
    THEN RAISE EXCEPTION 'unregistered account fence column' USING ERRCODE='42501'; END IF;
    IF TG_OP='UPDATE' AND v_before->>v_column IS NOT NULL THEN
      v_candidate:=(v_before->>v_column)::uuid;
      IF NOT public.dd_deletion_write_allowed(v_candidate)
      THEN RAISE EXCEPTION 'account deletion in progress' USING ERRCODE='42501'; END IF;
    END IF;
    IF v_after->>v_column IS NOT NULL THEN
      v_candidate:=(v_after->>v_column)::uuid;
      IF NOT public.dd_deletion_write_allowed(v_candidate)
      THEN RAISE EXCEPTION 'account deletion in progress' USING ERRCODE='42501'; END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_guard_owned_mutation() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_guard_owned_mutation() TO service_role;

-- Each public table below was read from actual live column/catalog metadata
-- (8 Nov 2026). Triggers guard INSERT/UPDATE under authenticated AND definer
-- calls. DELETE is controlled for authenticated clients by restrictive RLS.
-- Privileged DELETE RPCs/CASCADE behaviour still require integration review.
DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_avatar_profiles;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_avatar_profiles
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_avatar_profiles;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_avatar_profiles AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_case_comment_flags;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_case_comment_flags
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('reporter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_case_comment_flags;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_case_comment_flags AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_case_comments;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_case_comments
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_case_comments;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_case_comments AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_chat_blocks;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_chat_blocks
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('blocker_id','blocked_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_chat_blocks;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_chat_blocks AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_chat_messages;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_chat_messages;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_chat_messages AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_chat_owner_admins;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_chat_owner_admins
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_chat_owner_admins;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_chat_owner_admins AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_chat_pairs;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_chat_pairs
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('inviter_id','invitee_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_chat_pairs;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_chat_pairs AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_chat_reports;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_chat_reports
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('reporter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_chat_reports;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_chat_reports AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_comment_moderators;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_comment_moderators
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_comment_moderators;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_comment_moderators AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_content_votes;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_content_votes
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('voter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_content_votes;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_content_votes AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_email_backup_limit;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_email_backup_limit
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_email_backup_limit;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_email_backup_limit AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_audit;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_audit
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('actor_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_audit;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_audit AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_escalations;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_escalations
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('submitted_by');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_escalations;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_escalations AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_flags;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_flags
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('reporter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_flags;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_flags AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_owner_admins;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_owner_admins
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_owner_admins;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_owner_admins AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_replies;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_replies
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_replies;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_replies AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_sections;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_sections
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('creator_id','steward_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_sections;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_sections AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_threads;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_threads
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_threads;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_threads AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_forum_votes;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_forum_votes
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('voter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_forum_votes;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_forum_votes AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_live_chat_flags;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_live_chat_flags
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('reporter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_live_chat_flags;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_live_chat_flags AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_live_chat_messages;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_live_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_live_chat_messages;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_live_chat_messages AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_media_titles;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_media_titles
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('submitted_by');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_media_titles;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_media_titles AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_media_votes;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_media_votes
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_media_votes;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_media_votes AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_public_names;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_public_names
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_public_names;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_public_names AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_witness_deleted_quota;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_witness_deleted_quota
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_witness_deleted_quota;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_witness_deleted_quota AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_witness_report_flags;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_witness_report_flags
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('reporter_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_witness_report_flags;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_witness_report_flags AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.dd_witness_reports;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.dd_witness_reports
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('author_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.dd_witness_reports;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.dd_witness_reports AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.investigation_boards;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.investigation_boards
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.investigation_boards;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.investigation_boards AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.research_assets;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.research_assets
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.research_assets;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.research_assets AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.research_document_revisions;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.research_document_revisions
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.research_document_revisions;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.research_document_revisions AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.research_document_trash;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.research_document_trash
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.research_document_trash;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.research_document_trash AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.research_documents;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.research_documents
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.research_documents;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.research_documents AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

DROP TRIGGER IF EXISTS dd_deletion_fence_insert_update ON public.research_reference_backups;
CREATE TRIGGER dd_deletion_fence_insert_update
BEFORE INSERT OR UPDATE ON public.research_reference_backups
FOR EACH ROW EXECUTE FUNCTION public.dd_deletion_guard_owned_mutation('user_id');

DROP POLICY IF EXISTS dd_deletion_fence_authenticated_delete ON public.research_reference_backups;
CREATE POLICY dd_deletion_fence_authenticated_delete
ON public.research_reference_backups AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.dd_deletion_write_allowed(auth.uid()));

-- Authenticated client Storage uploads, overwrites and removals in only the
-- two designated private buckets are restricted; unrelated buckets unchanged.
-- Supabase Storage API MUST still be used to remove actual object bytes.
DROP POLICY IF EXISTS dd_deletion_fence_storage_insert ON storage.objects;
CREATE POLICY dd_deletion_fence_storage_insert
ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (
  bucket_id NOT IN ('dd-profile-avatars','research-images')
  OR public.dd_deletion_write_allowed(auth.uid())
);

DROP POLICY IF EXISTS dd_deletion_fence_storage_update ON storage.objects;
CREATE POLICY dd_deletion_fence_storage_update
ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (
  bucket_id NOT IN ('dd-profile-avatars','research-images')
  OR public.dd_deletion_write_allowed(auth.uid())
)
WITH CHECK (
  bucket_id NOT IN ('dd-profile-avatars','research-images')
  OR public.dd_deletion_write_allowed(auth.uid())
);

DROP POLICY IF EXISTS dd_deletion_fence_storage_delete ON storage.objects;
CREATE POLICY dd_deletion_fence_storage_delete
ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (
  bucket_id NOT IN ('dd-profile-avatars','research-images')
  OR public.dd_deletion_write_allowed(auth.uid())
);

COMMIT;
