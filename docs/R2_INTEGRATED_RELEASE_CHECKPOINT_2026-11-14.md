# DD-WEB-R2 — integrated website release checkpoint, 14 November 2026

**Status: WEBSITE-ONLY CANDIDATE, NO R2 PRODUCTION DEPLOY.** User has authorised live releases of approved work. This checkpoint records what has actually been done and the remaining objective release gates.

## Release train and verified R1 action

- R1 source `audit/adsense-low-value-recovery-nov13` was ahead 84 / behind 0 of original production `b02d21d720b84504fba86705aac4455f0206731b`.
- GitHub R1 source and real Chromium no-deploy [run 43635932991](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43635932991) passed at `a1d58953b4a5b39ede54a286e4f05f6d9ad4cde9`.
- [PR #11](https://github.com/boydamo84-coder/disclosure-desk-preview/pull/11) obtained a successful Netlify deploy preview, then merged cleanly to GitHub `production` commit `5f602cdcd832e84a6fee49bd1f7c29b1b7e99b21`. This is an actual GitHub production-branch mutation, not proof that Netlify marked the production deploy **Published**.
- GitHub commit combined status for this merge returned no Netlify production status; external live website and dashboard probes were unavailable. **Production Netlify published deployment and exact published commit NOT independently verified.** Do not claim R1 live until Netlify Deploys shows **Production: production @5f602cdc — Published** and live pages match.
- `main` is an unrelated stale GitHub Pages source branch, never promote website releases there. The correct site `netlify.toml` publishes only `.release-staging/public-site`.

## Integrated R2 website-only code

- Candidate branch: `release/dd-web-r2-integration-nov14`, created from verified post-merge R1 GitHub production HEAD `5f602cd...`, **not** from an outdated queue base or from an Android APK branch merge.
- Consolidated M12.3 research website UI and source data with R1's current brand Home button, accessible Back, section browser-history entries, live navigation and existing Case Connections. Imported only public website assets and their test files; excluded Android native activities, APK manifests, private JS nav assets and any new auth/storage database operations.
- R2 scope includes 50 research-draft Who's Who profiles, attributed/reusable portrait links for 17, remaining 33 with initials, person–case source ledger, Evidence DNA conservative provenance, draft cited claims/side-by-side view, source relationship graph, contextual page-help/guide and original dossiers. The 50 profiles explicitly remain `research-copy-edit-needed`; publisher claims, external links, dates and photo attribution require editorial checking before public release. No unsupported inference of extraterrestrial explanation or independent witness counts.
- Restored the clean `/who-is-who` canonical Home link for public indexing while preserving `.html` fallback routes. Confirmed original M12.2 directory scroll and R1 Home/Back coexist via actual-browser tests.
- Exact candidate SHA before documentation: `a9ca5b99dd10da74aedc5397111f06dfac8fe946`. [GitHub Actions **43637283247**](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43637283247) **SUCCESS** across source/schema, strict public-only release packaging, detailed 50 profiles and citations, mobile/desktop Chromium research/Archive, Home/Back, profile scroll, contextual guide, and mobile Chat/comments.

## Next safe action

1. Owner opens Netlify → `uap-disclosure-desk` → Deploys and verifies that the *latest production deploy* is Published from GitHub `production` revision `5f602cdc`. Check https://uapdisclosuredesk.com/investigations and the two editorial dossier pages while logged out, plus News/Archive/ads.txt.
2. Investigate any R1 live regressions before advancing. Avoid an R2 PR preview that consumes credits while R1 published SHA remains unverified.
3. Fact-check and approve the 50 public-figure biographies and all 17 image licenses/actual image matches, correct faulty URLs, then open the R2 PR against the verified live production SHA. Re-run full checks on its exact merged candidate; visually test Android Chrome and iPhone Safari guest journeys.
4. After R2 passes, one controlled production merge/Netlify publish; verify actual Published deploy and public Who's Who, Archive/Evidence DNA, research and member privacy before promoting another release.
5. R3 Hypothesis Lab / Research Gap Finder and R4 Living Investigations / Passport remain product **roadmaps**, not code-ready deploys. Do not publish placeholder features.
6. AdSense review is a separate owner-operated account action after live policy/content checks; never falsely claim approval.

**No R2 or R3/R4 merge to `production`, no Play Store update and no Supabase migration performed in this checkpoint.**
