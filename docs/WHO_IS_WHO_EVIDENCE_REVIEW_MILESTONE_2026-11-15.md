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

## New: publicly inspectable evidence trail (15 Nov source milestone)

The owner clarified: a visitor must be able to **open and independently examine all sources used to justify a conclusion**, not merely read a claim's numeric score. This is implemented on the same isolated source branch:

- Inside each claim's responsive rating card, a keyboard-accessible, closed-by-default **View evidence & scoring breakdown** disclosure shows all five criterion points, an explanation of why those points were awarded, and direct references considered for **that specific criterion**.
- An itemised **All material considered** ledger gives original publisher/source, link, type (primary record, measurements, analysis, reporting), stance (supports / challenges / alternative / context), page/section/timestamp locator, reviewed date, and an editorial description of how it bears on the claim.
- Also display the scope of the editorial review, explicit limitations/uncertainty, editor, review date, methodology and revision. Review notes are paraphrases; the full source stays with the publisher and no copyrighted media are republished by this feature.
- Both the independent editorial score and member rating appear adjacent to this shared source trail; guests can inspect the public evidence without an account. A community rating is an expression of what members think of those **same published sources**, not independent scientific validation.
- All 50 original Who's Who profiles remain: three explicitly attributed statement drafts and remaining profiles show **Not assessed** until individually reviewed. Unscored claims offer **View original evidence sources (review pending)**, never misleading completed editorial conclusions.
- `publishedEvidenceTrail(claim)` blocks a numerical editorial score unless every criterion lists linked public evidence IDs, each evidence item has a validated HTTPS source, type, relationship, reviewed date, location and substantive editorial explanation, the primary document URL matches an attributed primary source, and review scope/limitations/revision are recorded.
- `communityClaimEligible(claim)` now also requires the **entire publishable editorial evidence review**, in addition to source-approved claim ID. Thus dropping one critical source or approval hides **both** the numerical editorial score and the member voting control.
- For missing, private, restricted or inaccessible supporting material, do not invent a public citation or imply it was examined. Mark the gap in limitations and withhold scoring where needed. Published links may later rot; periodically recheck evidence links and revise/correct the assessment rather than silently preserving a possibly outdated number.
- `who-is-who.html` adds mobile-friendly evidence expansion, criterion references and original-source links. `index.html` pinned research release announcement now explains how to inspect the evidence trail when the next release is published.
- Source-level manual V8 checks on the exact feature-branch JavaScript: **43 passed** including a wholly fictional scored claim and nine mutations denying numeric scores/community voting. Added fixture-source tests in `scripts/test_who_claim_evidence_contract.cjs`. This does NOT establish full browser CI, independent fact-checking, functioning production RPCs or a published release.

**Security and release boundary:** No Supabase schema application, real vote, personal data modification, new Netlify deployment or Android APK build. Live R3 owner-accepted site stays untouched. The first-pass 50-person source register remains an inventory, not 50 independently verified UAP claims.

## Release gate

Before any public launch: separately fact-check every person-specific statement and all source links, obtain source editorial review for any numeric score, run strict allowlist packaging and viewport/navigation browser regressions, and require an explicit deployment decision. Do not change user notebooks, cloud backups, account records or database schema.