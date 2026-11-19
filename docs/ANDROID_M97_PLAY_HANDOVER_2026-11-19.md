# Disclosure Desk Android M97

19 November 2026 · Play closed-test candidate

## Version and source

| Item | Value |
| --- | --- |
| Android baseline | Owner-tested M96M at `b40d8f0c093cd10ec3687cf8eb3fe1d79f837c70` |
| Website baseline | Production M76 at `910d755916cdf72ea7c7df39bbf7a5c76832d649` |
| Play package | `com.boyddigitalstudios.disclosuredesk` |
| Private APK package | `com.boyddigitalstudios.disclosuredesk.beta.m97` |
| Version | `0.15.0`, code `32`, Android API 26 minimum and 36 target |

The production build and the live release manifest matched across all 130 files before Android-specific changes. M97 packages the current Who’s Who directory, international UAP programmes, source enquiries, source-linked case research, the private evidence worksheet and Hypothesis Lab. The Android bundle carries over the Chat keyboard handling and Research Inbox help from M96M. Profile-local authentication and the Boyd Digital Studios link are in M76 and verified against the Android source contracts. Public Who’s Who ballots and the website’s Adsterra code remain disabled.

The embedded site excludes the Google Analytics script, measurement ID, settings and consent prompt. The Android WebView rejects direct requests to Google Analytics and Tag Manager hosts. Firebase Cloud Messaging remains separate and requires its own configuration. Live AdMob and paid Remove Ads are disabled in this release candidate. The private APK retains AdMob test inventory.

## Build verification

- Android source `a897ad3a6915827a952758b55df58759a7a712d8` passed Gradle builds for APK and AAB, APK signature verification, bundletool, Android 16 target inspection and 16 KB alignment checks. All 130 embedded files were verified against the Android staging manifest. The public running [GitHub Actions checks](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44583908560) cover the same source.
- Source, Chromium and JVM checks passed, including Profile-local sign-in, Chat, international programmes, the private worksheet and Google Analytics retirement. The release bundle retains AdMob’s SDK permissions for future use. Confirm the advertising ID declaration against final release behaviour in Play Console.
- The Play kit includes the unsigned bundle, listing copy, verified icon and feature graphic. Real-device acceptance, screenshots and the signed Play upload are pending.

## Test on the Galaxy

Install the M97 private APK alongside M96M. Keep M96M installed if it contains local Research Inbox links or research. Account data is available after sign-in. Local links and drafts belong to the installation where they were created.

1. From Explore, open Who’s Who and select David Fravor. Open **Assess this claim privately** and check that answers stay in the current session. Use Android Back to return to the directory.
2. Visit international programmes, Sources, archive case details and Hypothesis Lab. Open a source, then return to Disclosure Desk. Test the Offline Archive once in airplane mode.
3. Open Profile and sign in. Confirm the app stays on Profile. Open Chat, bring up the keyboard and check that the newest message stays above it.
4. Share a spare link into Research Inbox. Open a clip in fullscreen and confirm Back restores the app navigation. Confirm News and Video notification preferences can be changed in Profile.

## Play Console handoff

Use the existing Disclosure Desk Play Console app entry. Compare its exact package, highest uploaded version code and upload certificate before signing. Build `:app:bundleRelease` with the registered upload key through the existing `DD_UPLOAD_KEYSTORE_PATH`, `DD_UPLOAD_STORE_PASSWORD`, `DD_UPLOAD_KEY_ALIAS` and `DD_UPLOAD_KEY_PASSWORD` environment variables in the signing environment. The candidate bundle produced without them is unsigned. Verify the upload certificate and package before uploading the signed bundle to a test track.

Complete Data safety and App access based on the tested release. The app has optional account email and authentication, profile details and photos, private messages, public contributions, optional witness reports and research content. Hosting logs, embedded media, optional Google Drive exports, WorkManager notifications and the packaged SDKs need to be reviewed against their actual runtime configuration. Use a dedicated, non-admin reviewer account if review needs access to signed-in features. Check reporting and blocking in Discussions and Chat, and complete the content rating, target audience and advertising declarations.

The app already offers **Profile → Account & Security → Delete my account**. M97 adds a clearly labelled email request section to the bundled privacy policy. Publish and verify the same public section at `https://uapdisclosuredesk.com/privacy#account-deletion` before using it in Play Console. Confirm support can verify ownership, fulfil requests across account-linked data and communicate any required retention. Backend self-service deletion is still in staging.

Capture screenshots from the candidate installed on a real device and provide the listing icon and feature graphic. For a personal developer account subject to Google’s closed-testing rules, enrol at least 12 testers who remain opted in for 14 continuous days, then apply for production access. Keep the test track and public production release as separate steps.

## Draft Play listing

**Title**  Disclosure Desk

**Short description**  Follow UAP news, explore case archives and organise your own research.

**Full description**

Follow news about unidentified anomalous phenomena and trace reported cases back to their sources. Browse historical archives, explore a case map, watch hearings and look up researchers, witnesses and officials in the source-linked Who’s Who directory.

Use Investigation Boards, W.NE Research Studio and the Hypothesis Lab to collect sources, compare possible explanations and record unanswered questions. Save links from other Android apps to your Research Inbox, and use the Offline Archive when you’re away from a connection.

Public material is available to browse as a guest. An optional Disclosure Desk account adds community discussions, private chat and tools for saving your research. Independent reporting, testimony and original records are identified so you can review the evidence yourself.

**Closed-test release notes**

Updated the case research and Who’s Who directory, added the private claim worksheet and Hypothesis Lab, and removed Google Analytics. This build carries forward the Profile sign-in and Android Chat keyboard fixes.

## Google Play references

- [Target API level](https://support.google.com/googleplay/android-developer/answer/11926878)
- [App signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Account deletion and user data](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Testing requirements for newer personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
