# Disclosure Desk — current product and release roadmap

Updated 10 November 2026. This is the current prioritisation of the owner's requests; it does not mark planned features as implemented or authorise a production release. The five approved research phases in [the original roadmap](POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md) remain intact.

## 1. Finish the audited release

M41 repairs the broken development homepage script, comparison insertion, analytics re-consent and share destinations. M42 adds simpler discussions, app-style Chat, consistent compact action rails, wider desktop space, Word-first document copies, Watch & Read additions and an optional Google Drive implementation.

M44 additionally updates the Word-import security libraries and runs conversion in a bounded local worker.

Before production:

- Observe the exact source commit's existing **NO DEPLOY** workflow green, including real Chromium and disposable PostgreSQL. Local checks and fictional browser previews do not prove real services or devices.
- M48 supersedes the original pre-review workflow at the owner’s request: valid links publish immediately, existing titles/URLs are rejected, and five distinct registered reports hide a title for owner restore/remove review. Its backend migration and real-role rollback acceptance are complete; full source/browser tests passed, including five concurrent reporters. Physical-device/signed-in frontend acceptance remains before release. M47 completed the earlier additive link-submission migration and its narrowly scoped owner-status permission/performance follow-ups. Actual database-role acceptance passed for registered-user submission, second-account isolation, admin review, duplicates and rate limits; every QA nomination was rolled back. The isolated suite now has 18 scenarios. Signed-in frontend receipt/owner queue and physical-device acceptance remain before release.
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


## 7. AdSense-aligned research release (13 November 2026 addendum)

The owner's authenticated AdSense screenshot shows **Needs attention: Low-value content**. Address original research and source transparency through existing approved research roadmap phases rather than building separate advertising-only features.

**Prioritise now:** Phase A's sourced timelines and verified-vs-suggested relationship methodology; Phase D's evidence completeness and visible gaps; the public-read-only presentation part of Phase E. A standalone `investigations.html` with three source-linked evidence reviews and a six-part research method is **staged on** `audit/adsense-low-value-recovery-nov13` and linked from its homepage/About/footer. It is not deployed or editorially approved. Public page metadata/sitemap and release allowlist were prepared; full CI and live acceptance pending.

**Build next in the same release candidate:** document-level original historical case pages with stable canonical URLs, transparent source provenance, research date and correction history; clearly distinguish official records from editorial analysis. Use case-level timelines, an evidence inventory and links to the current archive. Keep default browsing public without requiring a login.

**Keep for later:** full member opt-in publishing (Phase E backend), Phase B aircraft/astronomy matching, Phase C witness matching, pinned Chat/Boards, profile reactions and automatic social syndication, except where an independent pre-existing release commitment explicitly requires them. None should delay or dilute the site-content improvements.

Track each milestone in `MASTER_HANDOVER.md` and `docs/ADSENSE_RECOVERY_NEXT_DEPLOY_MATRIX_2026-11-13.md`; reconcile pending M86–M96 branches and new production fixes before the single authorised Netlify deployment. Google approval is **not guaranteed** by any particular implementation.


## 8. Phase A Case Connections staged (13 November 2026)

The owner approved full-archive related-case discovery from every public archive case (similar content, source-locality, approximate geographic distance when coordinates exist, supportive catalogue-year proximity and possible duplicates), with explanation and source links. **Implemented only on** `audit/adsense-low-value-recovery-nov13` as an indexed, read-only `assets/case-connections.js` plus four filter modes inside the existing archive modal. The previous title-only/year-only matcher is superseded on that branch. This is a Phase A improvement but is not a claim of verified relationship or corroboration.

Local no-deploy CI run 43513005838 passed source/strict package/Chromium checks and a 12,000 synthetic-record regression. Real device and production loaded-data QA, editorial review and reconciliation with pending M86–M96 changes remain. Future Phase A: record-level geocoding with documented precision, distinguish true event timestamps from catalogue years, verified connections and a researcher-editable visual graph. Do not merge automatic duplicate suggestions into permanent source records without independent verification. All cases remain original source records.

See `docs/CASE_CONNECTIONS_FULL_ARCHIVE_DESIGN_2026-11-13.md` and the consolidated release matrix. Netlify remains untouched; no AdSense re-review.


## 9. Sequential release queue — owner approved 13 November 2026

Adopt `docs/RELEASE_TRAIN_2026-11-13.md` as the version-specific release ledger. **R1** is the next integrated website/AdSense recovery + original case editorials + explainable Case Connections. **R2** is Evidence DNA, Contradiction Radar, a visual case relationship graph; **R3** is Hypothesis Lab and Research Gap Finder; **R4** is Living Investigations, Research Passport and W.NE professional citations/research export integration. All six newly suggested ideas approved as *roadmap targets*; R2–R4 are **not built or ready to deploy**.

Version branches: `audit/adsense-low-value-recovery-nov13` for R1; `queue/dd-web-r2-evidence-intelligence`; `queue/dd-web-r3-hypothesis-discovery`; `queue/dd-web-r4-living-research`. Never publish queue branches or introduce new website build previews to test. Only after previous release passes production verification and owner approval is the next version rebased/reconciled onto its final live commit, tested and presented for a new deploy approval. Maintain exact-SHA manifests, rollback plans, original source provenance and private-research controls at each gate.
