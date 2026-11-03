# Disclosure Desk — LIVE hearings, community features & witness map handover
**Last updated:** 3 November 2026. **Read this first in a new chat.**
**Status:** Work in progress / staged on an UNPUBLISHED GitHub branch. Do not mistake a committed file for a tested or live feature.

## 1. Exact repos, branch, release boundary
- Website integration source: **boydamo84-coder/disclosure-desk-preview**
- Current work branch: **feature/research-studio-bds-production-based** (based on its **production** branch). NEVER substitute the outdated main branch or a separately named disclosure-desk repository as the website deploy source.
- Draft staging PR **#2**: https://github.com/boydamo84-coder/disclosure-desk-preview/pull/2 — OPEN, DRAFT, **not merged**. PR title carries **[skip netlify]** because the user has very few Netlify credits (earlier ~300). Verify Netlify status before assuming skip mechanisms prevented any build.
- Previously verified preview: https://deploy-preview-2--uap-disclosure-desk.netlify.app — this is an EARLIER W.NE beta; **new navigation, LIVE, witness and voting code is NOT verified on this preview**.
- Production website at **uapdisclosuredesk.com** must remain untouched until a separately approved combined launch. Original W.NE product repo **boydamo84-coder/W.NE** remains untouched.
- Canonical Research Edition source is **boydamo84-coder/WNE-Research-Edition**, branch **feature/research-beta-proofread-landing-batch**, mounted at \`research/\` on the website branch. No simplified/rejected editor.
- User wants **batch changes, GitHub-only validation, one deliberate beta Deploy Preview, test on Samsung Galaxy S24 Ultra, then a consolidated bug list**. No automatic tiny Netlify releases.
- Existing integration handover: [WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md](WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md). Its earlier notes about sitemap/feature status may have been superseded by this file.

## 2. Approved site experience / product decisions
**Preserve this exact 10-tab order:** News, Archive, **W.NE**, Map, LIVE, Videos, Boards, Witness, Watch & Read, Explore.

W.NE is presented as **W.NE Research Studio**, in Disclosure Desk navy/gold styling, with a login or isolated read-only guest preview. All user documents/Boards are private to the correct account. When returning, open the last accessible document. Within W.NE, use the familiar 10-tab swipe menu with **Hide menu / Show menu**; it remains uncluttered when hidden. Switching tabs or choosing “Back to Disclosure Desk” must call the existing asynchronous \`wneSaveBeforeNavigation\` and only navigate on explicit verified save success; failed/unavailable/pending save must keep document open. **Standalone Research Library/Board backups need separate tests.** Original W.NE product remains independent.

**Community:** public submitted witness reports, city/town level only (never GPS, home address, street or identifying details); **automatic publication after server validation** rather than manual preapproval; only signed-in registered accounts publish or flag. **3 new public witness reports per account per rolling 24 hours.** **5 flags from DISTINCT signed-in accounts** => temporarily hide report from public map/feed for moderator review, not delete or deem false. One flag per reporter per report; no self-flags. Anti-spam limits on flagging. A Map dropdown must include **Witness Reports Only**.

**Votes:** comments and witness reports get visible **👍 likes / 👎 dislikes** counters. Anyone can read totals, only signed-in registered users can vote; one active vote per user per item, may switch sides or remove, and a dislike is NOT a moderation flag. Display respectful pseudonymous usernames instead of real emails.

**Profiles:** on registration and when signed in, choose/edit a public username; usernames must not impersonate or contain inappropriate data. Existing Supabase \`dd_public_names\` table confirmed, but its complete public profile UI and comment name wiring are **not yet complete**.

**Boards:** when saving a news, case or video item, allow an **optional private note** right in the save picker. Existing Board data must be preserved.

**Community Research:** W.NE reports are **private by default**. Future explicit **Publish to Community** flow should preview and sanitise only the chosen shareable copy, attribute sources, expose review/ratings and reporting, and NEVER silently publish a research document. **Not implemented yet**.

**LIVE Congress:** automatically discover actual announced UAP hearings using the existing Congress.gov secret-backed workflow, verify official committee calendar / specific hearing announcement / timezone-qualified start, and then publish to LIVE. Show actual **days/hours/minutes/seconds**, official date in **Europe/London and US Eastern**, stream link/embed once officially published, and a alongside-stream **registered-user moderated live chat**. **Also surface a prominent homepage/News countdown and official link once an event is confirmed; remove that homepage notice 48 hours after the scheduled start/countdown reaches zero.** If there is NO verified future hearing, show “No confirmed upcoming hearing”; NEVER invent a time or claim LIVE. The News notice and its 48-hour retirement are now staged and green in GitHub-only synthetic checks, but not deployed or verified with a real hearing.

## 3. Existing working/staged code in the WEBSITE integration branch
**Previously implemented and GitHub-browser-tested (but still requires new Samsung beta test):**
- \`index.html\` W.NE tab, guest/login routes, Explore improvements/guided tour, Boyd Digital Studios About/footer, Privacy, Contact & Enquiries.
- \`research/\` canonical editor with split workspace/cloud guards; \`research/research-site-nav.js\` and \`.css\` integrated ten-tab dock; selected-tab deep linking to site; save-verified navigation.
- \`robots.txt\`, \`sitemap.xml\` (NOW **4** public URLs: home, Research Edition, Community Rules, Privacy), \`research-edition.html\`, SEO metadata and private \`noindex\`.
- \`community-rules.html\`: detailed proposed community rules, including the precise 3/day, 5 flags, like/dislike, signed-in-only flagging, public research standards and privacy. Clear **beta/not-live** disclaimer. It is linked in Explore, Witness page and footer.
- \`index.html\` Board picker includes \`pickerPrivateNote\`, which writes an optional per-item private note. Requires on-device Boards test.

**More recent community/LIVE code COMMITTED BUT NOT END-TO-END TESTED OR DEPLOYED:**
- \`assets/live-hearings.js\`: historic official recordings preserved under LIVE.
- \`assets/live-schedule.js\`, \`assets/live-schedule.css\`, \`assets/live-chat.js\`: planned official-date countdown, UK/US time, optional official stream player and authenticated chat. Historical feed \`data/approved-live-events.json\` has **no verified upcoming events**. Live event publishing/upstream collection not yet integrated.
- \`supabase/LIVE_HEARINGS_CHAT_REVIEW.sql\`: schema/RLS, limits and moderation design only. **NOT APPLIED**. Do not claim chat live; requires security review, integration tests and controlled database deployment.
- Older/separate Congress collector: repo **boydamo84-coder/disclosure-desk**, workflow \`.github/workflows/incremental-congress-dev.yml\` on **main**, scheduled **06:19 and 18:19 UTC**. It checks out **dev/automatic-recording-discovery-oct31**, runs tests and API scan with **CONGRESS_GOV_API_KEY**, then commits **review candidates/checkpoints only**. It does NOT automatically approve or publish hearings into the website/database. A prior fix on its dev branch focused on Congress 119/expanded keyword matching. Verify workflow runs and actual event matches before claiming automatic publishing.
- \`supabase/WITNESS_VOTING_COMMUNITY_REVIEW.sql\`: staged witness tables, private flag records, RLS-protected public projection WITHOUT author_id, rolling per-user 3/24h guard, 5-unique-flag temporary hide, moderator hook, vote summaries/updates. **NOT APPLIED**.
- \`supabase/functions/dd-witness-submit/index.ts\`: staged Edge Function for registered-user submission and broad city geocoding with server-only credential. **NOT DEPLOYED**. Needs further review/testing.
- \`assets/witness-community.js\`: staged private draft/public consent submission, public reports map feed and report detail with flags and votes. **NOT LIVE**.
- \`assets/community-votes.js\`: staged public counters and signed-in thumbs up/down, change/remove logic. Imported before \`assets/case-discussions.js\` and \`assets/inline-news-comments.js\`, which now call its mount method. **Not end-to-end tested**.
- \`index.html\`: added \`mapViewMode="witness"\` “Witness Reports Only” filter, witness geolocation field \`reportCountry\`, separate **Save private draft** and **Publish to public map** buttons with explicit consent, updated approximate markers / report cards, city-level public report actions. Do not assume browser runtime works until tested, especially Leaflet marker/clustering/popup hooks.
- \`assets/community-test-config.js\`: community config currently enables **preview/local host only** and DISABLES real production posting/voting; \`researchPublishing:false\`. User said no one uses the site yet and approved **enabling community features at launch**, *after* safeguards work; this is NOT an instruction to bypass security tests. The public live build should remain disabled until controlled go-live.
- \`privacy.html\`: includes LIVE hearing chat/writing processing descriptions; Community Rules covers conduct. Keep disclosures accurate after activation.

## 4. Verification status — read very carefully
- GitHub-only W.NE website CI: \`.github/workflows/validate-wne-site.yml\`; baseline run **41580574010 SUCCESS** (https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41580574010). It checks W.NE, sitemap and browser navigation; **this does NOT constitute witness submission, RLS, live chat or voting acceptance testing**.
- \`scripts/test_live_schedule.cjs\` exists, and was corrected to reject date-only hearing timestamps. It is now wired into GitHub-only CI alongside a new witness-community static contract suite. Run 41582366662 passed on 3 Nov 2026; this is NOT real signed-in or server acceptance testing.
- New witness SQL was verified once by a **BEGIN; ... ROLLBACK;** Supabase query which returned \`rollback-only-schema-test-passed\`. This confirms *SQL syntax and schema statements in a reversible transaction*, not real signed-in posting, author hiding, daily limit, fifth-flag behaviour or voting. **No witness schema was installed** by that check. SQL version successfully tested corresponds to branch commit \`a809b4d651aac3fa7cf936b0890cd84bcc0a91d9\`; later frontend code commits did not change its guard semantics.
- **WITNESS GUARD FIX STAGED — NOT DEPLOYED:** The earlier `SECURITY DEFINER` trigger could see its owner's role instead of `service_role`. The unpublished SQL now uses `SECURITY INVOKER` so `current_user` reflects the calling role; direct browser INSERT remains revoked. A report-specific BEFORE-insert advisory lock now serialises flagging. Real SQL rollback test, direct API bypass probes, service-role Edge Function publication, 3-in-24h and 5-distinct-flag account tests remain mandatory before applying or launching.
- Other gates: staging Edge Function deployment and auth token handling, safe town/country resolution for ambiguous places (especially Northern Ireland), RLS-authorised flags and vote RPCs, verified public-only projection after fifth flag, moderation dashboard/restore/appeals, keyboard/mobile map popups, pagination, unique report submission and concurrent throttling, error handling and tests, spam prevention, registered-only vote/flag, username/profile handling.
- LIVE: event database migration and real-time chat not applied. Validate official announcement ingestion; control event approval; avoid fictitious hearing/time; add **News/Home 48h countdown notice**; test stream embed failover and moderation. Do not run the scanner against production without checking secret and quota.
- Existing private Research cloud changes from prior phase: reference backups SQL grants verified in the Disclosure Desk Supabase project; authenticated Oracle LanguageTool Edge relay \`wne-live-spelling\` deployed v4. However real W.NE Samsung save/proofread and guest/account switching still require acceptance tests. Leave project data intact.

## 5. Exact next actions in a NEW conversation
1. Read this file **and** [WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md](WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md), inspect branch + PR and current GitHub Actions. Continue from existing files; do NOT overwrite working original editor or 9 live site tabs.
2. **Fix witness server-only publication guard** (SECURITY DEFINER role issue), verify no precise coordinates/addresses can be injected, no author_id in public projection, and that flagging/hidden status works in a safe test environment. Use rollback-only schema review before a deliberate, backed-up deployment. Never delete user data or alter Cinema app Supabase project.
3. Add \`scripts/test_witness_community.cjs\` and cover signed-out/public view, consent, 3-in-24h, 5 distinct flags, vote change/remove, safe rendering, city-level filters, protected reports, no duplicate reports; integrate \`test_live_schedule.cjs\` and these tests into GitHub-only CI. Run mobile+desktop browser smoke; fix failures.
4. Add and verify the **home/News confirmed-hearing countdown banner**, source link and automatic removal after 48 hours. Connect official Congress review candidates to event approval/publishing without inventing dates, and test with **synthetic** official event fixtures (not actual fake published events).
5. Implement **public username/profile creation and edits** and show names beside comments/chat. Use owner-only username update, safe display policy; retain private emails.
6. Community-published W.NE reports with **explicit copy/preview**, submission moderation, sources, reviews/ratings and flags; separate from current private documents. Not built.
7. When backend and front-end security checks are green, deploy schema/function in the correct **Disclosure Desk** Supabase project, test with two disposable registered accounts and 5 separate safe test flaggers (if appropriate), review moderation procedures, then switch on community production posting only as part of an explicitly approved combined release.
8. **One** next combined Netlify staging preview after code and schema QA. The user should test W.NE save-and-return, ten-tab hide/show, witness city-only publication, unique flags, votes, comments, LIVE no-event fallback and official simulated events, account isolation, W.NE export/recovery, and all pre-existing features on Samsung. Keep the live \`production\` branch and older Deploy Preview unchanged until approved.

## Session continuation — 3 November 2026 (completed staging development batch)

**Exact repository/branch:** `boydamo84-coder/disclosure-desk-preview`, `feature/research-studio-bds-production-based`, draft PR #2 into `production` still OPEN and UNMERGED.

**Code commits (all `[skip netlify]`):**
- `033addbe35a797a34051e4261fabc5d6edefb89e`: correct staged witness guard to SECURITY INVOKER + service-only grant, lock BEFORE flag insert, add News official LIVE event countdown and 48-hour expiry, source-contract tests, CI wiring.
- `75132d3f5b6242c61d0d13b03d40de3a8445ce9b`: fix inherited `URL` variable shadowing constructor and preventing all official LIVE links from validating.
- `52e061893bab0dd47aeb118e435dc6a06d6606e5`: align existing LIVE test with real timezone formatting calls.
- `a4d8ae9666c794d9a95bd6e46be16d454dc2c547`: retain approved hearing News notices for 48 hours if hearing status changes to `ended`, without mislabelling as upcoming LIVE.
- `edb9d5c91cf4c0bfb50e7e416489eeab3f8c6ed7`: test post-start ended-event visibility and exact 48-hour retirement.

**Verified:** GitHub-only CI run [41582366662](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41582366662) completed **SUCCESS** on final code commit `edb9d5c91cf4c0bfb50e7e416489eeab3f8c6ed7`. Existing W.NE/SEO and desktop/mobile browser checks passed; new LIVE and witness static source-contract assertions passed. This DOES NOT establish SQL/RLS or true witness-report end-to-end safety. No Netlify or database deploy was requested or executed from this session; Netlify dashboard credits were not independently checked.

**Still blocked / next exact steps:** Apply neither witness SQL nor Edge Function before controlled safe SQL validation and two/5-account security tests; verify distinct flagging, direct Data API insert denial, city-only geocoding and privacy of public projection, moderator restore, report duplication/rate limits, mobile map, real LIVE event review/approval ingestion, chat and usernames. Community W.NE document publication is still opt-in roadmap. Keep production and original W.NE unchanged. After security and QA, request ONE deliberate Netlify staging preview for Samsung acceptance; do not merge to production without explicit separate approval.

## Read-only Supabase metadata audit — 3 November 2026

- Confirmed the correct connected project is **Disclosure Desk**, ref `omqxizswzcwgzqaczlhe`; the other account project was NOT accessed or changed.
- Queried only public schema metadata and function inventory. The witness reports, public witness projection, vote, flag, and LIVE event/chat tables are **not installed**. The staged `dd-witness-submit` Edge Function is **not deployed**. Existing `email-board-backup` and `wne-live-spelling` functions remain as before.
- Confirmed existing `dd_public_names(user_id,display_name,name_key,updated_at)` has RLS owner-only SELECT, INSERT and UPDATE. **Do not enable unrestricted public SELECT just to show names**. Build a tightly scoped opt-in public username projection or SECURITY DEFINER RPC limited to visible approved comment/chat authors, and separately test access checks; never expose emails or unconsented usernames.
- Existing `dd_case_comments` includes a UUID `author_id`; public username wiring must avoid leaking additional identity data through lookups.
- No SQL migration, Edge Function deployment, writes, deletions, or user-account changes were performed in this audit. No data from the Cinema app project was accessed.

## Backend/usernames continuation — 3 November 2026 (new)

- GitHub username batch committed as `3bd6999fd0cd30ee9c02377c5c60b1300183cb5d` with **[skip netlify]**. Reuses the existing owner-private `dd_public_names`, adds explicit opt-in `is_public`, and a tightly scoped RPC for approved comment/chat IDs. Frontend shows no UUID fragments or emails; registration username is only a safe prefill until a verified sign-in saves it. **Staged only, not live.**
- Follow-up duplicate-submission guard at `9db2f42a5843e535e0434e8c87c6ed8558312194` with **[skip netlify]**; protects against repeated case/whitespace-equivalent posts under the existing author transaction lock, and returns 409 to the browser. **Staged only.**
- Read-only Supabase grants audit confirmed existing `dd_public_names` owner access is SELECT/INSERT/UPDATE for `authenticated`, NOT SELECT for `anon`; existing unique `name_key` index and reserved-name constraints are retained.
- Actual SQL **ROLLBACK-ONLY** tests passed for proposed witness schema, role-simulated direct INSERT denial, synthetic service-role INSERT, vote switch/removal, five distinct synthetic flaggers causing public hide, fourth-in-24h denial, and duplicate report denial. Name migration also accepted then rolled back. **No real test users were created; no witness/name data persisted.**
- GitHub Actions full suite run `41583518444` was SUCCESS at the username commit. The duplicate-guard commit's workflow `41583896781` was still in progress at the time the initial QA note was drafted; check latest run status before claiming final green.
- Reproducibility, precise caveats, and next acceptance steps: [`docs/COMMUNITY_BACKEND_QA_2026-11-03.md`](COMMUNITY_BACKEND_QA_2026-11-03.md).
- Next: verify latest GitHub Actions green; test real HTTP/JWT RLS and Edge Function with disposable users in a safe environment, concurrent fifth flag, user-controlled public aliases, geocoding, moderation and Samsung UX. Staged `WITNESS_VOTING_COMMUNITY_REVIEW.sql`, `PUBLIC_USERNAMES_REVIEW.sql` and `LIVE_HEARINGS_CHAT_REVIEW.sql` are NOT applied. No Netlify deploy or production merge without separate explicit release approval.

## Comment hardening continuation — 3 November 2026

- Existing deployed comments/flags permit `authenticated` RLS inserts without excluding Supabase anonymous sign-ins, and self-flags were allowed. Both violations are against the Community Rules. Concurrent comment/flag rate checks also lack per-user locks.
- New staged review-only `supabase/COMMENT_SECURITY_HARDENING_REVIEW.sql` corrects both RLS and trigger guards and revokes public executable privileges from internal trigger functions. Adds `scripts/test_comment_security.cjs` to GitHub-only CI. **Not applied or deployed.**
- Planned My Research Hub/profile is **deferred** until comment/vote/witness/report/moderation security and acceptance testing passes; no new site tab or deployment now.

## Owner moderation access and follow-up QA — 3 November 2026

- On the user's explicit request, the **existing verified site-owner account** was provisioned in `public.dd_comment_moderators` in the connected Disclosure Desk Supabase project. This is a **real persistent allowlist change**; it does not grant Supabase project/database admin, bypass user research privacy, or deploy the staged witness schema.
- Verified under simulated authenticated SQL claims that the owner can access the moderator queue and an unrelated account cannot. Existing owner allowlist remains after all test rollbacks. Do not publish the owner's email address or account UUID in this repository.
- Synthetic comment/flag/moderator QA passed: other-author flag, duplicate flag rejection, self-flag rejection, non-moderator denial, hide and restore, hidden-comment invisibility to peers/visibility to owner. All synthetic data and test-only FK changes were rolled back.
- Unpublished UI changes now show clear messages for duplicate comments/flags, self-flags, sign-in failures and posting-rate limits. No Netlify deploy, production merge, or application of the staged `COMMENT_SECURITY_HARDENING_REVIEW.sql` yet.
- Keep **My Research Hub** planned but unbuilt until remaining community acceptance gates pass.

## Owner-approved five-flag community comment self-moderation — 3 November 2026

- **All valid comments publish immediately**, no routine approval. Guest readers may see approved comments through the staged privacy-safe RPC. **At 5 distinct registered account flags, a comment is auto-hidden for review**; fewer than 5 leaves it public. Comment author cannot self-flag, one flag per user, abuse rate guards, no dislikes-as-flags. Hidden items enter the owner's existing moderator queue; on restore the reviewed flag baseline advances so stale flags cannot instantly re-hide it. Escalate genuinely urgent safety/privacy issues independently of the five-flag system.
- Coverage: News reports (inline), historical Archive (new Discuss button), Videos (feed Discuss and immersive More), Watch & Read (inline for documentaries/films/books/podcasts). 'My Comments' opens back to original Archive or Watch & Read. Same comment database and flag guard across sections.
- Staged files: `supabase/COMMENT_SELF_MODERATION_REVIEW.sql`, `scripts/test_comment_self_moderation.cjs`, updated `community-rules.html` and QA workflow. The database modifications are **NOT APPLIED**. This commit and all remaining feature work is **[skip netlify]**, no deployment/merge.

## Self-moderation database check and GitHub QA cleanup — 3 November 2026

- Rollback SQL verified guest public comment view, raw author-row SELECT denial, flag numbers 1–4 remain visible, fifth distinct account hides, hidden-only moderator queue, moderator restoration, guest visibility after restore, reviewed-flag baseline reset, and no synthetic changes remaining. Real HTTP/JWT and concurrent account/browser acceptance remain open.
- Updated historical CI assertions that required username aliases to be authenticated-only (guests may read opt-in public aliases) and the old 5-flags phrasing. Adjusted UI copy: individual flag records a concern, five distinct flags trigger hide/review; refresh discussions after successful flag to remove auto-hidden comments.
- All work remains on unpublished GitHub feature branch, `[skip netlify]`; never enable guest raw author UUID table access. No Netlify deployment or production merge.

## Username generated-key fix — 3 November 2026

- Supabase `dd_public_names.name_key` is **GENERATED ALWAYS** from the display name, not user-writable. The staged profile upsert incorrectly supplied it. Removed that field, aligned staged username SQL check with its generated normaliser (including underscores), and strengthened static test. Test was rollback-only, so no account data or schema changed. Run the guest opt-in/hidden-comment alias rollback test again; real HTTP/JWT acceptance still required.

## Username opt-in guest read QA — 3 November 2026

- Supabase rollback test after generated-column fix passed: no public name before opt-in, cross-account raw profile SELECT denied, opted-in display name returned only for approved public comment, hidden comment name suppressed. No test data or schema persisted. All comment self-moderation and public read migrations are still staged for combined beta acceptance.
- GitHub-only CI run [41586352883](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41586352883) passed on functional five-flag, archive, video and Watch & Read wiring. Later username-fix CI was still running during this note; verify its completion before release claims.

## Witness review and flag-cycle hardening — 3 November 2026

- Found staged witness status restoration counted historical 5 flags again, causing premature rehide. Staged `review_flag_floor` and moderator restoration resets the reviewed baseline while holding same per-report flag lock. Fresh 5 distinct flags after restoration are needed to auto-hide again; existing flaggers cannot flag a second time. This also discourages moderation churn.
- Added server-authorised `dd_witness_moderation_queue()` returning only hidden reports for the owner to review and `assets/case-comment-moderation.js` unified view of hidden comments and hidden witness reports with restore/keep hidden/remove actions. Routine flags 1–4 create no moderator queue entry. No anonymous or cross-account moderator queue access.
- Witness Edge Function `dd-witness-submit` is **not installed** on the project; witness schema still staged. No new users, migration writes, deployment or Netlify credits.

## 6. Non-negotiable product/safety notes
- No fake hearing dates, fake LIVE state, public/private document leak or precise witness locations.
- Users may submit reports about unverified experiences; “published” does NOT mean Disclosure Desk authenticated the claim.
- Treat community reports as user-generated, ensure abuse/harassment/privacy removal and appeals; a dislike is not a flag.
- Existing site News, Archive, Map, LIVE, Videos, Boards, Witness, Watch & Read and Explore must survive the W.NE integration.
- All current work is owned by **Boyd Digital Studios**. Site About/footer and public policy already reflect branding.
- Netlify credits are scarce. **Do not merge or trigger deploys via commits without checking configuration and obtaining approval.** GitHub-only QA is allowed. No deploy done as part of writing this handover.
