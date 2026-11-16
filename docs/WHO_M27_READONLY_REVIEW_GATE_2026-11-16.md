# Disclosure Desk — Who's Who M27: read-only editorial launch gate
Date: 16 November 2026 (Europe/London)
Status: **DEVELOPMENT ONLY; no live score, no community voting, no portrait rights approval and no deployment**

## Baseline and scope
- Start from M26 production-derived read-only source `e25eb6d0be5ba4d4c929dee583f262eda1d05146`.
- M27 stays on `prep/who-evidence-readonly-m27-20261116`; live `production` remains untouched.
- Preserve the 50 public profiles, their premium 14-tab navigation and evidence reader, plus the R3 release announcement that is already in the production-derived baseline.
- This milestone does not change Who's Who public language, live data, authors, claims, profile photos, live-account permissions, scoring SQL or Android code.

## What M27 adds
- An offline fail-closed test: `node scripts/test_who_m27_readonly_launch_gate.cjs`.
- Checks 50 unique profile IDs, 23 specific attributed claim/recommendation drafts and 27 role/publication-only profiles with an explicit **Not applicable** decision, not a punitive zero.
- Checks 89 inspectable research items, 59 currently distinct evidence-item URLs and 17 primary-publication containers for 23 claim drafts. The three shared primary publication groups are intentionally flagged: Grusch/Graves/Fravor; Elizondo/Gallaudet/Shellenberger/Gold; Nolan/Vallée.
- Verifies item locators and contextual notes, and retains no score/vote/portrait approval for all records. Also confirms the site's explicit independent-review approval guards remain in place.
- The 59 links and 17 publication containers are *bibliographic inventory*, **not** a count of independent witnesses, events, verified sensor observations or corroborated UAP claims.
- Dedicated GitHub Actions workflow runs source/package gate and phone/tablet/desktop local Chromium regression; it contains **no** Netlify deploy step or Supabase credentials.

## Human review still required before any numerical release
For each of the 23 individual dossiers, independent source/editorial review must:
1. Open the exact original source and verify attribution, whole passage, date, context and any omissions. A URL being indexed or a hearing transcript being accessible is not this review.
2. Separate first-person witness experience, a witness reporting others' accounts, documentary provenance, scientific hypothesis, policy request and the wider extraordinary interpretation.
3. Identify separately collected independent corroboration, underlying sensor/physical records where applicable, and alternative explanations. Multiple witnesses on a single hearing transcript do not automatically give multiple verified event sources.
4. Record precisely located opposing material, unresolved questions and the provenance of every item used for the claim-specific rubric; commission a **second independent human editor**, including explicit disagreements and revision history.
5. Only after both editorial signoffs may a rubric result be considered for a particular **claim**. There must never be an overall honesty, believability or personal credibility percentage.

M26 directly spot-checked three passages in the 26 July 2023 House hearing (Ryan Graves, David Fravor and David Grusch), including distinctions between firsthand testimony and accounts told by others. Those *source-accuracy spot checks* were not a full fact-check of the underlying phenomena.

## Separate release gates
- **Community voting:** do not enable until the proposed Supabase endpoint has been reviewed with actual separate authenticated user JWTs, row-level policies, rate limits, one vote per account/claim, cooldown, denial of anonymous/unverified claims, and vote read/write isolation. A synthetic UI test is insufficient.
- **Portrait rights:** every image needs separately checked identity, original upload/creator chain, actual reuse licence, required attribution and second-person rights approval. An existing Commons listing is not automatic final approval.
- **Live deployment:** compare the proposed release with the *then current* `production`, run exact-head source/package and Chromium checks, verify no R3/News/Archive regressions and seek fresh owner authorisation. M27 alone does not release anything.

## Verification record
- M26 was the last verified read-only candidate reported in the prior handover. M27 source/QA results must be recorded against the **exact M27 executable SHA** after GitHub Actions runs; no success is assumed from writing this document.
- This milestone makes no original-source network fetch or claim finding, and grants no human editorial approval.
