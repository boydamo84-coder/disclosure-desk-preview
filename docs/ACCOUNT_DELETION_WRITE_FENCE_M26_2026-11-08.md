# Disclosure Desk — Milestone 26 write-fence verification
_8 November 2026 · Development branch only · Not deployed_

## Verified achievement
Built `supabase/ACCOUNT_DELETION_WRITE_FENCE_DRAFT_NOT_APPLIED.sql` as a **non-auto-applied**, PostgreSQL 17-compatible draft. It adds a row-locking, role-checked write-eligibility function, a generic `BEFORE INSERT OR UPDATE` owner trigger across **33 catalog-audited user-related public tables**, **33 restrictive authenticated DELETE policies**, and **3 restrictive Storage policies** covering INSERT/UPDATE/DELETE in `dd-profile-avatars` and `research-images`. Existing read/download policies and unrelated Storage buckets are intentionally not changed.

The draft `dd_deletion_write_allowed(p_user)` queries the deletion job row with `FOR SHARE` to serialize owner writes against a deletion-state transition; this should block writes from earlier valid JWTs after the deletion job is claimed. A narrow exception permits a **service-role caller with an exact unexpired lease** to perform the necessary forum redaction. The existing *unapplied* `dd_deletion_redact_forum` RPC draft was updated to set that lease within its own server transaction. Ordinary authenticated clients cannot become `service_role` by supplying this lease.

**Critical boundary:** This is **not yet a complete live account deletion freeze**. Security-definer *DELETE* RPCs bypass ordinary authenticated DELETE RLS; service-role Storage calls bypass Storage RLS; custom Edge writers and Auth cascade effects require independent acceptance. Therefore `dd_deletion_write_fence_active` remains **intentionally absent**, the separate staging executor **continues failing closed** before confirming a deletion, and its hard-denial of the existing live Supabase project remains untouched. Do not create an always-true stub for the missing activation RPC.

## Verification performed in disposable CI

- `scripts/test_account_deletion_write_fence_20261108.cjs`: **23 synthetic contract groups passed** in the existing no-deploy verification workflow. Inspected the exact audited trigger arguments, 33 table DELETE policies, three Storage policies, service-only lease, cross-account preservation, older user session denial and missing deployment-activation RPC.
- `scripts/generate_account_deletion_pg_fixture_20261108.cjs` builds **fictional A/B users** and minimal public/Storage tables in an isolated local CI Postgres 17 service; no real user IDs, emails, passwords, message text, Auth tokens or project data.
- `scripts/test_account_deletion_postgres_20261108.cjs`: **15 actual PostgreSQL 17 checks passed**. The complete SQL draft compiled; all **33 owner triggers and 36 restrictive policies** were present. Frozen A's Research insert and private avatar upload were denied, prepared B's writes succeeded, unrelated Storage bucket was unaffected, old/new owner transfer was denied, Auth-side direct DELETE was RLS-restricted, and service-role redaction failed without the correct lease but succeeded with it. A normal authenticated client could not spoof the cleanup lease.
- The dedicated GitHub Actions job uses `postgres:17` with database name `dd_fence_fixture`, no Supabase URL or secret, and `PGHOST=127.0.0.1`. The Node test refuses any other host/database or DB user. No Netlify build/deploy.

Full verified source CI: [GitHub Actions run 42531927203](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42531927203). The isolated PostgreSQL job was **SUCCESS**. Record all other jobs' final results separately when complete.

## Owner-approved empty test sections
The owner confirmed the two Discussion sections created/stewarded by their selected Boydamo test account are **test sections and disposable**. A subsequent live **read-only** SQL check proved:
- exactly **2** sections associated with the selected account;
- **0** threads, **0** replies, **0** third-party posts, **0** thread flags and **0** escalations;
- **2** creation/audit entries, which must not be silently destroyed.

The section foreign keys in the current database are: `dd_forum_threads.section_id ON DELETE CASCADE`, `dd_forum_escalations.section_id ON DELETE CASCADE`, `dd_forum_audit.section_id ON DELETE SET NULL`. Therefore removal of empty sections is a plausible **operator-reviewed disposable-test cleanup**, but only after rechecking the counts within the same locked transaction, preserving audit records, and confirming backups. No sections were removed in this milestone. The visitor/unknown Yandex account, other invited account and primary administrator remain completely out of scope.

## Release blockers
1. Independent, current encrypted backup and a **real disposable restore** of the actual backed-up data. Existing successful 6 November manual upload and synthetic restore are insufficient as a fresh rollback guarantee.
2. Exhaustive write-surface audit: privileged delete functions, other service-role/Edge writers, dynamic SQL, Storage SDK uploads, cross-user Chat and forum interactions, and complete dependency/fk cascades.
3. An end-to-end account freeze concurrency drill (writes in flight while claiming) plus signed-in test sessions with old JWTs, fresh JWTs, role transfers and actual Storage API requests.
4. Owner-approved empty-section cleanup that rechecks zero third-party posts under row lock and preserves audit provenance; no automatic deletion of community data.
5. An audited activation RPC that proves **all** write paths genuinely guarded, with no stubbed success; operator-only recoverability and final Auth-deletion verification.
6. Only then, a single explicit disposable-account deletion test using the **selected Boydamo account**, while keeping the visitor, administrator and every other account intact. Follow with privacy/FAQ, user-export functionality, mobile acceptance and owner-approved bundled release.

**Do not label self-service deletion as live. The public Profile option is still a support request.**
