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

## Milestone 6 — iPhone profile image WebP encoder compatibility (8 Nov 2026)

**Live evidence:** Friend's screenshot of the website Profile on iPhone shows a selected `.png` file and exact status `Photo not selected: This browser could not convert the photo to a small WebP. Try a JPG or PNG.` This proves the old code reached its WebP export check after input selection; changing input extension alone is not an adequate fix.

**Verified source and backend diagnosis:** Existing `assets/profile-avatars.js` decodes via `createImageBitmap` with `Image` fallback, but only uploads when a 512px canvas yields `image/webp`. The live Supabase `dd-profile-avatars` Storage bucket was private, capped at 1 MiB, and initially limited to `image/webp`; SQL owner/visible download policies require the exact opaque `<public_key>/avatar.webp` path, so do NOT rename this file or relax its RLS.

**Hotfix:** `assets/profile-avatars.js` now tries resized WebP, then JPEG at two qualities on the **same rasterized 512px canvas** when the browser cannot encode WebP or produces the wrong MIME; on older WebKit it can use canvas `toDataURL` if `toBlob` is unavailable. Only converted images under 1 MiB are uploaded, with the **actual** `image/webp` or `image/jpeg` content type. The legacy `/avatar.webp` object key remains unchanged for member-avatar loading and owner/visibility RLS, even for JPEG body; original source bytes and embedded photo metadata are never uploaded. Selection still auto-saves; Retry only on failed upload. A cache-busting new asset query `nov08-iphone-jpeg-fallback-v3` and accurate WebP/JPEG explanatory text were added to `index.html`.

**Backend configuration VERIFIED:** Narrowly expanded `dd-profile-avatars` allowed content types from `['image/webp']` to `['image/webp','image/jpeg']` in the existing bucket; independent SQL readback confirmed `public=false`, `file_size_limit=1048576` and precisely those two MIME types. No schema change, JWT changes, RLS changes, uploaded objects, account data or bucket visibility changes were made. Storage API honors explicitly supplied content type rather than inferring from the object filename; source: https://supabase.com/docs/guides/storage/uploads/standard-uploads .

**Tests VERIFIED:** GitHub Actions [42461200439](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42461200439) SUCCESS, including synthetic repro where iOS returns PNG for requested WebP; JPEG auto-upload, missing `toBlob` data-URL fallback, HEIC decoding, Retry, Hide/Remove, account switching, member photo, Chat privacy guard and restricted public bundle. No Netlify site deployed by this CI. Branch `fix/iphone-avatar-jpeg-fallback-nov08`.

**Acceptance PENDING:** Fast-forward this verified source to production if approved, separately confirm actual Netlify deploy/public JS version on `uapdisclosuredesk.com`, and ask the friend to retry the same PNG and reload to confirm actual iPhone-to-live-Storage success. Browser screenshot does not establish a successful live upload yet. If failed, collect only Photo status and browser version; don't request passwords/tokens/UUIDs.

## Milestone 7 — iPhone avatar fix advanced to production source (8 Nov 2026)

- Safe fast-forward of **production GitHub branch** from `b147f9c6942a686a22dea72c2b1fa884eafa1dbd` to verified candidate `725b55f7df2af025f9e3c40e3fd3125745a75851` via non-forced ref update with expected old head. Production readback confirms candidate commit and `nov08-iphone-jpeg-fallback-v3` asset URL. Other website features untouched.
- Existing Supabase profile avatar private bucket configuration update verified separately: supports WebP/JPEG, 1 MiB per photo, still private; no object/RLS changes.
- QA [42461200439](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42461200439) PASSED, including simulated iPhone PNG-to-JPEG fallback, full restricted release package, and Chat/member account-safety regression checks.
- **UNVERIFIED LIVE NETLIFY PUBLISH**: public-domain network checks failed due hostname resolution / site fetch not supported from current environment. A GitHub source fast-forward is NOT a Netlify deploy; if Netlify builds are still stopped, owner must resume builds and trigger `production` branch build using `node scripts/build_public_release.cjs` and `.release-staging/public-site` publish directory. Verify live Home/Profile displays updated “WebP or JPEG” copy before asking friend for real iPhone acceptance.
- **UNVERIFIED REAL USER RESULT**: friend must close/reopen the website and select their same PNG after the live deploy, confirm auto-save status and a persistent profile image after refresh, and that visible profile picture appears in Chat/Discussions. Do not call bug completely fixed until verified.

## Milestone 8 — iPhone AND Android profile photos accepted (OWNER VERIFIED 8 Nov 2026)

- User reports following the `nov08-iphone-jpeg-fallback-v3` hotfix and production site update: **"Apple fix worked profile pics are now working for android and iphone woop woop"**.
- Mark the preceding iPhone WebP conversion issue and Android/iPhone profile-image saving flow **accepted on real devices based on owner / friend testing**. The photo UI no longer requires further duplicate compatibility tests unless a new regression is reported.
- Prior CI and backend checks: [42461200439](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42461200439) passed; private Supabase avatar bucket remains 1 MiB and accepts `image/webp` + `image/jpeg`; owner and public visibility rules were not relaxed.
- Scope of confirmation is **working profile photos on Android and iPhone**. This does not independently verify every browser, every possible file format, or unrelated private Chat push/Play Billing features.
- Next priorities remain separate: GA4 production integration/consent + Realtime verification, and Android native Chat notifications / Play Store release gates. No need to revisit the resolved photo fix without new evidence.

## Milestone 9 — Research Studio last-document and position resume hardening (8 Nov 2026)

**Product decision confirmed:** Re-enter W.NE Research Studio straight into the last open research document at the previous section/position where possible, with a readily accessible **Home** overlay for changing files, creating documents and import. An optional independent Google Drive backup is desirable but is **NOT yet wired** into the web edition; do not claim automatic Drive protection without a dedicated OAuth and restore verification.

- The existing `research/research-entry.js` already looks up `wne-research-last-document:<verified user ID>` and validates a remembered document through existing Supabase RLS, falling back to the latest updated document; the `research/research-workspace.html` already has `⌂ Home` and a non-destructive document chooser. These previously existed; **do not duplicate or replace them**.
- Fixed a missing update: `research/wne-cloud-bridge.js` now saves the per-owner last-document hint **after** the requested document has passed Supabase RLS verification and loaded successfully. This covers changing documents from Home; the next entry will resume the actual last opened document instead of an older one. Does not expose private document content or bypass RLS.
- `research/wne.html` already stores per-document section/scroll/caret values locally and restores them. Extended its saved state to `workareaScroll` and `editorScroll` as well as window scroll, and restores those in the existing two-frame scheduler. Does **not** auto-focus the editor, to avoid unexpectedly opening the mobile keyboard. Values stay local to this browser/device; they do not yet follow a Google Drive/cloud restore to another device.
- New synthetic multi-account regression `scripts/test_research_resume_20261108.cjs` tests owner verification, remembers document only for correct account, denies a changed account, and checks the Home/position integration. CI workflow `.github/workflows/research-resume-check.yml` is no-deploy only.
- **VERIFIED** GitHub Actions [42501326616](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42501326616) passed: source syntax, Research resume test, existing iPhone/Android avatar auto-save tests, Chat safeguards, member-avatar display and restricted static site package. Earlier red runs on this branch were synthetic harness omissions and are superseded by this green run.
- This branch also contains **staged, unshipped** Profile polish (photo information toggle, personal photo in signed-in Profile icons, account deletion support-request link, sources link), which needs separate device/UX acceptance. **DO NOT claim these changes are live.**
- **NOT DEPLOYED:** All these changes currently reside on `fix/research-mobile-profile-polish-nov08`; production GitHub head and Netlify live website were untouched. Before deploying, separately fix/verify the other requested Research Studio features: hosted DOCX Import returning 404, functional backup/recovery/emergency export, simplification and safe navigation, editor toolbar/font-size interactions and navigation dock occlusion.
- **Drive follow-up:** A Google Drive backup for individual users must use their own explicit Google OAuth consent/scoped storage, confirm real uploads and restore, and never reuse one site-owner Drive credential for all users. One-click local download should remain possible without Google connection; live account documents already persist in private Supabase. The original standalone W.NE Drive path was not available in the inspected Disclosure Desk repository, so transplanting it has **not** yet been verified or implemented.
