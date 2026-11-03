# Disclosure Desk — LIVE & Community backend test record (3 November 2026)

Status: **UNPUBLISHED GitHub branch only.** No witness/public-name migration or witness Edge Function has been installed. Do not confuse these synthetic tests with real browser-JWT acceptance.

## Correct targets
- Website repo: `boydamo84-coder/disclosure-desk-preview`
- Branch: `feature/research-studio-bds-production-based`, draft PR #2 into `production` (not merged)
- Supabase project inspected/tested: **Disclosure Desk** (`omqxizswzcwgzqaczlhe`)
- No Cinema Supabase project or original W.NE repository changes
- All GitHub commits include `[skip netlify]`; no Netlify deployment was intentionally triggered

## Database tests run using rollback-only transactions
The staged SQL scripts were submitted with `BEGIN`, local timeouts and **`ROLLBACK`** to the existing Disclosure Desk Postgres database; every test checked afterward that no witness tables or guard functions remained.

1. **Schema install and rollback:** staged `WITNESS_VOTING_COMMUNITY_REVIEW.sql` accepted. After rollback: zero witness tables.
2. **Simulated SQL role denial:** as `anon` and `authenticated`, direct insert into coordinate-bearing witness table was denied. This used `SET LOCAL ROLE`, not actual HTTP JWTs.
3. **Synthetic service-role insert:** a fake witness report with a fabricated UUID was admitted as `service_role`; no real auth.users accounts were created.
4. **Votes:** one synthetic registered identity liked, switched to dislike, then removed its vote; database summary totals reflected the changes.
5. **Five distinct flags:** five fabricated authenticated identities inserted separate flags. The report was hidden by trigger and disappeared from the RLS-protected public projection.
6. **Three-in-24h:** the fourth report by the same synthetic author was rejected.
7. **Duplicate report guard:** a second identical synthetic report with different case/whitespace was rejected. The staged Edge Function now maps this to HTTP 409 and preserves private drafts on failure.
8. **Public username migration:** `PUBLIC_USERNAMES_REVIEW.sql` accepted in a rollback-only transaction; owner-private table remains unchanged and the `is_public` column did not persist.

For items 3–7, only *new, transaction-local* test tables/records were used. Foreign keys referencing auth.users were dropped **inside the uncommitted transaction** so fabricated IDs could be used without creating or editing actual accounts. All dropped constraints, tables, functions, test reports and flags were rolled back. The only preexisting table affected transiently by the staged migration was the trigger definition on `dd_case_comments`; it too was rolled back.

## What is NOT verified
- Real email-verified Supabase Auth JWTs, HTTP API access and Edge Function invocation or storage of publicly approved reports
- Five separate real simultaneous connections/flaggers; the SQL simulation was sequential
- Geocoding of ambiguous town names (especially Northern Ireland), malicious street/house data and consent with real network requests
- RLS owner isolation for username editing via real credentials; public alias visibility for approved comments and LIVE chat
- Moderator restore, removal/appeal process and abuse response
- Samsung browser map popup, witness filter, duplicate retry button and cross-account behaviour
- W.NE save-before-navigation/backups/import/export and original LIVE hearing official-source pipeline

## Subsequent acceptance
Run these against an explicitly designated safe test environment or carefully isolated disposable accounts after the schema and function are approved, and verify that no precise witness locations/author IDs appear publicly. Check official calendar and time zones before any LIVE event can be published. Do not enable production community posting or merge PR #2 until accepted. Prefer **one** deliberate Netlify staging preview after backend/CI checks; preserve production site and beta credits.

## Existing security advisor warnings
The read-only security advisor identified prior `SECURITY DEFINER` execute grants and leaked-password-protection settings in the existing project. They were not changed in this batch. Triage them separately; see the Supabase dashboard security advisors before launch.

## Comment security hardening QA (continued 3 November 2026)

Read-only inspection of the **existing** `dd_case_comments` and `dd_case_comment_flags` RLS policies/trigger definitions found that anonymous Supabase sign-ins inherit the `authenticated` role but were not specifically rejected, and that a comment author could flag their own approved comment. The existing 5-in-10-minute comment rate and 12-per-hour flag rate were subject to concurrent-request races. The staged `supabase/COMMENT_SECURITY_HARDENING_REVIEW.sql` adds explicit `is_anonymous=false` RLS checks and trigger guards, self-flag rejection in both layers, per-author/per-flagger advisory locks, and removes publicly executable privileges from the two internal trigger helpers. No live policies/functions have been changed. Run rollback-only SQL validation and real-session HTTP/5-account acceptance before enabling. This is not the separate five-flag auto-hide rule for witness reports.

## Registered owner's moderator role — confirmed

The existing email-confirmed Disclosure Desk site-owner account was added to `public.dd_comment_moderators` at the owner's explicit request. No new Supabase Auth account was created, and no other private project was accessed. An authenticated-role SQL simulation confirmed `dd_is_comment_moderator()` is true for the owner and `dd_case_comment_moderation_queue()` is accessible; an unrelated simulated identity was denied. This is a **persistent allowlist change**, unlike the rollback-only synthetic tests. It does not give global database administration or direct access to private research files.

A subsequent temporary synthetic-account transaction also confirmed existing comment moderation correctly handles: no self-flags, no duplicate flags, non-moderator moderation denial, approved/hidden/reapproved visibility rules, hidden author visibility, moderator queue access and restoration. All temporary test accounts, flags, comments, and FK changes rolled back, leaving the owner's new allowlist entry intact.

A UI copy patch also provides clearer errors for duplicate comments, rate limits, self-flags and sign-in requirements. The code remains on the unpublished feature branch and needs the consolidated beta acceptance check.
