# Disclosure Desk — controlled multi-release train

Owner decision: 13 November 2026 · Project: `uapdisclosuredesk.com` (website only unless separately authorised)
**Authority:** the owner approved all six future research concepts and wants multiple **pending versions** that publish **one after another**, only after earlier releases are checked.
**No Netlify builds, account changes, branch merges to production, AdSense resubmissions, or automatic release actions are authorised by this document.**

## Versions and readiness

| Version | Working name | Tracked branch | Intended features | State as of 13 Nov 2026 |
| --- | --- | --- | --- | --- |
| **DD-WEB-R1** | Foundation, AdSense recovery and Case Connections | `audit/adsense-low-value-recovery-nov13` | Reconcile every already-approved website fix (M86–M96 and newer), no-regression news/community/W.NE, AdSense original research/editorial improvements, Rendlesham and Roswell dossiers, Case Connections for all public archive records | **Code staged; not release-ready**. Isolated QA green at run 43513005838; integrated branch, editorial review, real-phone and live checks pending |
| **DD-WEB-R2** | Evidence Intelligence | `queue/dd-web-r2-evidence-intelligence` | **Evidence DNA**, **Contradiction Radar**, **visual case relationship graph**, source provenance/independence checks | **Evidence DNA alpha implemented/tested on isolated branch; graph and Contradiction Radar not built, not deployable** |
| **DD-WEB-R3** | Hypothesis and Discovery | `queue/dd-web-r3-hypothesis-discovery` | **Hypothesis Lab**, **Research Gap Finder**, guided comparisons and evidence-needs planning | **Queue approved; features not implemented or tested** |
| **DD-WEB-R4** | Living Research and Writing | `queue/dd-web-r4-living-research` | **Living Investigations**, **Research Passport**, carefully permissioned W.NE citation/version/export integration | **Queue approved; features not implemented or tested** |

**Do not confuse “queued release” with a deployable bundle.** R2–R4 are product scopes and isolated Git branches until real code and QA establish a releasable candidate. The order expresses dependencies, not dates or promised delivery.

## Branch safety / no wasted Netlify credits

1. Keep `production` and whatever Netlify actually deploys untouched until a release has explicit owner approval. Never trigger Netlify branch previews to test these queue branches; repository access alone cannot confirm Netlify branch-deploy settings.
2. R1 remains the isolated recovery branch. Verify the newest integrated approved website fixes have been incorporated without overwriting later commits. Reconcile M86–M96 and any newer fixes against the true current production head.
3. Queued R2–R4 branches may share an initial **documentation-only snapshot** of R1 for continuity. Do not regard that early common ancestor as a valid future release base; **after each previous release succeeds, rebase/recreate the next candidate against the exact live verified commit** and reconcile changes safely.
4. Use `docs/RELEASE_R2_EVIDENCE_INTELLIGENCE_SCOPE.md`, `docs/RELEASE_R3_HYPOTHESIS_DISCOVERY_SCOPE.md`, and `docs/RELEASE_R4_LIVING_RESEARCH_SCOPE.md` as scope contracts. Keep each feature's source, tests, history and open issues on its own track.
5. Do not merge R2 functionality into R1, R3 into R2, or R4 into R3 merely because a branch exists. A later feature cannot silently change an earlier release's scope. Prototypes may be coded ahead independently, but the final merge must be based on the newly verified production baseline.

## Promotion and rollback gates — each release independently

- **Scope lock:** implementation checklist and release manifest identify exact files/commits and whether each approved requirement is included; nothing is silently omitted or re-added from a stale branch.
- **Quality:** source audit, accessibility, content/source verification where relevant, strict website-only packaging, no-deploy GitHub Actions, mobile and desktop Chromium, physical Android checks, privacy/security and W.NE regression. Test the **exact merged release SHA** rather than only component branches.
- **Safety:** backup/recovery and deployment rollback plan; no private witness location, chats, research Boards or W.NE documents exposed; author-owned publication opt-in; no unlicensed third-party full-text copying.
- **Owner approval:** explicit final approval to deploy the identified release SHA (not approval of this roadmap); Netlify build once, no needless preview deploys.
- **Post-release check:** verify actual deployed SHA and public pages, sign-in, archive/news/comments, research/W.NE, Android usability and errors. If a serious regression exists, pause queued releases and roll back safely.
- **Promote the next version only after the previous one is stable and accepted.** Separate AdSense review is requested only after R1's relevant live fixes are verifiably published; Google approval is not guaranteed.

## Definition of feature evidence

- **Evidence DNA (R2):** reference and claim lineage; direct source vs repetition; source independence is **not inferred from count of URLs**. Every edge must cite a document, passage and type of relationship. Automated extraction remains provisional for researcher review.
- **Contradiction Radar (R2):** side-by-side exact attributed statements with date/subject/source context and “potential discrepancy” wording; do not allege dishonesty or infer certainty from model classifications.
- **Visual graph (R2):** case↔document↔claim links with source provenance, graph filters, phone accessibility, and clear “suggested vs verified” edges; avoid graph hairballs.
- **Hypothesis Lab (R3):** investigator-written competing hypotheses, predicted evidence and falsification questions; never an automatically generated “alien probability.”
- **Research Gap Finder (R3):** document missing evidence, inaccessible source and testability across the records genuinely reviewed, not presumed absence from all sources.
- **Living Investigations (R4):** dated changes, revision diff, owner controls and source alerts; no automatic conclusion rewrites.
- **Research Passport (R4):** reproducible question→sources→method→findings→limits→revisions; export to W.NE/DOCX/PDF without leaking private work.

## Linked records

- Current candidate: `ADSENSE_RECOVERY_AUDIT_2026-11-13.md`.
- Consolidated R1 manifest: `docs/ADSENSE_RECOVERY_NEXT_DEPLOY_MATRIX_2026-11-13.md`.
- Case Connections technical design: `docs/CASE_CONNECTIONS_FULL_ARCHIVE_DESIGN_2026-11-13.md`.
- Ground truth handover: `MASTER_HANDOVER.md`.
- No background deploy/monitoring automation created; subsequent releases need separate verification and explicit publish approval.


## R2 milestone 1 — Evidence DNA provenance foundation (13 November 2026)

**Implementation:** alpha on this queue branch only; not merged to R1 or production, not deployed, not AdSense-reviewed.

- New `assets/evidence-dna.js`: read-only source inventory; conservative URL de-duplication; schema-validated document/claim/source-dependency relationships; explicit review status and page/section citation required for reviewed edges; transitive lineage tracing; cycle detection; unresolved-source reporting. **Independent witness count stays unknown** even for multiple distinct URLs or first-hand document pointers.
- The existing Archive case detail displays a native expandable **Evidence DNA · Source lineage** panel for every public case, reusing the original source links. It counts repeated URL references and states when no source-to-source relationship has been reviewed. It does not silently publish claims, private notes, witness details or a researcher’s Board.
- Updated strict public package allowlist for `evidence-dna.js`. The new `scripts/test_evidence_dna.cjs` has synthetic regression cases covering duplicated URLs, unverified sources, false corroboration, chains, reviewed citation requirements and circular dependencies. Existing Case Connections tests remain separate.
- Added **isolated R2 QA** workflow `.github/workflows/qa-r2-evidence-dna-no-deploy.yml`. First exact-code workflow `43517988515` at `7eecb2902b57fd7c6ca041950c9e113946707380` passed source tests, allowed bundle (95 files), public-link audit (0 errors, 3 existing hidden W.NE link warnings), and case modal display on Chromium 393px and 1280px.
- This is a **foundation**; no historical claim independence has been adjudicated, no public reviewed lineage dataset exists, no interactive complete visual graph and no Contradiction Radar. Those are subsequent R2 milestones. Native Android physical tests, actual phone performance, full release integration and owner acceptance remain.
- The branch originated as a documentation-only snapshot of staged R1. Before any future R2 deploy it MUST be rebased/reconciled onto the actual accepted R1 live commit; a green R2 branch test is not release authorisation. **Release 1 remains the sole next deployment candidate.**


## R2 Milestone 3 — Who's Who in Disclosure (14 November 2026)

**Separate R2 development branch only; public editorial preview, NOT RELEASED.** Reddit feedback prompted a professional who's-who section. Release 1 independently stages clickable logo/Home and native browser Back; the directory is **not** included in R1.

- Seven initial source-linked biographies: David Grusch, Ryan Graves, David Fravor, Ross Coulthart, Jeremy Corbell, George Knapp, Mick West. Each has three original background/involvement paragraphs, dated research timeline, statements/context/limitations, official source documents, external news and independent reporting, appropriate public organisational/social pages, and labelled original-video interviews/testimony/analysis.
- `data/public-people-directory.json` contains curated **research-copy-edit-needed** entries. `who-is-who.html` is a searchable independent public page linked from Home, Explore, About; `assets/people-directory.js` provides category/search filters, individually shareable `?person=...` profile routes, keyboard accessible profile navigation and an opt-in **youtube-nocookie.com** embedded video on user click. Video is not preloaded/autoplayed; original publisher link is always supplied. Testimony / commentary / original source footage distinctions are explicit.
- **Copyright/privacy:** no images copied or unauthorized portraits; typographic initials until rights verified. Only externally verified public accounts sourced from official published profiles; no unverified handles, direct private contacts, unmoderated character-rating polls, defamation or insinuations. Never treat reported allegations as factual proof or imply independent corroboration from repeats.
- Strict deploy allowlist `scripts/build_public_release.cjs`, sitemap canonical `/who-is-who`, and source/search/public-link regression assertions updated. Initial full code QA **GREEN**: GitHub Actions run `43583617250` at commit `321cb05d40b9fce740b8680f6b80667a0cb753bf` passed 7 biographies, 43 timeline/article references, 10 publisher videos, 16 public social links, 99-file strict package, 11 canonical public sitemap URLs, 19-page audit **0 errors** and 3 previously known hidden W.NE warnings. Local Chromium **393px + 1280px** passed search/filter, full narratives, direct links, no eager embeds, click-to-play, browser Back and no overflow; physical Android and publisher-embeddability remain untested.
- Scope and source-trace handover: `docs/R2_WHO_IS_WHO_DISCLOSURE_MILESTONE_2026-11-14.md`.
- Pending: editorial fact check against individual original public sources; verify external links/ownership and licensing, real Samsung device QA, optional further verified figures, case-to-person links and evidence-based (not person-reputation) surveys only after moderation/security design. R2 still awaits Contradiction Radar, visual relationships and verified source-lineage data. This directory is not a completed Release 2.
- R1 must first be merged with newer approved fixes, owner-accepted and published before R2 rebase onto actual verified production SHA, merged QA, final explicit R2 approval, deployment and post-deploy verification. **No Netlify build or AdSense re-review has occurred.**


## R2 Milestone 4 — 17-person Who's Who and podcast/film credits (14 November 2026)

**User-approved and staged on R2 branch only, NOT DEPLOYED.**
- Added six further researched people: Luis Elizondo, Christopher Mellon, Avi Loeb, Jacques Vallée, James Fox and Nick Pope, bringing Who's Who to **17 profiles**. Each additional biography has cited public background, source-linked chronology and editorial uncertainty/context. Nick Pope's published memorial records death on 6 April 2026; profile uses historical wording.
- **23** selected podcast recordings/entries across all 17 people, with original publisher links and specific roles (**guest/host/subject of coverage**; do not misrepresent an episode about a person as their own appearance).
- **21** attributed film/TV/press-recording credits from original producers, professional biographies and catalogues, each with participation role and content type. Where no film appearance was reliably verified (Avi Loeb, Mick West, Larry Warren), the UI explicitly says so rather than inventing one.
- Site UI: `who-is-who.html` now has Podcasts and Documentaries/Films/TV sections; `assets/people-directory.js` renders direct publisher links safely, retains optional click-to-load YouTube, full biography, public accounts, source timeline, direct profile URLs and contextual related-case links. Expanded role and research-topic filters. Only public reference data.
- **GREEN GitHub no-deploy CI `43585311950`** at code SHA `a4010164a48f06120c00cda6f9a87aef9917f200`: 17 profiles; 112 dated/source references, 21 video entries, 23 public social/organisation links; 99-file strict public staging, 19-page / 330-link public audit 0 errors with 3 pre-existing W.NE hidden-link warnings; browser checks passed at 393px and 1280px.
- **Source caution:** static/Chromium testing does not validate every external episode/streaming link or permission to embed; full human editorial fact-check and physical Samsung QA remain. No unlicensed headshots, private contacts, reputation-poll rankings or unapproved YouTube autoplay.
- Documentation: `docs/R2_WHO_IS_WHO_EXPANSION_PODCAST_FILMS_2026-11-14.md`. Source JSON `data/public-people-directory.json`, page `who-is-who.html`, renderer `assets/people-directory.js`.
- Next: verify every external attribution/film credit, consider person↔case source-based relationships and prepare Contradiction Radar. R2 remains **not a deployable release** until predecessor R1 is live and accepted, merged/rebased into verified production baseline and fully tested with explicit owner approval. No Netlify, production or AdSense mutation.
