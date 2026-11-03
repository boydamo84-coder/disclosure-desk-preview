# Disclosure Desk — MASTER HANDOVER (authoritative)

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

## 9. Milestone log — REQUIRED after *every* milestone

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
