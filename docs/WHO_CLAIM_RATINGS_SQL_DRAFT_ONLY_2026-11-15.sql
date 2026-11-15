-- DISCLOSURE DESK WHO'S WHO — RESEARCH DRAFT ONLY.
-- NOT A MIGRATION. DO NOT EXECUTE ON PRODUCTION BEFORE OWNER APPROVAL AND ISOLATED RLS TESTS.
-- Community evidence ratings apply to individually approved public CLAIMS, never person reputation.
-- M25: write RPC now validates JWT session_id against real auth.sessions row.
-- If ever approved, deploy atomically: no time gap with privileged default PUBLIC EXECUTE.
BEGIN;

CREATE TABLE IF NOT EXISTS public.dd_who_reviewable_claims (
 claim_id TEXT PRIMARY KEY CHECK (claim_id ~ '^[a-z0-9][a-z0-9-]{6,85}$'),
 person_id TEXT NOT NULL CHECK (person_id ~ '^[a-z0-9-]{2,80}$'),
 primary_source_url TEXT NOT NULL CHECK (primary_source_url ~ '^https://'),
 editorial_version TEXT NOT NULL,
 -- Metadata gate only; a name/date in a row is not independent human verification.
 original_record_reviewed_at TIMESTAMPTZ,
 source_reviewer_name TEXT CHECK (source_reviewer_name IS NULL OR length(btrim(source_reviewer_name)) >= 5),
 second_editor_approved_at TIMESTAMPTZ,
 second_editor_name TEXT CHECK (second_editor_name IS NULL OR length(btrim(second_editor_name)) >= 5),
 enabled BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT dd_who_claim_enabled_requires_two_reviewers CHECK (
  NOT enabled OR (
   original_record_reviewed_at IS NOT NULL
   AND second_editor_approved_at IS NOT NULL
   AND source_reviewer_name IS NOT NULL
   AND second_editor_name IS NOT NULL
   AND lower(btrim(source_reviewer_name)) <> lower(btrim(second_editor_name))
  )
 )
);

CREATE TABLE IF NOT EXISTS public.dd_who_claim_ratings (
 claim_id TEXT NOT NULL REFERENCES public.dd_who_reviewable_claims(claim_id) ON DELETE CASCADE,
 voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY (claim_id,voter_id)
);
CREATE INDEX IF NOT EXISTS dd_who_claim_ratings_recent_by_voter
 ON public.dd_who_claim_ratings(voter_id,created_at DESC);

ALTER TABLE public.dd_who_reviewable_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dd_who_claim_ratings ENABLE ROW LEVEL SECURITY;

-- No direct SQL table access to guests/members. The reviewed RPCs below are
-- the only public entry points; do not add permissive table policies.
REVOKE ALL ON public.dd_who_reviewable_claims FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.dd_who_claim_ratings FROM PUBLIC, anon, authenticated;

-- Privileged workers are private, not RPCs in the Data API exposed public schema.
-- This schema MUST be absent from Supabase's actual Data API 'Exposed schemas'.
CREATE SCHEMA IF NOT EXISTS dd_who_private;
REVOKE ALL ON SCHEMA dd_who_private FROM PUBLIC;
GRANT USAGE ON SCHEMA dd_who_private TO anon, authenticated;

CREATE OR REPLACE FUNCTION dd_who_private.dd_who_claim_rating_summary_impl(p_claim_ids TEXT[])
RETURNS TABLE(claim_id TEXT,rating_count BIGINT,community_mean NUMERIC,my_rating SMALLINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
BEGIN
 IF p_claim_ids IS NULL OR cardinality(p_claim_ids) < 1 OR cardinality(p_claim_ids) > 20
    OR EXISTS (
     SELECT 1 FROM unnest(p_claim_ids) AS candidate(id)
     WHERE candidate.id IS NULL OR candidate.id !~ '^[a-z0-9][a-z0-9-]{6,85}$'
    ) THEN
  RAISE EXCEPTION 'Invalid claim ID list' USING ERRCODE = '22023';
 END IF;
 RETURN QUERY
 SELECT c.claim_id,
        a.rating_count,
        CASE WHEN a.rating_count >= 5 THEN round(a.mean_score,1) ELSE NULL::NUMERIC END,
        mine.score
 FROM public.dd_who_reviewable_claims c
 CROSS JOIN LATERAL (
  SELECT count(*)::BIGINT AS rating_count,avg(v.score)::NUMERIC AS mean_score
  FROM public.dd_who_claim_ratings v
  WHERE v.claim_id = c.claim_id
 ) a
 LEFT JOIN public.dd_who_claim_ratings mine
  ON mine.claim_id=c.claim_id AND mine.voter_id=(SELECT auth.uid())
 WHERE c.enabled AND c.claim_id=ANY(p_claim_ids);
END
$fn$;

CREATE OR REPLACE FUNCTION dd_who_private.dd_who_claim_rating_set_impl(p_claim_id TEXT,p_rating SMALLINT)
RETURNS TABLE(claim_id TEXT,rating_count BIGINT,community_mean NUMERIC,my_rating SMALLINT)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE
 v_uid UUID := (SELECT auth.uid());
 v_session_text TEXT := (SELECT auth.jwt()->>'session_id');
 v_existing public.dd_who_claim_ratings%ROWTYPE;
BEGIN
 IF v_uid IS NULL OR coalesce((auth.jwt()->>'is_anonymous')::BOOLEAN,false) THEN
  RAISE EXCEPTION 'Sign-in required' USING ERRCODE = '28000';
 END IF;
 -- An otherwise valid signed JWT can outlive logout. All voting mutations
 -- require a matching GoTrue Auth session row; missing/malformed => fail closed.
 IF v_session_text IS NULL
    OR v_session_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR NOT EXISTS (
      SELECT 1 FROM auth.sessions AS sess
      WHERE sess.id=v_session_text::UUID AND sess.user_id=v_uid
    ) THEN
   RAISE EXCEPTION 'Active sign-in session required' USING ERRCODE = '28000';
 END IF;
 IF p_claim_id IS NULL OR p_claim_id !~ '^[a-z0-9][a-z0-9-]{6,85}$'
   OR p_rating IS NULL OR p_rating < 0 OR p_rating > 100 THEN
  RAISE EXCEPTION 'Invalid claim or evidence score' USING ERRCODE = '22023';
 END IF;
 -- Prevent races for same voter (including votes on different claims).
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::TEXT,20261115));
 IF NOT EXISTS (
  SELECT 1 FROM public.dd_who_reviewable_claims c
  WHERE c.claim_id=p_claim_id AND c.enabled
 ) THEN
  RAISE EXCEPTION 'This claim is not open for rating' USING ERRCODE = '22023';
 END IF;
 SELECT v.* INTO v_existing FROM public.dd_who_claim_ratings v
 WHERE v.claim_id=p_claim_id AND v.voter_id=v_uid;
 IF FOUND AND v_existing.updated_at > pg_catalog.clock_timestamp()-INTERVAL '3 minutes' THEN
  RAISE EXCEPTION 'Please wait before changing this rating' USING ERRCODE = '22023';
 END IF;
 IF NOT FOUND AND (
   SELECT count(*) FROM public.dd_who_claim_ratings v
   WHERE v.voter_id=v_uid AND v.created_at>pg_catalog.clock_timestamp()-INTERVAL '24 hours'
  ) >= 30 THEN
  RAISE EXCEPTION 'Daily new-rating limit reached' USING ERRCODE = '22023';
 END IF;
 INSERT INTO public.dd_who_claim_ratings (claim_id,voter_id,score)
 VALUES (p_claim_id,v_uid,p_rating)
 ON CONFLICT ON CONSTRAINT dd_who_claim_ratings_pkey
 DO UPDATE SET score=EXCLUDED.score, updated_at=pg_catalog.clock_timestamp();
 RETURN QUERY SELECT s.claim_id,s.rating_count,s.community_mean,s.my_rating
 FROM dd_who_private.dd_who_claim_rating_summary_impl(ARRAY[p_claim_id]) s;
END
$fn$;

-- Only unprivileged public SECURiTY INVOKER wrappers are exposed to the Data API.
-- Narrow permission to invoke PRIVATE worker functions; protected table grants
-- remain revoked, and all identity/claim checks happen inside each worker.
REVOKE ALL ON FUNCTION dd_who_private.dd_who_claim_rating_summary_impl(TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION dd_who_private.dd_who_claim_rating_set_impl(TEXT,SMALLINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dd_who_private.dd_who_claim_rating_summary_impl(TEXT[]) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION dd_who_private.dd_who_claim_rating_set_impl(TEXT,SMALLINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.dd_who_claim_rating_summary(p_claim_ids TEXT[])
RETURNS TABLE(claim_id TEXT,rating_count BIGINT,community_mean NUMERIC,my_rating SMALLINT)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = ''
AS $wrap$
 SELECT * FROM dd_who_private.dd_who_claim_rating_summary_impl(p_claim_ids);
$wrap$;

CREATE OR REPLACE FUNCTION public.dd_who_claim_rating_set(p_claim_id TEXT,p_rating SMALLINT)
RETURNS TABLE(claim_id TEXT,rating_count BIGINT,community_mean NUMERIC,my_rating SMALLINT)
LANGUAGE SQL VOLATILE SECURITY INVOKER SET search_path = ''
AS $wrap$
 SELECT * FROM dd_who_private.dd_who_claim_rating_set_impl(p_claim_id,p_rating);
$wrap$;

-- PostgreSQL defaults new function EXECUTE to PUBLIC: clear default and
-- grant only precisely scoped privileges after security review.
REVOKE ALL ON FUNCTION public.dd_who_claim_rating_summary(TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dd_who_claim_rating_set(TEXT,SMALLINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dd_who_claim_rating_summary(TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dd_who_claim_rating_set(TEXT,SMALLINT) TO authenticated;

COMMIT;

-- NO CLAIMS SEEDED HERE. The 3 initial source-linked entries are still
-- unreviewed and must NOT be enabled without independent editorial signoff.
-- TODO: in a separate, owner-approved migration, add approved claim IDs.
-- TODO: run role/claim RLS+RPC tests and Supabase advisors before releasing.

-- M21: Two distinct named editorial reviewers and source dates are metadata prerequisites only.
-- Do not seed or enable real claims until human approvals and isolated DB/JWT/RLS tests succeed.
-- The eventual approved migration should run DDL and grants in one transaction.
