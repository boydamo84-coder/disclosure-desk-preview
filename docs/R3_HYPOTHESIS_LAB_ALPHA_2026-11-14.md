# Disclosure Desk — R3 Hypothesis Lab alpha milestone
_Date: 14 November 2026 · Branch: `queue/dd-web-r3-from-r2-nov14` · DEVELOPMENT ONLY_

## What was implemented

Standalone dependency-free `experiments/r3/hypothesis-lab.cjs`, intentionally **not** included in website public packaging. No Netlify preview, Supabase updates, authentication changes, Android APK build or production merge occurred.

Pure functions: `createNotebook`, `addHypothesis`, `reviseHypothesis`, `revision`, `compareHypotheses`, `serializePrivateDraft`.

- A notebook belongs to a named **workspace and case**; visibility is fixed `private` and its schema version is explicit.
- Each hypothesis is **researcher-authored** and includes an explanation, assumptions, testable observation predictions, what an observation/absence would mean, a proposed test method, disconfirming observation(s), and alternative interpretations.
- Source references have an attributed label, HTTPS URL and optional source locator. No reference supplied is marked `references-needed`; supplied URLs remain `references-provided-not-independently-verified`, not verified evidence.
- Every revision adds a strictly increasing UTC timestamp and version number; previous revisions are preserved in the returned immutable notebook. Earlier predictions do not silently change after revising.
- Comparing 2–10 distinct hypotheses produces a **side-by-side, unranked** read-only view. No automatic scoring, alien-origin probabilities, truth judgements or evidence-generation.
- The data model rejects `public` visibility and requires matching workspace ID for reads, writes and explicit JSON export. The JSON serializer returns text to its caller; it **does not save/upload/share** anything.
- Error cases enforce valid IDs, explicit UTC timestamps, duplicate IDs, previous-history ordering, necessary disconfirming tests/alternatives, bounded input, unsafe URLs and no unsupported probability fields.

## Verified test milestone

- New isolated offline test: `scripts/test_r3_hypothesis_lab.cjs`, covering **two competing synthetic hypotheses, a revision preserving the previous prediction, exact timestamp history, immutable snapshots, multi-workspace mismatch rejection, safe/unsafe citations, missing references, private export, no automatic scoring/publication and invalid input rejection**.
- Existing Gap Finder source-aligned test also runs in the same workflow.
- Updated no-deploy workflow: `.github/workflows/qa-dd-web-r3-gap-alpha-no-deploy.yml`, with both code tests and a release-allowlist absence check.
- **GitHub Actions [run 43646487769](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43646487769) SUCCESS**, workflow HEAD `91295d7a9073d3772fd3ad937fe0c71217001ec8`. Log confirms:
  - `PASS R3 gap finder alpha: 12 public entries, 3 incident-only records, 12 tentative field-based prompts, strict provenance, privacy and no-claim guardrails`
  - `PASS R3 Hypothesis Lab alpha: 2 competing private hypotheses, append-only revisions, disconfirmation, citations, isolated projects and no ranking/publishing`
  - Experimental files excluded from public-release bundle.
- Green offline QA **does not** prove mobile UX, real user-account isolation or security in an eventual authenticated application.

## Next milestones (NOT yet completed)

1. Design a **mobile-friendly private UI** for editing assumptions, predictions, potential falsifiers, source locators, and viewing past revisions and side-by-side explanations. Preserve the original R2 premium navy/gold navigation.
2. Choose a **real secure storage model**: offline single-user data protection and an optional authenticated account adapter must be explicitly designed and tested. `workspaceId` checking in a pure local function is **not real access control**; immutable returned data is **not tamper-proof long-term persistence**.
3. Manually review reference sources. Link a human-confirmed Gap Finder prompt to a hypothesis as an optional note without auto-generating evidence or concluding that an observed event has a particular cause.
4. Add export/restore with local user consent, version integrity and no silent publication; source/citation markers in W.NE only after privacy review.
5. Browser/mobile accessibility, privacy regression, security, real Samsung/iPhone QA and an independently approved R3 production publish remain outstanding.

**Release discipline:** R2 remains live at Netlify `8af0a5a`. R3 and R4 are not deployed. Experimental alpha files are not served by the production static site. No user data was accessed.
