# BDS Finance Centre — L1 encrypted Termux vault

**Status (3 November 2026): CODE PROTOTYPE, SYNTHETIC DATA ONLY.** This is **not** a live income tracker, tax calculator, wallet, payment receiver, or authorised secure store for real finances. **Do not enter genuine earnings, personal tax/PAYE details, names of donors, account numbers or credentials.** No Ko-fi, AdSense, Play, Supabase or external network integrations are included.

The L1 vault is a single Python command-line application that holds predefined **fictional** transaction records encrypted in Termux's private app data. It does not run a server or open a port; online access is not required for any vault operation. The vault decrypts only into the current Python process and re-encrypts on each change. The passphrase is read from a hidden interactive prompt, never from arguments or source code. This is a starting point for future phone QA and security review, **not a security certification**.

## Samsung Android/Termux compatibility patch — 3 November 2026

**Fix for the reported error** `AttributeError: module 'os' has no attribute 'link'`: Termux Python 3.14 on the Samsung lacks `os.link`. The initial L1 build called it during new-vault creation. This revised build **does not call `os.link`**: an exclusive `O_CREAT|O_EXCL` reservation prevents overwrite, followed by `os.replace` of an already-fsynced encrypted temporary file under the private directory lock. If a crash occurs after reservation but before replace, a zero-byte placeholder might remain. It is never mistaken for a valid encrypted vault and is not automatically overwritten on retry. A failed `os.link` attempt should leave only the harmless `.vault.lock` file and no `vault.bds`.

**To upgrade the previously extracted test code, without deleting/resetting Termux or W.NE:** download `BDS_Finance_Termux_L1_Android_fix.zip`, then run:

```sh
cd "$HOME/bds-finance-l1"
unzip -o "$HOME/storage/downloads/BDS_Finance_Termux_L1_Android_fix.zip"
python finance_local/vault.py init
```

The ZIP contains only `finance_local/` source, tests and README. It does not contain or overwrite the encrypted vault in `~/.bds-finance/`. After successful initialization you can run `demo-fill` and `summary` as described below. Passwords entered before the previous exception did not produce a completed encrypted file and will need to be entered again; never share them in chat. If `init` now reports that a vault already exists, **do not delete it**: inspect its status with the `status` command or ask for safe next steps. The updated isolated Linux test suite has 17 tests, including a fake `os.link`-unavailable Android regression test; real device acceptance is still pending.

## Installation / testing on your Samsung, without changing other projects

**Don't uninstall Termux or run a Termux reset.** Use your existing Termux installation and current package source. Verify [Termux package documentation](https://github.com/termux/termux-packages/blob/master/packages/python-cryptography/build.sh) first if a package is missing.

1. Install two packages in your existing Termux (when connected to the internet):

   ```sh
   pkg install python python-cryptography
   ```

   Termux distributes `python-cryptography` as a package; prefer this over forcing a potentially incompatible compiled `pip install cryptography` upgrade. Test it with:

   ```sh
   python -c 'from cryptography.hazmat.primitives.ciphers.aead import AESGCM; print("Crypto available")'
   ```

2. Obtain the approved L1 source **without running scripts from unknown websites**. Download the supplied `BDS_Finance_Termux_L1_demo.zip` from this ChatGPT conversation, or download `finance_local/vault.py` and `finance_local/README.md` from GitHub's unpublished development branch. The ZIP contains only readable Python source, tests and instructions. The Python script **does not install packages**, modify existing W.NE/Disclosure Desk files or require cloud credentials.

3. If you use the ZIP from Downloads, and Termux already has storage permission:

   ```sh
   pkg install unzip
   mkdir -p "$HOME/bds-finance-l1"
   cd "$HOME/bds-finance-l1"
   unzip "$HOME/storage/downloads/BDS_Finance_Termux_L1_demo.zip"
   ```

   If your Termux has **not** been granted access to Downloads, the path above won't work until you explicitly choose to grant access (`termux-setup-storage` asks for Android file permission). A more private alternative is downloading the source file directly into Termux `$HOME` from your authenticated GitHub account, or moving the ZIP using Android's file picker. Do not grant unnecessary filesystem permissions merely for this demo.

4. From the folder containing `finance_local`, create the encrypted **fictional-only** vault:

   ```sh
   python finance_local/vault.py init
   ```

   Enter a **new, unique passphrase at least 14 characters long**, then confirm. Characters are hidden, and no passphrase is saved in the code or shell history. **Do not use your actual bank password.** Store the passphrase independently; without it you cannot recover the encrypted file.

5. Add all ten fictional sample events, then view the demonstration totals:

   ```sh
   python finance_local/vault.py demo-fill
   python finance_local/vault.py summary --year 2026/27
   python finance_local/vault.py status
   ```

   Expected **invented** 2026/27 figures: gross income **£337.00**, refunds **£19.00**, fees **£28.50**, expenses **£12.00**, fictional profit **£277.50**. Estimated ads **£120.00** and an example bank payout **£175.00** are excluded from recognised income. A second `demo-fill` adds **0**, demonstrating no duplicate imports. UK tax-year boundaries are 6 April–5 April. **No Income Tax/NI liability is calculated.**

6. Test an encrypted backup to a **new** filename, and verify it without decrypting to disk:

   ```sh
   python finance_local/vault.py backup "$HOME/bds-finance-sample-backup.bds"
   python finance_local/vault.py verify-backup "$HOME/bds-finance-sample-backup.bds"
   ```

   Both commands prompt for the vault passphrase. Backup refuses overwriting an existing file, so use a different file name for subsequent backups. The backup is ciphertext only; copy it to an independent location (USB-C drive or encrypted cloud storage) **after** it has been verified. An on-phone backup alone is not safe against phone loss.

7. **Do not run `restore` in your existing vault**. It intentionally refuses replacing nonempty data. For a recovery drill on a clean test phone/home or isolated directory, use the tests below. User-friendly recovery to a new device is planned for L2/L7. Never delete a real Termux home or other files to test this.

## Optional source/security tests

From the folder containing `finance_local` (and with Python cryptography installed):

```sh
python -m unittest discover -s finance_local/tests -v
```

Tests use only fresh temporary directories; they do not touch your real `~/.bds-finance` directory. GitHub CI also runs these checks using disposable Linux test environments. Passing Linux GitHub tests **does not prove** installation or backup portability on your particular Android version.

## How encryption and file safety work

- AES-256-GCM authenticated encryption with a **new 96-bit nonce** and **new 128-bit salt** for each save; scrypt N=32768, r=8, p=1 derives the encryption key from the passphrase. The format version and encryption label are fixed. The encrypted container reveals the format and cipher size but not transaction contents. [PyCA AESGCM documentation](https://cryptography.io/en/latest/hazmat/primitives/aead/#cryptography.hazmat.primitives.ciphers.aead.AESGCM).
- The vault's default location is `~/.bds-finance/vault.bds` inside Termux's private `$HOME`. The directory is created `0700`, the file and lock are `0600`. Symbolic-link targets and unexpectedly permissive private-vault files are rejected. The command does not accept a public/external data-directory option.
- A process lock prevents concurrent writes. Updates use a fresh encrypted temporary file, fsync, then atomic replacement within private storage; a simulated interrupted save preserves the old vault. On **new** vault creation only, the writer first reserves the target exclusively using `os.open(..., O_EXCL)` before replacing its own empty reservation, avoiding unsupported Android `os.link`. An abrupt power loss between reserve and replace could leave a zero-byte placeholder that requires inspection before a safe retry. The backup writer uses exclusive create + fsync + readback and refuses overwriting existing files. Actual removable-storage durability varies by filesystem and Android providers.
- Backup and restore verify the authentication tag before proceeding. Restore is **refused if any file already exists** in the target directory. Only supplied **predefined synthetic records** can be added using the CLI. No input from real provider CSV files is accepted in this L1 build.
- The current Python process necessarily has the decrypted data and key in memory. Malware with access to the unlocked Android account/Termux process, root access, or a compromised phone is outside this proof's protection. Termux/Android backups may differ by OS; the tool does **not** yet implement device-bound keys, biometric lock, recovery key rotation, auto-lock/session policies or a security audit.
- Backups are encrypted, but **the filename and file size are visible**; a strong unique passphrase is essential. There is no forgotten-password recovery mechanism.

## Milestones still outstanding

- **L1 Android acceptance:** verify `python-cryptography` installed from Termux packages, vault operations, second-location encrypted backup, recovery on isolated test storage and no accidental plaintext files on your actual Samsung.
- **L2:** private, protected, mobile BDS-styled dashboard, preferably avoiding a local HTTP server until essential; no network/LAN exposure.
- **L3:** official Ko-fi/Play CSV importers with field/schema/version validation, trusted transaction identities and accountant-reviewed gross/net reporting. No imported real records until privacy review and backups pass.
- **L4–L6:** optional AdSense read-only OAuth, Play report sync and HMRC-aligned self-employment tax *estimates* using PAYE context; none are implemented yet.

**Release rule:** source resides only on `feature/sources-archives-next-batch-nov03` of `boydamo84-coder/disclosure-desk-preview`; do not deploy to Disclosure Desk's public website, Supabase, Netlify or Google Play. The prior F2 cloud SQL remains an unapplied alternative. See `MASTER_HANDOVER.md` and `docs/BDS_FINANCE_TERMUX_LOCAL_FIRST_2026-11-03.md` for continuity.
