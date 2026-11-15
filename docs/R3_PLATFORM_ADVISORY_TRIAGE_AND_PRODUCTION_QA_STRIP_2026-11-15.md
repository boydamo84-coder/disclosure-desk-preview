# Disclosure Desk R3 — platform advisory triage and production-only QA stripping

**Date:** 15 November 2026  
**Branch:** `queue/dd-web-r3-from-r2-nov14` · **Reviewed executable SHA:** `3b5de1000f3973490038cfa548a086d980f15b3e`  
**Release state:** PR #13 **DRAFT**; no Netlify production publication/merge; user test data and other Boyd Digital Studios projects untouched.

## 1. Concrete release hardening — no internal R3 diagnostics in production

Prior hosted R3 builds included the opt-in, preview-only signed-session security panel and its helper JavaScript in the static production package, even though runtime hostname checks prevented activation on the production domain. Exposing unused diagnostic code and account UUID entry UI is unnecessary in a published release.

The build now uses **Netlify's read-only, documented `CONTEXT=production`** at build time:
- In production: `research/r3-lab/index.html` contains **no R3 account-isolation QA panel or testing script tag**; `research/r3-lab/hypothesis-session-qa.js` is **not copied into the public output/manifest**.
- In `deploy-preview` and local no-deploy builds: hidden opt-in diagnostic tool is retained for controlled account isolation acceptance, preserving the existing A/B test workflow.
- The actual R3 cloud adapter, account verification, encrypted vault, Research Gap Finder and original 14-tab dock remain unchanged.
- `scripts/test_public_release_package.cjs` verifies both contexts. The R3 hosted no-deploy GitHub workflow independently constructs a **second `CONTEXT=production` static package**, checks all dependencies and asserts that no diagnostic HTML/script remains. The PR preview and local Chromium suite test the *preview* variant separately.
- Netlify's official documentation identifies `CONTEXT` as a read-only build variable with `production`, `deploy-preview`, `branch-deploy` and `dev` variants: https://docs.netlify.com/build/configure-builds/environment-variables/

**Source/test CI:** R3 hosted [GitHub run 43665268316](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43665268316) **both source-package and hosted-browser jobs SUCCESS** at exact executable SHA `3b5de1000f3973490038cfa548a086d980f15b3e`. Public release package [43665271666](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43665271666) SUCCESS and mobile Chromium [43665271642](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43665271642) SUCCESS at the same code. R2 integrated browser CI [43665271662](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43665271662) was **still running at time of writing**; do not call it PASS until completed.

## 2. Live Disclosure Desk Supabase advisory triage — read-only examination

Project: `omqxizswzcwgzqaczlhe`. Supabase security advisor results and PostgreSQL metadata were inspected without changing any schema, permissions, accounts, passwords or encrypted backup rows.

| Advisor | Reported count | Evidence / disposition |
|---|---:|---|
| RLS enabled with no policy | 21 INFO | All 21 inspected tables additionally deny direct `anon` and `authenticated` SELECT and INSERT privileges. These include private chat, forum, avatar, vote/moderation and internal rate-limit storage. Intended RPC-only access is consistent with this configuration. No blanket auto-policy or direct GRANT justified. |
| Anonymous-executable SECURITY DEFINER routines | 15 WARN | Fourteen are **STABLE/read-only** routines returning filtered public discussions, comments, approved hearing chat, visible avatars, vote totals or approved media ranking; sampled definitions include visibility filters, parameter limits and sanitised public identifiers. The fifteenth is `public.rls_auto_enable()`, an event-trigger maintenance routine, not a regular site read API. The linter is warning about exposure, not proving a leak; review and consider revoking PUBLIC/anon/authenticated EXECUTE on the event-trigger function after a separately reviewed dependency check. Do **not** revoke the public read APIs indiscriminately or public sections of the live site may stop working. |
| Authenticated-executable SECURITY DEFINER routines | 65 WARN | Privileged functions support private chat, discussion post/flag/vote, moderation, account research and internal helpers. All 65 set a function `search_path`; none have unbounded client-supplied dynamic SQL in the source scan (the one dynamic SQL exception is the internal `rls_auto_enable` event trigger, using PostgreSQL `format('%I')` identifiers). Most use `auth.uid()` or a registered-account/owner/moderator helper. Owner moderation, chat report queue and research document RPC definitions were spot-checked for identity or owner predicates. No public-schema CREATE capability for `anon` or `authenticated`. **These are not independently penetration-tested**; preserve original RPC calls, review the more sensitive mutation functions in a future dedicated security audit. |
| Leaked password protection | 1 WARN | Current Supabase Auth warns this protection is not enabled; official docs indicate leaked-password checking is available on Pro and above. Confirm subscription/availability before enabling, as it may affect sign-up or password-change flows; not safe to assume project plan. https://supabase.com/docs/guides/auth/password-security |

**Permission summary:** 79 SECURITY DEFINER functions in public; 15 `anon`-executable, 65 `authenticated`-executable. `anon` and `authenticated` have **no CREATE privilege on public schema**. All security-definer functions explicitly set search_path (including 12 using public-only path); current CREATE grants limit common search-path shadowing threat, but these routines still require periodic review.

**R3 notebook status:** Two encrypted backup rows existed at previous read-only count, with RLS enabled and FORCE RLS, four auth.uid()-scoped policies, and no R3-table-specific advisor finding. Owner has reported real signed browser checks of A↔B read denial, wrong/correct passphrase recovery, sign-out and reconnection. No plaintext notebook content, user IDs or bearer JWTs were read for this audit.

## 3. Remaining security/deployment decisions

1. **No automatically-applied permission changes:** revoking any of the community read functions or granting no-policy tables broad access could break the currently active R2 app. Stage and review a narrow internal-event-trigger permission hardening migration separately, if desired.
2. **Enable leaked-password protection only if available** and with approval of potential Auth signup/password-change UX changes. Official configuration: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
3. **Independent cryptography/security audit** for truly private or sensitive research remains recommended; tests + source inspection do not certify encryption against every threat.
4. **Owner acceptance of latest preview**, not the earlier executable version: verify original navy/gold 14-tab dock, hypothetical encrypted cloud save/restore, the updated ambiguous-network message, and links from Boards/Profile. The latest preview should retain the opt-in QA tool. Do not clear original Chrome localhost storage.
5. All exact-HEAD/no-deploy R3/R2/mobile CI green, confirm Netlify deploy preview status and published commit correspondence, review production output one final time, then obtain owner's explicit production publication go-ahead and keep known-good R2 rollback `8af0a5a`.

**All findings are scoped to the live Disclosure Desk Supabase project.** No changes were made to Our Cinema, W.NE standalone, other services, user credentials or current R2 production site.
