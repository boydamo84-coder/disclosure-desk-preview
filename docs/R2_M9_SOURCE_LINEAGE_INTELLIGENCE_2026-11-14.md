# Disclosure Desk R2 Milestone 9 — Source Lineage Intelligence

**Date:** 14 November 2026 · **Development only:** `queue/dd-web-r2-evidence-intelligence` · **NO deployment or Netlify build.**

## What is implemented

- `assets/evidence-dna.js` now exports `sourceLineageAudit(rawGraph)`, explicitly dividing reviewed source references (`mentions`, `cites`, etc.) from separately verified **copying/dependency relationships** (`repeats`, `derived_from`). Proposed or disputed edges do not count as reviewed. It lists documentary URLs, source sections, origin/unreviewed status, first-hand document labels only where expressly evidenced, and unreviewed candidate relationships. It never infers independent witnesses or a UFO event from source count, publication date or a review flag.
- Reviewed edges now require a locator *on the referring document itself*, rather than any unrelated external page. This prevents a different publication from being passed off as evidence that one named source explicitly mentioned/copied another.
- One deliberately small, authentic checked **reference** was added to the Roswell case graph: the US National Archives' Project Blue Book guide, section **The Roswell Incident**, describes the General Accounting Office audit begun in February 1994 and the subsequent 1995 study. That text is a documented **mention of the GAO inquiry**, not an audited finding that NARA copied the GAO report or that any reported extraordinary event happened. The other source is the US GAO's `NSIAD-95-187` report dated **28 July 1995**.
  - Referring archive page: https://www.archives.gov/research/military/air-force/ufos
  - Referenced government report: https://www.gao.gov/products/nsiad-95-187
  - Specific source locator: archive page → “The Roswell Incident” → paragraphs beginning “At the request of Congressman Steven H. Schiff” and describing the GAO audit.
- New expandable **Source Lineage Desk** in the existing Archive case Evidence DNA section. It displays checked mentions vs confirmed re-use separately, counts unresolved source origins, and links to the exact public publisher reference. Rendlesham correctly shows **no verified source-to-source links**. Other Archive records retain source-inventory-only where no curated document graph exists.
- The existing accessible relationship graph now carries that checked NARA→GAO link as a document-reference edge. The source list distinguishes a reviewed *mention* from a reviewed *re-post*, and a visible legend explains that a solid line verifies the reference wording **not** incident truth or copying. Same-column document nodes use a readable curved link, with an independently accessible source list.

## Current dataset — source-aware but intentionally incomplete

- Four editorial-draft case summaries in two cases, plus three source-attributed person roles in the Nimitz/Rendlesham investigations (M8), unchanged.
- **One reviewed inter-document mention (NARA→GAO), zero evidenced source copying/derivation links, zero confirmed cross-case event connections, independent-witness count unknown.**
- Across the optional all-curated graph: 3 case nodes, 3 public person nodes, 4 claim-summary nodes, 6 distinct original source-page nodes: **16 nodes**, and **15 typed reference/catalogue edges** in total. These are not 15 independent items of evidence.
- A reviewed *mention* does not automatically mean NARA independently checked, endorsed or relied on every statement in the GAO report. Both Roswell document origins remain unassessed. All four claim summaries remain explicitly editorial draft pending human source review.

## Safety and technical QA

- `scripts/test_source_lineage.cjs`: real NARA/GAO mention vs copying, absent Rendlesham dependency, 16-node/15-link overall graph, fake evidence URL, missing locator, unsupported schema, proposed relations, a separate synthetic document reuse chain and unknown independent-witness counts.
- `scripts/test_original_research_chromium.cjs`: at Samsung-width 393px and desktop 1280px, checks checked-vs-unchecked source ledger, original link, exact NARA reference location, clear non-copying caveat and the visible graph relation/text alternative.
- Strict public file packaging and existing Who's Who/case relationships remain unchanged; no scraping pipeline, third-party embed, private Board, database migration, account interaction or copyrighted long extract added.
- **Editorial hold:** external links and specific source interpretation must still be checked by human editor, and the live app requires real Samsung accessibility/device QA. No owner-accepted R1 production baseline exists in this branch; R2 cannot be published until R1 is released, accepted, branch reconciled and exact merged QA passes with explicit owner approval.

## Next candidate

After review of more source-specific references: editorial worklist identifying direct first-hand documents, each later report's **exact quoted citation**, explicit documentary reuse and a link to the earlier public report; warnings for circular citations and unverified proposed links; avoid automatically calling common URLs distinct original eyewitness accounts.

## Automated QA outcome (14 November 2026)

**SUCCESS:** isolated GitHub Actions [run 43591055313](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43591055313) for tested code SHA `5a8766ec0ef3d4420bc1afb48fb3f5e0b11b81cc`.

The run included `node scripts/test_source_lineage.cjs`, existing independent source/people validation, strict public package and link audits, responsive local Chromium Archive comparison, real case dialogs and source graph checks (393px phone and 1280px desktop), and Who's Who browser navigation. This does **not** substitute for hand-checking external links against the original source passage, human claim/editorial approval, physical Android testing or the owner-controlled release workflow.
