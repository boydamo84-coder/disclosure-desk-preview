# Android M96M — official Boyd Digital Studios link; M96L/M96K owner acceptance
Date: 19 November 2026 (Europe/London)
Status: CODE STAGED — NOT BUILT OR INSTALLED AS M96M, NOT PUBLISHED TO PLAY

## Parent and scope
- Branch `android/m96m-bds-official-link-nov19` starts from verified `android/m96l-profile-auth-stay-nov19`.
- The HTML asset snapshot `index.html` has clickable official `https://boyddigitalstudios.com/` links in the Explore/About card and premium footer.
- Android native Desk menu gets `Boyd Digital Studios website`, which opens the official URL in an external browser using Android `ACTION_VIEW`. The user retains the same premium nav, website HOME domain and Support/Ko-fi destination.
- M96L Profile-local sign-in and M96K Chat Gboard viewport improvements are kept, not reverted. The APK beta identity and versionCode are inherited and **must be revised for a later distributable beta**; this stage is not an APK artifact.
- No old Wix URL found in checked current web/native entrypoints; no bulk substitution or modification of unrelated domains.

## User's real Galaxy test result
- **PASS, owner-reported:** M96L Profile sign-in screen works on the owner's Samsung Galaxy and keeps the Profile page instead of jumping to Boards.
- **PASS, owner-reported:** M96K Chat keyboard fix reveals the newest chat messages while typing.
- This resolves those two specific prior *device-acceptance-pending* blockers. It does not claim success for push delivery/account isolation, reset/confirmation, offline archive, all-device visual QA, or M96M's new link, which is not yet installed.

## QA and packaging
- Static source contract `node scripts/test_bds_official_link.cjs --android` verifies official destination, external browser intent, old Wix absence, unchanged Disclosure Desk HOME and Ko-fi.
- Exact-head no-deploy GitHub workflow: `.github/workflows/bds-official-domain-no-deploy.yml`. Check run outcome.
- Prior to next APK release: bump Android beta identity/versionCode, run full M96L regression suite and Android Gradle build, device-test native Desk external-link/back flow, About and footer link, Chat keyboard and Profile sign-in, and account-safe notifications. Only then consider Play/internal distribution.
- No production `uapdisclosuredesk.com` change, Supabase data write, ads enablement, Netlify deployment, or Play Store publication in this milestone.

## Separation from current website
The Android M96L snapshot is not identical to 19 November `production`; newer Who's Who and international programme content must be curated into a later APK release separately. Do not merge the whole `production` tree into this APK merely to carry the domain link.
