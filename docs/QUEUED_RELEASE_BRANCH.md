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
