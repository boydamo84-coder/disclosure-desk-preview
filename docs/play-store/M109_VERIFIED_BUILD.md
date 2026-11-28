# M109 verified Android build — 28 November 2026

- Executable commit: d660871d9a7008e6177b19289bb7fe9ba61d064b
- Branch: android/m109-persistent-directory
- Successful CI: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/46099250122
- Prior build 46098945216 caught a directory-search-reset regression. Corrected by retaining the embedded document, removing child history mutations and preserving memory-only directory filter state before rebuilding.
- Android-only persistent Who's Who directory retains the Desk, archive and directory state during tab switches; embedded header/dock hidden, contextual help and back navigation restored. Explicit editorial links still navigate at top level. Standalone public site's behavior remains unchanged.
- All source/browser regressions passed, including one Desk and one directory request, same document identities, archive 13,515 records and filter retention, directory filter retention, embedded Back, 320/393px bounds, no duplicate header/dock, help, top-level links and no fatal JavaScript. Android link and notification boundaries, Android build, debug signer and packaged content checks passed.
- Downloaded both GitHub artifacts, verified artifact ZIP digests and build SHA256SUMS. Independently checked each package against all 161 files in the exact staged website and native asset scripts; unsigned release format and native-library alignment checks passed.

| File | SHA256 |
|---|---|
| DisclosureDesk-M109-private-beta.apk | bd099e7172cf6e5a4d94f25c9934547a052071d120ea84fdb869ab9bdf703fa0 |
| DisclosureDesk-M109-release-UNSIGNED.apk | 1d651153a77488631a69e565b98e5ec9d182c2b54ec5bb726c13166513228979 |
| DisclosureDesk-M109-UNSIGNED.aab | 87c3e0a928f9dee50ff1d80b0c9a96598ae2beb76ea7121e457f1d3b443d9a32 |

No website deployment or Play upload. Device testing is still needed to measure the actual Android transition time and confirm that the observed black flash is resolved. The first directory visit still loads the directory; subsequent switches retain it. Offline W.NE and seven-day news cache remain separate acceptance work; M109 preserves M108's W.NE changes. The unsigned bundle is not ready to submit without release signing and remaining Play release checks.
