# Disclosure Desk — GitHub branch retirement and release controls
Date: 19 November 2026 · M70 curated website release

## Rules
- Official Netlify website release source: **production** only. GitHub default **main** remains the independent news/indexing automation and GitHub Pages preview track; NEVER merge or reset it to publish the live Netlify site.
- **DO NOT DEPLOY ANY OLD prep/, fix/, feature/, queue/, android/ or release/ branch directly.** Promotion must come from a reviewed production-based curated candidate with exact-head QA and a preserved pre-release backup branch.
- **DO NOT DELETE** `production`, `main`, any `backup/` branch, the M96M/M96L device versions, active experiments listed below, or a branch used by an open PR/automation.
- Candidate `release/website-m70-curated-20261119` copied only M68 read-only research (no ballots), M69 Profile-local login and BDS links from approved staging. Strict bundle rejects Who ballot files, private SQL/docs, and an enabled Adsterra tag.
- Nov 1 draft PR #1 was closed as superseded without merging on 19 November 2026. It does not belong in the release queue.
- **No branch deletion has been performed:** the connected GitHub tools can create/read/update refs and files, but do not expose a branch-deletion action. Older branches are quarantined by policy and by the strict publication allowlist; cleanup/deletion should be performed separately in GitHub after a branch-by-branch diff and dependency/automation review. Do not force-move or overwrite historical refs to simulate deletion.

## Safe branch-retirement sequence
1. Verify Netlify **Published** deployment is the M70 production tree and smoke tests pass, keep `backup/production-pre-m70-curated-20261119` for rollback.
2. Only then mark M68/M69/BDS one-off staging branches safe to delete. Do not delete active Android M96M or the planned voting/privacy work.
3. Check each historical branch for open PRs, unique commits, GitHub Actions push/schedule triggers, and files not already in verified production; preserve exceptional work in dedicated backup branches before any manual deletion.
4. On GitHub, use **Branches → branch row → Delete branch** for individually cleared branches; never bulk-remove unreviewed branches.

## Inventory (169 branches)
- REVIEW — historical, no release authority: **149**
- KEEP — active/protected: **11**
- PROTECT — rollback: **5**
- HOLD — superseded after live M70 smoke: **4**

| Disposition | Existing branch |
| --- | --- |
| REVIEW — historical, no release authority | `android/full-experience-m10-r2-nov14` |
| REVIEW — historical, no release authority | `android/full-experience-m11-r2-nov14` |
| REVIEW — historical, no release authority | `android/live-site-polish-oct31` |
| REVIEW — historical, no release authority | `android/m12-2-profile-scroll-return-nov14` |
| REVIEW — historical, no release authority | `android/m12-3-research-return-nov14` |
| REVIEW — historical, no release authority | `android/m12-who-is-who-navigation-directory-nov14` |
| REVIEW — historical, no release authority | `android/m75-private-beta-integration-nov11` |
| REVIEW — historical, no release authority | `android/m77-alert-settings-chat-nested-replies-nov11` |
| REVIEW — historical, no release authority | `android/m78-profile-notification-settings-nov11` |
| REVIEW — historical, no release authority | `android/m79-keyboard-comment-scroll-nov11` |
| REVIEW — historical, no release authority | `android/m81-native-research-inbox-nov11` |
| REVIEW — historical, no release authority | `android/m82-inbox-dialog-list-fix-nov11` |
| REVIEW — historical, no release authority | `android/m83-research-inbox-shortcuts-nov11` |
| REVIEW — historical, no release authority | `android/m84-inbox-row-labels-nov11` |
| REVIEW — historical, no release authority | `android/m85-research-inbox-rename-nov11` |
| REVIEW — historical, no release authority | `android/m91-research-inbox-polish-nov12` |
| REVIEW — historical, no release authority | `android/m92-web-parity-native-desk-nov13` |
| REVIEW — historical, no release authority | `android/m93-compact-native-header-nov13` |
| REVIEW — historical, no release authority | `android/m94-native-navigation-news-nov13` |
| KEEP — active/protected | `android/m95-restore-editorial-layout-nov13` |
| REVIEW — historical, no release authority | `android/m96-account-safe-notifications-nov19` |
| REVIEW — historical, no release authority | `android/m96k-chat-keyboard-reveal-nov19` |
| KEEP — active/protected | `android/m96l-profile-auth-stay-nov19` |
| KEEP — active/protected | `android/m96m-bds-official-link-nov19` |
| REVIEW — historical, no release authority | `android/play-internal-candidate-oct31` |
| REVIEW — historical, no release authority | `android/playstore-community-20261108` |
| REVIEW — historical, no release authority | `audit/adsense-low-value-recovery-nov13` |
| PROTECT — rollback | `backup/production-pre-analytics-removal-20261119` |
| PROTECT — rollback | `backup/production-pre-investigator-release-2026-10-31` |
| PROTECT — rollback | `backup/production-pre-m70-curated-20261119` |
| PROTECT — rollback | `backup/production-pre-r3-beta-2026-11-15` |
| PROTECT — rollback | `backup/production-pre-source-first-rc1-20261118` |
| KEEP — active/protected | `bds-backup-oauth-pages` |
| REVIEW — historical, no release authority | `dev/mobile-video-performance-oct31` |
| REVIEW — historical, no release authority | `development/global-archive-100k` |
| REVIEW — historical, no release authority | `feature/clean-video-layout-a-oct31` |
| REVIEW — historical, no release authority | `feature/desktop-layout-complete-tour-oct31` |
| REVIEW — historical, no release authority | `feature/editor-tab-prelaunch` |
| REVIEW — historical, no release authority | `feature/landscape-clean-video-oct31` |
| REVIEW — historical, no release authority | `feature/minimal-youtube-controls-oct31` |
| REVIEW — historical, no release authority | `feature/persistent-video-audio-oct31` |
| REVIEW — historical, no release authority | `feature/research-studio-bds-production-based` |
| REVIEW — historical, no release authority | `feature/research-studio-beta-nav` |
| REVIEW — historical, no release authority | `feature/research-studio-beta-tab-bds` |
| REVIEW — historical, no release authority | `feature/sources-archives-next-batch-nov03` |
| REVIEW — historical, no release authority | `feature/video-details-on-pause-oct31` |
| REVIEW — historical, no release authority | `feature/who-evidence-score-framework-20261115` |
| REVIEW — historical, no release authority | `fix/account-scoped-video-favourites-oct31` |
| REVIEW — historical, no release authority | `fix/compact-writing-popover-mobile-desktop-nov08` |
| REVIEW — historical, no release authority | `fix/fullscreen-save-feedback-oct31` |
| REVIEW — historical, no release authority | `fix/iphone-avatar-jpeg-fallback-nov08` |
| REVIEW — historical, no release authority | `fix/m54-docx-comparison-table-layout-nov10` |
| REVIEW — historical, no release authority | `fix/m55-live-news-archive-loading-nov10` |
| REVIEW — historical, no release authority | `fix/m56-refresh-keeps-active-page-nov10` |
| REVIEW — historical, no release authority | `fix/m57-wne-return-directly-to-document-nov10` |
| REVIEW — historical, no release authority | `fix/m58-drive-reconnect-ux-nov10` |
| REVIEW — historical, no release authority | `fix/m59-news-duplicate-headlines-nov10` |
| REVIEW — historical, no release authority | `fix/m60-news-event-clusters-nov10` |
| REVIEW — historical, no release authority | `fix/m61-discussions-favourites-inline-comments-nov10` |
| REVIEW — historical, no release authority | `fix/m62-google-indexing-guide-alignment-nov10` |
| REVIEW — historical, no release authority | `fix/m63-profile-received-reactions-nov10` |
| REVIEW — historical, no release authority | `fix/m64-release-review-compact-profile-nov10` |
| REVIEW — historical, no release authority | `fix/m66-profile-identity-settings-order-nov10` |
| REVIEW — historical, no release authority | `fix/m67-archive-shared-action-rails-nov10` |
| REVIEW — historical, no release authority | `fix/m68-compact-comment-threads-nov10` |
| REVIEW — historical, no release authority | `fix/m70-unified-site-action-rails-nov10` |
| REVIEW — historical, no release authority | `fix/m71-interaction-page-audit-nov10` |
| REVIEW — historical, no release authority | `fix/m73-comment-owner-actions-parity-nov10` |
| REVIEW — historical, no release authority | `fix/m74-branded-delete-confirmations-nov11` |
| REVIEW — historical, no release authority | `fix/m80-web-mobile-reply-parity-nov11` |
| REVIEW — historical, no release authority | `fix/m86-sitewide-comments-on-demand-nov11` |
| REVIEW — historical, no release authority | `fix/m87-news-reply-indent-nov11` |
| REVIEW — historical, no release authority | `fix/m87-terms-of-service-nov11` |
| REVIEW — historical, no release authority | `fix/m88-consolidated-news-replies-terms-nov11` |
| REVIEW — historical, no release authority | `fix/m89-discussions-popular-feed-nov11` |
| REVIEW — historical, no release authority | `fix/m90-discussions-feed-sections-tabs-nov12` |
| REVIEW — historical, no release authority | `fix/m91-archive-case-back-nov12` |
| REVIEW — historical, no release authority | `fix/m96-favicon-legacy-fallback-nov13` |
| REVIEW — historical, no release authority | `fix/post-m50-action-rails-citations-nov10` |
| REVIEW — historical, no release authority | `fix/research-mobile-profile-polish-nov08` |
| REVIEW — historical, no release authority | `fix/safari-avatar-fallback-20261108` |
| REVIEW — historical, no release authority | `fix/short-board-label-oct31` |
| REVIEW — historical, no release authority | `fix/signup-public-username-auto-avatar-save-nov08` |
| REVIEW — historical, no release authority | `fix/video-card-duplicate-source-link-oct31` |
| REVIEW — historical, no release authority | `fix/video-card-more-menu-oct31` |
| REVIEW — historical, no release authority | `fix/video-card-play-compact-actions-oct31` |
| REVIEW — historical, no release authority | `hotfix/chat-stability-request-feedback-20261108` |
| KEEP — active/protected | `main` |
| REVIEW — historical, no release authority | `planning/play-store-readiness-20261108` |
| HOLD — superseded after live M70 smoke | `prep/bds-official-domain-link-nov19` |
| REVIEW — historical, no release authority | `prep/community-research-m01-publisher-preview-20261118` |
| REVIEW — historical, no release authority | `prep/community-research-m02-rls-private-drafts-20261118` |
| REVIEW — historical, no release authority | `prep/community-research-m03-consent-publish-20261118` |
| REVIEW — historical, no release authority | `prep/community-research-m04-my-research-recovery-20261118` |
| REVIEW — historical, no release authority | `prep/community-research-m05-private-pagination-qa-20261118` |
| REVIEW — historical, no release authority | `prep/community-research-m06-existing-supabase-locked-20261118` |
| KEEP — active/protected | `prep/community-research-m07-two-account-pilot-20261118` |
| HOLD — superseded after live M70 smoke | `prep/m69-profile-auth-stay-20261119` |
| REVIEW — historical, no release authority | `prep/site-ads-m01-layout-20261118` |
| REVIEW — historical, no release authority | `prep/site-ads-m02-adsterra-consent-20261118` |
| REVIEW — historical, no release authority | `prep/site-ads-m03-remove-ga4-20261118` |
| KEEP — active/protected | `prep/site-ads-m04-direct-banner-local-test-20261119` |
| REVIEW — historical, no release authority | `prep/source-m40-public-outreach-register-20261118` |
| REVIEW — historical, no release authority | `prep/videos-catalogue-refresh-20261118` |
| REVIEW — historical, no release authority | `prep/who-editorial-m29-readiness-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m28-hearing-crosschecks-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m28b-original-sources-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m28c-testimony-lineage-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m28d-broadcaster-provenance-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m28e-final-seven-source-audits-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m29-editorial-gates-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-m29-editorial-handoff-20261116` |
| REVIEW — historical, no release authority | `prep/who-evidence-readonly-m26-20261115` |
| REVIEW — historical, no release authority | `prep/who-evidence-readonly-m27-20261116` |
| REVIEW — historical, no release authority | `prep/who-m30-editorial-provenance-20261116` |
| REVIEW — historical, no release authority | `prep/who-m31-original-testimony-audit-20261116` |
| REVIEW — historical, no release authority | `prep/who-m32-immaculate-source-separation-20261116` |
| REVIEW — historical, no release authority | `prep/who-m33-navy-source-originals-20261116` |
| REVIEW — historical, no release authority | `prep/who-m34-source-provenance-20261116` |
| REVIEW — historical, no release authority | `prep/who-m35-source-version-reconciliation-20261116` |
| REVIEW — historical, no release authority | `prep/who-m36-navair-foia-release-provenance-20261116` |
| REVIEW — historical, no release authority | `prep/who-m37-osd-referral-disambiguation-20261116` |
| REVIEW — historical, no release authority | `prep/who-m38-151-page-cross-case-audit-20261116` |
| REVIEW — historical, no release authority | `prep/who-m39-source-verification-tracker-20261117` |
| REVIEW — historical, no release authority | `prep/who-m40-policy-evidence-worklist-20261117` |
| REVIEW — historical, no release authority | `prep/who-m41-complete-directory-source-pass-20261117` |
| REVIEW — historical, no release authority | `prep/who-m42-original-broadcast-links-20261117` |
| REVIEW — historical, no release authority | `prep/who-m43-council-bluffs-sample-records-20261117` |
| REVIEW — historical, no release authority | `prep/who-m44-aawsap-transfer-records-20261117` |
| REVIEW — historical, no release authority | `prep/who-m45-im1-spherule-evidence-20261117` |
| REVIEW — historical, no release authority | `prep/who-m46-grusch-whistleblower-record-20261117` |
| REVIEW — historical, no release authority | `prep/who-m47-navy-aircrew-records-20261117` |
| REVIEW — historical, no release authority | `prep/who-m48-omaha-and-nimitz-analysis-20261117` |
| REVIEW — historical, no release authority | `prep/who-m49-rendlesham-records-20261117` |
| REVIEW — historical, no release authority | `prep/who-m50-complete-evidence-summary-links-20261117` |
| REVIEW — historical, no release authority | `prep/who-m51-source-access-provenance-20261117` |
| REVIEW — historical, no release authority | `prep/who-m52-source-lineage-reader-20261117` |
| REVIEW — historical, no release authority | `prep/who-m53-source-return-case-lineage-20261117` |
| REVIEW — historical, no release authority | `prep/who-m54-archive-context-back-20261117` |
| REVIEW — historical, no release authority | `prep/who-m55-site-flow-and-android-test-kit-20261117` |
| REVIEW — historical, no release authority | `prep/who-m56-fravor-claim-review-draft-20261117` |
| REVIEW — historical, no release authority | `prep/who-m57-source-first-community-policy-20261117` |
| REVIEW — historical, no release authority | `prep/who-m58-kirkpatrick-statement-comparisons-20261117` |
| REVIEW — historical, no release authority | `prep/who-m59-kirkpatrick-directory-and-source-matrix-20261117` |
| REVIEW — historical, no release authority | `prep/who-m60-next-six-profile-research-20261117` |
| REVIEW — historical, no release authority | `prep/who-m61-community-form-browser-qa-20261117` |
| REVIEW — historical, no release authority | `prep/who-m62-retire-legacy-ratings-source-first-20261118` |
| REVIEW — historical, no release authority | `prep/who-m63-secure-five-criteria-ballots-20261118` |
| REVIEW — historical, no release authority | `prep/who-m64-claim-ballot-integration-20261118` |
| REVIEW — historical, no release authority | `prep/who-m65-aggregate-publication-20261118` |
| REVIEW — historical, no release authority | `prep/who-m66-withdrawal-lifecycle-20261118` |
| KEEP — active/protected | `prep/who-m67-production-voting-integration-20261119` |
| HOLD — superseded after live M70 smoke | `prep/who-m68-international-programmes-in-whoswho-20261119` |
| HOLD — superseded after live M70 smoke | `prep/who-m68-world-programme-directory-20261119` |
| KEEP — active/protected | `production` |
| REVIEW — historical, no release authority | `queue/dd-web-r2-evidence-intelligence` |
| REVIEW — historical, no release authority | `queue/dd-web-r3-from-r2-nov14` |
| REVIEW — historical, no release authority | `queue/dd-web-r3-hypothesis-discovery` |
| KEEP — active/protected | `queue/dd-web-r4-living-research` |
| REVIEW — historical, no release authority | `release/dd-web-r2-integration-nov14` |
| REVIEW — historical, no release authority | `release/disclosure-desk-nov01-batch` |
| REVIEW — historical, no release authority | `release/post-0130-tested-features-2026-10-31` |
| REVIEW — historical, no release authority | `release/production-integrated-nov01` |
| REVIEW — historical, no release authority | `release/public-website-beta14-2026-11-08` |
| REVIEW — historical, no release authority | `release/research-source-first-rc1-20261118` |
| REVIEW — historical, no release authority | `release/signup-auto-public-chat-avatar-fixes-20261108` |
| REVIEW — historical, no release authority | `release/social-chat-discussions-avatar-20261108` |
| KEEP — active/protected | `release/website-m70-curated-20261119` |
| REVIEW — historical, no release authority | `staging/research-samsung-m16-20261108` |

## Publication checkpoint — 19 November 2026

M70 published and independently verified using the exact production-context manifest, [Actions 44526225170](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44526225170). The four source-stage branches tagged `HOLD — superseded after live M70 smoke` can now be **reviewed for manual retirement** after checking unique commits and retaining future voting work in `prep/who-m67-production-voting-integration-20261119`. Do not delete them automatically. Current live and rollback source refs remain protected.

GitHub connector still lacks delete-ref functionality; no old branches were destroyed. The obsolete Nov 1 PR #1 was closed. Preserve `main` automation and `production` as the sole official website release branch.
