# Disclosure Desk — M03 Google Analytics retirement (18 November 2026)

## Status / provenance
- **STAGED ONLY**, branch `prep/site-ads-m03-remove-ga4-20261118` based on Ads M02 staged branch, which contains the owner-supplied three Adsterra standard display units with `RELEASE_ENABLED=false`.
- **No change to production**, Netlify published site, Google account/property, actual Web Analytics settings, Supabase user data, W.NE editor or Android APK. No Netlify deployment or paid Netlify build.
- User explicitly decided to remove Google Analytics because Netlify already provides site traffic information. Preserve Google Search Console (search-performance reporting), optional AdSense publisher meta/ads.txt records, Google Drive OAuth, separate Adsterra advertising consent, and W.NE privacy.
- Netlify Web Analytics reports request-based traffic; internal single-page app tab clicks are not automatically discrete pageview counts. No replacement client-side analytics system was added.

## Concrete implementation
1. Removed the `/assets/analytics-consent.js?v=nov08-ga4-optin-m18` loader from homepage and all other published HTML pages carrying it: `index.html`, `guide.html`, `sources.html`, `privacy.html`, `community-rules.html`, `research-edition.html`, `investigations.html`, `terms.html`, `roswell-1947.html`, `rendlesham-forest-1980.html`, `who-is-who.html`. `world-uap-programmes.html` already had no GA script. Standalone W.NE research pages already had no GA script.
2. Deleted unused `assets/analytics-consent.js` and the obsolete synthetic opt-in tests `scripts/test_analytics_consent_chromium_20261108.cjs` and `scripts/test_site_analytics_chromium_20261108.cjs` on this staging branch. Git history retains them.
3. Removed the legacy GA consent/status/preferences from the restricted owner traffic panel. Replaced it with accurate Netlify Web Analytics and Google Search Console explanatory text and direct dashboard links.
4. Privacy page `#website-analytics` replaces `#analytics-settings` with Netlify request-based traffic description, separate Search Console disclosure, GA4 retirement notice, and caveat that prior Google-held data and existing cookies are not retroactively erased. Standalone `#advertising-settings` and release-locked Adsterra preference remain.
5. Removed analytics script from strict public package allowlist without adding any new third-party script.
6. Converted existing M40 Research Studio contract + Chromium QA from GA4 consent checks to no-GA4 checks, preserving real editor/Archive/Board/citation tests. Updated historical `research-resume-check.yml` references so retired tests won't fail later workflows.
7. New source contract `scripts/test_ga4_retirement_20261118.cjs`, real Chrome regression `scripts/test_ga4_retirement_chromium_20261118.cjs` (320/393/820/1280px), and no-deploy workflow `.github/workflows/ads-m03-remove-ga4-no-deploy.yml`. Tests explicitly check no Google requests, zero GA consent controls and Adsterra release lock.

## QA / release gate
- Verified CI at implementation SHA `266193fcd79ce3f919aaf41968a571755c7499a1`: [run 44425682905](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44425682905) **both static/public package and Chromium jobs passed**. This run precedes a minor improvement in test-only vendor-host matching at `ff4f3ebcd390ecff893cf344826e980f03761a8b`; verify its run, and verify exact HEAD after documentation updates, before release.
- No actual production smoke or Netlify deploy was performed. The current site may still serve previously deployed GA4 until this controlled release candidate is deployed.
- Before production: reconcile staging with latest release branch, ensure `ads.txt`/AdSense status unchanged, approve a single consolidated Netlify deployment, then confirm page source and network requests show no GA4 across News/Privacy/Guide and that Netlify Web Analytics still reports page requests.
- Historical `dd-site-analytics-consent-v1` localStorage and previously set GA cookies could remain on returning browsers; no new GA code reads them. This is not a deletion of past analytics records from Google's account. An optional separately reviewed cleanup can be considered, but must not reintroduce tracking.

## Exclusions
No Google Search Console removal, no account/property deletion, no third-party ad activation, no general tracking replacement, no W.NE editor changes and no app/APK changes.
