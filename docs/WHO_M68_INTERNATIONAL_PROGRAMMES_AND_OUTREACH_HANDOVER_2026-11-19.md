# Disclosure Desk M68 — International programme directory + Source Verification Tracker links (19 November 2026)

## Source of truth / status
- **STAGED, NO DEPLOY** on branch `prep/who-m68-international-programmes-in-whoswho-20261119`, based on the verified `prep/who-m67-production-voting-integration-20261119`. No production, Netlify, Supabase or APK change.
- User recalled the existing international list, including Vatican, rather than asking for new, unsupported programmes. Reused `data/programmes-places-m58.json` without inventing sources: **23 documented programme/institution/archive entries** and **14 original research leads**, of which 13 are additional countries not already indexed (Vatican is included in the 23 and not double-counted as an unverified government UFO unit).
- New `assets/who-international-programmes-m68.js` renders expandable, labelled institutional cards within the Who's Who directory; search by country/organisation, filter by evidence-category, view sources and related public-person profiles. Does not blend institutions into the 57 human biographies or allow votes about an organisation's honesty. Explicit Vatican disclaimer: Observatory and Apostolic Archive are documented astronomy/archive contexts, not proof of an official UFO bureau or alleged recovered craft.
- The comprehensive worldwide programme directory `world-uap-programmes.html` remains available and distinct.
- Reused the existing 5-enquiry, manually maintained public source-status registry `data/public-source-verification.json`: Pentagon/WHS (procedural reply, 151-page referral unresolved), Brazilian Arquivo Nacional (SIAN guidance, no blanket permission), German independent GEP (commercial data reuse declined), Library and Archives Canada (single-file licence, web publishing permission unclear), NARA (enquiry sent, acknowledgement unverified).
- `assets/source-outreach-digest-m68.js` and `.css` render the **same five records** on Who's Who and Worldwide Programmes, each linking to one original full card in `/sources#dd-source-enquiry-[id]`. The full tracker itself remains in Sources; `assets/source-verification.js` now supplies stable deep-link IDs and scrolls after asynchronous loading.
- No raw emails, sender identities, private contact data, inferred acknowledgement, invented date, automatic inbox polling, account/Supabase calls or advertiser requests.
- Strict allowlist updated for three explicitly reviewed read-only assets; package count test upper bound now 132. Who M67 voting remains **OFF**, its registry EMPTY, no live DB migration; three Adsterra banners stay OFF.
- A separate Gmail publisher-support email was already sent from boyddigitalstudios@gmail.com, but owner now requires the registered `boydamo84@gmail.com`. The connected Gmail plugin currently authenticates only as `boyddigitalstudios@gmail.com`, and its send API cannot choose a sender. **No second email has been sent.** Await explicit account switch/connect; then resend with confirmed correct From. Do not attempt to spoof it via body or Reply-To.

## Verification
- `.github/workflows/who-m68-programmes-outreach-no-deploy.yml` performs source contract, immutable strict public package, the existing M67 synthetic two-account voting/browser and disposable Postgres RLS tests, and M68 real Chrome checks at 320/393/820/1280 px.
- [Green run 44433741118](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44433741118) passed **all three jobs** on code SHA `7d0c6d3215f8c273b6f42afb718835022348742e`. The initial browser test attempted `innerText` on a collapsed details card, which returns empty; changed the test to `textContent` without changing the app.
- Subsequent documentation/handovers should be verified on the new exact branch HEAD before promotion.
- This is still not a live production or mobile-device smoke test. Preserve M95 premium Android nav/full editorial News when returning to APK.

## Future work
- Resend Adsterra publisher support from registered Gmail once that account is connected, wait for written permission before releasing any ad tag.
- Coordinate one reviewed Netlify website release only with owner permission; do not spend credits on previews. Verify live routes and async source deep-links.
- Remaining programme research leads require institutional primary documents; don't assert a current UAP bureau on anecdote alone.
