# Disclosure Desk R2 — M7 visual evidence relationship graph alpha
Date: 14 November 2026 · Branch: `queue/dd-web-r2-evidence-intelligence` · **NOT DEPLOYED**

## Graph semantics
This is a **reference network**, not a graph of authenticated UAP phenomena. The public nodes are (1) curated case dossier, (2) explicitly authored editorial-draft statement and (3) cited original source webpage. The directed edges mean either **case catalogues editorial summary** or **summary cites source page with exact locator**. Source-dependency edges appear only if the existing provenance parser receives an explicit document-to-document relation backed by a specific published source URL and locator. No other edges are inferred.

## Implementation
- `assets/evidence-dna.js` exports `buildRelationshipGraph(caseGraphs, selectedCaseId)`, reusing parsed/validated provenance. It conservatively de-duplicates document nodes by canonical URL and retains original citation locator/limitations. Capacity limits: at most 20 case inputs, 100 displayed nodes, 260 edges, 35 statements per case and 12 citations per statement; truncated state is explicit.
- Native expandable **Evidence Relationship Graph** panel inside Archive → case → Evidence DNA. A scope dropdown toggles **This case only** / **All currently curated cases**. A responsive SVG illustrates the source graph, with source nodes and visually dashed draft-only links; the semantic HTML relationship list remains accessible with descriptive source text and clickable originals. No network-fetching graph library, user data, tracking, migration or cross-origin embed.
- Current curated dataset produces 2 dossiers, 4 statement summaries, 3 distinct source pages and 8 catalogue/citation edges when showing all. **Verified cross-case connections = 0**. The National Archives page cited twice in the Rendlesham case is ONE source node. This does not establish an independent witness or occurrence.

## Validation and open work
- Unit tests enforce graph counts and source deduplication, citation locators, failure of invalid graphs and no invented case-to-case links.
- Real Chromium regression at 393px/1280px tests disclosure, filtering, SVG node count and accessible evidence list alongside original Archive, Case Connections, Contradiction Radar and Who's Who regression.
- No source relationships between the two historical events are asserted. Next work: source-reviewed claim dependencies, provenance-specific cross-case/document links where documentation justifies it, cited people-to-case roles, list/graph performance at larger coverage and Android hardware checks. An SVG preview or green CI does not replace human editorial source verification.
- R1 must publish and be accepted first. R2 requires rebase/reconciliation onto exact accepted live SHA, separate full QA and explicit owner authorisation. No Netlify branch preview, deployment, live account mutation, AdSense re-review or publication of private research.
