# M75 — real Supabase Auth two-account test preparation (SAFE STAGING ONLY)
19 November 2026, Europe/London

## Intent and identities
Owner selected two separate existing email identities for M75 QA. Names and addresses are intentionally NOT stored in any committed script, workflow, test fixture, issue or handover. Use private local environment variables for Account A and Account B. Do not post passwords, tokens, one-time codes or keys to GitHub/ChatGPT.

## Current state
- Two pre-existing Supabase projects exist: one is the LIVE Disclosure Desk database, the other an unrelated personal project belonging to the existing organization. **Neither is approved for migrations or Auth test-account creation.**
- There is no confirmed dedicated sandbox or server-issued test account token. **No real Supabase Auth testing has happened yet.**
- The owner must select an organization for a **new isolated QA project**. Project creation may have nonzero cost requiring explicit consent.
- M75 staged scripts are fail-closed. Both known pre-existing project refs are rejected. Live repo and Netlify do not change.

## Offline-only GitHub Actions
- scripts/who-m75-supabase-auth-preflight.cjs — secure real Auth/Data API acceptance runner for an *independently approved new project*, not run by CI against Supabase.
- scripts/test_who_m75_supabase_auth_preflight.cjs — mocks the Supabase Auth and PostgREST APIs entirely inside Node; synthetic addresses and tokens only; never attempts network.
- .github/workflows/who-m75-auth-harness-no-live.yml — private/offline contract tests plus strictly allowlisted public package.
- Existing M74 real concurrent PostgreSQL tests stay green separately, but do not substitute for genuine Supabase-issued JWTs.

## How real QA will work once owner approves a new project
1. Provision a separate Supabase Auth sandbox in an owner-selected organization (with any billing confirmation).
2. Have both users register/sign in independently via a secure *local* test-only flow. Do not reuse Disclosure Desk production passwords; no credentials in GitHub or ChatGPT.
3. Obtain two distinct short-lived Auth access tokens privately in the local process, via Supabase login on that new project. Do not commit tokens or print them in terminal output.
4. Set private environment variables: DD_M75_PROJECT_REF, DD_M75_OWNER_APPROVED_REF (must exactly match), DD_M75_URL, DD_M75_PUBLISHABLE_KEY, DD_M75_ACCOUNT_A_EMAIL, DD_M75_ACCOUNT_B_EMAIL, DD_M75_ACCOUNT_A_ACCESS_TOKEN, DD_M75_ACCOUNT_B_ACCESS_TOKEN.
5. Run "node scripts/who-m75-supabase-auth-preflight.cjs auth-only" to verify server-issued token identity. This mode makes **no database writes**.
6. After independent security review, install M63/M65/M66/M72 **draft schema only in this new sandbox**, seed an original FICTIONAL claim with ID prefix m75-sandbox- and claim version 1; approvals remain explicitly test-only.
7. For actual synthetic ballots in sandbox, additionally set DD_M75_TEST_SCHEMA_REVIEWED=true, DD_M75_TEST_CLAIM_ID=m75-sandbox-[random-test-suffix], DD_M75_ALLOW_SANDBOX_WRITES=I_APPROVE_TEST_ONLY_BALLOTS and run "node scripts/who-m75-supabase-auth-preflight.cjs sandbox-write". It verifies 0 versus 25 scores, owned rows, refusal of cross-account reads/changes, A's permanent withdrawal, and guest raw-data denial. The test is one-time per claim/version; a rerun needs a fresh fictional test claim to avoid duplicate ballot rows.
8. Two-human real editorial approval, independent security audit, privacy policy and owner approval of withdrawal/aggregate retirement remain separate launch gates. Real Auth tests do not enable live voting.

## Important limits
The script's use of two Auth user IDs is stronger than synthetic JWT role settings, **but none of these steps has been executed against a live Auth backend**. The script intentionally rejects both currently connected projects. A publishable key is only a project identifier/key, not a substitute for authenticated user access; never put a service_role/secret key into a client or QA script. Account-specific RLS always belongs in the database.

Live M70 website remains unchanged. The experimental M67→M75 branch must never be merged wholesale into current production. Who evidence ballots remain OFF, the public approval registry remains empty, Adsterra remains OFF.
