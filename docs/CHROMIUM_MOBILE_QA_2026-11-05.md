# Disclosure Desk — real Chromium mobile-viewport browser smoke, 2026-11-05

**Scope:** canonical unpublished source `boydamo84-coder/disclosure-desk-preview`, branch `feature/sources-archives-next-batch-nov03`. Did not deploy to Netlify, the live website or Android; no real user authentication or data access.

## New evidence vs existing tests

Earlier guided-tour and navigation checks used static analysis or a fake DOM. This is the **first actual headless Chromium browser** acceptance on that source, using GitHub Actions, a loopback-only static HTTP server and mobile emulation at **393×852**.

- Implementation commit: `cf029b1e566c12355db00716a2a60ef541527b00`.
- Browser runner: `scripts/test_browser_release_smoke.cjs`.
- Workflow: `.github/workflows/validate-browser-release-smoke.yml` (no deploy).
- Verified [GitHub Actions run **42027132774**](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42027132774): **SUCCESS, 12/12 browser checks**.
- Full staging no-deploy source QA run **42027132653**: SUCCESS at the same commit.
- Workflow artifact `disclosure-desk-chromium-smoke` stores `mobile-explore-393px.png`, `mobile-research-entry-393px.png` and `result.json` (temporary 7-day GitHub retention).

## What browser testing confirmed

1. Eleven published navigation tabs render and News is selected.
2. Real click navigation to Witness, Explore, Profile and Videos updates `aria-current` and shows the target page.
3. Full site tour opens a native dialog; Escape closes it and restores Explore.
4. An unapproved direct `/?dd_tab=discussionsPage` cannot reveal the 12th tab.
5. An approved `/?dd_tab=profilePage` returns to Profile correctly.
6. The read-only W.NE guest preview preserves the eleven-tab dock; Discussions remains absent.
7. W.NE guest dock returns to the requested Explore tab on the main website.
8. W.NE Research entry presents the same eleven navigation choices.
9. Research entry's document width stays inside the simulated 393px viewport.

**Count: 12** (four tab destinations counted individually).

## Exact safety and remaining limits
- Every web request outside the **local loopback** origin was blocked, except the Leaflet library loaded from a local version-pinned npm package. This prevented accidental requests to live Supabase, news or video providers.
- Page exceptions were collected but not used as an automatic failure gate. The local browser logged one error, **`Failed to read the 'localStorage' property from 'Window': Access is denied for this document.`** This may originate in a sandboxed/embedded document. **It needs attribution before sign-off**; do not claim browser console clean.
- Mobile viewport emulation is **not** a physical Samsung Internet/Android WebView test, does not confirm all landscape layouts or touch keyboards, and does not check real video embeds or sign-in.
- Full actual W.NE document save/recovery and navigation inside the real editor remain unverified in the browser; fake-DOM save-hook tests were previously green.
- Private Chat and the future Discussions feature remain OFF in `assets/community-test-config.js`. Their 55/55 signed-HTTP checks were separately green against disposable PostgREST, but not real Supabase Auth sessions.
- No live website merge, Netlify build, public database schema migration, end-user content, original W.NE or Android build was altered.

## Next test that adds value
Expand real Chromium coverage to **landscape viewport**, native first-visit welcome and **actual editor save-blocking** (without production Supabase), investigate the one page exception, then conduct manual physical Samsung Internet tests. The user conditionally authorised a single combined live beta for testing if simpler; do not prematurely deploy while loopback checks work. Create a rollback-approved website+schema release when real-auth and phone acceptance are ready.
