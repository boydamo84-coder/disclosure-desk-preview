# DD-WEB-R2 — Evidence Intelligence (queued)

**Initial status:** APPROVED AS ROADMAP, NOT BUILT, NOT DEPLOYABLE.
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
