# Disclosure Desk R3 — account-switch and in-flight cloud-request release hardening

**Date:** 15 November 2026 · **Branch:** `queue/dd-web-r3-from-r2-nov14` · **Scope:** Source-only R3 pre-release security/UX hardening; **NO DEPLOY**.

## Finding and source fix
The hosted Hypothesis Lab could begin an encrypted cloud request under a verified profile and receive its result just after sign-out or switching profiles. RLS still restricts the actual cloud API request, but a late successful result from an old authenticated session could be presented in the new browser context. This was not adequately defended by the previous single pre-request `getUser()` check.

- `experiments/r3/hypothesis-cloud.js`: now captures an identity epoch for each cloud read/write/delete request and verifies the session identity and epoch **again after the network response**. Any intervening sign-out, profile switch, or refresh revealing a different account rejects the response. `TOKEN_REFRESHED` no longer bypasses account-switch detection. This is a secondary client-side safeguard; actual Supabase row-level security remains the server enforcement boundary.
- `experiments/r3/hypothesis-ui.js`: account-change event immediately revokes the page's ability to render decrypted notebook content, wipes private notebook fields, passphrases and the previous profile label, disables all cloud buttons, and shows a locked state before reload. Critical async encrypted-save, unlock, import, cloud read/backup/download/restore/delete paths re-check page revocation before writing to the UI. The existing offline Termux prototype continues to use its original local vault; on a hosted page, encrypted local browser storage remains account-UUID-scoped.
- `scripts/test_r3_cloud_identity.cjs`: new local, fictitious-account, dependency-free Auth simulation checks pending A→B response rejection, sign-out, expired token error, changed-identity token refresh, and guest cloud access denied.
- `scripts/test_r3_hosted_browser_chromium.cjs`: asserts the previous account label is cleared, all cloud controls are disabled, the private notebook disappears and the boot state becomes `locked` on account-change event.
- Hosted no-deploy workflow now runs both the cloud identity unit regression and the browser integration alongside strict static-site packaging.

## Verified automated results
**Exact source/test SHA:** `e17e127a3a69df048f8556a6b0a8c0775f49a281`.

**Hosted R3 no-deploy GitHub Actions [run 43660010593](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43660010593): BOTH jobs PASS**. Unit Auth concurrency check passes; source/packaging/privacy checks pass; headed browser not used — Chromium runs headless with simulated Auth/backend at 393 px and 1280 px. Previously recorded two-account real PostgreSQL RLS checks with transaction-local claims also passed and left zero test rows.

## Not verified / release gate still closed
This regression does **not** substitute for two real signed-JWT browser sessions using the owner's two existing approved test accounts, direct REST cross-account access attempts, interrupted network with real sessions, iPhone/physical Samsung hosted acceptance, or independent cryptography/security review. No owner credentials were requested or used, no real account data or notebooks were read/written, no Supabase schema changes were made by this source fix, and no production branch/Netlify deployment or Android APK was triggered. R2 live remains unchanged.

Next: run actual authenticated two-account negative REST and cross-device encrypted recovery in a separately approved controlled hosting environment, then obtain exact release-SHA authorisation for the Netlify production promotion.
