# Disclosure Desk — owner-run real JWT A/B acceptance tester (6 November 2026)

**Status:** Offline source QA and mocked HTTP regression PASS. **Not yet run with actual Supabase Auth tokens on owner phone.**  
**Scope:** existing Disclosure Desk project `omqxizswzcwgzqaczlhe`, read-only account isolation; new forum and private Chat are still disabled/unapplied.

## Deliverable

A standalone, no-external-library, mobile-first HTML tester generated in the current ChatGPT conversation:

- `dd-account-readonly-qa.html` (SHA-256: `8e757850585dd2d183d990c4ad776e157f478f2307f0e251890efd0105be323a`)
- `dd-account-readonly-qa.zip` (SHA-256: `77b9b7d4139ca20bc0c24d8daeeba934dcd1d608dda16e01093bb28035fe1d65`)

The exact HTML and ZIP are conversation attachments, not published to the website or automatically installed in Github. The tester contains only the same Supabase **public publishable key** and project URL already embedded in the live website; no passwords, private tokens, admin keys, or identity IDs are bundled.

## Verified local source and mock tests

- Inline JavaScript parsed with Node `--check` successfully.
- Static privacy checks: no `localStorage`, `sessionStorage`, trackers, analytics, WebSockets, console token logging or extra HTTP destinations; only Supabase project origin.
- Password sign-in and session logout calls are the only POST methods; project-table calls are HTTP GET with `select=user_id` and `limit=101`. No comments/research/Storage mutation endpoint is contacted.
- Mock network scenario 1 (two distinct fabricated signed-in users, account A has 3 Boards/7 docs, B empty, guest restricted): **PASS**, 23 intercepted requests. Source rendered a safe summary without email/UUID/password/token.
- Mock network scenario 2 (deliberately fabricated cross-account data leakage): **PASS — failure detected**, 15 intercepted requests; the tester rejected the cross-user result and did **not** claim real HTTP acceptance.
- Both login email/password fields are cleared immediately after clicking Run. Bearer tokens are held only in ephemeral script memory for checks and a best-effort `/auth/v1/logout` is requested. Actual sign-in inevitably creates Supabase Auth sessions/log records; no sensitive values included in the copyable result.

**These tests do not constitute real two-account JWT acceptance.** The prior live PostgreSQL A/B tests in `docs/REAL_BACKEND_RLS_ACCOUNT_CONTEXT_QA_2026-11-06.md` used session-local SQL claims; they also do not constitute actual signed Auth HTTP acceptance.

## Owner's on-device procedure — no new hosting, no Netlify credits

1. Download the standalone HTML (or unzip the ZIP) from the current conversation to Samsung Downloads. Inspect the source if desired; never paste credentials into chat.
2. In existing **Termux**, run `termux-setup-storage` only if shared Downloads access is not yet enabled, then:
   ```bash
   cd "$HOME/storage/downloads"
   python -m http.server 8765 --bind 127.0.0.1
   ```
3. In Samsung Internet or Chrome on the **same phone**, open `http://127.0.0.1:8765/dd-account-readonly-qa.html`. This local-only server keeps the page off the public internet.
4. Enter only the **existing** Account A test identity (the one with research documents) and a **different** Account B test identity. The page authenticates directly against the real Supabase Auth HTTPS endpoint. Hit **Run read-only account checks**.
5. Share only the **Copy safe summary** output or screenshot of the result panel, never screenshots of filled login fields, URLs with tokens, browser developer tools or passwords. Stop the local server with Ctrl+C.

## Live acceptance interpretation

- Success needs **both** real signed-in JWTs, separate `/auth/v1/user` identities, owner-only returned rows in four existing tables, zero A→B and B→A rows for cross-user filtered requests, and a guest denied/empty private Board query.
- A test marked FAIL/INCOMPLETE is not an app security breach by itself: a wrong password, network interruption, CORS or incorrect test-account selection can also cause it. Investigate errors before making claims.
- The local test does **not** attempt sending Chat invites, publishing forums, deleting data, or changing account settings. All those remain separately gated by reviewed SQL schema deployment, backup/restore and complete real-device acceptance.
- If the phone cannot load a local HTTP page or Auth rejects requests, inspect the local server and account status rather than deploying a public debug page.

**No production site, Supabase schema/rows, private backup runner, Google Drive contents, Netlify credits, Android build or public Chat/Discussions flag were changed by preparing this tester.**
