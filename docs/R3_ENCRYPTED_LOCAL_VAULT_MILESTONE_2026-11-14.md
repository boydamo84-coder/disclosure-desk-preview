# Disclosure Desk R3 — Encrypted local vault milestone
_Date: 14 November 2026 · Branch: `queue/dd-web-r3-from-r2-nov14` · Development-only; NOT production/Netlify deployment_

## Purpose and actual scope

Owner approved the next R3 Hypothesis Lab work after the **original, session-only browser prototype** was opened successfully in Chrome on their Samsung via Termux at `http://127.0.0.1:4175`. This milestone adds **opt-in encrypted local persistence**, reopen/unlock, encrypted file backup/restore and complete-revision autosaving, while keeping live R2 untouched. It does **not** create a password-based Disclosure Desk account, real server-side per-user permissions, cloud sync or a certified security product.

### Implemented and validated

- `experiments/r3/hypothesis-vault.js` encrypts UTF-8 JSON notebooks **before** writing to browser IndexedDB. Uses Web Crypto AES-256-GCM with random 12-byte IV for each write, unique random 16-byte PBKDF2-SHA256 salt per vault, 310,000 derivation rounds, 128-bit GCM tag and fixed format-bound authenticated associated data. The passphrase is not saved to disk by this code; the derived non-extractable CryptoKey exists in tab memory while the notebook is unlocked.
- The encrypted document format is versioned as `dd-r3-private-aes256gcm-v1`; plaintext notebook/case fields remain **inside** the authenticated ciphertext. Decryption checks the file format, input size, KDF parameters, AEAD authentication and minimum notebook/revision/source shape before presenting data. Wrong passphrases or tampering fail.
- Local storage is opt-in via `Enable encrypted local saving` and two matching passphrase fields. Completed, validated hypothesis revisions are encrypted/saved before the UI reports success; unsaved typing in the editor is **not** persisted. Reload requires a passphrase to unlock the encrypted copy.
- Writes use an IndexedDB readwrite transaction and a random per-save generation marker checked against the last known marker before overwriting. A second tab with a stale generation should not silently overwrite a more recent saved version. Database writes are atomic on the browser's IndexedDB semantics, but not a substitute for separate reliable backups.
- Encrypted backup download is explicit; the old unencrypted JSON export option is replaced. The backup stores no plaintext hypothesis labels. Import authenticates the encrypted file with a passphrase **before** adding it to storage. It never silently overwrites an existing local vault. Explicit local removal requires a `DELETE` typed confirmation after locking.
- `experiments/r3/hypothesis-lab-preview.html`, `hypothesis-ui.js`, `hypothesis-ui.css` expose create/enable/unlock/download/import/lock/remove states and update the UI honestly. On lock, the notebook, decrypted title, editor data, history options and rendered content are removed from active page state. No automatic upload or publication was added.
- Fixed a real **393px** layout regression when 3+ hypotheses were shown: mobile grid columns use `minmax(0,1fr)` and the horizontally scrollable list is contained inside the card. Original 14-tab premium dock remains a **disabled visual reference** in this isolated UI; production navigation unchanged.
- `scripts/build_r3_lab_preview.cjs` copies `hypothesis-vault.js` only into the isolated offline preview. Strict public site bundler does not allowlist any R3 alpha UI/vault source. No Netlify usage.

## Verified automated tests and artifact

**Exact runtime/test/workflow SHA `ad227422cda1d5e1f066eb14e030c1079687d169`.** GitHub Actions [run 43650713333](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43650713333) completed **SUCCESS** for both jobs:
- Offline Gap Finder and Hypothesis engine contractual tests: **PASS**.
- Headless Chromium at 393px and 1280px: **PASS**, with fictional test cases; opt-in encryption, encrypted-only persisted representation, old and new revision preservation, refresh/lock/wrong passphrase, explicit encrypted JSON download, tampered and wrong-passphrase import rejection, successful clean restore, local delete confirmation, no horizontal overflow, original 14 design-reference tabs and **zero external requests**.
- CI ZIP artifact `14136230579`, `disclosure-desk-r3-hypothesis-lab-offline-prototype`; link: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43650713333/artifacts/14136230579. GitHub metadata expires **28 November 2026**. The ZIP was also downloaded into the current conversation workspace as `R3_Hypothesis_Lab_Encrypted_Test.zip`; its archive integrity and 8 expected members were verified.

Previous intermediate CI runs failed on outdated test copy, asynchronous decrypt-test assertions, and a real narrow viewport overflow; those issues were fixed and the **current complete run is GREEN**. Do not erase the history of those failures.

## Important limits — must be disclosed to owner/testers

1. **Experimental/local browser security, not account authorization.** Local key/passphrase checks do not constitute a server-side identity, multi-user permissions, or remote access control. Research should remain fictional/non-sensitive until independent review and real account-level isolation are implemented.
2. **No password recovery.** Forgetting the passphrase means the saved encrypted notebook and backup cannot be decrypted by the app. No escrow/cloud copies.
3. **Browser storage may disappear.** Stored vault is scoped to the browser profile plus `http://127.0.0.1:4175` origin. Changing the URL/port, using Incognito, uninstalling Chrome or clearing website data may lose access. Download and separately retain an encrypted backup, and keep the passphrase separately.
4. **Not autosaving incomplete editor text.** Only completed saved revisions are persisted; typing in an unsaved form is still vulnerable to tab closure/crash.
5. **Encrypted file is not tamper-proof history against the password holder.** AEAD authenticates a snapshot but does not prevent a user or attacker who knows the password from restoring an older valid snapshot, nor protect against a fully compromised device, malicious same-origin local scripts, or memory inspection. No security certification or penetration test has been performed.
6. Previous alpha versions could export plaintext JSON; this version removes that option, but any **previously downloaded** plaintext files remain unencrypted and should be handled accordingly.

## Next controlled work

- Actual owner Samsung test of encrypted save, reload/unlock and backup/restore. Existing Termux server must be stopped with Ctrl+C and restarted from new extracted `R3_Hypothesis_Lab_Encrypted_Test` folder on same local origin.
- Add user-consented secure recovery/backup policies, browser storage failure messaging and a proper account isolation architecture (if cloud features are needed) with real authentication and server-side permissions/row-level security, designed before service writes.
- Optional Research Gap Finder→Hypothesis Lab link only after evidence/provenance and privacy review, plus W.NE integration, physical Android/iPhone accessibility checks and separately authorized R3 website deployment.

**Production remains live R2 `8af0a5a`**; this commit makes no production merge, Netlify deploy, Android APK build, Supabase/Auth update, AdSense action or public research upload.
