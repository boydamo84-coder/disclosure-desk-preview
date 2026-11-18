# Disclosure Desk — Ads M01 staging handover (18 November 2026)

## Scope and live baseline
- Created `prep/site-ads-m01-layout-20261118` directly from verified live GitHub `production` after Source-First RC1. Do not merge unrelated Who M66, Community Research M07, stale Nov 1 PR #1 or historical R1/R2/R3 scopes.
- **STAGED ONLY.** No production ref change, Netlify build/deployment, Supabase migration, existing account modification, third-party advertising code or actual advertiser request.
- The AdSense records in `ADSENSE_RECOVERY_AUDIT_2026-11-13.md` document an earlier **Needs attention / Low-value content** result, not an approved ad network. A website Publisher ID and `ads.txt` already exist. The real AdSense account status must be confirmed in the signed-in dashboard before claiming approval.
- Vendor selection remains **unapproved**. Adsterra native/display banners are candidates; popunder, push, social-bar, fullscreen and sticky-dock-obstructing formats are rejected. No vendor scripts, fake ad unit IDs or earned-income claims.

## Design staged (preview only)
- Public home/index contains two locally served **first-party** files: `assets/site-ad-layout-m01.js` and `.css`. They are in the explicit public-package allowlist.
- In a **localhost or approved Netlify deploy-preview only**, `?dd_ads_preview=1` creates marked navy/gold **Advertisement · Layout preview only** spacers, without tracking or external requests.
- In normal site sessions these files are entirely inert (providerEnabled:false and no placeholder). Even `?dd_ads_preview=1` on live production cannot activate them.
- **News:** after exactly six, twelve and eighteen *actual* news cards; max three visible placements per rendered page. Re-render after filtering replaces stale slots without changing story IDs, research/rabbit holes or action controls.
- **Archive:** after twelve/twenty-four *actual* archive cards; max two, never inside evidence.
- **Videos:** one standalone slot before the clip feed. **Never** interrupt immersive/swipe players with ad cards.
- **Discussions:** one standalone slot just outside the thread/post area. No ads inside posts, voting, reports or comments.
- **W.NE/Research Studio, chat, login, private drafts, research/ comparison/ editor workspace and fullscreen videos: NO ads.**
- No automatic full-site ad injection into other static pages. Additional light placements require a later accessibility and consent review.

## Security / privacy and provider release gates
1. Select a network account with approved **ordinary banners/native display only**; review advertiser categories and block unsuitable creatives. Do not assume publisher approval means every ad format is acceptable.
2. Build separate affirmative **advertising consent**, independent of the existing Analytics opt-in, compliant with PECR/UK GDPR before loading non-essential advertising storage/access. Provide a reject option and clear privacy/cookie information. Strictly no advertising script or tracking before consent.
3. Do not alter public `ads.txt` / `app-ads.txt` unless the selected provider's official publisher instructions require an **exact verified account record**. Keep AdSense record intact.
4. Connect vetted vendor's ad units to these locations, cap density, collapse no-fill placements, check Core Web Vitals / mobile overflow and original 14-tab premium dock (320/393/820/1280). Never inject scripts into account/private workspace.
5. Actual signed-out and signed-in Samsung browser tests, nonintrusive user review, appropriate editorial policies/rights, and explicit owner approval **before a significant Netlify deployment**. No actual ad approval, traffic or earnings are guaranteed.

## QA
- `scripts/test_site_ads_m01_contract.cjs` verifies provider disabled, no network/storage/tracker, approved preview host restriction, layout frequency, archive cap, original W.NE exclusion and exact new asset allowlist.
- `scripts/test_site_ads_m01_chromium.cjs` uses a synthetic local-only fixture under `scripts/fixtures/ad-m01-preview-test.html`; checks 320/393/820/1280 widths, 6/12/18, 12/24, one banner each Videos/Discussions, zero W.NE slots or third-party requests, no horizontal overflow, rerender cleanup and zero banners outside preview.
- `.github/workflows/ads-m01-layout-no-deploy.yml` runs above and the existing **production-shaped** strict bundle test. Test fixtures and documents are excluded. **Exact-head CI outcome needs verification after commit.**
