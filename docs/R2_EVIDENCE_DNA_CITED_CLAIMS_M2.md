# Evidence DNA claim-source review pilot — R2 Milestone 2
Date: 13 November 2026 · **Source branch only, not deployed**.

## What this milestone actually contains
- Public *editorial draft* dataset: `data/evidence-dna-claim-drafts.json`. Precisely two curated case IDs (Rendlesham Forest, Roswell), two claims each, four direct links to institutional source pages and section locators.
- Source verification starting points:
  - UK National Archives UFO reports page, heading **Correspondence on the Rendlesham Forest incident**.
  - US National Archives Project BLUE BOOK page, section **The Roswell Incident**.
  - GAO **NSIAD-95-187**, July 28 1995, **Highlights**. These references support statements about the source collections and review remit only; they do not independently verify the reported sightings.
- New graph validation checks document identity, matching citation URLs, non-empty section locators, and draft/review states. A general source hyperlink is not verified testimony or proof of an event.
- R2 Evidence DNA case modal shows each individual draft claim and its specific source, locator and contextual limitation; no private user work or witness location is included.
- The site loads a tiny versioned public claim dataset before showing the curated archive cases, but gracefully falls back to inventory-only if it cannot load. No new backend, database or third-party API.
- Every claim is **draft-needs-review**, and all source dependency edges for those historical cases are empty. We have NOT verified any claim's independence, witnesses, or source-to-source ancestry. There is no automatic model-generated statement, no contradiction verdict and no automatic publication.
- `scripts/test_evidence_dna.cjs` rejects mismatched document citations and missing section locators and checks the four claims against valid case IDs. `scripts/test_original_research_chromium.cjs` checks the two draft cards and source links in the existing mobile/desktop modal.
- Strict website-only release packaging explicitly includes `assets/evidence-dna.js` and `data/evidence-dna-claim-drafts.json`. Changes are **only on** `queue/dd-web-r2-evidence-intelligence`, not on R1 or `production`.

## Pending research and release gates
1. Copyedit and human-review each draft claim against source text and exact cited sections. Correct source/locator errors before considering publication.
2. Build a *separate human-reviewed relation ledger* with citations and independent-source assessments. Then use it for Contradiction Radar, showing actual source passages side-by-side; mere semantic mismatch is not proof of contradiction.
3. Test the exact HEAD of a no-deploy GitHub Action plus one physical Samsung/desktop pass. Check 404/source pages, collapsed/expanded layouts and case deep links.
4. R2 cannot deploy until R1 is approved and published and this branch has been rebased/reconciled with its actual production SHA. Require explicit owner approval for R2 after full acceptance. No Netlify preview, build, merge or AdSense review by this milestone.

## Source references
- https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/postwar/ufo-reports/
- https://www.archives.gov/research/military/air-force/ufos
- https://www.gao.gov/products/nsiad-95-187
