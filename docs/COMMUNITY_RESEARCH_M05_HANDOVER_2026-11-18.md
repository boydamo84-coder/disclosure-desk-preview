# Disclosure Desk — Community Research M05: Private Draft Pagination

Date: 18 November 2026 (Europe/London)
Branch: prep/community-research-m05-private-pagination-qa-20261118
Status: STAGED ONLY — no Supabase production migration, website deploy, APK or real member data changes.

## Implemented
- assets/community-research-private-drafts.js: `listMinePaged({page,pageSize})` replaces the previous 50-item visibility limit. Queries are explicitly owner-filtered and ordered by updated_at DESC, id DESC with a bounded pageSize+1 query to derive hasMore. Invalid page sizes/offsets are rejected, and the account is re-verified after each response. The listing retrieves only id,title,abstract,paper_type,revision,created_at,updated_at; private manuscript text and source URLs are read only on explicit opening with owner-scoped getMine.
- assets/community-research-dashboard.js: both the Draft and Published tabs now have Previous/Next navigation. Closing details, switching accounts, losing a session or hiding the tab clears hidden private form inputs. Stale detail reads are rejected after selection changes. Private draft saves retain metadata only in the list, rather than duplicating the whole edited body in the listing. A private save never publishes changes.
- No new bottom tab, public profile or automatic W.NE transfer; existing Who M63 and Source M40 stages are preserved. The premium navy/gold design and M01/M02/M03/M04 privacy/publishing boundaries remain unchanged.

## Verification and scope
- scripts/test_community_research_m05_pagination.cjs: mock adapter tests with 65 private author A records and four isolated member B records, stable owner filters, metadata-only responses, 20-record pages, page-end detection and invalid page rejection.
- scripts/fixtures/community-research-m05-private-pages-test.sql: PostgreSQL 17 isolated test of owner A (65), owner B (4), guests and authenticated anonymous sessions with RLS visibility rules, last page of five, and no cross-account reading.
- scripts/test_community_research_m05_browser.cjs: real Chrome at 320/393/820/1280 with four draft pages, on-demand private content, input wiping, account changes and overflow checks. Inherited M04 Chrome dashboard coverage still runs.
- .github/workflows/community-research-m05-pagination-no-deploy.yml: three jobs: source/package, disposable SQL and real browser. No production secrets or deploy operations. First full run passed on initial workflow commit; check latest HEAD after documentation updates.
- All current features remain disabled through communityResearchTestDatabase:false, communityResearchBackend:false, communityResearchPublishing:false, communityResearchRecovery:false, researchPublishing:false. No existing Supabase project was modified.

## Real Supabase test-project blocker
The connected Supabase account showed two existing projects under the organisation named "Our Cinema"; one is the live Disclosure Desk project. Neither existing project should be repurposed or used for M02–M04 schema testing without explicit approval. A new dedicated test project has NOT been created because Supabase requires the owner to choose an organisation, and any nonzero quoted creation cost requires consent.

With owner selection and cost consent, create a separate Community Research TEST project in EU-West, confirm ACTIVE_HEALTHY, ensure dd_cr_private is not an exposed Data API schema, independently review the M02/M03/M04 SQL privileged functions, and run Supabase security advisers after test-only schema application. Then use two new non-personal test accounts and guest/anonymous sessions for sign-in/out, actual end-to-end publish/revise/withdraw, RLS cross-account denial, draft pagination and lost-session recovery. No real private W.NE manuscript data or existing live user records should be used.

## Remaining launch gates
Separate-project real-auth tests; independent SECURITY DEFINER review and advisors; two-account device and session tests; moderation and copyright/privacy procedures; usefulness voting without conflating popularity with evidence; physical Samsung Android keyboard/back/gesture QA; complete regression across existing features; explicit owner approval for a consolidated production release. The live website, production database and APK remain unchanged.
