# Disclosure Desk — M67 clean Who's Who voting integration handover (19 Nov 2026)

## Current outcome
- Branch `prep/who-m67-production-voting-integration-20261119` is based directly on the verified 19 Nov GitHub `production` at `ca302b2e99a9321279bc711a817ad833cb041851`. **STAGED ONLY — no Netlify, APK, Supabase migration, test-member creation or live vote.**
- Existing production 57 profiles, 23 original claim dossiers, current source-first research, source return, R3, current community votes, W.NE, ads hard OFF, and GA4 removal are preserved.
- Narrowly ported M64 claim-specific UI (5 evidence criteria, max 25/30/25/10/10, Unknown distinct from zero), CSS and independent claim-approval registry with `approvedClaims:[]`. Extended `assets/people-directory.js` with an attributed claim-ID hook and optional M64 module mount — no unrelated rebase.
- `assets/community-test-config.js` **hard-codes `whoEvidenceBallots:false`**. The default browser uses no vote SDK and no ballot network/DB requests. Direct URLs/query flags never grant voting permission.
- Explicit exact assets in the strict public allowlist; synthetic test fixtures, SQL, backend data and docs remain private in the repo, not shipped publicly.
- Future screens explain **post-publication claim closure**, member withdrawal, automatic aggregate retirement and irretrievability of third-party screenshots before any member saves a vote.
- SQL is ported in `docs/WHO_M63_...`, `WHO_M65_...`, `WHO_M66_...` as **DRAFT ONLY**. No production Supabase schema writes. Connected read-only Supabase table inventory confirmed the Disclosure Desk project has existing forum/news/content votes and Community Research `dd_cr_votes`, but **no `dd_who_m63_*` tables**. Another unrelated Supabase project exists; do not repurpose it as a test environment.
- The current browser QA is with TWO SYNTHETIC in-memory users only. It is not a real Supabase two-account acceptance.

## Offline verification
- `.github/workflows/who-m67-closed-voting-no-deploy.yml` has 3 jobs:
  1. Source contract + production-shaped strict 129-file package. Updated maximum package file count from 127 to 130 only to allow explicit reviewed assets; allowlist and no-private-artifacts checks remain.
  2. Real headless Chromium on the actual Who's Who page, 320/393/820/1280. With feature off: no ballot or remote request. With synthetic flagged test mocks: exact-claim invitation, 5 criteria, 0 versus Unknown, account A/B private persistence and independent withdrawal, anonymous/guest refusal, mismatched claim-version block, 14-tab nav and no overflow.
  3. Disposable PostgreSQL 17 with real row-level-security tests and isolated *separate disposable database* for M65 publication/M66 withdrawal fixture so each scenario starts clean. No live project credentials.
- On code commit `1208f28ad033aa3b03a00ec0b19d95a38045b2c1`, all three jobs **passed**, including no-deploy Chrome and SQL (run 44431280786). A subsequent UI-copy update and this handover require exact-HEAD CI again.
- Initial failures were staging harness-only: (a) outdated public package-count cap, (b) cumulative M63/M65 fixtures in one DB, (c) repeated global database role creation. These were corrected in tests; no production change.

## Release blockers (do not merge / deploy to live)
1. Independent security audit for drafted M63/M65/M66 schema/trigger privileges, concurrency and individual-vote privacy; align with current Supabase auth/JWT/RLS and Data API settings.
2. Genuine nonproduction test backend (avoid modifying production without an explicit migration plan), with two real distinct QA accounts plus anonymous and guest. Verify version/claim exactness, write/update/withdrawal/cooldown, login switching, public aggregates and service-role boundaries; **no production user records during CI**.
3. Two independent human editors must approve the *specific incident claim, verbatim statement, primary source URL and version*. The registry is deliberately empty, there are no live claim records or member votes.
4. Decide the trade-off: one post-publication withdrawal automatically retires the entire aggregate, and screenshots cannot be retrieved. Inform users before voting. If unacceptable, redesign policy before release.
5. Owner release signoff and full website regression; then Android M95-based beta check for Back, profile, keyboard and voting layout. Do not merge Who M66's historical branch wholesale.
6. Keep Adsterra separate and disabled pending written reply.

## Next Android track
After M67 closed-voting candidate QA, resume APK from `android/m95-restore-editorial-layout-nov13`, not M94. Preserve premium navy/gold editorial bottom navigation/full News and compact native header with profile photo + Support. Avoid overwriting M95's local beta data. Focus notification deep-link / account-scoping and testing first, then saved research, settings, back/keyboard refinements. Do not merge the stale full Android history into current website production.
