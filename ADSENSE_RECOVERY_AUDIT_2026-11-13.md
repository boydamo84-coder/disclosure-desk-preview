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
