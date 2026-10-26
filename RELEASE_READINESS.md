# Disclosure Desk — release readiness checklist

## Build and deployment
- [x] GitHub Pages refuses to publish malformed inline JavaScript or invalid video JSON.
- [ ] Add browser smoke checks in the public preview: navigate to Videos, change discovery modes, open/close fullscreen, inspect console errors.
- [ ] Verify latest GitHub Pages Actions deployment green after every UI update.
- [ ] Keep private source repository, API keys, and review queue out of public preview.
- [ ] Confirm installed Android web app receives newly published updates after reopening.

## Videos and discovery
- [ ] Validate YouTube embeds on Chrome and Samsung Internet, including autoplay-muted and repeat.
- [ ] Document DVIDS embeds needing manual Play; retain official source link.
- [ ] Confirm unavailable YouTube videos are hidden only after repeat API checks and become visible on recovery.
- [ ] Confirm source citations, unverified-claim labels, and official-release distinctions.
- [ ] Test fresh/latest/For You/Unwatched modes, source filters, interests and favourites with 3,000+ test entries.
- [ ] Run rolling discovery for 7 days without daily API quota failures, duplicate inflation, or failed preview sync.
- [ ] Verify daily operating/maintenance costs and quota safety margins.
- [ ] Review automatic publishing safeguards for misleading, graphic, private, or copyrighted material.

## Mobile performance
- [ ] Measure page load and responsiveness on a mid-range Android phone.
- [ ] Keep iframe loading limited to the active clip; unload off-screen players.
- [ ] Profile memory, battery drain, network use, and swipe responsiveness during a 20-minute session.
- [ ] Confirm navigation and buttons remain usable with 3,000+ records.
- [ ] Check reduced-motion accessibility, keyboard support and readable evidence status.

## Legal and trust
- [ ] Check YouTube player and API terms, creator attribution, embedding policies, and platform review.
- [ ] Add privacy policy, in-app legal notices, corrections/report-video process, and content moderation.
- [ ] Preserve city/town-only public witness locations; no precise GPS, addresses, or personal report coordinates.
- [ ] Keep core research free. If implemented, use Google Play Billing / Apple In-App Purchase for one-time Remove Ads.
- [ ] Explain that Remove Ads removes Disclosure Desk ads only, not adverts inserted by YouTube.
- [ ] Assess ad network consent rules and age suitability before enabling advertising.

## Release
- [ ] Complete native Android/iOS packaging and distribution checks.
- [ ] Test purchase, restore, account/device migration, and offline/recovery paths where supported.
- [ ] Verify 3,000 distinct, playable records rather than counting external resource links.
- [ ] Complete end-to-end regression tests and sign off launch build.
