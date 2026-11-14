# Disclosure Desk R2 — M6 researcher-selected statement comparison
Date: 14 November 2026 · Branch: `queue/dd-web-r2-evidence-intelligence` · **Development only; no Netlify deploy**

## Implemented
- `DDEvidenceDNA.compareSelections(caseGraphs, selectionA, selectionB)` accepts one explicitly selected `caseId` and `claimId` for each of two independent UI selections. The selection may span different curated cases. Both selected claims must pass the original document/citation validation and have a real cited source with exact locator.
- `index.html`'s existing Contradiction Radar disclosure now has two accessible dropdowns drawn only from the existing public editorial-draft dataset, plus a deliberate **Compare selected statements** action. Comparisons are not auto-submitted or saved, and case records are not altered. Results include contextual editorial statements, original URLs and page/section references, overlap in canonical source pages and a strong caution against inferring honesty, contradiction, evidence or witness independence.
- The two existing published research-draft dossiers remain the only input: Rendlesham Forest and Roswell, each with two cited editorial summaries. Cross-case juxtaposition is explicitly presented as a reading aid, **not evidence that the two incidents are related**.
- Both same-ID selection and nonexistent/uncited claim selections are rejected; links and rendered text are escaped and based on schema-validated public source metadata.

## Tests
- Unit tests in `scripts/test_evidence_dna.cjs`: valid cross-case comparison, self-comparison/unknown/uncited rejection, no false contradiction or corroboration.
- Browser tests in `scripts/test_original_research_chromium.cjs`: both cases at 393px and 1280px, manual selection of a statement from the opposite dossier, comparison source links, same-statement guard, return to a valid pair.
- **GitHub no-deploy run 43586917276: SUCCESS** at code SHA `f20e1c14ddb86fd4b4cae74b7581aabb4f930873`. R2 not yet integrated into accepted production baseline.

## Limitations
Only four research-draft claims are selectable. No full-text passages, automatic semantic difference detection, real-user comments, private investigations, W.NE content, automatic metadata publishing or claim verification. Extend the verified source library, add quotation-level provenance, and provide optional explicit researcher notes only after privacy and licensing review. No AdSense or deployment action.
