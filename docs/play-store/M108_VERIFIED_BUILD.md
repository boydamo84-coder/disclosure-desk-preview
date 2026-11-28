# M108 — W.NE navigation and responsiveness

Verified 28 November 2026. Android-only candidate, no website deploy or Play upload. Executable commit `ef516bd54fd521dba2faffaa78e1996209f6ecfd`, [GitHub Actions 46097626686](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/46097626686), SUCCESS. Version 0.16.10-preview/44; independent package .beta.m108.

- Removed redundant outer W.NE Home button, retained the hidden File document-manager trigger and first-document flows. All Research pages use the shared five primary SVG destinations and More; repeat active W.NE taps keep editor instance mounted. Save guards intact.
- Leaflet JS/CSS now loads only when Map is opened; hidden Research Library iframe loads on first Library/Split selection; parallel archive catalogue/ledger requests; normal HTTP cache policy for external resources, immutable bundled bytes intercepted with no-store. Physical-device latency improvements not yet measured; standalone routes still reload. No new offline W.NE or seven-day news cache.
- Source, full browser regression, Android link/notification checks, debug signer, identity, SDK36, unsigned release and alignment passed. Independently verified actual packages against all 161 public asset hashes and native scripts.
- APK artifact 15244610154 SHA256 f29283701a048ed3e65e0735454070441aeebc95c6e8511a6310006e751c922f.
- Unsigned AAB artifact 15244585195 SHA256 c4cf722664cf7773b7f987059122e0e0ea27abce7b4dd2eafdae1ed8bcc2bfb5. Requires owner Play upload key and final acceptance.
- Phone acceptance: compare navigation/Archive/Who’s Who/W.NE speed against M107; check new shared dock and More, repeated tab tap, File manager, and full screen. Preserve current app and research. Next separate milestone offline W.NE.
