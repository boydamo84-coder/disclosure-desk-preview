# M81 Private Android Beta — Native Research Inbox (11 November 2026)

**Branch:** `android/m81-native-research-inbox-nov11`  
**Test package:** `com.boyddigitalstudios.disclosuredesk.beta`  
**Version:** `0.12.0-m81-private-beta-preview`, versionCode 18

## Purpose and Play review context

The current product already has substantial original Disclosure Desk functionality (UAP sources/news, maps, discussion and community tools, archive and W.NE Research), but it still uses WebView for most UI. Google Play does not automatically prohibit the app owner's own WebView. It reviews permission to use the site, adequate mobile functionality, stability and meaningful content, among other policies. See:
- Google Play Spam: https://support.google.com/googleplay/android-developer/answer/9899034
- Google Play Functionality: https://support.google.com/googleplay/android-developer/answer/9898783
- Google AdMob app readiness: https://support.google.com/admob/answer/10564477
- Google AdSense original value: https://support.google.com/adsense/answer/7299563
- Google app-ads.txt: https://support.google.com/admob/answer/14538460

**No claim that Google has approved the application.** App review and AdMob review are separate, and website AdSense review is separate again. A niche UAP subject is not by itself an automatic disqualification; useful original content, rights to third-party materials, moderation, app stability and policy compliance are important. Google can still reject a WebView-heavy implementation after review.

## Native capability added in M81

- The Android OS Share sheet lists **Disclosure Desk Beta** as a receiver for shared **text/plain** website links from Chrome or any other app.
- A shared source is validated as normal HTTP/HTTPS, stripped of trailing punctuation, limited in length and screened against user:password credentials and common OAuth/session token query or fragment parameters. **The app never automatically opens a shared URL.**
- The item is stored in a device-only, private app preference, deduplicated with newest first and limited to 50 links. No accounts, Supabase, Google Drive, W.NE documents, or external endpoints are changed by saving a link.
- Find it in **Profile → Profile settings → Research Inbox → Open Research Inbox**. The native list offers **Open in browser**, **Copy link** and **Remove**; **Clear all** is protected by confirmation. URLs always open in an external browser, not as trusted app-origin JavaScript.
- The native offline-error screen also has a **Research Inbox · saved links** button. Saved link details remain accessible offline; opening an external source naturally still requires a network connection if that website is not cached separately.
- The inbox is **not synchronised, is not account-scoped, and is visible to anyone using this app installation**. This is clearly stated in native UI; do not place secret URLs in it. Uninstalling the beta may remove saved links.
- The existing origin-pinned, main-frame-only `DDAndroid` bridge is reused for the Android-only Profile control. No broad storage permissions, clipboard reading or background uploads are added. Previous notifications, Chat, web replies and Android Back remain intact.

## Samsung Galaxy S24 Ultra acceptance checklist

1. Install the verified M81 private APK, or retain M79 until M81's GitHub Actions build succeeds. If an install fails due to GitHub debug signing, back up any device-only app data before uninstalling **only** the Beta package.
2. In **Chrome**, open a normal public UAP source/article → **Share** → choose **Disclosure Desk Beta**. The app should open with a message that the link was saved.
3. In the app, open **Profile → Profile settings → Research Inbox**, view the saved source, copy its URL into the clipboard and open it in your normal browser. Confirm a second share does not duplicate the same URL.
4. Remove a single test link and verify it disappears. Test **Clear all → Cancel**, confirm that your saved link remains; then test **Clear all → Clear links** with disposable links only.
5. Try sharing plain text without a web URL. The app should explain that it needs a normal website link and should not create an item.
6. Toggle airplane mode. Existing saved links should still be listed; if the native offline error panel appears, its saved-links button should open the same list. Turn airplane mode off afterwards.
7. Confirm earlier working behaviours: Chat full-screen mobile layout, nested replies, Post buttons above keyboard, small post-success scroll and **Profile settings → App notifications**. No Firebase private Chat push or paid billing should appear as working.

## Build and verification

Private GitHub Actions workflow `.github/workflows/android-test-apk.yml` runs M73–M79 source and Chromium tests, new M81 Profile component browser tests at 320/393/820px, pure JVM URL safety tests, SDK36/Gradle compilation and artifact upload. The artifact is named `DisclosureDesk-M81-PRIVATE-BETA` only if the complete job passes.

**This branch is Android-only.** Do not copy its `MainActivity.java`, manifest, store, parser or JVM tests into the pending website release `fix/m80-web-mobile-reply-parity-nov11`. That separate website branch already passed its own full no-deploy CI; no Netlify deployment is authorized by this build.

## Future review and Work-mode handoff

The user **already has a Google Play Console developer account**. A future interactive Google Play Console review is a good task for ChatGPT **Work mode**: read the latest `MASTER_HANDOVER.md`, inspect the existing app/package and eligibility, app signing, testing tracks, target-audience/moderation, privacy declarations, data safety, ads and `app-ads.txt` requirements **without submitting any release or spending money without explicit owner approval**. The current testing APK does not grant Play Store or AdMob approval. Keep the native share inbox device-only unless the owner separately approves a cloud-backed feature.
