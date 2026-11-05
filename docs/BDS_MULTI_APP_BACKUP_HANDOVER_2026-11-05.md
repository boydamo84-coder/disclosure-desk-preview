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
