# Disclosure Desk — live-project transaction-only schema compatibility rehearsal
**Date:** 2026-11-05 UTC  
**Target:** connected Supabase **Disclosure Desk** project `omqxizswzcwgzqaczlhe`  
**Scope:** User explicitly allowed testing against their existing test-heavy live database. **No live schema was installed, no user account or record modified, and no website deploy occurred.**

## Privacy-conscious baseline (read-only aggregate counts only)
| Item | Count |
| --- | ---: |
| Auth accounts | 3 |
| Investigation boards | 3 |
| Research documents | 7 |
| Public username rows | 1 |
| Existing comment-moderator memberships | 1 |
| Public witness reports | 0 |
| Storage buckets | 1 |
| Storage objects | 1 |
| Existing public tables with RLS | 22/22 |

The owner regards this data as dispensable test material, but **7 documents and 1 Storage object do exist**, so do not assume an empty database or blindly discard those items. No account UUID, email, name, document content, or Storage path was read or put in this report.

The Supabase organization containing this project reports **Free** plan. Official docs say automatic daily scheduled backups are offered for Pro, Team and Enterprise; Free projects should retain manual off-site backups: <https://supabase.com/docs/guides/platform/backups>. Plan status is **not evidence** of a usable dump. No backup or restore rehearsal has yet been completed.

## Real live-project, rollback-only SQL checks
Read the actual, unchanged GitHub candidate scripts on canonical development branch `feature/sources-archives-next-batch-nov03`:

1. `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql` (~17.7 KB)
2. `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` (~35.9 KB)

Before testing: counted **zero** pre-existing `dd_chat_*` tables, **zero** `dd_forum_*` tables, **zero** Chat/Discussions RPCs, and no `dd_public_names.chat_contact_opt_in` column.

Each candidate ran separately through the connected project's SQL execution interface, with only its outer `BEGIN;` and `COMMIT;` replaced by a forced `BEGIN; ... ROLLBACK;`. The transaction set `lock_timeout='1000ms'` and `statement_timeout='25000ms'`. A transaction-local assertion checked all expected new tables had **RLS enabled**; the query returned counts from within the still-open transaction before the explicit `ROLLBACK`.

| Candidate | Transaction-local tables | RLS | Outcome |
| --- | ---: | --- | --- |
| Private Chat | **5 of 5** | 5/5 | **PASS, rolled back** |
| Discussions / Forum | **8 of 8** | 8/8 | **PASS, rolled back** |

An initial, harmless `BEGIN; SELECT; ROLLBACK;` verified multi-statement transaction support. No script performed drop/truncate of current tables; scripts were inspected for risky root operations before execution. Candidate functions were installed only transiently in the SQL rehearsal, **not callable by the public afterwards**.

### Independent after-rollback check
A subsequent standalone read-only SQL query confirmed:
- `dd_chat_*` tables: **0**
- `dd_forum_*` tables: **0**
- `dd_chat_*` / `dd_discussions_*` routines: **0**
- `dd_public_names.chat_contact_opt_in` column: **absent**
- Auth accounts **3**, boards **3**, research documents **7**, moderator memberships **1**, Storage objects **1** — unchanged

Thus **compatibility with the current live database is verified**, not just with isolated PostgreSQL, and **no candidate migration remains installed**. Previous distinct signed-JWT HTTP replica tests were **22/22 Chat** and **33/33 Discussions**, but did not use real Supabase Auth sessions. These results cannot be substituted for those real-session tests.

## Before enabling public Chat or Discussions
1. Confirm a **usable off-site database dump** and test restoration in a disposable environment, including documented Auth identity restoration limitations. An ordinary Supabase CLI dump excludes managed Auth and Storage schemas; do not claim a single SQL file is a complete disaster recovery plan. [CLI dump reference](https://supabase.com/docs/reference/cli/supabase-db-dump).
2. Inventory/backup the actual Storage object(s) separately: database backups include Storage metadata but not uploaded object bytes.
3. Verify Netlify's real publish directory, last-good deploy, redirects, environment settings and the existing `/.netlify/functions/interests` endpoint. The 56-file allowlist/46-link CI is not proof of Netlify configuration.
4. Only after an approved recovery point and owner-approved integration plan, apply **reviewed migrations** (do not simply run the rehearsal query with `COMMIT`), verify real Supabase A/B/third-account RLS and owner role, test actual consent, rate limits, block, steward/moderation and switch accounts. Owner admin for forum/chat is distinct from the already-existing comment moderator membership.
5. Test the combined site on the physical Samsung/desktop before enabling any social flags. Preserve `privateChat:false`, `discussions:false`, `researchPublishing:false` until explicit release acceptance.
6. Separate Supabase project is **optional** for isolated Auth testing. A second account/project is **not a backup by itself**, and may have plan, email, project-count, or cost conditions. Don't create a billable branch or project without specific approval.

## Explicit release boundaries
- No GitHub production branch or Netlify deploy.
- No live migrations, permanent schema alterations, accounts, stored file or content changes.
- No secret, service-role key, Auth JWT, or real customer record exported.
- No actual database backup created or verified.
- No claims of live feature activation or physical device acceptance.

**Next concrete task:** produce a recoverable encrypted database snapshot/off-site backup and separate Storage object copy, then verify restore and the Netlify publishing configuration before moving from rollback-only rehearsal to any persistent migration.
