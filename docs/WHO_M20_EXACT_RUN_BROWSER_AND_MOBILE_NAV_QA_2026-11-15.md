# Who's Who Milestone 20 — real GitHub CI, mobile evidence panels and safe navigation

**15 November 2026 · isolated development only · no publication**  
**Exact executable/test SHA:** `fc149803031f0b1ab797566ca00cf61540ce2d22` on `feature/who-evidence-score-framework-20261115`.

## Verifiable milestone result

**SUCCESS:** [GitHub Actions run 43735205530](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43735205530) is a completed *push-triggered*, no-production-deploy run with **both source-and-package and real Chromium jobs green** on exact executable/test SHA `fc149803...`. The test runner used Node 22 and a local-only HTTP server with playwright-core and Google Chrome. Logs explicitly show responsive source-reader/browser acceptance:

| Browser viewport | Profile visit/read-back cycles passed |
| --- | ---: |
| 320px small phone | 22 |
| 393px common phone | 30 |
| 820px tablet | 22 |
| 1280px desktop | 22 |
| **Total** | **96** |

The suite starts with a 50-card directory assertion, retains the original premium 14-tab scrollable dock, searches named profiles, opens and returns from each profile, expands individual evidence/source panels and checks role-only no-score notices, original access limitations and independent-review disclaimers. It checks no unauthorized visible editorial score or registered-member vote controls, link access panels, 320px overflow and browser page errors. All 96 covered cycles passed. These are **browser UI test visits**, not 96 distinct externally verified research claims or 96 human device tests. No real Supabase login or production vote occurred.

An additional intentionally conservative [Who Evidence — NO DEPLOY / source + Chromium workflow run 43735205415](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43735205415) on this exact SHA was **still pending** in the available Actions read at milestone recording, while an older sibling run remained in progress. No green result should be inferred for that separate run. The independently green complete existing editorial gate above is sufficient evidence of actual end-to-end no-deploy QA, not a production release gate override.

## Findings corrected (same research branch, no site deployment)

1. **Test text drift, not public-claim corroboration:** Original Ross Coulthart commentary explicitly says his original **YouTube** video player could not be opened. A test still expected the stale phrase “video player”. Updated the assertion to preserve the unverified original-video distinction, without changing source facts.
2. **Policy vs incident source reader:** An original research-policy recommendation and a UAP **records-access allegation** both deserve **Not applicable** to an *incident* score, not a fabricated 0 or a hidden ballot. Updated a reader label for Christopher Mellon’s 2025 published records-access claim to “PUBLIC POLICY / RECORDS-ACCESS CLAIM” and clarified its nonincident description. Mike Gold’s original “PUBLIC RESEARCH RECOMMENDATION” remains unchanged. Updated the source and browser tests to distinguish Not applicable from Not assessed.
3. **Mobile profile grid overflow:** Real Chrome initially exposed 18px horizontal overflow on Nick Pope at 320px, from `.profile-grid` children retaining minimum intrinsic width. Fixed by `minmax(0,1fr)` mobile layout, child `min-width:0` and scoped source-card `overflow-wrap:anywhere`. The original premium bottom nav was not redesigned.
4. **Back then filter focus timing:** Cancels pending double-requestAnimationFrame return-scroll/focus restoration when the reader immediately changes directory text or category after Back. This prevents a stale return focus from interfering with a new search.
5. **Realistic dock-safe tap testing:** Browser diagnostics showed a profile button partly beneath the *fixed original bottom dock* at one viewport: pointerdown targeted the card but the completed click hit the body/dock, not the button. The acceptance script now scrolls a button into the **usable content area** with settled frames and verifies the center hit target before clicking. Added `html` scroll-padding for keyboard/focus visibility. This exercises real unobstructed tap behaviour rather than interpreting a visually obscured pointer click as broken directory logic. Failures are still fatal, not retried or suppressed. Instrumentation remains in the test only.

## Trace and verification discipline

The previous M18–M19 status helper hid GitHub **push-triggered** Actions runs because it fetched only PR runs. M20 used the repository REST Actions runs collection via the authorized GitHub connection, the workflow jobs endpoint, and actual failed-job logs. Early M20 no-deploy builds were genuinely red due obsolete assertions and exposed responsive issues. Every described failure was investigated and corrected before the **successful exact-code CI** above. Do not represent earlier red, cancelled, or pending workflows as successes.

**Product safety retained:** 50 existing public profiles, 23 claim/recommendation drafts, 27 role/source-only scope notes, 89 provisional researchEvidence items, 20 Commons portrait metadata checks and 30 initials placeholders. **No real published numeric assessments or community votes**; all 23 first-pass original-source access records remain `fullOriginalReviewed:false` and independent editor approval pending. No actual original media master/full Brazilian tribunal translation, independent sample provenance validation, portrait licence final signoff or real authenticated backend JWT/RLS anti-abuse acceptance has been completed.

**Nothing released:** GitHub `production` was checked as `6b602324d14b834b0ef5ac222d3cae3acbf53a56` and remains unchanged by this milestone. No Netlify build or credits, no live Supabase migration/account action, no Android/Play, no private R3 encrypted Hypothesis Lab/W.NE state edits or publication of unsupported honesty/person-wide ratings.

## Suggested M21

Continue the **original-record verification and specialist rights review**. Obtain blocked original programme materials for Coulthart / Jake Barber / Lazar, original publisher text for Nolan, Vallée and Nick Pope, professionally translated Brazilian STM proceedings for Varginha, and independent source lineage/provenance assessments; document unresolved items before named second-editor approval. Separately create a genuinely isolated authenticated Supabase staging test design for vote ownership/one-vote-per-case, but do **not** enable or publish community votes yet. The user must separately approve any public release.
