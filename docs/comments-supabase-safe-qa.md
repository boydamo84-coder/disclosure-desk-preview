# Disclosure Desk comments — controlled Supabase test checklist

**Not deployed.** The SQL in `supabase/migrations/20261031_case_comments_foundation.sql` is a proposed additive migration. It has NOT been executed against Supabase.

## Before running any SQL
1. Export a database backup and save the existing Investigation Boards data.
2. Prefer a **separate Supabase test project** with two disposable verified accounts. Avoid production until all checks pass.
3. Apply the migration via SQL editor **only in the test project**. The current DEV front-end still points to the established Supabase project; do not use it to post against production until configuration can target the test project.
4. Set a moderator allowlist entry via a trusted SQL editor using the chosen test moderator's auth.users ID; don't grant users the ability to update this table.

## Test scenarios (two accounts A/B)
- A posts a case comment: visible immediately to B; assigned to A and the correct case ID.
- A posts a video comment and a news comment: each appears in the correct thread only.
- A sees only A's posts under My Comments; B sees only B's.
- B flags A's approved comment once; repeat flag should fail (unique reporter/comment).
- B cannot call moderator queue or moderation RPC. The authorised moderator can review, hide and restore.
- A hidden comment is no longer public; a saved Board reference must never preserve its text.
- More than five posts in ten minutes or forty in 24 hours should fail; a repeated identical comment should fail.
- Tampered author_id, created_at and flag created_at cannot bypass auth or limits.
- Replies must point to approved comments in the same thread.
- Test fresh signup, logout/login, Android WebView, and network failure handling.

## Launch blockers / unfinished
- No real-time hearing chat subscription or timestamped replay yet.
- Flagging currently **queues reports but does not automatically hide** alleged unsafe content. Immediate concealment needs a carefully designed server-side safety process.
- Moderation remains necessary for flagged comments, appeals, removals and legal/privacy requests.
- Cross-device Board sync and thread navigation must be verified on real accounts.
- Add a test-only environment configuration before doing live two-account database tests; do not point DEV APK at production for destructive QA.
