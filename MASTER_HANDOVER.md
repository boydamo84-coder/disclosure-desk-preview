# Disclosure Desk — MASTER HANDOVER
_Last updated: 8 November 2026 (Europe/London)_

> **Reconstructed master handover.** There was no existing `MASTER_HANDOVER.md` in the website repository's checked `production`, `main`, previous signup-hotfix, or current development branch. This file consolidates the live baseline with the existing `docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md`, the 2 November `DEVELOPMENT_HANDOVER.md`, GitHub commit history and the owner's current acceptance feedback. Do not present the earlier handover's 3 November stage statuses as current facts.

## Canonical project and release boundaries

- Website source is **`boydamo84-coder/disclosure-desk-preview`**, **NOT** the separate `boydamo84-coder/disclosure-desk` collection repository.
- Current fix branch: **`fix/safari-avatar-fallback-20261108`** based on production commit **`b9fe74e0094599e9677b8b363d8b4f0c4389575e`**.
- Live website: **uapdisclosuredesk.com**. Commits to this branch do not automatically mean live deployment.
- Existing owner-approved live-chat/usernames/avatar base: production commit `b9fe74e`, titled “Release Chat invite stability, public signup usernames and automatic profile photos.” Its release commit cites green no-deploy QA run [42451942613](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42451942613).
- **Owner confirms two-account Chat now works** between owner and friend after previous fix. Do **not** repeat basic Chat tests unless changed code requires them. Keep usernames automatically public/discoverable on new signup with opt-out; never expose email.
- **Open user-facing defect:** Friend on **Safari** cannot add a profile photo, even using a photo the owner has personally uploaded successfully elsewhere. Therefore do **not** assume simple file size is the cause.
- Avoid small/unapproved Netlify releases and unreviewed backend writes; preserve private Boards/W.NE content, five-flag moderation, Supabase RLS, W.NE separate repo and live site availability.

## Milestone 1 — branch recovery and existing behaviour (VERIFIED 8 Nov)

- Inspected `production` root, `assets/profile-avatars.js`, `assets/public-profiles.js`, current auto-upload tests and prior release commit.
- Found no root `MASTER_HANDOVER.md`; previous community handover is `docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md`, some portions obsolete after public launch.
- Existing auto-photo flow rasterises chosen photo into a 512px WebP (1 MB limit), uploads to an owner-scoped private Storage key, and supports Remove/Hide/Retry.
- Identified two reproducible code risks: `convert()` hard-failed without a working `createImageBitmap`; the picker was enabled before the user's private Storage key had loaded, allowing a preview with no uploaded object.
- This milestone is **source inspection**, not a claim of successful live Safari upload.

## Milestone 2 — Safari compatibility on feature branch (CODE COMMITTED 8 Nov)

- Changed `assets/profile-avatars.js` to try `createImageBitmap` first then fall back to standard `Image` + temporary blob URL when missing or rejected. Always revoke temporary decoding URL. Retain square 512px output, WebP content-type, 1 MB encoded-image limit and owner-only Storage path.
- Accept JPG/PNG/WebP/iPhone HEIC/HEIF where the browser can actually decode them; accept a known safe filename extension when Safari Files does not provide a MIME type. Original image bytes are never sent directly to Storage.
- Disable the picker until signed-in account owner and avatar Storage key are ready; this closes the silent no-upload path on slower devices.
- Existing Change/Remove/Hide/Retry behaviour and auth owner guards remain.
- Added fallback checks to `scripts/test_avatar_auto_upload_20261108.cjs` and a static Safari contract check `scripts/test_safari_profile_avatars_20261108.cjs`.
- No Netlify production publish or Supabase migration in this milestone.

## Milestone 3 — automated QA (VERIFIED 8 Nov)

- [GitHub Actions run 42455917451](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42455917451): **SUCCESS** for the latest Safari patch, including parser, synthetic auto-upload, simulated missing/rejecting `createImageBitmap`, HEIC conversion, readiness gate, chat account-switch, member avatar cache, and packaging/AdSense source checks.
- This is synthetic/browser-independent Node QA, **not** a real iOS Safari or cross-account photo upload against live Supabase.
- Separate Beta 14 public mobile Chromium/candidate release gates on the previous signup fix branch [42451999652](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42451999652) and [42451999624](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42451999624) were marked **FAILURE**. Investigate those independently before claiming the full public release candidate is green. Do not mislabel them as failures of this Safari fix.

## Next acceptance and release steps

1. Verify live `production` deployment state/hosting and branch diff before publishing. The present Safari patch is on a **separate undeployed branch**.
2. Deliberately create one beta or approved release of the Safari patch after checking the pre-existing wider release-gate failures. Avoid overwriting newer production work; compare commit SHA and diffs first.
3. In Safari on friend's account, select the **known-good same photo**, confirm a clear “saved automatically” message, reload Profile, and check photo still appears beside public username and Chat/Discussion comments for other people.
4. If Safari still fails, record the **exact UI status text**, iOS/Safari version, whether Profile picker initially enabled, and whether an existing photo appears on reload. Check Storage 401/403 vs image decode errors without collecting private JWTs or publishing account UUIDs. Backend RLS is authoritative; do not weaken it to work around a browser defect.
5. Only after real Safari acceptance mark profile-photo bug fully resolved and update this file **after each verified milestone**.

### Permanent working rules

- Keep **Discussion Boards** and **Chat** separate, maintain privacy and rate limits and auto-save profile photos only after successful conversion.
- Don't fabricate LIVE event dates or research evidence; keep witness public locations approximate.
- Preserve source citations and owner moderation, and do not expose private research files in public feeds.
- Do not claim CI proves a live backend, and do not claim a GitHub commit deployed to Netlify.

## Milestone 4 — real backend inspection and final candidate QA (VERIFIED 8 Nov)

- The owner reports the friend also reproduced the photo problem in Chrome. On iOS, Safari and Chrome share WebKit; this does not rule out the decoding problem, but rules out Safari-specific UI assumptions. **No account/photo diagnosis is final until the friend's next live attempt.**
- Read-only check of the actual Disclosure Desk Supabase project: private `dd-profile-avatars` bucket exists, limited to 1 MiB converted WebP, with authenticated owner-scoped SELECT/INSERT/UPDATE/DELETE policies. There were 4 registered accounts, 3 avatar profile preference rows and 2 avatar objects at inspection. A missing preference row is not itself a defect because `dd_avatar_my_settings()` creates one on first access.
- Recent Storage logs show successful 200 upload entries for existing test photos and repeated 400 missing-photo GETs for another public avatar key; **no matched recent POST upload was visible for that key**. This suggests some attempts did not reach the upload stage, but isn't definitive without linking a user-provided attempt time. Keep real user identifiers/paths out of public handover and support responses.
- Updated `index.html` file input to offer iPhone HEIC/HEIF, and cache-busted `assets/profile-avatars.js` to `nov08-safari-auto-save-v2`.
- Final candidate no-deploy QA [42456366672](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42456366672) **SUCCESS** for this branch after the index change.
- Owner explicitly requested production deployment to test with the friend; proceed as one production branch update. Afterward, check live Netlify publishing separately. The old Beta 14 mobile release gate assumes the now-outdated flag-off 11-tab UI (current social site has additional tabs), and its package gate expects `privateChat:false`/`discussions:false` even though production intentionally enables these features; those failures are **stale test expectations**, not proof the avatar code is broken. Repair these QA assertions separately, without silently disabling approved social features.

## Milestone 5 — production deployment (PENDING verification)

- Production branch must be fast-forwarded from the verified source without replacing independent site changes. Even after source push, verify Netlify release and actual public `assets/profile-avatars.js` text; GitHub success alone is not proof of the website update.
- Ask friend to fully close/reopen the site, open Profile, select the exact known-good picture, and capture only the small status message if not saved. Verify after reload and across Chat/comment displays. No credential screenshot.

## Milestone 5 — approved production source update (VERIFIED 8 Nov)

- User explicitly approved deployment and then reported both Safari and Chrome failing on friend's device before patch release; proceed with targeted photo compatibility fix only.
- Verified fresh GitHub Actions no-deploy test run [42456366672](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42456366672): SUCCESS. Working Chat and Discussions code unchanged.
- Production branch successfully fast-forwarded with lease from `b9fe74e0094599e9677b8b363d8b4f0c4389575e` to **`3b01cdf0e34c93a7cdd831f2c82b6aef798f5127`**, source update confirmed by reading branch head.
- **PUBLIC NETLIFY DEPLOYMENT UNVERIFIED**: neither the website nor deployed asset could be retrieved by available external probes (network/website access errors). GitHub branch update by itself does **not** mean the new bundle is live. The owner's earlier Netlify settings had builds stopped. Check Netlify's Deploys screen, make sure production branch build is active and trigger a deploy if needed, using existing build command `node scripts/build_public_release.cjs` and publish directory `.release-staging/public-site` rather than repository root. This may require owner UI action; don't misreport as live.
- Next: on a published live version with `nov08-safari-auto-save-v2`, friend tests Profile with same known-good image, confirms 'saved automatically', reloads and checks visibility; on failure capture exact Profile photo status text, not passwords or raw user identifiers.
