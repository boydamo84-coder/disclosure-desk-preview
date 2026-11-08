# Disclosure Desk — Milestone 24 isolated account-deletion staging drill
_8 November 2026 · UNEXECUTED against real Auth/Storage · NO production deployment_

## Safety boundary
Canonical repository: `boydamo84-coder/disclosure-desk-preview`.
Development branch: `fix/compact-writing-popover-mobile-desktop-nov08`.
Do not modify `main`, `production`, Netlify build settings, the live Supabase project, or the standalone W.NE repository while staging this drill.

**Current result:** 22 automated operator-recovery/security scenarios use ONLY synthetic account identities and simulated Storage/DB/Chat/Forum objects. They do not mean that real Supabase account deletion has been verified.

**Do not execute the draft SQL** until a separate disposable staging Supabase project exists and its permissions, storage setup, schema dependencies and actual PostgreSQL syntax have been reviewed. Project creation or a billable branch requires a separate cost quote and explicit owner approval. Never point the executor at the existing Disclosure Desk project. The executor includes a hard deny for the current live project reference.

## Required controls before any real disposable-account drill
- Create a genuinely isolated staging project with no live data, connection string, shared Auth users, backups, or storage keys from Disclosure Desk or Our Cinema. Use staging-only environment secrets; no service-role credential in any browser, log, GitHub file or screenshot.
- Review `supabase/ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql` in a disposable database. Assert the existing `dd_internal` schema is not modified; the draft uses a separate `dd_deletion_private` schema for DBA-only approvals.
- Verify all public ledger permissions, each function's `SECURITY DEFINER` role check, Auth session validation, SQL constraints, storage owner ID conflicts and actual `ON DELETE` results.
- **Implement an enforceable server-side write freeze** for any account in active deletion. The operator coordinator refuses recovery without independent verified write-fence evidence. A UI checkbox or a human promise is NOT a write freeze. Ensure late document, avatar, forum, research-image and chat writes are rejected by server-side policy, even for an already-issued JWT. Until this is in place, do not run an actual destructive staging drill.
- Create **three disposable users** A, B and a protected admin. Use unique nonpersonal email addresses. A and B must not share a Storage prefix, Auth identity, browser profile or login session. Test A and B's data for strict RLS isolation first.
- Provide an owner-approved audit/retention rule for public moderation records and historical encrypted BDS/offsite/email backups. The backend does not magically remove already exported files, downloaded copies or browser-local data.
- Ensure a trained operator and a **different reviewer** approve a recovery ticket through private DBA access; service-role Data API access must not be able to insert or alter that approval. Do not put a recovery ticket in a public account request.

## Disposable fixtures
- A: one W.NE cloud document plus revision, one private Investigation Board, one avatar, one research image, one untracked Storage object still owned by A, a Chat conversation and a discussion thread/reply.
- B: a reply under A's public discussion thread, one independent discussion thread and reply, a distinct avatar and research file, a Board and Chat conversation.
- Protected admin: existing forum owner/moderator and section stewardship roles, tested as a **denied** deletion target.

## Acceptance matrix
| Case | Expected verified outcome | Evidence |
|---|---|---|
| A signs in; B accesses A's private document/Storage | B is denied by Auth/RLS | Sanitised status/code only |
| Guest, unverified account, or expired session requests deletion | Rejected before any write | HTTP/status and zero-change count |
| A selects Delete; wrong password or SSO-only provider | Rejected; no job claimed | No private values in logs |
| Fresh password + one-use intent + typed confirmation | One active A-only job; second use rejected | Job phase and ticket status only |
| Protected owner/section creator requests deletion | Rejected until formal role transfer | No role or data mutation |
| A forum text redacted | Thread and reply IDs remain, B's reply is unchanged | Disposable fixture hash comparison |
| A's avatar and research images removed | A's owned objects absent; B's objects unchanged | Bucket/owner counts only |
| Late orphan object appears during cleanup | Stop before Auth deletion; cannot claim success | Account A still present |
| Storage API fails halfway | Job remains partial, no false success; review required | Recorded phase/status |
| Auth succeeds but checkpoint write fails | Operator can prove A absent, reclaim one expired lease and finish | One-use ticket consumed |
| Attempt to reclaim active lease, wrong account/phase or reused ticket | Denied; no extra deletion | Recovery refusal code |
| No verified write freeze / two-person review | Operator recovery denied | Zero mutation counts |
| Complete A deletion | A absent; B's Auth, Docs, Chat, reply and files intact | Cross-account count/hash comparison |
| Offsite encrypted backup and device-local Board copies | Realistic retention explanation, no false erasure promise | Privacy notice review |

## Workflow state
- `execution-core.mjs` is private adapter-driven stage logic. It checks current leases before destructive phases.
- `operator-recovery-core.mjs` is **not an HTTP endpoint**. It demands staging, a verified write fence, an expired prior lease, a matching DBA ticket and a new lease before invoking the execution coordinator.
- The private SQL recovery ticket can only be inserted via trusted DBA procedure; `dd_deletion_operator_reclaim` atomically consumes one approval. No recovery UI is connected.
- The existing folder `index.ts` is still **read-only preflight**; `execute-staging-only.ts` remains separate and disabled. Neither has been deployed.
- The SQL is **draft code, not verified PostgreSQL execution**. Its syntax and security contract have static checks in CI, not a successful staging DB migration.
- Existing GitHub no-deploy workflow includes `scripts/test_account_deletion_preflight_20261108.cjs`, `scripts/test_account_deletion_execution_20261108.cjs` and `scripts/test_account_deletion_recovery_20261108.cjs`. No real account IDs, passwords, tokens, actual user content or production writes are part of these tests.

## Outstanding before self-service release
Staging project and cost approval, actual SQL deployment/permissions test, server-enforced per-account write freeze, complete cleanup inventory and retention policy, verified operator-only execution binding, signed-in two-account real dry run, OAuth reauthentication, full user export, Privacy/Guide updates, clear failure/recovery UI, Android/iPhone acceptance and independent security audit. Only then may the Profile support-email request be replaced with self-service deletion in the owner's ONE later approved site release.
