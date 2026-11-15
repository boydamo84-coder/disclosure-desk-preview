# R3 Hypothesis Lab — authenticated private workspace boundary design
_Date: 14 November 2026 · SECURITY DESIGN ONLY · No database changes or deployment_

## Existing, verified context

Disclosure Desk's existing website displays an account/service connection for research boards and states that the separate Supabase project holds cloud data privately. This design is a proposed **new** R3 private notebook boundary. It does not assume the existing Boards schema, identity/permission rules, encryption key custody or project credentials are correct for R3; they must be inspected and independently verified first.

The current R3 standalone Termux alpha stores opt-in encrypted notebooks in **Chrome IndexedDB** at `http://127.0.0.1:4175`. Its `workspaceId` is a researcher-selected string and **NOT authenticated identity**. AES-GCM, PBKDF2, local generation protection and backup/export work offline but do not authorise access to remote records. It must not be labelled a multi-user security product.

## Proposed access and data ownership contract — NOT IMPLEMENTED

1. **Private by default.** A notebook, its full revision history, attached case research questions, citations and any W.NE drafts are readable/writable only by the authenticated owning user. Guest and unverified sessions have no access. No automatic cross-account sharing, public index, profile preview, boards feed exposure or AI/tracker ingestion.
2. **Identify the user on the trusted server.** An external server/edge handler must verify Supabase-signed JWT/session using the configured identity issuer. Ownership must derive **only** from the verified user identity (e.g. `auth.uid()` in the appropriate Supabase project). Never trust a client-provided `owner_user_id`, `workspaceId`, display name, email or request header as authority.
3. **Candidate storage schema, not a migration:** `r3_private_notebooks(id UUID PK, owner_user_id UUID NOT NULL, ciphertext JSONB NOT NULL, generation UUID NOT NULL, schema_version INTEGER NOT NULL, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`. Use random opaque IDs and do not store case title, witness details, gap text, source URLs or names as plaintext metadata. Keep notebook details inside client-encrypted ciphertext by default. Store no server-side decryption secret and never send the user's passphrase.
4. **RLS before any API integration.** If Supabase Postgres is used, enable and FORCE row-level security where supported, with explicit owner-scoped `SELECT`, `INSERT WITH CHECK`, `UPDATE USING/WITH CHECK` and `DELETE` policies for authenticated users only. Refuse anonymous; revoke broad public SELECT grants. Server/service-role access must be limited, audited, not exposed to browser bundles and must not accidentally bypass policy without equivalent authorization checks. Never accept ownership changes via update.
5. **Concurrency and revision integrity.** Writes use an atomic optimistic compare-and-swap on a generation ID to reject stale-device overwrites. Every committed version stays inside encrypted notebook history; no silent merge/rollback, no hidden background sync. Manual conflict resolution and user-approved backup restore must be implemented before enabling multi-device writes.
6. **Encryption and recovery boundaries.** Browser Web Crypto AES-256-GCM + PBKDF2-SHA256 local alpha is not independently audited. Cloud storage may keep **client-encrypted bytes only** pending an external security review of passphrase strength, key derivation parameters, memory/clipboard/XSS exposure, replay/rollback, key rotation and backup. Forgotten passphrase presently cannot be recovered; never imply a recovery mechanism exists.
7. **Sharing/publishing is a separate operation.** A reviewed public research article or comparison is an **explicitly selected, newly generated publication**. Do not make original notebooks public by toggling their visibility or copying hidden private citations; require preview and confirmation, per-source/privacy review, moderation rules and controlled revocation. Public source citations and private researcher commentary must stay segregated.
8. **Gap Finder never writes by itself.** It runs only against explicitly bundled public curated records or source material the researcher consents to supply. A catalogue field gap may become a `research-question-not-evidence` note **only on an explicit user click**, and only in a notebook for the same incident. No automatic inference of alien origin, probability, missing global evidence, witness identities or precise private locations.
9. **Data handling:** No cloud uploads/analytics containing notebook or witness data until written consent and published privacy terms; no ad trackers in private research views. Define retention/deletion/export requests, mobile device loss, logout lock, local backup management, content size bounds and error visibility separately. A logged-in website must use security headers/CSP and protect every account-scoped endpoint against IDOR.

## Required negative tests before release

- Two real test accounts A/B: A can CRUD only A's notebook; B receives denied or not-found for every A ID, including direct REST/API calls, even with guessed workspace strings, pagination, search, changes to owner ID or expired JWT.
- Guest/logged-out/token-tampered clients cannot list any notebook or mutate an owner record. Logout clears decrypted session DOM/key references; a public-profile view never serves private draft content.
- SQL policies, migrations, storage bucket ACLs, edge handlers and service-role paths tested independently; no public/anonymous select, no broad wildcard file access and no secret in bundled JavaScript.
- Concurrent edits reject stale generations, preserve ciphertext, produce understandable conflict UI, and cannot overwrite or silently downgrade version history.
- Export/restore only through the authenticated owner and explicit user choices. End-to-end encrypted cloud data remains indecipherable without a valid passphrase; citations/research questions cannot be indexed or leaked in public responses.
- Publication and account deletion must be independently tested across legacy Boards, W.NE, chat, profiles and Android wrapper, with audit trails and no rollback of accepted original 14-tab nav.
- Mobile phone and desktop browsers tested with normal keyboard, TalkBack, interrupted connectivity and stale sessions. Independently review data protection and security before production release.

## Execution gate

**Do not create R3 cloud tables, connect Supabase, publish research, use personal tokens, merge to production, run Netlify builds or ship an APK** under this design-only milestone. Before implementation: inspect exact current account/session model, owner project and policies; agree on permission architecture and migration/rollback plans; obtain explicit owner approval for real service writes; run separate staging and security QA.

**Status:** proposal, not security clearance. The offline alpha's encrypted notebook, source-linked questions and prior local backups remain separate from existing website accounts.
