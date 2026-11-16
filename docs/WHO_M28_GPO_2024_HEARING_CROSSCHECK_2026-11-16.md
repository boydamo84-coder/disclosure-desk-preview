# Disclosure Desk — Who's Who M28a original-source hearing cross-check
Date: **16 November 2026**, London time
Branch: `prep/who-evidence-m28-hearing-crosschecks-20261116`
**STATUS: isolated development, source-limited audit; NO live scores, NO community voting, NO production/Netlify deployment.**

## Provenance and method
This is a **direct check of selected publicly available original passage text**, not an independently completed review of each underlying incident or programme. It does not confer second-editor approval, photo reuse rights or a numerical assessment.

First-party sources opened and checked:
- **U.S. Government Publishing Office**, *Unidentified Anomalous Phenomena: Exposing the Truth*, House hearing held **13 November 2024**, Serial 118-135 (GPO HTML). https://www.govinfo.gov/content/pkg/CHRG-118hhrg57440/html/CHRG-118hhrg57440.htm
- **U.S. House Oversight Committee**, hearing and witness materials (13 November 2024). https://oversight.house.gov/hearing/unidentified-anomalous-phenomena-exposing-the-truth/
- **All-domain Anomaly Resolution Office (AARO)**, *Go Fast case resolution and methodology*, dated **6 February 2025**, visual checks of printed pages **1 and 4**. https://www.aaro.mil/Portals/136/PDFs/case_resolution_reports/AARO_GoFast_Case_Resolution_Card_Methodology_Final.pdf

HTML line numbers describe the retrieved full-page text on 16 November 2026. For public readers, the official transcript URL and **named testimony/question section** are the durable citation location; line numbering may change with the retrieval engine.

## Four completed source-passage checks, not incident determinations
1. **Tim Gallaudet — January 2015 Navy email and Go Fast.** His opening statement describes receiving an urgent Navy safety email with the video and the email subsequently disappearing. These are his own reported experiences; no authenticated raw email headers or server logs were presented in the public hearing. The later AARO *Go Fast* report assesses that the object was around **13,000 feet** with wind-adjusted speed around **5–92 mph**, and displayed **no anomalous performance**. AARO **did not definitively identify the object**. Its methodology notes loss of original file/metadata, unknown aircraft position/heading, and no aircrew interview. The case report challenges unusual-speed interpretation; it is **not an analysis of the email's receipt, possible deletion or its cause**.
   - GPO: Gallaudet opening statement (HTML lines 695–735).
   - AARO: printed page 1, case findings; printed page 4, data limitations and aircrew editor's note.
2. **Luis Elizondo — alleged programmes and possessions.** The hearing records Elizondo's assertion that government authorities possess UAP technology and his allegation of insufficient oversight, plus his separate personal account of institutional mistreatment. That is proof the assertions were publicly made **not independently inspectable proof of hardware**, programme authorization, origin, or causation. Each alleged programme requires its own documentary verification.
   - GPO: Elizondo opening statement (HTML lines 814–858).
3. **Michael Shellenberger — anonymous report and Immaculate Constellation.** The hearing records an anonymous report submitted to the committee and Shellenberger's remarks about the allegedly named programme. In questioning he asserted additional unnamed confirmation of the name; in another exchange he said **he was not the author** and declined to identify his sources. Entry into the House record **does not authenticate government authorship or actual programme existence**. Public source independence, original institutional records, the report's provenance, and sensor material remain unavailable to this audit.
   - GPO: opening 939–959; exchanges with Grothman 1518–1544 and Higgins 1696–1749.
4. **Mike Gold — science and policy recommendations.** Gold explicitly stated that he spoke **only for himself**, not NASA or Redwire. His request for more scientific study and reduced stigma is an attributable proposal, **not a specific extraordinary-event observation** and remains *Not applicable* to incident scoring.
   - GPO: Gold opening statement 1058–1095 onward.

## Research and UX changes
- Four `sourceAudit.m28OfficialHearingCheck` entries in `data/public-people-directory.json` record original passage, narrow finding, limitation, contrary source where available, source-date and withheld approval state.
- `assets/people-directory.js` displays a nested **source-passage** disclosure inside the existing evidence trail for exactly these four profiles; links to GPO and AARO sources are inspectable. All data is escaped for HTML and external links use HTTPS and safe opener attributes.
- `who-is-who.html` gives the disclosure a premium navy/gold border and script cache-bust.
- `scripts/test_who_m28_hearing_crosschecks.cjs` gates claimed scope, counts, official URLs, withheld score and rights approvals.
- `scripts/test_who_m28_hearing_crosschecks_chromium.cjs` checks phone and desktop expansion, original links, no fake votes, policy exception and horizontal overflow.
- `.github/workflows/who-readonly-m28-hearing-crosschecks-no-deploy.yml` extends the M27 source/package/full Chromium safety checks. **No Netlify or Supabase credentials, external data fetches, production branch write, Android change or live publication.**

## Required next steps and limits
- Complete independent assessment for all **23** attributed claim/recommendation drafts, including **19 not in this M28a batch**. The 27 institutional/public-work-only people stay unscored unless a distinct attributable evidence-reviewable claim is separately added.
- Obtain the full original programme records, independent event witnesses and documented sensor/physical artefacts where relevant. Avoid counting repeated hearings, the same public paper, anonymous programme naming or news syndication as independent verification.
- Each future rubric requires documented contrary evidence, source lineage, point-by-point reasons and a separate, real **human second-editor** approval. Current state remains **no editorial percentages**.
- Complete image creator/licence/attribution checks and real separate-JWT Supabase community-voting security checks before any vote or new portrait.
- Keep this milestone isolated until exact-head no-deploy CI is successful and the owner authorizes a separately reviewed release plan. The production website currently serves the earlier R3 train independently of this work.

## CI log
Initial M28 run [43831830734](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43831830734) had green source/package but exposed an obsolete Chromium selector for the original evidence summary after M28 added nested source details. The UI behavior was correct; the existing test was narrowed to `:scope > summary`, retaining real browser assertions. **Verified green** [43832059687](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43832059687) on `f2a4ce9699f14f638a036991435c5dd024153c05` (both jobs SUCCESS). **Verified final documentation-inclusive code green** [43832325932](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43832325932) on `edf191ce85c6c26d1dbe6e87868608026be8da48` (both source/package and mobile/desktop Chromium SUCCESS). No deploy, account writes, external video test, score or independent human signoff.
