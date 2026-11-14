# R2 Who's Who — Expanded Profile, Podcast & Documentary Directory
Date: 14 November 2026 · **Isolated development branch only** · Deployment: **NOT AUTHORISED**

## Scope approved by owner
Extend Who's Who beyond the initial seven, with additional detailed people, original audio podcast episodes, credited documentaries/films/television appearances, interviews, official sources and verified public professional channels for each profile. Maintain fair attribution and an investigative evidence focus.

## Implemented work
- `data/public-people-directory.json`: **17 research profiles**. New in this milestone: **Luis Elizondo, Christopher Mellon, Avi Loeb, Jacques Vallée, James Fox and Nick Pope**; prior expansion also included Bob Lazar, Jake Barber, Steven Greer and Larry Warren. Existing core seven remain.
- **23 podcast entries** with title, show, date, original publisher link, guest/host/subject-of-news distinction, and explicit source limitations. They include Apple Podcasts full episodes, plus Film School Radio's recorded interview where applicable. A programme archive is labelled as an archive, not an individual episode.
- **21 credited documentary, TV, hearing or other public recording entries** with title, year/period, exact role, publisher/filmography link and content type. Do not conflate documentary appearance with original UAP footage or independent verification of claims. **Mick West, Larry Warren and Avi Loeb have no film credits recorded yet** because this source pass did not verify any. A blank filmography is not a claim that none exists.
- **21 context-labelled YouTube video entries** and **23 attributed social or organisational links** in the full 17-profile dataset. No copied video or unlicensed portrait; only click-activated `youtube-nocookie.com` embeds. Publishers may disallow embedding or vary streaming by region.
- `who-is-who.html`: searchable profile directory with podcast and screen-credit sections, additional category filters, direct person URLs and a related-case panel.
- `assets/people-directory.js`: safe escaped content rendering, publisher links, role distinctions and published case context. The existing video player still loads only on real visitor interaction.
- `scripts/test_public_people_directory.cjs` and `scripts/test_people_directory_chromium.cjs`: 17-profile source ledger, 23 podcast + 21 screen credits, mobile/desktop filters, deep links, case links, original video activation and no horizontal overflow. The ordinary full no-deploy R2 workflow also runs source, sitemap, public-page, Evidence DNA and Case Connections regressions.

## Verified automated QA (NOT editorial sign-off)
- GitHub Actions `43585311950`, code commit `a4010164a48f06120c00cda6f9a87aef9917f200`: **SUCCESS**. Profile static validation: 17 profiles, 112 dated/source references, 21 video records, 23 attributed social/organisation links; no copied headshots. Strict public staged bundle: 99 files; public-page audit: 19 pages, 330 links, **0 errors**, **3 pre-existing W.NE warnings**. 393px/1280px Chromium directory navigation and embedded-video tests passed.
- Automated validation verifies URL shapes, internal page rendering and known publisher references; **it does not prove all external episode pages still resolve, that video embedding is permitted by their owners, or that all biographical statements are fully editorially verified**. Public sources should receive a human source-by-source check before publishing.

## Research and release safeguards
1. Check each source, podcast episode and documentary credit at the original publisher. Distinguish **guest**, **host**, **news subject** and **documentary director/participant**. For people without verified film credits, keep explicit unknown text.
2. Correct factual roles, dated chronology and particular film credits before a public release; do not invent social handles or copy protected media.
3. Preserve editorial balance in contested testimony; no personal-defamation ratings or allegations adopted as fact. Nick Pope must be described in historical terms; his own official website records his death in April 2026.
4. Source-credit page may link to subscription services, with availability controlled by third parties. No background podcast autoplay or new third-party analytics.
5. Future: citation-backed **person → claim → case → source → counter-account** relationships, allowing the Evidence DNA and Contradiction Radar tools to drill down without falsely treating coverage as corroboration.
6. **R1 (website navigation and AdSense fixes) remains first to deploy**. Who's Who exists only on R2 branch and needs R1 acceptance, production-base reconciliation, full integrated QA, physical Galaxy device tests and explicit owner approval before any R2 deployment. Do not publish branches automatically or spend Netlify preview credits.

## Key source examples reviewed
- History Unidentified cast: https://www.history.com/shows/unidentified-inside-americas-ufo-investigation
- Galileo Project official staff: https://galileo.hsites.harvard.edu/organization
- Jacques Vallée official media/film credits: https://www.jacquesvallee.net/media/
- Nick Pope memorial: https://www.nickpope.net/life
- James Fox Film School Radio interview: https://filmschoolradio.com/the-program-director-james-fox/
- Film and podcast publisher links are retained in the JSON alongside individual people.
