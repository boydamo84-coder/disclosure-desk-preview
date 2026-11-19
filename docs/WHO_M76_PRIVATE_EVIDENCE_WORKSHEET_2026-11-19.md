# M76 — Private Who's Who evidence-assessment worksheet
19 November 2026 (Europe/London)
Status: production-derived staging only; **NO Netlify deploy**.

## Reason
M75 real Supabase Auth acceptance remains blocked by the owner's decision not to create another Supabase project. The owner explicitly chose to **leave both connected Supabase projects unchanged**. To advance existing feature goals, M76 adds a personal, claim-specific worksheet that does not need a backend, login or voting.

## Safeguards
- The worksheet is attached only to the initial five source-linked `incident_or_observation` claims in the current 23-dossier directory, and only where a labelled primary HTTPS source exists. No policy advocacy, people, institutional reporting or general technical research is numerically scored.
- Five criteria: original context 25, independent corroboration 30, direct records 25, testability 10, alternatives 10. `Not enough information` (empty answer) is distinct from `0`; partial worksheets show scored subtotal and assessed maximum **without extrapolating a 100-point total**.
- It runs entirely in browser page memory, doesn't call network APIs, doesn't store scores, doesn't create members, doesn't publish anything, doesn't mutate research records. Clear button and returning to directory wipe the controls. No feedback is collected.
- This is the reader's **private subjective worksheet**, not a Disclosure Desk editorial verdict, a truth-probability percentage, a person-honesty rating, a verified claim, or a community vote.
- `whoEvidenceBallots:false` stays off; M64/M67–M75 voting runtime and SQL are absent from this production-based bundle. The M73 `approvedClaims:[]` experimental review remains untouched. Adsterra `RELEASE_ENABLED=false` remains OFF.
- Build pipeline still uses the strict reviewed public-file allowlist. Exactly one new public JS asset is included; CSS is scoped inside the existing Who page. No offline QA/docs/backend files shipped. Package remains within the 130-file cap for production context.

## Scope and release plan
Branch `prep/who-m76-private-worksheet-20261119` was created from LIVE production SHA `9fcaec4e602331b9a557937f6ee15ddd9a3f5ff2`, **not from old M67–M75 experiments**.
Modified: `who-is-who.html`, `assets/people-directory.js`, strict `scripts/build_public_release.cjs`. Added `assets/who-private-worksheet-m76.js`, offline contract and Chromium 320/393/820/1280 tests.
Await green CI and explicit owner release decision. In a future significant website release, include the already tested M71 branch-production build safeguards as appropriate, keep Netlify credit use deliberate, protect rollback and compare exact production-manifest hashes after deployment. Do not promote this branch automatically.
