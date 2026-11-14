# Disclosure Desk Full-Experience Android Beta M10 — Verified private build / owner testing

**Date:** 14 November 2026. **Status:** Debug-signed APK built and verified; real Samsung device acceptance is the next stage. No Netlify preview/deploy, Play Store publication or production merge.

## What this private APK combines
- Latest verified R2 staged website (research milestones 5–10, M95 premium website nav fallback, Archive/Case Connections, Who's Who 17 public editorial-draft profiles, source-attributed people/cases, Evidence DNA, Contradiction Radar, Source Lineage Desk, responsive graph plus accessible relationship list, contextual ⓘ help popups and updated tours).
- Android M95 native shell: splash, profile image bridge and visible support shortcut, native Research Inbox for Android Share links, offline historical Archive, notification control and existing Android WebView integrations. A guard keeps M94 native News takeover disabled so the original polished website navigation and full News remain.
- Strict public snapshot: **102 allowlisted static files, 15,797,375 bytes**; SHA-256 verified against staged release manifest. Java WebView resolves only vetted local `https://uapdisclosuredesk.com` bundle paths, with file access disabled and no broad JavaScript interface.
- Android-specific Research Inbox guide/FAQ restored from M95 into this private branch's combined `guide.html`, with app name updated to **Disclosure Desk Beta M10**.

## Verified build and artefact
- GitHub Actions [run 43596196245](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43596196245) **SUCCESS** at exact tested source SHA `89e1182acce6375ad356c47c69c76606abe3768c`.
- Artifact `DisclosureDesk-M10-FULL-PRIVATE-BETA` ID `14114901259`, retention **14 days** (download via the GitHub run's Artifacts section). Archive contained one `app-debug.apk`.
- APK: **10,657,300 bytes**; SHA-256 `3621950b4c9690ea12ab9a09a132117716bc78dfdc76937253a2da6b4b09dc5b`. Download ZIP and APK both passed archive integrity tests.
- Package `com.boyddigitalstudios.disclosuredesk.beta.m10`, versionCode 28, separately installable from the main app. Debug-signed; not an update or Play Store release.
- Automated checks passed: offline static source staging + strict site packaging/link audit; M73–M95 Android/native/browser contracts; 320px/393px/820px reply/Chat layout, offline Archive and Research Inbox bridge; R2 Evidence DNA/source lineage/person roles; 393px/1280px research and Who's Who plus new help/tour; offline Java share-link parser; Gradle assembleDebug and artifact upload.

## Test on Samsung Galaxy S24 Ultra (recommended checklist)
1. Install the downloaded `app-debug.apk` separately. The launcher label should say **Disclosure Desk Beta M10**, and the original installed app should remain intact.
2. **Offline cold start:** enable airplane mode, force-stop/reopen the beta; check the bundled News UI, Archive loading, offline catalogue, help popups, guide, Who's Who, and evidence graph. Network features may display offline notices; do not infer an absent network response is an app crash.
3. **Online basic research:** search Archive, open Roswell and Rendlesham, expand Evidence DNA, then Source Lineage Desk and Contradiction Radar; manually switch two sourced statement IDs. In the relationship graph choose **This case** and **All**, inspect original URLs and readable text list, and note any overflow or stuck scroll.
4. **Cross navigation:** Who's Who → Fravor → Nimitz Archive → cited role. Check profile image shortcut, golden navigation, Play/Back/Home, Support shortcut, Research Inbox shortcut and ⓘ page help. Walk through the new **Follow the Evidence** tour and close it while on Archive to check return navigation.
5. **Android Share:** in Chrome Share → Disclosure Desk Beta M10 → set a link name or Later; reopen Research Inbox and test rename/remove. Keep in mind this native inbox is **local only** and separate from synced Boards.
6. **W.NE beta:** explore guest/sample and the editor toolbar, inspect restore/back/backup user messaging. Verify an export in a disposable test project rather than irreplaceable research.
7. **Community/Chat:** check visual layout and keyboard overlay first without posting. Account login, comments, chat, witness submissions and other online writes may connect to the real existing backend. Do not post unintended test content to live services.
8. Send screenshots, exact page, online/offline status and reproducing taps for any problem. Do not update the live site, submit AdSense review, buy products, enable payment or merge staged branches as part of this test.

## Compatibility finding carried to staged web
The mobile Chat flex-height fix in `assets/community-polish.css` was copied to `queue/dd-web-r2-evidence-intelligence`. It prevents intermediate Chat containers collapsing and keeps the scrollable conversation area sized beneath the search/control strip. Full APK browser checks and separate no-deploy R2 web [run 43596694699](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43596694699) passed.

## Release hold
Private test APK only. Does not prove Play Store policy acceptance, public article source editorial accuracy, zero live-backend interaction, all-online features working offline, or physical-phone acceptance. R1 must be accepted as live first. R2 reconciliation, complete integrated tests and explicit owner deployment approval remain mandatory.
