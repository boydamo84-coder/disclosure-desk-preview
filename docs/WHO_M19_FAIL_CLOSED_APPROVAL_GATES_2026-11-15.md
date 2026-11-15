# Who's Who — Milestone 19: fail-closed publication and voting approvals

15 November 2026 · Isolated branch `feature/who-evidence-score-framework-20261115` · **DEVELOPMENT ONLY — NOT LIVE**

## Why this matters

The previous `publishedClaimReview` accepted a hypothetical complete editorial review if `claimKind` and `ratingReadiness` were *missing*: it only rejected certain bad values if those objects existed. That is a permissive metadata gap, **not evidence that any real person's public score, vote, or private record was exposed**. All 23 current claims remain withheld and have no actual scores or ballots.

## Actual M19 source change

`assets/people-directory.js` now requires every hypothetical publishable score to have ALL of the following, in addition to existing five-criterion source/evidence/rationale checks:

1. An explicit claim-specific `claimKind:'public_claim'`; missing kind or policy recommendation is rejected.
2. An explicit `ratingReadiness` object with `status:'independently_approved'`, `publicationApproval:'granted'`, `secondEditor:'approved'`, and ONE of `incident_evidence_review_approved`, `documentary_source_review_approved`, `method_specific_review_approved`. Pending/role/policy/not-applicable routes are rejected.
3. An explicit `sourceAccessCheck` with `fullOriginalReviewed:true` and `secondEditorSignoff:'approved'`. An absent, incomplete, blocked or first-pass original source cannot pass this publication gate.
4. The prior requirements remain: `review.status:'published'`, fixed method, dated named reviewer, explicit context/contrary evidence/second-editor booleans, valid primary HTTPS attribution, full inspectable source trail and criterion-by-criterion points within 0–100 total.

`communityClaimEligible` already delegates to `publishedClaimReview`; these new requirements therefore block **both** published percentages and member voting when required editorial review metadata is missing. The values are **documentary metadata assertions**, not cryptographic proof of a human sign-off. Two real independent human reviews, actual primary access and security tests remain mandatory outside this code.

## Regression checks added and actually performed

`scripts/test_who_claim_evidence_contract.cjs` now uses a wholly fictional approved claim with explicit positive fields, and includes new negative mutations that delete or withhold claim kind, review readiness, independent second-editor field, approved route, original full-review field, or source-access signoff. These must all suppress both published score and member rating. The existing rejection tests for unsuitable policy claims, unsafe URLs, missing source evidence and invalid rationale remain.

**Commits:**
- Application fail-closed gate: `18183168a4df20d34d6d818bd3c994c1941d1cba`
- Contract regression updates: `70664885f3bce385cc441bf5b8f199898f35b2a5`

**Actually executed via isolated V8 source evaluation and GitHub connector read-back:**
- 22 direct synthetic gate checks passed (hypothetical fully approved positive path plus ten missing/withheld metadata variations rejecting **both** score and vote).
- 221 source-level assertions passed after refetching the exact committed app, JSON, contract, Chromium script, Who's Who HTML and pinned homepage. These include JS compilation, roster invariants (50 people, 23 claims, 27 role/FOIA-only scopes, 89 provisional **researchEvidence.items**, which must NOT be confused with the 25 `claim.sources` references), every real claim's explicit withheld/read-only output and all 27 nonclaim record vote omissions.
- The source evaluator used a conservative HTTPS validation shim because the isolated V8 environment lacks browser `URL`. This is NOT Node's complete contract runner, a real Chromium/Playwright test, staging Supabase JWT/RLS test or Samsung/iPhone acceptance. No fabricated test-green claim.

**CI status:** The existing feature-only `.github/workflows/who-evidence-no-deploy.yml` is checked in and its filtered paths include both changed M19 files. The connector's `fetch_commit_workflow_runs` only returns pull-request-triggered runs; it and the combined status endpoint returned empty results for the M19 commit. Empty results are NOT proof of test success or failure. GitHub Actions real logs, exact commit SHA/job conclusion and Chrome screenshots remain to be inspected through an Actions-capable interface. The container cannot clone GitHub because DNS for github.com is unavailable. Do not trigger Netlify to work around this.

## Still blocked / next gates

- **Zero** named independent second-editor approvals, zero `fullOriginalReviewed:true` records, zero real published 0–100 assessments and zero member votes.
- Complete original inaccessible video masters for Coulthart, Barber and Lazar; direct original journal/author source for Nolan, Vallée and Pope; full source papers and independent scientific/case corroboration, especially source lineage that must not be counted twice.
- Finish rights/provenance vetting for 20 externally linked portraits and any additional likeness; all rights sign-offs remain withheld; keep the 30 initials fallbacks.
- Confirm exact-source NO DEPLOY Node + Chrome/Playwright regression at 320/393/820/1280px, preserve premium 14-tab nav and back/profile restoration; run authenticated JWT/RLS one-member-one-claim and anti-abuse tests only in secure nonproduction staging once approved.
- Do not merge to `production`, spend Netlify credits, change live Supabase, create votes, push APK/Play, touch private encrypted R3/W.NE data or invent person-wide honesty ratings. Any public release requires separate explicit owner approval after the evidence and privacy gates.

**Next:** M20 should seek genuinely independent original/source review and verifiable no-deploy browser evidence, not manufacture unsupported numbers.
