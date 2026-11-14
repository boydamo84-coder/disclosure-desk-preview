# Disclosure Desk M12.2 — Who's Who profile and case Back position (private Android)
Date: 14 November 2026
Branch: `android/m12-2-profile-scroll-return-nov14`
Base: M12.1 editorial-navigation branch `android/m12-who-is-who-navigation-directory-nov14`.
Status: PRIVATE APK CI GREEN; physical Samsung swipe/back and UX acceptance outstanding. No website release and no Netlify deployment.

## Observed user issue
The owner supplied a 13-second Samsung screen recording. Who's Who opens at the directory intro, tapping "Read detailed profile" swaps the page content but scrolls back to the top, and returning to the directory also resets to the same header. At a glance both screens look identical until scrolling, obscuring the transition. The working M12.1 bottom dock must be preserved unchanged.

## Fix
- `assets/people-directory.js`: before opening a person profile, preserve the originating directory `scrollY` and the person's ID in the **directory history entry**, then push the shareable profile URL. No private account data, no server or local sensitive data.
- On opening a profile, after displaying its content, scroll directly to the **profile details/back-button panel** instead of repeating the shared page hero and intro. For person deep links, do the same.
- On browser Back, Android system swipe, and the on-screen Back button, restore the previous directory history entry's saved scroll position after layout. Focus the originating card's existing button without causing scroll. Briefly emphasize the card with a restrained gold outline and reduced-motion styling.
- On opening a profile via a direct URL with no directory entry, on Back show the actual cards rather than the introductory hero.
- When opening a same-site linked Archive case/research dossier from inside a profile, save the current person/scroll context in expiring same-tab `sessionStorage`. On a return through WebView history, restore the relevant profile section. Do not retain a contact, personal note or private user content.
- Search/category filters remain unchanged; existing profiles, 50-entry research data, permission-checked portraits, native Android secure origin boundaries, premium Home and Who's Who bottom dock, chat and ads are not modified.
- `who-is-who.html`: source-card gold return cue CSS, motion-sensitive behaviour, updated bundled script version.

## Regression and release controls
- `scripts/test_m12_2_scroll_return_chromium.cjs` uses real Chromium at 393px and 1280px; tests deep-scroll source-card -> detail top -> Android bridge Back -> exact prior y and highlighted card; confirms filters, direct links, and return from a deep-linked Nimitz Archive case into the source part of a profile.
- Existing comprehensive M12.1 navigation parity, research source, privacy, mobile chat, in-app scroll, and Gradle source tests remain mandatory in GitHub Actions.
- Distinct non-production `com.boyddigitalstudios.disclosuredesk.beta.m122` app, label "Disclosure Desk Beta M12.2", versionCode 31. Can install alongside M12/M12.1 (distinct user storage).
- Build workflow: `.github/workflows/android-test-apk.yml`; GitHub Actions artifact `DisclosureDesk-M12-2-SCROLL-RETURN-PRIVATE-BETA`.
- **No Netlify build, deploy or production-branch change.** Do not merge or publish to Play Store without owner approval and actual Samsung gesture/navigation checks.

## Required Samsung acceptance
1. Scroll deep into 50-person directory, open a person. Their actual profile/back button should appear immediately.
2. Press the on-screen Back or Android edge swipe. The same card and original directory position should return, with a brief gold edge.
3. Repeat with search/filter active, a direct shared person link, and a person profile's linked Archive case.
4. Check smoothness, keyboard visibility, online portrait loads, M12.1 premium 14-tab dock, and test ad placement.

## Final M12.2 build and sign-off gates (14 November 2026)
- [GitHub Actions run 43621364554](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43621364554) **SUCCESS** on exact APK source SHA `f17cb07fd558f8f678ccd89ffcf2a8317a2f460c`. Offline source checks, legacy browser QA, new 393px+1280px scroll return / person highlight / direct URL / active filters / profile case context tests, M12.1 editorial dock parity and Android Gradle debug build all green.
- Artifact `DisclosureDesk-M12-2-SCROLL-RETURN-PRIVATE-BETA`, ID `14123539525`. ZIP SHA256 `99a703fdc1ed093d99a0e67aed02347092b7c9c25ce130df1a72503772f086d6`; unpacked `app-debug.apk` 10,680,043 bytes, SHA256 `68616a3fc24199f73c79c6175c02aaba6799c1338485530951e1d9dd7fc110f4`. ZIP CRC and APK internal ZIP CRC tested; `AndroidManifest.xml`, `classes.dex`, bundled Who's Who HTML and JS confirmed present. Source entry contains `showProfileAtContent`, `restoreDirectoryPosition`, `ddDirectoryReturn`, and `dd-returned-card`.
- QA distinction: the original person profile's Android/system Back path and exact card restoration have automated coverage; a linked Archive case's own history/modal Back sequence may consume an additional Back. The case-context scroll is tested on re-opening the original profile, **not** as a guarantee that a single Back closes Archive and returns to the person. Test that separately on the physical Samsung before accepting that additional behaviour.
- **No Netlify deploy, no Play Store publication, no public website merge.** M12.1 separate premium bar preserved. New M12.2 beta package is intentionally independent of M12.1 for safe user testing.
