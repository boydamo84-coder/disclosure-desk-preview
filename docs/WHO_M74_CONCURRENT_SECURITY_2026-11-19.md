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
