# DD-WEB-R2 — Who's Who in Disclosure, profile directory milestone
Prepared: 14 November 2026 · Status: **staged public editorial preview on R2 branch ONLY**
This is NOT production and NOT the next approved website deployment.

## User request and design

External Reddit tester reported missing browser Back and lack of a clickable site logo to return Home, and proposed a directory explaining the witnesses, journalists, advocates, critical analysts and other public voices around UAP. The user approved a comprehensive version with substantive involvement histories, interviews, relevant published videos, news coverage and verified public social/website links.

### Two different release tracks
- **R1** navigation fix: clickable header logo, Back button and real section-browser history; code and no-deploy test on `audit/adsense-low-value-recovery-nov13`. Do not confuse this R1 fix with the new directory.
- **R2** Who's Who: new public `who-is-who.html`, `data/public-people-directory.json`, `assets/people-directory.js` only on `queue/dd-web-r2-evidence-intelligence`. Discoverable from Home and Explore/More; no extra cramped bottom navigation button. Shared individual profile links use `/who-is-who?person=<reviewed-id>`.

## Initial profiles / scope
Seven **research-copy-edit-needed** entries: David Grusch, Ryan Graves, David Fravor, Ross Coulthart, Jeremy Corbell, George Knapp and Mick West. Each is a public figure in the UAP discussion. The directory separates reporters and analysts from eyewitnesses, hearsay allegations, and archival sources.

Individual profiles include:
- full, independently authored summary in three substantial paragraphs, clearly attributed background and roles;
- dated public-interest involvement timeline with links to original reports;
- statements, source limitations, context and potential interpretations;
- curated source/reference documents and independent external news coverage;
- 1–2 source-verified original publisher YouTube videos per profile, explicitly labelled as **testimony / journalistic interview / documentary / technical reconstruction**, not necessarily original incident footage;
- social links only if attributed in an official organisation, broadcaster, self-published biography or public personal webpage;
- accessible mobile and desktop search, role filters and a direct shareable profile link. Browser Back and return-to-directory are tested.

This pilot deliberately has **no unmoderated personal credibility poll**, no "liar/psyop" labels, no auto-generated accusations, no unverified personal contacts and no personal information beyond professional public biographies. No independent corroboration is inferred from media attention. Social links must be checked for continued ownership and redirect changes before publication.

### Sources / provenance examples
- Official US House UAP hearing (26 July 2023): https://oversight.house.gov/hearing/unidentified-anomalous-phenomena-implications-on-national-security-public-safety-and-government-transparency/
- Government Publishing Office hearing: https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm
- Official Americans for Safe Aerospace: https://www.safeaerospace.org/
- Nexstar official announcement of Ross Coulthart: https://www.nexstar.tv/newsnation-signs-ross-coulthart-as-special-correspondent/
- Weaponized programme official hosts and linked public social accounts: https://www.weaponizedpodcast.com/about
- Mick West's self-published biography and social links: https://mickwest.com/
- Independent contemporaneous news reporting: https://www.theguardian.com/world/2023/jul/29/ufo-congress-hearing-summary-aoc-gaetz
- Verified C-SPAN and NewsNation videos, Weaponized Corbell channel videos, and Mick West's Metabunk analysis posts.

## Video / image and privacy policy
- The app renders **no YouTube iframe until the visitor presses Play**. Then it loads `youtube-nocookie.com/embed/<known-video-id>`; label notes YouTube can still set cookies. Always supply link to original publisher if embedding is disabled.
- No copied YouTube video files, unauthorized photos, portraits, private addresses, personal emails, phone numbers or scraped social content are included. Initial portraits use typographic initials pending demonstrably licensed photographs/rights verification.
- No direct ad/analytics tags circumvent consent, and personal account data isn't mixed into the directory. All editorial JSON fields are escaped; redirects and unsupported URLs must be reviewed.

## Implemented files
- `who-is-who.html` — professional navy/gold public research directory, accessible cards and full profiles.
- `assets/people-directory.js` — client rendering, accessible details, shareable query state, only click-to-load embeds.
- `data/public-people-directory.json` — initial seven cited research entries, review needed.
- `index.html` — discovery links under Explore, Home, About (R2 branch only).
- `scripts/build_public_release.cjs`, `sitemap.xml`, `scripts/test_search_indexing.cjs`, `scripts/audit_public_pages_20261108.cjs`, `scripts/test_public_release_package.cjs` — explicit public route and file manifests.
- `scripts/test_public_people_directory.cjs` and `scripts/test_people_directory_chromium.cjs` — source, URL, mobile, direct link and click-to-play regressions.
- R2 no-deploy GitHub Action adds both tests. No Netlify build, publishing, account or AdSense change.

## Future directory phases / editorial to-do

1. Editorial source verification: visit each timeline/source link; verify every named social URL still belongs to the public figure or their actual organisation. Obtain permission/appropriate licence for headshots before adding.
2. Extend coverage to other named witnesses, journalists, critics and advocates (for example Bob Lazar, Jake Barber, Steven Greer and Larry Warren) **only where the identity, dates and primary records can be verified**. Unclear names must be researched/disambiguated, not guessed.
3. Cross-link relevant archived cases and Evidence DNA statements to people, explicitly distinguishing direct testimony, interviews and citation chains from verified independent evidence.
4. Consider a neutral **claim-evidence survey**, not real-person character ratings. Would need secure one-vote-per-user, anti-manipulation, moderation and opt-out/privacy rules.
5. Real Samsung phone testing, publisher embed acceptance, source fact-check/author approval, build exact integrated R2 SHA after R1 is live and stable.
6. Release R2 only after R1 has been deployed/verified and the owner explicitly approves R2. No production merge, Netlify deploy or AdSense submission during this milestone.
