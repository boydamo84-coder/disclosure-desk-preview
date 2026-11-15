# Disclosure Desk R3 — premium 14-tab nav + research confirmation polish
_Date: 14 November 2026 (Europe/London) · Isolated local/Termux alpha, NOT DEPLOYED_

## Owner feedback and verified scope

Owner physically opened the R3 encrypted Hypothesis Lab in Samsung Chrome via a local Termux server at `http://127.0.0.1:4175`, provided two screenshots (editor and native Chrome grey unsaved-session prompt) and reported **“Works but navigation bar wrong prompt needs polish.”** The original approved R2 application uses the navy/gold **14-tab horizontal premium rail with left/right arrows**. The 5-tab M12.3 regression and the loosely recreated R3 dock are NOT the approved references.

This checkpoint fixes the **standalone offline research UI only**; it does **not** change website Home, the APK's native nav, Android browser Back, production, Netlify or Supabase.

## Actual code changes

- The R3 preview now imports the exact R2 `assets/secondary-editorial-nav.css` from the repo using `scripts/build_r3_lab_preview.cjs` into `editorial-dock.css`; it is **not a stylistic approximation**.
- The isolated nav markup/JavaScript now reproduces the original **14 R2 source tab IDs, labels, glyphs and SVG Chat icon**: News, Archive, Who’s Who, W.NE, Map, Videos, LIVE, Boards, Witness, Discussions, Watch & Read, Chat, Profile, Explore. Boards is highlighted because this is an isolated Boards-research prototype. Scroll arrows show hidden tabs. It stays explicitly disabled as a **visual design reference** and does NOT navigate to the live website or reach accounts. The original R2 public navigation scripts remain untouched.
- Replaced all `window.confirm` / `window.prompt` calls in this isolated UI with an accessible, responsive `<dialog>` in the site’s premium navy/gold style. Supports close X, cancel, Escape and backdrop cancellation, explicit descriptive titles, action-specific labels and protected destructive actions. A local-vault delete requires typing **DELETE** before the button can activate.
- Unsaved notebook dismissal warns that changes have not been encrypted or saved, with choices **Keep notebook open** and **Discard notebook**. Encrypted lock explains saved revisions remain encrypted while unfinished edits may be lost. Changing tabs during an unfinished edit also requires a user decision. A cancelled prompt does not discard research.
- During regression testing, the newly replicated nav’s keyboard-focus show/hide transition caused **pointerdown without click** on the editor’s `Add source` button. Fixed mobile editing state to keep the fixed dock hidden **throughout the editor** rather than toggling it during button focusout. This preserves citation/save taps, prevents keyboard occlusion and restores R2-style mobile behavior without changing underlying encrypted vault storage.
- The browser vault code, KDF/cipher parameters, IndexedDB name, data format and original hypothesis engine are **unchanged**. Existing encrypted notebooks on the same Chrome-profile origin `127.0.0.1:4175` should remain recoverable with their passphrase; user must still keep a separate encrypted backup. Not independently security audited.

## Evidence and release boundary

**Final isolated no-deploy CI run:** [GitHub Actions 43652859424](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43652859424), workflow/test HEAD `76067760c3e2bf7d971cbfebbe1a043d5db24be2`, **SUCCESS both jobs**:
- R3 source Gap Finder + Hypothesis Lab offline engine suites PASS.
- Chromium real browser UI at **393px Samsung-like and 1280px desktop** PASS, including exact source CSS byte parity, original 14 IDs/labels and correct Chat SVG, horizontally scrolling arrows, disabled outside-of-local-prototype tabs, custom unsaved dismissal & cancel preserving notebook, coloured action buttons and responsive modal width, mobile editor citation tap regression, encrypted lock, delete typed confirmation, wrong passphrase/tampered backup rejection, encrypted recovery/revision history and zero external requests.
- Local-only build and packaging checks PASS. The test generates **fictional** mobile/desktop screenshots for both comparison and branded unsaved confirmation (four PNGs total).
- Archived GitHub Actions ZIP artifact ID **14136169801**, `disclosure-desk-r3-hypothesis-lab-offline-prototype`, URL `https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43652859424/artifacts/14136169801`, expires **28 November 2026** per GitHub artifact metadata.
- Artifact downloaded into this chat/container as `/mnt/data/HypothesisLab_R3_Nav_Polish.zip` with verified SHA-256 `1868ee767512553c1da0bc647bd923ee748d258b0a3f422709a1cc892c7af336`, checked by `unzip -t`, and confirmed updated `README_TESTING.txt` gives exact new Termux folder name. ZIP contains 11 entries: index.html, engine UI/cipher JS and CSS, matching R2 editorial dock stylesheet, guide and four fictional screenshots.

**Caveats:** Automated desktop/headless mobile viewport coverage is not the same as an owner physical Samsung acceptance of the updated build. The owner has NOT yet re-tested these exact changes. R3 remains a standalone local browser prototype, no APK integration, no actual live-navigation routing, no authenticated user isolation and no production deployment. The live verified R2 runtime remains Netlify Published SHA `8af0a5a`. Do not create a Netlify preview, merge to production or change R2/AdSense as a side effect.
