# Disclosure Desk Android M75 — Private Beta Test Notes
_Last updated 11 November 2026_

## What this build contains

This is a **parallel-install test APK**, not an app-store submission. The debug package is `com.boyddigitalstudios.disclosuredesk.beta`; it does not overwrite the separate production-package installation. The app's own WebView serves the **exact approved public website snapshot from this GitHub development branch** under the canonical HTTPS origin. The snapshot is constructed from `scripts/build_public_release.cjs` and hash-verified, then copied into Android assets by `scripts/stage_android_dev_snapshot.cjs`.

That includes pending site-only M70–M74 changes: unified comment/action rails, Discussion-style nested replies, More > Edit/Delete, Post reply + Cancel and the branded confirmation window. **These do not need a Netlify deployment to appear inside this APK.** Online services remain live: accounts, Supabase comments, Chat, Boards and stored documents use the existing backend; public/news feeds fetch network sources where applicable. **A test comment you actually post is real public content** and deleting real personal content is irreversible. Use only disposable test posts when checking deletion.

## Getting the APK

1. Open GitHub repository `boydamo84-coder/disclosure-desk-preview` > **Actions** > **Build Disclosure Desk M75 PRIVATE Android APK (NO Netlify)**.
2. Select the run on branch `android/m75-private-beta-integration-nov11`. Check **both** the snapshot-validation and Gradle build steps are green.
3. Under **Artifacts**, download `DisclosureDesk-M75-PRIVATE-BETA`. GitHub bundles the APK in a ZIP; extract it to get `app-debug.apk`.
4. On the Galaxy S24 Ultra, open the extracted APK through **My Files**, approve the one-time installer permission if Android asks, and install **Disclosure Desk Beta**. Only install an APK from this verified GitHub Actions run; do not disable Play Protect globally.
5. Sign in with a non-sensitive test account if possible, then exercise News, Discussions, Archive, Watch & Read, Videos, Case/Hearing and Profile. Test the More action on a disposable comment, Cancel vs Delete, nested replies and the Android Back button. Check your live website separately to confirm the new popup is still *not* there until a separate Netlify release.

## Current limitations, not to misrepresent as complete

- Real private Chat push needs the Firebase project, registered device tokens, a secured server dispatcher and logout tests; the setting is disabled in M75.
- Lifetime Remove Ads billing is explicitly disabled until Play receipt verification, acknowledgement and refund handling are complete. Debug AdMob inventory is Google's test inventory and still subject to consent setup.
- Android is a native WebView shell with selected native integrations; the whole web UI has not been rewritten as a fully native application.
- Bundled interface changes require a new APK. Backend data and news can still refresh over the network without a website deployment.
- Android's debug signing identity can differ across GitHub runners. If a later test APK refuses to update an older Beta installation, uninstall **only** `Disclosure Desk Beta` and reinstall; this may clear that test installation's device-only local data. Do not uninstall the normal app to resolve a beta-signature conflict. Stable dedicated beta signing should be arranged before repetitive tester distributions.
- First Play closed test and public release remain **not approved**. Complete account deletion/blocking, RLS/privacy, notification delivery, purchases/consent, API compatibility, Play policies, real Android tests and signed AAB separately.

## Developer repeatability

The GitHub Action builds from the same source snapshot as the branch. It invokes:
```sh
node scripts/test_m73_comment_owner_contract.cjs
node scripts/test_m74_confirmation_contract.cjs
node scripts/test_android_news_cadence_20261108.cjs
node scripts/build_public_release.cjs
node scripts/stage_android_dev_snapshot.cjs
node scripts/test_android_dev_snapshot_contract.cjs
node scripts/test_android_m75_source_contract.cjs
cd android-test && gradle --no-daemon :app:assembleDebug
```
This workflow does **not** deploy to Netlify, write Supabase data, submit to Play or alter `production`. Do not claim an APK exists until the Actions run succeeds and its artifact is present.
