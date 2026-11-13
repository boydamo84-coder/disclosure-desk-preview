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
