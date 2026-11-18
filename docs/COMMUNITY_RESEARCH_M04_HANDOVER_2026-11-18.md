# Disclosure Desk — Community Research M04 Handover

_Date: 18 November 2026 (Europe/London)_  
_Branch: `prep/community-research-m04-my-research-recovery-20261118`_  
_Status: STAGED AND OFFLINE-TESTED; NO PRODUCTION DEPLOY OR SUPABASE MIGRATION._

## Delivered

**My Research author dashboard:** `my-research.html` is a separate, noindex navy-and-gold author portfolio linked from the staged `community-research.html` library. No additional bottom navigation tab. Features include server-derived private-draft listings, current published papers, withdrawn papers, title/subject filtering, older-page navigation, read-only published edition histories, private draft editing with exact revision conflicts and re-read verification, and guarded withdrawal with an explicit typed confirmation. A W.NE link stays available, but editing a Disclosure Desk private draft never edits or publishes the original W.NE document. Public editions cannot be silently overwritten by a draft save.

**Owner-only backend recovery:** `docs/COMMUNITY_RESEARCH_M04_RECOVERY_SQL_DRAFT_ONLY.sql` adds `dd_cr_private.list_my_papers` in the unexposed private schema, plus a public **SECURITY INVOKER** RPC `dd_cr_my_papers` for authenticated accounts. The internal service checks `auth.uid()` and JWT `is_anonymous`, never accepts a caller-supplied author ID, and returns only the user's paper IDs, optional linked draft IDs, current edition, status, title/abstract/type, source count, and dates. It includes withdrawn work and publications whose source draft was subsequently deleted; it never returns other members' private records, raw vote or report identities, email addresses, or private W.NE manuscripts. It does **not** insert, revise, delete, publish, withdraw or seed any records.

**Client:** `assets/community-research-recovery.js` reads the owner-scoped RPC and, for an owner-selected paper, reads immutable editions under M02 RLS. `assets/community-research-dashboard.js` renders untrusted text with `textContent`, validates HTTPS source links before rendering, rechecks account identity before sensitive actions, clears displayed private text on account switches and tab backgrounding, and stores no manuscript in browser localStorage. The author portfolio paginates published papers (20 per page, bounded server requests), while the M02 private-draft API currently exposes only the **50 most recently edited drafts**; a complete paginated draft archive is a follow-up requirement. The dashboard performs no writes to public paper or edition tables.

**Deployment safeguards:** The feature flags remain false on every host: `communityResearchTestDatabase:false`, `communityResearchBackend:false`, `communityResearchPublishing:false`, `communityResearchRecovery:false`, and `researchPublishing:false`. Inert adapter code also explicitly refuses the existing live Disclosure Desk Supabase project URL and production hostname. The dashboard is safely empty until an approved **separate test Supabase project** is configured. No real research accounts, W.NE libraries, member comments, votes, public papers, API tables, Netlify builds or APKs have been altered. M04 SQL, tests, internal handovers and fixture documents remain excluded from the public-site allowlisted package.

## Verified with isolated accounts and real Chrome

A GitHub Actions **NO DEPLOY** workflow `.github/workflows/community-research-m04-recovery-no-deploy.yml` runs three jobs:

1. M01–M04 Node/static contracts, cold feature-gates, private-data non-persistence and release package allowlist.
2. Disposable PostgreSQL 17, building M02 + M03 + M04 SQL in that order, with synthetic users A and B plus guest/anonymous sessions. Tests verify owner-only recovery, cross-account isolation, withdrawn-paper visibility limited to its author, recovery after linked draft deletion, pagination bounds, safe return metadata and private mapping denial.
3. Real Chromium across widths 320/393/820/1280, including inherited M01 and M03 regressions, mocked author portfolio: private draft read, revision save, edition 1 vs 2, typed-withdraw safeguard, owner-account switching and clearance of private document content. Browser test uses only an in-memory mocked server: it is not proof that a real Supabase project has been migrated.

Verified code run: [GitHub Actions 44304361820](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44304361820) **SUCCESS**. Recheck the latest exact-head run following handover-only commits.

## Next stage (M05 / release gates)

- Create an explicitly isolated nonproduction Supabase project, then apply reviewed M02/M03/M04 SQL **only there** with owner approval. Run Supabase security advisers and verify private schema not exposed in Data API.
- Two distinct real authenticated test users, guest and anonymous login; sign-out/relogin, lost browser session, physical Android device, draft save conflicts, cross-account view/edit blocks and actual RPC readback/recovery.
- Improve drafts archive pagination (currently maximum 50), add server-backed author index and edition deep links, and verify access when source draft is deleted or owner account is removed.
- Stage source-verification, rights/plagiarism reporting, moderation, paper correction/withdrawal UX, and usefulness-only voting before any community submissions can go live. A vote is not a factual truth percentage.
- Release only after independent `SECURITY DEFINER` audit, proof against real isolated database, physical Samsung Android keyboard/back/gesture testing, complete regression against existing social/Who’s Who and Sources features, and explicit approval of a consolidated significant Netlify deployment.

## Related milestones

- `docs/COMMUNITY_RESEARCH_M03_HANDOVER_2026-11-18.md`
- `docs/COMMUNITY_RESEARCH_M02_HANDOVER_2026-11-18.md`
- `docs/COMMUNITY_RESEARCH_M01_HANDOVER_2026-11-18.md`
