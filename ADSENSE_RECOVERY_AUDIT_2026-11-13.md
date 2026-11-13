# Disclosure Desk — AdSense low-value content recovery audit
Date: 2026-11-13
Status: preparation only; no production deployment or resubmission authorised.

## Confirmed issue
The publisher's signed-in AdSense screenshot shows **Needs attention**, **policy violations**, **Low-value content**, and a **Request review** action. Do not assert approval or tick the confirmation until changes are verified.

## Release safety
This branch is isolated from main and the existing November release branches. Before implementing any site change, reconcile the latest integrated website branch and pending M86–M96 fixes. Preserve navy/gold styling, user data, community features, archive, news, W.NE and Android app. Avoid Netlify builds until explicit approval.

## Audit / implementation checklist
- [ ] Review live site and mobile logged-out journey; identify thin, empty, repetitive, broken or inaccessible public pages.
- [ ] Inspect news items for source attribution, repeated event coverage, scraped excerpts, and lack of independently written context. Do not manufacture reporting or automatically paraphrase copyrighted full articles.
- [ ] Introduce a visible **Original Investigations** landing page with substantial human-reviewed case analysis: evidence, provenance, chronology, alternative explanations, uncertainty and primary-source citations. No invented case facts.
- [ ] Prepare 3–5 fully researched editorial case studies for human review before publication; no filler or AI-only bulk publishing.
- [ ] Clarify editorial standards, corrections process, author/about information, contact and content sourcing; keep existing privacy and terms intact.
- [ ] Highlight archive provenance, research boards, comparisons and W.NE in public navigation, without disguising login-gated features as publicly readable editorial content.
- [ ] Check robots, sitemap, canonical URLs, mobile rendering, 404s, public crawlability, ads.txt and any policy-specific account notices.
- [ ] Test logged-out and logged-in flows, desktop and Android; document actual evidence and limitations.
- [ ] Obtain owner approval before merging, deploying, or requesting AdSense review.

## Important distinction
AdSense does not provide a guaranteed approval checklist. Original research and better navigation are risk-reduction measures, not proof of compliance or guaranteed approval.

## Next step
Inspect latest integrated source and live URLs, produce evidence-backed page-level findings, then implement isolated reviewed changes. Do not modify the public website until the appropriate integration base is confirmed.


## Milestone 2 — First original research page staged (13 November 2026)

**Implemented on isolated recovery branch, not deployed:**
- Added public `investigations.html`: three independently written source-linked editorial briefs reviewing Rendlesham Forest (UK National Archives), Project Blue Book (US NARA) and NASA's September 2023 UAP research report, each with explicit evidence limits and next research actions.
- Added a six-part method for document provenance, chronology, evidence inventory, alternative explanations, uncertainty and corrections. This is the Phase A / Phase D editorial starting point; it is **not** yet the interactive Case Intelligence feature or member publication backend (Phase E).
- Linked the page from the homepage, About card and footer. Added clean `/investigations` canonical, sitemap entry and strict bundle allowlist entry.
- Extended `test_search_indexing.cjs`, `audit_public_pages_20261108.cjs` and `test_public_release_package.cjs` to include the new public route; preserved opt-in analytics consent.
- **Validation:** 11 of 11 read-only source-level checks passed (exact file references, homepage/footer links, sitemap/canonical, source links, privacy/static data, HTML tag balance). This does **not** constitute Node/Chromium/browser/device/Netlify tests.
- **Evidence:** original record starting points: https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/postwar/ufo-reports/ ; https://www.archives.gov/research/military/air-force/ufos ; https://science.nasa.gov/uap/ . Editorial factual/source and presentation review still required before release.
- Next: build dedicated substantive case URL(s) and archive connection; perform source copyedit and verify source URLs, mobile layout, no-deploy CI and logged-out accessibility on the exact combined release.
- Consolidated matrix: `docs/ADSENSE_RECOVERY_NEXT_DEPLOY_MATRIX_2026-11-13.md`. Do not imply all pending M86–M96 changes were merged already.
- **No live deployment or AdSense review submission.**


## Milestone 3 — individually crawlable Rendlesham and Roswell research dossiers (13 November 2026)

- Staged `rendlesham-forest-1980.html` and `roswell-1947.html` with original archival analysis, source-provenance notes, timelines, evidence completeness checklists, alternative explanations and research questions. Cited institutional starting points: UK National Archives, US National Archives, GAO NSIAD-95-187. Editorial copy is a **draft requiring further source fact-check and sign-off**, not externally verified news reporting.
- Homepage and `/investigations` now link to both dossiers. Their links into the existing archive use explicitly allowed curated IDs `featured-rendlesham-1980` and `featured-roswell-1947`, while those archive cases link back to the articles; no new case dataset, private data or backend schema is added.
- Strict public bundler, sitemap and static route/indexing/public-page/package test expectations updated for 10 clean URLs.
- 18/18 targeted read-only source checks passed (metadata, unique canonicals, internal links, public data/consent-only, HTML nesting, source sections, archive ID mapping, allowlisted packaging and search tests). Previously 11/11 source checks passed for initial research page. **Full Node/Chromium CI and real mobile/backend testing still pending.**
- No Netlify preview/production builds, account changes or AdSense resubmission. Owner sign-off, precise source page review, current branch reconciliation, public build and mobile acceptance all remain.


## Milestone 4 — full-archive Case Connections, read-only (13 November 2026)

- Owner requested automatic nearby/similar/time-linked case suggestions from **every public archive record**. Existing `archiveConnections` checked whole arrays, recommended shared title words or year-only overlaps and lacked true geographic distances. Replaced with a source-agnostic inverted-term, locality and grid-geospatial candidate index (`assets/case-connections.js`), built on every public archive catalogue load. No private user, chat, witness, W.NE or Board data enters the index; no backend migration.
- Existing archive case modal now contains four filter modes: **All connections / Nearby / Similar reports / Close in time**. Every match includes specific evidence of why it was suggested, and original source link. An overlap is **not** independent corroboration; location distances require stored coordinates and are approximate, and a catalogue year is not always an event date. Missing source attributes are not fabricated.
- Original news/videos matching remains separate. No automatic deletion/merging of allegedly duplicate records. This is roadmap Phase A foundation, not a complete verified case graph.
- Added strict public bundle allowlist for `assets/case-connections.js`; revised no-deploy CI, source contracts and Chromium case filter acceptance. `scripts/test_case_connections.cjs` exercises a **12,000 synthetic-record** index, diverse matches, no same-year-only links, and source URL duplicate handling.
- **Successful exact-code local CI:** GitHub Actions run 43513005838 (commit `dbeda42a221852858e8402850d92ee444eebc45d`) green for source, AdSense/search contracts, strict package and 393px/1280px Chromium case journeys including all four filters. CI created **94 allowlisted files**, public-page audit 0 errors and 3 previously known private W.NE legacy-link warnings; synthetic 12,000-case index 176 ms build and 23 ms query in earlier passed workflow. CI figures are not physical device benchmarks.
- Isolated earlier workflow failed due package count cap (fixed) and a test-navigation race when reusing one tab after modal `history.back()` (fixed by using independent tabs). The latest full QA is green; **real device and actual production/Netlify tests still pending**.
- Design/limitations: `docs/CASE_CONNECTIONS_FULL_ARCHIVE_DESIGN_2026-11-13.md`.
- No Netlify deployment, production merge, AdSense resubmission or private-data change. All previously accepted M86–M96 site changes and newer app/website fixes require release reconciliation.
