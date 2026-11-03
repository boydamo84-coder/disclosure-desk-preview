# Disclosure Desk / W.NE Research Edition: beta integration and Google Search handover
Updated: 3 November 2026.

## Where the current site really lives
- **Use `boydamo84-coder/disclosure-desk-preview`, branch `production` as integration base.** This has all nine existing live navigation tabs: News, Archive, Map, LIVE, Videos, Boards, Witness, Watch & Read and Explore. It is not the older `main` branch, nor the separate older `boydamo84-coder/disclosure-desk` repository. Netlify is linked to `production` in this repository per the existing release audit.
- All work in this batch is on **unpublished branch `feature/research-studio-bds-production-based`**. Expected navigation order after adding W.NE: News, Archive, **W.NE**, Map, LIVE, Videos, Boards, Witness, Watch & Read, Explore.
- Do not merge or deploy directly until the user decides to use a significant Netlify release batch; last reported approximately **300 Netlify credits**. This branch has not modified live website or original W.NE.

## Completed source changes on this branch
- Added the W.NE tab, intro and links to `/research/index.html` and the isolated guest preview under `/research/guest-preview.html`.
- Mounted the canonical original Research Edition UI and supporting assets under `research/`, copied unchanged from `boydamo84-coder/WNE-Research-Edition` branch `feature/research-beta-proofread-landing-batch`. Never use the older rejected simplified editor.
- Explore page now has tours first (full, W.NE, investigation and safety), followed by a source-evaluation guide, contact enquiries/corrections/beta feedback, privacy and About.
- Full tour and investigation tour include W.NE. About and footer identify **Boyd Digital Studios**, and direct links lead to contact and `/privacy.html`.
- Privacy Policy dated 3 November 2026 explains local vs account-based/cloud data, W.NE Research Edition beta, and authenticated LanguageTool processing on Oracle.
- Previous SEO code was found in **older private** `boydamo84-coder/disclosure-desk` branch `launch-readiness-seo-prep`: its robots, one-URL sitemap, canonical and metadata were never present on this production base. Reused and extended that logic rather than duplicating it:
  - `robots.txt` allows crawl and points at `https://uapdisclosuredesk.com/sitemap.xml`.
  - `sitemap.xml` lists only indexable public pages `/`, `/research-edition.html`, `/privacy.html`.
  - Homepage SEO: unique title, description, canonical, social meta and a crawlable link to public `research-edition.html`.
  - Public `research-edition.html`: substantive W.NE description, canonical, links to real sign-in and separate read-only guest preview, privacy notice and factual `WebPage` JSON-LD structured data.
  - Privacy Policy has unique title, description, canonical.
  - Private `research/wne.html`, `research/research-workspace.html`, `research/research-bible.html`, `research/import.html` explicitly `noindex,nofollow,noarchive`. Login, guest and restore views were already noindex. Private documents, Boards, dynamically generated case IDs, API endpoints and unsupported URLs are **not** added to public sitemap.
- No fabricated Google Search Console verification token, no Indexing API misuse. Google Indexing API is generally limited to `JobPosting` and eligible `BroadcastEvent` pages, not regular UAP stories. Google indexing and ranking are not guaranteed.

## Automated QA
- `.github/workflows/validate-wne-site.yml` runs only on the unpublished feature branch and has **no Netlify or GitHub Pages deploy action**.
- `scripts/test_wne_site_integration.cjs`: original nine tabs + W.NE third, tours, About, guest safety, continuity and script syntax.
- `scripts/test_search_indexing.cjs`: canonical sitemap, robots, public/secret separation, meta descriptions, links, structured data, noindex on private pages.
- `scripts/smoke_wne_website.mjs`: mobile/desktop browser navigation, W.NE intro, tours, Explore/privacy/contact, the nine prior tab routes, public research page and read-only guest preview.
- The **old** `scripts/smoke_preview.mjs` was written against `main`; it fails on `production` because `#clipDiscoveryMode` exists but is hidden in production. It was removed from this feature branch's QA workflow, *not* because site UI was altered: the production-compatible smoke checks all ten tab routes. Do not falsely claim the previous main-only interaction suite passes against production.

## Before combined beta release
1. Verify the latest GitHub Actions run is GREEN; inspect logs for browser errors.
2. Verify production-based candidate preserves AdSense loader, newer LIVE and Watch & Read tabs, Boards and source videos. Only changes under the feature branch, no live deploy.
3. Decide whether to prepare a PR into `production` for one significant Netlify release.
4. On Samsung, use separate disposable account A/B and guest to verify direct-route guards, cloud saves, last-document restore, reference backups, grammar colour categories and import/export. Maintain independent backups.
5. Confirm `https://uapdisclosuredesk.com/robots.txt`, `/sitemap.xml` and `/research-edition.html` return 200 AFTER a deployment; external website inspection was not confirmed via browsing in this turn.

## Google Search Console: after the approved release
- Visit <https://search.google.com/search-console>. Reuse the existing verified **Domain property** for `uapdisclosuredesk.com` if present; do not add a second property or overwrite verification DNS unnecessarily. If none exists, add and verify it using the site's DNS provider.
- Under **Indexing → Sitemaps**, submit `sitemap.xml`. Inspect its fetch status rather than assuming success.
- Use **URL Inspection** to verify canonical and indexability for the homepage and public Research Edition information page; request indexing if appropriate. Do **not** submit private Research Studio, login or guest document URLs.
- Monitor **Pages / Page indexing** for noindex, duplicate-canonical and crawl errors. Do not claim Google has indexed all UAP news or the large case archive.
- For individual article/case discoverability in a later milestone, create meaningful stable public URLs with clear original sources, unique factual summaries and appropriate copyright/provenance; don't generate a giant sitemap of SPA filter states or low-value pages.
