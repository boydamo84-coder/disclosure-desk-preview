# Disclosure Desk M74 — simultaneous vote/publication RLS test
19 November 2026 · STAGED ONLY · no live deployments, Supabase writes or actual Auth accounts

## Available backend
The connected account has a live **Disclosure Desk** Supabase project and another pre-existing personal project, but neither is designated as an isolated test backend. M74 therefore does not use either. Provisioning another project could incur cost; actual Supabase Auth testing must be planned separately with explicit organization choice and project consent.

## Real PostgreSQL concurrency (not real Supabase Auth)
A fresh GitHub Actions PostgreSQL 17 service on **127.0.0.1:5432**, database **dd_who_m74_ci** only, loads the **draft** M63 owner-RLS, M65 two-editor aggregate publication and M66 frozen/retired aggregate policy. It creates 24 fictional participant ballots and 2 fictitious claim versions, each with two independent fictional reviewer roles; none is a real approved evidence claim.

Two parallel SQL client connections are tested:
1. Admin publication acquires the ballot-table SHARE lock first; a member's UPDATE blocks and is rejected after the version becomes published. Guest sees only the two coarse-approved criteria.
2. Member UPDATE acquires a row-exclusive lock first; admin publication blocks until commit, then recomputes and rejects the outdated editor-signed digest. No stale public snapshots may be created.
3. Different synthetic JWT claims in separate transactions simulate two account identities. Owner RLS must hide the other person's ballot and prevent the other account withdrawing it; anonymous Auth role is denied vote/read, and guests see only coarse published aggregates.

The harness refuses nonlocal hosts, unexpected database names, and cloud-connection environment variables. SQL is synthetic, with no Supabase API/Auth call or member creation. **This is not a genuine two-account Supabase Auth integration test.**

## Gate
Who evidence voting stays `whoEvidenceBallots:false`, approval registry `approvedClaims:[]` and Adsterra disabled; M72 withdrawals remain irreversible in draft. The existing M73 signing process remains unlaunched; no real human editorial approval. Old M67/M72/M73/M74 stage branches are not production-derived and must not be merged wholesale into M70. Launch still requires independent security review and an isolated Supabase Auth project with genuine test accounts, RLS/Data API privilege testing, source verification and owner policy sign-off.

## QA paths
- `.github/workflows/who-m74-parallel-session-no-deploy.yml`
- `scripts/test_who_m74_concurrency.sh`
- `scripts/fixtures/who-m74-setup.sql`, `who-m74-assertions.sql`
No Netlify, APK, live DB, member data or ads are modified.

## Exact CI result and next stage

- [M74 GitHub Actions 44569532917](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44569532917): **both jobs green** on source SHA `f5b3480d2b48a844d54c3f3fcdbc6aa84d85fa82`.
- Verified terminal messages from disposable DB: "M74 SETUP PASS: two unpublished claims, 24 fictional ballots, two distinct reviewer roles" and "M74 PASS: both parallel race outcomes, RLS owner isolation, anonymous Auth denial and guest snapshot privacy".
- Strict package passed: 129 allowlisted public files, excluded internal SQL/QA and local review scripts; M72 and M73 closed-voting tests passed.
- Remaining true Supabase Auth and Data API testing, independent security review and policy/editor approvals are tracked at [M75 issue #15](https://github.com/boydamo84-coder/disclosure-desk-preview/issues/15).
- No existing Supabase project was changed, no new project created, no real users or sample votes created, no Netlify build, APK deployment or Adsterra activation.
