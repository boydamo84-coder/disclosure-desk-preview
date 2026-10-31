# Disclosure Desk — Pre-release QA gate (31 October 2026)

**Target:** development branch `main` → explicit bundled production release only after sign-off. Do not deploy production automatically.

## Verified so far
- [x] Main inline app JavaScript parses in a syntax check.
- [x] `cloud-boards.js` parses in a syntax check.
- [x] Cloud backup code includes links, notes, timeline, videos, evidence connections and saved comparisons.
- [x] User reports successful manual cloud upload/download and recovered research visible in app on Samsung.
- [x] User demonstrated successful email backup request and delivery from verified domain with JSON attachment.
- [x] User demonstrated email JSON restore prompt and reports imported Boards look correct.
- [x] User reports Guided Tour 2.0 looks good on Samsung.

## Still required before production
- [x] User reports Saved Comparisons working on Samsung (comparison save/reopen); cross-type matrix and export still warrant release smoke test.
- [x] User reports Evidence Connections working on Samsung; remove-source edge case remains to test.
- [ ] Verify exact timeline event metadata (source URL, archive event ID and year-only precision) survives JSON and cloud round-trip.
- [x] User confirmed recovery in a fresh Chrome Incognito browser session: account sign-in, cloud download and recovered Boards working (31 Oct 2026). This does not independently verify a separate physical device.
- [x] User reports Notifications deep links working on Samsung (31 Oct 2026).
- [ ] Verify case-follow update detection only reports genuine catalogue changes; old snapshots do not invent update dates.
- [ ] Test email-backup rate-limit: a second attempt inside 60 minutes must be rejected; no messages to arbitrary addresses.
- [ ] Test unauthenticated and unverified-account requests to email-backup function are rejected.
- [ ] Check signup/login/password reset, user-specific Supabase RLS isolation, and that sign-out doesn't leak previous user's private cloud Board data.
- [ ] Verify hosted assets and navigation on both GitHub Pages preview subpath and production root path.
- [ ] Review privacy language on email attachments, data export/retention, and recovery limits.
- [ ] Final user-approved bundled production deployment and post-deploy smoke test.

## Release blockers / cautions
- **Static inspection is not an end-to-end browser or Android test.** User-confirmed tests are listed separately.
- Browser `alert`/`confirm` still exist in other application workflows; only email restore was redesigned.
- `email-board-backup` depends on Supabase, Resend and function secrets; ongoing delivery must be monitored.
- No change to production branch should happen until explicit approval.

## Rollback
Keep exact pre-release production commit SHA and verified private JSON export before release; if major issue occurs, roll back deployed branch without deleting cloud Boards.
