# Who's Who M23 — signed JWT/API verification, public package audit and controlled release plan

**Research branch only — Sunday 15 November 2026, Northern Ireland. No live changes or publication.**

## Exact verified M23 result

- **Signed HTTP JWT + database contract:** [GitHub Actions run 43756483183](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43756483183), **SUCCESS** for exact SHA `12a89a0220992097db2f664a7e8a2c167d5e3786`. Official PostgREST `postgrest/postgrest:v14.18` and PostgreSQL 17 ran in throwaway GitHub runner containers, using local loopback and a deliberately synthetic HS256 test signing key (NOT any existing Supabase secret). The real HTTP runner reported **53 signed JWT and RPC assertions passed with 5 fictional accounts**.
- **Source, strictly allowlisted public website package and responsive browser:** [GitHub Actions run 43756753595](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43756753595), **SUCCESS** on exact SHA `5be8e06c3d48bdf7536d47a2c97c94e03d14c303`. The source job confirmed the original evidence contract, 17 unique publication URLs across 23 attributed claim/recommendation records, 50 static SQL design checks, and the whole `scripts/build_public_release.cjs` package. **116 published-allowlist files** were individually hashed and verified against the SHA-256 manifest by the new `scripts/test_who_public_package_boundary.cjs`; **0 internal SQL/test/fictional-account fixture files** were included. The real Chrome acceptance job also completed successfully. No Netlify build/deploy was called.
- The separate [M22 actual PostgreSQL security/race run 43741083401](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43741083401) remains green, and the M23 bootstrap compatibility change was rerun green in [run 43756148043](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43756148043). The M23 PostgREST test **adds cryptographic signed-token validation**, not real hosted GoTrue authentication.

## Real API security behaviour observed in the isolated HTTP test

`scripts/test_who_rating_postgrest_jwt_http.cjs` created HS256 bearer tokens locally for five fabricated UUIDs. The actual PostgREST gateway verified their signatures and expiry/audience before it executed the proposed SQL RPCs. Tests observed:

- No bearer: guest read-only summary works, but vote RPC and protected raw table reads are denied.
- Bad signature, expired or malformed bearer and wrong `aud`: vote attempts rejected.
- Signed token for `authenticated` role with `is_anonymous:true`: voting denied.
- Real PostgREST profile visibility: `dd_who_private` cannot be selected using the correct **POST `Content-Profile`** header and private definer function cannot be invoked as an exposed RPC. An earlier failed test incorrectly used `Accept-Profile` for POST; that was corrected, not waived.
- Two authenticated synthetic accounts have distinct `my_rating`, cannot read the raw vote table, and see low-count community means hidden until five votes. The hypothetical fifth vote reveals the mean; account-specific ratings stay private.
- Unknown, disabled, malformed and out-of-range voting rejected; 3-minute edit cooldown enforced.
- These are **true HTTP signed JWT verification tests** against PostgREST and a disposable Postgres, *not* a real Supabase Auth/GoTrue login, hosted JWT signing-key rotation, live session invalidation or full user moderation review.

The harness uses only `who_evidence_ci`, restricts the PostgREST exposed schema list to `public`, uses two test-only roles plus a local login role, and cannot access the user's real Supabase projects. Production keys never enter CI. The fake claims and reviewer names exist **only in the test container** and are not real editorial approvals.

## Read-only connected Supabase project audit

The connected organisation has **two active Supabase projects**: one explicitly called **Disclosure Desk** and one generically named. **Neither is explicitly marked or authorised as disposable test staging**. No tables, users, keys, settings, or rows were changed on either connected project.

On the named Disclosure Desk project, read-only schema metadata shows all currently returned `public` tables have RLS enabled. **Neither `public.dd_who_reviewable_claims` nor `public.dd_who_claim_ratings` is installed**, so real member voting has NOT begun.

The connected project's security adviser returned these existing findings (not necessarily introduced by Who's Who, and not proof of an exploit): **15 WARN** anonymous-executable `SECURITY DEFINER` RPC notices, **65 WARN** authenticated-executable `SECURITY DEFINER` RPC notices, **21 INFO** tables with RLS enabled but no policies, and **1 WARN** for leaked-password protection. An RLS-no-policy table may intentionally deny access; some definer RPCs may be deliberate and controlled. None should be modified wholesale: each needs a separate purpose/permission/behaviour audit so working chat, profiles and discussion features are not broken.

Remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Supabase's **4 November 2026 CLI v3** breaking change also underscores the need to inspect the current CLI help and project targeting before any genuine migration. Do **not** convert the draft SQL into a migration or run it against either connected active project without explicit staging scope and rollout consent.

## Public website packaging and branch integration

`netlify.toml` uses `node scripts/build_public_release.cjs` with publish root `.release-staging/public-site`, not the repository root. The build has an exact public web allowlist, and the M23 package test checks every shipped file's SHA-256 plus absence of `docs/`, `scripts/`, `supabase/`, SQL migrations, synthetic JWT tests, private account and research fixtures. Result: **116 files** with no internal test content; release is **not deployed**.

At initial M23 read-back, this research branch was **274 commits ahead of `production`** (subsequent test changes add more). Do **not** merge all historic research/test commits into the live release indiscriminately. When the independently reviewed reader is ready, prepare a fresh release candidate from the **latest verified production baseline** and port only the approved site files and safe reader tests. Keep the R3 encrypted notebook/W.NE files, signed-JWT fixtures and proposed SQL separate. Re-run exact-code no-deploy Chromium and strict-package QA; get an actual owner deployment decision at that point.

## Release state and blockers (15 Nov 2026)

| Stage | State | Exact requirement |
| --- | --- | --- |
| 50-profile sourced directory | **Prepared and browser-tested** | 50 people, 23 attributed claim/recommendation drafts, 27 other role/FOIA scopes, 89 research evidence items; source lineages accessible |
| Editorial site numerical evidence ratings | **NOT READY** | Every individually published numeric claim requires inspectable full original, methodology/independent source tracing, verifiable named editor and genuinely independent second-editor approval. **0 real approvals** now. Policy-only records must show N/A, never 0. |
| Portrait reuse | **Rights review unresolved** | 20 Commons source listings checked, 30 initials used by design, **0 named final photo-rights signoffs**. Resolve individual source/identity/crop/personality and licence caveats before further portrait release. |
| Member rating storage | **Draft tested but NOT APPLIED** | One vote per approved claim/account, approved claim registry, daily cap, cooldown, count >=5 for public mean, private definer workers and invoker wrappers. |
| API JWT and responsive security | **Local tests GREEN** | 53 signed HTTP assertions, two-client PostgreSQL race, 50 static safeguards, 116-file package, Chrome at 320/393/820/1280 |
| Actual Supabase Auth + Data API staging | **NOT READY** | An expressly designated **new disposable** staging project or safe local Supabase Auth stack, real Auth JWT (two test members and guest), anonymous sign-in, expired/revoked access, sessions, account deletion, Data API exposed-schema checks and security advisors. Never borrow the named production project for this. |
| Website live deployment and pinned announcement | **ON HOLD** | Owner-approved reviewed release candidate, Netlify deploy only for significant final changes, 14-tab nav/Back/source panels checked after publish, pinned research update revised only when feature is actually online. |

**No numerical site or community score is available for any real named individual or claim.** This is a claim-evidence feature, never an aggregate honesty/person rating. Existing live Disclosure Desk production remained unchanged throughout M23. No Netlify credits, live Supabase SQL/users, APK, Play Store, production branch, encrypted R3 vault or W.NE document modifications.

## Recommended M24

Prepare a dedicated, explicitly approved and cost-reviewed test target for **real Supabase Auth/GoTrue** (not PostgREST alone), execute genuine two-account/JWT role and session tests, then run database advisor review without exposing `dd_who_private`. In parallel complete at least a small number of named independent source and portrait-rights assessments for a **claim-by-claim limited release**, rather than inventing aggregate numbers for all 50 personalities. The initial public launch can show unscored transparency panels for incomplete cases; only independently approved claims should show a 0–100 evidence score or voting controls.
