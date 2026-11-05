# Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-05 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

## 3. Last verified milestone (most recent first)

- **2026-11-05 — SHARED BDS BACKUP PREP FOR DISCLOSURE DESK + OUR CINEMA, OFFLINE QA GREEN:** User requested one hourly encrypted Google Drive backup system for both independent apps and month/day folders. Verified Cinema's correct Supabase project `nsqmktjigdllkqhsuqmh` (8 Cinema RLS tables, 3 Auth accounts, 86 film rows, 0 Storage objects). Created private, matching `Our Cinema — Encrypted Backups / Nov 2026 / 05 Nov 2026` Google Drive folders alongside previously created Disclosure Desk backup folders. Built **separate private-alpha code ZIP outside the PUBLIC website repository** with a single two-project runner (logical dump + Storage object copy + age encryption + rclone Drive checksum) and manual-only workflow. **9/9 local offline tests PASS**, no credentials or live backup, no scheduled job, no website/database writes. This is PREPARED, not backup protection yet. Do not claim a usable backup until source credentials are securely configured, manual upload, decrypt and disposable restore validated. Details `docs/BDS_MULTI_APP_BACKUP_HANDOVER_2026-11-05.md`.

- **2026-11-05 — REAL DISCLOSURE DESK SUPABASE ROLLBACK-ONLY REHEARSALS GREEN:** With owner's explicit consent to use their existing test-only database, inspected only aggregate counts: **3 accounts, 3 boards, 7 research documents, 1 username, 1 existing comment moderator membership, 0 witness reports, 1 Storage object**. All **22/22** public tables have RLS. Supabase organisation is **Free** (automatic scheduled backup not assumed). Ran the actual, unchanged `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql` and `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` against project `omqxizswzcwgzqaczlhe` **in separate BEGIN/ROLLBACK transactions with 1s lock timeout**. Private Chat **5/5** expected tables and Discussions **8/8** expected tables were created *inside each transaction*, all with RLS; both rehearsals **PASS**. Independent post-rollback read confirmed **0 candidate tables, 0 routines, opt-in column absent**, and all aggregate user/board/doc/moderator/Storage counts unchanged. **No production schema installed, no backup created, no Netlify deployment, no activation**. Details `docs/LIVE_SUPABASE_TRANSACTION_REHEARSAL_2026-11-05.md`. Next: verified off-site dump/Storage object backup, restore test and actual Netlify config; do not confuse rollback pass with Auth A/B acceptance or approval to apply persistent SQL.

- **2026-11-05 — RECONCILED/STRICT PUBLIC RELEASE PACKAGE; LINK-RESOLUTION QA GREEN, NO DEPLOY:** Verified safe-public-package builder and Pages restriction were **already staged and green** at `cdd2b1b` and CI `42029678884`. Removed an inadvertently duplicated second packaging workflow/builder and consolidated into the pre-existing `scripts/build_public_release.cjs` / `scripts/test_public_release_package.cjs` instead. Hardened production-output builder to demand an **exact reviewed allowlist** for its 19 `assets` and 18 top-level `research` files, preventing newly added .js/.html from silently becoming public. Added real static-link/data-fetch validation; corrected hosted `research/wne.html` Research Library shortcut to its actual `./research-bible.html` target and `sources.html` favicon to actual `/assets/disclosure-desk-mark.svg`. Fixed test scanner to exclude literal selectors inside embedded scripts/styles; no fake W.NE route created. GitHub-only public package run **42038409387 SUCCESS** (56 public files, **46 static references resolved**, SHA-256 manifest; excludes Finance, SQL, docs, scripts and test fixtures). Full staging run **42038407552 SUCCESS** at code head `ca45f60f44749f64351fc7a1a9c176b74f6a3cdd`; all changes only on unpublished branch. Production/current Netlify publish settings still unverified; **no live deployment, no Supabase/Storage backup created and no database mutation**. Database/Storage restore evidence, real A/B Auth and physical Samsung remain release blockers. Detailed `docs/RELEASE_BACKUP_ROLLBACK_AUDIT_2026-11-05.md`.

- **2026-11-05 — RELEASE/ROLLBACK AUDIT + SAFER PUBLIC WEB PACKAGE GREEN, NO DEPLOY:** Compared canonical unpublished branch to production: baseline `9755fba9`, dev release-code `cdd2b1b` (135 commits ahead, 0 behind, 108 changed files before package fix). Found repository-root upload `path: .` in `.github/workflows/pages.yml` would expose added private Finance/research SQL/support code if merged/published wholesale. Staged safe 56-file allowlisted website pack `scripts/build_public_release.cjs` + SHA-256 manifest, excluding Finance Centre, SQL, docs, scripts and backups; hardened Pages uploader to `.release-staging/public-site` **on development branch only**. Initial test `42029520975` failed on expected `research/data` folder, fixed at `cdd2b1b`. Final GitHub-only public package CI **42029678884 SUCCESS** (56 files/13,294,501 bytes) and full staging **42029678872 SUCCESS**, private artifact retained 3 days. Read-only Supabase audit: 22 public tables with RLS, 0 Chat/Forum tables, 1 Storage bucket; live migrations through 20261103105743; separate SQL candidates unapplied. **Backup RESTORABILITY NOT VERIFIED; Netlify publish directory unverified; no Supabase or Storage backups created.** Avoid live release until owner verifies backup restore capability (DB backups omit Storage objects), Netlify publish config/function dependencies, real Supabase A/B and Samsung. Document: `docs/RELEASE_BACKUP_ROLLBACK_AUDIT_2026-11-05.md`. Features OFF; user data, public site, Netlify and other BDS products untouched.

- **2026-11-05 — REAL CHROMIUM LANDSCAPE + FIRST-VISIT + EDITOR SAVE GUARD: 18/18 GREEN:** Extended source `scripts/test_browser_release_smoke.cjs` at `3c1a9f79df3783b82715020bb94a265aec5d030a` and ran real headless Chrome mobile-browser QA **42027694804 SUCCESS (18/18)**, with existing full staging QA **42027694930 SUCCESS**. New browser coverage: landscape 852×393 Witness navigation and modal bounding/Escape; fresh-account first-visit native welcome modal and Escape; actual `research/wne.html` DOM with a synthetic logged-in user and stubbed save hook — **unconfirmed save blocks site exit**, confirmed fake save allows return to correct Explore tab. Test init script was corrected to avoid running `localStorage` inside opaque/sandboxed frames; previously observed harness error disappeared; browser reports no page exceptions in this flow (external services blocked). **The confirmed-save stub does NOT verify actual backend persistence.** Screenshots include landscape; no live requests, Netlify, production, Supabase SQL, real user messages, W.NE independent app or Chat/Discussions activation. Detailed `docs/CHROMIUM_MOBILE_QA_2026-11-05.md`. Next: real Samsung Internet/Chrome physical manual acceptance and separate real Supabase Auth sessions on a dedicated staging backend; prepare controlled, reversible one-shot launch, don't duplicate green browser HTTP tests.

- **2026-11-05 — FIRST REAL CHROMIUM MOBILE-VIEWPORT BROWSER QA, 12/12 GREEN:** Added `scripts/test_browser_release_smoke.cjs` with a loopback-only HTTP server and real headless Chrome mobile emulation (393×852). Full 11-tab News/Witness/Explore/Profile/Videos, modal tour Escape/return, disabled Discussions deep link, accepted Profile deep link, W.NE guest/read-only dock and return, Research entry viewport width all passed. Actual GitHub run **42027132774 SUCCESS** (12/12); source staging workflow **42027132653 SUCCESS** at implementation `cf029b1e566c12355db00716a2a60ef541527b00`. Browser kept external calls blocked and saved screenshots as private 7-day workflow artifacts. One local browser console exception about `localStorage` denied in a document is **not yet attributed**; do not declare console clean. Not a physical Samsung test, real Auth or live W.NE editor save test. **No Netlify, public site, backend schema, private Chat/Discussions flags or user data changed.** Detailed QA: `docs/CHROMIUM_MOBILE_QA_2026-11-05.md`. Next: investigate logged exception, landscape/welcome/real-editor local browser tests and physical Samsung acceptance before one coordinated beta.

- **2026-11-05 — REAL SIGNED-JWT HTTP SAFETY QA; 55/55 GREEN, NO LIVE DEPLOY:** Separate short-lived PostgREST v16.5/PostgreSQL 17 GitHub Actions HTTP tests with fictional verified users and disposable signing key now exercise existing unapplied Private Chat and Discussions schemas over actual signed JWT bearer requests, not merely direct SQL. **Private Chat 22/22**, final run **42025369219 SUCCESS** after HTTP harness fix `1f519c6`; **Discussions 33/33**, final run **42025810582 SUCCESS** after recognising false-return denials `b442436`. Covers signatures, expiry, guest/privacy/participant, consents/blocks, direct table ACL, public posts/replies, steward/owner authority, 5-flag hide and owner restore. No real Supabase Auth, browser, Samsung, live users, live database or Netlify build involved; both `privateChat:false` and `discussions:false` remain OFF. Owner approved using live website if simpler, but isolated testing proved sufficient for HTTP, so live site remains untouched. Detail: `docs/COMMUNITY_SIGNED_HTTP_QA_2026-11-05.md`. Next: owner-approved real browser/Samsung acceptance and separately planned combined backend/frontend release, not repeated isolated checks.

- **2026-11-05 — Research Edition 12-tab Discussions parity, SYNTHETIC CI GREEN, live 11 tabs preserved:** The real 11-tab `research/research-site-nav.js` and 7 Research screens now load the existing website community gate first. Only when `DD_COMMUNITY_FEATURES.discussions===true` does the dock add Discussions after Witness; main site's `/?dd_tab=discussionsPage` waits for deferred config and rejects requests while disabled. W.NE's existing `wneSaveBeforeNavigation` gate remains mandatory. Unpublished source+test batch `bbb6a921859c96de94167b3f1dc66a632a1617c5`, GitHub-only full QA **42013369188 SUCCESS**, including new fake-DOM OFF/ON, save-rejection and saved deep-link tests `scripts/test_wne_discussions_nav.cjs`. Real Samsung, Auth/JWT, live backend and tour QA still outstanding; flags `discussions:false`, `privateChat:false`, `researchPublishing:false`, production and Netlify **unchanged**. Next: isolated two-account staging and phone/browser verification, no more duplicate synthetic tests. See `docs/COMMUNITY_LAUNCH_READINESS_2026-11-05.md`.

- **2026-11-05 — NO-DUPLICATION COMMUNITY QA; TWO NEW FRONTEND IDENTITY REGRESSIONS CI GREEN:** Verified current Actions/test scripts and existing detached PostgreSQL coverage first; did **not** rerun existing scenario suites as a new milestone. Found missing actual frontend asynchronous identity-transition checks. **Private Chat**: new `scripts/test_private_chat_account_switch_runtime.cjs` runs the existing disabled module with two synthetic identities, held old history, pending request and logout; source unchanged, GitHub workflow run **42010786518 SUCCESS** (test `e681211`, workflow `cb9cdfb`). **Discussions:** source `assets/community-discussions.js` fixed stale A steward/author UI surviving account B, with identity revision/epoch invalidation; user B's token refresh keeps their position and a queued vote after signout is cancelled. New `scripts/test_discussions_account_switch_runtime.cjs` and workflow steps; CI **42011490087 SUCCESS** (source `75371a2`, test `782fca7`, workflow `6b17aed`). Both locally simulated actual browser source and completed GitHub-only staging QA; **not** live JWT/Samsung acceptance. Both `privateChat:false` and `discussions:false` remain OFF, no backend SQL applied, no Netlify, production, Android or real user data touched. Detail: `docs/COMMUNITY_LAUNCH_READINESS_2026-11-05.md` update commit `9038904966e2298a9757fbc1fd84c4a048689a42`. **Next:** focus only on remaining genuine acceptance gaps (two disposable real JWT accounts in isolated staging, moderator/guest cross-account HTTP, actual Samsung browser and W.NE 12-tab navigation parity); do not repeat green detached SQL/source tests.

- **2026-11-05 — CANONICAL CHAT/DISCUSSIONS RECOVERY + READ-ONLY BACKEND/CI PRELAUNCH AUDIT:** Confirmed current website source is THIS repository's unpublished `feature/sources-archives-next-batch-nov03`, **not** legacy `disclosure-desk` or outdated `main`. Branch baseline `f4c5f0bb04102166f9e9b0117ca75029b0a98ef0`; full source/synthetic GitHub-only QA **41810147045 SUCCESS** (2026-11-04). LIVE clock and archived guest replay synthetic CI **41802115449 / 41802463605 SUCCESS**. Private Chat detached PostgreSQL consent/privacy/10-invite & 30-message cap QA **41711107391 SUCCESS**; Discussions detached PostgreSQL section/steward/RLS QA **41692441123 SUCCESS**. Connected Disclosure Desk Supabase read-only inspection (2026-11-05) verified existing RLS-enabled LIVE hearing messages/flags, public comments/votes, unique opted-in usernames, moderation RPCs; `dd_live_events` and LIVE chat message tables were **empty**; **no** private `dd_chat_*` or Discussions `dd_forum_*` tables exist in live backend. This is expected: source flags remain `privateChat:false` and `discussions:false`. **No live user chat, two-account HTTP, mobile Samsung, schema migration or deployment verified**. Supabase security adviser warnings require line-by-line review; do not blindly revoke public read RPCs. New detailed release gate: `docs/COMMUNITY_LAUNCH_READINESS_2026-11-05.md`, commit `737551c5a631dfd40997ed6daa446425ee4b612c`. No user content inspected or modified, no Netlify, public site, Android, Finance, W.NE or other projects touched. **Next**: real-account/disposable isolated staging/RLS tests and canonical site mobile QA before deliberate backend migration and combined release.

- **2026-11-04 — 11-TAB FULL TOUR/MOBILE ACCESSIBILITY CI GREEN, SAMSUNG RETEST PENDING:** Upgraded existing tour to native modal dialog + accessible first-visit modal, Close/Escape returns to the visitor's original tab rather than always Explore, restores focus; labels/step-title focus, 44px touch controls, scrollable phone-sized tour. Horizontal dock auto-scrolls selected tab and updates `aria-current="page"`. Preserved all **11 production tabs and 30 existing tour targets**; network-free source-extracted runtime test verifies old Videos tab and Profile return on Esc. Source committed to unpublished branch at `757e054872b583fe225eb2f3146929bb0faa618d`; initial GitHub QA failed only because old guided-tour test expected earlier first-visit guard. Fixed outdated test in `4aba1a7da3ec12a740faae3b048a46e4eb468624` and **no-deploy CI 41809892108 SUCCESS**. Real Samsung/Chrome visual, Android Back and accessibility QA remain pending. No website production, Netlify, Supabase, original W.NE, Cinema or paused Finance changes.



- **2026-11-04 — DISCLOSURE DESK 11-TAB TOUR ACCESSIBILITY & MOBILE NAVIGATION FIX STAGED (CI PENDING):** Inspected actual 384 KB site source and verified all 30 existing full/focused tour targets across 11 production tabs. Found two UX/accessibility issues: tour used nonmodal `dialog.show()` and always jumped to Explore on Close; first-visit overlay pretended to be modal without keyboard focus trapping. Staged native modal tour/welcome `showModal()`, Escape/Close origin-tab + focus restoration, mobile 44px touch controls and 60dvh scrollable tour, active bottom nav `aria-current="page"` and horizontal selected-tab reveal. Added source-extracted runtime synthetic test and existing guided-tour regression to GitHub-only staging suite; `docs/TOUR_MOBILE_ACCESSIBILITY_QA_2026-11-04.md` notes device QA pending. No LIVE schedule/Finance/Cinema/W.NE changes; no Netlify, Supabase or production deployment. Pending CI run must pass before CODE QA GREEN.


- **2026-11-04 — LIVE HEARING CHAT WINDOW + ARCHIVED REPLAY SYNTHETIC QA GREEN (NO LIVE DATA):** LIVE source fix opens the authenticated room at verified start−45min and closes it at approved end or start+4h without interrupting embedded hearing video; source commit `a5dd5bc2ba2e3780b6d1552f2c99405cd9c2a637` **GitHub-only Actions 41802115449 SUCCESS**. A separate test executes real `assets/live-chat.js` with mock approved 60+1 saved messages, unauthenticated visitor, live-room refresh and archived pagination; confirms guest cannot post, LIVE cleanup does **not** close saved transcript and older archived messages remain accessible. Test commit `4ae869d19b6b58146b13f4220699f02ce71fb7ef` **GitHub-only Actions 41802463605 SUCCESS**. These are code and synthetic runtime checks; **no real hearing, signed-in chat/RLS, recording replay or Samsung browser acceptance has occurred**. No live event published, Netlify/Supabase data/production/finance/cinema/W.NE changes. Next: real guest and signed-in chat tests only after explicit owner-approved disposable data and verified official event; finish full-site tour/mobile release checklist.



- **2026-11-04 — LIVE SAVED HEARING CHAT REPLAY RUNTIME QA STAGED / CI PENDING:** Added a network-free fake DOM test that executes unchanged `assets/live-chat.js` with 60 fictional approved archived messages, anonymous/guest user, mock public `dd_public_hearing_chat` RPC, and a separate simulated LIVE room. Exercises read-only archive form and hidden sign-in button, pseudonymous text, 60-message first page and prior-page loading, scheduled LIVE-only cleanup leaving the archive intact, and explicit archive disposal. No real chat, moderation, Supabase calls or event publication. Coupled with previously passing **LIVE timer-window CI 41802115449 SUCCESS**, confirming synthetic T−45 opening/T+4h closing; real browser/official event acceptance remains pending. No Netlify/production/Supabase/original W.NE/Cinema/Finance changes.


- **2026-11-04 — LIVE HEARING CHAT 45-MINUTE TRANSITION BUG FOUND; TIMER-DRIVEN FIX STAGED / CI PENDING:** Source review of `assets/live-schedule.js` found that even though clock updated each second, `ddLiveChatMount` was called only while rendering the hearing card. The schedule refresh preserves unchanged cards to avoid disturbing official video playback, so chat could stay closed beyond T−45 or remain visibly open beyond its permitted window. Updated existing per-card clock callback to synchronise chat state on T−45 and earlier of explicit event `endsAt`/start+4h, open once and dispose once, never replacing a playing video. Added **synthetic-time runtime test** of the actual schedule source (no real hearings, network or Supabase) plus existing LIVE countdown/replay tests in GitHub-only staging workflow. **CI pending for code commit**, real LIVE, chat posting, recording replay and mobile browser approval still pending. No real event announced; no Netlify, production branch, database, other product or Finance changes.


- **2026-11-04 — DISCLOSURE DESK OWNER-ACTION AND USERNAME A/B RUNTIME TESTS CI GREEN; NO LIVE USER WRITES:** Synthetic Hub owner-action test passed GitHub-only staging run **41800473669** at `330d0580344b77fafb8b553dadb799f8a31b5b35`: fake account A→B stale witness DELETE denied, confirmation guard, B-only owner-scoped report deletion, comment edit and document trash calls. Separate username-form account-switch race was fixed in `assets/public-profiles.js`: requires same owner and refresh generation before upserting, ignores stale responses, clears chat opt-in when signed out; fabricated A/B test checks stale save denied, duplicate alias error and B-only successful save. After correcting a fake-DOM test harness issue, full staging CI **41801094736 SUCCESS** at `3d5edcbf90c668d7a253be1fa03938569964df0c`. Source `assets/public-profiles.js` updated; read-only live Supabase owner RPC audit remains green. Neither test uses real database accounts or data. **Actual real-JWT/phone account acceptance still pending** before publishing. No Netlify build or public website, Supabase, original W.NE, Cinema or Finance changes.


- **2026-11-04 — USERNAME ACCOUNT-SWITCH RACE GUARD STAGED (CI PENDING):** Source review found stale Profile username form could save account A's input under a newly signed-in account B because save() fetched the new auth user without comparing against the user that opened the form. Added owner+refresh-revision checks before upsert, stale-response display guard, and reset of private-chat opt-in on guest state. No change to existing database index `dd_public_names_unique_key` or any existing account. Added fake DOM/runtime test of A→B race, B-only upsert, duplicate-name human-readable error and successful retry. No real Supabase write or production deployment; this is a QA candidate until GitHub check passes and real-device testing.


- **2026-11-04 — DISCLOSURE DESK OWNER-ACTION RUNTIME SIMULATION STAGED (CI PENDING, NO LIVE USER WRITES):** Read-only live Disclosure Desk Supabase inspected definitions of owner-only comment edit/delete and research trash/restore/purge functions: authenticated-only EXECUTE, registered-auth.uid ownership, 30-minute unflagged approved comment edit, and media-purge refusal. Staged GitHub-only Node VM test of actual My Research Hub handlers with synthetic account A/B: stale A action rejected after signing into B, cancel blocks report delete, accepted B delete has ID+author filters, comment editing and research trash use expected RPCs. Explicit future owner-led disposable account checklist added. Prior witness Edge v2 config/source parity and 10-table least-privilege review remain valid. **No live records, migrations, Netlify, production branch, Finance Centre, W.NE or Cinema changed.** CI still pending for new runtime test; do not count it as SAMSUNG or HTTP acceptance.


- **2026-11-04 — DISCLOSURE DESK LIVE WITNESS EDGE V2 CORS SOURCE PARITY VERIFIED; STATIC QA GREEN / REAL JWT POST STILL PENDING:** Read-only query against **Disclosure Desk Supabase project `omqxizswzcwgzqaczlhe`** confirms `dd-witness-submit` is ACTIVE at **version 2**, with **`verify_jwt=true`**; exact deployed `index.ts` text matched byte-for-byte to `supabase/functions/dd-witness-submit/index.ts` on development branch. Both have explicit OPTIONS 204 response with allowed methods `POST, OPTIONS`, allowed request headers `authorization, x-client-info, apikey, content-type`, strict origin allowlisting and a signed-in, non-anonymous user check before creating a report. Added CORS/regression assertions to existing `scripts/test_witness_community.cjs`, wired into GitHub no-deploy website QA, updated `docs/BETA_FEEDBACK_FIXES_2026-11-03.md`. Source commit **`3a7aba5048a32db25348257a892bef410741e377`**; **Actions run `41757257629` SUCCESS**. No Edge redeploy or website deploy. **This confirms deployed code/config, NOT an actual authenticated browser POST, geocoder acceptance, map marker or report deletion**. Next: user-approved disposable-account/browser acceptance, leave live data untouched during automated tests; continue earlier least-privilege candidate review before release.



- **2026-11-04 ~01:50 UK — DISCLOSURE DESK ROADMAP RESUMED / LIVE PRIVILEGE AUDIT AND ROLLBACK-ONLY HARDENING CI GREEN:** Owner explicitly paused BDS Finance Centre L2.1 and asked to continue Disclosure Desk roadmap. Switched scope back to the existing unpublished 11-tab website batch. Read-only SQL metadata on **Disclosure Desk Supabase project `omqxizswzcwgzqaczlhe` only** confirmed RLS is enabled on all 22 current public base tables and identified **ten public-schema tables** retaining unnecessary `TRUNCATE`/`TRIGGER` privileges for `anon` and/or `authenticated` (four grant both roles; six grant authenticated only). Important: PostgreSQL does not apply RLS to `TRUNCATE`, **but the standard website Data API does not provide arbitrary SQL and this audit does NOT establish a visitor exploit**. Verified current `dd_witness_reports` `SELECT`/owner `DELETE` grants/policy, authenticated-only comment/research RPC execute permissions (no anonymous execute), and existing unique username index `dd_public_names_unique_key`; actual owner/guest HTTP tests remain pending. Staged **review-only, BEGIN/ROLLBACK, never-applied** `supabase/COMMUNITY_EXTRA_PRIVILEGES_REVIEW.sql`, inventory `docs/COMMUNITY_ROLE_PRIVILEGE_AUDIT_2026-11-04.md`, static contract tests and added one no-deploy CI step. Changes on development branch in commits `872083e5f1f2bd79fbb9f7874a913b701153c6fb` and `0597d6bc379dcbf7ae06ff3f200f6b84809994ae`; **Sources & Archives QA 41756880146 SUCCESS**. No SQL permission changes, database writes, real-user data inspections, Netlify, production deploy, Supabase migrations, W.NE or Cinema edits. **Next:** prepare/disposable-account HTTP acceptance for report deletion, comment edit/delete, document trash/restore, distinct username and CORS; seek explicit approval before any live privilege migration or destructive tests.



- **2026-11-04 01:00 UK — L2.1 2025/26 YEAR FILTER DEVICE SCREENSHOT VERIFIED:** Owner's actual Samsung Internet screenshot shows `UK tax year: 2025/26`, `BDS product: All BDS products`, **£15.00 fictional gross income**, **£0.00 refunds/fees/expenses**, **£15.00 fictional trading profit**, and Ko-fi as the only sample income source. This matches the single 2025/26 demo entry dated 2026-04-05 and confirms phone-side date/year filter transition and UI recalculation for that view. The visible countdown reads **Auto-lock in 09:29**, proving the countdown is displayed, **NOT** that ten-minute expiry was actually exercised. 2026/27 default totals and user-reported tab-switch auto-lock were previously verified. Product-specific filter changes (Disclosure Desk £147.00, Our Cinema £142.50, BDS shared −£12.00), actual timeout/expired-server denial, and Chrome remain UNVERIFIED. Continue fictional-only; no real finance data, provider sync, Netlify, Supabase, production or original W.NE changes.



- **2026-11-04 ~00:50 UK — L2.1 SAMSUNG INTERNET SWITCH-AWAY PRIVACY LOCK OWNER-VERIFIED:** Owner clarified the dashboard automatically showed the locked state as soon as they switched from Samsung Internet to ChatGPT to send the screenshot. This confirms the **browser-side tab-visibility lock/scrub** behaves as designed on Samsung Internet; it is **NOT** a test of the independent ten-minute server-side expiry, the authenticated Lock now server revocation, or Chrome compatibility. Existing source `finance_local/dashboard.py` uses a `visibilitychange` listener that calls `showLocked(...)` and clears in-browser ledger/visible amounts. Important accuracy: this visibility lock changes the client page; the local server is still governed by its short lifetime until explicitly revoked or expired. Default 2026/27 fictional values and unlocked dashboard were previously screenshot-confirmed. Next: in a fresh uninterrupted Samsung Internet session, select other UK tax-year/BDS product filters and check fictitious amounts before navigating away; avoid any screenshots containing secret `#token`.



- **2026-11-04 00:50 UK — L2.1 SAMSUNG INTERNET UNLOCKED DASHBOARD & 2026/27 TOTALS VERIFIED:** Owner supplied full Samsung Internet screenshot of unlocked private synthetic Finance Centre L2.1 at local 127.0.0.1. UK tax year dropdown selected `2026/27`, BDS product dropdown `All BDS products`; actual phone rendered **£337.00 fictional gross income**, **£59.50 refunds/fees/expenses**, **£277.50 fictional trading profit**, 9 fictional 2026/27 ledger entries, provider income-source bars, accounting treatment bars, countdown and Lock now button. This confirms initial dashboard UI and default filtered figures on Samsung Internet, complementing earlier user-confirmed manual lock state. **Changing year/product filters, automatic ten-minute expiry and Chrome browser remain NOT device verified**; prior browser issue unresolved. No private token visibly leaked in screenshot, user still must avoid screenshotting initial `#token=` URL. L2 remains fictional-only, not real-money-ready or security audited. No Netlify, Supabase, production, Play or W.NE changes.



- **2026-11-04 00:47 UK — L2.1 SAMSUNG INTERNET RENDERS / OWNER LOCK CONFIRMED; CHROME STILL NOT WORKING:** Owner retested the Android browser-navigation hotfix on actual Samsung. Chrome still did not load successfully (specific Chrome failure after fix not yet diagnosed). Samsung Internet DID render the BDS Finance Centre branded navy/gold shell; the owner's screenshot shows the **“Locked by owner. Return to Termux to start another session”** alert and **“Finance Centre locked”** panel after operating the manual Lock now control. This supports **SAMSUNG VERIFIED for Samsung Internet rendering and manual UI lock message**, but does NOT independently establish server-side token revocation or test the unlocked figures, year/product filters, 10-minute expiry or Chrome compatibility. Prior CI fix run 41743244163 SUCCESS with 33 tests; no actual financial data, provider sync, Netlify, Supabase, production or original W.NE changes. Next: relaunch with Samsung Internet and exercise all fictional filters BEFORE clicking Lock now. Keep temporary browser address containing `#token=` private; Chrome diagnosis remains a separate browser-specific issue.


- **2026-11-03 — L2.1 ANDROID CHROME 403 FIX GITHUB CI GREEN, SAMSUNG RETEST PENDING:** Corrected source commit `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf` passed dedicated offline Finance workflow **41743244163 SUCCESS** (Python 3.12 and 3.14, vault and dashboard regression tests + ZIP artifact), alongside no-deploy website QA **41743244182 SUCCESS**. GitHub artifact **BDS-Finance-L2-1-Android-Browser-Fix-Synthetic** exists. **Still not reverified on the actual Samsung**, real finance data disabled. No production/Netlify/Supabase changes.

- **2026-11-03 23:49 UK — SAMSUNG L2.1 CHROME NAVIGATION 403 REPRODUCED; NARROW FIX STAGED, PHONE RETEST PENDING:** After upgrading L2.1, owner saw an almost blank Chrome page at `127.0.0.1` with tiny Forbidden text on two attempts, despite entering the passphrase. A real-HTTP simulation confirmed `GET /` with `Sec-Fetch-Site: cross-site` returned 403; direct `none` / `same-origin` fetched HTML. Root cause: Termux-to-Chrome intent navigation is sometimes marked cross-site, but L2.1's new metadata guard rejected all cross-site requests, including the harmless HTML shell. On unpublished branch, commit `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf` now allows cross-site **GET `/` only** (no ledger or secret in shell), while still rejecting cross-site calls to authenticated `/api/ledger` and `/api/lock`, and retaining Host/Origin, bearer token, localhost, no-cache, short-lived session, and synthetic-only safeguards. 33 isolated L1/L2 tests passed locally; **GitHub Finance CI 41743244163 was pending when documented**, website staging 41743244182 SUCCESS. New owner-download `BDS_Finance_L2_1_Android_Browser_Fix.zip` contains ONLY dashboard.py and README (local reviewed ZIP SHA-256 `36a5842b9e4afbb66c2306bb4556be9a563c477148b61f81287b72d96d234268`; GitHub artifact will contain same code with latest README, may differ by ZIP checksum). Next test on Samsung; do not declare device success yet. No changes to vault, backup, finance data, production, Netlify, Supabase, or W.NE.



- **2026-11-03 — L2.1 FILTER & SERVER-SIDE LOCK CI GREEN; SAMSUNG UPGRADE TEST PENDING:** Enhanced only the **synthetic-only**, private Termux Finance dashboard with UK tax-year and BDS-product filter acceptance, on-screen countdown based on **server remaining session lifetime**, authenticated one-tap **Lock now** (revokes token and clears decoded server entries), browser DOM scrub on lock/expiry/tab hide, and stricter cross-site request rejection. Updated `finance_local/dashboard.py`, `finance_local/tests/test_dashboard.py` (15 L2 tests) and `finance_local/DASHBOARD_README.md`, no vault modification. **32/32 isolated Python tests PASS** locally (17 L1 + 15 L2); mocked HTTP headless Chromium mobile UX PASS for 2025/26 £15, 2026/27 £277.50, Disclosure Desk £147, Our Cinema £142.50, BDS shared −£12, manual lock and accelerated timeout. **GitHub Actions 41740238168 SUCCESS** on Python 3.12 and 3.14, source integrity and ZIP artifact upload `BDS-Finance-L2-1-Samsung-Synthetic`; website-only regression **41740238160 SUCCESS** at source commit `7e73c86799eb2c576be3e10a1eacd3fed5f2b72c`. Locally generated upgrade ZIP `BDS_Finance_L2_1_Lock_and_Filters.zip` SHA-256 `1673e2d5b4776d8472eb7ab0f140375bdb2923f0562f97ecaf0c8232611691b1` contains only the dashboard Python and README; GitHub artifact zip may differ at byte level but contains same verified source. The desktop Chromium network environment restricted direct localhost navigation, so UI browser simulation uses a mocked API while real server handlers are Python HTTP-tested. **Not yet Samsung-verified for L2.1**, no real personal financial records, provider APIs, tax calculation, Netlify, Supabase, Play or live website changes.



- **2026-11-03 ~23:16 UK — SAMSUNG L2 OWNER-REPORTED DISPLAY SUCCESS / REAL-DATA & SECURITY GATES OPEN:** Owner tested the first private L2 Finance Centre browser dashboard on their Samsung using existing synthetic-only Termux vault, and explicitly confirmed **“Yes perfect”** when asked whether the dashboard was displaying nicely. This is a **phone UX/display acceptance report**, not independently observed security, complete filter behaviour, expiry/lock/logout, network-isolation, or financial integration QA. Previously, `finance_local/dashboard.py` read-only local UI plus nine automated L2 server/security tests and L1 tests passed CI run **41736247141 SUCCESS** on Python 3.12/3.14, website regression **41736247039 SUCCESS** at `dfffb15428af973a2a39eb3002b388b3c4efea84`. User reports manually saving an encrypted backup in Google Drive (off-device copy user-confirmed; not independently downloaded/restored). **No genuine financial data, Ko-fi/AdSense/Play sync, tax calculator, Netlify, Supabase, Play release, or live website changes.** Next verify on-device filter/expiry/lock behaviour and a clean Drive recovery drill, then plan opt-in, reviewed real CSV ingestion.



- **2026-11-03, L2 PRIVATE PHONE DASHBOARD GITHUB CI VERIFIED — SAMSUNG BROWSER TEST PENDING:** Added read-only, synthetic-only `finance_local/dashboard.py`, `finance_local/tests/test_dashboard.py`, `finance_local/DASHBOARD_README.md` and `finance_local/BDS_Finance_L2_Private_Dashboard.zip` on unpublished branch. Dashboard unlocks existing phone-only encrypted L1 vault via hidden Termux passphrase and starts time-limited local 127.0.0.1 server with ephemeral bearer authentication, no persistent browser storage or public network endpoints; shows UK tax years, products, fictional revenue, costs and ledger. Local nine HTTP/security tests plus mobile-size synthetic Chromium visual check passed; **GitHub Actions run 41736247141 SUCCESS** on Python 3.12 and 3.14, including L1 tests and L2 access controls and ZIP/source parity. Site checks **41736247039 SUCCESS** at source commit `dfffb15428af973a2a39eb3002b388b3c4efea84`. Owner reports encrypted L1 backup manually saved to Google Drive, but no independent cloud restore test. **No live finance data, real provider integration, HMRC calculator, public web deploy or actual Samsung L2 UI test.** Next: owner downloads L2 ZIP, extracts with `unzip -n` into existing `$HOME/bds-finance-l1` and runs `python finance_local/dashboard.py`; never share one-time session URL/key. No changes to active vault/backups.


- **2026-11-03 22:36 UK — L1 SAMSUNG ISOLATED RESTORE VERIFIED 22:36:** Owner's screenshot confirms actual Termux success for `HOME="$HOME/bds-finance-restore-test" python finance_local/vault.py restore "$BACKUP"` with `BACKUP="$HOME/bds-finance-sample-backup.bds"`. CLI displayed **"Encrypted backup restored into private Termux HOME. No previous vault overwritten."** Follow-up `summary --year 2026/27` against the restored **separate test HOME** again showed 9 in-year records, £337.00 fictional income, £19.00 refunds, £28.50 fees, £12.00 expenses, and **£277.50 fictional profit**; 10 total preset records in source were previously authenticated. Thus L1 **SAMSUNG VERIFIED for init, sample insert, summary, encrypted backup, verify, isolated restore and recovered totals**. This does **not** establish off-device disaster recovery, independent security review, encrypted cloud backup, real-income readiness or automatic provider integrations. No access to owner's passphrase or encrypted files. **Next:** optional user-led copy of the existing `.bds` ciphertext to Downloads followed by SHA-256 equality check and manual encrypted off-phone copy (Drive or USB); no deletions, no reinstall, no live deployments.



- **2026-11-03 22:31 UK — SAMSUNG L1 ENCRYPTED BACKUP + VERIFY PASSED:** owner screenshot confirms `vault.py backup "$HOME/bds-finance-sample-backup.bds"` returned `Verified encrypted backup exported; NOT plaintext`, and `vault.py verify-backup "$HOME/bds-finance-sample-backup.bds"` returned `Encrypted backup verified. Fictional entries: 10. No restore performed.` The existing source vault remains intact; **phone backup creation and AES-GCM verification are SAMSUNG VERIFIED**, but isolated **restore**, independent/off-device copy, loss recovery, security review and real financial functionality remain UNVERIFIED. Sample-only data, no actual revenue or Netlify/Supabase/Play changes. Next: restore ciphertext to a separate test directory without modifying `~/.bds-finance/vault.bds`, then prove original unchanged.


- **2026-11-03 22:28 UK — L1 SAMSUNG INIT / FICTITIOUS TOTALS VERIFIED:** Owner screenshot confirms patched Termux ZIP extracted, `vault.py init` succeeded with hidden passphrase, `demo-fill` added 10 synthetic presets, and `summary --year 2026/27` reported 9 records, income £337.00, refunds £19.00, fees £28.50, expenses £12.00, fictional profit £277.50. Previous `os.link` incompatibility resolved for this workflow. **Encrypted backup, verify, independent restore and off-device copy still UNTESTED ON SAMSUNG.** No real finances or online sync. Next: backup to new file in Termux HOME and verify its integrity; never overwrite or delete the main vault. No live site, Supabase or Netlify changes.


- **2026-11-03, SAMSUNG TERMUX L1 `os.link` FIX — CODE STAGED / GITHUB CI GREEN / PHONE RETEST PENDING:** Owner's screenshot showed unzip and passphrase prompts succeeded, but `finance_local/vault.py init` crashed with `AttributeError: module 'os' has no attribute 'link'` on Termux Python 3.14. Fixed unsupported `os.link` in fresh-vault/restore by securely reserving destination with exclusive `os.open(... O_EXCL)`, then `os.replace` of fsynced ciphertext under directory lock; rollback removes only the call's exact empty reservation on failed rename. No existing vault or unrelated data is overwritten. Added three regression tests (17 total), Python 3.12/3.14 GitHub matrix, and checksum/byte-parity assertions for new corrected ZIP and canonical ZIP. Source commit `d073b5509341800be56b729590eb72c6cdbc712b`, vault CI run **41730679400 SUCCESS** (both Python versions), site CI **41730679360 SUCCESS**. Corrected ZIP `BDS_Finance_Termux_L1_Android_fix.zip` SHA-256 `b4b51143ad53487d82f2c6a0588ddac45fc22220df9fa76ac5b7a9bd07331422`. User should extract patched ZIP into existing `$HOME/bds-finance-l1` and rerun `init` without deleting anything. **Actual Samsung rerun NOT YET VERIFIED**, no real finance records accepted, no deployment/Netlify/Supabase/W.NE changes.


- **2026-11-03, L1 TERMUX ENCRYPTED VAULT — FINAL GITHUB CI GREEN SHA aac857:** 14/14 unit tests for **synthetic-only** AES-256-GCM + scrypt vault, encrypted backup, wrong-passphrase/tamper rejection, idempotency and safe no-overwrite restore passed GitHub-only Actions **41727602097 SUCCESS** at code/checksum SHA `aac857e4800c2c0b3cb659c2b3d000af4c14e26b`. Existing website staging QA **41727601922 SUCCESS** at same SHA. Readable source text is now byte-aligned with zipped release `finance_local/BDS_Finance_Termux_L1_demo.zip` (SHA-256 `ba5f27427ab518df73c85108169723a1c571a1aed42900a2025944cc99c89977`), recorded in `finance_local/SHA256SUMS`. **Still NOT SAMSUNG VERIFIED, security-audited, connected to real providers, or appropriate for actual finances**. No Netlify, production, Supabase, Play, private BDS accounts or personal financial data changed. Next owner-led Termux package/backup test with synthetic data; only then local dashboard L2.


- **2026-11-03, FINANCE TERMUX L1 ENCRYPTED DEMO — CODE STAGED / LOCAL TESTS GREEN / GITHUB CI PENDING:** Implemented `finance_local/vault.py` as an **offline, synthetic-only** Python command-line vault for Samsung Termux; `finance_local/tests/test_vault.py` with **14 Linux local unit tests PASS** (no Android test); `finance_local/README.md` usage and release ZIP `finance_local/BDS_Finance_Termux_L1_demo.zip`. Uses PyCA AES-256-GCM + scrypt (N=32768), fresh salts/nonces, hidden passphrase prompt, strict private permissions, exclusive file lock, atomic encrypted updates, fictional ledger and totals, ciphertext-only backup/verify and no-overwrite restore; no provider API, tax calculator, service or real data entry. Tests cover wrong passphrase, tamper, failure before atomic replace, UK 6 April tax-year boundaries, duplicates, backup/restore and permissions. **NOT phone-tested, NOT security audited or suitable for real finances.** Unpublished branch only, no Netlify or live Supabase changes. GitHub-only isolated Finance L1 Actions **41727300663 SUCCESS** at source code SHA `fa26ec8cec96fb859aef6c0336d1d887a9ac4179` (14 tests); staging regression run **41727300502 SUCCESS**. Repackaged text-source trailing newlines to match the previously generated ZIP; source/ZIP SHA-256 checked locally, final run pending on checksum/documentation commit; L2 visual dashboard and on-device backup drill remain future gates.



- **2026-11-03, FINANCE TERMUX LOCAL-FIRST OPTION OWNER-PROPOSED / ARCHITECTURE DOCUMENTED — NO APP BUILT:** owner asked to keep financial tracking on a Samsung and use Termux for online-on-demand income retrieval. Official provider docs checked: Ko-fi offers full history CSV but its API is outbound webhooks (no documented history polling); AdSense supports installed-app OAuth reporting, not service accounts; Play private reports downloadable as CSV/Cloud Storage. Staged `docs/BDS_FINANCE_TERMUX_LOCAL_FIRST_2026-11-03.md` to prioritise encrypted private Termux storage, optional offline dashboard, manual/consented online sync and encrypted off-device backups. The earlier finance PostgreSQL F2 SQL is an **unapplied alternative**, not a live requirement. **No encryption code, actual data, login, provider sync or service deployment exists**. L1 synthetic-data secure-vault prototype is the next build; no public website, Supabase, Netlify, W.NE or Our Cinema changes. GitHub-only documentation QA **SUCCESS** at code SHA `98ec9c88f8673b40afb27804ebe09afbe8b70e24`, Actions run `41724910278`. Initial QA `41724778280` failed on two incorrect documentation test expectations, corrected with assertions reflecting actual source wording; no product code change. Documentation and proposed architecture only.



- **2026-11-03, F2 OWNER-ONLY SQL ISOLATED SECURITY CI GREEN — NO REAL FINANCE SERVICE:** staged `finance-review/finance-f2-review.sql`, synthetic fixture/acceptance tests, GitHub-only workflow `validate-bds-finance-isolated.yml`, and `docs/BDS_FINANCE_F2_SECURITY_2026-11-03.md`; code commit `4a225e87c6c6de349e185c33a2d0c5a107dbc38d`. PostgreSQL 17 review SQL installed **only in disposable CI**; 2FA/AAL2 owner verified, unrelated user/guest/anonymous/AAL1 denied, private allowlist hidden, read/append-only, duplicate reference rejected, owner revocation blocked. GitHub Actions **41723430099 SUCCESS**; existing website staging QA **41723429851 SUCCESS**. **F2 partially staged, NOT production secure or deployed**: no real finance Supabase project/login/backend/API/encrypted backup, and public F1 HTML remains sample-only. `production` stays `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`; no Supabase/Netlify/Play changes, secrets, customer data or accounts. Next decide private host/free tier then protected server storage, MFA device/account tests and backup restore before real income.


- **2026-11-03, BDS FINANCE CENTRE F1 — OFFLINE SYNTHETIC LEDGER CODE STAGED / GITHUB CI GREEN:** Added one-file fictional-only HTML prototype `docs/prototypes/bds-finance-demo.html` and `scripts/test_bds_finance_demo.cjs`, wired into GitHub-only `validate-sources-directory-staged.yml`. Source test commit `d6106c975fddacf5081bc30ae80029fafa91cdae` passed Actions run **41721383656 SUCCESS**. Test covers UK 6-Apr year rollover, gross/net accounting for fee/refund/expense and excluding estimates/payouts, duplicate import and conflict detection, bad dates, CSV safety, no network resources. Sample dataset calculates £277.50 **fictional** profit for 2026/27. **Not browser/Samsung tested, not private/authenticated, no persistent financial data, no tax calculation or provider sync.** No Netlify, Supabase or Play deployment. Final private tool must not be served publicly from this preview docs/prototypes location after any future release.


- **2026-11-03, BDS FINANCE CENTRE F0 — SOLE-TRADER TAX PROFILE OWNER DECISION RECORDED:** Owner confirmed operate as sole trader initially, with potential future limited-company incorporation if BDS becomes profitable. Updated `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md` to specify 6 Apr–5 Apr tax periods, existing PAYE context needed for accurate additional-tax estimates, £1,000 gross-trading registration checkpoint, and clean effective-date separation for possible future company accounting. Documentation only; structure NOT proof of HMRC registration. No tax calculator, provider sync, financial data, login or deployed dashboard. F1 synthetic offline ledger is next, after privacy-safe data requirements review. GitHub-only staging QA **SUCCESS**, run `41719897014` at source commit `156ff9564dc08280d7f361ab6a2ba709fe6c3e9a` (static checks; not browser/tax/integration verified).


- **2026-11-03, BDS FINANCE CENTRE 2026-11-03 DECISION MILESTONE — ROADMAP STAGED / GITHUB SOURCE CI GREEN (41719213568), NOT BUILT:** added `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md` at commit `137fb8164f30aa7f9fabb6cd43e06e094093568a`. Private BDS-wide finance dashboard and automation plan: Ko-fi verified payment webhooks, AdSense readonly estimated/paid reports, Google Play monthly earnings CSV/Cloud Storage, expenses, FX/fees/refunds and reconciliation, conditional NI/UK sole trader/company tax calculation, protected owner portal + opt-in offline snapshots. **No dashboard UI, provider connection, backend migration, user finances, tax estimate or public deployment.** Requires business-form/PAYE inputs and separate go-ahead.

- **2026-11-03, most recent Ko-fi support CODE STAGED / GitHub CI GREEN:** commit `32974cbde4fe336bf81315fae87f6b8568448937` passed `Sources & Archives staging QA (no deploy)` Actions run **41717709506** (success). Source and Ko-fi link static tests pass; no owner/browser test of profile checkout, payment receipt, Netlify production release, Supabase or Android change. Existing `production` SHA `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`.


- **2026-11-03, OWNER-SUPPLIED LIVE KO-FI PAGE LINK STAGED:** Site owner provided exact `https://ko-fi.com/disclosuredesk` after Stripe connection and Ko-fi Free Standard-off setup screenshots. Set `VERIFIED_KOFI_PAGE_URL` in `assets/support-site.js`; existing responsive small gold **☕ Support** sticky-header link (beside Profile), About card and footer links will now render after the *next deliberately approved website deployment*. Safe HTTPS/host validation, no embedded payment data, no additional main tab. Updated source assertions and script cache version; GitHub-only CI pending. Public page URL was owner-provided, not independently fetched; actual click/payment checkout needs manual browser verification before launch. Production/Netlify/Supabase unchanged.


- **2026-11-03, owner-approved discreet sticky-header Ko-fi Support CODE STAGED / CI PENDING:** Ko-fi page does not exist yet, so button remains *invisible* until an actual verified user-provided Ko-fi profile URL is set. Future sticky header will show gold/navy `☕ Support` beside Profile (small mobile coffee icon), with existing About/footer voluntary links retained. Added source QA and creator bio to `docs/VOLUNTARY_SUPPORT_KOFI_2026-11-03.md`. No Netlify/site deploy.


- **2026-11-03, media cost/release roadmap documented (NO uploads implemented):** User requested public Discussion image sharing, native chat GIFs/emojis, low hosting costs and satellite work status. Confirmed Imgur UK block/commercial-hosting restriction; compared existing Supabase Free 1GB file storage/5+5GB egress with Cloudflare R2 Standard Free 10 GB-month/no egress charge; documented conservative image size/rate/EXIF/moderation safeguards in docs/COMMUNITY_MEDIA_COSTS_2026-11-03.md. Native phone emojis are supported as Unicode text in draft Chat; keyboard GIFs/stickers/image attachments are NOT supported. Satellite automatic nearest historical acquisition and internal imagery slider remain undone. No live bucket, backend changes or deployments.


- **2026-11-03 voluntary Ko-fi support integration CODE STAGED / LINK DORMANT:** user confirms no Ko-fi page/account yet. Added guarded About and footer Support button that remains invisible until an owner-provided verified HTTPS ko-fi.com creator link is inserted; no invented URL, payment handling, public deployment or Netlify build. Free Ko-fi one-time tip commission 0% only after turning Standard/Contributor mode off (processor fees remain). New GitHub static QA pending.


- **2026-11-03, OWNER-APPROVED 10 INVITES / 24 HOURS — ISOLATED SQL CI GREEN, NOT LIVE:** implemented in `5381141b459b47d0377f6b9dda1de589dfd7a7a7`. Disposable PostgreSQL 17 run `41711107391` **SUCCESS** (10 invitations to distinct fake users allowed, 11th rejected); website static QA `41711107588` **SUCCESS**. Registered-only explicit opt-in and one-intro request flow unchanged; existing-chat message rate 30 per 10 minutes. `privateChat:false`, candidate SQL unapplied, production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` unchanged, no Netlify release.


- **2026-11-03, private Chat invite quota change CODE STAGED / CI PENDING:** owner-approved **10 new requests per rolling 24 hours** instead of 5, while accepted-chat messaging remains 30 per 10 minutes. Updated UNAPPLIED SQL, browser guidance, static regression and disposable PostgreSQL tests for 10 accepted/11th rejected. **Private Chat remains OFF**, live database untouched. See `docs/PROFILE_PRIVATE_CHAT_ROADMAP_2026-11-03.md`.


- **2026-11-03, 1:1 Chat unread & rate-limit acceptance staged, CI PENDING:** core disposable PostgreSQL multi-account security integration **SUCCESS** at run `41709436663` (commit `ba19ec4a387c9cea1e495d60d78d913734558ca9`); website static CI `41709436631` SUCCESS. Expanded review-only SQL candidate with per-user unread/read-marker RPC and source-tested chat UI unread badges and active-conversation preservation. Added real Postgres tests for cross-user read-marker rejection and invite/message quota. Still privateChat OFF and live backend UNTOUCHED.

- **2026-11-03, isolated private-chat acceptance fixture privilege fix STAGED:** disposable PostgreSQL run `41709194498` reached role tests and correctly rejected a direct `SELECT` on `dd_chat_messages`. The acceptance fixture accidentally tried to inspect a private table *without trapping the expected denial*. Corrected fixture to use only safe participant RPCs, preserving separate direct-privilege rejection test; source CI `41709194184` SUCCESS. Isolated test rerun pending; schema not applied.

- **2026-11-03, PRIVATE 1:1 CHAT ISOLATED SECURITY TEST MILESTONE (staged, CI PENDING):** Backend candidate corrected to persist the introductory request once on acceptance, reject history after blocking, protect message-send vs block race, expose safe contact-unavailable bool. Added disposable PostgreSQL 17 multi-account CI (fixture+acceptance) and refreshed UI active-conversation handling. Still `privateChat:false`; **NO live Supabase schema applied, messaging NOT usable**, no Netlify/Android build. Exact files/workflow in `docs/PROFILE_PRIVATE_CHAT_ROADMAP_2026-11-03.md`.

- **2026-11-03, historical NASA image-layer correction CODE STAGED:** explicit MODIS Terra daily true-colour `l=` added to Worldview case date/viewport link, preventing defaults that may be unavailable for historical dates; source validated against NASA GIBS. The selected UTC minute still **does not imply that an image exists at that minute**. No historical frame ingestion/nearest-time API. CI pending, no deployment.

- **2026-11-03, satellite case-card regression correction CODE STAGED:** run `41699308567` FAILED due old test asserting Map satellite button still used Evidence-file launcher. Updated check to dedicated satellite button, removed two stray plus characters between Featured/Rabbit buttons and added main inline website JS syntax verification. New CI pending; no Netlify builds.

- **2026-11-03, satellite imagery per-case-card navigation CODE STAGED:** added consistent **🛰 Satellite view** actions across Map result cards, Featured Case Files, Explore rabbit-hole case cards and Evidence Archive results/details, opening case-specific timeline/provider dialogue. Full dates/approximate mapped towns carried into NASA Worldview; year-only or locationless archives clearly signal missing evidence. No verified nearest satellite image is auto-retrieved; provider source/time caveats displayed. GitHub-only tests pending; still no public deploy.

- **2026-11-03, historical satellite imagery case-handoff STAGED, CI GREEN, NOT LIVE:** Existing dated Map case list now has a **🛰 Historic satellite imagery** action opening its Evidence file, where `assets/historical-satellite.js` will show official NASA Worldview date+approximate-city handoff and EUMETSAT long-term gallery/EUMETView links. Date-only source records remain labelled date-only; optional researcher UTC time is NOT validated as actual event time. GitHub-only CI run `41693881342` SUCCESS at SHA `dda6f9bd9a87bc400859d4664773adef04ba2480`; no external imagery fetched, no live deployment, no third-party tracking without explicit user click. Detailed source/limitations `docs/HISTORICAL_SATELLITE_IMAGERY_2026-11-03.md` (parent approved post-launch Phase B).

- **2026-11-03, reply flag-baseline correction SOURCE STAGED:** isolated expanded CI run `41688611725` FAILED at first reply flag because `dd_discussions_flag` expected `dd_forum_replies.reviewed_flag_count`, missing from candidate reply DDL. Corrected the review-only table definition and added matched topic/reply DDL regression. No live DB affected; isolated test rerun pending.

- **2026-11-03, expanded isolated forum SQL test fixture delimiter fix STAGED:** new run `41688410287` FAILED in test script after original integration tests passed; seven newly added `do $` blocks were changed to `do # Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 by JavaScript replacement-string expansion during source construction. Corrected all test script delimiters using literal split/join and added guard tests; no schema change; CI pending.

- **2026-11-03, isolated PostgreSQL Discussions CI GREEN:** Docker/PostgreSQL 17 run `41687803769` SUCCESS at implementation SHA `102fc572a405ee298b81f9fad8ee92388bb8dc4a`; synthetic users verified section creator vs ordinary poster, scoped Pin, site-owner role, guest safe RPC/raw-table denial, first and second 5-distinct-flags hide cycles, owner restore and steward revocation. Paired GitHub static QA run `41687803846` SUCCESS. **Only disposable DB; real Supabase remains untouched.** Expanded reply/escalation test coverage now staged and pending a new run.

- **2026-11-03, isolated PostgreSQL steward Pin runtime fix STAGED:** run `41687573826` **installed candidate SQL successfully** into disposable DB, then synthetic role tests failed due ambiguous `section_id` variable in Pin RPC at line 14. Renamed local variables `v_section_id` in Pin and Escalate RPCs to prevent column/variable conflicts. CI rerun pending. No live DB change.

- **2026-11-03, isolated SQL owner-function footer fix STAGED:** run `41687262065` failed on remaining `end $;` close in final owner-sections function. Root cause was JavaScript string replacement interpreting `$` as a single literal dollar during source generation. Replaced via a function callback, verified correct `end $;` byte-for-byte; rerun CI pending. No live DB changes.

- **2026-11-03, PostgreSQL owner-function delimiter correction STAGED:** isolated CI `41687005397` reached the later owner functions but failed SQL parse at line 548 because the owner queue and owner sections functions each had a single `# Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 rather than `$` body opening (and one closing). Both repaired; static regression now rejects unmatched delimiters. Rerun pending; NO live database changes.

- **2026-11-03, isolated SQL parser correction STAGED:** run `41686804284` FAILED on a PL/pgSQL `IF` conditional using an unparenthesised `CASE` expression in `dd_discussions_edit_own`. Replaced it with independent validated thread/reply length guards and updated static assertions. **Test now rerunning; do not claim backend ready.** No live data touched.

- **2026-11-03, isolated Discussions PostgreSQL security workflow CODE STAGED:** Docker PostgreSQL 17 GitHub Action will run candidate SQL in a disposable database with synthetic Auth roles/users, test guest raw-table denial, nonsteward pin denial, owner review, author posting/replies and two rounds of five distinct flags. Trigger restricted to the review SQL/test files and workflow itself; **no connection to live Supabase, no Netlify deploy**. Workflow result pending; errors must be fixed before treating SQL as executable.

- **2026-11-03, Discussions overall-admin view CODE STAGED / DISABLED:** owner-only review pane inside existing Profile/Admin Centre displays hidden/escalated threads/replies, limited excerpts and escalation reasons, with Restore/Hide/Remove decisions requiring reasons. Owner can revoke a section steward without deleting their section. Server-side owner-only RPC candidates are reviewed SQL source only; no owner allowlist seeded, schema installed or live moderation performed. GitHub-only CI pending.

- **2026-11-03, Discussions owner/author/steward polish CODE STAGED / DISABLED:** added verified-author Edit/Withdraw buttons, removable votes, steward section description/topic settings and focused thread/reply navigation; corrected schema candidate to preserve a five-**new**-flags threshold after owner restoration, rather than instantly rehiding on an old tally. Backend is still **UNAPPLIED**, GitHub-only CI pending; no user access or database modifications.

- **2026-11-03, Discussions test-file syntax correction STAGED:** GitHub run `41685385409` FAILED on an unescaped apostrophe in one newly appended JS assertion, not on application code. Fixed the assertion string and parsed the full test source with `new Function`; rerun CI before calling this milestone green.

- **2026-11-03, Discussions candidate safety review CORRECTION STAGED:** verified GitHub-only contract run `41685136138` passed previous SQL source; identified and patched review-only edge cases: anonymised users should not block section/account deletion or report flagging, withdrawn topics must satisfy nonempty constraints, post edits retain original length limits, and owner queue now includes both hidden/escalated **threads and replies**. Corrected source **still unapplied and not database-tested**. CI pending.

- **2026-11-03, Discussions backend review SOURCE STAGED, UNAPPLIED:** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` proposes section/reply/topic tables with RLS, guest-only safe read projections, registered-only posting and votes, five-distinct-flags temporary hide, limited steward Pin/Escalate, owner-only moderation/role replacement, abuse rate limits and audit trails. No DB schema was installed; GitHub-only source contract added, CI pending; isolated SQL/role tests required.

- **2026-11-03, Discussions frontend CODE STAGED / DISABLED:** responsive section discovery, new-section form, topic posts, reply pane, safe source links, registered posting, user votes/flagging, scoped section-steward pin and escalate actions added in `assets/community-discussions.js` and `index.html`. The module returns immediately when `discussions:false`; no twelfth tab or public RPC calls. **Backend methods not yet implemented.** GitHub-only JS/static UI test added; CI pending and no deployment.

- **2026-11-03, separate private Chat contact opt-in CODE STAGED / DISABLED:** public username management now conditionally shows an independent "allow private chat requests" checkbox, persisting `chat_contact_opt_in` only when `privateChat:true`. With the current **false** flag, existing username reads/writes remain unchanged and never query the unapplied column. GitHub-only source test updated; no backend applied, public feature or messaging.

- **2026-11-03, Profile Chat accordion static-test correction STAGED:** initial GitHub-only run `41683343386` failed because assertion matched `class` as the first attribute, while the new Chat `<details>` intentionally begins with an accessible `id`. Updated regex to accept safe attribute order and still assert seven sections. Re-run pending; no live UI or backend enabled.

- **2026-11-03, disabled Profile Chat test coverage STAGED:** added GitHub-only static test covering accepted-only composer, recipient acceptance, flagged-off state, RPC method signatures and textContent rendering; no database writes/real chat. Workflow results pending for this commit. Original backend candidate remains unapplied.

- **2026-11-03, Profile Chat UI source STAGED / DISABLED:** a seventh native collapsible Hub section houses accepted/pending lists and inline conversation/preview/composer; source-based client actions for invite, accept/decline, block and report. Separate `privateChat:false` and `discussions:false` flags protect the live 11-tab experience; the chat schema remains UNAPPLIED and no messaging is usable. Await GitHub-only CI and isolated backend/RLS testing before activation.

- **2026-11-03, private 1:1 Chat database foundation CODE STAGED / UNAPPLIED:** staged security-reviewed candidate SQL (`supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`) for separate chat opt-in, one introductory preview, recipient-only accept/decline, participant-only accepted messages, anti-repeat pair uniqueness, request/message rate limits, blocks and limited excerpt-only owner reports. CI tests are static, **NOT SQL execution or authenticated security tests**. Website feature remains disabled; no Supabase migration was applied. This is a candidate requiring independent SQL/RLS review and an isolated database test before activation.

- **2026-11-03, Community Rules current-vs-future wording CODE STAGED:** obsolete "private drafts only" notice replaced with feature-flag-aligned status; planned Discussions and consent-only private Chat policy and scoped steward limits added, plus GitHub-only source check. No publication. CI pending.

- **2026-11-03, email backup presentation CODE STAGED:** new static responsive Disclosure Desk/BDS-branded HTML and text email, existing attachment/auth/hourly limit unchanged. Template regression added to GitHub-only staging workflow. Not deployed to Edge and no real email sent. CI pending.

- **2026-11-03, QA correction STAGED:** new account-owned controls added a nested Recently deleted panel (6 main accordions + 1 nested). First GitHub run `41678969054` failed only on an outdated count-of-closing-tags assertion. Test corrected to seven; local static assertions PASS. Await GitHub-only rerun before claiming green.

- **2026-11-03, private-content management CODE STAGED:** existing Supabase backend checked read-only. Confirmed `dd_delete_my_comment`, `dd_edit_my_comment` (30-minute/unflagged), owner-only witness DELETE with retained 24h quota, and research trash/restore/purge RPCs. Added Profile/Hub UI against existing backend in code commit `0cb9dcafe93495c213f98e4c4bcf778c62d733ca`. No new DB policies/tables or real user writes; awaiting CI and Samsung real-account acceptance.

- **2026-11-03, My Research Hub collapsible UI STAGED:** six native keyboard-accessible expand/collapse sections implemented on unpublished branch, code commit `2dd0efeba5a36648bdd71048348ea0af8e445812`; static regression added to GitHub-only staging QA. Not yet marked CI GREEN, not Samsung-tested, not deployed. Existing account summary, private lists, backend and Admin Centre unchanged.

- **2026-11-03 16:29 UTC, Sources & Archives GitHub-only CI:** branch `feature/sources-archives-next-batch-nov03` head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`; Actions run `41674655120` SUCCESS. This is **source/CI validation, not Samsung QA or a deployment**.
- **Sources & Archives build staged:** `sources.html` with 13 reviewed country-level official/independent archive sources, country/type filtering, search, citation/right-to-reproduce cautions, Brazil SIAN guidance; About/Explore/Documents routes and sitemap wired. Test `scripts/test_sources_directory.cjs`; workflow `validate-sources-directory-staged.yml`. No PR or deployment for this branch. External links, accessibility and phone experience still require final acceptance.
- **2026-11-03 08:02 UTC, combined 11-tab website release:** PR #2 merged to `production`. PR describes news/archive/videos/Watch & Read discussions, likes/dislikes, five-flag moderation, witness public reports, W.NE Research Studio, My Research Hub/Profile, owner Admin Centre, LIVE hearing archive, refreshed tours, Podcasts chip, and backend migrations. CI run `41599937501` is described as successful in the merged PR. **Do not assume every real-account/mobile flow is verified.** Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` was confirmed again in this session.
- **Existing Android candidate:** `android/play-internal-candidate-oct31` includes Android wrapper/notification plumbing and a manual signed AAB workflow requiring Play upload-signing secrets. Website vs Android branch comparison shows large divergence (121 commits ahead, 198 behind at last check). Do **not** build Play release from that branch without intentional reconciliation, native regression and signing checks.

## 4. Current priority: complete the agreed website roadmap BEFORE the next update

**Current mobile & tour checkpoint:** native accessible modal/first-visit tour, previous-tab/keyboard focus restoration, 44px controls and 11-tab selected ARIA/scroll passed fake-DOM CI. Samsung Internet/Chrome device/browser checks still pending; finance remains paused.


**CURRENT (4 Nov): full-site tour/mobile navigation/accessibility QA on 11-tab unpublished branch.** Code staged for modal focus and origin-tab restore, accessible 44px controls, a dock ARIA/current-tab update and selected-tab scroll reveal; browser/Samsung actual acceptance pending. Earlier LIVE fake-clock/chat CI green; no published future hearing.


**LIVE work now CI GREEN (4 Nov 2026):** verified official-event timer T−45 start and approved closure, plus guest-read-only saved chat replay/pagination/cleanup in synthetic runtime. Real-authorised hearing/chat/RLS and mobile preview still outstanding; no invented hearings.


**LIVE hearing QA status:** time-bound chat transitions synthetic CI 41802115449 passed; read-only archived replay lifecycle/pagination fake guest test added. No verified future hearing scheduled or public message posted. Await CI and eventual owner-authorised mobile/browser acceptance.


**LIVE countdown QA:** chat now opens/closes on the per-second approved hearing time boundary rather than only the initial page render. Synthetic runtime test and GitHub-only acceptance pending; no actual announced event or chat RLS change. Account real-JWT acceptance remains queued.


**Owner-account form safety:** prevent stale username settings form from mutating a newly signed-in account; synthetic A/B duplicate-name regression staged in GitHub. Real account and browser acceptance pending.


**Current scope:** Disclosure Desk member/moderation QA, not Finance. New no-network A/B owner-action runtime test staged; real-user public report/comment testing requires explicit owner approval.


**Witness Edge CORS now verified live at code/config level:** Active `dd-witness-submit` v2 has `verify_jwt=true`, `x-client-info` preflight and exact Git source parity; GitHub no-deploy regression 41757257629 passed. Do not redeploy this Edge function just for the previously reported header bug. A real registered test-account POST and clean deletion are still needed.


**CURRENT OWNER PRIORITY (2026-11-04): BDS Finance Centre is PAUSED. RESUME DISCLOSURE DESK ROADMAP.** Work on the unpublished website QA/polish batch only. First milestone completed: read-only Supabase privilege audit and rollback-only hardening review, static QA green. No actual grants were revoked. Next complete real-account/guest/owner testing of deletion/edit, witness CORS and public username before any feature release. Keep 11-tab production unchanged and save Netlify credits.


**Finance L2.1 Samsung Internet unlocked UI:** actual screenshot confirms £337.00 sample income, £59.50 sample costs, £277.50 fictional profit and nine 2026/27 ledger rows. Dropdown changes and automatic timeout not yet tested; Chrome issue remains.


**Finance phone browser compatibility update (2026-11-04):** Samsung Internet displays L2.1 and owner sees locked confirmation after Lock now; Chrome still fails on the user's device and needs separate diagnosis, so avoid describing it as fully fixed.


**Finance L2.1:** Samsung Chrome 403 regression diagnosed; a narrowly scoped initial navigation fix is staged for phone retesting. This does not affect the Disclosure Desk 11-tab public release, nor authorise a Netlify deploy.


**Finance L2.1 separate phone-only milestone CI GREEN:** sample dashboard code and security/filter checks staged; owner Samsung update and on-device Lock now/expiry acceptance remain open. No reason to deploy Disclosure Desk or touch its 11-tab production website.


**Finance L2 Samsung display accepted by owner:** BDS private sample dashboard visually displays well in Samsung browser. This is independent of Disclosure Desk's 11-tab site and its pending release batch. Do not claim all security/filters/auto-lock tested by that brief confirmation.

**L1 Termux compatibility fix:** GitHub 17/17 vault tests passed on Python 3.12 and 3.14 (run 41730679400). Waiting for actual Samsung `init` confirmation; keep sample-only. Nothing deployed.

**Termux Finance L1 implementation staged; keep separate from live site.** 14 local automated Linux tests pass, GitHub Actions and Samsung acceptance pending. Code and fictional-only ZIP under `finance_local/`; no tax estimate, owner portal or real income. This doesn't affect the current Disclosure Desk QA/12-tab roadmap.

**Finance direction update:** Termux + encrypted on-device vault is now the preferred practical next prototype, not a deployed Supabase backend. The PostgreSQL F2 tests remain a separate unused alternative. No additional public site tab, finance route, online event receiver, or Netlify build. Only manual or user-initiated source imports/sync in the proposal.


**Parallel Finance F2 candidate milestone (CI GREEN, not live):** A private owner/MFA-gated ledger SQL design passed **disposable PostgreSQL role tests** run `41723430099`. No new live account or provider connection. Main Disclosure Desk website release plan and 11-tab navigation are unaffected; next Finance step is secure owner account/project selection and backup plan, not public Finance tab.

**Parallel Finance F1 result (GitHub CI GREEN):** synthetic offline demo at `docs/prototypes/bds-finance-demo.html`; details and limitations in `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md`. The Finance Centre's real-data F2 owner-only backend/security and F3 provider sync are **NOT BUILT**. No extra public nav tab and no finance deployment; don't let this prototype block existing Disclosure Desk website work.

**BDS Finance F0 updated (2026-11-03):** owner chose sole-trader for now, future optional incorporation. See Finance Centre roadmap. No reason to put a tax or payment dashboard in public Disclosure Desk; finances remain a separate owner-only planned tool, not a blocker to this website's QA queue.

**Owner-only BDS Finance Centre is a separate planned cross-product tool, NOT a blocker for the next Disclosure Desk website batch.** Design: `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md`; no implementation/automatic collection or tax calculation exists. Preserve public navigation and current branch release boundaries.

**Release rule:** collect work into the next significant unpublished batch, preserving 11 tabs and all tested capabilities. No individual feature deployment.

### 4A. Current QA/repair and polish queue — verify existing behavior first

- **Witness Reports:** **CODE STAGED** owner's `Delete report` in private Profile via existing owner DELETE RLS, immediate map refresh, confirmation and quota-retention warning. Read-only database audit verified delete trigger retains 24h quota. **Not real-account/phone tested.** Confirm latest Edge CORS including `x-client-info`, signed-in POST, map privacy and moderation; no test report deletion was performed.
- **Comments:** **CODE STAGED** owner Edit (within 30 min, unflagged only) and Delete controls in Profile → My Comments using verified existing `dd_edit_my_comment` and `dd_delete_my_comment` RPCs. Confirm before delete; retain all server moderation rules. **No real edit/delete submitted in tests**; verify real-account behavior and counts.
- **Research documents:** **CODE STAGED** move private cloud documents to Recently deleted, restore, and guarded permanent purge from Hub; reuse existing RLS/owner RPCs. Media-bearing purges are server-blocked, not bypassed. Local copies not touched. **No real-user restore or purge tested**; verify Studio library refresh/export/recovery and private asset linkage.
- **My Research Hub:** **CODE STAGED** six native keyboard-accessible collapsible panels via `<details>/<summary>`; default closed; live account summary and owner Admin Centre stay independent. Existing private lists were not rewritten. Await GitHub-only CI and Samsung/desktop acceptance before marking done.
- **Email backups:** **CODE STAGED** branded responsive dark/gold message with plain-text alternative, content-minimising body, existing JSON attachment, verified-only recipient and hourly limiter preserved. GitHub-only template contract check added. **Not yet deployed to Supabase Edge or delivery-tested.**
- **Usernames:** existing `dd_public_names` has generated unique `name_key` and opt-in display policies. Verify *duplicate rejection* and proper error messages with two real test accounts before changing DB schema.
- **Watch & Read / Videos / LIVE:** verify labels, podcast variety, buttons, fullscreen back handling, archived comments/chat, original source links and autoplay/YouTube behavior. Existing site calls Podcasts; do not reimplement an already-correct chip. Test on Samsung.
- **LIVE hearing discovery:** check the separate Congress candidate workflow and controlled approval-to-public-event process, realistic countdown/link/home notice, cancellation, 48h removal, archived hearing recordings with original chat, no fictitious dates.
- **Sources & Archives:** finish checking the staged directory, source URLs and rights, responsive search/filter and sitemap. Do not copy or republish Canadian/Brazilian archive originals without checking permissions.
- **Community Rules, tour and controls:** **CODE STAGED** corrected active-versus-planned community notice, outlined future Discussions stewards and 1:1 consent-based Chat, while preserving 11 currently live tabs. GitHub-only policy regression added. Still verify full-site tour (including future 12-tab changes only after approved backend), guest read-only vs signed-in, account separation, keyboard/screen-reader and mobile/device flows.
- **World map/archives:** extend case coverage toward the agreed long-term 100k goal through existing bulk-import + de-duplication, provenance and batching; check current count rather than assuming; preserve UK/Ireland and global coverage, no duplicate ingestion or privacy violations.

**Release blockers:** real registered-user browser/HTTP and Samsung tests; public/owner/guest permission tests; safe report delete/edit and comment workflow; backup/recovery test; unique username test; LIVE/countdown/chat QA; responsive, performance and accessibility checks. Verify any missing feature in code before marking it incomplete.

### 4B. Five approved *post-launch* research enhancements — roadmap, NOT delivered

All five were approved on 2026-11-03 and are documented in [the original roadmap](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md). Their previous document calls them *post-launch*. Newer user direction says finish the **current agreed roadmap** before the next website update. Reconcile their order with the current QA/release scope before expanding work: do not silently convert future research phases into blockers for a finished beta or promise that they already exist.

1. **Case Intelligence / Investigate:** source-grounded related cases, timeline, articles, media, similar/duplicate labels, evidence provenance.
2. **What was in the sky?:** optional aircraft/orbiting-satellite/meteor/weather/launch context with historical-data and timezone limitations, not automatic “explanations”. **New satellite-imagery subfeature staged:** existing Map case Evidence file links to source-grounded historical weather satellite views, approximate location and reported date (NASA Worldview 2000+; EUMETSAT daily 1981+ manual). **No true time-matched imagery is being asserted or hosted**, and future real archived 10/15-minute weather frames need a separately verified data/API/layer workflow. See `docs/HISTORICAL_SATELLITE_IMAGERY_2026-11-03.md`.
3. **Independent witness matching:** city/region/time only, confidence caveats, opt-in contact, anti-harassment and independence checks.
4. **Evidence quality / case status:** evidence-completeness checklist, chain of custody, alternate hypotheses, changes/corrections, no “alien probability”.
5. **Publish an Investigation:** private W.NE copy → redaction preview → explicit owner Publish; citations, history/corrections, PDF/DOCX; prevent private Boards/docs leakage.

Retain these in existing sections/tools, not five new navigation tabs. Before building any part, inspect current Evidence Connections / comparison / research/export implementations to avoid duplication.

### 4C. Private one-to-one user messaging — BACKEND CANDIDATE + DISABLED UI STAGED / NOT APPLIED

**Requested 2026-11-03:** Add a **Chat** section *within* the existing **Profile / My Research Hub**, using its expandable card pattern and an embedded conversation window. No separate chat page or chat-specific navigation tab (the separately approved Discussions tab will be the site's future twelfth tab), and **no group chats**. Include **Accepted chats** and **Pending requests** (incoming and sent), with an unread indicator and a message pane in the same Profile section.

**Consent-first start:** A signed-in, non-anonymous registered user may find an eligible **opted-in public username** and send **exactly one initial message as a chat request**. Recipient sees *only that first message as a request preview*, with **Accept** or **Decline**. Sender may not continue the conversation or send follow-ups while pending. Only acceptance enables a persistent private two-way conversation visible to the two members; a declined request does not become a chat.

**Privacy / abuse controls:** Usernames must be unique and discoverable for chat only with explicit opt-in, reusing existing `dd_public_names` and existing Auth rather than creating an unrelated profile directory. Do not expose emails, underlying auth UUIDs, private Boards/research or location. RLS and server-side checks must restrict request/chat/message access to the two participants and prevent the sender from self-accepting, bypassing a decline, spam-retrying or contacting a blocked account. Include **Block** and **Report** controls, request rate limits, anti-harassment restrictions, refusal without mandatory explanation, and appropriate moderation/report review without routine moderator access to everyone's private conversations. No unsolicited group broadcasts; no attachments initially.

**User experience / device:** Inside Profile: an expandable Chat panel with Accepted | Pending (received/sent) states, a selectable conversation list, and a scrollable message window/composer in the *same panel* after acceptance. Inbound pending shows only the submitted preview and Accept/Decline actions. Safe markup/text rendering, touch/keyboard accessibility, responsive mobile, unread state and cross-device consistency; Android should receive the same functionality after website QA. Notifications should be opt-in if added.

**Build / acceptance status:** A **review-only SQL backend candidate** now exists in `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`, with GitHub-only structural tests; it has **NOT** been applied or verified against a live/staging database. Disabled Profile UI and feature-gated independent contact opt-in source are staged; feature activation, schema testing, real 1:1 messages and security QA remain pending. Feature remains approved for the **current consolidated roadmap** before the next coordinated website release. Inspect the existing LIVE hearing chat and community identity primitives first to reuse safe code patterns **without conflating public LIVE chat and private messaging tables**. Build on the unpublished website branch, test with synthetic multi-account scenarios (pending/accept/decline/block/report/unauthorised read, spam caps, simultaneous requests), RLS audit, Samsung/desktop QA; then port to Android and prepare the Play release. **Do not migrate the live database or deploy Netlify merely to record this feature.** Detailed requirement/acceptance record: [Private Chat roadmap](docs/PROFILE_PRIVATE_CHAT_ROADMAP_2026-11-03.md).

### 4D. User-created Discussions tab — FRONTEND STAGED/DISABLED; BACKEND SQL CANDIDATE UNAPPLIED

**Requested 2026-11-03:** Add **Discussions** as a separate **12th** main tab in the future combined website release (proposed after Witness, before Watch & Read). The **current live site still has 11 tabs**. This deliberately authorises a new navigation tab, unlike private Profile Chat (which stays inside Profile). Users create public topic sections and then posts, threaded discussions and shareable source links inside them. Guests can read published public discussions; registered users can post, reply, vote and flag. Avoid duplicating current case/news/video comment threads and LIVE chat.

**Governance:** A section creator becomes a **scoped section steward**, not an unchecked moderator. They may manage section description/tags, pin a few posts, flag issues and **escalate directly to overall site admin**. They cannot ban critics, gatekeep post approval, permanently hide/delete somebody else's content or grant themselves more powers. Continue **five distinct user flags → temporarily hidden pending review**; dislikes are not flags. Serious safety/privacy cases need urgent report routing without waiting for five flags. Narrow emergency safety holds are a design proposal only and require time limits, owner review, audited reason and appeals before any approval.

**User protection:** registered Auth + safe unique aliases, RLS author/steward/site-owner separation, duplicate/name/rate/spam guards, links/XSS security, appeals, owner moderation override and steward revocation without deleting community content. Public-by-default sections, no private groups or paid gatekeeping in v1. Owner moderation must remain effective; steward abuse must be reversible.

**Status:** Responsive frontend and gated navigation CODE STAGED behind `discussions:false`; a **review-only** database schema/RPC candidate is staged in `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`, but has NOT been applied or exercised. No visible 12th tab, no deployment. The staged client is NOT usable without separately reviewed server permissions. Build and test on unpublished branch with fake multi-account permissions, keyboard/phone acceptance and GitHub-only CI before one combined website release; port to Android after website approval. See [full Discussions roadmap and acceptance criteria](docs/COMMUNITY_DISCUSSIONS_ROADMAP_2026-11-03.md).

## 5. Release plan: website first, then Android / Google Play

**LIVE fix remains unpublished:** no fabricated hearing or source added and no Netlify build. Require official confirmation and genuine browser acceptance before enabling community LIVE.


**Disclosure Desk scope resumed:** finance phone milestones remain documented but paused. Keep review SQL under `supabase/` outside `migrations`; no live database permission changes without separate approval; no opportunistic Netlify or production deploy.


**Finance Centre display acceptance does not authorise live financial records or public deployment.** Keep synthetic-only local Termux vault; no Netlify or backend actions.


**Local Finance L2.1 is Samsung Internet-tested only for shell/lock UI**, still fictional-only; no public release or finance production approval.


**Finance Android browser compatibility fix:** synthetic-only Termux source ZIP; not a Play release or live finance system.


**Finance Centre L2.1:** one local Termux ZIP containing only dashboard.py and README, not a public site, APK/AAB, paid finance account or permission to use real data. No Netlify or live Supabase work authorised.


**Finance dashboard stays local and fictional-only:** User-reported mobile L2 display is not a public website release or permission to enable real income/financial connectors; leave production, Netlify and Disclosure Desk Supabase unchanged.

**BDS finance fix is downloadable source ZIP, NOT a site or Play update.** Reuse existing user's Termux installation; no rebuild, Netlify, Supabase or public website work necessary.

**Finance L1 is NOT an Android Play release:** a command-line, passphrase-protected Termux proof only. No separate app signing or public web deployment. Before the next website merge exclude `finance_local/` and `docs/prototypes/` from public deployment output or accept only the explicitly synthetic demonstration as non-sensitive; never publish real finance files.

**Finance-specific exception:** Termux local-only Finance Centre is a separate private owner app and not part of Disclosure Desk's public website or Play release; L1 encryption/backup and L2 device-only UI require physical phone testing before real finance data. The staged F2 finance SQL MUST NOT be applied to Disclosure Desk.


**Finance release remains independent and prohibited in this batch:** F2 SQL candidate lives outside `supabase/migrations` and must not be included in the website deployment, which cannot enforce owner-only route access by hiding a URL. The dedicated private finance service and MFA/backup approval are outstanding.

**Additional scope already approved:** consent-first private 1:1 messaging embedded within Profile (Section 4C, no extra chat tab) **and** new public user-created Discussions as a separately approved **12th main tab** (Section 4D). Both belong to the consolidated website roadmap with abuse/security tests and later Android parity. Current `production` remains the original 11-tab version.

**Phase 1 — Unpublished website development:** work only on `feature/sources-archives-next-batch-nov03` or a clearly documented child; integrate already-staged Sources & Archives plus agreed feedback without duplicating the 11-tab production features. Update master after each milestone. Keep Netlify and public domain unchanged.

**Phase 2 — Consolidated website QA/release:** run GitHub-only checks; audit actual Supabase/RLS/API; create one deliberate staging preview only after approval; human-test signed-in/guest/owner, two-account separation, camera/media, live chat, sources, submissions, editing/deletion and backups on Samsung S24 Ultra, and keyboard/desktop. Preserve fixes and bug list, then seek approval for one combined `production` release. Do not assume green CI equals mobile acceptance.

**Phase 3 — Android parity port:** compare `production` merged website with `android/play-internal-candidate-oct31`; bring across all approved current web assets, URLs, session/auth, Research Studio navigation, map/Leaflet, login, comment/witness moderation, LIVE replay, notifications and offline/fallback behavior. Avoid overwriting Android native capabilities or reverting website features. Verify app-specific origin/CORS, WebView cookies/storage, deep-links/back gestures, notification and playback behavior, mobile menu/profile, updates, account and privacy.
 
**Phase 4 — Play internal test and release preparation:** check Gradle/Android SDK, app ID, target API and Play policy requirements on actual release date; securely configure signed Android App Bundle (AAB) using existing manual `.github/workflows/android-play-internal-aab.yml`; check Play App Signing, release keys, version codes, app icon, screenshots, listing, privacy/data safety, consent/ads implementation, support URL, testing track eligibility, crash-free smoke and multi-device tests. Run internal/closed testing first; production publication requires explicit separate approval. Never publish a debug-signed APK as Play release.

## 6. Known source paths and supporting records

- Tour/mobile: `index.html` changes, `scripts/test_mobile_tour_a11y.cjs` fake DOM, existing `scripts/test_guided_tour_2026.cjs` refreshed, `docs/TOUR_MOBILE_ACCESSIBILITY_QA_2026-11-04.md`; **GitHub 41809892108 SUCCESS**, 30 intact target selectors.


- Tour/mobile accessibility: `index.html` guided-tour modal/welcome/nav changes, `scripts/test_mobile_tour_a11y.cjs` network-free source/runtime test, `scripts/test_guided_tour_2026.cjs`, `docs/TOUR_MOBILE_ACCESSIBILITY_QA_2026-11-04.md`; 11 tabs and 30 tour targets preserved.


- Runtime archived LIVE replay QA: `scripts/test_live_chat_archive_runtime.cjs` executes unchanged `assets/live-chat.js` with mocked public chat RPC, 60+1 fake messages, no network. `docs/LIVE_WINDOW_TRANSITIONS_2026-11-04.md` documents both timer window and transcript safety.


- LIVE timing staged: `assets/live-schedule.js`, `scripts/test_live_chat_window_runtime.cjs`, existing `scripts/test_live_schedule.cjs`, `scripts/test_live_chat_archive.cjs`, and `docs/LIVE_WINDOW_TRANSITIONS_2026-11-04.md`. No database mutation.


- `assets/public-profiles.js` guards stale account/revision on save; `scripts/test_public_profiles_owner_runtime.cjs` tests A/B account switch and duplicate-name warning without any backend access.


- Owner-action account switch test `scripts/test_research_hub_owner_runtime.cjs` runs existing `assets/research-hub.js` against fake identities only. Safe human acceptance `docs/MEMBER_ACTION_ACCEPTANCE_2026-11-04.md`.


- Witness v2 source parity and CORS 2026-11-04: `supabase/functions/dd-witness-submit/index.ts` (exact deployed version 2, JWT verified), `scripts/test_witness_community.cjs` (new CORS assertions), `.github/workflows/validate-sources-directory-staged.yml` (static QA step) and `docs/BETA_FEEDBACK_FIXES_2026-11-03.md`; GitHub Actions run 41757257629 SUCCESS. No actual HTTP POST was sent and no Edge deployment performed.


- Disclosure Desk 2026-11-04 permission preflight: `docs/COMMUNITY_ROLE_PRIVILEGE_AUDIT_2026-11-04.md` (read-only live metadata findings, no user data), `supabase/COMMUNITY_EXTRA_PRIVILEGES_REVIEW.sql` (BEGIN/ROLLBACK proposal ONLY), `scripts/test_community_privilege_review.cjs` (static no-db regression), `.github/workflows/validate-sources-directory-staged.yml` (CI step); Actions run `41756880146` SUCCESS. Live DB project `omqxizswzcwgzqaczlhe` verified; no tables/rights altered.


- 2026-11-04 00:50 UK real Samsung Internet unlocked dashboard screenshot in chat (not committed to repo): default 2026/27 All BDS products gross £337.00, costs £59.50, fictional profit £277.50, nine rows; `finance_local/dashboard.py`, Android browser patch `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf`.


- 2026-11-04 Samsung Internet screenshot (conversation-only, not in repo) shows the local synthetic Finance Centre page and `Locked by owner` state after manual lock. Chrome user-reported failing even after the latest hotfix. Relevant code `finance_local/dashboard.py`, tests `finance_local/tests/test_dashboard.py`, CI run 41743244163.


- Samsung L2.1 Chrome 403 patch: `finance_local/dashboard.py`, `finance_local/tests/test_dashboard.py`, `finance_local/DASHBOARD_README.md`, `.github/workflows/validate-bds-finance-termux-l1.yml`; local tested download `BDS_Finance_L2_1_Android_Browser_Fix.zip`; code commit `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf`.


- L2.1 private sample dashboard `finance_local/dashboard.py`, `finance_local/tests/test_dashboard.py`, `finance_local/DASHBOARD_README.md`; CI `.github/workflows/validate-bds-finance-termux-l1.yml`, source commit `7e73c86799eb2c576be3e10a1eacd3fed5f2b72c`, run `41740238168` SUCCESS with `BDS-Finance-L2-1-Samsung-Synthetic` artifact, public production unchanged.


- L2 Samsung owner acceptance (2026-11-03 ~23:16 UK): `finance_local/dashboard.py`, `finance_local/DASHBOARD_README.md`, `finance_local/BDS_Finance_L2_Private_Dashboard.zip`, automated CI `41736247141`. Screenshot not required to record user's verbal display confirmation; do not store any browser access-key URLs.

- Android Termux missing-os.link fix: `finance_local/vault.py`, `finance_local/tests/test_vault.py`, `finance_local/BDS_Finance_Termux_L1_Android_fix.zip`, corrected canonical ZIP, `finance_local/SHA256SUMS`, and Python 3.12/3.14 workflow; CI 41730679400 SUCCESS.

- New Termux L1 source/test/ZIP: `finance_local/vault.py`, `finance_local/tests/test_vault.py`, `finance_local/README.md`, `finance_local/BDS_Finance_Termux_L1_demo.zip`; GitHub-only workflow `.github/workflows/validate-bds-finance-termux-l1.yml`. Contains no personal income or keys.

- Local-first BDS Finance design: `docs/BDS_FINANCE_TERMUX_LOCAL_FIRST_2026-11-03.md`; Ko-fi export/AdSense installed OAuth/Play report constraints documented. No local encryption or provider sync code exists yet. Prior `finance-review/` SQL remains unapplied.


- Finance F2 review-only SQL/isolated role QA: `finance-review/finance-f2-review.sql`, `finance-review/isolated-fixture.sql`, `finance-review/isolated-acceptance.sql`, `.github/workflows/validate-bds-finance-isolated.yml`; `docs/BDS_FINANCE_F2_SECURITY_2026-11-03.md`. Tests passed 2026-11-03 in disposable DB, no live backend.

- BDS Finance sample-only prototype: `docs/prototypes/bds-finance-demo.html`, `docs/prototypes/README.md`; GitHub tests `scripts/test_bds_finance_demo.cjs`. HTML may be publicly served by a future whole-branch deploy, so exclude/private-host before any real financial use.

- Future private business finance dashboard (design only): `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md`; no current code or financial records.

- Website: `index.html`, `cloud-boards.js`, `assets/*`, `community-rules.html`, `privacy.html`, `sources.html`, `research/*`, `supabase/*`.
- Research Studio: `research/wne.html`, `research/research-workspace.html`, `research/research-site-nav.js`, cloud/local bridges and canonical Research Edition source.
- Backend: `supabase/functions/dd-witness-submit/index.ts`, `supabase/functions/email-board-backup/index.ts`; reviewed migrations in `supabase/`.
- Tests: `scripts/test_sources_directory.cjs`, `scripts/test_research_hub.cjs`, `scripts/test_community_http.mjs`, `scripts/test_witness_community.cjs`, `scripts/test_live_chat_archive.cjs`, `scripts/test_wne_site_integration.cjs`, `scripts/smoke_wne_website.mjs`.
- Exact test/background history: [LIVE/community handover](docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md), [Community backend QA](docs/COMMUNITY_BACKEND_QA_2026-11-03.md), [W.NE integration handover](docs/WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md), [beta feedback fixes](docs/BETA_FEEDBACK_FIXES_2026-11-03.md), [LIVE archive specification](docs/LIVE_CHAT_ARCHIVE_RELEASE.md), [post-launch research phases](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md), [Android release checklist](RELEASE_READINESS.md).
- Existing original four continuity files on the old `main` branch contained rules, development handover, feature registry and memory, but were not copied into the active `production` baseline. This commit installs short same-name pointers to THIS master file on the current staged branch. Their prior detailed records are historical.

## 7. Invariant acceptance checklist — before any public/Play release

- [x] All 11 nav tabs and 30 full/focused tour targets validated in runtime/static CI, plus native modal Escape/tab and focus restore (GitHub 41809892108).
- [ ] Real Samsung Internet/Chrome visual acceptance of portrait/landscape, Android Back, TalkBack, bottom dock scrolling and W.NE unsaved-work safety; do not claim SAMSUNG VERIFIED from VM tests.


- [x] Source inventory: full/focused tour 30 steps target actual 11-tab site elements. Native modal/keyboard, nav ARIA/current focus fixes code-staged.
- [ ] Run new GitHub-only tour runtime suite green; then Samsung/Chrome real visual keyboard/touch/landscape/Back/TalkBack acceptance and safe navigation from W.NE.


- [x] No-network LIVE chat T−45 transition, 4-hour close and unchanged-video card test GitHub Actions 41802115449 SUCCESS.
- [x] No-network archived replay guest privacy, no posting, older-message pagination and isolation from LIVE refresh GitHub Actions 41802463605 SUCCESS.
- [ ] Real approved-event backend/public guest/signed-in browser, archived message deletion/flag abuse and Samsung/desktop preview still pending.


- [x] LIVE approved-event T−45 chat opens once and closes by T+4h in actual source under synthetic clock: CI 41802115449 SUCCESS.
- [ ] Guest archived replay pagination/cleanup CI and actual Safari/Samsung/Chrome with real approved hearing data remain pending.


- [ ] Synthetic CI verifies opening chat at T−45 and closing at earliest approved end/start+4h without re-rendering official video; real Samsung/JWT LIVE test separately required.


- [x] Inspected public username database index uniqueness and UI source; proposed protection against account-switch stale form writes.
- [ ] New synthetic username runtime and real-account alias conflict + cross-account save tests pass before live publishing.


- [x] Read-only reviewed existing authenticated-only comment and research owner RPC bodies (4 November).
- [ ] Owner-action A/B runtime test passes GitHub CI; real JWT and Samsung acceptance still pending, no live writes allowed.


- [x] Witness Edge deployed v2 verified by read-only function metadata; `verify_jwt=true`, live source exactly matches GitHub, `x-client-info` accepted in OPTIONS; no-deploy QA 41757257629 SUCCESS.
- [ ] Witness registered-account browser POST + CORS response + city match + map visibility + owner remove verified using approved disposable report; historical OPTIONS-only result alone cannot prove success.


- [x] 2026-11-04 live READ-ONLY Disclosure Desk schema audit: RLS on 22 public base tables; unexpected TRUNCATE/TRIGGER grants on ten, not yet revoked.
- [x] Rollback-only, exact-table hardening review + static QA: GitHub run 41756880146 SUCCESS; normal witness owner DELETE/RLS and comment/research RPC availability confirmed from grants/catalog.
- [ ] Review/approve the permission correction, test on isolated clone, seek explicit authorisation before any live database permission change; rerun privilege inventory.
- [ ] Real Auth HTTP/phone checks for own witness report deletion, comment edit/delete, Research trash/restore, unique username and failed witness CORS; no live member content deleted for QA.


- [x] On Samsung Internet switching UK year to 2025/26 shows £15 gross, £0 costs, £15 fictional profit, Ko-fi only, countdown visible at 09:29 (01:00 screenshot).
- [ ] Check remaining 2026/27 product filters and actual 10-minute auto-expiry; Chrome remains unverified.


- [x] Samsung Internet switch-away to ChatGPT auto-clears browser dashboard and shows locked state (owner confirmation). This is browser-side privacy protection, NOT independently proven server-side ten-minute termination.
- [ ] Test filters in one uninterrupted browser session and verify server expiry/token invalidation separately.


- [x] On Samsung Internet L2.1 private dashboard unlocked and displayed correct default 2026/27 all-products figures, charts and nine fictional ledger entries (owner screenshot 00:50 UK).
- [ ] On phone change year to 2025/26 (£15.00), then 2026/27 product filters (Disclosure Desk £147.00, Our Cinema £142.50, BDS shared −£12.00), then test ten-minute timeout and manual lock; Chrome compatibility unresolved.


- [x] Samsung Internet renders BDS Finance Centre local page and shows manual lock confirmation after owner action (user screenshot 2026-11-04 00:47).
- [ ] On Samsung Internet validate all filters while unlocked, countdown and server-side token revocation/expiry; Chrome compatibility still unresolved.


- [x] Reproduced 403 on Termux-to-Chrome cross-site initial GET `/`; targeted HTML-shell exception plus tests, local 33 pass.
- [ ] Confirm corrected L2.1 loads in Samsung Chrome, filters and Lock now work; independently verify ten-minute expiry. No real financial records permitted.


- [x] L2.1 32 local Python tests PASS, 390px synthetic Chromium UI test PASS and GitHub Actions Python 3.12/3.14 **41740238168 SUCCESS**.
- [x] GitHub-only artifact contains only dashboard.py and README; user ZIP with same source validated locally.
- [ ] Samsung L2.1 upgrade, 2025/26 and 2026/27 filters, Lock now and timeout verified by owner; no actual financial data yet.
- [ ] Independent copy/download of encrypted Drive backup tested on a clean installation and independent security review before personal finance use.


- [x] L2 private Finance dashboard visually displays nicely on owner's Samsung (owner confirmation, 2026-11-03); fictional figures only.
- [ ] Phone verify UK tax-year/product filtering and session timeout/lock; independent localhost/access and browser-cache scrutiny before real-data readiness.
- [ ] Independently re-download and restore encrypted Drive backup; a reported manual upload is not a recovery drill.

- [x] **L1 actual Samsung encrypted isolated recovery:** `HOME` redirected to fresh test directory, `restore` succeeded without touching normal vault, summary recovered fictional £277.50 profit (2026-11-03 22:36 UK).
- [ ] **Off-device** independently retrievable encrypted `.bds` copy, SHA-256 match and separate-device restore; no real money accepted until further security/data model review.

- [x] Android missing `os.link` regression covered; 17 tests PASS on both Python 3.12 and 3.14, exact ZIP/source parity CI GREEN.
- [ ] Verify fixed `init`, fictional `demo-fill`/`summary` and encrypted backup on actual Samsung. Never wipe private app storage.

- [x] Finance L1 synthetic-only vault prototype and 14 local automated tests PASS (Linux); no live money records.
- [x] GitHub Actions L1 unit tests passed at SHA `fa26ec8cec96fb859aef6c0336d1d887a9ac4179` (run `41727300663`); exact ZIP binary SHA-256 verified locally; source-text byte parity corrected on the follow-up commit; retest pending.
- [ ] Actual Samsung Termux `python-cryptography` availability, encrypted recovery drill and private-storage confirmation manually verified; no real finances until then.

- [ ] Phone-only Finance L1: encrypted private Termux vault and independent encrypted backup restore using synthetic transactions; no unencrypted actual records in shared downloads or local browser cache. Not implemented.
- [ ] Finance Ko-fi source is manual verified history CSV under phone-only architecture; any real-time webhook relay requires separate explicit online-service approval.


- [x] F2 candidate SQL isolated synthetic owner/cross-user/MFA/revocation/duplicate validation **CI GREEN**; **this does not authorise storing real finance data**.
- [ ] Separate finance identity/project, real MFA, owner-only API, encrypted backups, secured routes and Samsung/desktop test are still required; keep `docs/prototypes` fake data only.

- [ ] F1 finance demo is **sample-only and unpublished**; don't accidentally publish it in public static deploy output; separate owner-only privacy/RLS, secure backups and real provider connections required before real data.

- [ ] No proposed BDS financial data/provider authorisation exposed via the public website; Finance Centre has no release approval and requires owner-only security/RLS and tax-assumption testing first.

- [ ] Confirm exact branch and HEAD; no unexpected merge, deployment or automation run.
- [ ] Current 11 tabs, original W.NE UI and existing features present; no UI/code leak, duplicate editor or blank sections.
- [ ] Users/auth/session: guest read-only; private documents and Boards segregated; logout/login and restore correct.
- [ ] Supabase RLS/permission tests for anonymous, signed-in owner and unrelated registered user; server guards enforced.
- [ ] Witness city privacy, 3/24h, duplicates, vote/flag, five distinct flags, restore baseline, user report deletion/withdraw and owner moderation.
- [ ] Comment/public username create/display/edit/delete, counts and flags safely validated; public raw IDs/emails remain hidden.
- [ ] LIVE official verification, homepage 48h notice, timezone, recordings, archival chat and moderation.
- [ ] News/Archive/Map/Videos/Watch & Read/Explore/Profile/Research Studio/Boards fully function on phone + desktop.
- [ ] Cloud save, editor save-before-navigation, export/import, backup email and recovery tests, with disposable copies.
- [ ] Source links and reproduction rights; accessible/tappable controls, mobile layouts, performance, legal/privacy text.
- [ ] One final combined staging run and human acceptance before separate production authorisation.
- [ ] After website approval: Android native parity, signed AAB, notifications, ads/consent, Play internal track acceptance before Play production approval.

## 8. Exact next task for the next chat

**NEWEST 5 NOV BDS BACKUPS:** Two separate Google Drive backup folders exist (Disclosure Desk and Our Cinema) with `Nov 2026 / 05 Nov 2026` subfolders. A 13KB **private-alpha source ZIP** `BDS-Dual-Encrypted-Backups-Private-Alpha.zip` was generated in this conversation, **9/9 offline unit tests PASS**, but **no real backup/schedule/Drive OAuth/age keys or credentials exist**. Need separate **PRIVATE** runner repository because current DD website repo is PUBLIC, provision only GitHub Secrets (never in chat), first manual encrypted backup for both Supabase projects + Storage bytes, test decrypt/restoration, then enable hourly schedule and daily email alerts/retention. Supabase Cinema id `nsqmktjigdllkqhsuqmh`; DD id `omqxizswzcwgzqaczlhe`. See `docs/BDS_MULTI_APP_BACKUP_HANDOVER_2026-11-05.md`. This does NOT authorise editing Our Cinema app or production schema.

**NEWEST 2026-11-05 database test:** Actual connected project accepted both candidate Chat and Discussions SQL in **transaction-only, forced-ROLLBACK rehearsals**: 5 Chat and 8 Forum tables, all with RLS, with all traces absent after independent post-check. **Project remains unmodified**; counts 3 Auth accounts, 3 boards, 7 docs, one moderator row, one Storage object. Project organisation Free; **usable backup is still not established**. The user permits testing on existing dummy data and might create a separate Supabase account if genuinely needed; **do not treat a second project as a backup**. First priority remains obtain an encrypted/off-site SQL export **plus Storage object copy and restore proof**, then Netlify settings, real A/B login and controlled release. Rehearsal details `docs/LIVE_SUPABASE_TRANSACTION_REHEARSAL_2026-11-05.md`; no need to repeat these SQL checks absent changes.

**LATEST 5 NOV RELEASE PACKAGE CHECKPOINT:** safe public package existing CI now hardened with fixed explicit asset names and actual HTML/static links. **Run 42038409387 SUCCESS, 56 files, 46 references validated**; full staging **42038407552 SUCCESS**, branch code head `ca45f60`. The 2 duplicate CI/package scripts introduced during audit were **removed**; use only `scripts/build_public_release.cjs`, `scripts/test_public_release_package.cjs`, `.github/workflows/validate-public-release-package.yml`. Source link fixes: Sources official SVG favicon and hosted W.NE Research Library route. Site changes remain UNPUBLISHED. **Next most important work is verify recoverable Supabase database backup AND separate Storage object backup, then actual Netlify publish directory/redirects/functions and one approved combined deploy; do not repeat finished browser/JWT/package tests.** Exact checklist `docs/RELEASE_BACKUP_ROLLBACK_AUDIT_2026-11-05.md`.

**NEW 5 NOV RELEASE AUDIT:** source commit `cdd2b1ba186b5ac18c08f873926915d48f862def`, safe-public-package CI `42029678884` GREEN (56/56 files; 13,294,501 bytes) and full staging `42029678872` GREEN. A risky GitHub Pages root-directory upload was corrected in the **development branch only**, with a proofed public-file allowlist that excludes internal Finance, SQL, test scripts, docs and handovers. The public Netlify project still needs its actual publish-path/build-trigger and `/.netlify/functions/interests` settings checked. Supabase **backups not yet verified**; 1 Storage bucket requires separate object backup. Full plan: `docs/RELEASE_BACKUP_ROLLBACK_AUDIT_2026-11-05.md`. Next gather proof of a recoverable database backup and safe publish configuration before executing **one** carefully approved combined beta. No further repetitive SQL/Chromium tests; Finance paused, flags OFF, no current deploy.

**NEWEST 5 NOV:** Chromium browser QA expanded to **18/18 PASS** GitHub run `42027694804`, full staging run `42027694930` GREEN, commit `3c1a9f7`. Landscape, first-visit welcome native dialogs and actual W.NE editor DOM save-denial + fake save-confirmed return have all been exercised by real Chrome; localStorage exception traced to test harness sandboxed frame injection and eliminated. No real document save was attempted. No more browser fake-DOM repetitions needed. Physical Samsung acceptance, actual Supabase Auth A/B, deployment snapshot/rollback and production-feature approval remain. **Features remain OFF; Netlify & live data unchanged.** See `docs/CHROMIUM_MOBILE_QA_2026-11-05.md`.

**Latest 5 Nov browser evidence:** actual headless Chrome mobile viewport GitHub run **42027132774 PASS 12/12** and main staging run **42027132653 PASS**, source commit `cf029b1`. Code and artifact: `scripts/test_browser_release_smoke.cjs`, `.github/workflows/validate-browser-release-smoke.yml`, `docs/CHROMIUM_MOBILE_QA_2026-11-05.md`. Unlike old fake-DOM tests this genuinely clicked buttons in a 393px browser. External sites/Supabase blocked; no production requests. One local browser `localStorage` security console exception must be traced, and landscape/welcome/full W.NE editor save/device testing is still missing. Avoid duplicate replay of prior 55 signed-JWT HTTP checks. Feature gates and Netlify unchanged.

**LATEST 5 NOV SIGNED HTTP CHECKPOINT:** Private Chat JWT HTTP 22/22 GREEN run **42025369219**, Discussions JWT HTTP 33/33 GREEN run **42025810582**, total **55/55** across disposable PostgREST/PostgreSQL runners. Details `docs/COMMUNITY_SIGNED_HTTP_QA_2026-11-05.md`. User conditionally permits a combined test deployment to the public website if simpler, **but not needed for isolated HTTP checks**; no Netlify credits spent. Do not duplicate existing PostgreSQL tests. Next genuine blocker is integrated real Supabase Auth A/B test and Samsung UI acceptance, followed by owner-reviewed backend migration plus one combined release. No production data mutation or unconditional live deploy. Flags private Chat/Discussions OFF.

**Latest 5 Nov:** gated W.NE/Discussions dock-and-deep-link code passed run **42013369188** at `bbb6a921`, with zero public/Netlify/database changes. The Research dock remains eleven tabs unless the backend-approved Discussions flag is explicitly enabled. W.NE saves still block unsaved navigation. **Do not redo existing isolated Chat/forum PostgreSQL or synthetic UI checks.** Next actual gaps are user-approved real disposable-account/JWT testing in isolated staging, on-device Samsung/Chrome/W.NE navigation and a carefully controlled backend rollout after review; preserve all existing site features and Finance pause.

**5 NOV QA DEDUPLICATION UPDATE:** Current unpublished website branch now has green actual frontend mock tests for private Chat A→B delayed history (run `42010786518`) and Discussions A→B stale stewardship/queued action (run `42011490087`). Sources: `scripts/test_private_chat_account_switch_runtime.cjs`, `assets/community-discussions.js`, `scripts/test_discussions_account_switch_runtime.cjs`; see `docs/COMMUNITY_LAUNCH_READINESS_2026-11-05.md`. Prior detached Chat/PostgreSQL and forum PostgreSQL security tests, LIVE replay/timing, alias/owner actions, static contracts and mobile tour source tests were already successful; **do not duplicate them**. Continue on separate isolated-account HTTP/RLS acceptance, actual Samsung/browser acceptance, moderated review/evidence and combined 12-tab navigation/writer dock parity only after explicit activation approval. `privateChat:false`, `discussions:false`, and live data/Netlify stay untouched.

**NEW 5 NOV CHAT/DISCUSSIONS GATE (override older action notes below):** Website staging source is `boydamo84-coder/disclosure-desk-preview` branch `feature/sources-archives-next-batch-nov03`, not legacy `disclosure-desk` or old `main`. Read `docs/COMMUNITY_LAUNCH_READINESS_2026-11-05.md` first. Existing LIVE chat is backend-applied, with synthetic tests green; private 1:1 Chat and public Discussions remain off with *detached* PostgreSQL QA green but live SQL candidates unapplied. Next make a separate disposable two-account database/browser acceptance plan, then verified Samsung/Chrome UI checks, RLS adversarial tests and deliberate schema/launch approvals. Keep the existing 11 live tabs, 12th Discussions still gated, private Chat inside Profile, hearings search/archive deferred, Finance paused and Netlify untouched. Do not claim these features live-ready based on green static CI.

**Latest Disclosure Desk:** tour/mobile code CI GREEN on branch `feature/sources-archives-next-batch-nov03` (41809892108); Samsung Internet/device still unverified. Test Explore full guided tour, 11 bottom tabs, Escape/Back/Close restoring originating screen and focus, small/landscape layouts, and not interrupting private W.NE before a coordinated owner-approved preview. Do not publish, merge to production, spend Netlify credits or generate fake LIVE events.


**Latest tour QA checkpoint:** verify Node runtime test on actual `index.html` shows Close and native Escape return to original tab, first-visit modal/Escape, 30 targets, nav aria-current. Fix CI failures if necessary, then mark CI GREEN. Next user-only device tests: full tour on Samsung Internet, 11 dock tabs, keyboard/tap/Back and no overlapping bottom nav, preserve W.NE; no Netlify until owner approval.


**Next Disclosure Desk QA:** both LIVE synthetic GitHub runs 41802115449 and 41802463605 GREEN; do NOT publish synthetic events. Continue tour, multi-tab navigation, mobile layout and moderation/pre-release QA without Netlify builds. For real LIVE hearing/chat end-to-end, require confirmed official event and owner-approved disposable test users; Supabase role privilege hardening remains review-only.


**Now:** verify new `scripts/test_live_chat_archive_runtime.cjs` GitHub CI and fix mock/test issues if any. Source already preserves archive while cleaning LIVE room; real guest read-only/RLS, account chat posting, after-event replay and official hearing publishing remain deliberately untested. Preserve 11-tab live website, don't deploy or create fake hearings.


**Current LIVE QA:** verify GitHub-only synthetic clock and archive tests for timing transitions; review any failures. Next review actual browser guest/replay and registered-user RLS with approval for disposable test accounts; never invent a Congress event. Do not deploy, change private project, or consume Netlify.


**Current Disclosure Desk owner acceptance gate (4 Nov):** two GitHub CI runtime tests now GREEN: Hub A/B stale action, username A/B stale save plus duplicate warning; staging source `3d5edcbf90c668d7a253be1fa03938569964df0c`, CI 41801094736 SUCCESS. Next user-facing work: real browser validation with two expressly approved disposable accounts and expendable records (see `docs/MEMBER_ACTION_ACCEPTANCE_2026-11-04.md`); never create public witness reports without separate approval and cleanup. After that, document/comment/name/RLS and LIVE/chat/tour/Research Studio checks for a single coordinated website release. Finance paused; no Netlify production deploy.


**Website QA latest:** confirm username cross-account race guard CI (synthetic A/B), then controlled disposable real-account alias test ONLY after owner agrees. Continue witness/comment/document acceptance and LIVE/chat roadmap, conserving Netlify builds.


**Disclosure Desk website priority:** verify A/B synthetic owner-action runtime test GitHub-only QA; fix test issues if any, then review controlled disposable browser acceptance with owner. Preserve 11-tab site and 12th Discussions feature flag; don't touch Finance/Netlify/production.


**Disclosure Desk website remains the current owner priority; Finance is paused.** Live v2 witness Edge CORS header and code parity are confirmed, so focus on real-account acceptance of witness POST/delete, comment edit/delete, Research document trash/restore, unique public aliases and mobile menu before a consolidated beta. Read-only SQL privilege audit identified 10 tables with excess TRUNCATE/TRIGGER grants; only a rollback-only review candidate and GitHub contract tests exist—**nothing has been revoked**. Follow current Section 4A queue without redeploying Edge or publishing to Netlify.


**Immediate priority now Disclosure Desk, NOT Finance:** Owner paused Finance Centre and asked to continue website roadmap. Branch `feature/sources-archives-next-batch-nov03`; current docs/privilege review CI green 41756880146. Continue Section 4A in an unpublished batch. First check real JWT/HTTP test coverage and staging-only workflows for owner witness Delete, comment Edit/Delete and Research cloud trash/restore, plus duplicate-username message; DO NOT touch live reports or owner research without explicit confirmation. Witness Edge CORS `x-client-info` + OPTIONS-but-no-POST gap still requires phone test. Permission review candidate has NOT been applied to live Supabase. Then verify Sources & Archives, LIVE, mobile UX and planned Discussions/private Chat backend under existing feature flags. No Netlify builds or production merge.


**Next owner phone QA:** L2.1 2025/26 ALL = £15.00 fictional profit screenshot verified. In a fresh Samsung Internet session select 2026/27 with Disclosure Desk (£147.00), Our Cinema (£142.50), BDS shared (−£12.00) and optionally W.NE (£0); do not switch to ChatGPT between tests if possible because tab-hide locks view. Report numbers in chat; do not share token/private URL. Then separately observe ten-minute expiry.


**Finance current:** Android Samsung Internet tab-visibility auto-lock confirmed; to test dropdowns, remain in a fresh single browser session and check expected fictional totals before switching to chat. Browser-side lock does not establish server token revocation. Chrome remains unresolved; real money data not enabled.


**Finance L2.1 next:** Owner's real Samsung Internet screenshot VERIFIED unlocked 2026/27 all £277.50 synthetic profit and charts. Next ask them to select **2025/26 All products = £15**, then 2026/27 **Disclosure Desk = £147**, **Our Cinema = £142.50**, **BDS shared = −£12**, and press Lock now last. Only take screenshots with `127.0.0.1` no private `#token=` URL; no passphrase ever. Test automatic expiry separately. Chrome still user-reported broken.


**Immediate next QA:** With the phone's Samsung Internet browser and fictional-only vault, restart `python finance_local/dashboard.py` from `$HOME/bds-finance-l1`; *before* pressing Lock now, test 2026/27 all £277.50, 2025/26 all £15, 2026/27 Disclosure Desk £147, Our Cinema £142.50, BDS shared −£12. Click Lock now last. Avoid sharing initial private `#token` address. If Chrome still fails, gather only a screenshot of the page without any URL token or a Termux non-secret status message. No real data or bank passwords.


**Immediate phone QA:** End old server (`Ctrl+C`), download revised `BDS_Finance_L2_1_Android_Browser_Fix.zip`, extract from Downloads with `unzip -o` into `$HOME/bds-finance-l1`, then `python finance_local/dashboard.py`; enter existing vault passphrase only into Termux. Expected BDS navy/gold dashboard with fictional 2026/27 £277.50. Test year/product filters and Lock now once page appears. Do not screenshot URL with `#token`. If still black, review Termux printed status without sharing session key. Original vault and off-device Drive backup untouched.


**Next owner Samsung acceptance:** stop old dashboard via Ctrl+C, download `BDS_Finance_L2_1_Lock_and_Filters.zip`, `cd "$HOME/bds-finance-l1"`, `unzip -o "$HOME/storage/downloads/BDS_Finance_L2_1_Lock_and_Filters.zip"`, `python finance_local/dashboard.py`, passphrase only in Termux. Verify year 2025/26 £15, 2026/27 £277.50, Disclosure Desk £147, Our Cinema £142.50 and BDS shared −£12. Confirm countdown and **Lock now** clears ledger and exits server, don't screenshot URL/access key. GitHub CI run 41740238168 and source SHA `7e73c86799eb2c576be3e10a1eacd3fed5f2b72c` green. No real payments, HMRC estimates or external sync; only after owner acceptance plan L3 schema-reviewed CSV.


**Finance follow-up:** L2 private local browser UI is owner-confirmed displayed well. Next on-phone filter + 10-minute timeout/lock tests using fictional data, check local server stops when Termux closes; user-confirm encrypted Drive upload but not recovery. Only after security and provider-parser acceptance implement L3 opt-in CSV imports, never real data in tests/GitHub.

**BDS Finance L2 next acceptance:** CI GREEN run `41736247141`, source `dfffb15428af973a2a39eb3002b388b3c4efea84`. Give owner the L2 ZIP (new `dashboard.py` and README only); in existing Termux test folder run `cd "$HOME/bds-finance-l1" && unzip -n "$HOME/storage/downloads/BDS_Finance_L2_Private_Dashboard.zip" && python finance_local/dashboard.py`. Enter private vault passphrase in Termux, verify Chrome fictional £337 income/£277.50 profit and product filter. Session bearer URL is secret; never ask owner to screenshot/forward it. Ctrl+C ends server. No real data until security review.



**Finance L1 after on-phone recovery success:** do **NOT** repeat the restore against the real default HOME, and do not delete either vault. Safely copy `$HOME/bds-finance-sample-backup.bds` ciphertext to a distinct path under `$HOME/storage/downloads/` (if storage permission already granted), then `sha256sum` both files and compare; owner manually puts encrypted file onto a separate USB-C drive or personal cloud and verifies access. An on-device Downloads copy alone is **not** an off-device backup. Once completed, mark L1 off-device recovery/backup gate separately; L2 private local dashboard can be prototyped with fictional-only data. No Netlify, Supabase, provider API or tax change.

**L1 phone backup update (2026-11-03 22:31 UK):** encrypted backup **CREATED and VERIFIED ON SAMSUNG**, with all 10 fictional records authenticated from the backup. **No restore has been performed.** Next test must use `finance_local.vault.restore` targeting a new `~/.bds-finance-restore-test` directory, not the active `.bds-finance`. Verify 2026/27 £277.50 imaginary profit after restore; keep original vault intact and avoid exposing any passphrase. Off-device encrypted backup still required for loss recovery.



**L1 phone acceptance update (3 Nov 2026, 22:28 UK):** init, demo-fill and summary are VERIFIED ON SAMSUNG with fictional £277.50 profit. Next test: `python finance_local/vault.py backup "$HOME/bds-finance-sample-backup.bds"` and `python finance_local/vault.py verify-backup "$HOME/bds-finance-sample-backup.bds"`; never delete the existing vault. Recovery to a separate directory and off-device encrypted copy still pending.


**Next: owner Samsung test** with corrected `BDS_Finance_Termux_L1_Android_fix.zip` from conversation/GitHub; `cd "$HOME/bds-finance-l1"`, `unzip -o "$HOME/storage/downloads/BDS_Finance_Termux_L1_Android_fix.zip"`, `python finance_local/vault.py init`, enter passphrase (do not share). Prior `os.link` exception preceded successful vault creation, so safe to retry without deleting; if any `vault.bds` exists, stop and inspect first. Then fictional `demo-fill`, `summary --year 2026/27`, encrypted backup/recovery drills.

**Finance L1 active gate:** confirm GitHub-only workflow `validate-bds-finance-termux-l1.yml` passed, verify documented source/demo ZIP SHA against local tested package, then let owner test encrypted **fictional** vault and backup on Samsung in existing Termux without disturbing other projects. Record actual on-device observations before L1 SAMSUNG VERIFIED; move to L2 local dashboard only once vault/recovery is accepted.

**Finance next milestone:** Build a tested Termux-compatible local encrypted vault L1 using fictional data only, portable backup/restore, lock/unlock and wrong-passphrase tests, and no open ports; then L2 an authenticated localhost interface if necessary. Do not load any financial credentials or perform actual online sync until approval and physical phone testing.


**Finance F2 follow-up after verified isolated SQL (not a site-release blocker):** Pick an affordable standalone private owner portal/storage route mindful of existing Supabase free-project limits; test actual owner MFA, backup/restore and user isolation with synthetic data before adding real-money ledger. No deployment or provider approval implied by GitHub Actions.

**Finance F1 next step:** GitHub CI **SUCCESS** run `41721383656` at `d6106c975fddacf5081bc30ae80029fafa91cdae`; owner can download and manually test single HTML demo from unpublished GitHub branch. For F2, first security architecture/owner-only backend/recovery plan with separate private endpoint; no real financial data, tokens or tax owed calculations until that boundary is proven. Keep current Disclosure Desk website QA moving.

**Finance next action:** F1 standalone synthetic-data offline ledger, with backups/exports and real data entry disabled pending privacy/security requirements; optional owner info for start date, PAYE and expenses when estimating real tax. Do not change existing PAYE or tax history assumptions, and do not imply sole trader equals a Companies House company.

**Parallel finance roadmap:** Before real data, confirm business legal form (sole trader/company), whether BDS income across all apps should be combined, and optional annual PAYE context. If approved, build F1 synthetic local prototype, not public release. Continue existing Disclosure Desk QA/repair queue independently.

1. Read **this master file** plus any specific linked QA record needed for the imminent milestone; fetch GitHub's **actual** `production`, `feature/sources-archives-next-batch-nov03` and Android candidate heads and compare them before coding.
2. Continue the **current unpublished website QA/repair queue** from Section 4A, starting with code audit of deletion/edit permissions and Research Hub collapsing plus the latest reported witness/mobile issue. Do not duplicate existing feature implementations.
3. Work in an unpublished branch, run targeted tests and verify no Netlify/public deploy. At each completed milestone, **edit this master file in the same milestone**, including exact SHA, tests and blocker status.
4. Only after the website roadmap and cohesive QA/release are approved, reconcile and prepare Android for Play internal testing; never skip website-to-Android parity verification.

## 9. Milestone log — REQUIRED after *every* milestone

### 2026-11-05 — Two-project private-alpha backup system prepared (no live run)
- Matched Cinema to its own Supabase project via eight `cinema_*` RLS tables; read-only aggregate data: 3 Auth accounts, 86 films, 1 profile, 0 Storage objects. No personal records read.
- Created matched Google Drive folders `Our Cinema — Encrypted Backups / Nov 2026 / 05 Nov 2026` (Disclosure Desk folder already existed). Parent backup folders are separately private; no archives uploaded.
- Produced conversation ZIP with shared dual-project runner, local tests **9/9 PASS**, no credentials or schedule, no public repo source code. Security: real privileged runner requires dedicated private repo; month/day London folders + UTC filename, encrypted archives and independent remote integrity check planned in code.
- This is a **prepared alpha**, NOT a working unattended backup. Next: private executor setup, live first backup and restore drill, then enable schedules and email reports. Details `docs/BDS_MULTI_APP_BACKUP_HANDOVER_2026-11-05.md`.

### 2026-11-05 — Actual production-database compatible, fully rolled-back SQL rehearsals
- Owner explicitly authorised using existing test-heavy Disclosure Desk backend for checks, stating no important user data yet. Inspected counts only, not user data content: 3 Auth, 3 boards, 7 docs, 1 moderator membership, 1 Storage object.
- Both unchanged, unapplied candidate files successfully executed inside **short lock-bounded transactions ending in ROLLBACK** on the correct Supabase project. Asserts: 5/5 Chat and 8/8 Forum new tables, all RLS enabled. No candidate schema installed persistently.
- After separate connection: zero candidate Chat/Forum tables or functions, new chat opt-in column absent; existing record counts unchanged. Organization Free; neither manual dump nor usable Storage recovery snapshot exists as verified evidence.
- Detailed audit `docs/LIVE_SUPABASE_TRANSACTION_REHEARSAL_2026-11-05.md`; next recoverable backup and host config before any persistent migration or social activation.

### 2026-11-05 — Single strict public package and real link validation CI GREEN
- Reused already-passing original public website packager `scripts/build_public_release.cjs` rather than keeping a competing second builder; removed temporary redundant `scripts/build-public-release.cjs`, `scripts/test-public-release-bundle.cjs`, and `validate-public-release-bundle.yml`.
- Hardened the existing builder with exact 19 asset + 18 Research file allowlists (in addition to existing 10 root, eight data, one research/data) and actual HTML/link + JSON dependency checks in `scripts/test_public_release_package.cjs`.
- Test scanner originally mistook legacy CSS selectors inside JS for actual file links; fixed scanner to exclude script/style bodies. It subsequently identified real missing favicon on `sources.html` and outdated `research/wne.html` Library destination; corrected these to existing sources. Existing 11-tab/Research features preserved. The previously green `pages.yml` safe artifact uploader was retained.
- Extended public package QA triggers to all served root pages, not only `index.html` and web folders.
- Final **public-only package GitHub run 42038409387 SUCCESS** (56 approved files / 13,294,515 bytes, 46 static references verified); **full staging run 42038407552 SUCCESS** at `ca45f60f44749f64351fc7a1a9c176b74f6a3cdd`. No Netlify or public site publish.
- Backup evidence still UNVERIFIED: Supabase scheduled/logical DB recovery and separate Storage objects must be checked before release. Real Supabase A/B and Samsung pending. No SQL, original W.NE, Finance or other project changes.

### 2026-11-05 — Release exposure-prevention, backup and rollback preflight completed
- Canonical repo/branch; production baseline `9755fba9`, development source `cdd2b1b` compared (135 ahead, 0 behind, 108 changed files, including unrelated Finance local material).
- Found `.github/workflows/pages.yml` still used `path: .`. Staged an explicit allowlisted static site builder and public-only Pages upload. This modifies **only unpublished branch**, not live Pages/Netlify setup.
- Public package verified by [CI 42029678884](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42029678884): 56 web files, 13,294,501 uncompressed bytes, SHA-256 manifests, Finance/SQL/internal docs excluded; full staging [42029678872](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42029678872) also green. Initial build failed on known nested research/data; fixed, then green. No public deploy.
- Supabase read-only: 22 public RLS tables, 0 `dd_chat_*`, 0 `dd_forum_*`, 1 Storage bucket, migration metadata inspected. **No backup status verification or dump** possible with connected tools. Need real backup evidence and separate Storage recovery, Netlify environment/publish checks, migration approval and actual Auth/Samsung acceptance.
- Audit details `docs/RELEASE_BACKUP_ROLLBACK_AUDIT_2026-11-05.md`. No production, database, user data, Netlify, Finance, Android or original W.NE writes.

### 2026-11-05 — Browser QA extended from 12 to 18 checks: landscape, first visit and editor save gate GREEN
- Source change `3c1a9f79df3783b82715020bb94a265aec5d030a`, GitHub Chromium workflow **42027694804 SUCCESS 18/18**, existing staging QA **42027694930 SUCCESS**.
- New real Chrome coverage: 852×393 landscape nav and modal fit; fresh browser first-visit welcome opens and Escape dismisses; actual W.NE editor page with synthetic authenticated stub verifies unconfirmed save hook blocks exit and a simulated confirmed save permits correct main-site return.
- First browser run's sandboxed-frame `localStorage` exception originated in our test's `page.addInitScript`, not established as a website defect; guard now runs only for the top frame. New run logged no corresponding exception.
- Still not a physical Samsung Internet or real Supabase Auth/backend save roundtrip. All live features, personal data, deployments, original writer and Netlify unchanged. Continue towards one deliberate reversible beta when approved.

### 2026-11-05 — Chromium mobile viewport navigational acceptance passed, 12/12
- Source/test/workflow batch `cf029b1e566c12355db00716a2a60ef541527b00`, branch `feature/sources-archives-next-batch-nov03`; `scripts/test_browser_release_smoke.cjs` uses real headless Chrome and 393×852 mobile emulation.
- No-deploy GitHub Actions **42027132774 SUCCESS 12/12** plus existing full staging QA **42027132653 SUCCESS**. Real keyboard Escape in full guided tour, real page tab changes/ARIA, OFF 12th tab, deep links and guest W.NE navigation were verified against local site.
- Screenshots/JSON in GitHub workflow artifact `disclosure-desk-chromium-smoke`. A `localStorage` denied-access page exception was logged under offline testing; investigate before claiming clean console.
- Real Samsung, physical touch/rotation, authenticated W.NE editor, external video/map content and real Supabase Auth remain pending; no live deploy or backend/user data mutations. Next focus real browser landscape, welcome, W.NE save gate and eventual phone QA.

### 2026-11-05 — New isolated HTTP/JWT backend role tests: 55/55 PASS
- Separate GitHub-only workflows: `.github/workflows/validate-private-chat-http-isolated.yml` and `.github/workflows/validate-discussions-http-isolated.yml`, each spins up a new throwaway Postgres 17/PostgREST 16.5 service, fictional users and disposable signed JWTs. No real Supabase keys or customer data used.
- Private Chat commits `6ad42d5`, harness fix `1f519c6`; final CI **42025369219 SUCCESS (22/22)**. Initial `42025227462` failed on local test helper GET/POST, not schema code.
- Discussions commits `d8596ce`, harness assertion fix `b442436`; final CI **42025810582 SUCCESS (33/33)**. Initial `42025653542` needed to accept the server's legitimate JSON `false` refusal for unauthorised edit rather than expecting a 4xx.
- Evidence file `docs/COMMUNITY_SIGNED_HTTP_QA_2026-11-05.md`. Real device and real Supabase Auth sessions remain untested; no backend deployment or approved production release. Owner conditionally allowed a live-site HTTP-test deploy if easier, but independent HTTP succeeded without it.
- Next: real browser/Samsung user acceptance and one coordinated backend+site beta only after reviewing SQL, deployment and rollback. Retain disabled Chat/Discussions and all production data.

### 2026-11-05 — Gated 12-tab Research dock parity and safe website return CI GREEN
- Website canonical unpublished branch, implementation commit `bbb6a921859c96de94167b3f1dc66a632a1617c5`, predecessor `25ce33ee447c60e56233cc2dae4069206186d3ab`.
- Reviewed existing 11-tab Research dock/save guard and website deep-link before coding. Added shared feature config in 7 Research HTML screens, conditional Discussions tab after Witness only when feature-approved, and guarded deferred website deep link. No permanent twelfth tab or changed order for published users.
- Added `scripts/test_wne_discussions_nav.cjs`, updated existing Discussions static regression and GitHub-only workflow. Tests both flag states, save-denial, confirmed save and return URL. **GitHub Actions 42013369188 SUCCESS** including new step.
- No live Supabase table migration, Chat/Discussions activation, Netlify/build, production/Android release, real account tests, original W.NE/Finance changes. Next real Samsung and synthetic-user isolated backend HTTP/JWT acceptance after approval.

### 2026-11-05 — Forum account-switch stale stewardship fix, actual frontend runtime CI GREEN
- Source `assets/community-discussions.js` changed commit `75371a269fd1da46a809f9c5899187608ef93af3`; new `scripts/test_discussions_account_switch_runtime.cjs` commit `782fca7837c0d9df98a3c3d1ce9e33b8872d7678`; QA workflow commit `6b17aed76a6aacc5c6e5516248eb7532a493b108`.
- No-duplicate test checks actual source with synthetic A steward → B non-steward while A thread fetch is pending; A controls/data must disappear, same B token refresh must preserve view, and pending vote after logout must not execute.
- Test ran locally in an isolated JS harness, then GitHub-only `42011490087` **SUCCESS**; existing isolated SQL tests were not rerun needlessly as standalone work.
- No public discussions enabled, live forum tables added, Supabase writes, Netlify build, website/Android release or real account action. Next: isolated real JWT browser checks and separately approved backend activation.

### 2026-11-05 — Private Chat delayed-response account isolation runtime CI GREEN
- New `scripts/test_private_chat_account_switch_runtime.cjs` source commits `2ffee36d0c5d151333366ce89a032a66f1fcbf41`, `e681211114d23ec85cce87f622f31faebf32f8de`; existing GitHub staging workflow wired in `cb9cdfbc5d307273b9921323d1abcd4fb81fc067`.
- Checked existing private Chat UI contract and detached PostgreSQL tests first. Tested actual disabled chat component with fabricated A→B session, in-flight A history, B safe text rendering, pending no-composer and guest signout; no application code change needed.
- Local synthetic pass plus GitHub-only `42010786518` **SUCCESS**. Backend still not deployed, no real HTTP/Samsung acceptance. No records/accounts/network writes or Netlify release.

### 2026-11-05 — Canonical source located; LIVE/chat/Discussions release gates reconciled
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; baseline `f4c5f0bb04102166f9e9b0117ca75029b0a98ef0`.
- GitHub source, 11-tab website UI, committed SQL candidates, latest workflow runs and Supabase live metadata/policies were read directly. Old archived website branches were not used for implementation.
- New standalone audit `docs/COMMUNITY_LAUNCH_READINESS_2026-11-05.md` commit `737551c5a631dfd40997ed6daa446425ee4b612c`; this entry is the matching authoritative master update.
- Verified CI: full site `41810147045` SUCCESS; private chat isolated `41711107391` SUCCESS; forum isolated `41692441123` SUCCESS; LIVE transitions/replay `41802115449` and `41802463605` SUCCESS.
- Live Supabase: existing community/LIVE RLS functions present; no private `dd_chat_*` or `dd_forum_*` tables; no populated LIVE events/messages. Flags `privateChat:false` and `discussions:false` intentionally preserved.
- No database writes, tests with actual customers, domain/Netlify staging build, public release, Android build or changes to other products. No Phone/browser acceptance claimed.
- Next: synthetic account staging with strict RLS/per-person rights, then owner-approved consolidated beta/phone acceptance and separately authorised backend rollout. Keep source/test status distinct from production readiness.

### 2026-11-04 — Full-site tour and mobile dock accessibility tested on source, CI GREEN
- Code on unpublished `feature/sources-archives-next-batch-nov03`, source commit `757e054872b583fe225eb2f3146929bb0faa618d`; updated assertion commit `4aba1a7da3ec12a740faae3b048a46e4eb468624`, **GitHub Actions 41809892108 SUCCESS**. Production head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` untouched.
- 11 tabs unchanged, 30 targeted tour steps verified; first-visit and tour native modal, Escape/back/close original-tab + keyboard focus restoration, current tab aria-current, auto-scroll dock and 44px tour buttons passed static and network-free VM tests. Old test initially expected nonmodal welcome branch, corrected it and reran all staging checks green.
- Browser/Samsung acceptance is NOT yet done, nor comprehensive TalkBack/accessibility/landscape. No Netlify, Supabase migrations, user records, W.NE originals, Cinema or Finance touched.



### 2026-11-04 — Tour and mobile navigation accessibility correction staged, device QA pending
- Repo `boydamo84-coder/disclosure-desk-preview`, correct dev `feature/sources-archives-next-batch-nov03` prior head `4d749bdf5df9edc9e8d475510745d168f7e3d360`, live `production` `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` untouched. Real index tour contains 10 full steps plus 7/4/4/5 focused = 30; target IDs/classes exist. Fixed nonmodal walk-through and origin page loss and first-visit keyboard trap, 44px tap controls, modal accessibility labels, nav selected aria-current and horizontal reveal. W.NE original and finance untouched.
- New `scripts/test_mobile_tour_a11y.cjs` VM/static check integrated with existing `scripts/test_guided_tour_2026.cjs` in staging QA; `docs/TOUR_MOBILE_ACCESSIBILITY_QA_2026-11-04.md` documents true verification boundaries. No actual Android/browser or live website tests yet. CI expected on commit.



### 2026-11-04 — LIVE timing and guest archived replay synthetic QA both GREEN
- `assets/live-schedule.js` timing update in source commit `a5dd5bc2ba2e3780b6d1552f2c99405cd9c2a637` passed GitHub-only run **41802115449** (including existing LIVE schedule and archive tests, no network). Opens T−45, disposes at approved end or T+4h, no video card replacement.
- `scripts/test_live_chat_archive_runtime.cjs` synthetic fake DOM/Supabase guest transcript of 60+1 fictional approved messages passed GitHub-only run **41802463605** in code commit `4ae869d19b6b58146b13f4220699f02ce71fb7ef`: archived replay remains after LIVE-only cleanup; next-page load works; guests cannot post or see account identifiers. No live chat messages/real witness or account records touched.
- Development `feature/sources-archives-next-batch-nov03`; production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` remains unchanged. This is NOT SAMSUNG VERIFIED or LIVE RELEASED. Continue tour/UX preview and controlled account acceptance before one combined release.



### 2026-11-04 — Synthetic saved LIVE chat replay runtime harness prepared
- Following successful approved LIVE window timer test (CI 41802115449), staged runtime evaluation of unchanged actual LIVE chat UI with mock Supabase public transcript, 60 first-page + 1 earlier synthetic messages, guest read-only state and independent active LIVE room. The test checks five-minute LIVE-only cleanup does not dispose archived chat and older replay remains readable.
- Code purely client test under GitHub-only workflow. No real approved hearing added, no chat rows inserted, no guest login, Netlify/production/Supabase/public website changes. Source parent a5dd5bc2ba2e3780b6d1552f2c99405cd9c2a637, production 9755fba9a5116c0cce6ac433ea022a6e5bfadd15 unchanged; CI pending at commit.



### 2026-11-04 — LIVE hearing-room opening/closing timeline defect patched in staged code
- Existing per-second hearing clock did not update whether chat was mounted; static render and five-minute unchanged-card skip meant T−45 could pass without opening chat or an open room linger after end. Added chat sync to the already-running clock callback, no extra polling or event query costs; opens once and disposes once without replacing the verified-source hearing card/stream.
- Synthetic fake DOM/time tests verify T−46, T−44, T−39 and T+4h, preserving card identity and no duplicate mounts; CI pending. Current source branch `feature/sources-archives-next-batch-nov03`, source previous head `b46e32435da796dcd6ec00d7cdf81b9ca6ccc64a` and production baseline `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` unchanged.
- No real event publication, no backend/RLS/Netlify, live account data, original W.NE, Our Cinema or paused private Finance changes. Only code-staged/CI after checks; actual browser and hearing test remain unverified.



### 2026-11-04 — Hub and username synthetic account isolation runtime QA green
- Repo `boydamo84-coder/disclosure-desk-preview`, development `feature/sources-archives-next-batch-nov03`, current tested head `3d5edcbf90c668d7a253be1fa03938569964df0c`, production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` unchanged. Hub test code committed `330d0580344b77fafb8b553dadb799f8a31b5b35`; **Actions 41800473669 SUCCESS**.
- Username form race fix committed `a935660ea9d21a1a088423093c5a0386ec9f6f61`: prevents account A's stale username form saving to B; privacy opt-in cleared when signed out; duplicate name user message retained. Initial Node test failed because its mock DOM did not search nested submit button; fixed test harness only in `3d5edcbf90c668d7a253be1fa03938569964df0c`. **Actions 41801094736 SUCCESS** with all staging checks. Live database unique-name index unchanged.
- No actual registered-user HTTP, new/deleted witness reports, comments, private documents, Supabase migration, Netlify build, public 12th tab or Android release. Next on owner approval: account A/B fake disposable browser QA and cleanup, then LIVE/community/backend regression review.



### 2026-11-04 — Username stale-session safety fix staged
- Code inspected on feature/sources-archives-next-batch-nov03 after first owner action simulation PASS (CI 41800473669). Old public-profiles save() might use newly authenticated account B after account A form remained open, accidentally saving stale A field into B's row. Database RLS would still limit updates to B, but not stop inappropriate cross-account input copy.
- Added expected owner and revision checks before owner-only upsert, reject/ignore stale responses, clear chat opt-in on guest, and synthetic test of fake A→B form change/duplicate alias/retry. No user names or live database changed. Expected future CI and owner Samsung tests remain.



### 2026-11-04 — Owner-action A/B synthetic runtime test prepared, approval for live tests pending
- Source branch feature/sources-archives-next-batch-nov03, parent 6c038ea1d5abe643ed96727392b51da969af7d1b; production 9755fba9a5116c0cce6ac433ea022a6e5bfadd15 untouched. `assets/research-hub.js` was not changed. Added VM fake-DOM/Supabase runtime test for stale A->B witness delete, cancel guard, B-only report deletion predicates, comment editing RPC, document trash RPC; no external network or real identity.
- Read-only inspected live definitions of comment/document owner-only SECURITY DEFINER RPCs and witness owner RLS. All human destructive tests are explicitly pending consent, per `docs/MEMBER_ACTION_ACCEPTANCE_2026-11-04.md`.
- No Supabase writes, Netlify, production deployment, finance data or source changes to original W.NE/Cinema. Next check CI outcome and only then mark simulated controls green.



### 2026-11-04 — Witness Edge v2 CORS/JWT static parity verification and no-deploy test green
- Inspected the actual Disclosure Desk Edge Function (project `omqxizswzcwgzqaczlhe`) through connected Supabase read-only metadata/content. `dd-witness-submit` status ACTIVE v2, `verify_jwt=true`, deployed source equal to unpublished GitHub `supabase/functions/dd-witness-submit/index.ts` byte-for-byte. Confirmed OPTIONS allows `authorization, x-client-info, apikey, content-type` and `POST, OPTIONS`; Origin allowlist and signed-in JWT body guard present.
- Added static assertions to `scripts/test_witness_community.cjs` and enabled them in `.github/workflows/validate-sources-directory-staged.yml`; updated `docs/BETA_FEEDBACK_FIXES_2026-11-03.md` with precise status. Code commit `3a7aba5048a32db25348257a892bef410741e377`; GitHub no-deploy QA `41757257629` SUCCESS; documentation HEAD is this next commit. Live website `production` remained `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` at last check.
- No Supabase writes, JWT credential request, witness submission, delete, Netlify publish or external provider operation was performed. CORS code parity != mobile end-to-end acceptance. Next: user-authorised disposable registered test report and owner deletion, comment/document CRUD testing and reviewed permission migration.



### 2026-11-04 ~01:50 UK — Disclosure Desk roadmap resumed; pre-release least-privilege read-only audit and staged review CI green
- Owner explicitly requested pausing Finance and returning to Disclosure Desk. No further finance work performed; its unfinished year/product/expiry QA is parked.
- Inspected actual Disclosure Desk Supabase project `omqxizswzcwgzqaczlhe` via read-only catalog queries only, no user records or DDL. All 22 public base tables report RLS enabled. Ten public tables have client-role TRUNCATE/TRIGGER grants; four `anon`+`authenticated`, six `authenticated`. Separate direct `service_role` and `postgres` ACLs verified. Postgres TRUNCATE bypasses RLS, though no website Data API SQL/TRUNCATE path demonstrated. Preserve nuanced severity.
- Confirmed `dd_witness_reports` authenticated SELECT/DELETE owner RLS, comment edit/delete and research trash/restore/purge RPCs authenticated-only and referencing uid/owner checks; `dd_public_names_unique_key` unique index exists. Server JWT/phone end-to-end remains untested.
- Staged `supabase/COMMUNITY_EXTRA_PRIVILEGES_REVIEW.sql` with explicit ten-table TRUNCATE/TRIGGER revoke in a lock/time-bounded BEGIN/ROLLBACK review; never applied anywhere. Static test `scripts/test_community_privilege_review.cjs` and audit document `docs/COMMUNITY_ROLE_PRIVILEGE_AUDIT_2026-11-04.md`; no-deploy GitHub Actions step added. Code milestone `872083e5f1f2bd79fbb9f7874a913b701153c6fb`, docs correction `0597d6bc379dcbf7ae06ff3f200f6b84809994ae`; staging QA run `41756880146` SUCCESS. Resulting handover SHA from this milestone needs to be checked; live production remained `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`.
- No Supabase writes, no Netlify, no published website changes and no original W.NE, Finance or Cinema data edits. Next: staged account-scoped HTTP acceptance/owner testing, batch UX and source provenance checks, then explicit launch approval.


### 2026-11-04 01:00 UK — L2.1 Samsung Internet 2025/26 filter success
- Screenshot visually proves year selection `2025/26` and `All BDS products`; income £15, costs £0, fictional trading profit £15, income Ko-fi £15, all other accounting rows £0. This is correct for 2026-04-05 fictitious entry and confirms functional filtering on real Samsung.
- Countdown shows `Auto-lock in 09:29`; this is visual countdown only, not a completed ten-minute timeout/invalidated-token drill. Switch-away browser privacy lock separately owner confirmed earlier.
- Remaining in device QA: 2026/27 per-product filters (Disclosure Desk £147, Our Cinema £142.50, BDS shared −£12), server expiry and Chrome compatibility. No real income. Development `feature/sources-archives-next-batch-nov03`, `production` unchanged; no live deployment.



### 2026-11-04 ~00:50 UK — L2.1 Samsung Internet auto-lock on browser switch verified by owner
- Owner reports dashboard locked immediately upon leaving Samsung Internet for ChatGPT after taking an unlocked screenshot. This matches source `visibilitychange` -> `showLocked` and local in-page DOM scrub. It does NOT prove network server was closed or its bearer revoked; that is a separate security acceptance. Ten-minute server expiry, cross-browser Chrome support, year/product dropdown changes remain unverified.
- Prior image confirms fictional sample income £337, costs £59.50 and profit £277.50 for 2026/27 all products; synthetic-only on phone, no real data, Netlify/Supabase, source launch or W.NE changes. Next test using single uninterrupted Samsung Internet session.



### 2026-11-04 00:50 UK — L2.1 real Samsung Internet screenshot verifies unlocked fictional default totals
- Screenshot displays authenticated local BDS navy/gold Finance Centre with dropdown selections `2026/27` and `All BDS products`, £337.00 simulated gross income, £59.50 combined refunds/fees/expenses, £277.50 fictional profit and transaction ledger of nine in-year rows. Provider income bars, accounting treatment bars and auto-lock countdown visibly rendered; no private URL token visible.
- This is SAMSUNG VERIFIED for visible unlocked default UI and figures only; changing dropdowns/automatic timeout, verified server revocation and Chrome compatibility remain open. Prior separate Samsung screenshot showed manual Lock now UI result.
- Repo `boydamo84-coder/disclosure-desk-preview`, unpublished `feature/sources-archives-next-batch-nov03`; production unchanged. Fictional-only data, no credentials, account sync, tax computation or live deployments. Next test other year/product filters, then lock.



### 2026-11-04 00:47 UK — Samsung Internet renders L2.1 and owner sees manual lock; Chrome still fails
- User: “Chrome didnt work but samsung browser worked”, screenshot shows BDS Finance Centre branded fictional-only shell at 127.0.0.1 with status “Locked by owner” and large “Finance Centre locked” panel. This is **SAMSUNG VERIFIED on Samsung Internet for visible shell/locked state**. Does not evidence unlocked profit figures, filter correctness or independent token-revocation audit, and Chrome remains unresolved.
- Relevant development source `finance_local/dashboard.py`; prior narrow root-GET 403 fix source SHA `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf`; 33 Python tests in CI run `41743244163` SUCCESS, site regression run `41743244182` SUCCESS. Development branch `feature/sources-archives-next-batch-nov03`; production stays `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`.
- Next tests: Samsung Internet filtered fictional totals, session countdown and Lock now after figures. Distinguish browser issue from vault/passphrase; no reinitialisation, vault deletion, public deploy, new financial integration, or private URL disclosure.


### 2026-11-03 23:49 UK — L2.1 Samsung Chrome GET-root 403, reproduced and fixed in unpublished code
- Owner screenshot: local URL black, tiny forbidden text, after two correct-passphrase attempts. Initial Termux Chrome intent can send `Sec-Fetch-Site: cross-site` to GET `/`; new L2.1 Fetch Metadata policy denied 403 before HTML could load. Reproduced using a real HTTP handler test; not an incorrect vault password.
- Patch permits only GET `/` static, unauthenticated shell from cross-site navigation. It does NOT permit cross-site `/api/ledger` or `/api/lock`; bearer, Host, Origin, short expiry, loopback and no-store remain mandatory. 33 local unit tests pass including these attack/compatibility cases. GitHub Finance matrix pending (run 41743244163) at documentation time.
- Repo `boydamo84-coder/disclosure-desk-preview`, branch `feature/sources-archives-next-batch-nov03`, patched code commit `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf`. Production head still `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`. New dashboard-only sample ZIP for Samsung; actual device retest pending; no Netlify, Supabase, W.NE, live or actual finance data touched.



### 2026-11-03 — L2.1 Finance private filter/Lock now checks complete in code, Android acceptance pending
- Repo `boydamo84-coder/disclosure-desk-preview` branch `feature/sources-archives-next-batch-nov03` source commit `7e73c86799eb2c576be3e10a1eacd3fed5f2b72c`, this handover's follow-up SHA is subsequent documentation commit. Live `production` `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` remains unchanged.
- Changed only `finance_local/dashboard.py`, `finance_local/tests/test_dashboard.py`, `finance_local/DASHBOARD_README.md`, GitHub-only QA workflow. Existing L1 AES-GCM vault/backups, original W.NE and Our Cinema repositories unmodified. GitHub Actions `41740238168` **SUCCESS** across Python 3.12 and 3.14 (32 tests per suite; full L1+L2), `41740238160` **SUCCESS** site regression.
- Local Python HTTP tests verified no-vault-write, bearer auth, Host/Origin/Sec-Fetch-Site enforcement, explicit POST /api/lock revocation, 10m deadline bound, synthetic tax-year/product totals and refusal of unauthorised requests. Mocked-HTTP headless Chromium 390px verified year/product dropdowns, countdown, Lock now and 3-second simulated timeout. **Not** an end-to-end live Android or network security audit.
- GitHub Actions sample ZIP artifact `BDS-Finance-L2-1-Samsung-Synthetic` from [run 41740238168](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41740238168); local ZIP `BDS_Finance_L2_1_Lock_and_Filters.zip` SHA-256 `1673e2d5b4776d8472eb7ab0f140375bdb2923f0562f97ecaf0c8232611691b1`. Contains dashboard.py + README only; no keys, real financial records or API connectors. Netlify was not called.
- Next: owner install/update existing private phone-only code, confirm filters/lock/expiry and vault intact. Genuine transactions/Ko-fi and Play CSV parsing, AdSense consent, tax calculations and Drive fresh-device recovery all require later explicit, separate acceptance.



### 2026-11-03 ~23:16 UK — L2 private Finance dashboard first Samsung viewing accepted
- Owner replied “Yes perfect” to direct question whether L2 Finance Centre dashboard displays nicely on Samsung. Record **SAMSUNG VERIFIED by user report for visible UI only**. No screenshot, measured real-world performance, browser security probe, filter/timeout acceptance or real financial information was supplied.
- Source `finance_local/dashboard.py`, `finance_local/DASHBOARD_README.md`, `finance_local/BDS_Finance_L2_Private_Dashboard.zip` on `boydamo84-coder/disclosure-desk-preview`, branch `feature/sources-archives-next-batch-nov03`, previously code-tested at `dfffb15428af973a2a39eb3002b388b3c4efea84`. GitHub Actions `41736247141` and site regression `41736247039` SUCCESS. Current documentation-only next commit HEAD should be rechecked.
- L1 encrypted sample vault backup/restore previously verified on Samsung; owner reports manually placing ciphertext copy on Google Drive. No independent Drive download/new-device recovery. No public server, Supabase, Netlify, payments/advertising account, production branch or original W.NE modification.
- Next: real-device L2 filters/session expiry/lock tests, independent Drive restore and further security review before L3 genuine data handling.


### 2026-11-03 — L2 phone dashboard code/test milestone GITHUB CI GREEN (browser/phone pending)
- Repo `boydamo84-coder/disclosure-desk-preview`, unpublished `feature/sources-archives-next-batch-nov03`. Source commit `dfffb15428af973a2a39eb3002b388b3c4efea84` passes Actions **41736247141** (Python 3.12 and 3.14, existing L1 vault + nine L2 synthetic HTTP security tests + ZIP byte-parity) and website **41736247039** success. Final documentation SHA is subsequent commit; verify branch head. Production at prior checked `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` unchanged.
- Added `finance_local/dashboard.py`, `finance_local/tests/test_dashboard.py`, `finance_local/DASHBOARD_README.md`, `finance_local/BDS_Finance_L2_Private_Dashboard.zip`; existing vault implementation and phone-only encrypted files not changed. Demo offline UI tested in headless Chromium mocked-data viewport only, not actual Samsung Chrome/Termux; fictional 2026/27 profit £277.50 expected.
- Owner says manual encrypted backup uploaded to Google Drive, but remote copy integrity/off-device restoration unverified. No payment provider credentials, donor data, real revenue, HMRC tax liability, live community site changes, Netlify deploy, Supabase migration or Play release.
- Next: actual Samsung unlock/UI/filters/expiry acceptance with private temporary session, then continue local-only security/recovery gates.



### 2026-11-03 22:36 UK — L1 Samsung encrypted recovery from independent test HOME verified
- Real phone screenshot: user restored existing 10-record fictional encrypted backup into `$HOME/bds-finance-restore-test/.bds-finance` by using temporary `HOME` override for the one command. Tool confirmed **no previous vault overwritten**. Separate test HOME summary `2026/27`: 9 in-year fictional records, £337 gross income, £19 refunds, £28.50 fees, £12 expenses; fictional profit £277.50. Original encrypted vault remains in normal `$HOME/.bds-finance` and no destruction was requested.
- Status: **SAMSUNG VERIFIED** init/demo/summary/encrypted backup/backup verification/isolated restore and recovered summary. Off-phone backup, copy integrity and recovery on a different device **NOT VERIFIED**. This is a synthetic security prototype, not audited handling of real financial records.
- Repo `boydamo84-coder/disclosure-desk-preview`, branch `feature/sources-archives-next-batch-nov03`; tested code `d073b5509341800be56b729590eb72c6cdbc712b`, GitHub 3.12/3.14 tests `41730679400` passed, previous documentation branch head `85a3dc4242909fee9af848f0e1f725dd171e5343`; new docs commit becomes latest HEAD. `production` unchanged at `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when checked.
- No finances, passphrases or device screenshot committed, no Netlify, Supabase, Play, live website or W.NE changes.
- Next: user-controlled ciphertext-only copy off device and verify same SHA-256. Keep L2 app synthetic-only until security and source connector approval.


### 2026-11-03 22:31 UK — L1 real-device encrypted backup/verify success, restore still pending
- Actual Samsung Termux screenshot: `python finance_local/vault.py backup "$HOME/bds-finance-sample-backup.bds"` succeeded with encrypted-only backup export confirmation, and `python finance_local/vault.py verify-backup "$HOME/bds-finance-sample-backup.bds"` confirmed **10 fictional records**. Encryption authentication check passed and command explicitly reported **"No restore performed."**
- Distinguish: **SAMSUNG VERIFIED backup creation + verification only**, after earlier Samsung init/entry/summary acceptance. Not yet independently restored, duplicated off-device or approved for real financial data.
- Corrected code source `d073b5509341800be56b729590eb72c6cdbc712b` (17 automated tests each on Python 3.12 and 3.14; GitHub Actions `41730679400` success); working branch `feature/sources-archives-next-batch-nov03`. The screenshot itself and the private vault/backup stay outside GitHub.
- Next: safe restored-copy test in a **new** private Termux folder using `vault.restore(new_root, backup, password)` and `vault.demo_summary`, never invoke CLI `restore` against active default `~/.bds-finance`. Next independent encrypted off-phone copy; no Netlify, production, live DB or Play changes.


### 2026-11-03 22:28 UK — Samsung L1 patched init and synthetic ledger verified
- Owner screenshot: updated ZIP extracted, hidden-passphrase `init` successful, `demo-fill` inserted ten fictional entries; 2026/27 summary has nine rows and £277.50 imaginary profit (£337.00 income, £19.00 refunds, £28.50 fees, £12.00 expenses). Initial `os.link` Android error no longer occurs on exercised path.
- Status: SAMSUNG VERIFIED for init/fill/summary only; BACKUP/VERIFY/RESTORE NOT YET PHONE-TESTED; no actual financial records, APIs, tax calculation or cloud release.
- Repo `boydamo84-coder/disclosure-desk-preview`, unpublished `feature/sources-archives-next-batch-nov03`; tested source `d073b5509341800be56b729590eb72c6cdbc712b`, CI run `41730679400` green, site regression `41730679360` green. Production unchanged.
- Next: encrypted backup to a new filename in Termux HOME and `verify-backup`; then isolated restore without touching the active vault. Do not record private passphrases or photos in GitHub.


### 2026-11-03 — Samsung L1 Python 3.14 missing os.link fixed and GitHub QA GREEN
- Branch `feature/sources-archives-next-batch-nov03` in `boydamo84-coder/disclosure-desk-preview`; code commit `d073b5509341800be56b729590eb72c6cdbc712b`, documentation handover next commit HEAD. Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` unchanged.
- Screenshot confirmed unhandled `os.link` on Termux Python 3.14 when initialising vault; initial user passphrase prompt worked, no completed vault creation. Replaced with O_EXCL reservation and os.replace, preserving existing-file no-overwrite and simulated failed-save safety.
- Files updated: `finance_local/vault.py`, `finance_local/tests/test_vault.py`, `finance_local/README.md`, `finance_local/BDS_Finance_Termux_L1_demo.zip`, new `finance_local/BDS_Finance_Termux_L1_Android_fix.zip`, SHA256SUMS, and dedicated GitHub-only CI matrix.
- Verified **17 automated tests on Python 3.12 and 3.14** by [run 41730679400](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41730679400) **SUCCESS**; source/site regression [run 41730679360](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41730679360) **SUCCESS**, ZIP checksum and source-byte parity checked. Corrected ZIP SHA-256 `b4b51143ad53487d82f2c6a0588ddac45fc22220df9fa76ac5b7a9bd07331422`.
- **Not yet verified:** Android actual patched run, phone backup/restore, real revenue, provider sync, tax calculator, or independent security audit. No Netlify build, Supabase DB changes, Play release or live deploy.


### 2026-11-03 — L1 final source/checksum branch CI verified; device acceptance pending
- Repo `boydamo84-coder/disclosure-desk-preview`, unpublished `feature/sources-archives-next-batch-nov03`; source SHA `aac857e4800c2c0b3cb659c2b3d000af4c14e26b`; resulting documentation SHA is the next HEAD, verify after update.
- **CI GREEN:** offline vault Python 3.12 14-unit suite [run 41727602097](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41727602097); parallel site regression [run 41727601922](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41727601922); both success.
- Git source `finance_local/vault.py`, tests and README now byte-parallel with `finance_local/BDS_Finance_Termux_L1_demo.zip`, checked with source SHA and ZIP SHA-256 `ba5f27427ab518df73c85108169723a1c571a1aed42900a2025944cc99c89977`. The full ZIP contents remain fictional only.
- No on-device Termux/Android package installation or recovery acceptance; no third-party accounts, genuine revenue, plaintext reports, cloud or network listeners. This is **CODE STAGED + CI GREEN, not SAMSUNG VERIFIED or LIVE**. Original website release baseline `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` remains unchanged; no Netlify credits used or live backend migrations.
- Next: owner tests demo package using existing Termux and 14-char+ passphrase; encrypted backup verify and recovery to isolated scratch before allowing any real data. Keep future L2 and providers disabled.


### 2026-11-03 — L1 encrypted vault GitHub CI GREEN, source/ZIP parity follow-up
- GitHub Actions run [41727300663](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41727300663) **SUCCESS** (14 synthetic CLI encryption/backup/recovery tests); website staging source run [41727300502](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41727300502) **SUCCESS**. Tested branch commit `fa26ec8cec96fb859aef6c0336d1d887a9ac4179`.
- ZIP `finance_local/BDS_Finance_Termux_L1_demo.zip` has SHA-256 `ba5f27427ab518df73c85108169723a1c571a1aed42900a2025944cc99c89977`, Git blob SHA `b26c82f2e3120936b222d5263fa4f9d311fa4e6f` matching local archive byte-for-byte. The source text files staged from an exported read had final newline removed; restoring byte parity plus adding checksums now. Retest latest commit after source/README/docs changes before marking final release stable.
- The code remains sample-only; no actual Termux/Samsung proof, real finance data, Supabase project, OAuth, Netlify build, public deploy or Play action.
- Next: GitHub CI recheck; owner install with existing Termux packages and test encrypted backup/restore with fictional data only.


### 2026-11-03 — Termux Finance L1 fictional encrypted vault, source and 14 local Linux tests
- Repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `9addf980284a871627632e0fd9b7a01956d3309c`; new combined code+documentation milestone HEAD is resulting commit (verify next read). Live `production` remains `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`.
- Files added: `finance_local/vault.py`, `finance_local/__init__.py`, `finance_local/tests/test_vault.py`, `finance_local/README.md`, `finance_local/.gitignore`, `finance_local/BDS_Finance_Termux_L1_demo.zip`, `.github/workflows/validate-bds-finance-termux-l1.yml`; this handover and Termux roadmap updated.
- Verification on isolated Linux container **14/14 unittest checks PASS**: AES-GCM confidentiality/tag, Scrypt, wrong passphrase, case-limited fictional dataset, idempotency, 6 Apr tax year, atomic interrupted save rollback, strong file modes/symlink rejection, backup/restore on separate temporary directories and no plaintext log. GitHub workflow pending for source commit; no Samsung runtime test.
- Bounds: **SYNTHETIC ONLY**. No local HTTP listener, cloud API, real account credentials, HMRC tax estimates, real money data, Netlify deploy, Supabase schema or Play release; original W.NE and Our Cinema unchanged. Backup reliability on external Android storage still requires phone acceptance.
- Next: observe GitHub CI; require on-device user-led synthetic backup/restoration drill with new strong passphrase, then L2 protected offline dashboard.


### 2026-11-03 — Local-first Finance Centre design CI verified (no backend)
- Repo `boydamo84-coder/disclosure-desk-preview`, branch `feature/sources-archives-next-batch-nov03`, tested source SHA `98ec9c88f8673b40afb27804ebe09afbe8b70e24`, handover-update commit is next branch HEAD.
- GitHub Actions `41724910278` **SUCCESS**, including existing site staging QA and `scripts/test_bds_finance_local_first_docs.cjs`. Earlier `41724778280` failed solely on two test-text mismatches and was fixed at source SHA above. No live site, browser, phone, finance security or API integration validation was performed.
- New `docs/BDS_FINANCE_TERMUX_LOCAL_FIRST_2026-11-03.md` and roadmap distinguish manual full Ko-fi CSV history from webhook push, AdSense local installed-app OAuth, Play CSV/Cloud Storage and optional online Sync from encrypted phone-only data storage. Earlier disposable PostgreSQL RLS test still green historically but is not the selected live deployment path.
- `production` remains `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`; no Netlify/production/Supabase payment changes, no real owner financial information and no data collection, no original W.NE/Our Cinema changes.
- Next: L1 encrypted local vault proof, synthetic records only, separately verified backup recovery and Termux package compatibility; physical Samsung acceptance prior to real income.


### 2026-11-03 — Finance Centre local-first Termux architecture chosen for next prototype
- Working repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`, previous SHA `2aa97a252b1576665bf2015b9dcdaac1f40655a3`; new documentation commit is the resulting branch HEAD (inspect GitHub). Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` unchanged.
- Owner suggested phone-only Finance Centre with Termux collecting earnings. Confirmed feasible as **offline storage + online on-demand pull/manual import**, not perpetual offline live sync. Full Ko-fi CSV available and documented webhooks only push; AdSense OAuth installed-app workflow; Google Play download/Cloud Storage financial reports. No third-party financial API access performed.
- New `docs/BDS_FINANCE_TERMUX_LOCAL_FIRST_2026-11-03.md`, revised `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md`, this handover and staging-only documentation regression test. Previous isolated PostgreSQL F2 CI GREEN remains historical, uninstalled and optional rather than a requirement for the new local-first approach.
- Security pending: actual tested vault encryption, key handling, Termux package compatibility, encrypted backups with restore drill, user-initiated internet permissions and carefully protected localhost or native UI. F1 fake-data HTML is NOT safe for actual revenue.
- No new Supabase project/SQL, Netlify deployment, personal data, credentials, live website, Play action, original W.NE or Our Cinema modification. Next L1 synthetic-only encrypted vault implementation.


### 2026-11-03 — BDS Finance F2 RLS candidate verified in disposable PostgreSQL
- Repository `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; code SHA `4a225e87c6c6de349e185c33a2d0c5a107dbc38d`. Documentation update is next GitHub branch HEAD; verify when committed.
- Changed: `finance-review/finance-f2-review.sql`, `finance-review/isolated-fixture.sql`, `finance-review/isolated-acceptance.sql`, `.github/workflows/validate-bds-finance-isolated.yml`, `docs/BDS_FINANCE_F2_SECURITY_2026-11-03.md`, updated Finance roadmap and this master. SQL is review-only outside migrations.
- Verification: GitHub Actions isolated PostgreSQL `41723430099` **SUCCESS**, source staging `41723429851` **SUCCESS**. Synthetic owner AAL2 allowed; unrelated authenticated user, guest, anonymously signed-in user and owner AAL1 blocked; no raw owner table access; append-only; unique receipt + revocation tested. No actual Supabase authentication, owner login, full RLS audit, private backup/recovery or Samsung/browser security testing yet.
- Public/live impact: none. No live Supabase SQL, service credentials, user data, Netlify build, public finance route, production branch change or Play upload. Production remained `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`.
- Next: confirm financially sustainable dedicated private account hosting (free project limits), provision only with owner approval, test MFA and protected API + encrypted backups using synthetic entries. Real financial records and payment connectors stay disabled.


### 2026-11-03 — BDS Finance F1 offline fictional ledger prototype, CI GREEN
- Repo `boydamo84-coder/disclosure-desk-preview`, branch `feature/sources-archives-next-batch-nov03`; feature source code commits `ed80b05c333ca923db2e20993f777db5ec4f5e20` (demo), `8a9a86f6572217aa8dc6bfd74ef9742fdfbb5dd3` (tests), `1bf4081d1bd0251cf2be4b01c16e37ac79c3ea13` (CI), `d0959f03e709aa8bf41bca0eb7b67260d65931c7` (duplicate conflict guard), `d6106c975fddacf5081bc30ae80029fafa91cdae` (test extension). The handover/roadmap/README commit is the resulting latest branch HEAD after this entry, verify with GitHub branch status.
- Verified automated GitHub-only Actions run `41721383656` **SUCCESS** at code SHA `d6106c975fddacf5081bc30ae80029fafa91cdae`; tested sample date/year boundary, revenue/profit, no estimate/payout duplication, fee/refund filters, JSON import idempotency/conflicts, invalid entries, CSV mitigation, offline-source constraints. No phone/browser rendering performed and no actual owner banking/tax data.
- Staged files: `docs/prototypes/bds-finance-demo.html`, `scripts/test_bds_finance_demo.cjs`, `.github/workflows/validate-sources-directory-staged.yml`, `docs/prototypes/README.md`, Finance roadmap and MASTER_HANDOVER. No live access control; prototype is only suitable for *fake examples*.
- Release/data: `production` unchanged at `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when checked, no Supabase backend changes, no Netlify staging or public deployment, no Android app signing/Play action, no real account connection, no effect on other BDS products.
- Next: let owner test prototype offline with fictional entries; F2 owner-only security architecture before accepting real income, then selective provider connections and an HMRC-reviewed tax estimator later. Make sure docs/prototypes HTML is excluded from future public build or published only as a harmless synthetic example.


### 2026-11-03 — Sole-trader classification confirmed for Finance Centre (F0 partially specified)
- Repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior head `34c817c5e6a08de17e0af9bb5cffec7ffdcdd8ee`; resulting SHA is the single two-file milestone commit HEAD; verify GitHub Actions and new head after update.
- Owner decision: sole trader now, limited company only as a possible later transition if profitable; preserve historical sole-trader records rather than reclassifying old receipts. UK HMRC official pages checked for Self Assessment gross-trading £1,000 criterion and NI employed/self-employed interactions.
- Changed `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md` and this handover only; no application code, provider credentials, accounts, payroll or customer financial records.
- Status: F0 partially defined; F1 synthetic local ledger unstarted; no Supabase migration, Netlify deployment/credits, public 11-tab website merge, Play release or modification to W.NE/Our Cinema.
- Next: keep current Disclosure Desk staged QA/repair roadmap moving; prototype local ledger and backup/import with sample transactions; request actual salary/tax inputs only through a future secured owner interface, never through Git.


### 2026-11-03 — Ko-fi static QA verified and BDS Finance Centre design staged (NO FINANCE BUILD)
- Repository/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`. Source Ko-fi build SHA `32974cbde4fe336bf81315fae87f6b8568448937`; Finance roadmap doc commit `137fb8164f30aa7f9fabb6cd43e06e094093568a`; master milestone commit `7cb7999b1a28014898aa979769801569af119ac7`. GitHub-only staging Actions run **41719213568 SUCCESS** at that SHA on 2026-11-03 (static source QA, not provider, tax, mobile or deployed finance testing).
- Verification: GitHub-only Actions https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41717709506 completed **SUCCESS**, verifying static source + Ko-fi destination; does NOT prove public Ko-fi checkout works. Official Ko-fi/Google/HMRC docs researched and requirements recorded in the new roadmap. Finance code does not exist; no test transactions or tax calculations performed.
- Changed: new `docs/BDS_FINANCE_CENTRE_ROADMAP_2026-11-03.md` + this handover. Existing 11-tab site/code, Android, Supabase accounts and user records unchanged. No production merge, Netlify staging build/deploy, payment tokens or Play publishing.
- Next: continue QA for staged Disclosure Desk source and functional phone/browser acceptance before any combined site deployment. Finance F0 awaits owner decision on legal form, annual PAYE-income input and private/offline preference; then F1 synthetic-only implementation with security review.


### 2026-11-03 — Connect owner-supplied Ko-fi profile to website Support links (unpublished)
- Previous branch SHA `251c117bd5cd7c6cd538140f56576d3f8b6be91e`; owner-provided creator URL **https://ko-fi.com/disclosuredesk**, matching the Ko-fi registration/payment connection they just completed. No invented handle or change to payment-provider account settings.
- Updated `assets/support-site.js` with exact URL; strict HTTPS ko-fi.com profile validator retained. Sticky mobile-safe gold header Support control beside Profile, About information card, and footer link now resolve to real owner-supplied Ko-fi profile in the next *approved* combined website release.
- Updated `scripts/test_support_site.cjs` with exact public link acceptance and `index.html` script query version for future cache invalidation. Still no embedded payments, no separate nav tab, no Supabase change, no immediate public deploy or Netlify credits.
- GitHub-only CI pending; Ko-fi page itself and payment completion should be confirmed using an actual browser by site owner before deployment.


### 2026-11-03 — Voluntary Ko-fi Support in sticky header, if verified account exists
- Branch `feature/sources-archives-next-batch-nov03`, preceding SHA `cb68e47fe659da0a7f04147e8656dbcbd774c83c`. Prior source QA workflow `41712744151` **SUCCESS** at `cb68e47fe659da0a7f04147e8656dbcbd774c83c` for previous optional-support/hosting docs.
- User approved a subtle always-visible `☕ Support` in header. Updated dormant `assets/support-site.js` to insert accessible Ko-fi header link directly before Profile shortcut, alongside optional About and footer links, **only when** a verified owner profile URL is configured. `index.html` styles match existing navy/gold palette, with mobile icon-only compact treatment. Expanded `scripts/test_support_site.cjs` for header and mobile.
- Ko-fi biography copy and shorter fallback saved in `docs/VOLUNTARY_SUPPORT_KOFI_2026-11-03.md`.
- **No Ko-fi account or verified payment URL exists; actual button hidden.** Source CI pending. No live Supabase, Netlify, Android, new tab or production release.



### 2026-11-03 — Media-cost planning and voluntary support setup instructions
- Branch feature/sources-archives-next-batch-nov03; preceding SHA 0ae7aec077fbfcee0d500a1c9314d6fd9c6a77c7. Added docs/COMMUNITY_MEDIA_COSTS_2026-11-03.md and docs/VOLUNTARY_SUPPORT_KOFI_2026-11-03.md, updated canonical Discussions, Profile Chat and historical satellite roadmaps. Planning and documentation only, no file upload code.
- User has not created Ko-fi account. Prior support code stays dormant with blank URL until owner-verified page link is supplied. Ko-fi Free 0% on one-off tips requires turning off Standard/Contributor mode; Stripe/PayPal fees remain.
- Media hosting: Imgur unavailable for UK visitors including embeds and prohibits commercial image hosting. Supabase free 1GB/5+5GB bandwidth and Cloudflare R2 10GB-month/no direct egress are candidate options, both quota-limited. Recommended tiny secure beta with EXIF removal, rate/file caps, owner delete and abuse checks; never send precise witness coordinates.
- Chat accepts native Unicode emoji text; actual GIF media and image attachments not implemented. Satellite nearest-acquisition image matching and true historical Map overlay/slider also unfinished. No Supabase/Netlify/production/Android changes.


### 2026-11-03 — Ko-fi dormant About and footer support links
- Branch feature/sources-archives-next-batch-nov03, prior SHA 8447aba1f8bb5ba3e9aec727d89b334f3655c8ef. Owner stated no Ko-fi account exists. No creator address is assumed.
- Added assets/support-site.js, scripts/test_support_site.cjs and index.html script load. Only a real owner-confirmed HTTPS Ko-fi creator profile URL activates support links in About and footer. Donations are entirely voluntary and external; no payment data is stored by the website.
- Ko-fi Free has 0% service fees on one-off tips ONLY when Contributor/Standard status is off; standard Stripe/PayPal fees apply. New accounts commonly start with 5% on tips until switched. Real account creation and payment-provider setup are still required by the owner.
- New static GitHub CI step added, pending result. No live Supabase, production site, Android or Netlify change.


### 2026-11-03 — 10-per-24-hour Chat request quota green in actual disposable database
- Commit `5381141b459b47d0377f6b9dda1de589dfd7a7a7`: isolated PostgreSQL 17 workflow `41711107391` **SUCCESS**, including exactly ten distinct outbound pending invitations in 24 hours and rejection of the eleventh, plus existing unauthorized access and consent checks. Static website workflow `41711107588` **SUCCESS**.
- No live database change, no enabled private messaging, no Netlify credits spent. `production` still `9755fba9a5116c0cce6ac433ea022a6e5bfadd15`. Follow-up still needs explicit backend approval + two-user phone/browser testing before release.



### 2026-11-03 — Private Chat invitations 10 per 24 hours (approved)
- Repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`. Previous SHA `1817397f04e88fd751631ef5195f454681a987cd`; new SHA current milestone commit.
- Changed UNAPPLIED `dd_chat_request` server cap to **10 new requests per rolling 24 hours per sender** (previously 5), with existing 30 accepted chat messages/10-minute cap unchanged. New requests count regardless of acceptance/decline.
- Updated Profile Chat invitation text and disposable PostgreSQL security test: exactly 10 distinct invitations permitted, 11th rejected; static SQL check rejects old five-request condition. CI pending.
- Private Chat remains feature-flagged OFF. No live Supabase SQL, Netlify deploy or Android changes.



### 2026-11-03 — Unread badge, real per-user read marker and rate-limit QA
- Repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; preceding commit `ba19ec4a387c9cea1e495d60d78d913734558ca9`; new branch HEAD this milestone.
- Prior real disposable PostgreSQL 17 Chat integration run **`41709436663` SUCCESS**; website source QA **`41709436631` SUCCESS**. Verified invitation consent, two-party isolation, preview acceptance, decline, block, owner-only selected reports, anon denial and direct-table ACL.
- Enhanced UNAPPLIED `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql` with separate `inviter_read_at`/`invitee_read_at`, private `dd_chat_mark_read(uuid,uuid)` validated against a real accepted-pair message, safe `unread_count` in participant-only pair list. Client unread labels and read markers after opening chat; pending-intro not shown twice. Extended disposable synthetic PostgreSQL tests to cover read-marker ownership, unread transitions, 5 invites/day and 30 messages/10 min.
- No real backend applied, privateChat remains disabled, no Netlify build/publish, no Android release, no real-account cross-device QA. New CI pending.



### 2026-11-03 — Isolated chat SQL correctly blocks Data API table read
- SHA before fix `7c98be683f9a9317ad0b560f549b575dc4e0d854`. GitHub static website CI `41709194184` **SUCCESS**. Real isolated PostgreSQL run `41709194498` **FAILED** at line 24 of test script: `permission denied for table dd_chat_messages`, exactly the intended backend privacy restriction, but the test mistakenly expected to read private table as ordinary authenticated role.
- Corrected synthetic acceptance test to inspect only participant-scoped safe RPCs. Explicit private-table access denial is tested separately. No SQL candidate schema relaxations, no live backend, no user data touched. Rerun isolated CI before claiming green.



### 2026-11-03 — Private Profile Chat functional/security hardening plus isolated database CI
- Repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; previous SHA `5c6e04885a437866d1c2d29cc7f322fcbe973d05`; new SHA current branch HEAD.
- Reviewed current LIVE/public chat and opted-in alias schema; private Profile Chat remains a distinct user-consented 1:1 area and disabled `privateChat:false`.
- Updated **UNAPPLIED** `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`: recipient-only acceptance atomically materialises exactly one introductory message in accepted history; response cannot recur; server denies blocked reads and messages; send locks chat row against block; pair projection now includes boolean `contact_unavailable` for safe UI. Owner report queue denies anonymous JWT.
- Added `.github/workflows/validate-private-chat-isolated.yml`, `scripts/private-chat-isolated-fixture.sql`, `scripts/private-chat-isolated-acceptance.sql`: disposable Postgres 17 / fake users / real RPC and role checks; live Supabase untouched. Source regression extended; Profile Chat client refreshes selected thread, avoids fetching known blocked history.
- **Verification:** source JS parsed; **CI PENDING**, no claims about actual multi-account pass yet. No Netlify, production branch, Android or live database write.
- **Remaining:** CI real PostgreSQL security suite green; real backend compatibility audit (RLS, owner row seeding after approval), unread tracking, archive/remove controls, report moderation UI and documentation, real cross-device/browser tests.



### 2026-11-03 — NASA Worldview selects actual historical daily imagery layer
- Unpublished branch `feature/sources-archives-next-batch-nov03`, previous SHA `0a2711bff0e3587c94743582c452e867a08394c6`; new SHA current branch HEAD.
- `assets/historical-satellite.js` now passes Worldview's `l=MODIS_Terra_CorrectedReflectance_TrueColor` along with approximate town, date and optional UTC timeline position, rather than accepting a present-day default scene. NASA GIBS documents Terra true-colour daily imagery from 24 Feb 2000 (coverage gaps possible). 
- Explicitly warn researchers that Terra daily composites **cannot prove minute-specific conditions** and provider's actual frame acquisition time requires separate data/metadata verification. EUMETSAT old archive remains manual date selection and coverage-dependent. Extended `scripts/test_historical_satellite.cjs`; CI pending.
- No paid API, browser geolocation, live backend update, Netlify, production merge, Android or actual imagery capture.



### 2026-11-03 — Fix new case-card satellite button markup/test
- Repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; previous SHA `6e36f463e0e12473bdba8beec3ceabac56dccb38`, new SHA current branch HEAD.
- Prior GitHub check `41699308567` failed obsolete regression expecting `data-evidence-open` on Map satellite button, now intentionally `data-dd-sat-case`. Updated `scripts/test_historical_satellite.cjs`, eliminated two accidental literal `+` characters between neighbouring case card buttons, added full inline 11-tab main script parser check.
- JavaScript test and extracted main site inline JavaScript parse successfully in source verification. CI pending; no real browser QA, original provider frames/nearest timestamp verification, Netlify, Supabase or Android changes.



### 2026-11-03 — Historical satellite view on all existing public case-card families (unpublished)
- Branch `feature/sources-archives-next-batch-nov03`, previous SHA `43011c53a95e703ffc7d294bac0192951894c7d8`; resulting SHA is this GitHub milestone commit.
- Added **🛰 Satellite view** on Map report cards, Featured Case Files, Rabbit Hole cases and Evidence Archive list/detail via exact-scoped case IDs. New historic satellite research dialogue from `assets/historical-satellite.js` gives recorded event date + optional researcher-supplied UTC time and approximate mapped public area, using official NASA Worldview date/viewport or EUMETSAT manual archive links. No new navigation tab.
- Year-only records do not get invented day/time; archives with no exact linked mapped case ID are shown as unlocated and do not receive fake coordinates. No witness/private GPS or automatic third-party requests. Modern map basemaps are not mislabelled as historical images.
- **Not built:** in-app image frame preview, API-based nearest actual acquisition selection, historical time slider, verified frame timestamp provenance, satellite object-track analysis. Source viewer handoff only, no claim frame exists at exact minute.
- Expanded `scripts/test_historical_satellite.cjs` static source/URL/date/archive-scope tests, docs updated. GitHub CI pending; browser and Samsung device acceptance pending.
- No Netlify preview/publish, Supabase data changes, production branch/11-tabs or Android changes.



### 2026-11-03 — Historical satellite imagery GitHub-only QA verified
- Implementation SHA `dda6f9bd9a87bc400859d4664773adef04ba2480` on unpublished branch `feature/sources-archives-next-batch-nov03` passed GitHub workflow **`41693881342` SUCCESS**. Verified in CI: JavaScript syntax, historical case date parsing, approximate town-only coordinates, Worldview geographic/date/UTC parameter format, NASA vs EUMETSAT coverage boundaries, absence of witness/private location forwarding, no fake event time, case Evidence mount, and retained 11-tab navigation.
- Published `production` remained `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` (11 tabs). No Supabase data change, Netlify preview/publish, Android build, external image download, or production launch; everything is still SOURCE STAGED ONLY.
- **Outstanding before beta/production:** actual web browser test of Worldview's satellite layers for sample cases (including date/time navigation and coverage), EUMETSAT source/licence verification for any embedded imagery, source-tagged frame acquisition timestamps, map overlay/time slider, responsive Samsung QA and unified release approval.
- No need to rerun a Netlify build for this documentation/status checkpoint.



### 2026-11-03 — Historical satellite imagery research handoff from mapped cases
- Website repo/branch `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `3f991136062186ee88ebbde6b7255f438ef133c9`, resulting SHA new HEAD.
- Approved researcher flow: Map case → **Historic satellite imagery** → case Evidence file → official provider, centered on **approximate town** at **reported event date**, opening provider only by deliberate click. No new main tab; existing map and 11-tab navigation remain.
- Added `assets/historical-satellite.js` pure URL builder/UI, `index.html` action and evidence mount, `scripts/test_historical_satellite.cjs` source tests and GitHub-only CI step; documented official NASA Worldview deep-link params, EUMETSAT daily 1981+ archive, EUMETView and deferred time-resolved integration in `docs/HISTORICAL_SATELLITE_IMAGERY_2026-11-03.md` and post-launch Phase B.
- Source audit `data/disclosure-map.json`: 276 dated records, **no sighting time fields**, locations already approximate town centres. Never fill missing sighting time as fact; Worldview default 12:00 UTC is date-browser anchor only. Round coordinates ~0.1 degree, exclude public witness records and private geolocation; third-party links only on click.
- NASA 10-minute geostationary viewer advertised ~90-day window, not every historical year; EUMETSAT anniversary gallery one selected image/day starting 17 Aug 1981. Older minute-matched raw imagery requires separate licensed API/product archival work and source acquisition validation. This milestone does NOT host satellite images or claim a minute-matched frame exists.
- **Verification status:** GitHub workflow **SUCCESS** `41693881342` at implementation SHA `dda6f9bd9a87bc400859d4664773adef04ba2480`; source parser and Worldview date/approximate-city URL tests passed. Actual browser interaction/Worldview deep-link and Android tests NOT completed. No Supabase migrations, Netlify/public builds, live 11-tab or Android modifications. Remaining imagery map-layer/time-slider work is roadmap, not delivered.
- Next: verify GitHub test passes; prepare source coverage/provider selection and daily-frame/link preview; validate original weather time against primary records before any live imagery match claim.



### 2026-11-03 — Discussions reply review threshold fixed after isolated test
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `0afee9bd0393e9513e36172d13730fae30a67b0f`; resulting SHA is new HEAD.
- Run `41688611725` **FAILED** on real disposable PostgreSQL acceptance at the fifth stage (first flagged reply): `column r.reviewed_flag_count does not exist`. Candidate schema had correctly added this reviewed threshold to topics but not replies.
- Updated **unapplied** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` reply DDL to include `reviewed_flag_count integer not null default 0` and extended `scripts/test_discussions_sql.cjs` to assert both table definitions match.
- Normal website source CI `41688611745` passed on preceding SHA; rerunning both pipelines. No Supabase production schema/rows, Netlify, or Android changes. Next verify isolated expanded reply/escalation sequence green.



### 2026-11-03 — Fix disposable acceptance script quoting, add static regression
- Branch `feature/sources-archives-next-batch-nov03`, prior SHA `d09c36631af571db135d72ed02ef24c66e8cfcb6`; resulting SHA new HEAD.
- CI `41688410287` failed only on newly inserted synthetic `DO # Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

## 3. Last verified milestone (most recent first)

- **2026-11-03, expanded isolated forum SQL test fixture delimiter fix STAGED:** new run `41688410287` FAILED in test script after original integration tests passed; seven newly added `do $` blocks were changed to `do # Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 by JavaScript replacement-string expansion during source construction. Corrected all test script delimiters using literal split/join and added guard tests; no schema change; CI pending.

- **2026-11-03, isolated PostgreSQL Discussions CI GREEN:** Docker/PostgreSQL 17 run `41687803769` SUCCESS at implementation SHA `102fc572a405ee298b81f9fad8ee92388bb8dc4a`; synthetic users verified section creator vs ordinary poster, scoped Pin, site-owner role, guest safe RPC/raw-table denial, first and second 5-distinct-flags hide cycles, owner restore and steward revocation. Paired GitHub static QA run `41687803846` SUCCESS. **Only disposable DB; real Supabase remains untouched.** Expanded reply/escalation test coverage now staged and pending a new run.

- **2026-11-03, isolated PostgreSQL steward Pin runtime fix STAGED:** run `41687573826` **installed candidate SQL successfully** into disposable DB, then synthetic role tests failed due ambiguous `section_id` variable in Pin RPC at line 14. Renamed local variables `v_section_id` in Pin and Escalate RPCs to prevent column/variable conflicts. CI rerun pending. No live DB change.

- **2026-11-03, isolated SQL owner-function footer fix STAGED:** run `41687262065` failed on remaining `end $;` close in final owner-sections function. Root cause was JavaScript string replacement interpreting `$` as a single literal dollar during source generation. Replaced via a function callback, verified correct `end $;` byte-for-byte; rerun CI pending. No live DB changes.

- **2026-11-03, PostgreSQL owner-function delimiter correction STAGED:** isolated CI `41687005397` reached the later owner functions but failed SQL parse at line 548 because the owner queue and owner sections functions each had a single `# Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 rather than `$` body opening (and one closing). Both repaired; static regression now rejects unmatched delimiters. Rerun pending; NO live database changes.

- **2026-11-03, isolated SQL parser correction STAGED:** run `41686804284` FAILED on a PL/pgSQL `IF` conditional using an unparenthesised `CASE` expression in `dd_discussions_edit_own`. Replaced it with independent validated thread/reply length guards and updated static assertions. **Test now rerunning; do not claim backend ready.** No live data touched.

- **2026-11-03, isolated Discussions PostgreSQL security workflow CODE STAGED:** Docker PostgreSQL 17 GitHub Action will run candidate SQL in a disposable database with synthetic Auth roles/users, test guest raw-table denial, nonsteward pin denial, owner review, author posting/replies and two rounds of five distinct flags. Trigger restricted to the review SQL/test files and workflow itself; **no connection to live Supabase, no Netlify deploy**. Workflow result pending; errors must be fixed before treating SQL as executable.

- **2026-11-03, Discussions overall-admin view CODE STAGED / DISABLED:** owner-only review pane inside existing Profile/Admin Centre displays hidden/escalated threads/replies, limited excerpts and escalation reasons, with Restore/Hide/Remove decisions requiring reasons. Owner can revoke a section steward without deleting their section. Server-side owner-only RPC candidates are reviewed SQL source only; no owner allowlist seeded, schema installed or live moderation performed. GitHub-only CI pending.

- **2026-11-03, Discussions owner/author/steward polish CODE STAGED / DISABLED:** added verified-author Edit/Withdraw buttons, removable votes, steward section description/topic settings and focused thread/reply navigation; corrected schema candidate to preserve a five-**new**-flags threshold after owner restoration, rather than instantly rehiding on an old tally. Backend is still **UNAPPLIED**, GitHub-only CI pending; no user access or database modifications.

- **2026-11-03, Discussions test-file syntax correction STAGED:** GitHub run `41685385409` FAILED on an unescaped apostrophe in one newly appended JS assertion, not on application code. Fixed the assertion string and parsed the full test source with `new Function`; rerun CI before calling this milestone green.

- **2026-11-03, Discussions candidate safety review CORRECTION STAGED:** verified GitHub-only contract run `41685136138` passed previous SQL source; identified and patched review-only edge cases: anonymised users should not block section/account deletion or report flagging, withdrawn topics must satisfy nonempty constraints, post edits retain original length limits, and owner queue now includes both hidden/escalated **threads and replies**. Corrected source **still unapplied and not database-tested**. CI pending.

- **2026-11-03, Discussions backend review SOURCE STAGED, UNAPPLIED:** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` proposes section/reply/topic tables with RLS, guest-only safe read projections, registered-only posting and votes, five-distinct-flags temporary hide, limited steward Pin/Escalate, owner-only moderation/role replacement, abuse rate limits and audit trails. No DB schema was installed; GitHub-only source contract added, CI pending; isolated SQL/role tests required.

- **2026-11-03, Discussions frontend CODE STAGED / DISABLED:** responsive section discovery, new-section form, topic posts, reply pane, safe source links, registered posting, user votes/flagging, scoped section-steward pin and escalate actions added in `assets/community-discussions.js` and `index.html`. The module returns immediately when `discussions:false`; no twelfth tab or public RPC calls. **Backend methods not yet implemented.** GitHub-only JS/static UI test added; CI pending and no deployment.

- **2026-11-03, separate private Chat contact opt-in CODE STAGED / DISABLED:** public username management now conditionally shows an independent "allow private chat requests" checkbox, persisting `chat_contact_opt_in` only when `privateChat:true`. With the current **false** flag, existing username reads/writes remain unchanged and never query the unapplied column. GitHub-only source test updated; no backend applied, public feature or messaging.

- **2026-11-03, Profile Chat accordion static-test correction STAGED:** initial GitHub-only run `41683343386` failed because assertion matched `class` as the first attribute, while the new Chat `<details>` intentionally begins with an accessible `id`. Updated regex to accept safe attribute order and still assert seven sections. Re-run pending; no live UI or backend enabled.

- **2026-11-03, disabled Profile Chat test coverage STAGED:** added GitHub-only static test covering accepted-only composer, recipient acceptance, flagged-off state, RPC method signatures and textContent rendering; no database writes/real chat. Workflow results pending for this commit. Original backend candidate remains unapplied.

- **2026-11-03, Profile Chat UI source STAGED / DISABLED:** a seventh native collapsible Hub section houses accepted/pending lists and inline conversation/preview/composer; source-based client actions for invite, accept/decline, block and report. Separate `privateChat:false` and `discussions:false` flags protect the live 11-tab experience; the chat schema remains UNAPPLIED and no messaging is usable. Await GitHub-only CI and isolated backend/RLS testing before activation.

- **2026-11-03, private 1:1 Chat database foundation CODE STAGED / UNAPPLIED:** staged security-reviewed candidate SQL (`supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`) for separate chat opt-in, one introductory preview, recipient-only accept/decline, participant-only accepted messages, anti-repeat pair uniqueness, request/message rate limits, blocks and limited excerpt-only owner reports. CI tests are static, **NOT SQL execution or authenticated security tests**. Website feature remains disabled; no Supabase migration was applied. This is a candidate requiring independent SQL/RLS review and an isolated database test before activation.

- **2026-11-03, Community Rules current-vs-future wording CODE STAGED:** obsolete "private drafts only" notice replaced with feature-flag-aligned status; planned Discussions and consent-only private Chat policy and scoped steward limits added, plus GitHub-only source check. No publication. CI pending.

- **2026-11-03, email backup presentation CODE STAGED:** new static responsive Disclosure Desk/BDS-branded HTML and text email, existing attachment/auth/hourly limit unchanged. Template regression added to GitHub-only staging workflow. Not deployed to Edge and no real email sent. CI pending.

- **2026-11-03, QA correction STAGED:** new account-owned controls added a nested Recently deleted panel (6 main accordions + 1 nested). First GitHub run `41678969054` failed only on an outdated count-of-closing-tags assertion. Test corrected to seven; local static assertions PASS. Await GitHub-only rerun before claiming green.

- **2026-11-03, private-content management CODE STAGED:** existing Supabase backend checked read-only. Confirmed `dd_delete_my_comment`, `dd_edit_my_comment` (30-minute/unflagged), owner-only witness DELETE with retained 24h quota, and research trash/restore/purge RPCs. Added Profile/Hub UI against existing backend in code commit `0cb9dcafe93495c213f98e4c4bcf778c62d733ca`. No new DB policies/tables or real user writes; awaiting CI and Samsung real-account acceptance.

- **2026-11-03, My Research Hub collapsible UI STAGED:** six native keyboard-accessible expand/collapse sections implemented on unpublished branch, code commit `2dd0efeba5a36648bdd71048348ea0af8e445812`; static regression added to GitHub-only staging QA. Not yet marked CI GREEN, not Samsung-tested, not deployed. Existing account summary, private lists, backend and Admin Centre unchanged.

- **2026-11-03 16:29 UTC, Sources & Archives GitHub-only CI:** branch `feature/sources-archives-next-batch-nov03` head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`; Actions run `41674655120` SUCCESS. This is **source/CI validation, not Samsung QA or a deployment**.
- **Sources & Archives build staged:** `sources.html` with 13 reviewed country-level official/independent archive sources, country/type filtering, search, citation/right-to-reproduce cautions, Brazil SIAN guidance; About/Explore/Documents routes and sitemap wired. Test `scripts/test_sources_directory.cjs`; workflow `validate-sources-directory-staged.yml`. No PR or deployment for this branch. External links, accessibility and phone experience still require final acceptance.
- **2026-11-03 08:02 UTC, combined 11-tab website release:** PR #2 merged to `production`. PR describes news/archive/videos/Watch & Read discussions, likes/dislikes, five-flag moderation, witness public reports, W.NE Research Studio, My Research Hub/Profile, owner Admin Centre, LIVE hearing archive, refreshed tours, Podcasts chip, and backend migrations. CI run `41599937501` is described as successful in the merged PR. **Do not assume every real-account/mobile flow is verified.** Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` was confirmed again in this session.
- **Existing Android candidate:** `android/play-internal-candidate-oct31` includes Android wrapper/notification plumbing and a manual signed AAB workflow requiring Play upload-signing secrets. Website vs Android branch comparison shows large divergence (121 commits ahead, 198 behind at last check). Do **not** build Play release from that branch without intentional reconciliation, native regression and signing checks.

## 4. Current priority: complete the agreed website roadmap BEFORE the next update

**Release rule:** collect work into the next significant unpublished batch, preserving 11 tabs and all tested capabilities. No individual feature deployment.

### 4A. Current QA/repair and polish queue — verify existing behavior first

- **Witness Reports:** **CODE STAGED** owner's `Delete report` in private Profile via existing owner DELETE RLS, immediate map refresh, confirmation and quota-retention warning. Read-only database audit verified delete trigger retains 24h quota. **Not real-account/phone tested.** Confirm latest Edge CORS including `x-client-info`, signed-in POST, map privacy and moderation; no test report deletion was performed.
- **Comments:** **CODE STAGED** owner Edit (within 30 min, unflagged only) and Delete controls in Profile → My Comments using verified existing `dd_edit_my_comment` and `dd_delete_my_comment` RPCs. Confirm before delete; retain all server moderation rules. **No real edit/delete submitted in tests**; verify real-account behavior and counts.
- **Research documents:** **CODE STAGED** move private cloud documents to Recently deleted, restore, and guarded permanent purge from Hub; reuse existing RLS/owner RPCs. Media-bearing purges are server-blocked, not bypassed. Local copies not touched. **No real-user restore or purge tested**; verify Studio library refresh/export/recovery and private asset linkage.
- **My Research Hub:** **CODE STAGED** six native keyboard-accessible collapsible panels via `<details>/<summary>`; default closed; live account summary and owner Admin Centre stay independent. Existing private lists were not rewritten. Await GitHub-only CI and Samsung/desktop acceptance before marking done.
- **Email backups:** **CODE STAGED** branded responsive dark/gold message with plain-text alternative, content-minimising body, existing JSON attachment, verified-only recipient and hourly limiter preserved. GitHub-only template contract check added. **Not yet deployed to Supabase Edge or delivery-tested.**
- **Usernames:** existing `dd_public_names` has generated unique `name_key` and opt-in display policies. Verify *duplicate rejection* and proper error messages with two real test accounts before changing DB schema.
- **Watch & Read / Videos / LIVE:** verify labels, podcast variety, buttons, fullscreen back handling, archived comments/chat, original source links and autoplay/YouTube behavior. Existing site calls Podcasts; do not reimplement an already-correct chip. Test on Samsung.
- **LIVE hearing discovery:** check the separate Congress candidate workflow and controlled approval-to-public-event process, realistic countdown/link/home notice, cancellation, 48h removal, archived hearing recordings with original chat, no fictitious dates.
- **Sources & Archives:** finish checking the staged directory, source URLs and rights, responsive search/filter and sitemap. Do not copy or republish Canadian/Brazilian archive originals without checking permissions.
- **Community Rules, tour and controls:** **CODE STAGED** corrected active-versus-planned community notice, outlined future Discussions stewards and 1:1 consent-based Chat, while preserving 11 currently live tabs. GitHub-only policy regression added. Still verify full-site tour (including future 12-tab changes only after approved backend), guest read-only vs signed-in, account separation, keyboard/screen-reader and mobile/device flows.
- **World map/archives:** extend case coverage toward the agreed long-term 100k goal through existing bulk-import + de-duplication, provenance and batching; check current count rather than assuming; preserve UK/Ireland and global coverage, no duplicate ingestion or privacy violations.

**Release blockers:** real registered-user browser/HTTP and Samsung tests; public/owner/guest permission tests; safe report delete/edit and comment workflow; backup/recovery test; unique username test; LIVE/countdown/chat QA; responsive, performance and accessibility checks. Verify any missing feature in code before marking it incomplete.

### 4B. Five approved *post-launch* research enhancements — roadmap, NOT delivered

All five were approved on 2026-11-03 and are documented in [the original roadmap](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md). Their previous document calls them *post-launch*. Newer user direction says finish the **current agreed roadmap** before the next website update. Reconcile their order with the current QA/release scope before expanding work: do not silently convert future research phases into blockers for a finished beta or promise that they already exist.

1. **Case Intelligence / Investigate:** source-grounded related cases, timeline, articles, media, similar/duplicate labels, evidence provenance.
2. **What was in the sky?:** optional aircraft/satellite/meteor/weather/launch context with historical-data and timezone limitations, not automatic “explanations”.
3. **Independent witness matching:** city/region/time only, confidence caveats, opt-in contact, anti-harassment and independence checks.
4. **Evidence quality / case status:** evidence-completeness checklist, chain of custody, alternate hypotheses, changes/corrections, no “alien probability”.
5. **Publish an Investigation:** private W.NE copy → redaction preview → explicit owner Publish; citations, history/corrections, PDF/DOCX; prevent private Boards/docs leakage.

Retain these in existing sections/tools, not five new navigation tabs. Before building any part, inspect current Evidence Connections / comparison / research/export implementations to avoid duplication.

### 4C. Private one-to-one user messaging — BACKEND CANDIDATE + DISABLED UI STAGED / NOT APPLIED

**Requested 2026-11-03:** Add a **Chat** section *within* the existing **Profile / My Research Hub**, using its expandable card pattern and an embedded conversation window. No separate chat page or chat-specific navigation tab (the separately approved Discussions tab will be the site's future twelfth tab), and **no group chats**. Include **Accepted chats** and **Pending requests** (incoming and sent), with an unread indicator and a message pane in the same Profile section.

**Consent-first start:** A signed-in, non-anonymous registered user may find an eligible **opted-in public username** and send **exactly one initial message as a chat request**. Recipient sees *only that first message as a request preview*, with **Accept** or **Decline**. Sender may not continue the conversation or send follow-ups while pending. Only acceptance enables a persistent private two-way conversation visible to the two members; a declined request does not become a chat.

**Privacy / abuse controls:** Usernames must be unique and discoverable for chat only with explicit opt-in, reusing existing `dd_public_names` and existing Auth rather than creating an unrelated profile directory. Do not expose emails, underlying auth UUIDs, private Boards/research or location. RLS and server-side checks must restrict request/chat/message access to the two participants and prevent the sender from self-accepting, bypassing a decline, spam-retrying or contacting a blocked account. Include **Block** and **Report** controls, request rate limits, anti-harassment restrictions, refusal without mandatory explanation, and appropriate moderation/report review without routine moderator access to everyone's private conversations. No unsolicited group broadcasts; no attachments initially.

**User experience / device:** Inside Profile: an expandable Chat panel with Accepted | Pending (received/sent) states, a selectable conversation list, and a scrollable message window/composer in the *same panel* after acceptance. Inbound pending shows only the submitted preview and Accept/Decline actions. Safe markup/text rendering, touch/keyboard accessibility, responsive mobile, unread state and cross-device consistency; Android should receive the same functionality after website QA. Notifications should be opt-in if added.

**Build / acceptance status:** A **review-only SQL backend candidate** now exists in `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`, with GitHub-only structural tests; it has **NOT** been applied or verified against a live/staging database. Disabled Profile UI and feature-gated independent contact opt-in source are staged; feature activation, schema testing, real 1:1 messages and security QA remain pending. Feature remains approved for the **current consolidated roadmap** before the next coordinated website release. Inspect the existing LIVE hearing chat and community identity primitives first to reuse safe code patterns **without conflating public LIVE chat and private messaging tables**. Build on the unpublished website branch, test with synthetic multi-account scenarios (pending/accept/decline/block/report/unauthorised read, spam caps, simultaneous requests), RLS audit, Samsung/desktop QA; then port to Android and prepare the Play release. **Do not migrate the live database or deploy Netlify merely to record this feature.** Detailed requirement/acceptance record: [Private Chat roadmap](docs/PROFILE_PRIVATE_CHAT_ROADMAP_2026-11-03.md).

### 4D. User-created Discussions tab — FRONTEND STAGED/DISABLED; BACKEND SQL CANDIDATE UNAPPLIED

**Requested 2026-11-03:** Add **Discussions** as a separate **12th** main tab in the future combined website release (proposed after Witness, before Watch & Read). The **current live site still has 11 tabs**. This deliberately authorises a new navigation tab, unlike private Profile Chat (which stays inside Profile). Users create public topic sections and then posts, threaded discussions and shareable source links inside them. Guests can read published public discussions; registered users can post, reply, vote and flag. Avoid duplicating current case/news/video comment threads and LIVE chat.

**Governance:** A section creator becomes a **scoped section steward**, not an unchecked moderator. They may manage section description/tags, pin a few posts, flag issues and **escalate directly to overall site admin**. They cannot ban critics, gatekeep post approval, permanently hide/delete somebody else's content or grant themselves more powers. Continue **five distinct user flags → temporarily hidden pending review**; dislikes are not flags. Serious safety/privacy cases need urgent report routing without waiting for five flags. Narrow emergency safety holds are a design proposal only and require time limits, owner review, audited reason and appeals before any approval.

**User protection:** registered Auth + safe unique aliases, RLS author/steward/site-owner separation, duplicate/name/rate/spam guards, links/XSS security, appeals, owner moderation override and steward revocation without deleting community content. Public-by-default sections, no private groups or paid gatekeeping in v1. Owner moderation must remain effective; steward abuse must be reversible.

**Status:** Responsive frontend and gated navigation CODE STAGED behind `discussions:false`; a **review-only** database schema/RPC candidate is staged in `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`, but has NOT been applied or exercised. No visible 12th tab, no deployment. The staged client is NOT usable without separately reviewed server permissions. Build and test on unpublished branch with fake multi-account permissions, keyboard/phone acceptance and GitHub-only CI before one combined website release; port to Android after website approval. See [full Discussions roadmap and acceptance criteria](docs/COMMUNITY_DISCUSSIONS_ROADMAP_2026-11-03.md).

## 5. Release plan: website first, then Android / Google Play

**Additional scope already approved:** consent-first private 1:1 messaging embedded within Profile (Section 4C, no extra chat tab) **and** new public user-created Discussions as a separately approved **12th main tab** (Section 4D). Both belong to the consolidated website roadmap with abuse/security tests and later Android parity. Current `production` remains the original 11-tab version.

**Phase 1 — Unpublished website development:** work only on `feature/sources-archives-next-batch-nov03` or a clearly documented child; integrate already-staged Sources & Archives plus agreed feedback without duplicating the 11-tab production features. Update master after each milestone. Keep Netlify and public domain unchanged.

**Phase 2 — Consolidated website QA/release:** run GitHub-only checks; audit actual Supabase/RLS/API; create one deliberate staging preview only after approval; human-test signed-in/guest/owner, two-account separation, camera/media, live chat, sources, submissions, editing/deletion and backups on Samsung S24 Ultra, and keyboard/desktop. Preserve fixes and bug list, then seek approval for one combined `production` release. Do not assume green CI equals mobile acceptance.

**Phase 3 — Android parity port:** compare `production` merged website with `android/play-internal-candidate-oct31`; bring across all approved current web assets, URLs, session/auth, Research Studio navigation, map/Leaflet, login, comment/witness moderation, LIVE replay, notifications and offline/fallback behavior. Avoid overwriting Android native capabilities or reverting website features. Verify app-specific origin/CORS, WebView cookies/storage, deep-links/back gestures, notification and playback behavior, mobile menu/profile, updates, account and privacy.
 
**Phase 4 — Play internal test and release preparation:** check Gradle/Android SDK, app ID, target API and Play policy requirements on actual release date; securely configure signed Android App Bundle (AAB) using existing manual `.github/workflows/android-play-internal-aab.yml`; check Play App Signing, release keys, version codes, app icon, screenshots, listing, privacy/data safety, consent/ads implementation, support URL, testing track eligibility, crash-free smoke and multi-device tests. Run internal/closed testing first; production publication requires explicit separate approval. Never publish a debug-signed APK as Play release.

## 6. Known source paths and supporting records

- Website: `index.html`, `cloud-boards.js`, `assets/*`, `community-rules.html`, `privacy.html`, `sources.html`, `research/*`, `supabase/*`.
- Research Studio: `research/wne.html`, `research/research-workspace.html`, `research/research-site-nav.js`, cloud/local bridges and canonical Research Edition source.
- Backend: `supabase/functions/dd-witness-submit/index.ts`, `supabase/functions/email-board-backup/index.ts`; reviewed migrations in `supabase/`.
- Tests: `scripts/test_sources_directory.cjs`, `scripts/test_research_hub.cjs`, `scripts/test_community_http.mjs`, `scripts/test_witness_community.cjs`, `scripts/test_live_chat_archive.cjs`, `scripts/test_wne_site_integration.cjs`, `scripts/smoke_wne_website.mjs`.
- Exact test/background history: [LIVE/community handover](docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md), [Community backend QA](docs/COMMUNITY_BACKEND_QA_2026-11-03.md), [W.NE integration handover](docs/WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md), [beta feedback fixes](docs/BETA_FEEDBACK_FIXES_2026-11-03.md), [LIVE archive specification](docs/LIVE_CHAT_ARCHIVE_RELEASE.md), [post-launch research phases](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md), [Android release checklist](RELEASE_READINESS.md).
- Existing original four continuity files on the old `main` branch contained rules, development handover, feature registry and memory, but were not copied into the active `production` baseline. This commit installs short same-name pointers to THIS master file on the current staged branch. Their prior detailed records are historical.

## 7. Invariant acceptance checklist — before any public/Play release

- [ ] Confirm exact branch and HEAD; no unexpected merge, deployment or automation run.
- [ ] Current 11 tabs, original W.NE UI and existing features present; no UI/code leak, duplicate editor or blank sections.
- [ ] Users/auth/session: guest read-only; private documents and Boards segregated; logout/login and restore correct.
- [ ] Supabase RLS/permission tests for anonymous, signed-in owner and unrelated registered user; server guards enforced.
- [ ] Witness city privacy, 3/24h, duplicates, vote/flag, five distinct flags, restore baseline, user report deletion/withdraw and owner moderation.
- [ ] Comment/public username create/display/edit/delete, counts and flags safely validated; public raw IDs/emails remain hidden.
- [ ] LIVE official verification, homepage 48h notice, timezone, recordings, archival chat and moderation.
- [ ] News/Archive/Map/Videos/Watch & Read/Explore/Profile/Research Studio/Boards fully function on phone + desktop.
- [ ] Cloud save, editor save-before-navigation, export/import, backup email and recovery tests, with disposable copies.
- [ ] Source links and reproduction rights; accessible/tappable controls, mobile layouts, performance, legal/privacy text.
- [ ] One final combined staging run and human acceptance before separate production authorisation.
- [ ] After website approval: Android native parity, signed AAB, notifications, ads/consent, Play internal track acceptance before Play production approval.

## 8. Exact next task for the next chat

1. Read **this master file** plus any specific linked QA record needed for the imminent milestone; fetch GitHub's **actual** `production`, `feature/sources-archives-next-batch-nov03` and Android candidate heads and compare them before coding.
2. Continue the **current unpublished website QA/repair queue** from Section 4A, starting with code audit of deletion/edit permissions and Research Hub collapsing plus the latest reported witness/mobile issue. Do not duplicate existing feature implementations.
3. Work in an unpublished branch, run targeted tests and verify no Netlify/public deploy. At each completed milestone, **edit this master file in the same milestone**, including exact SHA, tests and blocker status.
4. Only after the website roadmap and cohesive QA/release are approved, reconcile and prepare Android for Play internal testing; never skip website-to-Android parity verification.

 blocks, because JS replacement strings converted literal `$` to `# Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

## 3. Last verified milestone (most recent first)

- **2026-11-03, expanded isolated forum SQL test fixture delimiter fix STAGED:** new run `41688410287` FAILED in test script after original integration tests passed; seven newly added `do $` blocks were changed to `do # Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 by JavaScript replacement-string expansion during source construction. Corrected all test script delimiters using literal split/join and added guard tests; no schema change; CI pending.

- **2026-11-03, isolated PostgreSQL Discussions CI GREEN:** Docker/PostgreSQL 17 run `41687803769` SUCCESS at implementation SHA `102fc572a405ee298b81f9fad8ee92388bb8dc4a`; synthetic users verified section creator vs ordinary poster, scoped Pin, site-owner role, guest safe RPC/raw-table denial, first and second 5-distinct-flags hide cycles, owner restore and steward revocation. Paired GitHub static QA run `41687803846` SUCCESS. **Only disposable DB; real Supabase remains untouched.** Expanded reply/escalation test coverage now staged and pending a new run.

- **2026-11-03, isolated PostgreSQL steward Pin runtime fix STAGED:** run `41687573826` **installed candidate SQL successfully** into disposable DB, then synthetic role tests failed due ambiguous `section_id` variable in Pin RPC at line 14. Renamed local variables `v_section_id` in Pin and Escalate RPCs to prevent column/variable conflicts. CI rerun pending. No live DB change.

- **2026-11-03, isolated SQL owner-function footer fix STAGED:** run `41687262065` failed on remaining `end $;` close in final owner-sections function. Root cause was JavaScript string replacement interpreting `$` as a single literal dollar during source generation. Replaced via a function callback, verified correct `end $;` byte-for-byte; rerun CI pending. No live DB changes.

- **2026-11-03, PostgreSQL owner-function delimiter correction STAGED:** isolated CI `41687005397` reached the later owner functions but failed SQL parse at line 548 because the owner queue and owner sections functions each had a single `# Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 rather than `$` body opening (and one closing). Both repaired; static regression now rejects unmatched delimiters. Rerun pending; NO live database changes.

- **2026-11-03, isolated SQL parser correction STAGED:** run `41686804284` FAILED on a PL/pgSQL `IF` conditional using an unparenthesised `CASE` expression in `dd_discussions_edit_own`. Replaced it with independent validated thread/reply length guards and updated static assertions. **Test now rerunning; do not claim backend ready.** No live data touched.

- **2026-11-03, isolated Discussions PostgreSQL security workflow CODE STAGED:** Docker PostgreSQL 17 GitHub Action will run candidate SQL in a disposable database with synthetic Auth roles/users, test guest raw-table denial, nonsteward pin denial, owner review, author posting/replies and two rounds of five distinct flags. Trigger restricted to the review SQL/test files and workflow itself; **no connection to live Supabase, no Netlify deploy**. Workflow result pending; errors must be fixed before treating SQL as executable.

- **2026-11-03, Discussions overall-admin view CODE STAGED / DISABLED:** owner-only review pane inside existing Profile/Admin Centre displays hidden/escalated threads/replies, limited excerpts and escalation reasons, with Restore/Hide/Remove decisions requiring reasons. Owner can revoke a section steward without deleting their section. Server-side owner-only RPC candidates are reviewed SQL source only; no owner allowlist seeded, schema installed or live moderation performed. GitHub-only CI pending.

- **2026-11-03, Discussions owner/author/steward polish CODE STAGED / DISABLED:** added verified-author Edit/Withdraw buttons, removable votes, steward section description/topic settings and focused thread/reply navigation; corrected schema candidate to preserve a five-**new**-flags threshold after owner restoration, rather than instantly rehiding on an old tally. Backend is still **UNAPPLIED**, GitHub-only CI pending; no user access or database modifications.

- **2026-11-03, Discussions test-file syntax correction STAGED:** GitHub run `41685385409` FAILED on an unescaped apostrophe in one newly appended JS assertion, not on application code. Fixed the assertion string and parsed the full test source with `new Function`; rerun CI before calling this milestone green.

- **2026-11-03, Discussions candidate safety review CORRECTION STAGED:** verified GitHub-only contract run `41685136138` passed previous SQL source; identified and patched review-only edge cases: anonymised users should not block section/account deletion or report flagging, withdrawn topics must satisfy nonempty constraints, post edits retain original length limits, and owner queue now includes both hidden/escalated **threads and replies**. Corrected source **still unapplied and not database-tested**. CI pending.

- **2026-11-03, Discussions backend review SOURCE STAGED, UNAPPLIED:** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` proposes section/reply/topic tables with RLS, guest-only safe read projections, registered-only posting and votes, five-distinct-flags temporary hide, limited steward Pin/Escalate, owner-only moderation/role replacement, abuse rate limits and audit trails. No DB schema was installed; GitHub-only source contract added, CI pending; isolated SQL/role tests required.

- **2026-11-03, Discussions frontend CODE STAGED / DISABLED:** responsive section discovery, new-section form, topic posts, reply pane, safe source links, registered posting, user votes/flagging, scoped section-steward pin and escalate actions added in `assets/community-discussions.js` and `index.html`. The module returns immediately when `discussions:false`; no twelfth tab or public RPC calls. **Backend methods not yet implemented.** GitHub-only JS/static UI test added; CI pending and no deployment.

- **2026-11-03, separate private Chat contact opt-in CODE STAGED / DISABLED:** public username management now conditionally shows an independent "allow private chat requests" checkbox, persisting `chat_contact_opt_in` only when `privateChat:true`. With the current **false** flag, existing username reads/writes remain unchanged and never query the unapplied column. GitHub-only source test updated; no backend applied, public feature or messaging.

- **2026-11-03, Profile Chat accordion static-test correction STAGED:** initial GitHub-only run `41683343386` failed because assertion matched `class` as the first attribute, while the new Chat `<details>` intentionally begins with an accessible `id`. Updated regex to accept safe attribute order and still assert seven sections. Re-run pending; no live UI or backend enabled.

- **2026-11-03, disabled Profile Chat test coverage STAGED:** added GitHub-only static test covering accepted-only composer, recipient acceptance, flagged-off state, RPC method signatures and textContent rendering; no database writes/real chat. Workflow results pending for this commit. Original backend candidate remains unapplied.

- **2026-11-03, Profile Chat UI source STAGED / DISABLED:** a seventh native collapsible Hub section houses accepted/pending lists and inline conversation/preview/composer; source-based client actions for invite, accept/decline, block and report. Separate `privateChat:false` and `discussions:false` flags protect the live 11-tab experience; the chat schema remains UNAPPLIED and no messaging is usable. Await GitHub-only CI and isolated backend/RLS testing before activation.

- **2026-11-03, private 1:1 Chat database foundation CODE STAGED / UNAPPLIED:** staged security-reviewed candidate SQL (`supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`) for separate chat opt-in, one introductory preview, recipient-only accept/decline, participant-only accepted messages, anti-repeat pair uniqueness, request/message rate limits, blocks and limited excerpt-only owner reports. CI tests are static, **NOT SQL execution or authenticated security tests**. Website feature remains disabled; no Supabase migration was applied. This is a candidate requiring independent SQL/RLS review and an isolated database test before activation.

- **2026-11-03, Community Rules current-vs-future wording CODE STAGED:** obsolete "private drafts only" notice replaced with feature-flag-aligned status; planned Discussions and consent-only private Chat policy and scoped steward limits added, plus GitHub-only source check. No publication. CI pending.

- **2026-11-03, email backup presentation CODE STAGED:** new static responsive Disclosure Desk/BDS-branded HTML and text email, existing attachment/auth/hourly limit unchanged. Template regression added to GitHub-only staging workflow. Not deployed to Edge and no real email sent. CI pending.

- **2026-11-03, QA correction STAGED:** new account-owned controls added a nested Recently deleted panel (6 main accordions + 1 nested). First GitHub run `41678969054` failed only on an outdated count-of-closing-tags assertion. Test corrected to seven; local static assertions PASS. Await GitHub-only rerun before claiming green.

- **2026-11-03, private-content management CODE STAGED:** existing Supabase backend checked read-only. Confirmed `dd_delete_my_comment`, `dd_edit_my_comment` (30-minute/unflagged), owner-only witness DELETE with retained 24h quota, and research trash/restore/purge RPCs. Added Profile/Hub UI against existing backend in code commit `0cb9dcafe93495c213f98e4c4bcf778c62d733ca`. No new DB policies/tables or real user writes; awaiting CI and Samsung real-account acceptance.

- **2026-11-03, My Research Hub collapsible UI STAGED:** six native keyboard-accessible expand/collapse sections implemented on unpublished branch, code commit `2dd0efeba5a36648bdd71048348ea0af8e445812`; static regression added to GitHub-only staging QA. Not yet marked CI GREEN, not Samsung-tested, not deployed. Existing account summary, private lists, backend and Admin Centre unchanged.

- **2026-11-03 16:29 UTC, Sources & Archives GitHub-only CI:** branch `feature/sources-archives-next-batch-nov03` head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`; Actions run `41674655120` SUCCESS. This is **source/CI validation, not Samsung QA or a deployment**.
- **Sources & Archives build staged:** `sources.html` with 13 reviewed country-level official/independent archive sources, country/type filtering, search, citation/right-to-reproduce cautions, Brazil SIAN guidance; About/Explore/Documents routes and sitemap wired. Test `scripts/test_sources_directory.cjs`; workflow `validate-sources-directory-staged.yml`. No PR or deployment for this branch. External links, accessibility and phone experience still require final acceptance.
- **2026-11-03 08:02 UTC, combined 11-tab website release:** PR #2 merged to `production`. PR describes news/archive/videos/Watch & Read discussions, likes/dislikes, five-flag moderation, witness public reports, W.NE Research Studio, My Research Hub/Profile, owner Admin Centre, LIVE hearing archive, refreshed tours, Podcasts chip, and backend migrations. CI run `41599937501` is described as successful in the merged PR. **Do not assume every real-account/mobile flow is verified.** Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` was confirmed again in this session.
- **Existing Android candidate:** `android/play-internal-candidate-oct31` includes Android wrapper/notification plumbing and a manual signed AAB workflow requiring Play upload-signing secrets. Website vs Android branch comparison shows large divergence (121 commits ahead, 198 behind at last check). Do **not** build Play release from that branch without intentional reconciliation, native regression and signing checks.

## 4. Current priority: complete the agreed website roadmap BEFORE the next update

**Release rule:** collect work into the next significant unpublished batch, preserving 11 tabs and all tested capabilities. No individual feature deployment.

### 4A. Current QA/repair and polish queue — verify existing behavior first

- **Witness Reports:** **CODE STAGED** owner's `Delete report` in private Profile via existing owner DELETE RLS, immediate map refresh, confirmation and quota-retention warning. Read-only database audit verified delete trigger retains 24h quota. **Not real-account/phone tested.** Confirm latest Edge CORS including `x-client-info`, signed-in POST, map privacy and moderation; no test report deletion was performed.
- **Comments:** **CODE STAGED** owner Edit (within 30 min, unflagged only) and Delete controls in Profile → My Comments using verified existing `dd_edit_my_comment` and `dd_delete_my_comment` RPCs. Confirm before delete; retain all server moderation rules. **No real edit/delete submitted in tests**; verify real-account behavior and counts.
- **Research documents:** **CODE STAGED** move private cloud documents to Recently deleted, restore, and guarded permanent purge from Hub; reuse existing RLS/owner RPCs. Media-bearing purges are server-blocked, not bypassed. Local copies not touched. **No real-user restore or purge tested**; verify Studio library refresh/export/recovery and private asset linkage.
- **My Research Hub:** **CODE STAGED** six native keyboard-accessible collapsible panels via `<details>/<summary>`; default closed; live account summary and owner Admin Centre stay independent. Existing private lists were not rewritten. Await GitHub-only CI and Samsung/desktop acceptance before marking done.
- **Email backups:** **CODE STAGED** branded responsive dark/gold message with plain-text alternative, content-minimising body, existing JSON attachment, verified-only recipient and hourly limiter preserved. GitHub-only template contract check added. **Not yet deployed to Supabase Edge or delivery-tested.**
- **Usernames:** existing `dd_public_names` has generated unique `name_key` and opt-in display policies. Verify *duplicate rejection* and proper error messages with two real test accounts before changing DB schema.
- **Watch & Read / Videos / LIVE:** verify labels, podcast variety, buttons, fullscreen back handling, archived comments/chat, original source links and autoplay/YouTube behavior. Existing site calls Podcasts; do not reimplement an already-correct chip. Test on Samsung.
- **LIVE hearing discovery:** check the separate Congress candidate workflow and controlled approval-to-public-event process, realistic countdown/link/home notice, cancellation, 48h removal, archived hearing recordings with original chat, no fictitious dates.
- **Sources & Archives:** finish checking the staged directory, source URLs and rights, responsive search/filter and sitemap. Do not copy or republish Canadian/Brazilian archive originals without checking permissions.
- **Community Rules, tour and controls:** **CODE STAGED** corrected active-versus-planned community notice, outlined future Discussions stewards and 1:1 consent-based Chat, while preserving 11 currently live tabs. GitHub-only policy regression added. Still verify full-site tour (including future 12-tab changes only after approved backend), guest read-only vs signed-in, account separation, keyboard/screen-reader and mobile/device flows.
- **World map/archives:** extend case coverage toward the agreed long-term 100k goal through existing bulk-import + de-duplication, provenance and batching; check current count rather than assuming; preserve UK/Ireland and global coverage, no duplicate ingestion or privacy violations.

**Release blockers:** real registered-user browser/HTTP and Samsung tests; public/owner/guest permission tests; safe report delete/edit and comment workflow; backup/recovery test; unique username test; LIVE/countdown/chat QA; responsive, performance and accessibility checks. Verify any missing feature in code before marking it incomplete.

### 4B. Five approved *post-launch* research enhancements — roadmap, NOT delivered

All five were approved on 2026-11-03 and are documented in [the original roadmap](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md). Their previous document calls them *post-launch*. Newer user direction says finish the **current agreed roadmap** before the next website update. Reconcile their order with the current QA/release scope before expanding work: do not silently convert future research phases into blockers for a finished beta or promise that they already exist.

1. **Case Intelligence / Investigate:** source-grounded related cases, timeline, articles, media, similar/duplicate labels, evidence provenance.
2. **What was in the sky?:** optional aircraft/satellite/meteor/weather/launch context with historical-data and timezone limitations, not automatic “explanations”.
3. **Independent witness matching:** city/region/time only, confidence caveats, opt-in contact, anti-harassment and independence checks.
4. **Evidence quality / case status:** evidence-completeness checklist, chain of custody, alternate hypotheses, changes/corrections, no “alien probability”.
5. **Publish an Investigation:** private W.NE copy → redaction preview → explicit owner Publish; citations, history/corrections, PDF/DOCX; prevent private Boards/docs leakage.

Retain these in existing sections/tools, not five new navigation tabs. Before building any part, inspect current Evidence Connections / comparison / research/export implementations to avoid duplication.

### 4C. Private one-to-one user messaging — BACKEND CANDIDATE + DISABLED UI STAGED / NOT APPLIED

**Requested 2026-11-03:** Add a **Chat** section *within* the existing **Profile / My Research Hub**, using its expandable card pattern and an embedded conversation window. No separate chat page or chat-specific navigation tab (the separately approved Discussions tab will be the site's future twelfth tab), and **no group chats**. Include **Accepted chats** and **Pending requests** (incoming and sent), with an unread indicator and a message pane in the same Profile section.

**Consent-first start:** A signed-in, non-anonymous registered user may find an eligible **opted-in public username** and send **exactly one initial message as a chat request**. Recipient sees *only that first message as a request preview*, with **Accept** or **Decline**. Sender may not continue the conversation or send follow-ups while pending. Only acceptance enables a persistent private two-way conversation visible to the two members; a declined request does not become a chat.

**Privacy / abuse controls:** Usernames must be unique and discoverable for chat only with explicit opt-in, reusing existing `dd_public_names` and existing Auth rather than creating an unrelated profile directory. Do not expose emails, underlying auth UUIDs, private Boards/research or location. RLS and server-side checks must restrict request/chat/message access to the two participants and prevent the sender from self-accepting, bypassing a decline, spam-retrying or contacting a blocked account. Include **Block** and **Report** controls, request rate limits, anti-harassment restrictions, refusal without mandatory explanation, and appropriate moderation/report review without routine moderator access to everyone's private conversations. No unsolicited group broadcasts; no attachments initially.

**User experience / device:** Inside Profile: an expandable Chat panel with Accepted | Pending (received/sent) states, a selectable conversation list, and a scrollable message window/composer in the *same panel* after acceptance. Inbound pending shows only the submitted preview and Accept/Decline actions. Safe markup/text rendering, touch/keyboard accessibility, responsive mobile, unread state and cross-device consistency; Android should receive the same functionality after website QA. Notifications should be opt-in if added.

**Build / acceptance status:** A **review-only SQL backend candidate** now exists in `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`, with GitHub-only structural tests; it has **NOT** been applied or verified against a live/staging database. Disabled Profile UI and feature-gated independent contact opt-in source are staged; feature activation, schema testing, real 1:1 messages and security QA remain pending. Feature remains approved for the **current consolidated roadmap** before the next coordinated website release. Inspect the existing LIVE hearing chat and community identity primitives first to reuse safe code patterns **without conflating public LIVE chat and private messaging tables**. Build on the unpublished website branch, test with synthetic multi-account scenarios (pending/accept/decline/block/report/unauthorised read, spam caps, simultaneous requests), RLS audit, Samsung/desktop QA; then port to Android and prepare the Play release. **Do not migrate the live database or deploy Netlify merely to record this feature.** Detailed requirement/acceptance record: [Private Chat roadmap](docs/PROFILE_PRIVATE_CHAT_ROADMAP_2026-11-03.md).

### 4D. User-created Discussions tab — FRONTEND STAGED/DISABLED; BACKEND SQL CANDIDATE UNAPPLIED

**Requested 2026-11-03:** Add **Discussions** as a separate **12th** main tab in the future combined website release (proposed after Witness, before Watch & Read). The **current live site still has 11 tabs**. This deliberately authorises a new navigation tab, unlike private Profile Chat (which stays inside Profile). Users create public topic sections and then posts, threaded discussions and shareable source links inside them. Guests can read published public discussions; registered users can post, reply, vote and flag. Avoid duplicating current case/news/video comment threads and LIVE chat.

**Governance:** A section creator becomes a **scoped section steward**, not an unchecked moderator. They may manage section description/tags, pin a few posts, flag issues and **escalate directly to overall site admin**. They cannot ban critics, gatekeep post approval, permanently hide/delete somebody else's content or grant themselves more powers. Continue **five distinct user flags → temporarily hidden pending review**; dislikes are not flags. Serious safety/privacy cases need urgent report routing without waiting for five flags. Narrow emergency safety holds are a design proposal only and require time limits, owner review, audited reason and appeals before any approval.

**User protection:** registered Auth + safe unique aliases, RLS author/steward/site-owner separation, duplicate/name/rate/spam guards, links/XSS security, appeals, owner moderation override and steward revocation without deleting community content. Public-by-default sections, no private groups or paid gatekeeping in v1. Owner moderation must remain effective; steward abuse must be reversible.

**Status:** Responsive frontend and gated navigation CODE STAGED behind `discussions:false`; a **review-only** database schema/RPC candidate is staged in `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`, but has NOT been applied or exercised. No visible 12th tab, no deployment. The staged client is NOT usable without separately reviewed server permissions. Build and test on unpublished branch with fake multi-account permissions, keyboard/phone acceptance and GitHub-only CI before one combined website release; port to Android after website approval. See [full Discussions roadmap and acceptance criteria](docs/COMMUNITY_DISCUSSIONS_ROADMAP_2026-11-03.md).

## 5. Release plan: website first, then Android / Google Play

**Additional scope already approved:** consent-first private 1:1 messaging embedded within Profile (Section 4C, no extra chat tab) **and** new public user-created Discussions as a separately approved **12th main tab** (Section 4D). Both belong to the consolidated website roadmap with abuse/security tests and later Android parity. Current `production` remains the original 11-tab version.

**Phase 1 — Unpublished website development:** work only on `feature/sources-archives-next-batch-nov03` or a clearly documented child; integrate already-staged Sources & Archives plus agreed feedback without duplicating the 11-tab production features. Update master after each milestone. Keep Netlify and public domain unchanged.

**Phase 2 — Consolidated website QA/release:** run GitHub-only checks; audit actual Supabase/RLS/API; create one deliberate staging preview only after approval; human-test signed-in/guest/owner, two-account separation, camera/media, live chat, sources, submissions, editing/deletion and backups on Samsung S24 Ultra, and keyboard/desktop. Preserve fixes and bug list, then seek approval for one combined `production` release. Do not assume green CI equals mobile acceptance.

**Phase 3 — Android parity port:** compare `production` merged website with `android/play-internal-candidate-oct31`; bring across all approved current web assets, URLs, session/auth, Research Studio navigation, map/Leaflet, login, comment/witness moderation, LIVE replay, notifications and offline/fallback behavior. Avoid overwriting Android native capabilities or reverting website features. Verify app-specific origin/CORS, WebView cookies/storage, deep-links/back gestures, notification and playback behavior, mobile menu/profile, updates, account and privacy.
 
**Phase 4 — Play internal test and release preparation:** check Gradle/Android SDK, app ID, target API and Play policy requirements on actual release date; securely configure signed Android App Bundle (AAB) using existing manual `.github/workflows/android-play-internal-aab.yml`; check Play App Signing, release keys, version codes, app icon, screenshots, listing, privacy/data safety, consent/ads implementation, support URL, testing track eligibility, crash-free smoke and multi-device tests. Run internal/closed testing first; production publication requires explicit separate approval. Never publish a debug-signed APK as Play release.

## 6. Known source paths and supporting records

- Website: `index.html`, `cloud-boards.js`, `assets/*`, `community-rules.html`, `privacy.html`, `sources.html`, `research/*`, `supabase/*`.
- Research Studio: `research/wne.html`, `research/research-workspace.html`, `research/research-site-nav.js`, cloud/local bridges and canonical Research Edition source.
- Backend: `supabase/functions/dd-witness-submit/index.ts`, `supabase/functions/email-board-backup/index.ts`; reviewed migrations in `supabase/`.
- Tests: `scripts/test_sources_directory.cjs`, `scripts/test_research_hub.cjs`, `scripts/test_community_http.mjs`, `scripts/test_witness_community.cjs`, `scripts/test_live_chat_archive.cjs`, `scripts/test_wne_site_integration.cjs`, `scripts/smoke_wne_website.mjs`.
- Exact test/background history: [LIVE/community handover](docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md), [Community backend QA](docs/COMMUNITY_BACKEND_QA_2026-11-03.md), [W.NE integration handover](docs/WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md), [beta feedback fixes](docs/BETA_FEEDBACK_FIXES_2026-11-03.md), [LIVE archive specification](docs/LIVE_CHAT_ARCHIVE_RELEASE.md), [post-launch research phases](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md), [Android release checklist](RELEASE_READINESS.md).
- Existing original four continuity files on the old `main` branch contained rules, development handover, feature registry and memory, but were not copied into the active `production` baseline. This commit installs short same-name pointers to THIS master file on the current staged branch. Their prior detailed records are historical.

## 7. Invariant acceptance checklist — before any public/Play release

- [ ] Confirm exact branch and HEAD; no unexpected merge, deployment or automation run.
- [ ] Current 11 tabs, original W.NE UI and existing features present; no UI/code leak, duplicate editor or blank sections.
- [ ] Users/auth/session: guest read-only; private documents and Boards segregated; logout/login and restore correct.
- [ ] Supabase RLS/permission tests for anonymous, signed-in owner and unrelated registered user; server guards enforced.
- [ ] Witness city privacy, 3/24h, duplicates, vote/flag, five distinct flags, restore baseline, user report deletion/withdraw and owner moderation.
- [ ] Comment/public username create/display/edit/delete, counts and flags safely validated; public raw IDs/emails remain hidden.
- [ ] LIVE official verification, homepage 48h notice, timezone, recordings, archival chat and moderation.
- [ ] News/Archive/Map/Videos/Watch & Read/Explore/Profile/Research Studio/Boards fully function on phone + desktop.
- [ ] Cloud save, editor save-before-navigation, export/import, backup email and recovery tests, with disposable copies.
- [ ] Source links and reproduction rights; accessible/tappable controls, mobile layouts, performance, legal/privacy text.
- [ ] One final combined staging run and human acceptance before separate production authorisation.
- [ ] After website approval: Android native parity, signed AAB, notifications, ads/consent, Play internal track acceptance before Play production approval.

## 8. Exact next task for the next chat

1. Read **this master file** plus any specific linked QA record needed for the imminent milestone; fetch GitHub's **actual** `production`, `feature/sources-archives-next-batch-nov03` and Android candidate heads and compare them before coding.
2. Continue the **current unpublished website QA/repair queue** from Section 4A, starting with code audit of deletion/edit permissions and Research Hub collapsing plus the latest reported witness/mobile issue. Do not duplicate existing feature implementations.
3. Work in an unpublished branch, run targeted tests and verify no Netlify/public deploy. At each completed milestone, **edit this master file in the same milestone**, including exact SHA, tests and blocker status.
4. Only after the website roadmap and cohesive QA/release are approved, reconcile and prepare Android for Play internal testing; never skip website-to-Android parity verification.

. Changed seven `do # Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

## 3. Last verified milestone (most recent first)

- **2026-11-03, expanded isolated forum SQL test fixture delimiter fix STAGED:** new run `41688410287` FAILED in test script after original integration tests passed; seven newly added `do $` blocks were changed to `do # Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 by JavaScript replacement-string expansion during source construction. Corrected all test script delimiters using literal split/join and added guard tests; no schema change; CI pending.

- **2026-11-03, isolated PostgreSQL Discussions CI GREEN:** Docker/PostgreSQL 17 run `41687803769` SUCCESS at implementation SHA `102fc572a405ee298b81f9fad8ee92388bb8dc4a`; synthetic users verified section creator vs ordinary poster, scoped Pin, site-owner role, guest safe RPC/raw-table denial, first and second 5-distinct-flags hide cycles, owner restore and steward revocation. Paired GitHub static QA run `41687803846` SUCCESS. **Only disposable DB; real Supabase remains untouched.** Expanded reply/escalation test coverage now staged and pending a new run.

- **2026-11-03, isolated PostgreSQL steward Pin runtime fix STAGED:** run `41687573826` **installed candidate SQL successfully** into disposable DB, then synthetic role tests failed due ambiguous `section_id` variable in Pin RPC at line 14. Renamed local variables `v_section_id` in Pin and Escalate RPCs to prevent column/variable conflicts. CI rerun pending. No live DB change.

- **2026-11-03, isolated SQL owner-function footer fix STAGED:** run `41687262065` failed on remaining `end $;` close in final owner-sections function. Root cause was JavaScript string replacement interpreting `$` as a single literal dollar during source generation. Replaced via a function callback, verified correct `end $;` byte-for-byte; rerun CI pending. No live DB changes.

- **2026-11-03, PostgreSQL owner-function delimiter correction STAGED:** isolated CI `41687005397` reached the later owner functions but failed SQL parse at line 548 because the owner queue and owner sections functions each had a single `# Disclosure Desk — MASTER HANDOVER (authoritative)

**Updated:** 2026-11-03 UTC  
**Owner/product:** Boyd Digital Studios — Disclosure Desk  
**Status:** Active development. The public 11-tab website and the unpublished next-batch branch are **different release states**. No deployment is authorised by this document.

> **START EVERY NEW CHAT HERE.** Read this whole file before changing anything. Inspect current GitHub refs and source code; document reality rather than trusting an outdated paragraph. This file supersedes all older instructions where they conflict. The four legacy continuity filenames in this repository redirect here. Update this file **immediately after EVERY milestone**, not merely at the end of a conversation.

## 1. Canonical repositories, refs, and release boundaries

| Concern | Source of truth | Current evidence / rule |
|---|---|---|
| Disclosure Desk website and Android project | `boydamo84-coder/disclosure-desk-preview` | **Do not use its outdated `main` as the current website.** |
| Current website release baseline | `production` | 11-tab combined release, head `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` when last checked 2026-11-03. Recheck SHA at next session. |
| Current unpublished website work | `feature/sources-archives-next-batch-nov03` | Built atop `production`; pre-documentation head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`. Update this SHA after changes and recheck branch history. |
| Earlier website research integration | `feature/research-studio-bds-production-based` | Historical; PR #2 merged into `production` at 08:02 UTC on 2026-11-03. Do not treat it as an open draft PR. |
| Original W.NE Research Edition | `boydamo84-coder/WNE-Research-Edition` | Canonical pre-existing W.NE-derived UI and exports. Inspect before porting features. |
| Original W.NE author product | `boydamo84-coder/W.NE` | **Do not edit as part of Disclosure Desk.** |
| Legacy separate research/news repository | `boydamo84-coder/disclosure-desk` | Contains older automation work; not the present 11-tab website source. Cross-check before touching. |
| Android Play internal candidate | Branch `android/play-internal-candidate-oct31` in website repo | Exists, with manual `.github/workflows/android-play-internal-aab.yml`. **Diverged substantially from website `production`; not release parity.** |
| Backend | Supabase Disclosure Desk project `omqxizswzcwgzqaczlhe` | Never operate on separate Our Cinema data/project. No service-role credentials in clients or Git. |
| Public domain | `https://uapdisclosuredesk.com` | Live changes require separate deliberate release approval. Git commits, CI, staging preview, backend migration and live site are distinct. |

**Verified correction:** PR #2, “Disclosure Desk public release — Community, Research Hub, LIVE archive and tour”, is CLOSED/MERGED. Its PR describes production authorisation, backend migrations and a combined preview, with outstanding real-account witness acceptance. Earlier 2026-11-03 handover paragraphs stating PR #2 is draft or witness/LIVE tables are wholly uninstalled are **historical, not current**. The last known stage has an installed community/LIVE backend, but verify present backend and user-facing status before claiming a specific operation works.

**Current 11 tabs in order:** News, Archive, W.NE, Map, Videos, LIVE, Boards, Witness, Watch & Read, Explore, Profile. Profile is last. W.NE has the matching save-guarded dock and hide/show toggle; top-right avatar is hidden inside W.NE. No new main tabs for roadmap features without a product decision.

## 2. Non-negotiable working and safety rules

1. **Read first, inspect next, edit last:** read this master handover; inspect changed branches, latest commits, workflows, existing implementation, test fixtures and any relevant detailed QA log. Never assume a feature is missing simply because an earlier chat planned it.
2. **Single canonical W.NE Research Edition:** reuse its established split-screen workspace, existing report functions, local/cloud boundaries, import/export and citation features. Do not create a replacement or second simplified editor. Do not modify original W.NE.
3. **Data isolation:** preserve Supabase Auth accounts, user-owned documents, private `investigation_boards`, backup/recovery and RLS. Use synthetic test accounts/data, rollback-only SQL tests, least privilege, private by default. No destructive tests on real content.
4. **Community privacy and moderation:** signed-in registered users alone may publish, comment, vote or flag. Public witness map locations only at town/city-level; no precise coordinates, private addresses or contact details. Three new reports per rolling 24 hours. Five **distinct** registered flags temporarily hide an item for moderator review; dislikes are not flags. Show only opted-in aliases, never public email/author UUID or hidden private content. Owner moderation must be verified server-side, not inferred from UI.
5. **LIVE:** only official verified hearing announcements are scheduled. Countdown has timezone-qualified date, official link and no invented event times; News banner expires 48h after event start. Attach *actual* approved hearing recordings and their own saved moderated chat; ended-event chat is read-only. Do not fabricate historical conversations or copy copyrighted video.
6. **Research publication:** all W.NE documents, notes and Boards are private by default. `researchPublishing:false` until explicit opt-in preview/redaction/authorisation and comprehensive privacy QA.
7. **Site scope:** Disclosure Desk is independent of THE UNKNOWN novel, original W.NE, Our Cinema and other BDS projects. Changes and Supabase queries must be scoped accordingly.
8. **Release budget:** conserve Netlify build credits. Develop on the unpublished branch and test with GitHub-only Actions/local checks; batch coherent changes. **No opportunistic production merge, live publish, or Netlify staging build.** Check build triggers before pushing and obtain explicit release approval when ready.
9. **Verification words are strict:** distinguish PLANNED, CODE STAGED, CI GREEN, BACKEND APPLIED, PREVIEW TESTED, SAMSUNG VERIFIED, LIVE RELEASED and PLAY INTERNAL TESTED. A commit or simulated RLS test is not an end-to-end test.
10. **Master-handover discipline:** after every verified milestone, update Sections 3–8 and append the exact entry in Section 9 in the SAME development batch, citing branch, SHA, test outcome and release status. If work is incomplete, record blocker and next step; never call it done. Keep historical detailed docs as evidence, not competing instructions.

 rather than `$` body opening (and one closing). Both repaired; static regression now rejects unmatched delimiters. Rerun pending; NO live database changes.

- **2026-11-03, isolated SQL parser correction STAGED:** run `41686804284` FAILED on a PL/pgSQL `IF` conditional using an unparenthesised `CASE` expression in `dd_discussions_edit_own`. Replaced it with independent validated thread/reply length guards and updated static assertions. **Test now rerunning; do not claim backend ready.** No live data touched.

- **2026-11-03, isolated Discussions PostgreSQL security workflow CODE STAGED:** Docker PostgreSQL 17 GitHub Action will run candidate SQL in a disposable database with synthetic Auth roles/users, test guest raw-table denial, nonsteward pin denial, owner review, author posting/replies and two rounds of five distinct flags. Trigger restricted to the review SQL/test files and workflow itself; **no connection to live Supabase, no Netlify deploy**. Workflow result pending; errors must be fixed before treating SQL as executable.

- **2026-11-03, Discussions overall-admin view CODE STAGED / DISABLED:** owner-only review pane inside existing Profile/Admin Centre displays hidden/escalated threads/replies, limited excerpts and escalation reasons, with Restore/Hide/Remove decisions requiring reasons. Owner can revoke a section steward without deleting their section. Server-side owner-only RPC candidates are reviewed SQL source only; no owner allowlist seeded, schema installed or live moderation performed. GitHub-only CI pending.

- **2026-11-03, Discussions owner/author/steward polish CODE STAGED / DISABLED:** added verified-author Edit/Withdraw buttons, removable votes, steward section description/topic settings and focused thread/reply navigation; corrected schema candidate to preserve a five-**new**-flags threshold after owner restoration, rather than instantly rehiding on an old tally. Backend is still **UNAPPLIED**, GitHub-only CI pending; no user access or database modifications.

- **2026-11-03, Discussions test-file syntax correction STAGED:** GitHub run `41685385409` FAILED on an unescaped apostrophe in one newly appended JS assertion, not on application code. Fixed the assertion string and parsed the full test source with `new Function`; rerun CI before calling this milestone green.

- **2026-11-03, Discussions candidate safety review CORRECTION STAGED:** verified GitHub-only contract run `41685136138` passed previous SQL source; identified and patched review-only edge cases: anonymised users should not block section/account deletion or report flagging, withdrawn topics must satisfy nonempty constraints, post edits retain original length limits, and owner queue now includes both hidden/escalated **threads and replies**. Corrected source **still unapplied and not database-tested**. CI pending.

- **2026-11-03, Discussions backend review SOURCE STAGED, UNAPPLIED:** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` proposes section/reply/topic tables with RLS, guest-only safe read projections, registered-only posting and votes, five-distinct-flags temporary hide, limited steward Pin/Escalate, owner-only moderation/role replacement, abuse rate limits and audit trails. No DB schema was installed; GitHub-only source contract added, CI pending; isolated SQL/role tests required.

- **2026-11-03, Discussions frontend CODE STAGED / DISABLED:** responsive section discovery, new-section form, topic posts, reply pane, safe source links, registered posting, user votes/flagging, scoped section-steward pin and escalate actions added in `assets/community-discussions.js` and `index.html`. The module returns immediately when `discussions:false`; no twelfth tab or public RPC calls. **Backend methods not yet implemented.** GitHub-only JS/static UI test added; CI pending and no deployment.

- **2026-11-03, separate private Chat contact opt-in CODE STAGED / DISABLED:** public username management now conditionally shows an independent "allow private chat requests" checkbox, persisting `chat_contact_opt_in` only when `privateChat:true`. With the current **false** flag, existing username reads/writes remain unchanged and never query the unapplied column. GitHub-only source test updated; no backend applied, public feature or messaging.

- **2026-11-03, Profile Chat accordion static-test correction STAGED:** initial GitHub-only run `41683343386` failed because assertion matched `class` as the first attribute, while the new Chat `<details>` intentionally begins with an accessible `id`. Updated regex to accept safe attribute order and still assert seven sections. Re-run pending; no live UI or backend enabled.

- **2026-11-03, disabled Profile Chat test coverage STAGED:** added GitHub-only static test covering accepted-only composer, recipient acceptance, flagged-off state, RPC method signatures and textContent rendering; no database writes/real chat. Workflow results pending for this commit. Original backend candidate remains unapplied.

- **2026-11-03, Profile Chat UI source STAGED / DISABLED:** a seventh native collapsible Hub section houses accepted/pending lists and inline conversation/preview/composer; source-based client actions for invite, accept/decline, block and report. Separate `privateChat:false` and `discussions:false` flags protect the live 11-tab experience; the chat schema remains UNAPPLIED and no messaging is usable. Await GitHub-only CI and isolated backend/RLS testing before activation.

- **2026-11-03, private 1:1 Chat database foundation CODE STAGED / UNAPPLIED:** staged security-reviewed candidate SQL (`supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`) for separate chat opt-in, one introductory preview, recipient-only accept/decline, participant-only accepted messages, anti-repeat pair uniqueness, request/message rate limits, blocks and limited excerpt-only owner reports. CI tests are static, **NOT SQL execution or authenticated security tests**. Website feature remains disabled; no Supabase migration was applied. This is a candidate requiring independent SQL/RLS review and an isolated database test before activation.

- **2026-11-03, Community Rules current-vs-future wording CODE STAGED:** obsolete "private drafts only" notice replaced with feature-flag-aligned status; planned Discussions and consent-only private Chat policy and scoped steward limits added, plus GitHub-only source check. No publication. CI pending.

- **2026-11-03, email backup presentation CODE STAGED:** new static responsive Disclosure Desk/BDS-branded HTML and text email, existing attachment/auth/hourly limit unchanged. Template regression added to GitHub-only staging workflow. Not deployed to Edge and no real email sent. CI pending.

- **2026-11-03, QA correction STAGED:** new account-owned controls added a nested Recently deleted panel (6 main accordions + 1 nested). First GitHub run `41678969054` failed only on an outdated count-of-closing-tags assertion. Test corrected to seven; local static assertions PASS. Await GitHub-only rerun before claiming green.

- **2026-11-03, private-content management CODE STAGED:** existing Supabase backend checked read-only. Confirmed `dd_delete_my_comment`, `dd_edit_my_comment` (30-minute/unflagged), owner-only witness DELETE with retained 24h quota, and research trash/restore/purge RPCs. Added Profile/Hub UI against existing backend in code commit `0cb9dcafe93495c213f98e4c4bcf778c62d733ca`. No new DB policies/tables or real user writes; awaiting CI and Samsung real-account acceptance.

- **2026-11-03, My Research Hub collapsible UI STAGED:** six native keyboard-accessible expand/collapse sections implemented on unpublished branch, code commit `2dd0efeba5a36648bdd71048348ea0af8e445812`; static regression added to GitHub-only staging QA. Not yet marked CI GREEN, not Samsung-tested, not deployed. Existing account summary, private lists, backend and Admin Centre unchanged.

- **2026-11-03 16:29 UTC, Sources & Archives GitHub-only CI:** branch `feature/sources-archives-next-batch-nov03` head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`; Actions run `41674655120` SUCCESS. This is **source/CI validation, not Samsung QA or a deployment**.
- **Sources & Archives build staged:** `sources.html` with 13 reviewed country-level official/independent archive sources, country/type filtering, search, citation/right-to-reproduce cautions, Brazil SIAN guidance; About/Explore/Documents routes and sitemap wired. Test `scripts/test_sources_directory.cjs`; workflow `validate-sources-directory-staged.yml`. No PR or deployment for this branch. External links, accessibility and phone experience still require final acceptance.
- **2026-11-03 08:02 UTC, combined 11-tab website release:** PR #2 merged to `production`. PR describes news/archive/videos/Watch & Read discussions, likes/dislikes, five-flag moderation, witness public reports, W.NE Research Studio, My Research Hub/Profile, owner Admin Centre, LIVE hearing archive, refreshed tours, Podcasts chip, and backend migrations. CI run `41599937501` is described as successful in the merged PR. **Do not assume every real-account/mobile flow is verified.** Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` was confirmed again in this session.
- **Existing Android candidate:** `android/play-internal-candidate-oct31` includes Android wrapper/notification plumbing and a manual signed AAB workflow requiring Play upload-signing secrets. Website vs Android branch comparison shows large divergence (121 commits ahead, 198 behind at last check). Do **not** build Play release from that branch without intentional reconciliation, native regression and signing checks.

## 4. Current priority: complete the agreed website roadmap BEFORE the next update

**Release rule:** collect work into the next significant unpublished batch, preserving 11 tabs and all tested capabilities. No individual feature deployment.

### 4A. Current QA/repair and polish queue — verify existing behavior first

- **Witness Reports:** **CODE STAGED** owner's `Delete report` in private Profile via existing owner DELETE RLS, immediate map refresh, confirmation and quota-retention warning. Read-only database audit verified delete trigger retains 24h quota. **Not real-account/phone tested.** Confirm latest Edge CORS including `x-client-info`, signed-in POST, map privacy and moderation; no test report deletion was performed.
- **Comments:** **CODE STAGED** owner Edit (within 30 min, unflagged only) and Delete controls in Profile → My Comments using verified existing `dd_edit_my_comment` and `dd_delete_my_comment` RPCs. Confirm before delete; retain all server moderation rules. **No real edit/delete submitted in tests**; verify real-account behavior and counts.
- **Research documents:** **CODE STAGED** move private cloud documents to Recently deleted, restore, and guarded permanent purge from Hub; reuse existing RLS/owner RPCs. Media-bearing purges are server-blocked, not bypassed. Local copies not touched. **No real-user restore or purge tested**; verify Studio library refresh/export/recovery and private asset linkage.
- **My Research Hub:** **CODE STAGED** six native keyboard-accessible collapsible panels via `<details>/<summary>`; default closed; live account summary and owner Admin Centre stay independent. Existing private lists were not rewritten. Await GitHub-only CI and Samsung/desktop acceptance before marking done.
- **Email backups:** **CODE STAGED** branded responsive dark/gold message with plain-text alternative, content-minimising body, existing JSON attachment, verified-only recipient and hourly limiter preserved. GitHub-only template contract check added. **Not yet deployed to Supabase Edge or delivery-tested.**
- **Usernames:** existing `dd_public_names` has generated unique `name_key` and opt-in display policies. Verify *duplicate rejection* and proper error messages with two real test accounts before changing DB schema.
- **Watch & Read / Videos / LIVE:** verify labels, podcast variety, buttons, fullscreen back handling, archived comments/chat, original source links and autoplay/YouTube behavior. Existing site calls Podcasts; do not reimplement an already-correct chip. Test on Samsung.
- **LIVE hearing discovery:** check the separate Congress candidate workflow and controlled approval-to-public-event process, realistic countdown/link/home notice, cancellation, 48h removal, archived hearing recordings with original chat, no fictitious dates.
- **Sources & Archives:** finish checking the staged directory, source URLs and rights, responsive search/filter and sitemap. Do not copy or republish Canadian/Brazilian archive originals without checking permissions.
- **Community Rules, tour and controls:** **CODE STAGED** corrected active-versus-planned community notice, outlined future Discussions stewards and 1:1 consent-based Chat, while preserving 11 currently live tabs. GitHub-only policy regression added. Still verify full-site tour (including future 12-tab changes only after approved backend), guest read-only vs signed-in, account separation, keyboard/screen-reader and mobile/device flows.
- **World map/archives:** extend case coverage toward the agreed long-term 100k goal through existing bulk-import + de-duplication, provenance and batching; check current count rather than assuming; preserve UK/Ireland and global coverage, no duplicate ingestion or privacy violations.

**Release blockers:** real registered-user browser/HTTP and Samsung tests; public/owner/guest permission tests; safe report delete/edit and comment workflow; backup/recovery test; unique username test; LIVE/countdown/chat QA; responsive, performance and accessibility checks. Verify any missing feature in code before marking it incomplete.

### 4B. Five approved *post-launch* research enhancements — roadmap, NOT delivered

All five were approved on 2026-11-03 and are documented in [the original roadmap](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md). Their previous document calls them *post-launch*. Newer user direction says finish the **current agreed roadmap** before the next website update. Reconcile their order with the current QA/release scope before expanding work: do not silently convert future research phases into blockers for a finished beta or promise that they already exist.

1. **Case Intelligence / Investigate:** source-grounded related cases, timeline, articles, media, similar/duplicate labels, evidence provenance.
2. **What was in the sky?:** optional aircraft/satellite/meteor/weather/launch context with historical-data and timezone limitations, not automatic “explanations”.
3. **Independent witness matching:** city/region/time only, confidence caveats, opt-in contact, anti-harassment and independence checks.
4. **Evidence quality / case status:** evidence-completeness checklist, chain of custody, alternate hypotheses, changes/corrections, no “alien probability”.
5. **Publish an Investigation:** private W.NE copy → redaction preview → explicit owner Publish; citations, history/corrections, PDF/DOCX; prevent private Boards/docs leakage.

Retain these in existing sections/tools, not five new navigation tabs. Before building any part, inspect current Evidence Connections / comparison / research/export implementations to avoid duplication.

### 4C. Private one-to-one user messaging — BACKEND CANDIDATE + DISABLED UI STAGED / NOT APPLIED

**Requested 2026-11-03:** Add a **Chat** section *within* the existing **Profile / My Research Hub**, using its expandable card pattern and an embedded conversation window. No separate chat page or chat-specific navigation tab (the separately approved Discussions tab will be the site's future twelfth tab), and **no group chats**. Include **Accepted chats** and **Pending requests** (incoming and sent), with an unread indicator and a message pane in the same Profile section.

**Consent-first start:** A signed-in, non-anonymous registered user may find an eligible **opted-in public username** and send **exactly one initial message as a chat request**. Recipient sees *only that first message as a request preview*, with **Accept** or **Decline**. Sender may not continue the conversation or send follow-ups while pending. Only acceptance enables a persistent private two-way conversation visible to the two members; a declined request does not become a chat.

**Privacy / abuse controls:** Usernames must be unique and discoverable for chat only with explicit opt-in, reusing existing `dd_public_names` and existing Auth rather than creating an unrelated profile directory. Do not expose emails, underlying auth UUIDs, private Boards/research or location. RLS and server-side checks must restrict request/chat/message access to the two participants and prevent the sender from self-accepting, bypassing a decline, spam-retrying or contacting a blocked account. Include **Block** and **Report** controls, request rate limits, anti-harassment restrictions, refusal without mandatory explanation, and appropriate moderation/report review without routine moderator access to everyone's private conversations. No unsolicited group broadcasts; no attachments initially.

**User experience / device:** Inside Profile: an expandable Chat panel with Accepted | Pending (received/sent) states, a selectable conversation list, and a scrollable message window/composer in the *same panel* after acceptance. Inbound pending shows only the submitted preview and Accept/Decline actions. Safe markup/text rendering, touch/keyboard accessibility, responsive mobile, unread state and cross-device consistency; Android should receive the same functionality after website QA. Notifications should be opt-in if added.

**Build / acceptance status:** A **review-only SQL backend candidate** now exists in `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`, with GitHub-only structural tests; it has **NOT** been applied or verified against a live/staging database. Disabled Profile UI and feature-gated independent contact opt-in source are staged; feature activation, schema testing, real 1:1 messages and security QA remain pending. Feature remains approved for the **current consolidated roadmap** before the next coordinated website release. Inspect the existing LIVE hearing chat and community identity primitives first to reuse safe code patterns **without conflating public LIVE chat and private messaging tables**. Build on the unpublished website branch, test with synthetic multi-account scenarios (pending/accept/decline/block/report/unauthorised read, spam caps, simultaneous requests), RLS audit, Samsung/desktop QA; then port to Android and prepare the Play release. **Do not migrate the live database or deploy Netlify merely to record this feature.** Detailed requirement/acceptance record: [Private Chat roadmap](docs/PROFILE_PRIVATE_CHAT_ROADMAP_2026-11-03.md).

### 4D. User-created Discussions tab — FRONTEND STAGED/DISABLED; BACKEND SQL CANDIDATE UNAPPLIED

**Requested 2026-11-03:** Add **Discussions** as a separate **12th** main tab in the future combined website release (proposed after Witness, before Watch & Read). The **current live site still has 11 tabs**. This deliberately authorises a new navigation tab, unlike private Profile Chat (which stays inside Profile). Users create public topic sections and then posts, threaded discussions and shareable source links inside them. Guests can read published public discussions; registered users can post, reply, vote and flag. Avoid duplicating current case/news/video comment threads and LIVE chat.

**Governance:** A section creator becomes a **scoped section steward**, not an unchecked moderator. They may manage section description/tags, pin a few posts, flag issues and **escalate directly to overall site admin**. They cannot ban critics, gatekeep post approval, permanently hide/delete somebody else's content or grant themselves more powers. Continue **five distinct user flags → temporarily hidden pending review**; dislikes are not flags. Serious safety/privacy cases need urgent report routing without waiting for five flags. Narrow emergency safety holds are a design proposal only and require time limits, owner review, audited reason and appeals before any approval.

**User protection:** registered Auth + safe unique aliases, RLS author/steward/site-owner separation, duplicate/name/rate/spam guards, links/XSS security, appeals, owner moderation override and steward revocation without deleting community content. Public-by-default sections, no private groups or paid gatekeeping in v1. Owner moderation must remain effective; steward abuse must be reversible.

**Status:** Responsive frontend and gated navigation CODE STAGED behind `discussions:false`; a **review-only** database schema/RPC candidate is staged in `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`, but has NOT been applied or exercised. No visible 12th tab, no deployment. The staged client is NOT usable without separately reviewed server permissions. Build and test on unpublished branch with fake multi-account permissions, keyboard/phone acceptance and GitHub-only CI before one combined website release; port to Android after website approval. See [full Discussions roadmap and acceptance criteria](docs/COMMUNITY_DISCUSSIONS_ROADMAP_2026-11-03.md).

## 5. Release plan: website first, then Android / Google Play

**Additional scope already approved:** consent-first private 1:1 messaging embedded within Profile (Section 4C, no extra chat tab) **and** new public user-created Discussions as a separately approved **12th main tab** (Section 4D). Both belong to the consolidated website roadmap with abuse/security tests and later Android parity. Current `production` remains the original 11-tab version.

**Phase 1 — Unpublished website development:** work only on `feature/sources-archives-next-batch-nov03` or a clearly documented child; integrate already-staged Sources & Archives plus agreed feedback without duplicating the 11-tab production features. Update master after each milestone. Keep Netlify and public domain unchanged.

**Phase 2 — Consolidated website QA/release:** run GitHub-only checks; audit actual Supabase/RLS/API; create one deliberate staging preview only after approval; human-test signed-in/guest/owner, two-account separation, camera/media, live chat, sources, submissions, editing/deletion and backups on Samsung S24 Ultra, and keyboard/desktop. Preserve fixes and bug list, then seek approval for one combined `production` release. Do not assume green CI equals mobile acceptance.

**Phase 3 — Android parity port:** compare `production` merged website with `android/play-internal-candidate-oct31`; bring across all approved current web assets, URLs, session/auth, Research Studio navigation, map/Leaflet, login, comment/witness moderation, LIVE replay, notifications and offline/fallback behavior. Avoid overwriting Android native capabilities or reverting website features. Verify app-specific origin/CORS, WebView cookies/storage, deep-links/back gestures, notification and playback behavior, mobile menu/profile, updates, account and privacy.
 
**Phase 4 — Play internal test and release preparation:** check Gradle/Android SDK, app ID, target API and Play policy requirements on actual release date; securely configure signed Android App Bundle (AAB) using existing manual `.github/workflows/android-play-internal-aab.yml`; check Play App Signing, release keys, version codes, app icon, screenshots, listing, privacy/data safety, consent/ads implementation, support URL, testing track eligibility, crash-free smoke and multi-device tests. Run internal/closed testing first; production publication requires explicit separate approval. Never publish a debug-signed APK as Play release.

## 6. Known source paths and supporting records

- Website: `index.html`, `cloud-boards.js`, `assets/*`, `community-rules.html`, `privacy.html`, `sources.html`, `research/*`, `supabase/*`.
- Research Studio: `research/wne.html`, `research/research-workspace.html`, `research/research-site-nav.js`, cloud/local bridges and canonical Research Edition source.
- Backend: `supabase/functions/dd-witness-submit/index.ts`, `supabase/functions/email-board-backup/index.ts`; reviewed migrations in `supabase/`.
- Tests: `scripts/test_sources_directory.cjs`, `scripts/test_research_hub.cjs`, `scripts/test_community_http.mjs`, `scripts/test_witness_community.cjs`, `scripts/test_live_chat_archive.cjs`, `scripts/test_wne_site_integration.cjs`, `scripts/smoke_wne_website.mjs`.
- Exact test/background history: [LIVE/community handover](docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md), [Community backend QA](docs/COMMUNITY_BACKEND_QA_2026-11-03.md), [W.NE integration handover](docs/WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md), [beta feedback fixes](docs/BETA_FEEDBACK_FIXES_2026-11-03.md), [LIVE archive specification](docs/LIVE_CHAT_ARCHIVE_RELEASE.md), [post-launch research phases](docs/POST_LAUNCH_RESEARCH_ROADMAP_2026-11-03.md), [Android release checklist](RELEASE_READINESS.md).
- Existing original four continuity files on the old `main` branch contained rules, development handover, feature registry and memory, but were not copied into the active `production` baseline. This commit installs short same-name pointers to THIS master file on the current staged branch. Their prior detailed records are historical.

## 7. Invariant acceptance checklist — before any public/Play release

- [ ] Confirm exact branch and HEAD; no unexpected merge, deployment or automation run.
- [ ] Current 11 tabs, original W.NE UI and existing features present; no UI/code leak, duplicate editor or blank sections.
- [ ] Users/auth/session: guest read-only; private documents and Boards segregated; logout/login and restore correct.
- [ ] Supabase RLS/permission tests for anonymous, signed-in owner and unrelated registered user; server guards enforced.
- [ ] Witness city privacy, 3/24h, duplicates, vote/flag, five distinct flags, restore baseline, user report deletion/withdraw and owner moderation.
- [ ] Comment/public username create/display/edit/delete, counts and flags safely validated; public raw IDs/emails remain hidden.
- [ ] LIVE official verification, homepage 48h notice, timezone, recordings, archival chat and moderation.
- [ ] News/Archive/Map/Videos/Watch & Read/Explore/Profile/Research Studio/Boards fully function on phone + desktop.
- [ ] Cloud save, editor save-before-navigation, export/import, backup email and recovery tests, with disposable copies.
- [ ] Source links and reproduction rights; accessible/tappable controls, mobile layouts, performance, legal/privacy text.
- [ ] One final combined staging run and human acceptance before separate production authorisation.
- [ ] After website approval: Android native parity, signed AAB, notifications, ads/consent, Play internal track acceptance before Play production approval.

## 8. Exact next task for the next chat

1. Read **this master file** plus any specific linked QA record needed for the imminent milestone; fetch GitHub's **actual** `production`, `feature/sources-archives-next-batch-nov03` and Android candidate heads and compare them before coding.
2. Continue the **current unpublished website QA/repair queue** from Section 4A, starting with code audit of deletion/edit permissions and Research Hub collapsing plus the latest reported witness/mobile issue. Do not duplicate existing feature implementations.
3. Work in an unpublished branch, run targeted tests and verify no Netlify/public deploy. At each completed milestone, **edit this master file in the same milestone**, including exact SHA, tests and blocker status.
4. Only after the website roadmap and cohesive QA/release are approved, reconcile and prepare Android for Play internal testing; never skip website-to-Android parity verification.

 and seven `end $;` to proper `$` using split/join; added `scripts/test_discussions_sql.cjs` regression verifying all synthetic `DO` delimiters balanced.
- Existing original isolated PostgreSQL run `41687803769` remains independently GREEN. No changes to backend candidate schema, live Supabase, website/Netlify or Android. Expanded reply/escalation CI pending.
- Next verify new PostgreSQL test, record result and any blockers.


### 2026-11-03 — Expand proven isolated Discussions SQL tests to replies and escalations
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `102fc572a405ee298b81f9fad8ee92388bb8dc4a`; resulting SHA new commit.
- Confirmed `41687803769` **SUCCESS** isolated Postgres 17 role and 5-flag integration run, and `41687803846` **SUCCESS** source regression run, both at prior SHA.
- Updated `scripts/forum-isolated-acceptance.sql` to test **reply-specific 4 vs 5 distinct flags**, limited owner queue text preview, owner restoration of reply, denial of ordinary member's steward escalation, and steward's owner-visible urgent escalation without five *new* flags. Retains synthetic IDs and isolated DB only.
- New Postgres CI pending. No SQL source, live Supabase, website production, Netlify, original W.NE or Android changes. Feature remains `discussions:false`; no 12th visible tab.
- Next: verify new CI and fix test/SQL permission failures; continue audit of owner moderation, guest read-only and cross-account author isolation before an approved consolidated release.



### 2026-11-03 — Isolated PostgreSQL steward variable scoping
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `143db9c6a1d5c05fbf36e5a5467269997901d05f`; resulting SHA new branch HEAD.
- Run `41687573826`: candidate SQL syntax and CREATE FUNCTION PASS in disposable PostgreSQL 17; synthetic registered users created public section, topic and reply, and denied non-steward Pin; valid steward Pin failed due PostgreSQL variable/column ambiguity (`where t.section_id=section_id`).
- Updated `dd_discussions_pin` and `dd_discussions_escalate` to use explicitly named `v_section_id` local variables while keeping real column identifiers unchanged. Added static regression.
- Verification: new isolated workflow pending. No live Supabase, Netlify, production branch, Android or Play changes.
- Next: complete fake-user role/5-flag/restore/admin/guest tests and document verified outcome.



### 2026-11-03 — Correct SQL dollar-close without JavaScript replacement expansion
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `f7a8a2afbe6ed7dc5bf179ed26bd988e97602c86`, resulting SHA new HEAD.
- Isolated PostgreSQL run `41687262065` FAILED because owner-sections closing delimiter was `end $;`. Root cause identified: JavaScript `String.replace(old, replacementString)` treats `$` as an escape for a single dollar. Used a **callback replacement** so literal `$` is preserved and verified after replacement.
- File changed: `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`; master handover updated. Existing static assertion rejects malformed SQL closer.
- Release: **NOT APPLIED** to live Supabase, no production/app changes. Next review isolated Docker PostgreSQL run and synthetic access tests.



### 2026-11-03 — Isolated SQL owner function delimiter fix
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `6c90c3c42d9b605bac64ff6829d95b17b6d87cb5`; resulting SHA is this new commit.
- PostgreSQL test run `41687005397` **FAILED** parsing owner queue after earlier functions compiled successfully: malformed single-dollar PL/pgSQL opening at line 546, plus same issue in owner sections at line 591. Fixed `as $` for both and `end $;` close in `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`.
- Added test in `scripts/test_discussions_sql.cjs` to detect single-dollar function delimiters and assert both owner functions use balanced `$`. JS static test parses.
- No production/backend/Netlify/Android changes; isolated GitHub PostgreSQL rerun pending. Next: inspect next CI and role acceptance outcomes.



### 2026-11-03 — Isolated PostgreSQL first execution found edit-rule SQL syntax error
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `5db7fe5454128ce8cb5e3e5d574009d11f753558`; resulting SHA is new HEAD.
- GitHub isolated Postgres 17 run `41686804284` **FAILED** while parsing `dd_discussions_edit_own`, at review SQL line 469 (`IF ... > case when ... end`); fixture and synthetic database initialized successfully, no acceptance executed.
- Fixed `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` using separate 5000-character thread/2000-character reply guards, and updated `scripts/test_discussions_sql.cjs` accordingly. Test JS source compile passed.
- No Supabase production schema/records, Netlify builds or public feature changes. New isolated workflow run pending.
- Next: inspect fresh PostgreSQL CI. Continue correcting genuine SQL/permission errors until synthetic role tests run successfully; do not mark security approved based on static source tests.



### 2026-11-03 — Isolated PostgreSQL security and moderation integration tests
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `8623fb795bb95b028db5311a285e1c86e154a40b`; resulting SHA is current commit on unpublished branch.
- Added GitHub-only workflow `.github/workflows/validate-discussions-isolated.yml`: disposable `postgres:17` service, test database `forum_test`, fixture of **synthetic** Supabase-shaped roles/auth functions/users; loads `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` into disposable CI database ONLY.
- Added `scripts/forum-isolated-fixture.sql` and `scripts/forum-isolated-acceptance.sql`: tests signed-in creator vs outsider, public posting and replying without steward preapproval, site-owner allowlist isolation, 4/5 independent flags hide semantics, restored baseline requiring five *new* flags, admin-only queue/steward revocation, guest public-RPC read and raw table denial.
- Isolation: uses fake UUIDs/no real email or customer data, `PGHOST=localhost`, no live Supabase secret, no schema/API deployment, no Netlify preview. GitHub workflow restricted to relevant changed paths for economical runs.
- Verification status at source commit: **new workflow queued/unknown**; not yet a proven SQL/RLS runtime test. Any failures must be fixed before claiming security approval. Full authenticated HTTP/device QA still pending even after SQL green.
- Next: inspect GitHub isolated PostgreSQL job and fix SQL/test errors, then document actual results and remaining privacy release blockers.



### 2026-11-03 — Overall site-owner Discussions queue and steward revocation (disabled)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `f95ece056fe2e5151a5a02860c079ad63541d76a`; new branch HEAD is resulting commit.
- New `assets/discussions-admin.js` and hidden `index.html` Admin Centre pane: authorized owner can review hidden/escalated threads/replies with limited post excerpts/urgent steward reasons, choose Restore/Hide/Remove with documented explanation, and revoke abusive stewards while leaving sections and other members' posts untouched. App code renders user content with `textContent`, refuses anonymous users and calls privileged RPCs.
- **Unapplied** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` expands owner queue with limited excerpt/reason and owner-only section/steward list RPC. Admin permission stays in separate `dd_forum_owner_admins` server table (no owner IDs hard-coded or seeded). `scripts/test_discussions_admin.cjs` and GitHub-only QA check added.
- Preserves the 11-tab deployed release and `discussions:false`; no public access, no Supabase DB changes, no Netlify builds/production merge, no Android/Play updates. **CI pending; DB/RLS runtime tests and safe data-retention/correction policy still required.**
- Next: verify CI and review any security/test issues; build isolated multi-user role tests; coordinate full beta/phone QA and one combined website release only after approval.



### 2026-11-03 — Discussions author controls, steward settings and reviewed-flag baseline
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `deb63dbe86eec5feb5d4e394feae8c74b58f1725`; resulting SHA is new GitHub HEAD.
- Implemented in staged disabled `assets/community-discussions.js` and `index.html`: owners can edit (first 30 minutes) or withdraw their own posts/replies using owner RPCs; users can toggle a vote back to zero; section stewards can update description/topic but not control membership; viewing a discussion hides background topic list; UI checks RPC false results instead of claiming success.
- Updated **unapplied** `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql`: reader receives `my_vote` for their own vote only, plus `reviewed_flag_count` per post/reply. On owner restore, flag baseline advances, so another **five new distinct flags** are required to temporarily hide previously reviewed content. Added GitHub-only structural test coverage.
- Verification: JS and test source parsed via `new Function`; CI pending; no isolated SQL execution, real-account browser QA, RLS or concurrency testing.
- Release unchanged: site still 11 visible tabs, `discussions:false`; Supabase database, Netlify, production branch, Android/Play unaffected.
- Next: verify CI; stage overall site-owner queue actions and audit-only review; isolated SQL/RLS execution required before activation.



### 2026-11-03 — Fix structural SQL test syntax before re-verification
- Repo/branch: `boydamo84-coder/disclosure-desk-preview`, `feature/sources-archives-next-batch-nov03`; prior SHA `102108d1b17cc4c97d449201bf07fa14bb493bea`; resulting SHA is next GitHub HEAD.
- Previous GitHub-only run `41685385409` FAILED with JavaScript SyntaxError (unescaped apostrophe in a test assertion). Replaced the assertion label with a quoted string; local `new Function` parse PASSED.
- No SQL schema/database/UI change in this correction; code and permissions are still **staged only**. CI result pending.
- Next: confirm GitHub-only checks green, continue isolated SQL tests/security review before any Discussions activation.



### 2026-11-03 — Discussions SQL review correction: withdrawn content, privacy, reply moderation
- Repository/branch: `boydamo84-coder/disclosure-desk-preview`, `feature/sources-archives-next-batch-nov03`; prior SHA `acd2c47f0bd754dc3b3cc307eb0113d365fa5880`; resulting SHA is next GitHub HEAD.
- Existing static source CI `41685136138` SUCCESS, but non-execution review found four defects: on-delete RESTRICT on authors/founders prevented account deletion; withdrawn topic empty body violated nonempty DDL; edit limit improperly capped long topics at reply length; and owner queue omitted hidden/escalated replies.
- Corrected `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` and extended `scripts/test_discussions_sql.cjs`. Preserve original section on founder departure and pseudonymise deleted account references, allow flags of content after original author's account deletion, soft-withdraw body replaced with `[Removed by author]`, owner queue union for threads and replies.
- Status: SOURCE STAGED and new GitHub-only regression pending; **not a SQL syntax/permission or real-account test**. No live database schema, data, Supabase migrations, Netlify, production, Android or Play impact.
- Next: isolated SQL/RLS execution with synthetic separate users, concurrency/threshold tests and security audit BEFORE activating Discussions. 



### 2026-11-03 — Discussions backend candidate with scoped stewardship (SQL UNAPPLIED)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `d4979fe11d260a57b9511d413b2808834ab0add7`; resulting SHA is this GitHub milestone's branch HEAD.
- Read-only Supabase discovery confirmed **no existing `dd_forum*`/`dd_discussions*` tables**. No changes to live database or existing public comments/private Chat.
- New `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` is intentionally **OUTSIDE `supabase/migrations`**, not installed. Candidate covers public topic sections with one steward, threads/replies, vote/flag tables, distinct five-flag auto-hide under row locks, safe pseudonymous guest read RPCs, verified account/age/rate restrictions, section title uniqueness, no public raw authors or direct table privileges, pin cap 3, creator-only edits/removals, steward escalation and audit, owner moderation/steward replacement via separate unseeded overall-admin allowlist.
- Added `scripts/test_discussions_sql.cjs` and staging-only GitHub QA job; updated roadmap and master. Pure structural checks do **not** verify PostgreSQL syntax or direct cross-account behavior.
- **Known blockers:** required isolated Postgres/Supabase SQL execution, privilege and anti-abuse tests, concurrency/flag-5 race checks, actual owner enrolment, media/link screening/retention/legal review, public mobile/keyboard UX, W.NE dock/tour parity. No Netlify staging, no Edge deployment, no Android/Play release.
- Next: check CI then review candidate SQL for unexpected rights/SQL errors, implement synthetic multi-account acceptance in isolated DB, and only then deliberately activate the feature with complete site/research dock parity.



### 2026-11-03 — Discussions UI source (disabled until backend acceptance)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview`, `feature/sources-archives-next-batch-nov03`; prior SHA `7b253f1bea70625a4f83d4b9d72e2a61c6be2c54`; resulting SHA is current branch HEAD after this commit.
- Added `assets/community-discussions.js` (section directory, create section/post/reply UI, source links, vote/flag, limited steward Pin/Escalate, registered-only writes, DOM text rendering, rate/error messaging); added fully hidden `discussionsPage` DOM/CSS and gated navigation in `index.html`. No new visible main tab until `DD_COMMUNITY_FEATURES.discussions===true`.
- Added `scripts/test_discussions_ui.cjs` and a GitHub-only workflow step; amended master and detailed roadmap. Existing case/news/LIVE comments and private Chat untouched.
- **Verification:** source parses via `new Function`; GitHub-only CI pending, not runtime-tested, not Samsung-tested. Backend RPC names are **contracts only**, not yet implemented; no actual user posts or sections possible.
- **Release/data:** feature flag remains false; live 11-tab production unchanged, no Supabase migration, no Netlify deploy, no Android changes. W.NE research nav remains eleven until deliberate 12-tab parity release work.
- Next: stage and review a narrowly permissioned server schema/RPC candidate for public sections, threads, replies, reactions/flags, steward pin/escalate and owner review; test in isolated database with synthetic accounts, then unify site nav/research dock/tour before release.


### 2026-11-03 — Independent private Chat contact opt-in (disabled source)
- Branch `feature/sources-archives-next-batch-nov03` of `boydamo84-coder/disclosure-desk-preview`; prior SHA `065204175ddae168c0448dd5ac3924263b605283`; new HEAD is the milestone commit.
- Changed `assets/public-profiles.js`: only if approved `privateChat:true`, Public Username preferences add a second independent contact-request checkbox. Selecting public alias alone does **not** consent to chat. Save only persists `chat_contact_opt_in` if both public visibility and separate contact consent are enabled. Current `privateChat:false` leaves database SELECT and upsert unchanged.
- Changed `scripts/test_private_chat_ui.cjs` with explicit opt-in and disabled-schema guards; updated handover. JS syntax parsed before commit.
- Status CODE STAGED / FEATURE OFF; no new Supabase column applied or actual messages; no Netlify, preview, public or Android release. Next verify GitHub-only QA and review SQL/RLS in isolated environment.



### 2026-11-03 — Fix Profile Chat accordion test selector (staging QA)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior `2be2ed321fb0c13d6af5f6a171e9ccdace4914b6`; resulting SHA is branch head.
- Corrected `scripts/test_research_hub.cjs`: new `<details id="ddProfileChatPanel" class="dd-profile-card dd-profile-fold">` is valid, but old regex counted only class-first markup. Updated to count any attribute order and preserve seven-panel accessibility assertion.
- GitHub-only workflow `41683343386` failed at old regex (6 detected vs 7 expected); site source static assertions up to this check passed. Next run pending after correction. No live/Supabase/Android/Netlify changes.



### 2026-11-03 — Disabled Profile Chat GitHub regression coverage
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `1ea6d63e9ce3a58ae8d6acd3bc2fadf68c4dcf3f`; resulting branch head is documentation+test commit SHA.
- Added `scripts/test_private_chat_ui.cjs` and GitHub-only staging workflow step to verify the disabled Profile Chat panel, accepted-only message composer, recipient acceptance RPC wiring, safe text rendering and unlaunched Discussions tab. Updated this handover.
- Verification: source/contract only, CI pending. **No live backend, preview, user messages, Netlify or Android changes.**
- Next: resolve any CI failure; implement separate explicit chat contact opt-in behind same flag, then isolated multiactor RLS/anti-spam/acceptance security tests before any enabling.



### 2026-11-03 — Profile Chat panel UI staged behind disabled flag
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior `9565f8093a5dae178f2324eb7237bbf925ccb1a5`; resulting SHA is the new GitHub branch head. No release.
- Added `assets/profile-private-chat.js` (new seventh native Profile accordion, accepted/pending request lists, inline conversation/first-message preview, request/accept/decline, message composer only for accepted chats, report/block buttons and safe `textContent` output), and matching markup/CSS in `index.html`.
- Added `privateChat:false` / `discussions:false` in `assets/community-test-config.js`. Updated six-to-seven panel assertions in `scripts/test_research_hub.cjs`. Browser JavaScript source parsed with `new Function` before commit.
- **Limitations:** this is NOT activated, and no contact opt-in UI, real unread badge, real SQL/HTTP test or multi-account security verification exists yet. Backend review SQL remains **UNAPPLIED**. No live/preview/Netlify/Android changes; no real messages sent.
- Next: GitHub-only check, then add gated separate contact opt-in and test complete backend in isolated staging before any feature launch. The new Discussions tab remains roadmap-only.



### 2026-11-03 — 1:1 consent-only Chat backend candidate (SQL not applied)
- Repository/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `80bab3e870e0f1e1a0b334c8f47e2446c77a35e6`; resulting SHA is this milestone's new GitHub branch HEAD.
- Read-only project DB audit: `dd_public_names` has unique generated `name_key` and existing `is_public` opt-in; PostgreSQL 17.11; no `dd_chat_*` tables exist. No private-account identifiers recorded.
- Added unapplied review SQL `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql`: independent `chat_contact_opt_in` default false, unordered-pair uniqueness, only one initial preview, recipient-only pending acceptance, direct-messages only after acceptance, registered-only rate limits, block/report, separate site-owner allowlist for reported excerpt queue, RLS on every chat table, no direct public table grants and explicit RPC execute grants.
- Added `scripts/test_private_chat_sql.cjs` static contract test and GitHub-only QA workflow step; updated master.
- **NOT verified:** SQL grammar/constraints in a staging database, concurrent-request collision, security-definer ownership and permissions, cross-account RLS/API behavior, UI and mobile interactions, report triage, privacy/data deletion, user opt-in. No SQL or migrations executed, no database modifications, no public UI feature enablement.
- Next: review SQL against Supabase docs/advisors and test in an isolated/synthetic environment, then build Profile's consent-based Chat panel behind a disabled flag and run multi-account acceptance. Preserve 11 live tabs and never publish staged backend unreviewed.



### 2026-11-03 — Community Rules correct feature status and future governance (source staged)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `eab8e926bd19096cccc2c0b9ff5ab92a85413fc9`; resulting SHA is new GitHub branch HEAD.
- Changed `community-rules.html`: replaced incorrect private-only Witness notice with accurate official-host feature-flag status; clear that private drafts never publish automatically; added planned Discussions, constrained section steward and consent-required Profile private Chat rules; clarified author self-management and witness rolling quota. New `scripts/test_community_rules_accuracy.cjs` tests correct status and explicitly preserves original 11 tabs until Discussions implemented. Staging-only workflow and master updated.
- Existing behavior checked in `assets/community-test-config.js` (`witnessPublic:enabled`, `voting:enabled`, `researchPublishing:false`) and approved user roadmap. No feature toggle, backend, public layout/tab, Supabase or Android code changed.
- Status: CODE STAGED; GitHub-only CI pending; no staging build, public publish or phone acceptance. Next: verify staging CI then continue deeper approved feature foundation/security planning and existing mobile QA.



### 2026-11-03 — Email backup branding + privacy-safe template (source staged)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; prior SHA `85c91664306c7b46e71e50b9528e6c8a15251ae6`, resulting SHA equals new branch HEAD after this single milestone commit.
- Changed `supabase/functions/email-board-backup/email-template.mjs` (responsive dark/gold table-based HTML + plain text; deterministic and free of private content); `supabase/functions/email-board-backup/index.ts` (imports template and passes HTML/text to Resend); `scripts/test_backup_email_template.mjs` (content privacy/regression and auth/attachment/rate guards); `.github/workflows/validate-sources-directory-staged.yml` (Node-only template QA); master handover.
- Preserved existing Edge recipient from confirmed user email, `dd_reserve_email_backup` hourly limiter, 40 Boards and 4MB JSON validation, private attachment and service-only secrets. No remote email trackers, Board titles or user data in the email body/subject.
- Status: CODE STAGED, GitHub-only CI PENDING. No Supabase function deploy, Resend delivery, actual backup email, preview, Netlify build, production or Android release. No user data touched.
- Next: verify CI green and later perform owner-authorised disposable test email + attachment restore during consolidated QA. Continue current roadmap, including accurate Community Rules and new feature foundations.



### 2026-11-03 — User-created Discussions tab and scoped steward governance (planning only)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview`, `feature/sources-archives-next-batch-nov03`; prior SHA `946f9c77ab4cabc90ae818c030fa67e4e8a5355e`. The resulting SHA is the next GitHub branch head.
- Approved new **12th Discussions** tab for the future combined release, hosting user-created public sections, posts, threaded replies, source links, search and self-moderation. Existing live release still has 11 tabs.
- Each section's creator becomes **limited section steward**: structure/pin/organise, flag/escalate; **no preapproval gatekeeping, unilateral bans or permanent censorship**. Existing five distinct flags temporarily hide content; site owner remains ultimate moderator and can review/remove stewards. Urgent safety channel and audited, appealable interventions required.
- Source updated: `MASTER_HANDOVER.md`; new detailed acceptance/security spec `docs/COMMUNITY_DISCUSSIONS_ROADMAP_2026-11-03.md`. Existing 1:1 Profile Chat remains separate and unchanged.
- **PLANNED ONLY:** no front-end code, Supabase changes, guest/account permissions, actual new tab, Netlify/production or Android deploy. Next implement after assessing existing discussion/vote/flag backend; synthetic multi-account RLS/author/steward/owner tests and Samsung QA before publishing.



### 2026-11-03 — One-to-one private chat roadmap addition (planning only)
- Repository/branch: `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`; baseline `8629b86e94b8929aad6aeee422b3e4807b71a0b7`. This documentation milestone's resulting SHA is the GitHub branch HEAD immediately after the commit, verify next session.
- Added consent-first registered-user **1:1 Chat within Profile**, one-message preview invitation and explicit Accept/Decline, Accepted/Pending (incoming/outgoing) lists, and in-page conversation pane. No groups, no separate page, no extra navigation tab.
- Privacy/security requirements: opted-in searchable unique usernames, strict participant RLS, block/report, rate limits and no unrequested repeat messages; avoid public chat/private Boards crossover.
- Status: **PLANNED ONLY**. No feature implementation, no Supabase migration, no Netlify deploy, no production/Android change or test messaging. Existing current QA/repair milestone remains the active implementation priority.
- Next: continue current staged code QA, then design and implement chat on the unpublished branch as part of the next consolidated roadmap batch, followed by synthetic multi-account security tests and Android parity checks.



### 2026-11-03 — Private content management using existing Supabase guards (code staged)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview`, `feature/sources-archives-next-batch-nov03`; prior SHA `1050baa275a69f25ae872dc7f07ae7584c975460`; implementation commit `0cb9dcafe93495c213f98e4c4bcf778c62d733ca`; documentation follow-up commit is branch HEAD.
- Source inspection and read-only backend audit confirmed RLS owner DELETE on `dd_witness_reports`, witness quota-preserving deletion trigger, `dd_edit_my_comment`/ `dd_delete_my_comment` owner RPCs, `research_trash_document`, `research_restore_document`, `research_purge_trashed_document`, owner-only `research_document_trash` SELECT. No new backend needed.
- Changed: `assets/research-hub.js` adds per-item owner-confirmed actions (comment Edit/Delete, witness Delete, W.NE cloud trash/restore/purge), refresh and owner-session check; `index.html` adds Recently deleted subpanel and managed-action styles; `scripts/test_research_hub.cjs` tests method contracts.
- Verification: JavaScript compile check with `new Function` passed before commit. GitHub-only run `41678969054` FAILED on a stale detail-close test expecting six rather than seven: six main accordions now include the nested Recently deleted panel. The test was corrected and locally evaluated with the existing source/Node-like mock assertion harness; **new GitHub-only CI result pending**. No authenticated write or destructive test was performed.
- Supabase/site/Android: **all unchanged**; GitHub staging only, no deployment or data modifications. Existing server privileges remain authoritative. Permanent purge must be typed-confirmed and rejects asset-bearing documents.
- Next: verify staging workflow, then perform private synthetic-account UI/session/permission checks on approved preview; inspect reported mobile UI, comment edit window, witness map and cloud restore. Continue roadmap QA without reimplementing existing features.



### 2026-11-03 — My Research Hub six-section accordion (code staged)
- Repo/branch: `boydamo84-coder/disclosure-desk-preview`, `feature/sources-archives-next-batch-nov03`; prior SHA `efe88a4d535ab28b26725330cd5cb81e14f89d95`, implementation commit `2dd0efeba5a36648bdd71048348ea0af8e445812`; documentation follow-up commit is the new branch HEAD.
- Changed: `index.html` (six existing Profile card panels converted to native `<details>/<summary>` with visible arrow, keyboard focus and reduced-motion styling), `scripts/test_research_hub.cjs` (six-panel/contract regressions), `.github/workflows/validate-sources-directory-staged.yml` (GitHub-only source + Hub regression).
- Existing implementation checked: preserved current 11 tabs, existing `assets/research-hub.js`, account summary/private lists, `ddProfileAdmin` moderator gate and sign-in; no second profile/auth source. No Supabase or API change.
- Verification: source replacement assertions confirmed six cards, not yet CI run or phone/browser acceptance. **Do not call this feature live.**
- Release: **unpublished GitHub source only**; `production`, Android candidate, Supabase and original W.NE unchanged. No Netlify preview or site publishing requested.
- Next: verify GitHub-only staging workflow PASS and continue account-owned comment edit/delete, witness withdraw and research trash/restore controls using ALREADY INSTALLED protected backend operations, not new tables. Never test deletion on real user content.



**Rule for ALL FUTURE CHATS/AGENTS:** Every implemented milestone, significant test, migration, staged deployment, Android port or release decision MUST produce a corresponding update to this file. No “completed” claim without recording evidence. Update last verified state, outstanding tasks and next step above; append a log entry. If a chat stops early, write a **WIP/handoff** entry describing exactly what was left unfinished. Do not store secrets, passwords, real users' private data or raw auth identifiers.

**Template to append, newest first:**

```md
### YYYY-MM-DD HH:MM UTC — <milestone name>
- Repository / branch / prior SHA / resulting SHA:
- Intent and exact paths changed:
- Existing implementation checked / duplication avoided:
- Verification: commands, GitHub Actions run URL and actual result; separate phone/HTTP/SQL checks:
- Backend / staging / public website / Android / Play status: (each explicit)
- User data/privacy/Netlify budget impact:
- What remains, blockers and exact next action:
```

### 2026-11-03 — Master continuity consolidation
- Consolidated rules from all four legacy GitHub continuity files, the latest 11-tab website handover, staged Sources & Archives and roadmap, feedback and Android release sequence into one master.
- Target: unpublished `feature/sources-archives-next-batch-nov03`, based on 11-tab `production`; no requested website publishing or Android release.
- Last validated site code SHA before this documentation change: `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`; GitHub-only Actions run `41674655120` SUCCESS.
- Documentation-only milestone; no website UI, Supabase, Android or production code changes. Record new documentation commit SHA in the next milestone; confirm actual Netlify state independently if needed.
- Next: inspect existing code for safely editing/deleting witness reports, comments and research documents, then implement nonduplicating fixes and run targeted tests; keep the new combined website update unpublished.
