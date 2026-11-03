# BDS Finance Centre — L2 private phone dashboard (fictional-only beta)

**Status: synthetic-only code preview.** The phone's working L1 encrypted vault remains the single source of truth. This release does **not** handle real financial records, connect Ko-fi/AdSense/Google Play, estimate actual taxes, or write readable transactions to disk. It does not run on Disclosure Desk's public website or Supabase and needs no Netlify build.

## What the first dashboard does

- Opens the existing `~/.bds-finance/vault.bds` with the private passphrase entered **inside Termux**, then keeps a decrypted copy **only in the running Python process and browser memory**.
- Starts a temporary, random-port HTTP server bound **only to `127.0.0.1`** on the Samsung. It is not a LAN or internet server. A 256-bit random session key is required to fetch the read-only fictional ledger; the browser receives that key in a fragment and removes the fragment from its address on startup.
- Shows BDS navy/gold design, UK tax year, selected product, gross income, refunds/fees/expenses, fictional profit, income sources, excluded estimates and transfers, and the sample ledger.
- Denies unauthorised requests and other Origins/Hosts; sends `Cache-Control: no-store` and strict content restrictions, loads **no external assets**, stores no cookies or browser local storage, exposes no file export/write endpoints.
- Automatically ends the server session within ten minutes or immediately when you press `Ctrl+C` in Termux. The browser hides the figures when backgrounded or at the ten-minute timeout. Avoid sharing screenshots of the *initial launch URL*: it contains the temporary access key.

**Important limitations:** Other software running on an already compromised/unlocked Android device could still inspect decrypted data from memory or screen. A localhost web server is not private merely because it is localhost; the per-session token, host/origin rules and no-cache headers add important protection but are **not a completed security audit**. No proof of production-grade confidentiality or whole-device disaster recovery should be inferred from this beta.

## Installation — SAFE with existing L1 test vault and W.NE

1. Do not uninstall Termux, reset Android storage, delete `~/.bds-finance`, or change existing W.NE folders.
2. Download **`BDS_Finance_L2_Private_Dashboard.zip`** from the ChatGPT conversation. It contains **only** `finance_local/dashboard.py` and `finance_local/DASHBOARD_README.md`; it intentionally does not overwrite `vault.py`, an existing vault or any backups.
3. In your existing Termux shell:

   ```sh
   cd "$HOME/bds-finance-l1"
   unzip -n "$HOME/storage/downloads/BDS_Finance_L2_Private_Dashboard.zip"
   python finance_local/dashboard.py
   ```

4. Enter your existing sample vault passphrase **privately in Termux**. Don't send it to ChatGPT. The command should attempt to open Chrome through `termux-open-url`, without printing the one-time access key.
5. Chrome should show the fictional Finance Centre with **£337.00 fictional income, £59.50 combined outgoings and £277.50 fictional profit** for 2026/27, with 9 transactions for that year. The tenth fictional entry is from 2025/26. Test the product filter; Chrome's Back button, tab visibility changes or ten-minute timeout may lock the display.
6. Return to Termux and press `Ctrl+C` to end the private session. You can relaunch it later using the same command and passphrase.

**If the browser does not open automatically:** press `Ctrl+C` in Termux, then run `python finance_local/dashboard.py --no-open`. This prints a one-time local address which you can copy to Chrome **without sharing it**. The address's `#token=...` fragment is an access credential: never include it in screenshots, support tickets, cloud notes, QR codes or chat messages. The browser removes it from the visible address immediately after opening the dashboard.

**If the dashboard shows “Finance Centre locked” when you first open it:** there may have been an expired link, lost token fragment or browser behaviour difference. End the Termux session and start a fresh one. Report the error message without the private URL or passphrase.

## Privacy and safety conditions

- This release is a **read-only display**, not a financial record-keeping app. It deliberately doesn't accept real manual input or automatic API sync.
- All encrypted vault, `.bds` backup and restore-test records stay in Termux's private storage unless **you** manually copy a ciphertext backup elsewhere. Existing Google Drive backup remains separately maintained by you.
- The dashboard HTML is sent as a response only while the Python process runs, not saved in Downloads or Git; the decrypted entries are served to your authenticated browser tab and cleared on tab hide/session expiry.
- Your phone must remain updated with a secure lock screen; no rooted/compromised-device guarantee is made.
- This version **does not** have a tax calculator. PAYE income and current HMRC rules will be needed for accurate additional-income-tax estimates.

## Verification and remaining gates

- Automated Python tests (`python -m unittest discover -s finance_local/tests -v`) cover HTTP authentication, denial of other Origins and Hosts, wrong passphrase, read-only methods, expiry, no caching, no public financial data in the HTML, no vault modifications and fictional totals.
- Headless desktop Chromium layout check was run locally at a 390-pixel Android-like viewport with synthetic mocked HTTP data: rendered £337.00 income, £277.50 fictional profit, 9 in-year entries and no page-wide horizontal scroll. This does not replace real Samsung/Chrome testing.
- **Required on-device acceptance:** the first screen opens in Android browser, filters work, no key or passphrase appears in screenshots, Ctrl+C/expiry closes server, and `vault.py summary` still agrees with the dashboard.
- **Required before real data:** independent security review, robust local finance data-entry/import functionality, tested encrypted off-device recovery and provider permission/schema review. L2 remains sample-only.

## Scope

This is an isolated `finance_local/` extension on `boydamo84-coder/disclosure-desk-preview` unpublished development branch `feature/sources-archives-next-batch-nov03`. No action touches public `production`, legacy `disclosure-desk`, W.NE/Our Cinema source projects, Netlify or Supabase.

## L2.1 security/filters checkpoint — 3 November 2026

**This replacement is still fictional-only** and is for Samsung/Termux testing, not a live personal finance product. It adds an on-screen **Lock now** button, a countdown based on the **server's remaining session lifetime** rather than a fresh ten-minute timeout when Chrome reloads, server-side lock-key revocation, blocked cross-site fetch metadata, and removal of decoded ledger contents from the DOM on lock/hide/expiry. No new provider permissions, cloud accounts, app databases or tax calculations.

### Install over L2 without changing the encrypted vault

1. **End the running dashboard session** using its **Lock now** button, or `Ctrl+C` in Termux. Do not delete any folder, vault or backup.
2. Download **`BDS_Finance_L2_1_Lock_and_Filters.zip`** into phone Downloads. The ZIP contains **only** `finance_local/dashboard.py` and `finance_local/DASHBOARD_README.md`, never `vault.py`, your encrypted vault, or any backups.
3. From your existing Termux installation:

   ```sh
   cd "$HOME/bds-finance-l1"
   unzip -o "$HOME/storage/downloads/BDS_Finance_L2_1_Lock_and_Filters.zip"
   python finance_local/dashboard.py
   ```

   Enter your existing encrypted vault passphrase privately in Termux, **never in ChatGPT or in a command-line argument**. The private Chrome launch address contains a short-lived session secret; do not share, photograph or paste it.

### Samsung test checklist — sample-only values

- On first open, select **2026/27** and **All BDS products**: fictional gross income **£337.00**, outgoings **£59.50**, profit **£277.50**, **9 fictional entries**.
- Select **2025/26**: fictional income and profit **£15.00**, **1 fictional entry** (6 April accounting-year boundary).
- Return to **2026/27**, then choose **Disclosure Desk**: fictional profit **£147.00** with **4 entries**; **Our Cinema**: fictional profit **£142.50** with **4 entries**; **BDS shared**: fictional profit **−£12.00** with **1 entry**.
- Check **Auto-lock in MM:SS** counts down. Press **Lock now**: the transaction list, totals and session token should disappear from the page, and Termux's running dashboard server should exit shortly. The server's bearer token is immediately revoked; refresh should not expose records.
- For expiry behaviour, start a *fresh* dashboard session and leave Chrome visible until the countdown ends, or switch away and confirm it locks immediately when hidden. When it locks, return to Termux; the vault on disk must remain intact. **Chrome backgrounding can lock sooner than ten minutes**, by design.
- Do not post URLs from Termux or the Chrome address bar. Screenshots of fictional summary values after the address is hidden are okay.

### Verification limits

The L2.1 package passed isolated Python HTTP security tests and a headless Chromium mobile-layout/filter/lock simulation on fictional data. Desktop Chromium's environment restricted direct localhost navigation, so the UI browser test used a mocked response; the **actual HTTP server** was tested with local Python HTTP requests. This is not a penetration test or real-device result for L2.1 until the owner tries it. Automatic session expiry and server lock do not protect against malware with access to unlocked phone memory, and real earnings/CSV imports remain disabled. A manually stored encrypted Drive backup was reported previously; independent off-device restore has **not** been re-tested from the Drive copy.

## Samsung L2.1 Chrome 403 initial navigation patch — 2026-11-03

The owner observed a blank browser page with tiny `403 Forbidden` after launching L2.1 twice; it was not a passphrase failure. Chrome may mark the initial Termux-to-browser navigation `Sec-Fetch-Site: cross-site`. This patch allows that fetch metadata **only for GET /**, the unauthenticated HTML shell containing no ledger, secret, or financial data. Private `/api/ledger` and `/api/lock` remain protected by a random bearer token plus cross-site, Host and Origin checks. No external URLs, online services or real transactions are enabled.

Upgrade using `BDS_Finance_L2_1_Android_Browser_Fix.zip`; it contains only `dashboard.py` and this README, never `vault.py`, encrypted vault or backups. After stopping an old session with Ctrl+C: `cd "$HOME/bds-finance-l1"; unzip -o "$HOME/storage/downloads/BDS_Finance_L2_1_Android_Browser_Fix.zip"; python finance_local/dashboard.py`. Do not share the initial private browser URL/key or your passphrase. Samsung re-test is required; Linux checks cannot substitute for on-phone results.
