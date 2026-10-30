# Disclosure Desk cloud accounts — setup and safety

This is **only** for Disclosure Desk. Do not reuse the Our Cinema Supabase project.

## One-time Supabase setup
1. Create a **new project** in Supabase for Disclosure Desk. Use UK/EU region if suitable for intended users and legal requirements. Enable email confirmation in Authentication > Providers > Email; set secure Site URL `https://uapdisclosuredesk.com` and approved redirect URLs for the production website and development preview.
2. In SQL Editor run `supabase/disclosure_desk_boards.sql`. Row-level security (RLS) is enabled and each user can access only their own records.
3. Obtain **Project URL** and **publishable/anon key** from Supabase Settings > API. These are intended for client-side use with RLS. **Never expose service_role/secret keys or database passwords.**
4. Configure SMTP before real public onboarding; Supabase default email sending is not intended for high-volume production delivery. Check sender domain, rate limits, email verification, abuse controls, and privacy retention.
5. Test separate user A and B accounts: login, email confirmation, password reset, save boards, logout/login, offline changes, deletion, and attempts to access another user's board.

## Migration requirements before connecting
Existing boards are stored locally under `unknown_investigation_boards_v08`. **Never overwrite, clear, or silently upload** existing boards on login. Keep device boards until user chooses **Copy my device boards to cloud** after signing in, with a review/confirmation step, a downloadable backup and duplicate detection. Prefer non-destructive merging and conflict handling (updated_at plus versions). Avoid cross-origin WebView loss: the old GitHub Pages domain and new custom domain have separate localStorage; export on old device first.

## Planned account UX
- Browse publicly as guest, with no account required
- Signup / login / logout / password reset / email verification
- My Boards shows status: Device-only, Syncing, Synced, Needs attention
- Explicit Import device boards action and backup download
- Offline edits queue locally and sync after reconnect with conflicts surfaced
- Export, account deletion and a way to manage stored privacy data
- Update privacy policy before enabling cloud collection

**Status**: schema and setup instructions only. UI auth and synchronisation not yet connected; no Supabase credentials configured.
