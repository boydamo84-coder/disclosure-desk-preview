# DD-WEB-R2 — Evidence Intelligence (queued)

**Current status:** Evidence DNA alpha foundation coded and isolated QA green; still NOT DEPLOYABLE. Contradiction Radar and visual case graph are not implemented.
**Target branch:** `queue/dd-web-r2-evidence-intelligence`
**Depends on:** DD-WEB-R1 successfully published, checked and accepted; rebase future R2 implementation on the **verified live production commit**, not the original branch snapshot.

## Three approved deliverables

### Evidence DNA — source dependency explorer
For a claim or archival case, display where the claim originated, which documents cite or repeat it, which accounts are demonstrably independent, and where the provenance chain breaks. Any automated link carries actual documentary evidence: URL/catalogue ID, author/date or an excerpt location. Treat unverifiable claims as unknown rather than manufacturing a source. **A citation does not prove a source endorses the cited statement.** Never summarise 12 articles as 12 independent witnesses.

### Contradiction Radar — contextual discrepancy tracker
Allow researchers to select statements in different documents and identify candidate discrepancies in dates, distances, identity, reported details and interpretations, presenting both passages and their surrounding context. Distinguish different recollections, updates, transcription errors, differing date conventions and genuine contradictions; never label witnesses dishonest. People must verify any proposed discrepancy.

### Interactive case relationship graph
Visualise source-linked nodes for cases, documents, locations, events and claims. Show separate edge types “shared topic”, “same source”, “possible same event”, “reported by”, “contradicts” and “verified connection”. Reuse R1's explainable Case Connections but keep suggestions and independently confirmed links visually distinct. A limited, accessible graph view is preferable to thousands of illegible nodes; retain text alternative on mobile.

## Implementation architecture (not yet implemented)
- Start with a typed provenance schema (case ID, source document, claim ID, exact provenance, relation type, review status and citation), an explicit manual review workflow and a local export format.
- Use public-sourced metadata and document passages permitted by licence, not an unbounded full-text scraping pipeline.
- Store private/unpublished claims only in the owner's research area, never as public cross-user graph edges.
- Build falsifiable unit fixtures first; synthetic cases test transitive dependence, separate eyewitnesses, cycles, and contradictory versions.
- Integrate into the existing Archive/Boards/W.NE without expanding main navigation; don't change existing published content silently.

## Acceptance gates before any deployment
- Source lineage is auditable; one original account repeated by many publishers is not counted as independent corroboration.
- Conflicts show both full citations and contextual limitations; researcher verification is explicit.
- Secure permission checks and opt-in are enforced; no private user or witness records enter the public graph.
- Good performance with thousands of cases; keyboard and Android navigation usable.
- Independent CI and strict release package tests pass on the eventual R2 merged SHA, followed by physical device and owner acceptance.
- R1 remains the sole authorised website release candidate until promoted.


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
