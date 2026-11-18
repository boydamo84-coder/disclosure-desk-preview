# Disclosure Desk — Community Research M07: Two-Account Pilot

Date: 18 November 2026 (Europe/London)
Branch: prep/community-research-m07-two-account-pilot-20261118
Status: EXISTING SUPABASE PILOT ROSTER INSTALLED — FRONTEND CODE STAGED, NOT DEPLOYED.

## Owner decision and existing backend

Owner explicitly chose the EXISTING Disclosure Desk Supabase project rather than paying for a third project. All work uses existing project `omqxizswzcwgzqaczlhe` (eu-west-1). The previous M06 six public Community Research tables and two private tables were installed empty with all public/member permissions revoked.

### Installed M07 changes

1. Applied `docs/COMMUNITY_RESEARCH_M07_TWO_ACCOUNT_PILOT.sql` to the **existing** project after successful disposable PostgreSQL CI and a live BEGIN/ROLLBACK compatibility preflight. Added the private RLS-enabled `dd_cr_private.pilot_members` table (no read/write permission to ordinary members) and `dd_cr_private.is_pilot()` security-definer membership check. Added restrictive RLS policies to all SIX public Community Research tables, conjoined with M02 ownership/visibility rules. All three existing private privileged routines (publish/revise, withdraw, and owner-paper recovery) now explicitly verify live pilot membership. None of the existing W.NE, social, chat, forum, Auth, or other application tables or functions were changed.
2. Enrolled exactly **two previously owner-approved existing Auth accounts** in the private roster, by matching existing server-side Auth records. No additional Auth account was created or modified. No addresses, account UUIDs, passwords or secrets were committed to GitHub. The allowlist can be disabled server-side by setting `active=false` for a record without altering the public application.
3. Granted only the minimal authenticated role permissions required for allowlisted researchers: own drafts (column-restricted insertion and update, own delete/read), pilot-only publication and edition reads, and guarded publish/withdraw/recovery RPCs. Guests and anonymous users cannot read or invoke these. All other registered members are blocked by the restrictive pilot policy. Community comments, votes, reports and moderation remain inaccessible and are **not launched**.
4. Applied `docs/COMMUNITY_RESEARCH_M07B_STATUS_RPC.sql`. The public SECURITY INVOKER function `dd_cr_pilot_status()` is callable only by the authenticated Postgres role. It returns a single boolean indicating whether the signed-in account is allowlisted. It never returns any roster or account identity. Anonymous visitors cannot execute it.
5. Post-install read-only verification: **2 active pilot accounts**, **0 Community Research drafts**, **0 publications**, **6 restrictive public-table pilot policies** and **6 public Community Research tables with RLS enabled**. Guest paper/draft reads and authenticated roster reads remain denied. The security advisor lists no new anonymously callable Community Research SECURITY DEFINER routine. The three private tables have expected RLS-without-client-policy INFO records.

### Verification: what PASSED, what is STILL UNTESTED

- `scripts/fixtures/community-research-m07-pilot-rls-test.sql`: synthetic identities A and B (allowlisted) and C (nonpilot), signed-in anonymous session and guest. Tested explicit publication consent, private ownership, third-member exclusion, version-preserving correction, owner-only withdrawal, hidden withdrawn content, and immediate pilot revocation in disposable PostgreSQL 17.
- `scripts/fixtures/community-research-m07b-status-test.sql`: status RPC returns true for active tester B, false for revoked A, uninvited C and anonymous sign-in. Guest lacks execute permission.
- `scripts/test_community_research_m07_contract.cjs` and release package QA: website pilot flags only on known production hostnames, no privileged keys, private SQL excluded from public package.
- `scripts/test_community_research_m07_browser.cjs`: tested proposed **production-host page logic with mocked Supabase** at 320, 393, 820 and 1280 px for signed-out visitors, nonpilot members, allowlisted testers and tester sign-out. Inherited M03/M04/M05 Chrome regressions also passed. Code uses the same existing project URL and a pinned browser SDK, but has **not yet been deployed**.
- Verified GitHub no-deploy run: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44315040916 — all three jobs PASS, SHA a381ecbe5509b6cd9bb002f9fc05d6bcb08701d1.
- **NOT YET VERIFIED:** real browser Auth sessions against production PostgREST. An attempted real-project SQL session-impersonation QA call was blocked by tool safety checks and did not run; there is NO claim of a successful live two-user publishing test. Only the live schema, restrictive policies, enrollment and access metadata were independently inspected.
- **NOT YET DEPLOYED:** `community-research.html`, `my-research.html`, adapter and config changes. Nobody can presently use the new pilot from the current live website until a narrowly scoped release is assembled.

### Release safety decision

Do NOT merge this M07 development branch wholesale. Comparing `main` with M07 shows more than 1,800 ahead and 400 behind commits and hundreds of changed files, including unrelated Who’s Who, Source M40, research and Android changes. A direct merge could publish many unapproved staged features. Build an isolated release branch from the **confirmed current Netlify production source** and cherry-pick **only** the pilot pages, required assets and narrowly scoped configuration. Then execute full package/navigation/security tests, check actual Netlify deployment source, perform one significant deployment and have the two existing test accounts sign in on the real site.

Keep research authoring separate from W.NE originals. No automatic document publishing. Use only clearly labelled synthetic test papers, never real witness personal details. Feedback/voting/comments remain disabled pending moderation and evidence-based community review. A usefulness vote must not represent factual truth.

### Security warnings unrelated to this feature

Existing Supabase advisor baseline includes anonymously executable security-definer warnings for legacy app features and a leaked-password-protection configuration warning. This M07 pilot did not remediate them or change other app behaviours. The new private pilot-members table has RLS with no direct client policy by design.

### Next milestone (M07 Release Candidate / M08)

1. Identify actual Netlify production branch and validate no unrelated changes will publish.
2. Assemble narrowly scoped signed-in beta UI release; preserve premium nav and existing user experiences.
3. Deploy once after owner approval and test with both existing accounts on a browser/Android. Guest and third-member denial, genuine RLS, private drafts, explicit publish/revise/withdraw, signout and recovery.
4. Add moderation/copyright/privacy workflows and later usefulness-only feedback before a general launch.
5. Document a fast pilot disable path: `UPDATE dd_cr_private.pilot_members SET active=false` under an owner-authorized admin transaction. Do not apply that change unless necessary.

**State now:** two-account allowlisted Supabase pilot foundation ACTIVE, no live Community Research website feature, all Community Research tables empty, no third Supabase project, no Netlify deploy/credits spent by M07.