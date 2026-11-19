# Disclosure Desk M98 Android app tour

19 November 2026 · version 0.15.1 · version code 33

M98 extends the M97 Android release candidate. It offers an optional five-step tour on the first normal app opening and from **Desk → App tour** at any time. Steps cover the bottom tabs, Desk shortcuts, Android Share, managing Research Inbox links, and using the Offline Archive and alerts. The inbox step can open the actual inbox. The same installed Share target name appears in the tour, the empty inbox and its help.

A share or notification opening goes straight to the requested action. News and video alerts can be enabled under **Desk → Notification settings** or in Profile settings. Existing notification choices persist. The app tour takes the place of the Android first-run welcome and automatic alert prompt. Tools in the website’s optional research tour remain available.

## Build verification

Source `24f59fa741c70de57b31e2356d3d3fe326b51880` built the private APK and unsigned Play AAB. The APK signature and 16 KB ZIP alignment passed, and bundletool validated the release AAB. Both contain the native tour, retain the Google Analytics removal and target Android API 36. Browser checks confirmed that Android receives the app tour entry point without the website welcome and that the optional site tour remains accessible. [Android CI run](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44586110624)

The live public privacy page was checked on 19 November. It still needs the dedicated account-deletion section staged in the Android branch. The next device check is a Galaxy run through the tour, Chrome Share, and the optional-alert settings.

## Galaxy test

1. Install the M98 private APK alongside M97. Open it from the launcher and run the tour. Try Back, Skip and Done. Relaunch and replay it from Desk.
2. From Chrome, share a webpage into **Disclosure Desk Beta M98**. Name it, then find, copy, rename and remove it in **Desk → Research Inbox**. Test the share on a fresh installation before opening the app icon.
3. Open the Offline Archive in airplane mode. Restore the connection and confirm the live pages load. Test bottom tabs and Chat with the keyboard open.
4. Test the tour at a larger Android font size and with TalkBack. Confirm that alerts request permission only after choosing and saving an alert in settings.

The private beta uses a separate application ID. Keep M97 installed if it has device-only Research Inbox links you need. Neither this tour nor the new test package moves links across installations.

## Release priorities

| Stage | Required work |
| --- | --- |
| Before closed testing | Run the Galaxy test on the same source that will be signed. Exercise sign-in, password reset, sharing, Android Back, fullscreen video and poor connectivity. Confirm the Play package and upload certificate, sign the bundle, take real-device screenshots and complete app setup in Play Console. |
| Before public rollout | Confirm the public account deletion link works without the app and support can complete a request. Test members’ ability to report abusive content and block another member, and confirm a moderator can act. Complete Data safety, App access, content rating and advertising declarations for the submitted build. Complete the account’s required Play closed test. |
| After launch | Consider an explicit export of device-only Research Inbox links and a feedback shortcut for testers. Keep experimental voting, live ads, paid ad removal and private Chat push outside the launch scope until they are ready. |
