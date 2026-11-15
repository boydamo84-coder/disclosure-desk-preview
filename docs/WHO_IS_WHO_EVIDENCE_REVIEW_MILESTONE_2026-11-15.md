# Who's Who — Claim evidence review (proposed milestone)

**15 November 2026 · Isolated development**  
**Branch:** `feature/who-evidence-score-framework-20261115` (based on R2/R3 GitHub `production` at branch creation).  
**Status:** User approved proceeding with a transparent evidence-strength feature. **Not released.** Existing production and working R3 site must remain unchanged.

## Editorial promise

Evaluate **specific attributed public claims**, not a person's honesty, trustworthiness, motives, or overall believability. This is a source-review tool, not a probability that extraordinary claims are true. Firsthand testimony can be sincerely given while the inferred explanation remains unsettled. Scientific critique, policy testimony and claimed physical encounters must be covered fairly.

The current directory is marked `research-copy-edit-needed`; its 50 public figures must NOT all receive numerical scores merely from their profiles, citations, number of sources, popularity or the prominence of their positions.

## Proposed evidence-strength rubric (0–100 points, not a percentage probability)

- Primary source recording precisely what is claimed, in context: **25**
- Independent corroboration of the underlying claim: **30**
- Direct supporting records/data that can be inspected: **25**
- Specificity and independent testability: **10**
- Alternatives and conflicting evidence examined: **10**

These are proposed editorial weights, not validated statistical confidence or scientific probabilities. Every public score must have individually reviewed component points, explicit reasons, independent primary-source links, conflicting/alternative references, named editor and review date. Unsupported cases display **Not assessed**, never 0%. Different claim types may require alternative qualitative treatment rather than mechanically applied score.

## UI

- New "Claim evidence" section in Who's Who individual profile immediately after "Public statements and perspective"; existing premium original 14-tab dock and Back/scroll mechanics unaffected.
- Accessible explainer of rubric, with source type, last review, corrections path and clear disclaimer.
- Named public figures do not inherit a single personal rating; separate claims independently assessed.
- Source-linked candidate statements may be shown **without score** until editorial verification.
- Future data entries have strict `reviewed` publishing gate: require item-level primary source, reviewer, review date, methodology, component scores within bounds, reasoning and supporting/contradicting source context. Any missing gate leaves the item unscored.
- No public voting, popularity rank, unmoderated accusations or automatically generated numerical scores; methodology remains open to corrections.
- Add tests that check the scoring gate and prevent a `review_pending` entry or missing source from showing numbers. Preserve all 50 original profiles and public rights/attribution.

## Release gate

Before any public launch: separately fact-check every person-specific statement and all source links, obtain source editorial review for any numeric score, run strict allowlist packaging and viewport/navigation browser regressions, and require an explicit deployment decision. Do not change user notebooks, cloud backups, account records or database schema.