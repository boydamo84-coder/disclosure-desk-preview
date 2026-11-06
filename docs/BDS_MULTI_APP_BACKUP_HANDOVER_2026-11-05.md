# Boyd Digital Studios — shared two-project backup preparation, 2026-11-05

**Scope:** Disaster-recovery infrastructure only; Disclosure Desk and Our Cinema remain independent applications, repositories and Supabase projects. **Status: destinations prepared + offline-runner tests passed; no live database backup or schedule activated.**

## Verified connected systems

- Google Drive owner identity independently verified: Boyd Digital Studios account.
- Existing **Disclosure Desk — Encrypted Backups** root folder: month/day path `Nov 2026 / 05 Nov 2026` is created.
- New **Our Cinema — Encrypted Backups** root folder: month/day path `Nov 2026 / 05 Nov 2026` is created.
- Both root folders are separate and reported private/not shared by the Drive connector. No customer database files uploaded.
- Disclosure Desk Supabase project: `omqxizswzcwgzqaczlhe`.
- Cinema Supabase project: `nsqmktjigdllkqhsuqmh`, identified by eight `public.cinema_*` tables with RLS. Read-only counts: 3 Supabase Auth accounts, 86 cinema_films rows, 1 cinema_profiles row, zero Storage buckets/objects. Avoid reading Cinema personal records as a backup test.

## New private-alpha software artifact

**Produced in conversation, NOT pushed to either public website repository**: `BDS-Dual-Encrypted-Backups-Private-Alpha.zip` (13 KB). Contains `backup.py`, unit tests, manual-only GitHub Actions workflow, offline-test workflow, README and .gitignore. Offline test suite **9/9 PASS**, and `--plan` emitted month/day paths for both projects without live network or credential access.

The runner plans one backup execution for **both** projects, independent results/explicit aggregate failure, `pg_dump` logical database exports of public/auth/storage schemas, separate actual Storage object download, age encryption, a per-archive integrity manifest, rclone upload to project-specific Drive folder IDs, and remote MD5 verification. Timestamps in filenames are UTC, month/day folders follow Europe/London. It deletes temporary plaintext and does not automatically delete older remote archives.

**Important implementation limits:**
1. **NO live encrypted backups have been created or restored.** The above is only offline code and Drive folder scaffolding. No project credentials have been installed. Real connection, permissions, dump compatibility, Storage object transfer, upload checks and actual restore must be verified before declaring reliable.
2. The current **website GitHub repository is PUBLIC**, so use a separate **PRIVATE** repository or equivalently secured runner for database connection strings, Storage service-role JWTs, Google OAuth config and other privileges; never commit sensitive values or backups to a public source tree.
3. User's ChatGPT Google Drive connection does not authorise unattended rclone. Set up rclone using a dedicated Google OAuth client (rclone's shared ID is being retired in 2026), storing its config in the private runner's secret store, not in website source.
4. Create an age recipient/public encryption key for the runner; keep the matching **private decryption identity OUTSIDE GitHub**, in a secure offline/recovery location.
5. GitHub Actions has no schedule in this alpha. Manual run comes first after credentials; then validate actual decrypt-and-restore into a disposable database. Only then enable hourly UTC scheduling in private repository default branch.
6. Full provider recovery also needs Supabase dashboard/API/Auth provider/SMTP/Edge settings separately; logical dumps are not full platform images. Storage object bytes are separate from Storage metadata. The live Disclosure Desk project has at least one real Storage object.
7. Daily email reports, immediate backup-failure email, retention cleanup, storage-quota alarms and archival restore drills remain **PLANNED, NOT BUILT**.
8. Monitor Github private Actions included minutes and Drive quota; hourly full snapshots of both databases could exceed a free allocation as activity grows. No automatic expiry yet, deliberately to avoid accidental data loss.

## Next steps
- Securely configure a dedicated private repo or trusted server with secrets, working PG17+ client, age and rclone. Do not ask owner to paste database passwords or service keys into chat.
- Run **one** manually triggered backup for both; verify both appear in the right date folders and independently verify decrypt and restore to disposable test instance.
- Add hourly scheduler only after green restoration proof; then daily health email and retention policies with test coverage.
- Do not activate Chat/Discussions or publish the combined site solely because a backup ZIP was built.

Links (folder names only, no access tokens):
- [Disclosure Desk backup root](https://drive.google.com/drive/folders/1Zg5BO8z5gZAG1CrNJgiVmeiHa5LNjyrw)
- [Our Cinema backup root](https://drive.google.com/drive/folders/1LxCBzH18ps64Rd8NYsFAoCP1ZFsOLXsl)

## Confirmed private repository setup — 5 Nov 2026 18:36 UTC

- **SUCCESS:** New repo [`boydamo84-coder/bds-private-backups`](https://github.com/boydamo84-coder/bds-private-backups) is confirmed **PRIVATE**. Linked GitHub connector permissions were granted by owner; default branch `main` verified.
- Uploaded private-alpha package as text source (no secrets): `backup.py`, 9 offline tests, separate read-only CI workflow and manual-only live runner workflow. Commit `c5985cfaeabaa2b06e73a2977b0b83a2e391acc5`.
- **PASS:** [GitHub Actions offline run 42085810822](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42085810822), `Ran 9 tests in 0.009s`, `OK`, correct independent UK folder targets for both projects.
- Confirmed `.github/workflows/run-encrypted-backups.yml` uses **`workflow_dispatch` only, no `schedule:` event**. That privileged workflow has NOT been executed; no secrets configured through connector. No DB snapshot, Storage bytes, Drive encrypted archive or restore tested.
- GitHub Actions warned old checkout/setup-python actions are being run under Node 24 (nonblocking; consider future update). This is not a blocker for the offline tests.

**Next:** Owner sets secrets directly in private GitHub [Actions secrets settings](https://github.com/boydamo84-coder/bds-private-backups/settings/secrets/actions); obtain session-pooler DB connection strings for both Supabase projects, legacy service-role keys for actual Storage object download, age public recipient and **offline-held private identity**, and a dedicated rclone OAuth config for `boyddigitalstudios@gmail.com`. Never request/print secrets in chat. Run first manual backup only once ready, then restore tests. Hourly schedule, daily email and retention remain disabled until recovery acceptance.

## 5 November evening: the private repository is now online and CI verified

- **GitHub**: `boydamo84-coder/bds-private-backups`, independently confirmed **PRIVATE**; `main` SHA `c5985cfaeabaa2b06e73a2977b0b83a2e391acc5`.
- Real source files present: `backup.py`, `tests/test_backup.py`, `.github/workflows/test-backup-plan.yml`, `.github/workflows/run-encrypted-backups.yml` and `.gitignore`.
- [Offline GitHub Actions run 42085810822](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42085810822) **SUCCESS**; no credentials or live database involved. No schedule event in backup workflow.
- Independently listed both Drive `05 Nov 2026` folders and found **zero** files; no manual workflow backup runs observed. **Do not claim backup protection is active.**
- Next: secure secret provisioning, Google OAuth for unattended `rclone` (different from ChatGPT Drive connection), privately generated age identity/public recipient, first manual end-to-end and isolated restore, then schedule and notifications.

## Follow-up: private GitHub installation verified (5 Nov 2026)

- The intended dedicated **PRIVATE** repository `boydamo84-coder/bds-private-backups` now exists and is available to the connected GitHub account. Do **not** ask the owner to create or connect it again.
- Installed the source code and test workflows in `main` commit `d1e9f11078f1d9f04f8e42239b888027134a6944`; offline Actions run [42122357915](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42122357915) was **SUCCESS**. Credentials are never printed, and encryption subprocess is passed only allowlisted environment variables.
- The manual backup workflow contains 8 secret **references**, not secret values; **hourly schedule is OFF**, no database connection or Google Drive upload attempted by this CI. See [private README](https://github.com/boydamo84-coder/bds-private-backups/blob/main/README.md) for operator setup.
- Next is secure age key, rclone authorisation and GitHub repository secrets, followed by one *manual* authenticated backup plus disposable restore. No claim of actual backups until that passes.

## CI runtime maintenance
GitHub Actions upgraded to Node24-compatible `checkout@v5` and `setup-python@v6` in private runner main commit `9047566693a3ca2a8afa33f261ff37968c9bb1bf`; [latest offline test run 42122701995](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42122701995) **SUCCESS**. No schedule or live backup. 


## 5 November late-night duplicate-work check and recovery-auditor advance (NO LIVE BACKUP)

- **Do not repeat already-proven narrower backups:** Previous user-accepted manual **Disclosure Desk Boards backup/email restore** and independent **Our Cinema database export/integrity/recovery checks** are useful evidence, but they are not the planned joint hourly encrypted full Supabase database + actual Storage object archive.
- **Observed infrastructure state, not assumptions:** Private `boydamo84-coder/bds-private-backups` default `main` contained only previously passing offline `push` runs; no actual `workflow_dispatch` backup execution, no hourly `schedule`. The Drive root folder IDs above each contain the existing `Nov 2026/05 Nov 2026` hierarchy, and the last inspected daily folders contained **zero encrypted archive files**. Do not claim protection is active.
- **New (nonduplicative) offline restore-safety tooling:** `verify_archive.py` and `tests/test_verify_archive.py` on the private repo `main`. The tool verifies the decrypted tar manifest, project identity, exact database dump hash and size, individual Storage object hashes/sizes, and refuses missing/extra/unsafe tar paths or symlinks without extracting their contents. On a trusted device, it may decrypt a downloaded encrypted `.tar.age` using an **offline-kept** private age identity inside a temporary local folder that is removed automatically; the identity is not to be stored in GitHub or chat. It is explicitly **not** a PostgreSQL restore or proof the Auth schema/functions and Storage downloads are restorable.
- **Tests:** Original 9 safe backup tests + 10 archive/manifest/corruption tests = **19/19** [private run 42132230257](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42132230257), then two additional **real age encryption/decryption tests on purely synthetic data** (positive round-trip and wrong identity rejection) = **21/21** [private run 42132460842](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42132460842) SUCCESS. Source commits `47f63b54f540a3071f5a0554b17a23e246b1840d`, `7f27757cf18e8d2b42f73f1d0e14e6ff71c5919c`.
- **Still the exact release gate:** Owner securely creates age private/public identity (private kept offline), an independently authorised rclone Drive config, and eight GitHub Actions secrets in the private repo; then one manual full encrypted snapshot for each Supabase project plus download, real decryption, archive verification, **restoration into disposable DB and Storage test environment**, Auth/RLS and object validation. Only after that enable hourly scheduling and real failure/success email monitoring. No secret values are available via ChatGPT connectors; never ask for passwords, keys, or OAuth token files in chat. No production or user data touched by this milestone.


## 5–6 November: real synthetic PostgreSQL restore and safe secret presence checker (NO CUSTOMER DATA)

**Verified 5 Nov:** private repo `boydamo84-coder/bds-private-backups`, synthetic source `tests/restore_drill.py` and GitHub-only workflow `.github/workflows/test-restore-drill.yml`. [Run **42133326035**](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42133326035) SUCCESS. For **both app-specific archive labels** the workflow used actual PostgreSQL **17** to dump a fictional DB with two Auth identities, RLS-owned Board and Storage metadata; packaged synthetic object bytes into an archive; genuinely encrypted/decrypted with disposable `age` key; verified hashes and recovered into an independent disposable database via **`pg_restore`**. Confirmed two Auth rows, one Board, one Storage metadata record, matching separately recovered Storage file bytes, and restored row-level isolation A=1 own board; B=0; guest=0. The first CI attempt 42133220586 failed only because of the Python module path, then was corrected and green in the final run.

**Provider limitation:** This is NOT a Supabase-managed production restore. The backup runner's `pg_dump --no-owner --no-privileges` does **not** include PostgreSQL global roles, memberships or GRANTs; the synthetic drill prepared its own roles and explicit GRANTs. Any actual recovery needs the appropriate Supabase configuration and policy/role reconstruction, Auth & Storage managed-schema compatibility review, Edge Functions/secrets and operational settings. Never apply a recovered dump to an existing Disclosure Desk or Cinema database.

**Verified 6 Nov:** a separate **manual only** `check-backup-secrets-presence.yml` workflow was added to the PRIVATE repo. It maps the eight approved GitHub secret names to the private runner, reports only how many are nonblank and which names are missing, and does not display values, contact any service, trigger a backup or enable a schedule. Four fake-secret canary regression tests passed, now private offline suite **25/25**, [run **42133887321** SUCCESS](https://github.com/boydamo84-coder/bds-private-backups/actions/runs/42133887321). Code `secret_preflight.py`, commit `bd200eced07dc7cdf034c1beaecf506582948b45`; private README updated at `8ff6026d6ff21353cba399ecf1fa986a467d31b0`.

**Current precise blocker:** The two month/day Drive folders have not received a verified real encrypted archive, and no actual manual full backup or recovery run has occurred. The user must securely supply/configure all eight secret values through [private GitHub Actions secrets](https://github.com/boydamo84-coder/bds-private-backups/settings/secrets/actions), never chat; private age identity remains locally held OFF GitHub. Use manual settings-presence workflow *after* adding them, then separately run one real dual-project backup, independently download/verify both encrypted files, and perform real disposable restore before turning on hourly scheduling and email notifications. A successful synthetic restore or 8/8 configured settings is not evidence of protected real data.
