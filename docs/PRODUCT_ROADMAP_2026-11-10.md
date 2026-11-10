# Disclosure Desk — current product and release roadmap

Updated 10 November 2026. This is the current prioritisation of the owner's requests; it does not mark planned features as implemented or authorise a production release. The five approved research phases in [the original roadmap](POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md) remain intact.

## 1. Finish the audited release

M41 repairs the broken development homepage script, comparison insertion, analytics re-consent and share destinations. M42 adds simpler discussions, app-style Chat, consistent compact action rails, wider desktop space, Word-first document copies, Watch & Read additions and an optional Google Drive implementation.

M44 additionally updates the Word-import security libraries and runs conversion in a bounded local worker.

Before production:

- Observe the exact source commit's existing **NO DEPLOY** workflow green, including real Chromium and disposable PostgreSQL. Local checks and fictional browser previews do not prove real services or devices.
- M48 supersedes the original pre-review workflow at the owner’s request: valid links publish immediately, existing titles/URLs are rejected, and five distinct registered reports hide a title for owner restore/remove review. Its source/migration/device acceptance must be completed before release. M47 completed the earlier additive link-submission migration and its narrowly scoped owner-status permission/performance follow-ups. Actual database-role acceptance passed for registered-user submission, second-account isolation, admin review, duplicates and rate limits; every QA nomination was rolled back. The isolated suite now has 18 scenarios. Signed-in frontend receipt/owner queue and physical-device acceptance remain before release.
- Configure a public **Web application** OAuth client ID for Drive; the original Desktop credential cannot be used in a static website. Follow [Drive setup and acceptance](RESEARCH_DRIVE_SETUP.md). Real OAuth consent, upload, opening the actual Word file outside the website and restore-as-new remain pending.
- Test Windows/macOS desktop browsers, Android Chrome, iPhone Safari and installed-app views: portrait/landscape, opening/closing the keyboard, safe areas, zoom, touch targets, offline/retry, account changes, downloads and long documents. There is no claim that every device has been tested or that any site can guarantee zero device issues.
- Keep self-service account deletion disabled until its separate recovery, write-freeze and inventory gates are complete. Include the new nomination table in that future inventory. Do not weaken RLS or expose private research to complete UI work.
- Batch one authorised Netlify release; avoid repeated preview deployments. Verify the published commit, functions and public assets afterwards, then run real-device acceptance and Search Console recrawl checks.

## 2. An immersive desktop workspace

**Built in M42:** a wider main shell up to 1600px, wider desktop navigation, a larger map, and a bounded two-pane Chat surface. Long discussion text retains a comfortable reading width. Phones use a focused full-screen conversation.

**Next implementation:** an optional **Pin Chat / Pin Boards** side panel on sufficiently wide screens. Remember the choice per browser and signed-in identity. Default to closed, keep one panel open at a time, and provide a visible close/unpin control and unread indicator. Keep the main research task usable beside the panel. Collapse to the normal full-screen destination on narrow windows. Avoid loading private chat in a guest view; clear its contents on sign-out or account change. Opening a panel must not unload an unsaved W.NE document or bypass save guards.

This gives regular researchers an always-available workspace without forcing every visitor to keep community panels open. Do not add more main navigation tabs. Research now mirrors the website's current 13 destinations when both social features are enabled.

## 3. Profile: Likes received

**Planned, not implemented.** Show a clearly labelled **Likes received** total for other registered members' positive votes on that user's visible public posts and comments. Keep post and comment subtotals available for clarity. Do not deduct dislikes or imply that popularity verifies evidence.

Compute the total on the server using the real authorship/vote tables. Exclude self-votes, private messages, hidden/deleted posts and withdrawn votes; count a single active vote once. Decide explicitly how existing case/news/video comments and discussion replies map into the total before adding SQL. Keep guest-visible output limited to the public username and aggregate counts; do not expose account identifiers, email, private writing or voter identities. Verify account switching, removal/moderation and representative performance before release.

## 4. Social discovery and publishing

**Feasibility checked; no accounts created, connected or posted to.** A reusable publishing queue can prepare short, attributed summaries of source-verified breaking stories, new videos and confirmed Congressional hearings, linking visitors back to the relevant public Disclosure Desk content. Ingestion and posting should run from a scheduled backend/workflow without requiring a Netlify build for each item.

| Destination | Proposed format | Gate before enabling |
| --- | --- | --- |
| Facebook | Source-linked Page update | Verify the owned Page, official publishing permissions and current Meta approval requirements. Exact Meta eligibility was not independently verified in this pass because its official reference pages were unavailable. |
| X | Short attributed post and site link | Official create-post endpoint exists; verify the owner's developer access, account authorisation, current pricing/quotas and a controlled test. No paid access has been purchased. |
| Instagram | Original image/carousel or suitable video with caption | Verify account eligibility and official publishing permissions; create an owned visual, not a bare-link feed copy. Meta eligibility still needs verification. |
| TikTok | Original photo/video post through an eligible workflow | A custom internal utility for only the team's own accounts is expressly outside TikTok Direct Post's intended use. Its guidelines require creator controls/consent and restrict unaudited posts. Do not promise zero-click syndication; evaluate an eligible approved publishing provider or a creator-reviewed workflow. |

Begin with an owner preview/review queue. Fully automatic publication should be enabled only per destination after account setup, successful tests and an explicit editorial policy. Include deduplication by source/event, a maximum daily volume, corrections, delivery receipts, bounded retries, an audit log and a kill switch. Hold uncertain or disputed “breaking” claims for review. Do not download and re-upload someone else's video or imagery without the right to do so. Store service tokens only in backend secrets.

High-activity discussions can become a separate **Community conversation** feature. Measure distinct genuine contributors within a time window rather than raw repeated replies. Exclude flagged, hidden, removed, private and spam content, and permit moderation to veto promotion. Share a neutral topic summary and public link; never export private chat, saved Boards or witness details. Check the site's community notice/expectations before quoting individual members externally.

Primary platform references checked 10 November 2026: [X create post](https://docs.x.com/x-api/posts/create-post), [TikTok content-sharing guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines). Meta references to verify during setup: [Pages posts](https://developers.facebook.com/docs/pages-api/posts/), [Instagram publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/). These are planning links, not evidence that an account already has access.

## 5. Search visibility and useful public pages

The 10 November public check confirms the six intended public routes return 200 with descriptive titles and descriptions, public crawling is allowed, the sitemap is available, canonical-host redirects work, unknown pages return 404, and private W.NE pages remain noindex. Production still uses the older `.html` canonical URLs and sitemap; the development release aligns the same six public routes to their clean URLs. Verify the alignment after deployment before asking Search Console to recrawl.

Actual current Google indexing totals require an authenticated Search Console report or URL Inspection. Public search results and a valid sitemap do not prove that every page or record is indexed. Keep the 9 November export's old counts labelled with their report date.

The largest next search opportunity is a small set of **substantive, source-linked public case or investigation pages** with stable URLs, original summaries, citations, corrections and crawlable links. Today most tabs and archive records are parts of the same application URL; 10,000 records do not equal 10,000 independently indexable pages. Build useful pages alongside Case Intelligence / opt-in published investigations rather than generating thin copies of every external record. Keep private drafts, Boards, chat and witness identities out of sitemaps and structured data. Add accurate article/video metadata only to pages with that real visible content; do not invent dates, ratings or news articles for rich results.

## 6. Retained research phases

Proceed incrementally through the original approved plan: **A** Case Intelligence, **B** possible sky explanations, **C** independent witness matching, **D** evidence completeness/status, **E** opt-in published investigations. Existing satellite-imagery links do not by themselves complete Phase B. Prioritise reliable saves, clear sources, privacy and a simple experience before additional external data feeds or AI features.
