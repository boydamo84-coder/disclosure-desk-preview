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

- **2026-11-03, My Research Hub collapsible UI STAGED:** six native keyboard-accessible expand/collapse sections implemented on unpublished branch, code commit `2dd0efeba5a36648bdd71048348ea0af8e445812`; static regression added to GitHub-only staging QA. Not yet marked CI GREEN, not Samsung-tested, not deployed. Existing account summary, private lists, backend and Admin Centre unchanged.

- **2026-11-03 16:29 UTC, Sources & Archives GitHub-only CI:** branch `feature/sources-archives-next-batch-nov03` head `3470c53f0f1ba4cd46a2627ee5f8238e2589f0f8`; Actions run `41674655120` SUCCESS. This is **source/CI validation, not Samsung QA or a deployment**.
- **Sources & Archives build staged:** `sources.html` with 13 reviewed country-level official/independent archive sources, country/type filtering, search, citation/right-to-reproduce cautions, Brazil SIAN guidance; About/Explore/Documents routes and sitemap wired. Test `scripts/test_sources_directory.cjs`; workflow `validate-sources-directory-staged.yml`. No PR or deployment for this branch. External links, accessibility and phone experience still require final acceptance.
- **2026-11-03 08:02 UTC, combined 11-tab website release:** PR #2 merged to `production`. PR describes news/archive/videos/Watch & Read discussions, likes/dislikes, five-flag moderation, witness public reports, W.NE Research Studio, My Research Hub/Profile, owner Admin Centre, LIVE hearing archive, refreshed tours, Podcasts chip, and backend migrations. CI run `41599937501` is described as successful in the merged PR. **Do not assume every real-account/mobile flow is verified.** Production `9755fba9a5116c0cce6ac433ea022a6e5bfadd15` was confirmed again in this session.
- **Existing Android candidate:** `android/play-internal-candidate-oct31` includes Android wrapper/notification plumbing and a manual signed AAB workflow requiring Play upload-signing secrets. Website vs Android branch comparison shows large divergence (121 commits ahead, 198 behind at last check). Do **not** build Play release from that branch without intentional reconciliation, native regression and signing checks.

## 4. Current priority: complete the agreed website roadmap BEFORE the next update

**Release rule:** collect work into the next significant unpublished batch, preserving 11 tabs and all tested capabilities. No individual feature deployment.

### 4A. Current QA/repair and polish queue — verify existing behavior first

- **Witness Reports:** user-confirmed report submission once worked in beta, but requests a safe owner delete/withdraw option to remove test posts; verify server ownership, removal from map, appeals and moderation. Confirm latest deployed Edge `dd-witness-submit` CORS including `x-client-info`, genuine auth POST and city-only map display. Source branch has the header, which does not prove the deployed function version. Preserve 3/day quota and distinct five-flag rules.
- **Comments:** users should be able to edit/delete their own comments subject to safe history/moderation; owner moderation can hide/restore/remove abusive material. Existing comment *post, flag and votes* are coded; editing and deletion must be checked before implementation, with RLS, rate limits, counters, and guest reads intact.
- **Research documents:** user requests delete/remove and recovery safeguards. Inspect existing W.NE file menu, cloud/local library and backup/export first; distinguish delete from unlink, archived/trash from permanent erasure, and retain export/restore/confirmation paths.
- **My Research Hub:** **CODE STAGED** six native keyboard-accessible collapsible panels via `<details>/<summary>`; default closed; live account summary and owner Admin Centre stay independent. Existing private lists were not rewritten. Await GitHub-only CI and Samsung/desktop acceptance before marking done.
- **Email backups:** refine existing `supabase/functions/email-board-backup/index.ts` with branded responsive email presentation; preserve verified recipient, JSON attachment, hourly limit, no leaked research in subject/previews, and sender configuration. Do not break delivery/restore.
- **Usernames:** existing `dd_public_names` has generated unique `name_key` and opt-in display policies. Verify *duplicate rejection* and proper error messages with two real test accounts before changing DB schema.
- **Watch & Read / Videos / LIVE:** verify labels, podcast variety, buttons, fullscreen back handling, archived comments/chat, original source links and autoplay/YouTube behavior. Existing site calls Podcasts; do not reimplement an already-correct chip. Test on Samsung.
- **LIVE hearing discovery:** check the separate Congress candidate workflow and controlled approval-to-public-event process, realistic countdown/link/home notice, cancellation, 48h removal, archived hearing recordings with original chat, no fictitious dates.
- **Sources & Archives:** finish checking the staged directory, source URLs and rights, responsive search/filter and sitemap. Do not copy or republish Canadian/Brazilian archive originals without checking permissions.
- **Community Rules, tour and controls:** update coherent descriptions to match actual enabled features and moderation routes, full-site tour including 11 tabs, guest read-only vs signed-in, account separation, keyboard/screen-reader support, and browser/device regression.
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

## 5. Release plan: website first, then Android / Google Play

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
