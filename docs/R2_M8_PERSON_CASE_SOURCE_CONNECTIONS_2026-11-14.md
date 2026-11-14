# Disclosure Desk R2 M8 — People ↔ cases ↔ original-source relationships
**Date:** 14 November 2026. **Status:** R2 code branch only, editorial draft; NOT DEPLOYED.

## Why this matters
The public directory and Archive now connect people and investigations by the specific **statement, authoring credit or retrospectively claimed participation** supported by a published source. Such a public-source link is not evidence that an extraordinary event happened; a first-person account is not equivalent to an independently confirmed physical event. Do not display alleged participation as verified service, independent corroboration, proof, dishonesty, or guilt.

## Three sourced starting edges
1. David Fravor ↔ **USS Nimitz / Tic Tac (2004)**. Role: first-person description given in 2023 House Oversight testimony, recorded by GovInfo. Cited document: https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm, section `STATEMENT OF DAVID FRAVOR (RET.)`. This proves what was said on the public congressional record, not the cause of the observation.
2. Nick Pope ↔ **Rendlesham Forest (1980)**. Role: later co-author of the book `Encounter in Rendlesham Forest` (2014) with John Burroughs and Jim Penniston. Original author's book archive: https://www.nickpope.net/archive, `Books — Encounter in Rendlesham Forest`. No implication Pope witnessed the 1980 incident.
3. Larry Warren ↔ **Rendlesham Forest (1980)**. Role: a disputed retrospective account; published interview with Steve LaPlume on 6 June 2023: https://www.thecosmicswitchboard.com/2023/06/06/rendlesham-forest-secrets/, Parts 1–2. It documents a **claim** he publicly described, not adjudication of his presence or testimony.

## Implementation
- `data/public-person-case-links.json`: strictly public, purpose-limited three-entry attribution ledger. Every entry preserves the role, person and curated case IDs, source URL, precise locator, publisher, date, a non-endorsement explanation, `reviewStatus=editorial-draft`, and `eventVerified=false`.
- `assets/person-case-links.js`: fail-closed validation (duplicate IDs and pairs, invalid URL, missing locators, unknown person/case IDs, unsupported roles, unreviewed truth flags); `byCase` and `byPerson` selectors. No user location, witness PII, accounts, tracking, scraping, servers or private notes.
- `index.html`: Archive source panel shows role-specific person cards and original publisher citations. The M7 source relationship graph displays a dedicated **Public individuals** column, with person→case attributed-role and person→source supporting-document edges. This includes the otherwise source-inventory-only Nimitz case. The case deep link accepts `featured-nimitz-2004` in the existing public allowlist.
- `who-is-who.html` and `assets/people-directory.js`: attribution cards point in reverse to the case detail and cite the corresponding public source. Missing or invalid optional public ledger fails to empty cards rather than fabricating links.
- Existing Who’s Who profiles/film/podcast credits, Evidence DNA, Contradiction Radar, case connection search and premium navy/gold styling are preserved. Shared source URLs do not create or verify any cross-case edge.

## QA and release gates
- `scripts/test_person_case_links.cjs`: validates 3 source-backed person roles against the 17-profile directory and 12 curated cases; checks known citations, source locators, fail-closed corrupt input, graph counts, role labels and no incident truth inference.
- Existing archive and profile Chromium tests extended for source links at phone width 393px and desktop 1280px. Strict public release package includes only the new public data/code; no private records added.
- Expected full graph: 3 case nodes, 4 already-drafted claim nodes, 3 public person nodes, 6 distinct cited pages = **16 nodes**; 8 original citation/catalogue edges and 6 attributed/source edges = **14**; no verified case-to-case edges.
- Editorial human review of exact original passages, mobile hardware tests, accessibility and owner acceptance remain mandatory. More people/cases should be linked **only after individually reviewable primary evidence is found**. R1 first; R2 rebase onto actual live production after separate acceptance; no Netlify preview, deployment, merge, AdSense resubmission or live account work.
