# Who’s Who — Milestone 21: authored primary record, portrait provenance and safe voting draft

**15 November 2026 · isolated research branch only · no deployment**  
**Exact tested executable SHA:** `5cfb9b4f8ead535bfa4a42b1c05109222d0d1256`

## Confirmed GitHub tests — two exact-SHA green NO DEPLOY workflows

- **[Editorial gate + packaged source + responsive browser run 43739247999](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43739247999): completed SUCCESS**. Real Node 22 workflow ran `scripts/test_who_claim_evidence_contract.cjs` and `scripts/test_who_rating_backend_draft_static.cjs` before local-only public asset packaging. The latter reported **38 STATIC draft SQL contract checks passed**; it did not connect to a database. Its Chrome job successfully checked source readers and 96 profile interactions over **320/393/820/1280px**, retaining the premium 14-tab navigation, claim-scoped read-only state, original-source transparency and no voting controls.
- **[Isolated source + Chromium read-only run 43739247991](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43739247991): completed SUCCESS** at the exact same `5cfb9b4f...` SHA, with no Netlify, real data, APK, backend SQL or production GitHub action.
- Every later documentation-only handover commit is not a new runtime build; cite the exact **tested code SHA** above, not an assumed passing newer head.

## Research improvement 1 — Nick Pope’s actual authored 2013 briefing directly read

**First-party URL:** https://nickpope.net/wpte19/rendlesham-forest/

The original authored Rendlesham article was retrieved as readable public HTML using the web tool, rather than merely search-indexed excerpts. Key source distinctions visible directly in the text:
- Pope describes a 2013 presentation to former US Congressional representatives and a **later retrospective investigation**.
- He explicitly says **the 1980 events happened before he joined the MoD**, recounting his own 1991–1994 UFO-desk experience. The source cannot be cited as his eyewitness account of the 1980 events.
- He discusses conventional explanations and how he evaluated them, acknowledges the Ministry of Defence’s **“no defense significance”** stance, and says the results of US investigations were unknown to him.
- An accessible authored article establishes *what Pope wrote*. It does not authenticate a claimed object, 1980 sensor data, completeness/history of a 2013 webpage revision or his separate case-review notes.

**Staged source changes:** `data/public-people-directory.json` now records `original_author_page_text_retrieved` with precise paragraphs and the above limits, while `fullOriginalReviewed:false`, `secondEditorSignoff:'not_obtained'` and `publicationApproval:'withheld'` remain in place. `ratingReadiness.primarySourceAccess` is now `publisher_text_first_pass` (not scientific corroboration). `assets/people-directory.js` renders a separate clear, non-approving label; Node/Chromium contracts test it. The M18 historical “indexed/blocked” description is retained as a historical access result, not overwritten to imply earlier inspection.

**Next:** compare an archived, dated original 2013 snapshot and presentation, original USAF witness statements, signed Halt memo/audio, nightly timings, radar/calibration and alternative explanations with an independently qualified second reviewer.

## Research improvement 2 — Peabody/Knapp picture date checked; discrepancy not suppressed

- Original selected cropped portrait catalogue: https://commons.wikimedia.org/wiki/File:George_Knapp_(8221331696)_(cropped).jpg
- Peabody’s own ceremony chronology: https://peabodyawards.com/stories/complete-69th-annual-peabody-awards-may-17th-2010/
- Original Peabody Flickr item: https://www.flickr.com/photos/peabodyawards/8166983929/

Peabody confirms its **69th ceremony was 17 May 2010**, consistent with the portrait’s *caption*, but the Commons/Flickr photo taken-date metadata says **18 May 2009** (the day of the 68th ceremony). That is contradictory metadata; the documentation does **not** claim to resolve the precise frame’s real capture date or camera clock. Wikimedia Commons supplies a **CC BY 2.0** listing and credits Anders Krusberg / Peabody Awards, while personality/model rights and the crop chain still require human professional review.

**Staged data change:** `photoRightsAudit.detail` and `rightsFollowup` record independent organiser context, photo-date discrepancy and next checks; `finalRightsApproval:false` and `independentRightsReviewer:'not_assigned'` remain. No portrait was added, removed, or newly licensed.

## Research improvement 3 — Brazilian 1997 official inquiry already indexed and rechecked

The **existing** James Fox source reader already points to Brazil’s Superior Military Court official *Inquérito Policial Militar n.18/1997*, reference `BR DFSTM 002-001-001-ipm-18-1997`: https://arquimedes.stm.jus.br/index.php/informationobject/browse?collection=4908&genres=439&languages=pt_BR&places=14570&sf_culture=pt_BR&showAdvanced=1&sort=startDate&sortDir=asc&subjects=16446&topLod=0&view=table

Its Portuguese catalogue identifies a **1997 military inquiry into allegations reported in a 1996 book**, not that a non-human creature was recovered. The existing four James Fox research items include the STM archival index and a separate **original second-volume scan**, but no full official decision/complete dossier translation was performed this milestone. Do NOT add this reused single inquiry as independent proof of a second event or falsely report a newly discovered duplicate source.

## Voting security draft — strengthened, not applied

**Design file only:** `docs/WHO_CLAIM_RATINGS_SQL_DRAFT_ONLY_2026-11-15.sql` is explicitly NOT A MIGRATION. Current proposed registry `dd_who_reviewable_claims` remains disabled by default, contains no seeded claim, and now has a `CHECK` preventing a claim from being *enabled* without non-null original-record-review and independent-editor date fields plus two distinct named reviewer fields. It is important that these are **editable metadata assertions** and do not constitute verified human identities or real independent signoff.

The public guest summary draft `dd_who_claim_rating_summary` now rejects null/empty/over-20 and malformed ID lists. Other draft safeguards remain: no direct table grants to anon/authenticated, both tables have RLS enabled, fixed `SECURITY DEFINER` search path, summary count threshold of 5 for showing member average, signed JWT-derived voter identity, exclusion of anonymous sign-in, one vote per account/claim, cooldown and daily creation limit. **These mechanisms are not yet authenticated/penetration-tested or applied to Supabase.**

`docs/WHO_COMMUNITY_EVIDENCE_RATINGS_BACKEND_CONTRACT_2026-11-15.md` was corrected to match the *actual* proposed names (`dd_who_claim_ratings`, `primary_source_url`, disabled-by-default `enabled`) rather than outdated alternative names.

**New test:** `scripts/test_who_rating_backend_draft_static.cjs` runs **38 local read-only source assertions** checking metadata gates, no seeded claims, grant/RLS text, bounded inputs and privacy-related API contract. Both `.github/workflows/who-claim-evidence-no-deploy.yml` and `.github/workflows/who-evidence-no-deploy.yml` now include this script; only the isolated branch runs them, and the second workflow watches draft/test contract changes. No SQL or actual account request was sent by these tests.

**Required separate stage before ANY member votes:** owner-approved throwaway PostgreSQL/Supabase staging project; trusted pair of genuine test accounts plus guest/anonymous sign-in; JWT expiration, session deletion and role tests; raw table GRANT and RLS penetration tests; deliberate tampering with claim IDs and reviewer metadata; SECURITY DEFINER owner privileges; concurrency, moderation, 3-minute cooldown, 30/day throttle, 5-member privacy threshold, account deletion cleanup and fail-open checks. Only after a real independent human editorial rights/security review should the owner consider deploying a new migration or scoring UI.

## Baseline retained and explicit limitations

**50** people preserved, **23** individual claim/recommendation research records, **27** non-incident/FOIA scope panels, **89** research evidence items, **20** previously selected Commons image listings and **30** initials fallback portraits. All **23** sourceAccessCheck records still have `fullOriginalReviewed:false` and `secondEditorSignoff:'not_obtained'`. None has a completed publicly approved numerical site rating or community ballot. No new 0–100 value, individual honesty ranking, unsourced claim or cross-person score has been invented.

**Absolutely no release:** no GitHub `production` merge, Netlify build/credit use, Supabase live SQL, production JWT/session, new APK, Play Store action, private R3/Hypothesis Lab encrypted vault or W.NE file change.

## Proposed M22

1. Pick independently obtainable **primary evidence master or scientific/public record** per high-priority claim, but document source ancestry; do not mistake the same journalist reporting the same witness as multiple corroborations.
2. Obtain responsible independent photo rights and second-editor reviews, recording verifiable identities and qualifications; no synthetic approvals.
3. In a truly isolated database, perform actual RLS/JWT/transaction race/ownership tests of the revised **draft**, report failures and fix before any authorised deployment.
