-- DISCLOSURE DESK / M24 — STAGING DRAFT ONLY, NOT APPLIED.
-- DO NOT execute against production. No automatic migration/deployment.
-- PostgreSQL 15+ / Supabase: all privileged RPCs are restricted to service_role.
-- Private DBA-managed recovery approvals are never writable through the Data API.
BEGIN;

CREATE SCHEMA IF NOT EXISTS dd_deletion_private;
REVOKE ALL ON SCHEMA dd_deletion_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.dd_account_deletion_jobs (
  account_id uuid PRIMARY KEY, -- deliberately not an Auth FK; receipt survives Auth removal
  phase text NOT NULL DEFAULT 'prepared'
    CHECK (phase IN ('prepared','approved','forum_redacted','storage_cleared','auth_removed','complete')),
  intent_digest text CHECK (intent_digest IS NULL OR intent_digest ~ '^[a-f0-9]{64}$'),
  intent_expires_at timestamptz,
  manifest jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(manifest)='array'),
  lease_token uuid,
  lease_expires_at timestamptz,
  prepared_session_id uuid,
  reauthenticated_at timestamptz,
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_error_code text
);
ALTER TABLE public.dd_account_deletion_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dd_account_deletion_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dd_account_deletion_jobs TO service_role;

-- Only a trusted DBA can INSERT an approval; this table is not a service-role API.
CREATE TABLE IF NOT EXISTS dd_deletion_private.dd_deletion_recovery_approvals (
  ticket_id uuid PRIMARY KEY,
  account_id uuid NOT NULL, -- no FK; recovery must work after Auth removal
  expected_phase text NOT NULL CHECK (expected_phase IN
    ('approved','forum_redacted','storage_cleared','auth_removed')),
  approved_by text NOT NULL CHECK (length(approved_by) BETWEEN 2 AND 96),
  reviewed_by text NOT NULL CHECK (length(reviewed_by) BETWEEN 2 AND 96
    AND reviewed_by <> approved_by),
  reason_code text NOT NULL CHECK (reason_code IN
    ('storage_failure','checkpoint_failure','operator_review')),
  approved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
REVOKE ALL ON dd_deletion_private.dd_deletion_recovery_approvals
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_active_session(
  p_target uuid, p_session uuid
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  RETURN EXISTS(
    SELECT 1 FROM auth.sessions s WHERE s.user_id=p_target AND s.id=p_session
      AND (s.not_after IS NULL OR s.not_after>now())
  );
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_active_session(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_active_session(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_guard_role(
  p_target uuid
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  RETURN EXISTS(SELECT 1 FROM public.dd_forum_owner_admins WHERE user_id=p_target)
      OR EXISTS(SELECT 1 FROM public.dd_chat_owner_admins WHERE user_id=p_target)
      OR EXISTS(SELECT 1 FROM public.dd_comment_moderators WHERE user_id=p_target)
      OR EXISTS(SELECT 1 FROM public.dd_forum_sections
        WHERE creator_id=p_target OR steward_id=p_target);
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_guard_role(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_guard_role(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_storage_manifest(
  p_target uuid
) RETURNS TABLE(bucket_id text, name text, owner_id text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  -- Fail if metadata points at objects owned by another account, including null owners.
  IF EXISTS(
    SELECT 1 FROM public.dd_avatar_profiles a
    JOIN storage.objects s ON s.bucket_id='dd-profile-avatars'
      AND s.name LIKE a.public_key::text || '/%'
    WHERE a.user_id=p_target AND s.owner_id IS DISTINCT FROM p_target::text
  ) OR EXISTS(
    SELECT 1 FROM public.research_assets a
    JOIN storage.objects s ON s.bucket_id='research-images'
      AND s.name=a.storage_key
    WHERE a.user_id=p_target AND s.owner_id IS DISTINCT FROM p_target::text
  ) THEN
    RAISE EXCEPTION 'storage ownership conflict' USING ERRCODE='42501';
  END IF;
  -- Include orphaned objects still owned by this Auth account, even without asset rows.
  RETURN QUERY SELECT s.bucket_id::text,s.name::text,s.owner_id::text
    FROM storage.objects s
    WHERE s.bucket_id IN ('dd-profile-avatars','research-images')
      AND s.owner_id=p_target::text
    ORDER BY s.bucket_id,s.name;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_storage_manifest(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_storage_manifest(uuid) TO service_role;

-- The manifest is computed in the database, never taken from a browser payload.
CREATE OR REPLACE FUNCTION public.dd_deletion_prepare(
  p_target uuid,p_session uuid,p_digest text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_manifest jsonb; v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  IF p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
    OR NOT public.dd_deletion_active_session(p_target,p_session)
    OR public.dd_deletion_guard_role(p_target) THEN RETURN false; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'bucket_id',m.bucket_id,'name',m.name,'owner_id',m.owner_id)
    ORDER BY m.bucket_id,m.name),'[]'::jsonb)
  INTO v_manifest FROM public.dd_deletion_storage_manifest(p_target) m;
  IF jsonb_array_length(v_manifest)>2000 THEN RETURN false; END IF;
  INSERT INTO public.dd_account_deletion_jobs
    (account_id,phase,intent_digest,intent_expires_at,manifest,
     reauthenticated_at,prepared_session_id,updated_at)
  VALUES(p_target,'prepared',p_digest,now()+interval '10 minutes',
    v_manifest,now(),p_session,now())
  ON CONFLICT(account_id) DO UPDATE SET
    intent_digest=EXCLUDED.intent_digest,
    intent_expires_at=EXCLUDED.intent_expires_at,
    manifest=EXCLUDED.manifest,
    reauthenticated_at=EXCLUDED.reauthenticated_at,
    prepared_session_id=EXCLUDED.prepared_session_id,
    updated_at=now()
  WHERE public.dd_account_deletion_jobs.phase='prepared';
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_prepare(uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_prepare(uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_claim(
  p_target uuid,p_session uuid,p_digest text,p_lease uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  IF p_lease IS NULL OR public.dd_deletion_guard_role(p_target)
    OR NOT public.dd_deletion_active_session(p_target,p_session)
  THEN RETURN false; END IF;
  UPDATE public.dd_account_deletion_jobs
    SET phase='approved',intent_digest=NULL,intent_expires_at=NULL,
        lease_token=p_lease,lease_expires_at=now()+interval '15 minutes',
        confirmed_at=now(),updated_at=now()
    WHERE account_id=p_target AND phase='prepared'
      AND intent_digest=p_digest AND intent_expires_at>now()
      AND reauthenticated_at>now()-interval '10 minutes'
      AND prepared_session_id=p_session;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_claim(uuid,uuid,text,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_claim(uuid,uuid,text,uuid) TO service_role;

-- Atomic redaction guarded by the *claimed* and unexpired lease.
CREATE OR REPLACE FUNCTION public.dd_deletion_redact_forum(
  p_target uuid,p_lease uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_threads bigint; v_replies bigint;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  IF public.dd_deletion_guard_role(p_target) OR NOT EXISTS(
    SELECT 1 FROM public.dd_account_deletion_jobs
      WHERE account_id=p_target AND phase='approved'
        AND lease_token=p_lease AND lease_expires_at>now()
  ) THEN RAISE EXCEPTION 'unapproved deletion lease' USING ERRCODE='42501'; END IF;
  -- Only this service-role claim transaction may bypass the write fence to
  -- redact the departing author's text. Ordinary user JWTs cannot set a
  -- privileged cleanup context because the guard verifies the role + lease.
  PERFORM set_config('dd.cleanup_lease',p_lease::text,true);
  UPDATE public.dd_forum_threads
    SET title='Account deleted',body='This post was removed by its author.',
        link_url=NULL,image_url=NULL
    WHERE author_id=p_target;
  GET DIAGNOSTICS v_threads=ROW_COUNT;
  UPDATE public.dd_forum_replies
    SET body='This reply was removed by its author.'
    WHERE author_id=p_target;
  GET DIAGNOSTICS v_replies=ROW_COUNT;
  RETURN jsonb_build_object('threads_redacted',v_threads,'replies_redacted',v_replies);
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_redact_forum(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_redact_forum(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_advance(
  p_target uuid,p_lease uuid,p_before text,p_after text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  IF NOT (
    (p_before='approved' AND p_after='forum_redacted') OR
    (p_before='forum_redacted' AND p_after='storage_cleared') OR
    (p_before='storage_cleared' AND p_after='auth_removed') OR
    (p_before='auth_removed' AND p_after='complete')
  ) THEN RETURN false; END IF;
  UPDATE public.dd_account_deletion_jobs
    SET phase=p_after,updated_at=now(),
      manifest=CASE WHEN p_after='complete' THEN '[]'::jsonb ELSE manifest END,
      completed_at=CASE WHEN p_after='complete' THEN now() ELSE completed_at END,
      lease_token=CASE WHEN p_after='complete' THEN NULL ELSE lease_token END,
      lease_expires_at=CASE WHEN p_after='complete' THEN NULL ELSE lease_expires_at END,
      last_error_code=NULL
    WHERE account_id=p_target AND phase=p_before
      AND lease_token=p_lease AND lease_expires_at>now();
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_advance(uuid,uuid,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_advance(uuid,uuid,text,text) TO service_role;

-- This RPC NEVER creates an approval ticket. A DBA manually inserts one in
-- dd_deletion_private after independently verifying two distinct reviewers and a case.
-- A service_role token CANNOT insert into the private approvals table.
CREATE OR REPLACE FUNCTION public.dd_deletion_operator_reclaim(
  p_target uuid,p_ticket uuid,p_new_lease uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_ticket dd_deletion_private.dd_deletion_recovery_approvals%ROWTYPE;
        v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role'
  THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='42501'; END IF;
  IF p_target IS NULL OR p_ticket IS NULL OR p_new_lease IS NULL
  THEN RETURN false; END IF;
  SELECT * INTO v_ticket FROM dd_deletion_private.dd_deletion_recovery_approvals
    WHERE ticket_id=p_ticket FOR UPDATE;
  IF NOT FOUND OR v_ticket.account_id IS DISTINCT FROM p_target
    OR v_ticket.consumed_at IS NOT NULL OR v_ticket.expires_at<=now()
    OR v_ticket.approved_by=v_ticket.reviewed_by
  THEN RETURN false; END IF;
  -- A job already complete or still leased cannot be taken over.
  UPDATE public.dd_account_deletion_jobs
    SET lease_token=p_new_lease,lease_expires_at=now()+interval '15 minutes',
        updated_at=now()
    WHERE account_id=p_target AND phase=v_ticket.expected_phase
      AND phase IN('approved','forum_redacted','storage_cleared','auth_removed')
      AND (lease_token IS NULL OR lease_expires_at<now())
      AND intent_digest IS NULL AND confirmed_at IS NOT NULL
      AND reauthenticated_at IS NOT NULL;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RETURN false; END IF;
  UPDATE dd_deletion_private.dd_deletion_recovery_approvals
    SET consumed_at=now() WHERE ticket_id=p_ticket AND consumed_at IS NULL;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_operator_reclaim(uuid,uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_operator_reclaim(uuid,uuid,uuid) TO service_role;

COMMIT;
