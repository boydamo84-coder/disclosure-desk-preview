# Disclosure Desk Adsterra News pilot

19 November 2026 · staged on `prep/site-ads-m05-isolated-news-pilot-20261119` from the live M76 source. The current website still serves the M76 manifest and its advertising switch is off.

## What the tests established

- Adsterra approved three standard units on the main domain. Publisher support declined the extra iframe and warned about multiple tags on a page. This pilot uses one 300 × 250 banner after six selected news stories.
- The real 300 × 250 loader was retrieved with the approved website as referrer, then replayed offline. On the main origin it created the provider frame. A top-level CSP sandbox without same-origin access broke the loader when it tried to use cookies and service workers.
- The separate News page passed mock and offline real-loader tests at 320, 393, 820 and 1280 px. The tests verified no Adsterra requests before consent or after declining, one provider frame after consenting, withdrawal, no overflow and isolation from synthetic member storage and host-only cookies on the main domain. All creative, impression and tracking requests were intercepted.
- The normal production build still has the same 130 files and manifest hash `64a515c450918a6ef368b05920e2cf7664728436290282ee8ffa0bb871855768`. It does not include the pilot.

## Publisher and hosting release steps

1. Use a separate static hosting site for the pilot at `https://news.uapdisclosuredesk.com`. Keep the site limited to public news with the supplied headers and HTTPS. A second hostname serving the existing Disclosure Desk app would also carry its sign-in and research code, so use the dedicated pilot output.
2. Confirm in Adsterra that the pilot hostname is approved and that the unit is assigned to it. Verify standard banners and the publisher's adult-content exclusion. If Adsterra supplies a different unit for the pilot hostname, replace the unit and script URL with the newly supplied code and retest.
3. Build using `node scripts/build_adsterra_news_pilot.cjs`. This builds the off-by-default preview in `.release-staging/adsterra-news-pilot`. Verify that the pilot hostname serves the separate site, its headers and the advertising explanation.
4. Once hosting and publisher settings are confirmed, use `DD_ADSTERRA_NEWS_PILOT_LIVE=1 node scripts/build_adsterra_news_pilot.cjs` in a clean checkout. The banner switch works on the exact pilot HTTPS hostname only. Verify the deployed page, no requests before opt-in, one banner render, no unsolicited redirects, and withdrawal in an ordinary browser. Check real fill and the reporting dashboard without clicking the adverts or running automated impressions.

Adsterra's standard tag runs as top-level JavaScript and creates its own banner frame. The pilot separates that script from the main site's local storage, Profile, Chat and W.NE. Consent applies to the visit. Returning through **Stop showing ads** loads a clean copy of the page. The provider's own cookies remain subject to browser settings and its privacy policy.

## Publisher dashboard and hosting check

Adsterra lists the main domain as Approved and all three banner units as Active. The 300 × 250 is placement 32356356. Its Adult ads switch is off and disabled. The dashboard directs publishers to place the supplied code in the page body. The pilot uses the exact two script blocks shown by Get code.

The proposed `news.uapdisclosuredesk.com` hostname currently resolves to a parking redirect, and the publisher dashboard lists the main domain only. Netlify hosting access still needs to be confirmed. Approval and creative settings for the pilot hostname remain to be verified before live advertising.

## Placement plan after the pilot

The owner would like up to three placements per eligible public page if Adsterra confirms this is allowed, with banners between stories or public discussion posts and lighter placement elsewhere. Keep W.NE, Boards, Profile and private Chat ad-free. The three approved units are banner sizes. They do not establish a per-site or per-page allowance. Publisher support's account-specific email warned about multiple codes on the same page, so the pilot stays at one while that rule is clarified. Keep member-only features isolated if testing ads against a public feed.

A second network can fill an existing slot when the first network has no ad to show, or serve selected sections under its own policy. Check both contracts and consent arrangements before enabling this. Google AdSense permits non-Google ads on the same page subject to its policies and each publisher's agreements. [AdSense help](https://support.google.com/adsense/answer/9728)
