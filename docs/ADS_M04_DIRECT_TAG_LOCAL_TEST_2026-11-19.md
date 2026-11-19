# Disclosure Desk — M04 direct Adsterra tag technical experiment (19 November 2026)

## Status
- **STAGED ONLY**, branch `prep/site-ads-m04-direct-banner-local-test-20261119` forked from GitHub `production` commit `ca302b2e99a9321279bc711a817ad833cb041851`.
- User approved trying the standard Adsterra Banner tags **without our additional wrapping iframe**. This is a technical experiment, **not an approval to start serving unverified real adverts to visitors**.
- `assets/site-adsterra-m02.js` now inserts Adsterra's original atOptions values and script URL straight into a clearly labelled DOM banner slot, with **no additional iframe**. `format:'iframe'` remains in the provider's own original tag and Adsterra can still create an iframe itself.
- **Production release switch remains OFF: `const RELEASE_ENABLED=false`.** No site deployment, Netlify build, Supabase modification or live impression happened in this experiment.

## Design & safety
- Browser scripts loaded in series so the global `atOptions` doesn't get overwritten between placements of different sizes.
- If a script fetch errors, the slot is hidden rather than immediately recreated in a retry loop.
- The known three publisher banner unit keys are unchanged.
- Separate affirmative advertising consent, reject and saved choice remain. No code is loaded before consent. No banner in private research, W.NE, chat, evidence reader or fullscreen playback.
- Original 300×250 / 320×50 / 728×90 dimensions preserved; **no CSS scaling of ad creatives**. Sites too narrow for a unit omit it (including some 320px phone viewports), rather than distort ads/overflow.
- Development-only `LOCAL_TEST` is restricted to a specific loopback URL `/scripts/fixtures/ad-m04-direct-banner-test.html?dd_adsterra_direct_test=1`. Under LOCAL_TEST the network script URL is replaced by `/scripts/fixtures/ad-m04-mock-tag.js` (fake creative). Both fixture files are excluded from the strict public release. No test runner requests real ads or creates artificial Adsterra impressions.

## Verified QA
- Existing M01/M02/GA4 no-deploy contracts and strict public-package tests pass on code SHA `032d61243771252b2da370d34fea987d0b964830`.
- Chromium mock ad test `scripts/test_site_ads_m04_direct_chromium.cjs` passed on the same SHA in [no-deploy CI run 44429378289](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44429378289) across 320/393/820/1280 px: choice 'No thanks' prevents scripts; after explicit acceptance fake banners appear at prescribed News/Archive positions where they fit, they have correct original dimensions, no wrapping iframe, no popup/redirect in the **synthetic fake**, no external request, no W.NE slots, no horizontal overflow.
- Earlier test-only assertion typos were corrected; they were **not application defects**.
- **Real Adsterra code was NOT executed, fetched or inspected.** Container/browser outbound DNS was unavailable and public web retrieval of the vendor script was unavailable. This QA cannot guarantee real ad creatives, landing-page safety or the vendor's support for late dynamic script insertion into an SPA.
- Important unresolved technical risk: synchronous iframe banner scripts may use `document.write()` and corrupt a dynamically rendered page if loaded after document parsing. Synthetic creative tests cannot rule this out.
- Important privacy risk: **direct third-party scripts run in Disclosure Desk's top-level origin**, potentially accessing localStorage, Supabase session tokens and private editor/browser state. An 'established network' does not eliminate this. Do not activate direct scripts on the same origin as signed-in private research without a documented isolation/security design and appropriate user-consent review.
- Provider's [Publisher Terms §4.7](https://adsterra.com/publishers-terms-managed/) prohibit *our own additional iframe* without written permission and modifying provider tags without written permission; placing the original direct tag avoids the extra-frame issue but does NOT remove the privacy issue.
- Provider anti-fraud documentation cautions about repeated/adapted banners and code quantity. Need publisher confirmation before loading the identical 300×250 script after News stories 6/12/18.

## Next gates before ads can be switched on
1. Confirm Adsterra supports dynamically inserting their exact original iframe-sync script on a SPA after separate opt-in, without `document.write()` side effects. Obtain real official asynchronous code if needed.
2. Safely test genuine creatives on an **approved publisher origin**, not localhost or a bot; avoid automated impressions or ad-click QA.
3. Address direct script access to signed-in private browser state, account tokens and any other origin-shared secrets. Prefer written permission for an additional sandboxed iframe or an ad system specifically designed to isolate ads.
4. Verify UK PECR/UK GDPR vendor/partner disclosures, retention, reject-withdraw flow; audit popups, redirects, no fill, mobile layout and content categories.
5. Only after explicit owner sign-off on all gates, create a new release with a reversible ad enablement switch and monitor actual traffic. Keep W.NE ad-free.

**Current site remains on the previous GA4-removal production branch, no genuine Adsterra ads have been enabled.** 

## Adsterra publisher-support response — confirmed 19 November 2026
- Received in registered `boydamo84@gmail.com` from publisher support as a reply to the owner's iframe permission request, message ID `1a1f1691754250b6`.
- Adsterra **refused publisher-created enclosing iframes**. The **original supplied Banner tags are the only supported implementation**. They also said there is **no contextual/cookieless tag**, and that UK/EU user consent responsibility belongs to the publisher (they defer to legal advisors).
- They warned about any iframe changing visibility, interaction, click/impression attribution, dynamic resizing/redirects and cautioned that “more than one ad code is placed inside the same iframe or on the same page” may lead to suspension. **Clarify whether this prohibits the originally requested after-every-6-news-cards repeated placements (including the same 300×250 key), and whether one ad unit per route is required.**
- Existing **M04 direct injection prototype passed synthetic mocked tests, not genuine Adsterra campaign tests**, and is still `const RELEASE_ENABLED=false`. Do NOT merge into website production or activate as-is because direct third-party JavaScript would execute in the same origin as member sessions/W.NE and dynamic insertion has not been proven vendor-compatible; UK consent/partners disclosures and multi-tag allowance remain unresolved.
- Owner would like a cautious real-ad pilot when ready; **owner's “if it's ready” condition is not yet met.** Protect account research and privacy, trial one approved banner on a properly consented deployment only after the remaining gates. No change to Netlify, Supabase or Google Play made in this support response.
