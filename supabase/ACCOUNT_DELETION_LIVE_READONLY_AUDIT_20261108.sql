-- Disclosure Desk LIVE database, account-deletion preparation
-- READ-ONLY ACCOUNT-ISOLATION AUDIT (no deletion, no DDL, no personal content).
-- Intended for a privileged operator in the Supabase SQL editor or connector.
-- Does NOT replace an end-to-end test using real disposable credentials.
-- Deliberately contains no hard-coded user IDs, emails, password or secrets.

BEGIN READ ONLY;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY created_at,id) AS slot
  FROM auth.users
)
SELECT
  'test-' || LPAD(slot::text,2,'0') AS alias,
  EXISTS(SELECT 1 FROM public.dd_forum_owner_admins WHERE user_id=n.id) AS is_forum_owner,
  EXISTS(SELECT 1 FROM public.dd_chat_owner_admins WHERE user_id=n.id) AS is_chat_owner,
  EXISTS(SELECT 1 FROM public.dd_comment_moderators WHERE user_id=n.id) AS is_moderator,
  (SELECT COUNT(*) FROM public.research_documents WHERE user_id=n.id) AS own_research_docs,
  (SELECT COUNT(*) FROM public.investigation_boards WHERE user_id=n.id) AS own_boards,
  (SELECT COUNT(*) FROM public.dd_forum_threads WHERE author_id=n.id) AS own_forum_threads,
  (SELECT COUNT(*) FROM public.dd_forum_replies WHERE author_id=n.id) AS own_forum_replies,
  (SELECT COUNT(*) FROM public.dd_chat_messages WHERE author_id=n.id) AS own_chat_messages,
  (SELECT COUNT(*) FROM storage.objects WHERE owner_id=n.id::text
     AND bucket_id IN('dd-profile-avatars','research-images')) AS own_private_objects
FROM numbered n ORDER BY slot;

SELECT
  to_regclass('public.dd_account_deletion_jobs') IS NOT NULL AS deletion_jobs_installed,
  to_regclass('dd_deletion_private.dd_deletion_recovery_approvals') IS NOT NULL AS recovery_tickets_installed,
  EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='dd_deletion_write_fence_active') AS write_fence_installed,
  EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='dd_deletion_claim') AS destructive_claim_installed;

ROLLBACK;

-- Separate manually repeated read-only tests, one slot per transaction:
-- BEGIN READ ONLY;
-- SELECT set_config('request.jwt.claim.sub',
--   (SELECT id::text FROM auth.users ORDER BY created_at,id OFFSET 0 LIMIT 1), true);
-- SET LOCAL ROLE authenticated;
-- SELECT (SELECT COUNT(*) FROM public.research_documents) AS visible_research,
--        (SELECT COUNT(*) FROM public.investigation_boards) AS visible_boards,
--        (SELECT COUNT(*) FROM storage.objects
--           WHERE bucket_id='research-images') AS visible_research_images;
-- ROLLBACK;
-- Repeat with OFFSET 1, 2, 3. Never use real test credentials here.
