# M71 — Release hygiene, accidental-deployment safeguards and GitHub branch review
Date: 19 November 2026 (Europe/London)
Status: STAGED AND AUTOMATED-QA GREEN; NO ADDITIONAL LIVE DEPLOY

## Verified M70 publication carried forward
- Official site: `https://uapdisclosuredesk.com`, published production ref `9fcaec4e602331b9a557937f6ee15ddd9a3f5ff2`.
- Exact Netlify `CONTEXT=production` public manifest verified at 129 files, SHA-256 `df9bf429fa2ef8d2c0cc0e0668a34d4c10f48ec55c0c9e040fbab4dac010c8ef`.
- Rollback `backup/production-pre-m70-curated-20261119` remains intact at `ca302b2e99a9321279bc711a817ad833cb041851`.

## Completed M71 source changes
- Branch `prep/m71-release-hygiene-20261119` from current production.
- `.github/workflows/production-netlify-public-smoke.yml`: explicitly sets `CONTEXT: production` to prevent false negatives caused by R3's intentionally removed test-only HTML and JS.
- `scripts/guard_official_deploy.cjs` + top-of-builder invocation: when `NETLIFY=true` and `CONTEXT=production`, block `BRANCH` missing or anything other than `production`. Local and private GitHub preview QA remain permitted. This is a second line of defence, **not an alternative to Netlify's project-level production-branch setting**.
- `scripts/test_m71_release_hygiene.cjs` validates static release locks, branch-guard contract, 129-file production (no R3 QA) vs 130-file preview (R3 QA preserved), no ballot assets, Adsterra OFF and controlled publisher origin.
- `.github/workflows/m71-release-hygiene-no-deploy.yml` runs independent production/preview jobs and a read-only public manifest comparison.
- **Both jobs green** on code `42fb921d2a7420b161cb74df0dbe854839907d91`: [GitHub Actions 44529590441](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44529590441).

## Manual GitHub/Netlify safeguards that remain open
On 19 November GitHub reported `protected:false` for both `production` and `main`. The current GitHub connector cannot edit branch rules or delete branch refs; the missing Netlify connector also prevents direct audit of its GUI settings.

GitHub [issue #14](https://github.com/boydamo84-coder/disclosure-desk-preview/issues/14) tracks: a protection ruleset for `production` preventing force pushes and deletion, PR review expectations without blocking a single-maintainer workflow, and a separate compatible `main` policy that preserves scheduled news collection. Confirm in Netlify Project configuration that the official production branch is `production`, publish path is `.release-staging/public-site`, and no obsolete branches/PR previews are configured to consume credits without approval. See [Netlify deployment documentation](https://docs.netlify.com/deploy/deploy-overview/).

## Branch cleanup decision
- 170 refs inventoried, including M71. **No branch deletions performed.**
- The four prior one-off M68/M69/BDS branches are diverged from production and retain independent work (M69: 50 commits ahead / 6 behind; BDS links: 9 ahead / 6 behind; Who M68 international: 40 ahead / 6 behind; Who M68 alternate world programmes: 37 ahead / 6 behind). Ahead counts measure divergence, not proof of readiness to delete.
- Do not delete M68 branches containing unfinished voting SQL, RLS tests, or distinct source-status UI without preserving specific independent work. Preserve `prep/who-m67-production-voting-integration-20261119` until later ballots are safely integrated.
- Old PR #1 is closed and superseded; no open PRs were returned by current search.
- Retire old branches only after an individualized unique-commit comparison, contents/backups, workflow dependency and owner acceptance. The connected GitHub tools have no branch-delete action and must never simulate deletion by resetting refs.
- The longer branch register is updated in `docs/GITHUB_BRANCH_RETIREMENT_2026-11-19.md`.

## Next substantial website release gate
1. Implement new approved site milestone on production-derived release branch.
2. Carry forward M71's release safety code and GitHub source-only checks.
3. Pass strict public bundle, synthetic private-account safety and actual Chromium tests.
4. Protect original live commit, then promote exact-green release; verify published manifest in `CONTEXT=production`.
5. Keep Who evidence ballots OFF, Adsterra OFF, W.NE private unless a separate validated feature release explicitly authorizes otherwise.

**No new production publish, APK, account data, Supabase migration, Cloud/Drive write, or advertising activation in M71.**
