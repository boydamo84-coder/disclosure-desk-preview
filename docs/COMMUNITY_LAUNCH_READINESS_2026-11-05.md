# Disclosure Desk — community launch readiness, 5 November 2026

**Release stage:** unpublished website development. **Not authorisation to migrate, deploy, or enable features.**
**Authoritative source:** `boydamo84-coder/disclosure-desk-preview` / `feature/sources-archives-next-batch-nov03`.
**Project:** Supabase Disclosure Desk `omqxizswzcwgzqaczlhe` (read-only metadata inspection; no customer content touched).

## Verified exact CI evidence

| Test | GitHub Actions run | Result | Meaning / limits |
| --- | --- | --- | --- |
| Latest full staged site QA | [41810147045](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41810147045) | SUCCESS, 2026-11-04 | Source and synthetic checks at branch HEAD `f4c5f0bb04102166f9e9b0117ca75029b0a98ef0`, not Samsung/browser acceptance |
| LIVE chat open/close synthetic clock | [41802115449](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41802115449) | SUCCESS | T−45 minutes and earlier of verified end/start+4 hours, no published hearing |
| Saved LIVE chat replay/pagination | [41802463605](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41802463605) | SUCCESS | Fake DOM and 60+1 synthetic messages; not a real authenticated backend round-trip |
| Private consent Chat isolated PostgreSQL 17 | [41711107391](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41711107391) | SUCCESS, 2026-11-03 | Tested detached candidate schema with fabricated accounts, invite cap 10/24h, accept/decline, intro-once, participant/block/read/unread logic, 30 messages/10min; **not** installed in live Supabase |
| Discussions isolated PostgreSQL security | [41692441123](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41692441123) | SUCCESS, 2026-11-03 | Disposable PostgreSQL and simulated account/role boundaries, not live integration |
| Usernames/owner action synthetic QA | [41801094736](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41801094736) | SUCCESS, 2026-11-04 | Account-switch and duplicate-alias code; not live JWT A/B or Samsung |

## Confirmed live backend inventory — read-only on 2026-11-05

- **Present, RLS enabled:** `dd_case_comments`, `dd_case_comment_flags`, `dd_comment_moderators`, `dd_content_votes`, `dd_public_names`, `dd_live_events`, `dd_live_chat_messages`, `dd_live_chat_flags`.
- Existing protected RPCs include `dd_public_comments`, `dd_public_hearing_chat`, `dd_edit_my_comment`, `dd_delete_my_comment`, `dd_vote_set`, `dd_vote_summary` and moderator-only queue/actions.
- Username table has unique index `dd_public_names_unique_key`; selected public aliases are opt-in.
- LIVE chat insert policy restricts the current authenticated author to an active, public, time-bounded event; database trigger enforces 4-second spacing, 24 messages/10 minutes, 180/day and duplicate detection. Its public transcript RPC returns approved messages and paging timestamps but not raw member identifiers.
- At inspection: `dd_live_events` and `dd_live_chat_messages` had **zero rows**. No public hearing or fabricated chat was inserted in this milestone.
- **Absent from live project:** `dd_chat_*` private-pair/message/request backend and `dd_forum_*` Discussions section/thread/reply backend. Staged SQL in `supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql` and `supabase/DISCUSSIONS_STEWARDSHIP_REVIEW.sql` is intentionally **unapplied** and outside migrations.
- Source flags in `assets/community-test-config.js`: `privateChat:false`, `discussions:false`, `researchPublishing:false`. Do **not** flip them based on CI alone.
- Source files already exist: `assets/live-chat.js`, `assets/live-hearings.js`, `assets/live-schedule.js`, `assets/case-discussions.js`, `assets/community-discussions.js`, `assets/profile-private-chat.js`, `assets/discussions-admin.js`, and public profile/moderation modules. Do not generate another chat system or edit the older repo's stale site.

## Product contract — retained
- **LIVE hearing chat:** one room per verified official hearing; guests may read approved saved messages; registered non-anonymous accounts may post during the validated LIVE window; 5 distinct reports temporarily hide abusive content; moderator review/restore; archived transcript remains readable after event.
- **Private Chat:** expandable Profile panel, opted-in unique usernames, exactly one introductory request message, recipient Accept/Decline, accepted-only 1:1 history, Pending received/sent, unread markers, block/report. Server limit **10 new requests/rolling 24h** and **30 messages/10min in accepted conversations**. Remain disabled until migration and two-user consent/privacy QA.
- **Discussions:** approved future **12th main tab**, separate from case/news/video comments, guest read-only, registered topics/replies/votes/flags, creator as limited **steward** (organise/pin/escalate; no arbitrary bans/deletions), site-owner moderation, 5 distinct flags/temporary hide and appeals. Remain disabled until reviewed migration, role/RLS testing and mobile acceptance.
- **No searchable historical hearings archive now.** Keep the simple verified events/replays display; revisit only when actual volume warrants it.

## Real launch blockers (must not infer from static green)
1. Inspect latest site's real Samsung/Chrome and Android WebView layout/navigation, keyboard, chat input/send, history paging, notification/deep links and loss of network.
2. Use two *disposable* consented test accounts on an **isolated staging backend**, testing direct HTTP/JWT against both social schema candidates: guest, anonymous, participant, third-party, blocked, moderator and section steward.
3. Authorise controlled backend rollout separately after inspecting full SQL, table grants, RLS, trigger races, rollback/backup and privacy policies. Do not insert fake hearings/witness content in the production database.
4. Confirm the staged new tab integrates with the existing W.NE save-before-navigation dock and full guided tour once consciously enabled; preserve the original 11 live tabs until bundled release.
5. Inspect Supabase security adviser warnings individually: six anon-callable `SECURITY DEFINER` functions may be deliberate public RPC projections, while password leaked-credential protection should be reviewed in Auth settings. Do not blindly revoke functional access or claim an exploit based solely on a lint.
6. Obtain separate approval for actual Supabase migrations, one consolidated website/Netlify beta, public release and Android parity.

## Outcome
**Code stage and isolated PostgreSQL QA: GREEN.**
**Live community-comment and LIVE hearing-chat backend foundations: PRESENT.**
**Private Chat/Discussions live backend: NOT APPLIED; frontend disabled.**
**Full social feature launch: NOT READY until controlled migration and real account/device acceptance.**

This milestone performed no Supabase database writes, GitHub production merges, Netlify deployments, Android builds, or tests on actual customer content.
