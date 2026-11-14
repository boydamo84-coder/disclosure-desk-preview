# Disclosure Desk R3 — Hypothesis Lab responsive offline UI (milestone 3)
_Date: 14 November 2026 · Status: isolated, tested, NOT DEPLOYED_

## Outcome

The user approved proceeding with a premium private Hypothesis Lab interface after the two offline research engines passed QA. On `queue/dd-web-r3-from-r2-nov14`, built an actual standalone HTML/CSS/JS interface, packaged solely by an isolated **non-production preview builder**:

- `experiments/r3/hypothesis-lab-preview.html` — full interface, accessibility labels, CSP restricting scripts/styles to self and network connections to none, clear prototype privacy warning.
- `experiments/r3/hypothesis-ui.css` — Disclosure Desk navy/gold design, 393px mobile stacked comparisons and 1280px two-column desktop, safe viewport sizing, footer and original 14-tab dock **visual reference**, without changing the website or Android navigation. All prototype dock section buttons are disabled; arrows can scroll the reference strip. This is NOT live nav integration.
- `experiments/r3/hypothesis-ui.js` — notebook creation (workspace and case ID); original research explanation form; assumptions and alternatives as separate lists; multiple predictions, disconfirming tests, and optional source/locator entries; append-only revision edits; read-only history snapshots; unranked side-by-side comparison; explicit unencrypted JSON download. Uses safe DOM text and explicit user-triggered HTTPS links; no background request, account login, localStorage, indexedDB, cookies, publishing or backend call. A fictional demo can be loaded for exploration without entering real research.
- `scripts/build_r3_lab_preview.cjs` — builds `.r3-lab-preview` from isolated prototype sources and wraps the **same** `experiments/r3/hypothesis-lab.cjs` engine for browser use; refuses to overwrite existing output and checks the application scripts are NOT in `scripts/build_public_release.cjs` allowlist.
- `experiments/r3/README_TESTING.txt` — explicit Android Termux local HTTP and desktop loopback instructions, plus no-sensitive-data and no-persistence warnings.
- `scripts/test_r3_hypothesis_ui_chromium.cjs` — real headless Chromium at **393px and 1280px**, fictional samples, 14 disabled design-reference tabs, adding/revising hypothesis, unranked comparison, old vs new prediction history, rejecting an unsafe source URL, adding a valid citation, explicit JSON download, close/reset, full-width overflow checks, zero browser errors and **zero external requests**. Fictional screenshots generated for both widths.

**Automated verification:** exact workflow/source commit `58f29890f0b4cee39dcc18f86413459209a78c80`, [GitHub Actions run 43647603582](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43647603582) has **two SUCCESS jobs**:
1. Local record analysis: R3 Gap Finder and Hypothesis Lab engine negative/positive tests PASS.
2. Offline browser preview: prototype build PASS, R3 UI at 393px PASS, R3 UI at 1280px PASS; GitHub Actions `upload-artifact` PASS.

**Downloadable local test ZIP:** GitHub Actions artifact ID `14134459077`, name `disclosure-desk-r3-hypothesis-lab-offline-prototype`, available at https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43647603582/artifacts/14134459077, retained until **28 November 2026** according to the artifact metadata. The ZIP contains `index.html`, browser engine, UI JS/CSS, README and two synthetic screenshot images. User can run it in Termux local server, independently of Netlify. The ZIP was also downloaded and its seven expected members verified in the current conversation sandbox.

## Non-negotiable limitations

- This is a **session-memory prototype**. Workspace ID checking is NOT an authentication boundary. The browser file has no encryption, secure account storage, backup, restore/import, or authenticated data isolation. **Do not enter sensitive information.** Explicit exported JSON is unencrypted.
- Research claims remain researcher-written drafts; a link is not evidence of independent verification. No scores, automatic UAP explanation, invented source synthesis or auto-publication. The Gap Finder is **not yet connected** to the UI and can't write a claim into a notebook.
- The 14-tab dock is a disabled *visual prototype*, not an active replacement for the R2 original premium app dock. A future integrated version must preserve tested live navigation, current member permissions, Back gestures, keyboard layout, W.NE and Chat.
- Nothing in the R3 experiment directory has been added to the **public release** strict file allowlist. **No Netlify preview/production deployment, GitHub production merge, Supabase write, Android APK build, AdSense action, external research fetch, or private account access** occurred. Live R2 production runtime remains `8af0a5a60c8282542154502e17d96177aade97d2`. R4 untouched.

## Next independent milestones

Secure opt-in storage/restore and real authenticated workspace isolation require design and security review before connection to production. Later: user-approved link from Research Gap Finder prompts to private hypotheses, source context and revision integrity; browser accessibility and real Samsung/iPhone testing; actual live 14-tab integration; final precise source/privacy/rollout QA and separate R3 publish authorisation.
