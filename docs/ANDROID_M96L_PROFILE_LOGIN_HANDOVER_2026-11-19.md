# Android M96L — Profile login stays on Profile (19 Nov 2026)

## User issue / root cause
- User observed on both website and installed APK: clicking Profile → Sign in automatically jumps to Boards, confusing new users.
- Root cause: `assets/research-hub.js` explicitly called `visit('boards')` on Profile sign-in; Create account also called it. This was not a Supabase auth redirect or Android navigation defect.
- Owner's requirement: remain on the existing Profile tab throughout login and sign-up. Preserve M95/M96K premium navy/gold bottom navigation and the M96K Galaxy keyboard fix.

## Implementation
- Branched `android/m96l-profile-auth-stay-nov19` from verified `android/m96k-chat-keyboard-reveal-nov19`; **no Netlify deployment, user data edits, Supabase schema writes, ad enablement or Play publishing**.
- `assets/research-hub.js` revised to open an accessible inline email/password form in `#ddProfileGuest`, not Boards; uses existing Supabase client/session and backend RLS. Supports sign-in, Create account with the existing public-username disclosure/validation and privacy notice, password reset, error/status messages, and email confirmations returning to `?dd_tab=profilePage`.
- Leaves the cloud backup controls on Boards unchanged. `index.html` cache-busts Profile auth and CSS; `assets/community-polish.css` matches original premium design and handles 320px width.
- **Parallel-install beta ID:** `com.boyddigitalstudios.disclosuredesk.beta.m96l` (separate from M96K and the main app), versionCode 30, versionName `0.14.6-m96l-profile-beta-preview`, label Disclosure Desk Beta M96L. M96K local drafts/research are not overwritten.
- Updated historical M75–M96K contracts to assert the separate M96L app package, version and Actions branch. M74 HTML-script version-order test updated only for the new Profile JS cache version. Nothing in those older features was removed.
- Added `scripts/test_m69_profile_auth_contract.cjs` and `scripts/test_m69_profile_auth_chromium.cjs` plus an explicitly synthetic (no real auth) fixture. Android workflow runs these tests along with its existing local WebView snapshot, chat keyboard, navigation and source tests.

## QA status
- Website companion M69 source/browser/Postgres checks passed [no-deploy website run 44443515090](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44443515090).
- **Android CI PASSED** on source SHA `6eb50944b1b84d1cbcc2490c20642f8a56b043b3` in [GitHub Actions run 44444081054](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44444081054): full inherited web/source/mobile tests, M69 real Chromium synthetic login at 320/393/820/1280 px, Chat keyboard regression, Android Gradle build, APK verification and upload. [Private M96L APK ZIP artifact 14492577761](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44444081054/artifacts/14492577761) confirmed present and unexpired (10,101,858 bytes ZIP). Earlier M96L CI failures were stale M74/M75/M96K assertions, now corrected. The unchanged original M96K beta remains the rollback.
- The M69 synthetic Chrome test verifies 320/393/820/1280 widths; failed login remains on Profile; create-account alias and email-confirmation URI; reset URI; successful login displays private Profile without Boards navigation.
- Device acceptance still pending on Galaxy S24 Ultra with actual owned account. Test Profile → Sign in, failed password, valid password, sign-out, Create account (do NOT create unnecessary real test accounts), Back, Chat/Gboard, Board access only by deliberate nav, Notification Centre. Never enter account credentials in screenshots/videos.
- Real production website was not yet deployed through Netlify. Do not equate successful GitHub build with a live website release.
