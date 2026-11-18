# Disclosure Desk — Ads M02 Adsterra banner adapter (18 November 2026)

## Status
STAGED ON `prep/site-ads-m02-adsterra-consent-20261118`, branched from M01 preview. **NO LIVE ADS, NO DEPLOY, NO GIT PRODUCTION CHANGE, NO USER ACCOUNT/DB MODIFICATION.**

Three actual, user-supplied **standard banner** Adsterra units are configured in `assets/site-adsterra-m02.js`:
- 300×250 (News): publisher key ending `16a5`.
- 320×50 (mobile): publisher key ending `2cdd`.
- 728×90 (desktop): publisher key ending `5e97`.
- Script source for all three is the user-supplied `https://bicea.org/22/{unit-key}`. Provider origin/creatives have **not** been independently network-audited, executed or approved for public visitors. Banner account screen shows active units; that does not guarantee user-safe creatives or acceptable privacy practices.

## Safety / release gates
- `const RELEASE_ENABLED=false` is a hard first-statement runtime gate. Even the public package includes **no outgoing Adsterra request and no consent banner** while the gate is false.
- Separate affirmative `dd-site-advertising-consent-v1`, not the existing analytics choice. Choose Allow adverts / No thanks; default off; re-open settings on privacy page. No provider code is instantiated before an accepted advertising choice. This consent mechanism requires legal and browser QA before release.
- Vendor runs only inside a separate opaque-origin sandboxed iframe; no popup, same-origin or top-navigation permission. Validate that the ad network works with this restrictive setup **without weakening privacy/security** before permitting any release.
- News: one 300×250 after 6/12/18 actual cards (maximum 3). Archive: after 12/24 cards (maximum 2); Videos: one before feed; Discussions: one outside posts. Mobile/desktop choose 320×50 / 728×90 when space permits. On small layouts, scale rather than overflow.
- W.NE, editor, private Boards, Chat, private reports, full-screen videos never have placements.
- Current `assets/site-ad-layout-m01.js` remains inert preview-only. M02 does not change it; both are prevented from simultaneously serving ads.
- Public privacy policy now accurately says Adsterra is in preparation and currently **not enabled**, and offers a separate advertising-preferences button (dormant until release).
- Separate, documented UK PECR/UK GDPR advertising consent and vendor due-diligence remain mandatory, as does consent revocation/no-fill/ad-blocker/mobile/accessibility QA.
- No changes to `ads.txt`, `app-ads.txt`, AdSense credentials or AdMob, and no popup/smartlink/social bar.
- **Google Analytics:** owner is considering removal in favour of Netlify's server-log Web Analytics. **GA4 is UNCHANGED in this branch pending an explicit product decision.** If removed, strip GA scripts/consent UI from all public pages and update privacy and relevant tests; retain Adsterra consent separately. Note Netlify server-log analytics cannot observe SPA in-app tab interactions.

## Files
- Added `assets/site-adsterra-m02.js` (provider adapter; RELEASE_ENABLED=false).
- Updated `index.html` and `privacy.html` to reference adapter, and revised the advertising section in privacy.
- Updated `assets/site-ad-layout-m01.css` for future standard-ad and consent styling.
- Updated strict build allowlist `scripts/build_public_release.cjs`.
- Added `scripts/test_site_ads_m02_contract.cjs` for release lock, consent separation, publisher unit keys, privacy and W.NE boundaries.
- Added `.github/workflows/ads-m02-provider-no-deploy.yml` for offline static/security/package testing without deploy, Supabase access or advertiser requests.

## Tests and outstanding work
- Author-time JavaScript syntax check via JS parser passed when the adapter was created.
- **Do not claim exact-head GitHub Actions green until run status is verified.**
- Strict M01 preview tests were previously green at source SHA `8e2b84416389a5328dc8006179b7998d3da5ea4b`. Re-run M01 tests on this branch.
- Real advertiser creative and restricted iframe behavior cannot be considered tested from source-only checks.
- Review suitability policies, whether Google AdSense remains pending, and whether personalisation/interest-based ad choices are adequate, before scheduling a single significant Netlify production release.
