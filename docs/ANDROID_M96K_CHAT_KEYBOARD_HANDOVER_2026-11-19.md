# Disclosure Desk Android — M96K Chat keyboard latest-message reveal (19 November 2026)

## Reason / owner-provided evidence
- Owner reviewed M96 on a Samsung Galaxy S24 Ultra, supplied a seven-second screen recording. On keyboard open the message composer moves above Gboard, **but the latest chat bubbles remain out of view behind the keyboard or are clipped in the shortened history pane**. The owner explicitly said **the original premium navigation bar is fine and must NOT be hidden, relocated or replaced**.
- Fix only history autoscroll when the user actively focuses the actual private Chat composer, while preserving reading scroll position when the keyboard is not used.

## Implementation
- Branch `android/m96k-chat-keyboard-reveal-nov19` derived from M96; no changes to website production, Netlify, Supabase, Google Play or ads.
- `assets/profile-private-chat.js`: `chatComposerIsFocused()` checks active textarea under `.dd-chat-compose` plus active conversation, `followLatestChatMessage()` scrolls only the `.dd-chat-history` pane to its bottom; `onChatKeyboardViewportChange()` recomputes existing visualViewport height and top vars and scrolls after flex layout settles via animation frames. `focusin` also schedules two delayed corrections (110 and 290 ms) to follow Samsung keyboard animation. Normal resize without a focused chat composer preserves manual scroll position, and routine polling still retains the textarea rather than reconstructing it.
- No nav CSS, `nav.nav` class or replacement native dock has been changed. No changes to the `--dd-chat-bottom-space` semantics outside the existing function.
- `scripts/test_m96k_chat_keyboard_focus.cjs` exercises synthetic focused keyboard, viewport reduction, latest bubble visibility, old-history scroll preservation, and nav unchanged. Real mobile Gboard on-device verification is still required.
- The M96K debug application uses separate `applicationIdSuffix = ".beta.m96k"`, versionCode **29**, `0.14.5-m96k-keyboard-beta-preview` and label `Disclosure Desk Beta M96K`; this preserves M96's device-local data when parallel-installed.
- Updated legacy APK-specific regression contracts and CI workflow to expect M96K rather than M96. Initial CI attempts failed **only from stale expected-package assertions and a synthetic fixture initially not simulating a reduced keyboard viewport**; those were corrected and all inherited tests retained.

## Status and gates
- M96K Android GitHub Action (APK, tests, artifact) run: [44440620377](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44440620377), code SHA `bcc60e14002e684c64c3e5b9b09b4d91262efe11`. Confirm this job has finished successfully and the M96K artifact exists before announcing it is downloadable.
- Install in parallel on Galaxy S24 Ultra, open a conversation with multiple messages, focus composer/raise keyboard, verify newest bubble and composer appear together above keyboard; close keyboard and scroll older history to confirm no forced jump, and re-open keyboard. Premium dock stays visible. Test long drafts and sending/receiving messages, switching accounts, back.
- This branch intentionally does **not** merge the much-diverged November research/Who 57-profile/agency dossier website snapshots or M67 closed voting work. Android navigation and full editorial News remain from M95/M96.
- Advertising: support's registered-account email refuses our additional sandbox iframe; original direct tags only, no cookie-free version. The separate M04 ad staging remains **disabled** pending a one-tag-per-page ambiguity, correct consent, site-member security and real creative checks. No ad activation as part of keyboard work.
