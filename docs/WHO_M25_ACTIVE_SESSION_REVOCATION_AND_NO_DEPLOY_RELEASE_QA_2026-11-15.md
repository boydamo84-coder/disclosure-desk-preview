# Who’s Who Milestone 25 — logout-safe voting, Auth session ownership and end-to-end regression

**15 November 2026 · isolated development branch only · no deployment**

## Outcome: fail-closed real GoTrue session lookup now tested

M24 demonstrated that signing out revokes the refresh token but leaves a formerly issued access JWT cryptographically valid until expiry. M25 fixes that **for vote mutations** in the **UNAPPLIED SQL design**, rather than claiming full bearer invalidation.

The revised `dd_who_private.dd_who_claim_rating_set_impl` now:
1. Validates the authenticated `auth.uid()` and excludes signed-in anonymous `auth.jwt()->>'is_anonymous'`.
2. Reads the `session_id` from `auth.jwt()`, and **rejects absent or malformed UUIDs**.
3. Requires a row in the real `auth.sessions` matching **both** that exact `session_id` and the same `auth.uid()`; another person's active session ID cannot authorize a vote.
4. Acquires `FOR SHARE` on that session row during the voting transaction. This orders a simultaneous session delete and vote: a committed logout before the lookup prevents any new ballot, whereas an already-started authorized transaction completes before the deleting logout can commit. It does not claim to retroactively undo a vote committed before logout.
5. Retains the per-account advisory mutation lock, one account/claim primary key, no raw table privileges, enabled-and-reviewed-claim guard, 3-minute cooldown, 30-new-vote rolling-day limit, 5-member anonymity threshold and private `SECURITY DEFINER` worker with unprivileged public RPC wrappers.

Crucially, the session gate does **not** delete an existing ballot when a person logs out; removal remains tied to normal account deletion or separately authorised moderation. A signed-out user with an unexpired JWT may still read `my_rating` in the summary API until expiry; **only write RPCs gained mandatory active-session checks** this milestone. Further review must decide whether signed-out private read access also requires active-session verification.

The reference source is [Supabase's User sessions guide](https://supabase.com/docs/guides/auth/sessions), including JWT `session_id` and `auth.sessions` row checks. Its guidance explicitly warns that time-boxed or inactive sessions can stay in the table until progressive cleanup, so **session row existence alone must not be overstated as validating every possible hosted timeout configuration**. Hosted expiry/inactivity limits, user ban/account deletion, real key rotation, permission grants and production settings still require separate testing and security signoff.

## Exact green CI evidence — four isolated workflows

| Verification | GitHub Action | Exact code SHA and result |
| --- | --- | --- |
| **Real GoTrue sign-up, login, anonymous identity, token refresh, logout and valid-session write guard** | [run 43766319072](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43766319072) | **SUCCESS** at `2729dca6cbf083d5dbd9b81250a50d9f495c52e1`: **71 real local Auth/JWT/vote assertions**; post-logout vote on a *different enabled test claim* is denied by **SQLSTATE 28000**, while a different still-signed-in member may rate it |
| **Actual PostgreSQL 17, permissions and concurrent writes** | [run 43766457174](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43766457174) | **SUCCESS** at `5db2abda2f7eb32d78243b3918e2122e6f300b83`: original raw-role, claim, privacy and concurrency suite plus explicit missing, malformed, cross-user and deleted-session negative tests; deleting a session does not delete its prior vote |
| **Signed PostgREST HTTP JWT and private-schema isolation** | [run 43766254960](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43766254960) | **SUCCESS** at `a17b3cb6e103b6b1187e529282bf78779832ce36`: 5 synthetic signed accounts, zero raw table access, valid-signature but missing or wrong-user `session_id` denied |
| **Source/package QA and four-viewport Chromium** | [run 43766550524](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43766550524) and [run 43766550445](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43766550445) | **Both SUCCESS** on `398554f46705521ffef06aaa66e7e4e668b43401`: **57 static SQL safety assertions**; **116** public-allowlist files SHA-256 verified; 50 Who's Who profiles, 23 claim/recommendation drafts, 27 unscored role/FOIA records, 89 research references, 17 distinct original publication URLs; original navy/gold 14-tab nav, responsive phone/tablet/desktop and no voter UI activated |

The existing GoTrue integration uses `supabase/gotrue:v2.197.0`, `postgrest/postgrest:v14.18` and `postgres:17-alpine` on GitHub's **temporary isolated containers**, with test-only keys and fictional users. No connected Supabase project, live database, Netlify service or real member was used. The earlier M24/GoTrue setup failures were repaired and the latest runs are genuinely green.

## Mock-to-real regression changes

- `docs/WHO_CLAIM_RATINGS_SQL_DRAFT_ONLY_2026-11-15.sql`: added the strict session UUID/owner row check and `FOR SHARE` lock **only to the private voting worker**; **no live SQL migration exists**.
- `scripts/who_rating_ephemeral_pg_bootstrap.sql` and `scripts/who_rating_ephemeral_pg_assertions.sql`: synthetic `auth.sessions` fixture table with no guest grants, positive per-user session claims and negative missing/malformed/other-user/deleted-session tests.
- `scripts/who_rating_ephemeral_pg_race.sh`: both concurrent psql requests now include the proper synthetic session context; serialization and cooldown still pass.
- `scripts/who_rating_signed_jwt_http_seed.sql` and `scripts/test_who_rating_postgrest_jwt_http.cjs`: synthetic HTTP bearer sessions seeded; even a correctly signed JWT without a matching active session is rejected.
- `scripts/who_rating_gotrue_ephemeral_seed.sql` and `scripts/test_who_rating_gotrue_e2e.cjs`: a second completely fictional enabled claim prevents the cooldown from masking the logout test. GoTrue issues a real JWT with `session_id`, writes succeed while active, after logout the exact same valid JWT cannot rate the second claim, and another still-active GoTrue member can.
- `scripts/test_who_rating_backend_draft_static.cjs`: guards the session claim, active row, owner ID matching, fail-closed rejection and session row lock; **57 assertions passed**, as seen in the source job log.

## Editorial and release state (unchanged by a successful security test)

There remain **50** public subject profiles and **23** provisional person-attributed claim or recommendation evidence panels, **27** role/FOIA-only scope panels and **89** researched items. The 23 still do **not** have an independent human original-record approval or a completed second-editor signoff; scientific/policy proposals stay **Not applicable** to incident evidence scores. **No real 0–100% editorial claim ratings, community ratings, voters or individual honesty scores were assigned.** Portraits remain 20 catalogue/Commons source listings under review and 30 initials; no legal final rights approvals were obtained.

For an eventual controlled launch, keep the unscored, traceable evidence reader distinct from **claim-specific** numerical scores and signed-in community voting. Do not enable ratings for any unapproved source, do not assert an aggregate credibility percentage about a person, and include original citations, uncertainty and counterevidence.

**Blocking before production:** trusted independent qualified source/rights reviewers and signoffs; review of actual connected Supabase project **Data API exposed schemas**, active-session semantics and permissions, JWT expiry/inactivity timeouts, signed-out private `my_rating` reads, account moderation and deletion; real user acceptance and rollback. Owner-approved staged deployment only after those checks, preferably with a fresh production-derived, narrowly scoped candidate rather than merging hundreds of internal research commits.

The live `production` branch was confirmed unchanged at `6b602324d14b834b0ef5ac222d3cae3acbf53a56` during M25. No Netlify credits, real Supabase writes, APK/Play Store, private encrypted R3 notebooks or W.NE changes occurred.

## M26 next

Advance *independent original-source review* and picture legal signoff for the first claims, with an auditable first and second editor who are real, separately identified humans; prepare a production-derived **read-only first release candidate** if safe/approved. Do not use the work of a language model as a substitute for actual independent human evidence and picture-rights review. The 0–100 claim-scoped ratings and voting can be a subsequent tightly staged release once the remaining hosted authentication/security gates are cleared.
