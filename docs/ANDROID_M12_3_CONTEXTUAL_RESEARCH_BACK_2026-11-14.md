# Disclosure Desk Android M12.3 — contextual research Back and source-position return

Date: 14 November 2026
Private branch: `android/m12-3-research-return-nov14`
Baseline: `android/m12-2-profile-scroll-return-nov14`
Stage: **PRIVATE APK CI GREEN, Samsung physical acceptance pending**. No public website, Netlify, Play Store or production merge.

## Why M12.3
M12.2 fixed the same-document Who's Who directory→profile→directory scroll issue. However, the case record in the Home/Archive shell creates its own modal history entry, often replacing or consuming WebView Back history. Browsers can therefore stay on Archive instead of returning to the person they came from, even though the person profile's scroll offset was recorded.

## Implementation
- The original `assets/people-directory.js` now records a bounded source context *only when the user clicks a local cited case or dossier from within a person profile*, including person ID/name, its canonical path/query, source scroll Y, optional original directory card Y and the exact case/dossier target.
- Clicking that supported link also adds `dd_from=who` as an explicit origin marker. The context is same-tab `sessionStorage`, expires in 15 minutes and is consumed on the correct profile's return. No account, private note or identifying user information is stored.
- New **Android-only** asset `android-test/app/src/main/assets/research-return-nav.js` validates the explicit marker, same-origin Who's Who URL, matching person ID and destination, freshness and allowed path. With a valid context, an Archive case gets a prominent navy/gold **Back to [person]** control. It survives case content redraws via a scoped MutationObserver. The supported original research dossiers offer the same control. Ordinary Archive browsing has no return interception.
- The Android WebView runs the asset on canonical bundled Home and reviewed secondary research pages, and `onBackPressed()` checks this validated return route **before** generic Archive dialog close/history. If no verified origin exists, previous native Back behaviour remains unchanged.
- Returning to the original person restores its case-source reading position. Returning from the person to Who's Who directory restores the original person's card, scroll and gold cue even after crossing documents.
- Existing M12.1 premium 14-tab dock, M12.2 directory scrolling, article content, Archive data, news/Chat, ads and W.NE are unchanged.

## Test gates
- `scripts/test_m12_3_contextual_return_contract.cjs`: Android code path, origin safety, explicit marker, expiry, return URL allowlist, isolated debug package, unchanged public index.
- `scripts/test_m12_3_contextual_return_chromium.cjs`: real loopback Chromium at 393 and 820px; 3-stage directory→person→linked Nimitz case→person→directory with contextual Android Back and restored scroll, dossier return button, and refusal to hijack normal Archive or forged-marker visits.
- Existing M12.2/M12.1 source and Chromium acceptance must stay green. Android Gradle debug compile must pass.
- Distinct private package `com.boyddigitalstudios.disclosuredesk.beta.m123`, versionCode 32, label **Disclosure Desk Beta M12.3** to keep previous beta installations safe.

## Samsung hardware acceptance
1. Open David Fravor from the Who's Who list, scroll to the Nimitz case and open its Archive record.
2. Check **Back to David Fravor** at top of Archive case; tap it and check profile scroll returns to the linked case section.
3. Repeat but use Android's side-swipe Back gesture while Archive case is open. Should immediately restore David Fravor's original reading position.
4. Press Back on the person profile and confirm the directory returns to the same card with a brief gold border.
5. Repeat Larry Warren → Rendlesham dossier and test both Android Back and the visible return control.
6. Independently open Archive from home; Back must still close the case or use ordinary app navigation, with *no* inappropriate person return button.
7. Check the premium dock arrows, Watch/Read, W.NE and test ad positioning.

**No claim of production readiness or physical hardware success before device confirmation.** CI success only approves a private APK test.

## Verified final private build (14 November 2026)
- GitHub Actions [run 43630612793](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43630612793): **SUCCESS**, exact source commit `79f0901edd7c37829b444a6daeaf6617147e9fc8`.
- Static source/package/route checks, prior 393px/desktop Who's Who scrolling, M12.1 premium 14-tab UI, M12.2 regression, new 393px/820px contextual origin/Archive/dossier return tests and Android Java/Gradle compilation all green.
- Published artifact `DisclosureDesk-M12-3-RESEARCH-RETURN-PRIVATE-BETA`, ID `14127718427`. ZIP SHA256 `ce3eff34b4e270e252949940eb2b182b5c4f7602a373c1351c594c5cfad341b1`.
- Unpacked `app-debug.apk`: 10,682,950 bytes, SHA256 `58b6171edefa12514ed03b9e163947dbd1cd5b0f562c2a0a7dbc1d042be56b94`. ZIP and APK CRC tests clean; verified `AndroidManifest.xml`, `classes.dex`, `assets/research-return-nav.js`, and bundled Who's Who HTML/JavaScript.
- Final Chromium tester also maps only Android's vetted clean dossier routes to their actual HTML files rather than treating a Python server's 404 as a valid page.
- No production or Netlify change. Device Back gesture + actual Android ad placement have **not** been confirmed on the user's Galaxy yet; label is private beta only.


**USER PHONE FEEDBACK — 14 November 2026:** After installing and testing the M12.3 private APK, owner reported **“Works well woop woop”**, confirming the implemented navigation feels correct on their Android phone. Mark **user-reported navigation acceptance: positive**. Individual checklist items (each dossier, Android gesture variant, test ad placement, keyboard/flight mode) were **not separately reported**; do not imply that every hardware test was performed or that production release is approved. The next planned milestone is M13 Who's Who editorial/image polish. Retain the known-good M12.3 private baseline and all Netlify/production safeguards. No deployment requested.
