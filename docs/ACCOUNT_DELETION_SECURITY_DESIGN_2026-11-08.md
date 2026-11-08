# Disclosure Desk — Account deletion implementation and safety plan
_8 November 2026 · Milestone 21 design · NOT deployed, NOT enabled_

## Scope and important product distinction
The user's request **Delete profile** means **Delete my Disclosure Desk account**, not merely remove the avatar. Removing/changing the photo is already implemented separately. The present Profile option sends a support email; it is **not** genuine self-service deletion. Do not label it as if it immediately deletes a Supabase Auth user.

## What the authenticated owner should see
1. Profile → Account & privacy → **Delete my account** (separate from Remove photo). Explain consequences plainly: cloud W.NE documents/sections/revisions, Research backups, private Boards, account preferences, Chat, witness reports, avatar and Research images. Browser-local notes/Board copies require separate device cleanup; already downloaded backups and third-party cached copies cannot be recalled.
2. **Export my data** and back up research before proceeding. Do not preselect deletion. Use a fresh authenticated session; for password users re-authenticate, and for OAuth users require a fresh provider login/reauthentication path. Account-owner identity must be verified by Supabase Auth on the SERVER, never trust a user_id or email posted by the browser.
3. Explicit two-step confirmation: user sees a full deletion summary, types **DELETE MY ACCOUNT**, then confirms a final modal. Normal Back/Cancel leaves data untouched. The server must check current user/session and reject anonymous, expired, stale or insufficiently confirmed requests.
4. Server returns a durable receipt/status and signs the user out only after **complete confirmed deletion**. A partially failed operation must not claim success; preserve an operator-readable recovery/cleanup status without storing passwords or private documents.

## Live database facts inspected READ-ONLY on 8 Nov 2026
- RLS-enabled user-scoped data includes: `research_documents`, `research_document_revisions`, `research_document_trash`, `research_reference_backups`, `research_assets`, `investigation_boards`, `dd_public_names`, `dd_avatar_profiles`, Chat pairs/messages/blocks/reports, witness submissions and flags, saved media/video progress, rate-limit records and moderation owner/steward roles.
- PostgreSQL foreign keys from the majority of those tables to `auth.users` are **ON DELETE CASCADE**; those rows can disappear automatically after a correctly-authorised account removal.
- Crucial exception: `dd_forum_threads.author_id` and `dd_forum_replies.author_id` have **ON DELETE SET NULL**, meaning existing *content* remains unless separately redacted. Deleting a user's thread row indiscriminately is unsafe because replies from other users are attached through **ON DELETE CASCADE**. Keep discussions structurally intact while **redacting the departing author's own title/body/link/image and own reply body**, setting an appropriate anonymised marker; re-check moderation/audit retention policy first.
- `dd_forum_audit.actor_id`, `dd_forum_escalations.submitted_by`, `dd_forum_sections.creator_id/steward_id` and `dd_media_titles.submitted_by` also use SET NULL. Consider operator retention for abuse reports, without retaining unnecessary personally identifying details.
- Two private Storage buckets exist: `dd-profile-avatars` and `research-images`. The avatar path uses `dd_avatar_profiles.public_key + '/avatar.webp'` (an opaque key, **not** the Auth user UUID); Research images use `research_assets.storage_key`. Storage object bytes are not automatically proved deleted by deleting only metadata rows. Fetch owner keys first, then delete each bucket object via privileged Storage API, confirming each removal before dropping the owning database row.
- Existing GitHub encrypted offsite BDS backups can contain historical records and are outside the live database's cascade. Define retention and restoration policy; do not claim the user was erased from old encrypted snapshots immediately. Log only minimal noncontent deletion receipts as required.

## Secure backend architecture to build and validate
- Dedicated Supabase Edge Function (server-only service credentials) or equivalent audited backend. Browser sends only current Auth bearer token, confirmation, and a one-use recently reauthenticated challenge. No general client can call the Auth Admin delete endpoint. Verify token via `auth.getUser` and bind the account ID from the verified token; never accept `user_id` in request JSON.
- Perform a server-side **preflight**: validate recent confirmation, check no concurrent deletion, compute owned Storage key manifest and public-content redaction targets, check system-owner last-admin safeguards, and confirm relevant backups/availability. No metadata/image record contents in logs.
- Perform ordered **idempotent** cleanup with a durable state machine: redact only the account owner's public forum content; remove owned image objects; then delete the account by Admin API so Auth FKs cascade; check resulting Auth deletion and Storage objects. Handle API failures/retries, races and partial completion; do not blindly retry dangerous delete steps.
- Prevent a deleted user's messages or research being re-imported automatically by background backups. Delete pending invitations, images and queued notifications; invalidate sessions. Owner-only operator audit should record outcome without preserving plaintext private content.
- Add explicit tests with two **disposable** Auth accounts, a real image in each private bucket, a community thread containing another user's reply, blocked/reported messages, document/revisions and backup, and a separately verified protected owner/admin account. Ensure deleting A never affects B; A's public forum text is redacted and B's reply remains; email/password and OAuth flows both covered. Test interruption after Storage removal and safe resume.
- Update Privacy/FAQ text before enabling deletion. Review UK GDPR erasure and legal/moderation retention requirements and ensure truthful disclosures; any retained data must be justified and scoped.

## Release gate
- **Not yet implemented; no database migration, Storage deletion, Edge Function deployment or Netlify build performed in this audit.**
- Implement and test the server first; only then replace support-email request with functional self-delete UI. Do NOT ship a button that claims deletion but only returns a 404 or support email.
- A single Netlify deployment may include the frontend once the server is separately verified; all development remains on `fix/compact-writing-popover-mobile-desktop-nov08` until approved.

## Milestone 22 — server-side preflight guard (8 November 2026)

**Implemented in DEVELOPMENT ONLY. This is not a working deletion service.** New source in `supabase/functions/dd-account-deletion/index.ts` and `preflight-core.mjs` uses an exact `{ "action": "preflight" }` request, verifies the current signed-in user with Supabase Auth on the server, and counts only rows filtered to that user's server-verified ID. It returns aggregate counts only (no email, UUID, storage paths, document text or Chat messages) and clearly states that nothing has been deleted. Browser-provided user IDs or unknown actions are rejected.

The function is **off unless** `DD_ACCOUNT_DELETION_PREFLIGHT_ENABLED=true` is specifically set on its server environment. The repository source has **no** Auth Admin delete, Storage remove, SQL update, or delete call. It has **not been deployed to Supabase** and there is no frontend call to it yet. Even if deployed and enabled as a preflight, it **cannot execute a deletion**.

Preflight explicitly blocks forum owners, Chat owners and comment moderators pending protected-role transfer; this avoids deleting the site's current single forum owner. It also refuses anonymous/unverified accounts and any incomplete count or backend error. Counts are for indexed owner-owned rows, **not** a completed Storage ownership enumeration; orphan/untracked private objects remain an execution-phase audit blocker.

No-deploy mock test: `scripts/test_account_deletion_preflight_20261108.cjs` (13 assertion groups, two separate synthetic account counts, owner isolation, email/content and destructive-code guard). [GitHub Actions 42525947517](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42525947517) **SUCCESS** in both existing jobs. First intermediate test-only assertion was too broad (matched ordinary word “email”); corrected to detect email address patterns. No production GitHub push, Netlify deployment, new Supabase tables, Storage changes, or test-account deletion occurred.

**Unresolved and mandatory before real self-deletion:** fresh identity proof independent of a mere refreshed JWT; durable one-time intent and idempotent progress ledger; protected-admin transfer; verified deletion of all Storage objects, not only indexed metadata; selective forum text redaction without deleting other users' replies; backup retention policy; safe pause/recovery; two disposable accounts tested under actual authenticated staging; complete ownership review; explicit final consent. The existing Profile support-email request must stay labelled as such until the full destructive backend is accepted.


## Milestone 23 — staged execution implementation, not released (8 November 2026)

**Development source only.** No Supabase SQL, Edge Function, Storage mutation, Auth Admin operation, Netlify preview/deployment or production GitHub branch change was made. This staged feature must not be used on current accounts.

### Code staged
- **execution-core.mjs**: strict, adapter-driven coordinator; verifies exact account owner, restricted Storage buckets and paths, one-use intent, independent reauthentication, explicit confirmation, owner protection and durable ordered checkpoints. It fails closed rather than interpreting an incomplete backend response as success.
- **execute-staging-only.ts**: a separate UNWIRED/UNDEPLOYED backend draft. The active folder index.ts remains the read-only preflight. Execution requires two deliberate server flags: DD_ACCOUNT_DELETION_EXECUTION_ENABLED=true and DD_ACCOUNT_DELETION_STAGING_PROJECT_REF matching an exact *separate staging* Supabase project URL. The current production URL is not an acceptable target for this draft. It rejects unknown actions, client-supplied account IDs, stale Auth sessions, unconfirmed accounts, protected roles, and missing password proof. A freshly verified temporary password sign-in is required; OAuth/SSO is unsupported pending a separately audited reauth flow. No password is logged or stored.
- **supabase/ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql**: draft SQL outside automatic migrations. Private RLS-protected ledger survives deletion, restricts access to service_role, and stores only in-progress Storage manifest and the hash of a short-lived one-use challenge. Service-role RPCs cover active-session checks, protection of owners/moderators/section stewards, Storage object discovery (including orphan objects based on actual owner_id), atomic same-session challenge claim, and *updates* to departing authors' forum posts and replies using CHECK-compliant neutral markers, without deleting parent threads or another member's reply. It is NOT applied.
- **scripts/test_account_deletion_execution_20261108.cjs**: offline mock suite with two separate user identities, another user's reply under A's parent thread, private image preservation, protected-owner denial, invalid Storage keys, interrupted Storage cleanup, an object created after prepare, and a checkpoint failure after Auth removal. Added to existing no-deploy GitHub Actions suite.

### Processing order (as designed)
1. Verify active current session and email-confirmed account and protected-owner status. Verify password again, build an owner-scoped Storage manifest and issue a ten-minute one-use secret (store its SHA-256 digest only).
2. Require an exact typed DELETE MY ACCOUNT confirmation on the same active session. Claim the job atomically and refuse a consumed/expired challenge.
3. Redact only that author's public forum text; preserve IDs, threads and all other members' contributions. Checkpoint.
4. Remove owned private Storage files via the server API, verify object removal and check for orphan or new files. Checkpoint.
5. Reconfirm not an owner and verify zero owned Storage objects. Delete Auth through a server-only Admin call and verify Auth absence. Checkpoint.
6. Check Auth absence and Storage emptiness again, then mark complete and clear the private file manifest. Errors never claim success; they require operator assessment and safe resumption.

### Must finish BEFORE enabling
- **No genuine staging Auth/Storage execution has been done.** First provision and explicitly approve a disposable separate staging environment, deploy/review the SQL privately, and test two disposable accounts plus protected owner. Do not deploy this source to production yet.
- Implement and verify *operator-only resume* after an interrupted job. Current one-use client intent deliberately cannot restart a partial destructive operation; the server lease is limited to 15 minutes.
- Implement a secure write freeze or stronger race controls. Current coordinator detects newly created Storage files and stops, but a partial job may need operator recovery.
- Review and document moderation/audit retention, public section authorship, encrypted GitHub BDS backups, emailed/downloaded copies and device-only local data.
- Add OAuth provider reauthentication, export-all data, deletion UI, rate limiting and consent/privacy FAQ changes; account role transfer needs a separate owner workflow.
- Run authenticated Samsung/iPhone and two-account acceptance, and independent final permissions/Storage/Chat/Research security review. Until then Profile stays a clearly labelled **support-email request**, not a working self-delete button.
