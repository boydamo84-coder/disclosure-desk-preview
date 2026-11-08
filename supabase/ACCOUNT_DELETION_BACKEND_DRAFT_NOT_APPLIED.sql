-- DISCLOSURE DESK ACCOUNT DELETION — STAGING DESIGN, NOT APPLIED.
-- Reviewed against read-only catalog 2026-11-08. DO NOT RUN ON PRODUCTION.
-- Manual, separately approved schema deployment only after disposable staging drill.
-- Never put this file in a frontend asset/bundle or an automatically applied migrations folder.
BEGIN;

CREATE TABLE IF NOT EXISTS public.dd_account_deletion_jobs (
  account_id uuid PRIMARY KEY, -- intentionally NO FK to auth.users: receipt must survive deletion
  phase text NOT NULL DEFAULT 'prepared'
    CHECK (phase IN ('prepared','approved','forum_redacted','storage_cleared','auth_removed','complete')),
  intent_digest text,
  intent_expires_at timestamptz,
  manifest jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(manifest) = 'array'),
  lease_token uuid,
  lease_expires_at timestamptz,
  reauthenticated_at timestamptz,
  prepared_session_id uuid,
  confirmed_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (intent_digest IS NULL OR intent_digest ~ '^[a-f0-9]{64}$')
);
ALTER TABLE public.dd_account_deletion_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dd_account_deletion_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.dd_account_deletion_jobs TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_active_session(p_target uuid, p_session uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  RETURN EXISTS(
    SELECT 1 FROM auth.sessions s
    WHERE s.user_id=p_target AND s.id=p_session
      AND (s.not_after IS NULL OR s.not_after > now())
  );
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_active_session(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_active_session(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_guard_role(p_target uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  RETURN EXISTS(SELECT 1 FROM public.dd_forum_owner_admins WHERE user_id=p_target)
      OR EXISTS(SELECT 1 FROM public.dd_chat_owner_admins WHERE user_id=p_target)
      OR EXISTS(SELECT 1 FROM public.dd_comment_moderators WHERE user_id=p_target)
      OR EXISTS(SELECT 1 FROM public.dd_forum_sections WHERE creator_id=p_target OR steward_id=p_target);
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_guard_role(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_guard_role(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_storage_manifest(p_target uuid)
RETURNS TABLE(bucket_id text, name text, owner_id text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  -- Disagreeing ownership metadata means the operation must STOP, not delete that object.
  IF EXISTS(
    SELECT 1 FROM public.dd_avatar_profiles a
    JOIN storage.objects s ON s.bucket_id='dd-profile-avatars'
       AND s.name LIKE a.public_key::text || '/%'
    WHERE a.user_id=p_target AND s.owner_id IS DISTINCT FROM p_target::text
  ) OR EXISTS(
    SELECT 1 FROM public.research_assets a
    JOIN storage.objects s ON s.bucket_id='research-images' AND s.name=a.storage_key
    WHERE a.user_id=p_target AND s.owner_id IS DISTINCT FROM p_target::text
  ) THEN
    RAISE EXCEPTION 'storage ownership conflict' USING ERRCODE='42501';
  END IF;
  -- This picks up orphaned files owned by the departing Auth ID, even if
  -- research_assets metadata is missing. Read-only; never includes other owners.
  RETURN QUERY
  SELECT s.bucket_id::text, s.name::text, s.owner_id::text
  FROM storage.objects s
  WHERE s.bucket_id IN ('dd-profile-avatars','research-images')
    AND s.owner_id=p_target::text
  ORDER BY s.bucket_id,s.name;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_storage_manifest(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_storage_manifest(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_redact_forum(p_target uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_threads bigint; v_replies bigint;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  IF public.dd_deletion_guard_role(p_target) THEN
    RAISE EXCEPTION 'protected account' USING ERRCODE='42501';
  END IF;
  -- Do not DELETE the parent thread: that would cascade other people's replies.
  UPDATE public.dd_forum_threads
  SET title='Account deleted',
      body='This post was removed by its author.',
      link_url=NULL, image_url=NULL
  WHERE author_id=p_target;
  GET DIAGNOSTICS v_threads=ROW_COUNT;
  UPDATE public.dd_forum_replies
  SET body='This reply was removed by its author.'
  WHERE author_id=p_target;
  GET DIAGNOSTICS v_replies=ROW_COUNT;
  RETURN jsonb_build_object('threads_redacted',v_threads,'replies_redacted',v_replies);
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_redact_forum(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_redact_forum(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_prepare(
  p_target uuid,p_session uuid,p_digest text,p_manifest jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  IF NOT public.dd_deletion_active_session(p_target,p_session) OR
    public.dd_deletion_guard_role(p_target) OR
    p_digest !~ '^[a-f0-9]{64}
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  IF public.dd_deletion_guard_role(p_target) THEN
    RETURN false;
  END IF;
  UPDATE public.dd_account_deletion_jobs
  SET phase='approved', intent_digest=NULL, intent_expires_at=NULL,
      lease_token=p_lease, lease_expires_at=now()+interval '15 minutes',
      confirmed_at=now(), updated_at=now()
  WHERE account_id=p_target AND phase='prepared'
    AND intent_digest=p_digest AND intent_expires_at>now()
    AND reauthenticated_at > now()-interval '10 minutes'\n    AND prepared_session_id=p_session\n    AND public.dd_deletion_active_session(p_target,p_session);
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_claim(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_claim(uuid,uuid,text,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_advance(
  p_target uuid,p_lease uuid,p_before text,p_after text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  IF NOT (
    (p_before='approved' AND p_after='forum_redacted') OR
    (p_before='forum_redacted' AND p_after='storage_cleared') OR
    (p_before='storage_cleared' AND p_after='auth_removed') OR
    (p_before='auth_removed' AND p_after='complete')
  ) THEN
    RAISE EXCEPTION 'invalid stage transition';
  END IF;
  UPDATE public.dd_account_deletion_jobs
    SET phase=p_after, updated_at=now(),
      manifest=CASE WHEN p_after='complete' THEN '[]'::jsonb ELSE manifest END,
      completed_at=CASE WHEN p_after='complete' THEN now() ELSE completed_at END,
      lease_token=CASE WHEN p_after='complete' THEN NULL ELSE lease_token END,
      lease_expires_at=CASE WHEN p_after='complete' THEN NULL ELSE lease_expires_at END
  WHERE account_id=p_target AND phase=p_before
    AND lease_token=p_lease AND lease_expires_at>now();
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_advance(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_advance(uuid,uuid,text,text) TO service_role;

COMMIT;
 OR
    jsonb_typeof(p_manifest) IS DISTINCT FROM 'array' OR
    jsonb_array_length(p_manifest)>2000 THEN RETURN false;
  END IF;
  -- Re-preparation is allowed only in PREPARED state, never mid-cleanup.
  INSERT INTO public.dd_account_deletion_jobs
  (account_id,phase,intent_digest,intent_expires_at,manifest,
   reauthenticated_at,prepared_session_id,updated_at)
  VALUES (p_target,'prepared',p_digest,now()+interval '10 minutes',p_manifest,
    now(),p_session,now())
  ON CONFLICT(account_id) DO UPDATE
    SET intent_digest=EXCLUDED.intent_digest,
      intent_expires_at=EXCLUDED.intent_expires_at,
      manifest=EXCLUDED.manifest,
      reauthenticated_at=EXCLUDED.reauthenticated_at,
      prepared_session_id=EXCLUDED.prepared_session_id,
      updated_at=now()
    WHERE public.dd_account_deletion_jobs.phase='prepared';
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $;
REVOKE ALL ON FUNCTION public.dd_deletion_prepare(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_prepare(uuid,uuid,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_claim(p_target uuid,p_session uuid,p_digest text,p_lease uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  IF public.dd_deletion_guard_role(p_target) THEN
    RETURN false;
  END IF;
  UPDATE public.dd_account_deletion_jobs
  SET phase='approved', intent_digest=NULL, intent_expires_at=NULL,
      lease_token=p_lease, lease_expires_at=now()+interval '15 minutes',
      confirmed_at=now(), updated_at=now()
  WHERE account_id=p_target AND phase='prepared'
    AND intent_digest=p_digest AND intent_expires_at>now()
    AND reauthenticated_at > now()-interval '10 minutes';
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_claim(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_claim(uuid,uuid,text,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.dd_deletion_advance(
  p_target uuid,p_lease uuid,p_before text,p_after text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not permitted' USING ERRCODE='42501';
  END IF;
  IF NOT (
    (p_before='approved' AND p_after='forum_redacted') OR
    (p_before='forum_redacted' AND p_after='storage_cleared') OR
    (p_before='storage_cleared' AND p_after='auth_removed') OR
    (p_before='auth_removed' AND p_after='complete')
  ) THEN
    RAISE EXCEPTION 'invalid stage transition';
  END IF;
  UPDATE public.dd_account_deletion_jobs
    SET phase=p_after, updated_at=now(),
      manifest=CASE WHEN p_after='complete' THEN '[]'::jsonb ELSE manifest END,
      completed_at=CASE WHEN p_after='complete' THEN now() ELSE completed_at END,
      lease_token=CASE WHEN p_after='complete' THEN NULL ELSE lease_token END,
      lease_expires_at=CASE WHEN p_after='complete' THEN NULL ELSE lease_expires_at END
  WHERE account_id=p_target AND phase=p_before
    AND lease_token=p_lease AND lease_expires_at>now();
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.dd_deletion_advance(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dd_deletion_advance(uuid,uuid,text,text) TO service_role;

COMMIT;
