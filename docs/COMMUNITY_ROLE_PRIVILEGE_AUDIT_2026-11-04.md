# Disclosure Desk — live database privilege inventory and proposed safe hardening

**Date:** 4 November 2026. **Status: LIVE READ-ONLY INSPECTION + REVIEW CANDIDATE; NOT APPLIED TO LIVE DATABASE.**

## Why this is in the website roadmap
The next batched release must verify registered-user, guest, moderator and owner permissions before publication. We inspected metadata for the **Disclosure Desk** Supabase project (`omqxizswzcwgzqaczlhe`) using read-only catalog queries. We did **not** inspect user-generated content, private records, Auth emails or passwords, or issue writes.

## Confirmed findings
- All 22 presently inspected `public` base tables have RLS enabled. This is **not**, by itself, a complete authorisation audit.
- Ten tables currently grant `TRUNCATE` and `TRIGGER` to at least one normal client role (`anon` or `authenticated`): `dd_case_comment_flags`, `dd_case_comments`, `dd_email_backup_limit`, `dd_media_votes`, `dd_public_names`, `investigation_boards`, `research_assets`, `research_documents`, `research_reference_backups`, `video_progress`.
- Four of them (`dd_case_comment_flags`, `dd_case_comments`, `dd_email_backup_limit`, `dd_media_votes`) grant these rights to **both** roles; the other six grant them to `authenticated`. Direct ACL inspection found separate direct grants to `postgres` and `service_role` and **no PUBLIC grant on the ten inspected tables** for these two operations.
- PostgreSQL explicitly states `TRUNCATE` is not subject to row-level security. The ordinary Supabase Data API does **not** provide an arbitrary SQL/TRUNCATE endpoint, so **this catalog finding alone does NOT demonstrate that a website visitor can clear any table**. It is nonetheless unnecessary privilege and weakens defence-in-depth if another SQL-capable pathway were exposed.
- Owner report deletion uses authenticated `SELECT` + `DELETE` on `dd_witness_reports`, with its RLS `author_id = auth.uid()` and an anonymous-account exclusion; the browser also scopes the request to the current owner and verifies one affected ID. **Only code/policy presence is verified, not a real HTTP delete.**
- Comment editing/deletion and three Research document trash/restore/purge RPCs exist, permit `authenticated` but not `anon`, and their inspected functions reference `auth.uid()`, owner IDs and anonymous-account checks. **This is not complete security-definer function testing.**
- Public username case-normalisation has a unique index `dd_public_names_unique_key` on `name_key`; two-account real-world duplicate UX still needs testing.

## Safe proposed change (not deployed)

The separately staged `supabase/COMMUNITY_EXTRA_PRIVILEGES_REVIEW.sql` explicitly revokes **only `TRUNCATE` and `TRIGGER`** on those ten named tables from `anon` and `authenticated` within a short, lock-bounded **BEGIN / ROLLBACK** rehearsal. It checks for surviving inherited privileges and verifies the witness `SELECT`/`DELETE` rights remain. It does not create or delete data, disable RLS, change app tables, revoke normal browser CRUD, or modify `service_role` grants.

**Do not execute the rehearsal on the live project.** It can take transient locks even when rolled back. First validate in an isolated disposable copy, inspect dependencies and Supabase security advisors, create a reviewed deployment migration only after owner authorisation, and test real Supabase JWTs for guest/member/owner boundaries. The staged GitHub test performs **static source-contract checks only**, never a database execution.

## Release QA still needed
1. Registered and unrelated-user real-token tests for own report deletion, comment edit/delete and Research trash/restore/purge, using disposable records and with manual owner approval.
2. Validate distinct username rejection, guest-only reading, vote/flag counts, and moderator reapproval via the browser as specified in `MASTER_HANDOVER.md`.
3. After an approved permission hardening migration, rerun read-only `has_table_privilege` and RLS/grants queries and the full website regression suite. Do not claim privileges are revoked while code is only staged.
4. Test current 11-tab website on Samsung and desktop; keep the approved future Discussions/Chat feature flags disabled until their backend and abuse protections pass.

## References
- [PostgreSQL 17 row security: operations such as TRUNCATE are not protected by RLS](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
- [PostgreSQL REVOKE and inherited role grants](https://www.postgresql.org/docs/current/sql-revoke.html).
- [Supabase: Data API grants plus RLS](https://supabase.com/docs/guides/api/securing-your-api).

## Release boundary
Review-only sources in `boydamo84-coder/disclosure-desk-preview` branch `feature/sources-archives-next-batch-nov03`. No database change, public deployment, Netlify build, Android release, financial project, other Supabase project, or original W.NE change.
