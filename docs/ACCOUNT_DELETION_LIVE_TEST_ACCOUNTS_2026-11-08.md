# Disclosure Desk — Live test-account audit (Milestone 25)
_8 November 2026 | Database read-only checks completed | Account deletion NOT performed_

## Owner's revised test-environment instruction
Owner confirmed the **live Disclosure Desk website currently has only test accounts** and authorised using those to test instead of creating another potentially billable Supabase project. This supersedes the separate-project preference for **account selection and non-destructive checks**, but does not waive irreversible-deletion safeguards, independent backups, consent or technical release gates. Do not modify the separate Our Cinema Supabase project or standalone W.NE.

## Current live account inventory (non-identifying)
Read-only queries against the existing Disclosure Desk project returned **four email-confirmed Auth users, zero soft-deleted users**. Stable aliases below are ordered by account creation time then Auth ID; **the aliases are not usernames and are not safe deletion permissions**. Never publish or hard-code credentials, email addresses, internal Auth IDs or file paths.

| Alias | Protected owner/moderator? | Research docs | Boards | Forum threads | Chat messages | Private Storage objects |
|---|---|---:|---:|---:|---:|---:|
| test-01 | No | 0 | 0 | 1 | 1 | 1 |
| test-02 | **YES: forum owner, chat owner, moderator** | 7 | 3 | 5 | 6 | 2 |
| test-03 | No | 0 | 0 | 0 | 0 | 0 |
| test-04 | No | 0 | 0 | 0 | 2 | 1 |

The private Storage buckets `dd-profile-avatars` and `research-images` contain 3 and 1 files respectively. Both buckets are private. No forum replies were attributed to the four accounts at the audit moment; a disposable two-account thread/reply fixture is needed before any destructive test can prove reply preservation.

**Do not delete test-02**; it currently carries the sole site owner/moderator responsibilities and research/Board test data. **Do not select test-01, test-03 or test-04 for irreversible deletion until an explicit expendable account is identified and the user has exported data.** Some accounts could belong to another person invited for testing. The general permission to use test accounts is not a substitute for choosing the exact account and protecting the others.

## Live account isolation check (actual database; read-only Auth role simulation)
Each check ran in an independent `BEGIN READ ONLY` transaction, set `request.jwt.claim.sub` to a database-selected account, switched to `authenticated` role and `ROLLBACK`ed. This tests existing RLS under simulated user claims. It **does not** prove a real authenticated browser session, password login, Auth JWT signature or network Storage API enforcement.

| Simulated signed-in account | Research documents visible | Private Boards visible | Research-image Storage objects visible |
|---|---:|---:|---:|
| test-01 | 0 | 0 | 0 |
| test-02 | 7 | 3 | 1 |
| test-03 | 0 | 0 | 0 |
| test-04 | 0 | 0 | 0 |

The results match account ownership in the inventory: the nonowner accounts did not see test-02's cloud documents, Boards or research-image files through those RLS paths. This is a **positive preliminary isolation test**, not a comprehensive security audit of all database tables and Edge Functions.

## Current backend activation status — verified READ ONLY
- `public.dd_account_deletion_jobs`: **not installed**
- `dd_deletion_private.dd_deletion_recovery_approvals`: **not installed**
- `public.dd_deletion_claim`: **not installed**
- `public.dd_deletion_write_fence_active`: **not installed**
- No SQL migration, Auth/Admin deletion, data writes, Storage remove, Netlify deployment or live Edge Function deployment was done.

## Safe path forward on this existing project
1. Verify latest encrypted offsite database backup and **actually successful restore** of a throwaway copy before irreversible tests. Backups alone are not adequate if restore has not succeeded. Capture a fresh independent export of candidate account's Research/Board content.
2. Verify explicit identities and ownership of potential non-admin test accounts, including whether any belong to invited testers; choose a disposable test-only account that can be lost permanently. Ensure a second independent test account remains untouched throughout.
3. Develop and validate server-side write freeze in code and a disposable local/in-CI PostgreSQL fixture first. An upload or new chat/research write must be blocked after the account enters deletion even with a previously issued JWT. Do not enable a backend solely because it has a flag or a UI prompt.
4. Review effects of installing new functions/policies/triggers on the **live** project and rehearse rollback for schema changes. Keep actual deletion disabled until these pass; do not apply the unvalidated SQL draft blindly.
5. Add a synthetic forum thread from the chosen expendable account with an **other account's synthetic reply**, and isolated avatar and Research-image fixtures. Measure target vs preserved account state with only aggregate counts/hashes. Real tests should verify B's replies and objects stay.
6. Test read-only preflight on live with correct signed-in credentials, rejection of guest/owner account and wrong-user requests. Perform a single explicit, independently authorised disposable-account deletion only after all above gates; check Auth, files, private content, retained moderation, backups and log retention without claiming instant erasure of historical encrypted copies.
7. Keep the existing Profile delete option labelled as a **support request**, not automatic deletion, until tested and released in the owner's planned single bundled site update.

## Reproduction
`supabase/ACCOUNT_DELETION_LIVE_READONLY_AUDIT_20261108.sql` contains safe queries and instructions. It intentionally contains **no real IDs or user content**, and all execution is `BEGIN READ ONLY` followed by `ROLLBACK`. Re-run after new accounts are created or roles change because aliases can shift if existing accounts are removed.

**Next engineering milestone:** implement and verify a genuine account-write fence and controlled recovery contract. Live project is now the authorised target for later disposable-user acceptance, **not** a reason to bypass production safety. No separate Supabase project needed by default.
