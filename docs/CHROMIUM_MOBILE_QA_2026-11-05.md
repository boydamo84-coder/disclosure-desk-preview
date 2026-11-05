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

**Original milestone count: 12** (four tab destinations counted individually).

## Additional real-browser checks — 2026-11-05, extended 18/18 GREEN
- Commit `3c1a9f79df3783b82715020bb94a265aec5d030a`.
- [GitHub Actions run **42027694804**](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42027694804): **SUCCESS, 18/18**; existing full-source staging suite [42027694930](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42027694930) also SUCCESS.
- New checks: (13) landscape Witness navigation at 852×393; (14) landscape guided tour fits available height and Escape returns to Explore; (15) fresh user's native welcome is modal; (16) Escape dismisses welcome without changing News; (17) actual W.NE editor page with *synthetic fake login* refuses to leave if the stubbed save hook returns false; (18) stubbed save-confirmed true permits return to the correct main-site tab.
- A supplemental screenshot `landscape-witness-852x393.png` was added to the private 7-day GitHub artifact. Screenshot and JSON evidence stay in GitHub Actions; no photos or personal accounts.
- The earlier `localStorage` security exception was caused by our own `page.addInitScript` setting a preference in a sandboxed/opaque-origin frame. The test now runs this preference assignment only in the top-level frame and wraps it in `try/catch`. The newer run did **not** log the exception. This corrects test noise, not a production app bug.
- The reader/editor save test checks the actual editor's browser-level navigator with a **simulated** save response, not storage persistence, conflict resolution, recovery or Supabase Auth.


## Exact safety and remaining limits
- Every web request outside the **local loopback** origin was blocked, except the Leaflet library loaded from a local version-pinned npm package. This prevented accidental requests to live Supabase, news or video providers.
- The initial browser run recorded a sandboxed-frame `localStorage` exception from the **test's own injected setup**. This was fixed in the extended test, which logs no corresponding error. External services were intentionally blocked, so this is not a clean-console certificate for live integrations.
- Mobile viewport emulation is **not** a physical Samsung Internet/Android WebView test, does not confirm all landscape layouts or touch keyboards, and does not check real video embeds or sign-in.
- Actual W.NE editor DOM navigation now has real Chromium acceptance for **synthetic save denial/approval**. Cloud persistence, real editor-to-Supabase saves, revision conflicts and recovery remain untested.
- Private Chat and the future Discussions feature remain OFF in `assets/community-test-config.js`. Their 55/55 signed-HTTP checks were separately green against disposable PostgREST, but not real Supabase Auth sessions.
- No live website merge, Netlify build, public database schema migration, end-user content, original W.NE or Android build was altered.

## Next test that adds value
Now perform **physical Samsung Internet/Chrome tests**, including landscape safe areas, touch keyboard, native Android back, real videos and full W.NE save/recovery on disposable test material. Separately obtain actual Supabase Auth A/B credentials via a dedicated staging backend before enabling 1:1 Chat or Discussions, review backup/rollback and aim for one consolidated live beta. The owner conditionally authorised using the public site for HTTP testing if simpler, but disposable HTTP and real local browser checks have made that unnecessary so far.
