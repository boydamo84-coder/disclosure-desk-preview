# Milestone 33 — Website-only consolidated release candidate (9 Nov 2026)

## Owner decision and budget
- Owner has **198 Netlify credits remaining** (owner-provided figure, not independently verified) and explicitly requests **one consolidated website production deploy**, then Samsung Chrome testing on live website.
- The privately installable W.NE Android APK is **PAUSED**. Do not use an APK regression alone to claim the currently published website is broken. APK auto-build-on-push was disabled; its workflow remains manual dispatch only.
- Correct source repo: `boydamo84-coder/disclosure-desk-preview`; development: `fix/compact-writing-popover-mobile-desktop-nov08`; deploy target: `production`. GitHub Pages `main` must remain untouched. No Netlify preview PR or incremental deploys should be opened merely for visual inspection.

## Verified browser regression repair
- The newer full-Writer Chromium acceptance exposed a **real timing dependence**: `setStyle()` called `window.wneEditorViewScale()` before the later view-controls script installed it. First actual simulated cloud-document boot failed closed and disabled editing. Development `research/wne.html` now uses the normal `1` viewing scale until the helper is available; actual later slider retains its existing behavior. Legacy Python-server text was removed from the hosted cloud API network/JSON errors.
- Full Writer test is a **website-source browser test** (synthetic Supabase, strictly no real cloud or customer data), regardless of its M32 legacy filename. It tests visible File/Home/Insert/Review/View, an actual safely opened test document, keyboard dismissal of the File overlay, and confirmed revision-backed synthetic save. The code-leak/raw-JS symptom seen in the separately built APK is checked against the full HTML. The test first failed because a menu overlay legitimately intercepted a click; it now closes the File dropdown with Escape before selecting Home.
- **Verified no-deploy GitHub Actions run:** [42550599856](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42550599856), development code SHA `4d978acf13e51a7a97b76711d5b6969c287b7b12`: **all three jobs SUCCESS** (source/contracts, real offline Chromium, isolated disposable PostgreSQL). Existing page-route, comments, Chat, RLS contracts, GA4 consent, Research recovery and public-release packaging gates remain included.
- These are synthetic/offline browser and CI checks; no physical Samsung acceptance or live Netlify delivery is claimed.

## Bundled website scope already implemented on development branch
1. **Public community/comments:** compact like/dislike and right-hand flag placement on News and case-linked comments including Videos/Hearings; existing Chat and Discussions remain, with signed-in admin account-switch regressions.
2. **W.NE Research Studio:** first-document launch fix, simplified My Documents/New/Open/Import DOCX/Download DOCX Home, File/Home/Insert/Review/View menu, safe cloud-save-before-navigation, restore copy/ZIP and archive safety, mobile editing/review and Library fixes.
3. **Public site and guest UX:** page-by-page desktop/mobile/landscape link/nav audit (M28), additional user-flow controls, external sources directory and guidance, account/profile photo/community presentation.
4. **Google Analytics 4:** `G-ZWJQMK8JSW` on public informational pages **only after opt-in**; no private document/account/message tracking. Privacy text and consent settings included. GA4 should be verified in Google Analytics Realtime after deployment and owner opt-in; a source presence check is not proof of live data.
5. **Profile account deletion:** the clear **Delete my account → Request account deletion** support-mail workflow is present. **NOT self-service deletion.** Server-side write fences, destructive database workflow, real backup restore and safe account-transfer tests are incomplete. Draft SQL/Edge code stays UNAPPLIED and EXCLUDED by restrictive production packaging. Do not test by deleting a real person.
6. **AdSense readiness:** retain existing ads.txt/app-ads.txt and current ads/consent configuration; no Ads approval is inferred.

## Deliberately NOT part of this release
- No Android APK release, GitHub Pages main change or auto-generated APK on source edits.
- No Google Drive OAuth per-user auto-backup (future implementation). DOCX is the familiar shareable copy; existing JSON/ZIP remains for full-fidelity advanced recovery.
- No activated automatic account deletion or SQL migration, no backend Auth/Storage account mutation, no user content deletion and no rollback of genuine accounts.
- No claim of physical phone acceptance until owner tests the published candidate.

## Release gate and live acceptance
- Source comparison: development is fast-forward ahead of production, so an owner-approved fast-forward of `production` avoids creating a preview PR. First verify the GitHub branch head and green no-deploy CI; use expected SHA lease to prevent race.
- Production publication remains subject to Netlify deploys being enabled and the owner confirming a **Published** production deploy for the release SHA. GitHub update alone is not a verified Netlify publication.
- Post-deploy, owner uses Samsung Chrome with disposable account documents only: News comments voting/flags; Discussions Chat and moderation list; Profile avatar and request-deletion link; public GA4 consent; Research create/open/save/reopen, Import Word, File/Home/Insert/Review/View, Download DOCX, JSON/ZIP restore-new-copy and mobile layout. Recheck real official external links, Google Analytics Realtime and AdSense ads.txt. Do not repeat older basic live Chat tests without a changed path.
