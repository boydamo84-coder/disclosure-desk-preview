# Disclosure Desk R3 — Termux/Chrome stale-build detection checkpoint
_Date: 14 November 2026 · Development branch `queue/dd-web-r3-from-r2-nov14` · OFFLINE ALPHA · NO DEPLOY_

## Physical Samsung report and interpretation

After owner reported the previous R3 ZIP was working except for wrong bottom navigation and Chrome-owned grey confirmation prompts, R3 Milestone 5 corrected those elements and passed browser tests. Owner **then** posted a real Samsung screenshot at `http://127.0.0.1:4175` still showing the old native grey `Lock this notebook and clear the current page?` popup and previous dock glyphs. Owner additionally reported **“Even incognito shows same”**.

This **strongly suggests the Termux HTTP server was still serving an older extracted directory, an old `index.html`, or another Python server process on port 4175**, rather than mere Chrome cached JavaScript/CSS. Incognito is a separate browser profile but reaches the *same local HTTP server* on `127.0.0.1:4175`. Without the user's `pwd`, `cat BUILD_INFO.txt` or served source inspection, the precise reason is **not fully confirmed**.

**Do not tell user to clear Chrome site data:** original profile IndexedDB may contain locally encrypted notebooks. Keep same `127.0.0.1:4175` origin and passphrase to preserve recoverability, and use a fresh folder name to prevent ZIP mixing. Incognito does not contain the original profile's encrypted vault.

## Fix and proof

- Added explicit `R3 NAV / PROMPT POLISH · BUILD <12-hex-fingerprint>` marker to isolated R3 page. The fingerprint comes from SHA-256 of concatenated HTML-referenced source JS/CSS asset bytes in `scripts/build_r3_lab_preview.cjs`.
- The builder now appends `?v=<fingerprint>` to each packaged local JS and CSS URL, so new ZIP assets are not mistaken for previously cached files while the browser origin stays unchanged.
- Generated `BUILD_INFO.txt` in ZIP root with readable build ID and exact warning that a grey `127.0.0.1:4175 says` prompt means the served UI is old; directs user to restart Termux from verified extracted directory.
- The new ZIP's README uses unique new extracted folder `R3_Lab_Verified_20261114`, with `pwd`, `cat BUILD_INFO.txt`, `grep -n 'ddConfirmDialog' index.html`, and explicit warning on `Address already in use`. Opening `http://127.0.0.1:4175/?version=check` can help avoid stale HTML caching without changing origin or affecting encrypted vault storage.
- Expanded real Chromium test to assert `BUILD_INFO.txt` has readable build ID, page displays same build ID, and exact `?v=` asset references exist for all 5 JS/CSS sources; modal marker present. Existing tests continue confirming actual custom confirm, 14-tab R2 dock CSS parity, mobile editor source tap, encrypted save/recovery, zero external requests.

**Final test and package evidence:** [GitHub Actions run 43653605928](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43653605928) `SUCCESS`, both local engine + Chromium jobs, including 393px and 1280px viewport tests. Exact tested source/workflow SHA `0174a1369222b3b7dd7ede574daf172b1e5c5276`. Build ID: **`17aadf8d3a00`**. Artifact `14137555571`, https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43653605928/artifacts/14137555571 (GitHub metadata: expires 28 November 2026). Downloaded ZIP `/mnt/data/R3_Lab_Verified_20261114.zip` verified by `unzip -t`, extracted `BUILD_INFO.txt` and `index.html` marker; SHA-256 `7c378e80f4ab73746dadec58e3ccd91f53e1f25917c8509ad7b7b1f439c7fdd7`. The GitHub Actions step says artifact size 1,765,310 bytes.

**Diagnostics for owner** in Termux: stop old server with Ctrl+C in its actual session; `cd ~/storage/downloads/R3_Lab_Verified_20261114`; `pwd`; `cat BUILD_INFO.txt`; `grep -n 'ddConfirmDialog' index.html`; `python -m http.server 4175 --bind 127.0.0.1`; open `http://127.0.0.1:4175/?version=check`. If `Address already in use`, another server is still bound to the port. The in-app marker should say `R3 NAV / PROMPT POLISH · BUILD 17aadf8d3a00`. **Physical Samsung verification of this latest build is pending; do not claim owner accepted it.**

**Release boundary:** R3 remains isolated from public-release allowlist and Netlify. No production merge, deployment, account, Supabase, APK or AdSense changes. R2 remains live Published runtime `8af0a5a`; R4 stays queued.
