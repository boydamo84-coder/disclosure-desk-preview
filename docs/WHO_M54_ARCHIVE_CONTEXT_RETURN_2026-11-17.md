# M54 — Contextual return from Archive case to originating Who’s Who profile
_Date: 17 November 2026 · PREPARATION BRANCH / NO DEPLOY_

## Scope and why this is needed

The Who’s Who profile reader already stored a per-tab return marker (`dd-who-case-return-v1`) when a visitor followed a specific, source-attributed person → case link. The Archive code did not consume that marker in a visible return action. On a mobile browser or Android WebView, closing an Archive case and trying to recover the original person could therefore be ambiguous, particularly because Archive maintains case-dialog history separately from the directory.

M54 adds an **opt-in, clearly labelled, non-scoreable Back to Who’s Who profile button** at the top of the Archive case dialog. This complements native browser Back, without intercepting the Android Back gesture, changing navigation history, or guessing which person the user wants.

## Committed files

- `assets/who-archive-return.js`: small UMD/CommonJS browser helper with pure `resolve(marker,currentHref,caseId,now)`, browser `fromSession(caseId)` and `update(button,caseId)`. It never transmits the marker to a server, and redirects only to a validated same-origin local Who profile URL.
- `index.html`: adds a small navy-and-gold return row (initially `hidden`) inside `#archiveCaseDialog` immediately above `#archiveCaseBody`. Loads the cache-versioned new helper and updates the return row only when `archiveCaseOpen(r.id)` is called. The existing Archive case close, auto-scroll-to-top, historical case history and premium navigation are unchanged.
- `scripts/build_public_release.cjs`: explicitly adds the new browser helper to the strict public file allowlist; no unrestricted wildcard, no deploy.
- `scripts/test_who_public_package_boundary.cjs`: requires the helper to be present in the locally hashed staging package and retains internal-file exclusion.
- `scripts/test_who_m54_archive_return_contract.cjs`: checks valid exactly matching markers; age ≤15 minutes; rejects case mismatch, person mismatch, malformed/future/expired marker, cross-origin and protocol-relative URLs, extra query parameters, wrong Archive tabs or direct visits without the `dd_from=who` marker. Also checks 50 people, 23 still-unapproved claim reviews and four source-attributed draft person/case links.
- `scripts/fixtures/who-archive-return-m54.html`: local-only HTML fixture served by the test web server; **excluded from the public package**. It replaces the unreliable previous attempt to navigate directly to a JavaScript file as a browser page.
- `scripts/test_who_m54_archive_return_chromium.cjs`: checks **the actual shipped helper in an isolated browser DOM fixture** at widths **320, 393, 820 and 1280 px**. Confirms valid Back becomes visible, unrelated case/direct visits hide it, and a click navigates to the expected internal Who profile URL. The destination content is a **local mocked Who profile**. This script is **not** an end-to-end test of all Archive UI nor hardware Android.
- `scripts/test_who_m53_source_return_chromium.cjs`: the inherited mocked publisher-tab test now observes the browser context's new page event, rather than relying on an opener-specific popup event under `rel=noopener`.
- `.github/workflows/who-m40-policy-worklist-no-deploy.yml`: extends the existing source/package and local-browser jobs with M54 branch trigger, helper JavaScript syntax check, static contract and isolated browser test. No release job, credentials or Netlify call.
- This report and `MASTER_HANDOVER.md` are internal handover material and excluded from public release staging.

## Safety model

The contextual return is hidden unless **all** conditions are met:
1. Current URL is the site’s root Archive tab (`/?dd_tab=archivePage`) with `dd_from=who`.
2. The session marker exists in the same tab and has `target:archive`.
3. The saved person ID matches the person parameter in a local `/who-is-who.html?person=...` path and contains no extra query parameters or external origin.
4. The case currently being displayed exactly matches the case on which the visitor clicked.
5. The marker timestamp is valid, not in the future and no older than **15 minutes**.

The return button is rechecked each time a different Archive case opens. The module does not send or log a visitor’s profile, add a new score, authenticate a statement, alter case citations, or assume an Archive case is independently verified. The user intentionally chooses Back, rather than silently redirecting on Escape or hardware Back. Native Android Back remains the responsibility of the existing browser/WebView history and separate case dialog logic.

## Android device acceptance checklist — NOT YET EXECUTED

Use an owner-approved staging web build or APK after the code passes CI; **do not test this milestone against the still-unchanged live site**.

1. On a Galaxy S24 Ultra, open Who’s Who → Kevin Knuth → `USS Nimitz / Tic Tac (2004)` linked Archive case. When the case is open, see **Back to Who’s Who profile** at top, tap it, and confirm the Knuth profile returns and its previous reading location is restored.
2. Repeat using Fravor → Nimitz, Pope → Rendlesham, and Warren → Rendlesham. The label is generic, but each action must return to the **correct originating person**, not another profile associated with the same case.
3. From a normal Archive tab, search/open Nimitz without coming from Who. No contextual Back button should be shown. Repeat with a direct copied case URL missing `dd_from=who`.
4. From Knuth → Nimitz, open another related case within the dialog: the contextual return must disappear for the **different case**; the original source marker must not mislabel other incidents.
5. With a valid Who profile → case link, use native Android Back and the close `✕` instead of the contextual button: existing case close and site history should still work. Do not automatically claim an Android Back result based on desktop Chromium.
6. Use the Android share menu/open external browser for a publisher source, then switch back. Who’s Who should remain the same profile and should not be overwritten by an unrelated return marker. Confirm the page does not crash or get trapped in a back-loop.
7. Open Archive from a profile, background the app, and resume. Within 15 minutes, valid context should be retained for the same session. After more than 15 minutes, the contextual return action should be hidden. A changed system clock should fail conservatively.
8. Repeat in Samsung Internet/Chrome (where available) and APK WebView, noting whether outbound links open in an app, Custom Tab or a standalone browser. Record any duplicate tabs, lost state, blank page, back gesture quitting the APK or fixed navigation overlay.
9. Verify 320px and landscape layouts, readable gold contrast, no horizontal scroll, and that the return control does not cover the modal close `✕` or fixed premium navigation.

Record these manual results in the next milestone before marking **device PASS**. No test outcome or APK was fabricated or shipped.

## CI and next milestone

**M54 is source-committed, not CI-confirmed.** This connector can inspect contents and commit status, but previously returned empty combined status entries and PR-only workflow-run results; a committed test is not proof it was executed or passed. No physical Android use in this session.

**M55 suggested:** resolve actual Actions failures (if observable), validate real Android state restoration/Back across Who ↔ Archive including dialog reopens, and consider an owner-approved offline test ZIP/APK only after confirming a compatible build pipeline and source revision. Keep all rating percentages, public community voting, portrait rights sign-offs and live deployment withheld until independent editorial/security approval and explicit owner release consent.
