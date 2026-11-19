# Disclosure Desk M70 curated website release — 19 November 2026

**Candidate branch:** `release/website-m70-curated-20261119`
**Base production and rollback:** `ca302b2e99a9321279bc711a817ad833cb041851`; `backup/production-pre-m70-curated-20261119`
**Scope:** Existing site retained; only 11 app/build-source files brought forward (M69 Profile-local login and CSS, M68 read-only Who international directory and outreach tracker with scripts, new official studio About/footer links and static switches). Three M68 assets added by explicit public allowlist. `assets/people-directory.js` remains baseline; unfinished M67 ballot data/id hook and SQL excluded.
**Locks:** `whoEvidenceBallots:false` (no voting script, CSS, registry or backend migrations included in public bundle); Adsterra `RELEASE_ENABLED=false` enforced by build script and release QA. No Google Drive, W.NE, Supabase schema, live users or APK changes.
**Source checks:** M69 signed-in synthetic Profile and password reset; M68 23 source-backed international institutions including Vatican plus 13 distinct unverified countries and 5 source-enquiry statuses; native privacy and strict 130-file bundle; M70 branded links; full browser mobile layouts (320/393/820/1280) and old navigation regressions.
**No-deploy CI:** [M70 run 44523103696](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44523103696), both source/package and real Chromium jobs green at code+test SHA `b2c38147b4914513deb51220015df4a36d9cc397`.
**Accidental release prevention:** Do not merge old PR #1 (closed/superseded), `main`, M67/M64 experimental ballots or Adsterra direct-tag experimental branches. Publish by fast-forwarding `production` to this exact green release tree or newer docs-only exact-head QA. Production smoke workflow checks the live Netlify release-manifest hash and key HTML routes after the production push.
**User approval:** Owner asked on 19 November 2026 to combine and publish completed website features, and to safely clean obsolete stages/branches.
**Rollback:** Existing pre-M70 production branch preserved. If Netlify release fails, verify Published deploy in Netlify and restore prior known-good deployment; do not overwrite later commits without checking origin.
**Branch cleanup:** See `docs/GITHUB_BRANCH_RETIREMENT_2026-11-19.md`. No historical branch deletion in this operation.
