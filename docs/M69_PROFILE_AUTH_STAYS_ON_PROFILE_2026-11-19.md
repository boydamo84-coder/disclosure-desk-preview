# Disclosure Desk M69 — Profile-local authentication, no automatic Boards navigation (19 Nov 2026)

## Scope and ownership
- User observed that tapping **Profile → Sign in** jumps to Boards on both the public site and Android APK. User wants the login and its completion to remain on Profile.
- Root cause found in shared `assets/research-hub.js`: `function signIn(){ visit('boards'); ... }`, with Create account calling the same routine. This is an intentional stale shortcut, not an authentication-provider redirect.
- **Website staging branch:** `prep/m69-profile-auth-stay-20261119` from M68 world-programmes/outreach staging. **NO live deployment, Netlify build, real Supabase write, Play Store release, or ad activation.**
- **Android staging branch:** `android/m96l-profile-auth-stay-nov19` from green M96K keyboard beta. Android uses identical revised `assets/research-hub.js`, so sign-in behaviour is shared.
- Do NOT wholesale merge the web M68 branch into the older Android M96L bundle; only the small Profile fix is shared.

## Implementation
- Retired auto `visit('boards')` on Profile sign-in/register.
- `assets/research-hub.js` creates an accessible inline form inside existing `#ddProfileGuest` on demand, sharing the same Supabase credentials/client and persisted identity already used for Profile and Boards; no new auth provider, secrets, cookies, RLS policy or backend endpoint.
- Sign in: email, password and friendly inline status; `auth.signInWithPassword`. On success, existing `refresh()` displays `#ddProfilePrivate` while the active tab remains Profile. Failed login stays on Profile with inline feedback and keeps credentials from being included in URLs.
- Create account: equivalent original `auth.signUp` flow with explicit public username visibility disclosure, username validation/reserved-role restrictions and email confirmation. Confirmation redirect sets `dd_tab=profilePage&dd_confirm=1` rather than Boards.
- Reset password uses original Supabase `resetPasswordForEmail`, with return to `?dd_tab=profilePage`. Existing `cloud-boards.js` handles password recovery and full account security.
- Boards remains accessible via deliberate user navigation; its own cloud backup controls and device-local research are unchanged.
- Responsive navy/gold form CSS appended to `assets/community-polish.css`; `index.html` versions updated for cache busting `m69-stay-on-profile` and `m69=profile-login`.
- Error status `role=status`, `aria-live=polite`; inputs are labelled, required; password cleared on success. No analytics, advertising or private document edits.

## Automated tests
- `scripts/test_m69_profile_auth_contract.cjs` inspects source, cache versions, validation, no forced navigation, no auth-provider alteration.
- `scripts/fixtures/m69-profile-auth.html`: explicitly synthetic in-memory Supabase mock, no live backend or real member credentials; excluded from public package and APK bundle.
- `scripts/test_m69_profile_auth_chromium.cjs`: real Chrome at 320/393/820/1280 px, exercises click Sign in, failed password, Create account & exact email-confirm redirect, reset password, successful sign-in to private Profile, no Boards visit, no page navigation, no third-party calls, no horizontal overflow.
- Inherits M68 worldwide institutions/Vatican/outreach, M67 closed ballot and disposable Postgres RLS tests in new no-deploy GitHub Actions workflow `.github/workflows/m69-profile-auth-no-deploy.yml`.
- [Green website CI run 44443515090](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44443515090) at code SHA `4d2aa4041e87757dd08cf4acbb2c33236420ee4a` passed all jobs; docs-only commits after this require exact-HEAD verification as appropriate.
- Real two-account Supabase acceptance and Samsung WebView testing remain pending. Do not call the fix live until production Netlify deploy and real-site smoke are verified.

## Release plan
- Merge or cherry-pick **only** M69's `assets/research-hub.js`, `assets/community-polish.css`, `index.html` into the intended website release, preserving M68 source-linked Who's Who, M67 voting off, W.NE, and existing premium navigation.
- Android M96L needs a green build and actual device acceptance; keep it a separate app package so earlier betas and local drafts remain unaffected.
- Adsterra banner tags remain OFF awaiting privacy/security review. Do not switch live adverts on as part of this login fix.
