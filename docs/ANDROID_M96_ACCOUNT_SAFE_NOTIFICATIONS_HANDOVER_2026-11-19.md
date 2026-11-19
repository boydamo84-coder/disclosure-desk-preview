# Disclosure Desk Android — M96 Account-Safe Notifications (19 November 2026)

## Verified project and branch
- Repository: `boydamo84-coder/disclosure-desk-preview`; APK source branch: `android/m96-account-safe-notifications-nov19`, based on verified **M95 restored editorial design**. Do **not** use legacy `disclosure-desk` repo or M94's disliked replacement dock/native headline feed.
- Android debug package: `com.boyddigitalstudios.disclosuredesk.beta.m96`, versionCode **28**, versionName **0.14.4-m96-private-beta-preview**. Parallel install: does not uninstall M95; each beta has different device-local data.
- GitHub Actions [M96 APK run 44436204808](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44436204808) passed on exact code SHA `a33a66929b5312d6616ff8e05ca8d7023f349f88`. Includes approved web snapshot validation, prior source/mobile/Chat/Archive/Research tests, Android Share and new notification-gate JVM tests, SDK/Gradle compile and APK artifact.
- **Verified Actions artifact:** [DisclosureDesk-M96-PRIVATE-BETA](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44436204808/artifacts/14489367208), 10,098,592-byte ZIP, retained for 14 days under workflow settings. This is an Actions artifact, not a sandbox file. APK exists within ZIP; private test only. **No Galaxy S24 Ultra installation/functional acceptance verified yet.**
- Earlier failed M96 runs `44436070875`, `44436191329`, `44436194240`, `44436199591` were iterative build/test failures, superseded by the green exact-code run above. Do not claim all previous builds passed.
- No Netlify deployment, live site change, Google Play publication, Supabase migration, personal data write, or new account created for M96.

## M96 implementation
1. **Account-gated private chat alerts.** `ChatNotificationGate.java` requires valid UUID recipient ID and pair ID; a notification chat tap is accepted only when the locally active account matches the intended recipient. Each recipient+chat PendingIntent gets a scoped request code.
2. **Device notification centre** in the native Desk menu: `NotificationInboxStore.java` retains up to 60 safe title/route entries with 14-day TTL and per-entry read/unread flags. The store explicitly excludes message bodies, auth tokens, sender emails/names, private message content and vote data. News/video remain public, chat entries are account-scoped.
3. **Account transition clearing.** When the authenticated web main-frame bridge indicates sign-out or account change, M96 clears private chat notifications and device-local private chat inbox records; it also removes old FCM token association in logout flow. Public News/Video history remains untouched.
4. **Safe FCM routing.** `ChatPushService.java` checks message type, active recipient and pair identifier and user notification opt-in before showing the neutral `Disclosure Desk Chat — You have a new private message.` banner. The banner itself contains no chat message body. The notification intent includes recipient ID; old unscoped chat intents are refused.
5. **Original M95 visuals preserved.** `native-shell.js` still returns false, with no replacement native bottom dock. The original premium navy/gold News (filters, Read, Top 100, comments) and nav remain visible, with a 52dp native header, native profile photo and adjacent Support.
6. **App parity still limited.** M96 is a continuation of the older M95 bundled website snapshot. The November 18–19 research Who's Who enhancements, 57 profiles/23 research claims, international programmes/Vatican and public agency-request tracker are on a separate curated website branch. Do NOT merge the full diverged history into Android; choose and test exact allowlisted web snapshot changes for a future APK milestone.

## Privacy/safety caveats
- The server-side end-to-end FCM recipient validation, secure device registration and real 2-account live delivery **have not been exercised** by this GitHub build. The Android gate prevents many cross-account tap leaks but is not a substitute for backend authorisation, notification permission and proper token revocation.
- Watch browser session state/Google account switches and app lifecycle: native account ID is received from a same-origin, main-frame WebMessage listener; ensure the authenticated web application uses only verified auth identity when emitting account messages. No `addJavascriptInterface` exposed.
- `NotificationInboxStore` holds low-risk generic titles but Android SharedPreferences are not an encrypted archive; do not put personal data or message contents in them. Device settings / OS battery restrictions can delay public news/video WorkManager checks.
- Native APK is a *private debug build* and is not Play Store-approved. Do not auto-enable ads; website Adsterra is separately disabled pending support approval.
- No need for a new Netlify build to deliver this private artifact.

## Galaxy S24 Ultra acceptance checklist
1. Install M96 in parallel with M95/M94. Do not uninstall an older beta holding device-only Research Inbox/drafts; separate application IDs have separate storage.
2. Confirm midnight-navy/antique-gold premium bottom navigation and full original News, ticker, saved/read, replies, Top 100, photo-in-header and Support link.
3. Native Desk > Notification centre: check empty state, public News/Video entries, read/unread, Mark all read, Settings and scroll.
4. Account A sign-in: create/check a safe test Chat alert; account B sign-in: ensure A's private entry cannot display/open and is cleared; guest sign-out: no private entries or notifications. Backend push delivery requires separate test configuration and must not be assumed operational from demo.
5. Archive: open case, back/forward and restore search; Discussions nested replies with keyboard; W.NE resume; Chat keyboard; fullscreen video hides app header and ads; airplane mode opens Offline Archive and Research Inbox.
6. On Android 13+, confirm notification permission prompting is sensible and changing individual opt-ins actually changes worker behaviour. Confirm battery mode constraints.
7. Release gating: audit server FCM registration, RLS/account ownership, deduplication, policy requirements and production signing before Play release.

## Next milestones
- **M97 proposed:** saved Research hub joining native Research Inbox, offline Archive, saved references and Boards shortcuts without copying another account's content. Keep a reversible, parallel-install beta.
- **M98 proposed:** native settings and accessibility/keyboard/back/fullscreen refinements.
- **M99 proposed:** phone-first Save → Add to Investigation → Add Note → Board sequence.
- Bring carefully curated latest website research and Who's Who features into an APK snapshot without altering the live Netlify site or unrelated Supabase backend; keep ballot SQL disabled until audited.

## Source audit
M96 uses `android-test/app/src/main/java/com/disclosuredesk/preview/NotificationInboxStore.java`, `ChatNotificationGate.java`, `ChatPushService.java`, `MainActivity.java`, `DiscoveryWorker.java`, `scripts/test_m96_notification_source_contract.cjs`, and `.github/workflows/android-test-apk.yml`. The previous `MASTER_HANDOVER.md` still opened with M95, so this focused M96 handover records the verified new state.
