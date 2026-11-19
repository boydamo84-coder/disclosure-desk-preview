# disclosure-desk-preview

## Development handovers — start here

- **[LATEST: LIVE Congress hearings, Witness Reports, Community Rules, voting, profiles and release blockers](docs/DISCLOSURE_DESK_LIVE_COMMUNITY_HANDOVER_2026-11-03.md)** — read before making changes in a new chat.
- [W.NE Research Edition integration, 10-tab navigation, save-before-leave and Google indexing](docs/WNE_BETA_AND_SEARCH_INDEXING_HANDOVER_2026-11-03.md).

**Release status (3 November 2026):** Work is staged on `feature/research-studio-bds-production-based` in draft [PR #2](https://github.com/boydamo84-coder/disclosure-desk-preview/pull/2) targeting `production`. It is **not merged**. The current Netlify Deploy Preview #2 predates the newer community, witness, LIVE and unified navigation changes. Database witness/chat migrations and the new witness submission function have **not** been deployed. Keep Netlify costs down; perform GitHub-only checks and correct security blockers before one approved staging release. This is the production-based website repo; do not deploy its old `main` branch.

## Production release and GitHub branch safety (19 November 2026)

Use `production` for the official Netlify website, `main` for the separate collector/preview track. The verified combined M70 website candidate is `release/website-m70-curated-20261119`, with pre-release rollback `backup/production-pre-m70-curated-20261119`. Do not publish old `prep/`, `fix/` or `feature/` snapshots. The reviewed public builder `node scripts/build_public_release.cjs` is the ONLY allowed site bundle path and rejects unapproved M67 Who ballot runtime, SQL/private docs, and active Adsterra. The GitHub branch inventory and retirement safeguards are in `docs/GITHUB_BRANCH_RETIREMENT_2026-11-19.md`.
