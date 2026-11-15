# DD-WEB-R3 · Actual signed-in preview QA for two approved test accounts
_Date: 15 November 2026 · **DRAFT PR #13 / preview only** — never the live production page._

## Boundaries
The two existing owner-approved Disclosure Desk accounts are labelled **A** and **B**. Do not include their emails, Supabase user UUIDs, passwords, access/refresh tokens or notebook passphrases in screenshots, GitHub comments, or ChatGPT messages. All test notebooks must be **fictional**. Do not use real witness details, unpublished records, personal addresses, or important research. **Never clear Chrome's existing localhost 127.0.0.1:4175 storage** to prepare this hosted test; the old Termux vault has a distinct origin and needs its own encrypted export/import.

The currently available isolated Netlify draft URL is `https://deploy-preview-13--uap-disclosure-desk.netlify.app`. Sign-in sessions on this preview origin do not necessarily share the live website's signed-in session. Use **Boards → Account** on the preview to sign in; only then visit the hosted Lab. The preview code must be published at the current PR head before running the QA page.

The hidden, read-only diagnostics panel is opened only on deploy previews (or localhost development) via:
`https://deploy-preview-13--uap-disclosure-desk.netlify.app/research/r3-lab/?dd_r3_qa=1`

The diagnostic uses a real Supabase `auth.getUser()` verification and read-only `SELECT` under the signed-in browser's session; it never receives or logs the user's credentials, and cannot do cross-account mutations. It does **not** claim success simply because no other rows exist.

## Exact two-account test, with fictional content only
1. **Account A**, normal Chrome: visit preview homepage and sign into Boards using its normal account sign-in UI, **on the preview**. Open the R3 Lab QA URL. Tap **Verify real signed-in session**. It should report a verified account. Tap **Copy my test ID**; keep the UUID privately to paste into the other test session. Copy safe results if useful; the safe report intentionally excludes IDs and tokens.
2. Still in A: in the Lab, **Load fictional demonstration**, enable local encrypted saving with a unique test passphrase, then tap **Save encrypted backup to account** and approve the branded confirmation. No passphrase is transmitted to Supabase. Return to QA and tap Verify: **Own encrypted notebook backup present: YES**. Keep the first local/browser copy.
3. **Account B**, a separate Chrome Incognito window, second browser profile or another phone: sign into preview Boards with B's own account; open the same QA URL and Verify. Its local notebook should initially be absent and A's account cloud copy should not appear. Tap **Copy my test ID** privately. Create a separate fictional B notebook and encrypted B cloud backup, then Verify: **Own encrypted notebook backup present: YES**.
4. From A, paste B's **test ID** (not B's password) into **Other account test ID** and tap **Check other account read access**. Expect **DENIED – ZERO OTHER-ACCOUNT ROWS** even though B separately confirmed its own encrypted test backup exists. Repeat the mirrored check B→A. A visible foreign row is a **STOP / do not release**. Query errors are inconclusive and require investigation, not a pass.
5. **Recovery on a fresh browser/device** for account A or B: without clearing the original browser, sign into the same profile on a genuinely separate device/browser profile that has no local R3 vault. In the Lab, check that the encrypted account backup is found. Enter the **original test passphrase** and tap **Restore account backup on this device**. Confirm fictional title, explanation and versions. Try a deliberately incorrect passphrase first; it must not reveal plaintext or create a local vault.
6. Verify account sign-out or switch immediately hides unlocked research and cloud controls. A guest must not be offered owner cloud controls. Use back/forward and refresh to check for stale content, particularly on Android.
7. Optional cleanup **after successful verified restore**: from each signed-in owner account individually, delete only its own **fictional R3 test cloud backup** using the deliberate typed-DELETE confirmation. Do not touch live Boards, W.NE, user profiles or unrelated data. The local encrypted browser copy/download should remain independently intact.

## Report results without private details
```text
A verified signed session: PASS / FAIL
A own encrypted cloud record: YES / NO
B verified signed session: PASS / FAIL
B own encrypted cloud record: YES / NO
A -> B SELECT (B definitely has a record): DENIED / VISIBLE / ERROR
B -> A SELECT (A definitely has a record): DENIED / VISIBLE / ERROR
Wrong passphrase restore: DENIED / UNEXPECTED
Correct passphrase restore on new device: PASS / FAIL / NOT YET
Logout/switch hides plaintext immediately: PASS / FAIL
Navigation / Android back / layout: PASS / FAIL
```

## Security and release state
These are owner-executed signed-JWT **browser** checks; an automated simulated backend, previous transaction-local PostgreSQL RLS tests, or existence of the preview does not make them passed. The QA panel is intentionally disabled on the production domain, and only issues read queries. Full forbidden mutation/expired token REST tests with authenticated sessions, independent encryption review, final exact-HEAD release CI and owner production approval remain separate release gates. **Do not merge draft PR #13 or publish R3 in production based on this document alone.**
