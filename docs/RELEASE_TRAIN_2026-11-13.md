# Disclosure Desk — controlled multi-release train

Owner decision: 13 November 2026 · Project: `uapdisclosuredesk.com` (website only unless separately authorised)
**Authority:** the owner approved all six future research concepts and wants multiple **pending versions** that publish **one after another**, only after earlier releases are checked.
**No Netlify builds, account changes, branch merges to production, AdSense resubmissions, or automatic release actions are authorised by this document.**

## Versions and readiness

| Version | Working name | Tracked branch | Intended features | State as of 13 Nov 2026 |
| --- | --- | --- | --- | --- |
| **DD-WEB-R1** | Foundation, AdSense recovery and Case Connections | `audit/adsense-low-value-recovery-nov13` | Reconcile every already-approved website fix (M86–M96 and newer), no-regression news/community/W.NE, AdSense original research/editorial improvements, Rendlesham and Roswell dossiers, Case Connections for all public archive records | **Code staged; not release-ready**. Isolated QA green at run 43513005838; integrated branch, editorial review, real-phone and live checks pending |
| **DD-WEB-R2** | Evidence Intelligence | `queue/dd-web-r2-evidence-intelligence` | **Evidence DNA**, **Contradiction Radar**, **visual case relationship graph**, source provenance/independence checks | **Queue approved; features not implemented or tested** |
| **DD-WEB-R3** | Hypothesis and Discovery | `queue/dd-web-r3-hypothesis-discovery` | **Hypothesis Lab**, **Research Gap Finder**, guided comparisons and evidence-needs planning | **Queue approved; features not implemented or tested** |
| **DD-WEB-R4** | Living Research and Writing | `queue/dd-web-r4-living-research` | **Living Investigations**, **Research Passport**, carefully permissioned W.NE citation/version/export integration | **Queue approved; features not implemented or tested** |

**Do not confuse “queued release” with a deployable bundle.** R2–R4 are product scopes and isolated Git branches until real code and QA establish a releasable candidate. The order expresses dependencies, not dates or promised delivery.

## Branch safety / no wasted Netlify credits

1. Keep `production` and whatever Netlify actually deploys untouched until a release has explicit owner approval. Never trigger Netlify branch previews to test these queue branches; repository access alone cannot confirm Netlify branch-deploy settings.
2. R1 remains the isolated recovery branch. Verify the newest integrated approved website fixes have been incorporated without overwriting later commits. Reconcile M86–M96 and any newer fixes against the true current production head.
3. Queued R2–R4 branches may share an initial **documentation-only snapshot** of R1 for continuity. Do not regard that early common ancestor as a valid future release base; **after each previous release succeeds, rebase/recreate the next candidate against the exact live verified commit** and reconcile changes safely.
4. Use `docs/RELEASE_R2_EVIDENCE_INTELLIGENCE_SCOPE.md`, `docs/RELEASE_R3_HYPOTHESIS_DISCOVERY_SCOPE.md`, and `docs/RELEASE_R4_LIVING_RESEARCH_SCOPE.md` as scope contracts. Keep each feature's source, tests, history and open issues on its own track.
5. Do not merge R2 functionality into R1, R3 into R2, or R4 into R3 merely because a branch exists. A later feature cannot silently change an earlier release's scope. Prototypes may be coded ahead independently, but the final merge must be based on the newly verified production baseline.

## Promotion and rollback gates — each release independently

- **Scope lock:** implementation checklist and release manifest identify exact files/commits and whether each approved requirement is included; nothing is silently omitted or re-added from a stale branch.
- **Quality:** source audit, accessibility, content/source verification where relevant, strict website-only packaging, no-deploy GitHub Actions, mobile and desktop Chromium, physical Android checks, privacy/security and W.NE regression. Test the **exact merged release SHA** rather than only component branches.
- **Safety:** backup/recovery and deployment rollback plan; no private witness location, chats, research Boards or W.NE documents exposed; author-owned publication opt-in; no unlicensed third-party full-text copying.
- **Owner approval:** explicit final approval to deploy the identified release SHA (not approval of this roadmap); Netlify build once, no needless preview deploys.
- **Post-release check:** verify actual deployed SHA and public pages, sign-in, archive/news/comments, research/W.NE, Android usability and errors. If a serious regression exists, pause queued releases and roll back safely.
- **Promote the next version only after the previous one is stable and accepted.** Separate AdSense review is requested only after R1's relevant live fixes are verifiably published; Google approval is not guaranteed.

## Definition of feature evidence

- **Evidence DNA (R2):** reference and claim lineage; direct source vs repetition; source independence is **not inferred from count of URLs**. Every edge must cite a document, passage and type of relationship. Automated extraction remains provisional for researcher review.
- **Contradiction Radar (R2):** side-by-side exact attributed statements with date/subject/source context and “potential discrepancy” wording; do not allege dishonesty or infer certainty from model classifications.
- **Visual graph (R2):** case↔document↔claim links with source provenance, graph filters, phone accessibility, and clear “suggested vs verified” edges; avoid graph hairballs.
- **Hypothesis Lab (R3):** investigator-written competing hypotheses, predicted evidence and falsification questions; never an automatically generated “alien probability.”
- **Research Gap Finder (R3):** document missing evidence, inaccessible source and testability across the records genuinely reviewed, not presumed absence from all sources.
- **Living Investigations (R4):** dated changes, revision diff, owner controls and source alerts; no automatic conclusion rewrites.
- **Research Passport (R4):** reproducible question→sources→method→findings→limits→revisions; export to W.NE/DOCX/PDF without leaking private work.

## Linked records

- Current candidate: `ADSENSE_RECOVERY_AUDIT_2026-11-13.md`.
- Consolidated R1 manifest: `docs/ADSENSE_RECOVERY_NEXT_DEPLOY_MATRIX_2026-11-13.md`.
- Case Connections technical design: `docs/CASE_CONNECTIONS_FULL_ARCHIVE_DESIGN_2026-11-13.md`.
- Ground truth handover: `MASTER_HANDOVER.md`.
- No background deploy/monitoring automation created; subsequent releases need separate verification and explicit publish approval.



## Branch creation record (13 November 2026)

The queue branches now exist and each includes its own `docs/QUEUED_RELEASE_BRANCH.md`, with initial documentation-only commits:

| Queue branch | First branch-only documentation commit |
| --- | --- |
| `queue/dd-web-r2-evidence-intelligence` | `bd98977869f97e44aad5136794f36929ea607c6e` |
| `queue/dd-web-r3-hypothesis-discovery` | `d9bf9e21c8d92510c849969209c3a0813cea0771` |
| `queue/dd-web-r4-living-research` | `441a559435a442fe565ba8a62c87a744dd7d58fa` |

**Completion achieved here:** version tracking, isolated GitHub branch creation, scoping, release gates and handover updates. **Not achieved:** feature implementations R2–R4, a ready-to-publish R1 integrated build, actual deployments or account-specific AdSense re-approval. Separate latest-source release work should proceed using the branch-specific contracts above, not by merging a queued branch into production.


## R2 milestone 1 status — 13 November 2026

Evidence DNA alpha source + archive panel now staged **only** on `queue/dd-web-r2-evidence-intelligence`. Isolated GitHub QA `43517988515` passed; details in that branch's `MASTER_HANDOVER.md` and `docs/RELEASE_R2_EVIDENCE_INTELLIGENCE_SCOPE.md`. This is **not** an R2 deployable release, not a reviewed claim graph, and does not change R1 scope. Contradiction Radar and interactive graph pending; owner authorisation remains necessary for every deployment.


### R2 Evidence DNA milestone 2 — source-linked draft claims (13 November 2026)

**Status information only — NO R2 application code merged into R1.** The isolated branch `queue/dd-web-r2-evidence-intelligence` now includes four source-linked *editorial-draft* claims in two curated historical cases, with exact source/section locators, careful limitations and original archive links. It extends Evidence DNA's provenance parser and read-only case panel. Source references are not verified event observations or independent witnesses. Contradiction Radar, visual graph, independently adjudicated source-dependency data and owner editorial sign-off remain future work.

GitHub R2 no-deploy QA run `43519473367` at code SHA `40b36fc76dbc4bef4ed99199e292fac4aeb0a147` PASSED: strict 96-file public staging, unit/source tests, 18-page audit with 0 errors (3 legacy private W.NE warnings), Chromium archive-to-case tests at mobile 393px and desktop 1280px. Source panel boot regression was fixed and browser verified. This is NOT a full integrated R2 release test or phone hardware acceptance.

Release 1 website/AdSense recovery remains next to publish, subject to branch reconciliation, editorial review, exact-HEAD QA, physical device checks and explicit owner approval. R2 must later rebase on the actual verified live R1 commit and pass separate gates. Nothing deployed, no Netlify credits spent and no AdSense resubmission.


### Reddit feedback integration: R1 navigation / R2 Who's Who (14 Nov 2026)

- **R1 website bug fix ALREADY STAGED on this branch:** Reddit reviewer reported that sampled pages could trap visitors without a useful Home or browser Back route. `index.html` now makes Disclosure Desk header emblem/name a keyboard-accessible **Return Home** button; adds a compact Back control; main user-triggered section transitions push browser history entries so Chrome/Android Back can traverse sections. It preserves the premium navy/gold styling. `scripts/test_home_navigation_chromium.cjs` added and wired into existing no-deploy R1 workflow; GitHub Action `43582395888` GREEN after test integration. This is still staged, **not deployed**; real Android browser and archive history regression QA pending in final consolidated release.
- **R2 separate approved enhancement, NOT an R1 release requirement:** `queue/dd-web-r2-evidence-intelligence` now contains a "Who's Who in Disclosure" public directory with 7 detailed UAP public-figure profiles, sourced timelines, statements, external news coverage, 10 video entries and 16 attributed public social links. It includes privacy-aware user-activated YouTube embeds and individually linkable profile IDs. 7 biographies / 43 dated source references verified by static contract structure, not a human editorial sign-off. GitHub no-deploy run `43583617250` GREEN: 99-file strict package, 19-page audit 0 errors (three known hidden W.NE links), 393px and 1280px Chromium navigation/video tests. Copy/links/social-ownership/editorial fact check, licensing checks and physical Samsung QA remain.
- No unlicensed headshots or unsupported private contact pages are introduced. No person reputation polls are deployed; future surveys must address **claims and evidence**, not abuse-prone ratings of real people.
- R2 directory spec/source ledger `docs/R2_WHO_IS_WHO_DISCLOSURE_MILESTONE_2026-11-14.md` **exists only on R2 branch**, and it is discoverable from that branch's Home, Explore and About. **Do not merge R2 directory into R1** merely to fix navigation. R2 can be developed now but may be promoted only after R1 is actually live verified, reconciled, QA passed and separately authorised. No Netlify deployment or AdSense resubmission.


### R2 Who's Who expansion — 17 people / podcast and film source ledgers (14 Nov 2026)

**Release-train awareness only; NO R2 code merged into Release 1.** Who's Who on the isolated `queue/dd-web-r2-evidence-intelligence` branch now contains 17 researched editorial-draft profiles, with 23 podcast links and 21 attributed documentary, television, hearing or recorded-event references. Added six people in this milestone: Luis Elizondo, Christopher Mellon, Avi Loeb, Jacques Vallée, James Fox and Nick Pope. Their biographies, source references, podcasts, films, original video links, public pages and corrected historical contexts remain **subject to editorial/source verification** before publication; no unlicensed headshots are used. Missing film credits are shown as unverified rather than invented.

R2 GitHub-only quality run `43585311950` **SUCCESS**, code SHA `a4010164a48f06120c00cda6f9a87aef9917f200`: source contracts, 99-file strict package, 19-page static audit zero errors (three known hidden W.NE warnings) and 393px/1280px Chromium deep-profile navigation, podcast/film content, role/topic search and opt-in YouTube embed. This is not real-device QA or external publisher/filmography verification. R2 milestone record: `docs/R2_WHO_IS_WHO_EXPANSION_PODCAST_FILMS_2026-11-14.md` **on R2 branch only**.

**Release 1 remains the sole next deployment candidate**, containing staged AdSense content recovery and public Home/Back navigation fixes; full consolidated regression/owner approval still pending. R2 must later rebase/reconcile with the accepted R1 live SHA and pass its own review. No Netlify deployment, production merge or AdSense re-review.
