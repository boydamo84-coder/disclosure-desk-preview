# DD-WEB-R2 — Evidence Intelligence

**Version type:** staged development track (NOT a ready-to-deploy website build)
**Branch:** `queue/dd-web-r2-evidence-intelligence`
**Release dependency:** DD-WEB-R1 must be deployed to production, verified and approved before DD-WEB-R2 can be proposed for publication.
**Current status (13 November 2026):** Evidence DNA alpha source and UI staged; standalone no-deploy QA passed. Contradiction Radar and visual graph NOT BUILT. NO DEPLOY AUTHORISED.

## Approved functionality

Evidence DNA (provenance graph); Contradiction Radar (contextual claim discrepancies); interactive source-linked case relationship graph

Complete acceptance and research/source-safety requirements are in `docs/RELEASE_R2_EVIDENCE_INTELLIGENCE_SCOPE.md`. The overall queue, rollback policy, branch promotion steps and other version statuses are in `docs/RELEASE_TRAIN_2026-11-13.md`.

## Initial branch note

This branch was created from the **current R1 source/documentation snapshot**, strictly to isolate future feature work and keep the handover discoverable. It does **not** contain completed DD-WEB-R2 features or a valid deploy candidate. In particular, it inherits *unpublished* R1 website changes for continuity; do not publish it or merge it to `production` before its predecessor is verified. Upon publication of DD-WEB-R1, **reconcile/rebase** on the verified live version (not a stale branch or guessed commit). Re-run all relevant no-deploy tests on the final merged SHA.

## Quality / release checklist

- [ ] Requirements and UI approved; research source and privacy implications reviewed
- [ ] Feature code implemented with citations and independently testable matching rules
- [ ] Unit tests cover positive and negative cases without inventing claims
- [ ] Existing navigation, archive, user accounts, Community and W.NE unaffected
- [ ] Real mobile and desktop usability/security tests passed
- [ ] Rebased/reconciled with predecessor's VERIFIED live production commit
- [ ] Exact merged SHA reviewed and full no-deploy CI green
- [ ] Owner explicitly approves deploying DD-WEB-R2; post-deploy acceptance verified

**No automatic Netlify preview/build or AdSense action requested.**


## R2 milestone 1 — Evidence DNA provenance foundation (13 November 2026)

**Implementation:** alpha on this queue branch only; not merged to R1 or production, not deployed, not AdSense-reviewed.

- New `assets/evidence-dna.js`: read-only source inventory; conservative URL de-duplication; schema-validated document/claim/source-dependency relationships; explicit review status and page/section citation required for reviewed edges; transitive lineage tracing; cycle detection; unresolved-source reporting. **Independent witness count stays unknown** even for multiple distinct URLs or first-hand document pointers.
- The existing Archive case detail displays a native expandable **Evidence DNA · Source lineage** panel for every public case, reusing the original source links. It counts repeated URL references and states when no source-to-source relationship has been reviewed. It does not silently publish claims, private notes, witness details or a researcher’s Board.
- Updated strict public package allowlist for `evidence-dna.js`. The new `scripts/test_evidence_dna.cjs` has synthetic regression cases covering duplicated URLs, unverified sources, false corroboration, chains, reviewed citation requirements and circular dependencies. Existing Case Connections tests remain separate.
- Added **isolated R2 QA** workflow `.github/workflows/qa-r2-evidence-dna-no-deploy.yml`. First exact-code workflow `43517988515` at `7eecb2902b57fd7c6ca041950c9e113946707380` passed source tests, allowed bundle (95 files), public-link audit (0 errors, 3 existing hidden W.NE link warnings), and case modal display on Chromium 393px and 1280px.
- This is a **foundation**; no historical claim independence has been adjudicated, no public reviewed lineage dataset exists, no interactive complete visual graph and no Contradiction Radar. Those are subsequent R2 milestones. Native Android physical tests, actual phone performance, full release integration and owner acceptance remain.
- The branch originated as a documentation-only snapshot of staged R1. Before any future R2 deploy it MUST be rebased/reconciled onto the actual accepted R1 live commit; a green R2 branch test is not release authorisation. **Release 1 remains the sole next deployment candidate.**


## R2 milestone 2 — document-level cited claim drafts (13 Nov 2026)

**Implemented on R2 queued branch only; NOT deployed / NOT release-approved / NOT merged into R1.**

- Added `data/evidence-dna-claim-drafts.json` containing **four directly cited, editorial-draft claims** from two public cases: Rendlesham Forest and Roswell. Source page identifiers and section locators reference the UK National Archives, US NARA Blue Book guide and GAO NSIAD-95-187. Every claim includes a caveat about what that source can actually establish; source statements are not independent verification of anomalous events.
- Extended `assets/evidence-dna.js` to require each claim citation's `documentId`, canonical URL and locator to match a graph document. Preserves `draft-needs-review` state. No claim-level chain is counted as verified without actual documented relationship evidence; **no independent-witness count** is inferred from source citations.
- Existing archive Evidence DNA disclosure now displays two draft claims per featured dossier with clickable original links, specific section locators and context; other archive records remain source-inventory-only. New optional data loads only from same-origin static public file, with graceful fallback. No private files, Supabase schema or login changes.
- Updated strict website allowlist/package checks and synthetic validations for the JSON claim source; Chromium checks verify labelled claims and source links on 393px and 1280px viewports. QA **SUCCESS**: GitHub Actions `43519473367` for code commit `40b36fc76dbc4bef4ed99199e292fac4aeb0a147`; 96 public allowlisted files; 18-page link audit 0 errors, 3 existing hidden W.NE link warnings.
- Initial CI identified stale package-count upper bound (updated) and a real archive startup **temporal dead zone** where the claim-loader's `let` state was initialised after an early startup call. This **was fixed in the app**, not concealed by changing the test. The subsequent mobile/desktop browser run is green.
- Editorial sign-off, verifying exact source-page claims, real Android QA, future source-to-source dependency entries, Contradiction Radar and relationship graph **still outstanding**. Do not call this a full independent provenance map or deploy-ready release.
- Research design and source trail: `docs/R2_EVIDENCE_DNA_CITED_CLAIMS_M2.md`. R1 must publish and pass acceptance before rebasing/reconciling R2 onto the verified live commit, running exact merged CI and seeking explicit owner approval. Netlify, production and AdSense remain unchanged.


## R2 Milestone 3 — Who's Who in Disclosure (14 November 2026)

**Separate R2 development branch only; public editorial preview, NOT RELEASED.** Reddit feedback prompted a professional who's-who section. Release 1 independently stages clickable logo/Home and native browser Back; the directory is **not** included in R1.

- Seven initial source-linked biographies: David Grusch, Ryan Graves, David Fravor, Ross Coulthart, Jeremy Corbell, George Knapp, Mick West. Each has three original background/involvement paragraphs, dated research timeline, statements/context/limitations, official source documents, external news and independent reporting, appropriate public organisational/social pages, and labelled original-video interviews/testimony/analysis.
- `data/public-people-directory.json` contains curated **research-copy-edit-needed** entries. `who-is-who.html` is a searchable independent public page linked from Home, Explore, About; `assets/people-directory.js` provides category/search filters, individually shareable `?person=...` profile routes, keyboard accessible profile navigation and an opt-in **youtube-nocookie.com** embedded video on user click. Video is not preloaded/autoplayed; original publisher link is always supplied. Testimony / commentary / original source footage distinctions are explicit.
- **Copyright/privacy:** no images copied or unauthorized portraits; typographic initials until rights verified. Only externally verified public accounts sourced from official published profiles; no unverified handles, direct private contacts, unmoderated character-rating polls, defamation or insinuations. Never treat reported allegations as factual proof or imply independent corroboration from repeats.
- Strict deploy allowlist `scripts/build_public_release.cjs`, sitemap canonical `/who-is-who`, and source/search/public-link regression assertions updated. Initial full code QA **GREEN**: GitHub Actions run `43583617250` at commit `321cb05d40b9fce740b8680f6b80667a0cb753bf` passed 7 biographies, 43 timeline/article references, 10 publisher videos, 16 public social links, 99-file strict package, 11 canonical public sitemap URLs, 19-page audit **0 errors** and 3 previously known hidden W.NE warnings. Local Chromium **393px + 1280px** passed search/filter, full narratives, direct links, no eager embeds, click-to-play, browser Back and no overflow; physical Android and publisher-embeddability remain untested.
- Scope and source-trace handover: `docs/R2_WHO_IS_WHO_DISCLOSURE_MILESTONE_2026-11-14.md`.
- Pending: editorial fact check against individual original public sources; verify external links/ownership and licensing, real Samsung device QA, optional further verified figures, case-to-person links and evidence-based (not person-reputation) surveys only after moderation/security design. R2 still awaits Contradiction Radar, visual relationships and verified source-lineage data. This directory is not a completed Release 2.
- R1 must first be merged with newer approved fixes, owner-accepted and published before R2 rebase onto actual verified production SHA, merged QA, final explicit R2 approval, deployment and post-deploy verification. **No Netlify build or AdSense re-review has occurred.**
