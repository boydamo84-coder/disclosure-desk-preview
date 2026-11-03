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

## Status and acceptance

- [x] L1 final CI **GREEN** at source SHA `aac857e4800c2c0b3cb659c2b3d000af4c14e26b`: vault run `41727602097`, website checks `41727601922`.
- [x] L1 ZIP checksum and source parity verified; user download must still be tested on their actual Android device.


- [x] Provider feasibility checked against official documentation.
- [x] Device-only local-first path documented and distinguished from webhook/server model.
- [x] AES-GCM encrypted synthetic CLI vault implemented and tested on Linux (14 PASS); [ ] actual Termux device test.
- [x] Encrypted backup/recovery verified in isolated Linux temporary directories; [ ] physical Samsung/off-device recovery drill.
- [ ] Localhost interface protected and tested against other apps / CSRF.
- [ ] Ko-fi, Play CSV parsers and AdSense permissioned sync implemented.
- [ ] Real owner data accepted. **Not permitted yet.**
- [ ] Tax estimate approved. **Not implemented.**
- [ ] Live website/Netlify/Supabase changed. **Not authorised.**

**Working branch:** `feature/sources-archives-next-batch-nov03` in `boydamo84-coder/disclosure-desk-preview`; current 11-tab website production and all existing client data must remain untouched. Update `MASTER_HANDOVER.md` after every future L milestone.
