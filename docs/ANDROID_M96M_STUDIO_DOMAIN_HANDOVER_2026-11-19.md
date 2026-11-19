# Android M96M — official Boyd Digital Studios link; M96L/M96K owner acceptance
Date: 19 November 2026 (Europe/London)
Status: PRIVATE M96M APK BUILT AND VERIFIED IN GITHUB ACTIONS; NOT PHONE-TESTED OR PUBLISHED TO PLAY

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

## 19 Nov 2026 — M96M exact-code build verified
- Candidate SHA: `da8cdf51d4a6a180bac92bceafde77719a0d297c` (two QA-only fixes corrected inherited regex expectations from M96L to M96M, without changing shipped behaviour).
- [GitHub Actions full Android build run 44472987172](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44472987172): **SUCCESS**. Strict public snapshot/package checks, source contracts including official-link destination and Android external browser, Chromium navigation/Profile/Chat regressions, pure Java Share/inbox/notification gates, Android SDK, Gradle assembleDebug and artifact publishing all succeeded.
- [Verified private ZIP artifact 14505172358](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44472987172/artifacts/14505172358), name `DisclosureDesk-M96M-STUDIO-LINK-BETA`, size 10,102,405 bytes, expires 3 December 2026.
- Debug package `com.boyddigitalstudios.disclosuredesk.beta.m96m`, versionCode 31, version `0.14.7-m96m-studio-beta-preview`; installs beside M96L. Inherits working Profile login and Chat keyboard source, but **new M96M studio-link tap behaviour on a real Galaxy is NOT yet verified**.
- Link-only no-deploy workflow also passed at candidate SHA [44472985944](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44472985944). An earlier build run [44472756367](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44472756367) failed only on outdated M96L test expectations; it is superseded by the green exact-code run.
- **Release gate:** External HTTP request to `https://boyddigitalstudios.com/` could not be independently verified from this environment; user/owner should open the destination in their actual browser and confirm certificate and correct website before public promotion. Keep `production`, Netlify and Play unchanged; a private APK build does not publish to Play.
- **Next Galaxy quick test:** install M96M alongside M96L, Desk → Boyd Digital Studios website (external browser) → Android Back, Explore → About studio link, footer link, Profile sign-in stays on Profile, Chat/Gboard latest messages. No need to share passwords or private chats.
