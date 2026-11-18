# Community Research M02 — Private Drafts & PostgreSQL RLS

Date: 18 November 2026, Europe/London
Branch: prep/community-research-m02-rls-private-drafts-20261118
Status: STAGED ONLY — NO LIVE NETLIFY DEPLOY, SUPABASE MIGRATION OR APK.

## Implemented

1. docs/COMMUNITY_RESEARCH_M02_SQL_DRAFT_ONLY.sql contains six separate RLS-protected tables: dd_cr_drafts (private author-owned drafts); dd_cr_publications (published/withdrawn registry); dd_cr_editions (immutable publication revisions); dd_cr_votes (individual member-only vote identity); dd_cr_comments (source, counter-evidence, support, question, correction feedback); dd_cr_reports (member-private reports). These do not exist in production. The SQL has been run only against a disposable PostgreSQL 17 GitHub Actions database.
2. Registered authors can save, update or delete their own drafts with auth.uid() ownership, immutable server-assigned author ID, revision increments and JWT is_anonymous rejection. Guest and anonymous-authenticated sessions cannot write. Public paper/edition tables have no ordinary client INSERT/UPDATE/DELETE grants and there is no public publishing RPC, elevated browser credential or SECURITY DEFINER function. No private W.NE database is copied or exposed.
3. Public visibility policies distinguish published from withdrawn papers, maintain immutable historical edition rows, allow public guest reading of visible comments and keep raw votes and moderation reports private. Votes reject withdrawn papers and duplicate same-member ballots. Replies must attach to a visible root comment on the same paper. Account deletion cascades to that user's authored and engagement records.
4. assets/community-research-private-drafts.js is an owner-scoped, fresh-auth, revision-aware listMine/saveMine/deleteMine adapter with HTTPS source checks and no localStorage caching. The new communityResearchBackend:false setting keeps it INERT on all hosts (including test hosts). Its internal test host guard also disallows production activation. Existing researchPublishing:false remains OFF. No live UI button invokes this adapter or writes a paper.
5. community-research.html includes the inert adapter and configuration; scripts/build_public_release.cjs explicitly allowlists it; package and static contract tests confirm SQL, fixtures, internal documents and private data are excluded. Existing premium navigation, Discussions, M01 preview, WHO M63, international source M40 and all production data are unchanged.

## Verified on synthetic accounts (NOT real member accounts)

The disposable SQL suite covers: guest public read; anonymous-authenticated author/vote/comment exclusion; owner draft CRUD and revision increments; cross-account draft read/update/delete rejection; prevention of author ID edits and public edition edits; public historical editions; withdrawn-paper isolation; private vote/report visibility; duplicate votes/reports; refusing engagement with withdrawn papers; same-paper replies and rejection of cross-paper replies; account deletion cascades; and absence of public publication INSERT rights.

Node adapter tests check the disabled flag and production deny, fresh identity, account switching, author and revision query filters, invalid sources, no W.NE writes and no public publish calls.

## Source files and checks

- docs/COMMUNITY_RESEARCH_M02_SQL_DRAFT_ONLY.sql
- scripts/fixtures/community-research-m02-postgres-bootstrap.sql
- scripts/fixtures/community-research-m02-rls-test.sql
- scripts/test_community_research_m02_contract.cjs
- scripts/test_community_research_m02_adapter.cjs
- .github/workflows/community-research-m02-rls-no-deploy.yml

## M03 release blockers

Build a reviewed atomic author-consent publish/revise/withdraw API with server-side ownership, rate limits and a separate immutable public copy; then authenticated feedback, private voting aggregates, abuse controls, moderation queue, copyright/privacy processes and source verification. No popularity score should be presented as evidentiary truth. Integrate published papers with browse/search and W.NE while keeping original W.NE documents private. Apply only in an approved isolated test Supabase project first. Run its advisers, two distinct signed-in test accounts, guest/anonymous, physical Samsung/Android navigation and consolidated QA. Publish only on explicit approval. Keep the flags OFF in M02.

## Documentation

https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/auth/auth-anonymous
Previous milestone: docs/COMMUNITY_RESEARCH_M01_HANDOVER_2026-11-18.md
