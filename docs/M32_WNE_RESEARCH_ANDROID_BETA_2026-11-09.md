# Milestone 32 — W.NE Research Beta Android APK, development code only
9 November 2026 · Private Samsung test build · NOT a Play Store release

## Why
The owner requested an installable APK as a less cumbersome way to test the full W.NE Research UX, My Documents, Word import, safe Save/Open navigation and backups, rather than deploying every source change to Netlify. This app is separate from both the production Disclosure Desk website and the older Android TEST companion application.

## Implementation and isolation
- New Android project `android-wne-beta/`, package/application ID `com.boyddigitalstudios.wneresearch.beta`, app label `W.NE Research Beta`, min Android 10 (API 29), target API 35. It installs alongside the existing `com.disclosuredesk.preview` test app and does not touch the public Disclosure Desk APK.
- The APK serves **approved current DEVELOPMENT source files** from its own Android assets using `WebViewAssetLoader` on the reserved virtual HTTPS origin `https://appassets.androidplatform.net/research/index.html`. **This is not a shell pointing at the older live website**.
- The packaging script `scripts/prepare_wne_android_beta_assets.cjs` consumes only the `scripts/build_public_release.cjs` allowlisted static staging package, checks per-file SHA-256 and copies only `research/**`, the approved public config file and the site emblem. It refuses pre-existing output, path traversal, unsafe file types or unreviewed assets. It does NOT package internal GitHub files, SQL, backup archives, credentials or the entire site. `.release-staging` and Android build outputs are GitHub Actions generated only, NOT published.
- Cloud sign-in still uses the same Supabase project as the published Research Edition via its public publishable key, with RLS as the backend security boundary. It needs internet access and a fresh sign-in **within the beta WebView** (Chrome sessions are not shared). It can see the owner's existing cloud reports after sign-in. It does **not** migrate any local standalone Writer data, claim offline cloud saves or silently modify production accounts.
- Native Android `WebChromeClient.onShowFileChooser` supports DOCX/JSON/ZIP file selection from Files/My Files.
- Android `DownloadListener`, a **same-origin restricted** `WebViewCompat.addWebMessageListener` and Android `MediaStore.Downloads` save exported Blob-backed DOCX files in `Downloads/WNE Research Beta`, with filename/extension and 12MB size checks. For non-Blob HTTPS downloads, Android DownloadManager handles the attachment. Native export UX still needs real Samsung acceptance. No global `addJavascriptInterface` is used; WebView file URL access and mixed content are disabled.
- Android system Back is deliberately conservative inside the editor, so it cannot navigate away and discard an unsaved research report. Users should use the W.NE Save/Home workflow. The navigation dock's **Disclosure Desk site exits** go to the real public website in an external browser, never to a missing root path in the Research-only APK.
- No scheduled notifications, ads, Google Play publishing, invasive tracking, data deletion or background account monitoring were added to this beta.

## Build and verification
- Added `.github/workflows/wne-research-beta-apk.yml` on the development branch, triggered by changes to W.NE/Android source and on workflow dispatch. It builds an installable debug APK with a clean GitHub Actions Android SDK/Gradle runner and uploads an artifact named `WNE-Research-Beta-APK` (retained **14 days**).
- Initial build: [GitHub Actions 42545199468](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42545199468), SHA `5bbe698d83a0340c2ea74248abc1601fefecb3b2`, **SUCCESS**. Confirmed artifact ID `13642667997`, output archive 1,280,124 bytes and official expiry **23 Nov 2026**. Verified by CI that the APK contains Research entry, Writer, Workspace, and `wne-beta-build.json`, and does not contain full site root index.
- **LATEST verified APK**: [GitHub Actions run 42545508943](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42545508943) for source SHA `51a7c73896f0a01c387ecc986333f05ca9a7f848`: **SUCCESS**, all APK compilation and embedded asset checks passed. Artifact **`WNE-Research-Beta-APK`**, ID `13643521129`, ZIP size **1,280,289 bytes**, confirmed not expired, retained through **23 November 2026**. This build includes the native navigation correction opening Disclosure Desk links externally.
- Existing research/community no-deploy verification pipeline continues on the development branch. No Netlify build/deploy, public domain change, production-branch change or Supabase schema mutation was made as part of building the Android app.

## First owner test on Samsung
1. Open the **latest successful W.NE Research Beta** GitHub Actions run on the connected GitHub account. Under **Artifacts**, download `WNE-Research-Beta-APK` (ZIP), extract it using Samsung **My Files**, then tap `app-debug.apk`. Authorise **Install unknown apps** only for the trusted file manager/browser when Android prompts. This is a private debug app — not a Play Store release.
2. Open the separate **W.NE Research Beta** icon. Confirm it shows **W.NE Research Edition**, not the old Disclosure Desk homepage. If it displays a white page, error or stale menu, capture the screenshot.
3. Sign in **directly inside the beta** with the owner's Boydamo account; never share a password/token in ChatGPT. Check My Documents lists the real owner-created test documents.
4. Open the saved M30 test document, check the new **File, Home, Insert, Review, View** menus, and check the simplified New/Open/Import Word/Download Word layout.
5. Import the harmless M30 DOCX as a *new* document; save, exit via Home and reopen. Use the Android Files picker, not a custom Termux path.
6. Tap **Download Word copy**, verify the generated DOCX appears under `Downloads/WNE Research Beta`, opens in Word or another viewer, and can be imported again as a separate document.
7. Check **Advanced backup & recovery** remains available but collapsed by default. If the beta offers a full-library ZIP restore, only use a disposable test backup; never restore over the user's real manuscript. The original JSON/ZIP format remains for full-fidelity advanced backup.
8. Report any problem by screen and button name, not passwords or private research. Test with Boydamo only; protect the unfamiliar Yandex visitor and the administrator.

## Important limitations
- **Build success is not device acceptance.** No genuine physical Samsung file picker, Blob download or WebView Supabase Auth test has run yet. It is expected that browser login will NOT carry into the beta automatically.
- Each GitHub debug APK may use a different debug signing key. A later beta version may require uninstalling the previous beta before reinstalling, which clears beta-only local login/session state. **Cloud documents remain in the Supabase account**; save/verify before reinstalling. A stable private signing key and controlled build provenance are needed before any long-term distribution.
- A WebView beta is NOT the Windows/Android standalone fully offline W.NE Writer, nor the production Disclosure Desk mobile app; it is an installable test harness for the hosted Research Edition.
- Do not call account deletion implemented: M26 write-fence SQL is unapplied and self-service deletion is still a support request.
- Do not claim Netlify staging deployment was performed: these source assets are packaged into the APK directly.

**Next:** obtain owner PASS/FAIL for first launch, login, Word import/Download and navigation. Fix failures in the development branch and create another verified beta. Keep the production website bundled release separate and explicitly owner-approved.
