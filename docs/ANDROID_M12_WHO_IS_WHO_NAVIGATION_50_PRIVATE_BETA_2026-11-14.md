# Disclosure Desk Android M12 — Who's Who and navigation handover
Date: 14 November 2026
Branch: `android/m12-who-is-who-navigation-directory-nov14`
Base: `android/full-experience-m11-r2-nov14`
Status: PRIVATE BETA UNDER CI + ANDROID HARDWARE ACCEPTANCE REQUIRED. NOT APPROVED FOR WEBSITE RELEASE.
Netlify: NO DEPLOYMENT. Main/production untouched. Do not trigger builds until credits reset and owner approves staged R1/R2 schedule.

## User feedback and scope
- Samsung Android back swipe when in Who's Who exits the app rather than returning within the people directory.
- The native premium bottom navigation disappears on Who's Who.
- Request portraits for the research profiles, with credit and reuse rights.
- Expand Who's Who from 17 to 50 people, especially disclosure-related congressional figures and scientists.

## Implemented source work
1. `MainActivity.java` now recognises an explicit HTTPS allowlist of bundled secondary pages using `isEmbeddedSecondaryPage`; preserves native premium bottom nav while leaving the research page's own header unduplicated.
2. Native bottom tabs on a secondary page return via home router `/?dd_tab=...` rather than ignoring user taps.
3. Android 13+ predictive swipe uses registered `OnBackInvokedCallback` to dispatch through the in-app Back handler; unregistered on Activity teardown. Older API retains existing back logic.
4. Who's Who JavaScript exposes `DDPeopleDirectoryBack`; a profile opened from the directory uses true history back, a direct URL replaces its profile query and safely shows the directory. Native Back checks open profile first; otherwise WebView history or Explore home fallback.
5. Who's Who has exactly **50 profiles**: 17 existing detailed source-linked R2 profiles, 17 NASA independent-study researchers/coordinators, 10 congressional transparency/oversight figures, and 6 additional public researchers/journalists/witnesses.
6. **17 image records** currently have individually checked Commons source and public-domain/CC rights; others intentionally use professional initial tiles. All sources and licence attribution shown on detail and card. Images are externally hosted and may not be present offline; missing pictures fall back to initials. The requirement for a verified portrait for every person remains **OPEN**.
7. Expanded category selection for Congress, NASA study, scientists, disclosure transparency, FOIA. Preserves navy/gold theme, deep links, inline profile biography, podcast, video, cases and source provenance.

## Editorial caution
- New 33 profiles use primary-record biographies and sources, but are editorial drafts awaiting full link-by-link fact checking, episode credit checks, independent reader review and original source validation.
- NASA panel participation is NOT evidence for an extraterrestrial origin; congressional membership is NOT proof of an allegation.
- Profiles without a verified episode, film appearance or social handle show honest empty states, not fictional links.
- Site and app do not download or embed unlicensed third-party portraits.
- `data/public-people-directory.json` is marked `research-copy-edit-needed`. Do NOT merge into public production without final editorial review, profile image review, and Netlify credit budget approval.

## Private APK build
- Workflow: `.github/workflows/android-test-apk.yml`; push only branch M12 or manually dispatch. Job builds a separate debug APK under application suffix `.beta.m12`, versionCode 29; label "Disclosure Desk Beta M12". It is separate from production and prior M10 debug builds.
- Artifact name: `DisclosureDesk-M12-WHOS-WHO-PRIVATE-BETA`.
- Existing compatibility contracts from M10/M11 updated to reflect M11's explicit `EmbeddedWebsiteRoutes` router and the new beta package; no reduction in allowlisted origin security.
- New static source test: `scripts/test_m12_who_directory_android_contract.cjs`; existing Chromium tests updated for 50 people and image-credit/fallback behavior.

## Hardware QA checklist (not yet confirmed)
1. Install M12 debug APK on Galaxy S24 Ultra without uninstalling production. It should display Disclosure Desk Beta M12.
2. Open Explore > Who's Who, verify premium bottom nav is visible while reading the directory and a detailed profile.
3. Tap a profile and swipe back once: goes to directory, NOT out of app. Swipe back again: return to prior app screen or Explore.
4. Open a deep-linked `/who-is-who?person=david-grusch` and test Back: profile to directory then home. Repeat at bottom and with search filters.
5. Tap every bottom tab (News, Archive, Discuss, Chat, More) from a secondary page; verify no dead taps or unwanted app exits, and correct selected tab.
6. Inspect 50 profiles and role filters; ensure images of the correct people, proper source credit links, no erroneous portraits, no broken image blocks in offline mode.
7. Verify video embeds still require a tap, no ad/purchase regression, navigation preserves private offline research, and the app does not fetch unsafe unknown files.
8. Observe a full Android offline/flight-mode restart: staged profiles should remain browsable, photo initials fallback expected where images cannot load.

## Next action
Wait for the full GitHub Actions M12 private beta job to pass, then download the APK build artifact and user-test on the phone. If red, inspect job logs and fix; do not claim complete or deploy Netlify.
