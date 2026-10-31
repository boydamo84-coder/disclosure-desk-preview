# Post-01:30 release integration audit — 31 October 2026

Base: live `production` in this repository, not the different `disclosure-desk` repository.

## Confirmed differences
- `main/index.html` has new video progress, resume and email-backup UI paths absent from production.
- `production/index.html` contains the live `adsbygoogle` integration that `main/index.html` lacks. Both contain AdSense ownership metadata and cloud boards script references. Never replace the entire production HTML with main without restoring and validating live ad placement and account flows.
- `cloud-boards.js` differs between main and production and must be integrated with corresponding UI changes and Supabase RLS dependencies.
- `data/disclosure-clips.json` has 676 records in main vs 648 in production; 28 additional clips remain unverified and are excluded from this release until reviewed.
- `privacy.html` differs; reconcile privacy statements before any publish.
- Prior production rollback snapshot remains available in `backup/production-pre-investigator-release-2026-10-31`.

## Required implementation gates
- [ ] Merge account-separated local boards, recovery, comparisons and three onboarding tours without losing production authentication, AdSense or existing routes.
- [ ] Merge video watched/skipped/resume controls with account-specific video storage and Supabase video-progress RLS; do not deploy UI until required backend migration is deployed and checked.
- [ ] Integrate email backup only if its Edge Function is deployed and read-only RLS/security audits pass.
- [ ] Preserve existing approved 648-video catalogue; independently review newer clips.
- [ ] Run static checks, mobile/desktop browser smoke checks and targeted account/backup/video regressions against the integrated candidate.
- [ ] Merge candidate into this repository's `production` once approved; Netlify is linked to **this** repository, not `disclosure-desk`.
- [ ] Verify Netlify's deployment commit and the live domain afterward.

This is a reconciliation checkpoint, not an approval to publish.
