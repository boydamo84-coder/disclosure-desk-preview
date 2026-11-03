# Disclosure Desk / W.NE Research Edition: beta integration and Google Search handover
Updated: 3 November 2026.

> **Current continuation / NEW CHAT:** Read [Disclosure Desk LIVE & Community Handover](DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md) after this file. It contains everything added since the W.NE beta: Congress automation, LIVE timer/chat, public witness submissions and map filter, 3 reports/24h, 5-flag hiding, likes/dislikes, community rules, profile/username and research publishing goals, test status and security blockers. The newer details supersede earlier feature-state notes here.

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
  - `sitemap.xml` lists only indexable public pages `/`, `/research-edition.html`, `/community-rules.html`, `/privacy.html` (four public URLs; new Rules page added after the original SEO batch).
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

## Single staging-preview trigger — 3 November 2026
- Owner confirmed Netlify builds were re-enabled and approved the **single combined W.NE / Disclosure Desk staging test**. This documentation-only commit intentionally nudges the existing draft PR #2, head `feature/research-studio-bds-production-based`, base `production`.
- GitHub automated validation before trigger: **green** at `b2bc4c9bf211a7963e3ef2eaf9f3c2307050efed`, run https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41572715092.
- Draft PR: https://github.com/boydamo84-coder/disclosure-desk-preview/pull/2. **Do not merge.** Netlify preview build must be verified independently; a branch commit is not proof of a successful deploy.
- Beta uses the real Supabase instance, so use only disposable research content and two test accounts. The original W.NE repo and live `production` branch must remain unchanged.
- Avoid any further trigger commits before checking Netlify's own Deploy Preview status and URL. If no preview appears, inspect Netlify's Deploy Preview settings and build eligibility rather than consuming credits through repeated commits.

## W.NE unified navigation and save-safe return (3 November 2026)
- User found that the W.NE editor/Research Studio is a separate full-screen workspace without the Disclosure Desk bottom swipe navigation. Chose a fully integrated experience, with a **Hide menu / Show menu** toggle for clutter-free writing.
- Added `research/research-site-nav.js` and `research/research-site-nav.css`. The same 10 branded navigation choices appear in W.NE (News, Archive, W.NE, Map, LIVE, Videos, Boards, Witness, Watch & Read, Explore), with W.NE highlighted. Menu visibility preference persists per browser. The swipeable bottom dock occupies reserved workspace space, and when hidden leaves a small show-menu button.
- Mounted shared navigation on research login, guest preview, Research Studio parent shell, canonical editor (when standalone), library, import and restore-copy pages. **When an editor or library is inside the workspace's iframe, it does not render a duplicate menu.**
- Main site `index.html` now handles safe `/?dd_tab=<allowed section>` navigation on return from W.NE, and suppresses the first-visit tour on an explicit return, restoring the exact selected section without overwriting existing routes.
- The parent Research Studio's `window.ddResearchNavigateTo(tab)` and iframe return links route through **the existing canonical editor's `window.wneSaveBeforeNavigation(reason)`**. It awaits the result; only strict `true` allows leaving; missing, pending, failed or conflicting saves keep the editor open and display a warning. Selecting W.NE when already inside W.NE does not reload or lose the current document. This saves the W.NE **report**; separate Research Library local/Board copy state still requires its own normal save/backup verification.
- Fixed prior insertion of site-return CSS into malformed nested styles and an accidental Research Library print-preview string; real inline JS syntax tests are passing again.
- Updated `scripts/test_wne_site_integration.cjs` and `scripts/smoke_wne_website.mjs` to test ten tabs, hide/show state, selected-tab deep links, and a synthetic editor save that deliberately fails, remains open, then succeeds and navigates. No account data was accessed.
- Latest pre-documentation code commit `bfa2468db615c938ec00119176008e8a0f7eebae`; GitHub workflow run `41575744722` **SUCCESS**, as well as earlier browser save test run `41575712338` **SUCCESS**. These are simulated checks, **not yet live Samsung cloud-save confirmation**.
- **Deployment:** The existing Netlify beta preview `https://deploy-preview-2--uap-disclosure-desk.netlify.app` still contains the *earlier* release without this unified menu. The draft PR #2 is unmerged, titled `[skip netlify] ...` to avoid unnecessary credit-consuming builds during bug batching. Do not claim these navigation changes are available on that preview until the next **deliberate combined staging redeploy**. Production remains untouched. Preserve scarce Netlify credits.
- When next staging batch is approved, test on actual Samsung with disposable account and document: type edits, immediately tap a different site tab while save is in flight, confirm persistence on return; simulate interrupted connectivity/conflict, ensure no navigation; hide/show navigation in portrait/landscape; browser back behavior; and local Research Library backup/export separately.

## IMPORTANT: Latest combined-release status (after initial W.NE/SEO beta)

- PR #2 is still **DRAFT / NOT MERGED**. Its older Deploy Preview #2 is **not evidence the later features are published**.
- The new ten-tab W.NE swipe menu and save-before-navigation passed simulated browser tests, but real Samsung cloud save still needs validation.
- New LIVE hearing countdown, authenticated chat, witness report city-only map feed, vote counters and community rules exist in the feature branch with **different verification stages**. Read the [LIVE & Community Handover](DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md) for exact state, verified tests and next actions.
- **Critical stop-release issue**: staged witness server-only insert trigger checks `current_user` inside a SECURITY DEFINER function; fix and test before activating public submissions. Witness and LIVE chat SQL have NOT been applied; the witness Edge Function has NOT been deployed.
- Existing original W.NE and live Disclosure Desk production branch remain untouched. The user prefers a **single next combined Netlify staging build** once code/backends are ready, to conserve credits.
