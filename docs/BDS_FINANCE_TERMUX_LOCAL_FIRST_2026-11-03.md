# BDS Finance Centre — Android/Termux local-first design

**2026-11-03 — OWNER-PROPOSED DIRECTION; FEASIBILITY VERIFIED; GITHUB-ONLY DOCS CI GREEN; NOT YET IMPLEMENTED.**

## Decision and boundary

The owner asked whether the Finance Centre could live **only on the Samsung phone** and use **Termux to pull financial reports**. **Recommended primary design: yes, local-first with manual/on-demand online synchronisation.** The finance database should live on-device, with no financial record tables hosted by the public Disclosure Desk site, no always-on personal server, no externally reachable Termux port, and no user financial data submitted to the current Supabase project. This supersedes the **cloud-hosted F2 rollout as the immediate plan**; it does NOT delete or reverse the previously CI-green PostgreSQL candidate, which remains an **unapplied optional alternative**.

This is not truly always-offline: while the dashboard and previously imported records can work offline, **retrieving fresh revenue requires an internet connection**. The user presses **Sync now** while online; the app locks the vault again after use. Scheduled background Termux sync may be delayed or killed by Android power management, so it is not required for correctness and must not promise real-time updates.

## Sources: capabilities verified 2026-11-03

| Platform | Device-only approach | Important constraints |
| --- | --- | --- |
| Ko-fi | Download complete payment history CSV in the signed-in Ko-fi website, then import into the local vault; optionally share the file directly to a future import screen | Ko-fi's documented API is an **outbound payment webhook**, not a documented history-polling API. Fully automatic event delivery while the phone is offline would need an internet-reachable receiver (a separate cloud component), and is deliberately out of the phone-only design. Never invent such an API or scrape the account. |
| AdSense | Locally authorised Google OAuth2 installed-app flow with read/report scope, then Termux fetches daily estimated earnings as available | Approval/account/API setup required; Google states AdSense does **not support service accounts**. Refresh credentials require encrypted storage and safe browser callback handling. Estimates may change; settled payments should not double-count earnings. |
| Google Play | Download official monthly financial CSV and import it into the vault initially | Google's private Cloud Storage reports can be fetched programmatically with appropriate account permission, but access tokens/service-account key management on a phone carries risk. Prefer manual file import first; only add direct retrieval after least-privilege and credential storage are proven. Reports are delayed and may be UTF-16. |
| Other income/expenses | Manual locally entered records and official invoices/receipts | Do not assume that every payout is additional revenue or every expense deductible. Preserve source reference/currency/status; do not store donor personal messages without a genuine need. |

Official documentation:
- Ko-fi export: https://help.ko-fi.com/hc/en-us/articles/10792069957661-How-tax-works-on-Ko-fi
- Ko-fi webhook limitations: https://help.ko-fi.com/hc/en-us/articles/360004162298-Does-Ko-fi-have-an-API-or-webhook
- Google AdSense OAuth: https://developers.google.com/adsense/management/direct_requests
- Google Play export/private Cloud Storage: https://support.google.com/googleplay/android-developer/answer/6135870?hl=en-GB
- Google Play financial reports: https://support.google.com/googleplay/android-developer/answer/2482017?hl=en-GB
- Official Termux app-private storage details: https://github.com/termux/termux-packages/wiki/Termux-file-system-layout
- Official Termux app installation: https://github.com/termux/termux-app

## Proposed on-phone architecture — not implemented yet

```text
Samsung device
  Termux / Python local process (online ONLY for intentional Sync)
     +-- Ko-fi verified CSV import (manual)
     +-- Play Console CSV import (manual)
     +-- AdSense OAuth / reports (later, once approved and reviewed)
     +-- validation, transaction de-duplication, GBP conversion, audit trail
     +-- LOCAL ENCRYPTED VAULT
     +-- encrypted backup / tested restore
     +-- local-only Finance Centre dashboard
```

1. Place project and sensitive data **inside Termux private `$HOME`** (proposed `$HOME/.bds-finance/`), not in `/sdcard`, `Download`, public Android shared storage, GitHub or website assets. Android app sandbox is useful but **not the same as application-level encryption**.
2. Implement a verifiably authenticated-encryption vault with password-derived key or a tested SQLCipher alternative; verify compatibility on the owner's existing Termux packages before installing because Termux builds may conflict with their bundled SQLite. Never write a plaintext database to disk and assume a local passcode makes it encrypted. Never hardcode keys, OAuth tokens or payroll values.
3. **Backup/restore are essential.** Device-only without backups risks losing the ledger if the phone breaks, is reset, Termux is uninstalled, or app data is cleared. Use independently recoverable, password-encrypted backups to an external USB-C drive or optional user's own cloud service storing ciphertext only; validate restore in a separate test directory before real use. An off-device encrypted backup does not mean exposing usable finance records to a remote service.
4. Initially run a Python terminal importer and sample dashboard; later expose a web-like interface **only on `127.0.0.1`**, with per-launch unpredictable access token, server-side access checks, CSRF/Origin enforcement, strict local content policy and no LAN binding. Other local Android apps could contact localhost; `127.0.0.1` **is not authentication by itself**. Avoid persisting auth cookies or raw financial data in browser caches.
5. Keep separate `estimate`, `final income`, `payout transfer`, `fee`, `refund` and `expense` ledger categories. Import is idempotent; provenance and tax-year 6 Apr–5 Apr retained. Show **last sync, pending sources, stale reports and manual file-import state** clearly.
6. No third-party financial data is permitted in Git commits, tests, demo HTML, source code, support tickets or public Netlify builds. No automatic tax figure until PAYE inputs/other taxable income and HMRC-rule review are available in a protected context.
7. Keep Termux and plugins sourced consistently; official Termux warns against mixing F-Droid and GitHub signed plugins. Do not reinstall the user's current Termux casually: other projects and manuscripts may exist there.

## Security trade-offs

**Advantages:** no finance-service monthly hosting costs assumed; no public finance DB/API, less external attack surface, device works without network for historical reports; reasonable for a single owner.

**Limitations:** if the phone is compromised or unlocked, the database and decrypted session may be at risk; local code must be protected as well; internet sync and Google OAuth involve external providers; service credentials on phone are sensitive; provider report schema can change; device loss without tested encrypted backup is serious; some accounts cannot be automatically polled (Ko-fi).

This option is **potentially safer for this particular single-owner use case**, not inherently secure without encryption, verified implementation, physical-device testing and backups. Android lock-screen, OS updates, no shared unencrypted exports, shortened open-vault sessions, and clear token revocation are required.

## Next implementation milestones

- **L1 — Local encrypted vault proof (CODE STAGED, LOCAL TESTS PASS; GitHub CI and Samsung QA pending):** `finance_local/vault.py` and bundled demo ZIP. AES-256-GCM + scrypt encrypted offline fictional transactions, hidden passphrase prompts, private HOME file locks, backup/verify/restore and 14 automated tests PASS on Linux. **NOT independently audited / not yet compatible-tested on Samsung.** No real income allowed. See `finance_local/README.md`. Do not replace F1 with a real-data app yet.
- **L2 — Local dashboard integration:** same BDS styling; read-only financial summaries from unlocked vault, owner-controlled unlock, local HTTP protection or file rendering, Samsung browser QA, no exposure on LAN or public website.
- **L3 — Real official CSV import adapters after L1+L2 security acceptance:** Ko-fi export and Play reports; validate schema, document fees/VAT/FX, reject duplicate or conflicting provider references, minimize donor personal data, test with owner-redacted sample file before handling real records.
- **L4 — Optional AdSense OAuth reporting:** after AdSense approval, opt-in installed-app Google authorisation with short-lived access and encrypted refresh credentials; no service-account attempt.
- **L5 — Optional Play Cloud Storage pull:** only if on-device least-privilege access can be made safe; otherwise retain CSV import.
- **L6 — Personal tax reserve:** versioned Northern Ireland/UK sole-trader rules, additional PAYE-sensitive estimate, statutory reminders and clear limitations; not HMRC filing.
- **L7 — Owner-confirmed recovery drill:** decrypt a real encrypted backup on a clean local test directory, then decide if the system can safely graduate from synthetic-only.

## Verification — 2026-11-03
- L1 GitHub Actions [41727300663](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41727300663) **SUCCESS**, 14 tests. ZIP SHA-256 `ba5f27427ab518df73c85108169723a1c571a1aed42900a2025944cc99c89977`; source/ZIP byte-parity correction + checksum file staged. This is not an Android test.
- GitHub-only static/documentation QA run [41724910278](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41724910278) **SUCCESS** at source SHA `98ec9c88f8673b40afb27804ebe09afbe8b70e24`.
- First run `41724778280` failed on two mismatched **assertion text snippets**, not a financial sync or security implementation; test corrected with no product code change.
- No phone runtime/security, encrypted vault, report parser, real online sync or backup has been created or exercised. Previous F2 PostgreSQL SQL remains unused.

## L1 technical implementation checkpoint — 2026-11-03

**Termux Android Python 3.14 fix, 2026-11-03 — CI GREEN, PHONE RETEST PENDING:** Reported crash on `os.link` after passphrase prompt in original L1 `init`; fixed new-vault and restore to reserve destination with `os.open(... O_CREAT|O_EXCL|O_NOFOLLOW)` and `os.replace` under lock. Three additional regression tests cover absent `os.link`, failed initial rename cleanup and refusal to overwrite existing files. Corrected source and ZIP at `finance_local/BDS_Finance_Termux_L1_Android_fix.zip` (SHA-256 `b4b51143ad53487d82f2c6a0588ddac45fc22220df9fa76ac5b7a9bd07331422`); canonical ZIP was updated too. **GitHub CI 41730679400 SUCCESS on Python 3.12 and 3.14, 17 tests each**, plus archive/source parity; site regression **41730679360 SUCCESS** at `d073b5509341800be56b729590eb72c6cdbc712b`. The real Samsung retry is still outstanding. No encrypted finance record, external provider access, Netlify/Supabase or live changes.

- **Code staged:** `finance_local/vault.py` and `finance_local/tests/test_vault.py`, source `finance_local/README.md` and portable demonstration ZIP. CI workflow `.github/workflows/validate-bds-finance-termux-l1.yml` passed **GitHub Actions 41727602097 SUCCESS** (14 Linux tests) at exact source SHA `aac857e4800c2c0b3cb659c2b3d000af4c14e26b`; site regression checks **41727601922 SUCCESS**. Source/ZIP byte parity confirmed locally; ZIP SHA-256 recorded in `finance_local/SHA256SUMS`. No Samsung testing. No on-device acceptance. Existing root `docs/prototypes/bds-finance-demo.html` remains a separate browser-only fictional UI and does not automatically unlock or read this vault.
- **Locally checked on Linux:** 14 unit tests PASS, including AEAD tag, wrong password, April boundary, imports/duplicates, file permission rejection, fail-before-replace crash simulation and ciphertext backup/restore. No source files include private financial information or credentials.
- **Remaining requirements:** test real Termux `python-cryptography` package and OS permissions, verify independent recovery, consider biometric/device-key integration and device threats, then stage L2 protected phone UI. L1 is CLI only; no direct Ko-fi, Play or AdSense sync and no tax calculation.

## L1 first real Samsung acceptance (2026-11-03 22:28 UK)
**PASS:** Corrected Termux Python 3.14 build extracted; `init` created synthetic-only encrypted vault; `demo-fill` added ten fictional records; `summary --year 2026/27` showed nine in-year rows, £337 income, £19 refunds, £28.50 platform fees, £12 expenses and £277.50 fictional profit. This verifies the corrected initial write/read/add/totals workflow on the owner's actual phone. **NOT TESTED ON DEVICE:** encrypted backup, verification, isolated recovery, off-device copy, private dashboard or real provider sync. Next steps are `backup` to a new filename and `verify-backup`, without overwriting/deleting `~/.bds-finance/vault.bds`. All data remains fictional.

## L1 on-phone encrypted backup acceptance — 2026-11-03 22:31 UK

**SAMSUNG VERIFIED:** The owner ran `python finance_local/vault.py backup "$HOME/bds-finance-sample-backup.bds"`; app confirmed "Verified encrypted backup exported; NOT plaintext." Then `python finance_local/vault.py verify-backup "$HOME/bds-finance-sample-backup.bds"` confirmed "Encrypted backup verified. Fictional entries: 10. No restore performed." This verifies ciphertext backup creation and authenticated opening on the original phone, not that a disconnected backup copy or separate restore exists.

**Still required:** test restoration into a new isolated private Termux folder without touching `~/.bds-finance/vault.bds`; independently copy the encrypted backup off the device and test recoverability. Actual income or provider imports remain disallowed; the vault contains only fictional transactions. No hosted backend or live site changed.

## L1 Samsung independent-test-folder recovery — 2026-11-03 22:36 UK

**SAMSUNG VERIFIED:** The owner restored the **ciphertext-only** backup into a newly created, separate private Termux HOME via a temporary `HOME` override. The command printed **"Encrypted backup restored into private Termux HOME. No previous vault overwritten."** The recovered vault's `summary --year 2026/27` returned exactly the original fictional £277.50 profit (9 rows, £337.00 income, £19.00 refunds, £28.50 fees, £12.00 expenses). With earlier successful `init`, `demo-fill`, `backup` and `verify-backup`, the L1 **on-device synthetic** recovery drill is now complete. This is not a real accounting app or an independent cryptographic audit.

**Still OPEN:** encrypted copy stored outside the device (USB-C or personally controlled Drive), independent checksum/copy verification, phone-loss recovery on another Termux installation, and all real records/provider sync. Merely copying backup into phone Downloads does not protect against a lost phone. Do not delete `~/.bds-finance/vault.bds` or any existing backups. No finance data should be transferred to Git or the public site.

## L2 local private dashboard milestone — GitHub QA passed; Samsung display user-confirmed (2026-11-03)
- Read-only synthetic dashboard staged at `finance_local/dashboard.py` with 10-minute authenticated on-device HTTP session, BDS navy/gold mobile UI, financial totals and filters. Existing encrypted L1 vault, backup and recovery path unchanged.
- Nine isolated Python L2 HTTP/security tests and mobile Chromium synthetic layout passed locally. GitHub Actions [41736247141](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41736247141) **SUCCESS** on Python 3.12 and 3.14 (L1+L2 and archive parity); Disclosure Desk staging [41736247039](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41736247039) **SUCCESS** at source SHA `dfffb15428af973a2a39eb3002b388b3c4efea84`.
- Distribution `finance_local/BDS_Finance_L2_Private_Dashboard.zip` includes only `dashboard.py` and `DASHBOARD_README.md`. Instructions use `unzip -n` to avoid overwriting existing L1. It does not contain real money, passphrases, account tokens or backups.
- **Owner-reported Samsung display accepted (~23:16 UK):** owner responded “Yes perfect” when asked whether the private L2 dashboard looks and displays properly on their phone. Do not extrapolate from this to verified UK-year/product filtering, session timeout, localhost abuse resistance, security audit or real-data readiness. Browser launch/session URL contains a temporary secret and must not be shared. Ko-fi/Play/AdSense imports and tax estimates remain unimplemented.
- Owner reports manually uploading encrypted demo backup to Google Drive, but independent download/recovery from Drive has not been verified. No Netlify/Supabase/public website/Play change.

## L2 phone UI confirmation — 2026-11-03 ~23:16 UK

The owner confirms the new local, fictional-only Finance Centre browser dashboard displays properly on Samsung. This is an owner-reported UX confirmation, not a comprehensive functionality or security audit. Manual encrypted Google Drive backup upload was also reported earlier; **Drive-to-clean-environment recovery remains untested**. Next: validate year/product filters and session expiry/lock on-device, then harden data-import consent and provenance rules before any genuine financial records.

## L2.1 fictitious filter/lock candidate — GitHub CI GREEN (2026-11-03)

- **Code staged, user Samsung upgrade still pending:** `finance_local/dashboard.py` and 15 L2 HTTP/security tests with server-backed countdown, Lock now token revocation, ledger DOM scrub, same-origin/Sec-Fetch-Site checks and tax-year/BDS-product sample filters. Original L1 vault remains read-only.
- **32/32 local Python tests pass** (17 L1, 15 L2) and desktop 390px headless Chromium mocked-network UI exercise passes, including accelerated auto-lock. GitHub Actions **41740238168 SUCCESS** on Python 3.12/3.14, downloadable code-only artifact `BDS-Finance-L2-1-Samsung-Synthetic`, source `7e73c86799eb2c576be3e10a1eacd3fed5f2b72c`; site regression **41740238160 SUCCESS**. The raw locally generated ZIP `BDS_Finance_L2_1_Lock_and_Filters.zip` SHA-256 `1673e2d5b4776d8472eb7ab0f140375bdb2923f0562f97ecaf0c8232611691b1`.
- **Next owner acceptance:** install over running L2 code after Ctrl+C, test 2025/26 £15 and 2026/27 product filters, Lock now and 10-minute auto expiry in Samsung Chrome. Session URL is private. A screenshot of fictional metrics (not URL) is safe. No real finance data, provider sync, tax estimate, security audit or public deploy authorised.

## L2.1 Android Chrome initial navigation 403: fixed candidate, Samsung retest pending (2026-11-03)

**CI verification complete:** [Finance run 41743244163](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/41743244163) SUCCESS on Python 3.12/3.14 with regression test and new dashboard-only Actions artifact; no-deploy Sources QA 41743244182 SUCCESS. Actual Samsung verification remains pending.

Samsung screenshot after two L2.1 unlock attempts showed a nearly blank local page with tiny `Forbidden`. Reproduced from real HTTP GET `/` with `Sec-Fetch-Site: cross-site` (Termux-to-Chrome intent) which L2.1 had rejected. The new patch permits cross-site navigation metadata **only for GET `/` static shell**, still denying API requests to `/api/ledger` and `/api/lock` without same-origin metadata and bearer token. Existing no-cache, localhost, Host/Origin and 10-minute limits remain. Local 33 automated L1/L2 tests PASS. Source commit `3be703de52b368bd5cbd3ced03cb5fb0b0bc1bcf`, GitHub CI 41743244163 pending when written. Download sample-only `BDS_Finance_L2_1_Android_Browser_Fix.zip`, extracted with `unzip -o` in the pre-existing `$HOME/bds-finance-l1`; it cannot replace `vault.py` or any encrypted backup. Real Samsung confirmation still required. Never share browser `#token` or vault passphrase.

## L2.1 real Samsung browser and manual lock status — 2026-11-04 00:47 UK

Owner reports Chrome still fails after the initial-navigation compatibility patch, but **Samsung Internet displays the BDS Finance Centre**. Screenshot shows the synthetic-only local branded shell, the warning notice, and the `Locked by owner` / `Finance Centre locked` state after manual Lock now action. This is **on-device visual confirmation of Samsung Internet rendering and manual lock UI**, not verification of unlocked-year/product-filter totals, automatic expiry, or server-side bearer revocation. Chrome failure remains unresolved, and no second browser fix is justified without the particular non-secret error details. Next, relaunch in Samsung Internet and check 2026/27 all £277.50, 2025/26 all £15.00, Disclosure Desk £147.00, Our Cinema £142.50, BDS shared −£12.00 BEFORE pressing Lock now. Never share the private `#token` address or passphrase. No vault/backup modifications, real finances, provider data, Netlify, Supabase, Play or live site changes.

## L2.1 2025/26 tax-year filter actual Samsung acceptance — 2026-11-04 01:00 UK

**VERIFIED BY OWNER SCREENSHOT on Samsung Internet:** Year `2025/26` with `All BDS products` recalculates fictional income £15.00, outgoings £0.00 and profit £15.00; Ko-fi is sole sample income source, as expected for the single 2026-04-05 transaction. Countdown visibly shows `Auto-lock in 09:29`. This establishes displayed countdown, **not ten-minute timeout completion**. Product-specific year 2026/27 filters still need owner test: Disclosure Desk £147.00, Our Cinema £142.50, BDS shared −£12.00. The switch-away privacy lock is owner-confirmed separately; the remaining 10-minute expiry/server-denial and Chrome bug are still open. No real data, Netlify, production or Supabase changes.

## Status and acceptance

- [x] L1 final CI **GREEN** at source SHA `aac857e4800c2c0b3cb659c2b3d000af4c14e26b`: vault run `41727602097`, website checks `41727601922`.
- [x] L1 ZIP checksum and source parity verified; user download must still be tested on their actual Android device.


- [x] Provider feasibility checked against official documentation.
- [x] Device-only local-first path documented and distinguished from webhook/server model.
- [x] AES-GCM encrypted synthetic CLI vault implemented and tested on Linux (14 PASS); [ ] actual Termux device test.
- [x] Encrypted backup and independent test-directory restore **verified on actual Samsung** with fictional £277.50 matching; [ ] off-device copy and fresh-device recovery still unverified.
- [ ] Localhost interface protected and tested against other apps / CSRF.
- [ ] Ko-fi, Play CSV parsers and AdSense permissioned sync implemented.
- [ ] Real owner data accepted. **Not permitted yet.**
- [ ] Tax estimate approved. **Not implemented.**
- [ ] Live website/Netlify/Supabase changed. **Not authorised.**

**Working branch:** `feature/sources-archives-next-batch-nov03` in `boydamo84-coder/disclosure-desk-preview`; current 11-tab website production and all existing client data must remain untouched. Update `MASTER_HANDOVER.md` after every future L milestone.
