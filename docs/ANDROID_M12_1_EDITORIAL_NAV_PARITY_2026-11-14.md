# Disclosure Desk M12.1 — editorial navigation parity (private Android)
Date: 14 November 2026
Branch: `android/m12-who-is-who-navigation-directory-nov14`
Release: PRIVATE APK ONLY. NO public website deployment or Netlify build.

## Physical Samsung feedback
M12 Who's Who displays an incorrect bottom bar: News / Archive / Discuss / Chat / More. The user's actual home page shows the intended gold-on-navy scrolling dock: News / Archive / Who's Who / W.NE / Map / Videos / LIVE / Boards / Witness / Discussions / Watch & Read / Chat / Profile / Explore, with swipe/paging arrows. User supplied paired phone screenshots demonstrating the mismatch.

## Cause and fix
- M95 home page intentionally returns `nativeShell=false` from `android-test/app/src/main/assets/native-shell.js` so the original website nav is not replaced.
- M12 incorrectly set `nativeShell=true` for a bundled research page, thereby showing the older `DeskNavigation.java` (an entirely different tab selection and visual style). That was not the user's intended premium bar.
- M12.1 keeps `nativeShell=false` on known bundled secondary pages, does not show `DeskNavigation`, and injects an Android-only `editorial-secondary-nav.js` source asset when a vetted public research document loads. It replicates the actual index.html dock's 12 base tabs plus the two feature-enabled Discussions and Chat tabs (14 total), symbols, labels, scroll rail, current Who's Who highlight, left/right arrow affordances, navy/gold colours, fixed placement and keyboard-aware hiding.
- The new dock sends category taps to the existing internal app router `/?dd_tab=...` (Who’s Who to `/who-is-who.html`). Tapping Who’s Who from a profile invokes existing history-safe `DDPeopleDirectoryBack`; system swipe still checks profile first. The native ad stays below the web viewport; the in-document nav sits above it.
- No home nav markup changes; no website publication, Netlify or SQL updates; unchanged source biographies and portraits. Existing M12 Android private Research Inbox and W.NE are preserved.
- Distinct debug install: package `com.boyddigitalstudios.disclosuredesk.beta.m121`, versionCode 30, label `Disclosure Desk Beta M12.1`, to avoid overwriting M12 private research data and possible debug-key changes.

## Test plan
- Static contract checks include Android origin/route whitelist, no broad JS bridge, package isolation and public content staging.
- Dedicated `scripts/test_m12_editorial_secondary_nav_chromium.cjs` loads the real home `nav.nav`, compares all 14 tab IDs, icons and labels to the injected secondary nav on 393 and 820px viewports, checks nav arrow scrolling, keyboard hiding, Who's Who profile return and Map internal route.
- Android compiler/Gradle private artifact build and full mobile/site regression run in `.github/workflows/android-test-apk.yml`. Build has NO Netlify actions.
- Physical Samsung Galaxy test still required: compare both screenshot dock rails, tap scrolling arrows, go Who's Who -> profile -> back-swipe, tap W.NE and Map, check ad placement/keyboard visibility, airplane-mode reload and Home nav unaffected.

## Safety and status
A green source/browser/compiler run means the private APK can be tested, not that Samsung UX is signed off. Do not promote GitHub production, Netlify, public Play Store or R2 website research data without separate owner approval. R1/R2 release queue remains unchanged.
