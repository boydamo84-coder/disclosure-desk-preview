# DD-WEB-R3 — interrupted-write recovery and RLS/security snapshot
**Date:** 15 November 2026  
**Branch:** `queue/dd-web-r3-from-r2-nov14`  
**Tested executable SHA:** `c5e0a7bf30eb467d6379d258ed5009837b6fb4d4`  
**Status:** R3 preview only; NOT security-certification or production approval.

## User acceptance recorded (owner report only)
Owner separately confirmed real signed preview sessions for accounts A and B, both fictional encrypted backups, cross-owner read DENIED in both directions with the other backup known present, wrong-passphrase rejected and correct-passphrase cross-browser restore, sign-out+refresh private notebook lock, and the offline cloud DOWNLOAD failing safely before reconnect succeeded. The assistant received no tokens, passwords, account UUIDs or research content. The owner-reported offline DOWNLOAD does **not** substitute for upload/deletion acknowledgement-loss testing.

## Source finding and repair
The previous encrypted cloud adapter sometimes asserted “Nothing was overwritten” / “Cloud backup was NOT saved” when a network error or lost acknowledgement occurred after an INSERT or UPDATE reached Supabase. A DELETE acknowledgement loss could likewise be incorrectly reported as definite non-deletion. Such messages cannot prove that a transaction did not commit.

On the isolated R3 development branch:
- `hypothesis-cloud.js` now marks failed/empty encrypted INSERT/UPDATE acknowledgements as **unconfirmed**, instructing users to keep the local encrypted copy and check the remote generation after reconnect. A definite Postgres unique-constraint conflict (23505) is reported separately as no overwrite. A zero-row compare-and-swap UPDATE remains an explicit conflict, not a failed network assumption.
- Cloud DELETE errors now say **deletion unconfirmed**, encouraging a fresh signed-in cloud check before retrying. A valid successful acknowledgement still reports success.
- `hypothesis-ui.js` removes categorical “not saved / not deleted” UI labels where the remote state is unknown.
- New `scripts/test_r3_cloud_uncertain_writes.cjs` uses a completely fictional mock that **commits the server mutation before returning a fake network error**. It verifies INSERT, UPDATE, DELETE and empty-acknowledgement cases are flagged as unconfirmed, that reconnect can read the authoritative result, duplicate inserts do not overwrite, stale compare-and-swap generation conflicts fail, and offline reads do not report success.
- No R3 encryption format, key, salt, IV, database schema, live account content or production app code was changed.

## Automated exact-source verification
All five workflows at code SHA `c5e0a7bf30eb467d6379d258ed5009837b6fb4d4` succeeded, **NO DEPLOY**:
- [R3 hosted encrypted cloud no-deploy (both source-package and hosted-browser)](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43664574041) — success.
- [R3 standalone Gap/Hypothesis alpha no-deploy](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43664573996) — success.
- [R2 integrated site/browser no-deploy](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43664577440) — success.
- [Beta14 mobile Chromium release gate no-deploy](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43664577458) — success.
- [Safe public package no-deploy](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43664577417) — success.

## Live R3 database snapshot, read-only
Supabase project was queried only via aggregate and policy metadata, not by retrieving any user content:
- R3 encrypted backup rows: **2** (consistent with two owner-run fictional backup tests; no rows modified).
- `public.dd_r3_private_notebooks`: RLS **enabled** and **FORCE RLS enabled**.
- Four active authenticated owner-scoped policies: SELECT, INSERT, UPDATE, DELETE; all include `auth.uid()`; UPDATE has both USING and WITH CHECK.
- Anonymous role has no table SELECT or INSERT privilege. Authenticated role has table SELECT privilege under RLS.
- Supabase security advisor returned **no advisory finding naming the R3 notebook table**. That does not imply an independent external audit.

**Separate wider platform advisories** were also present in the existing Disclosure Desk Supabase project: 21 informational RLS-enabled/no-policy table notices (may be intentional deny-all), 15 WARN anonymous-executable SECURITY DEFINER function notices, 65 WARN authenticated-executable SECURITY DEFINER function notices, plus a leaked-password-protection warning. These are **not** R3-table-specific and **were not changed** as part of this isolated R3 milestone. Review each before claiming the platform is fully security-audited; careless blanket revocations could break existing site functions. Official remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Cryptography source review — limitations
Existing local vault uses browser Web Crypto AES-256-GCM with random 12-byte IV per save, 16-byte random salt, PBKDF2-SHA256 (310,000 iterations), 128-bit GCM tag, v1 format AAD, non-exportable derived key, bounded ciphertext and plaintext size and only ciphertext cloud transport. Host package CI checks safe static contents, pinned SDK SRI, and absence of plaintext in fake cloud records. This is a **targeted code inspection and automated functional testing**, **not** an independent penetration/cryptographic audit, resistance guarantee or regulatory certification. Recovery strength depends on the owner's unique passphrase and the security of their browser/device.

## Remaining hold
Keep [draft PR #13](https://github.com/boydamo84-coder/disclosure-desk-preview/pull/13) DRAFT. Still consider malformed/expired authentic REST session tests, forced mid-upload interruption on a real phone if feasible, review of wider project security advisor warnings, independent crypto/security review for sensitive or unpublished reports, latest preview owner UI smoke if code changed, final rollback plan and explicit owner's approval for one controlled production promotion. R2 live and Android store APK remain unchanged.
