# Disclosure Desk — M32: Immaculate Constellation source-family and attachment audit

**Date:** 16 November 2026 (UK)  
**Branch:** `prep/who-m32-immaculate-source-separation-20261116`  
**Status:** First-party *document/source-lineage* audit. **Not** a verdict about the alleged programme, not a whole-file visual audit, not signed independent editorial review, not a public rating, not a deployment.

## Most important finding: the official record holds separate things

The [13 November 2024 House event index](https://docs.house.gov/Committee/Calendar/ByEvent.aspx?EventID=117721) lists **Michael Shellenberger's written witness statement** and, in a different *Support Documents* section, a **12-page report entered by Rep. Nancy Mace**. The 2024 [GPO transcript](https://www.govinfo.gov/content/pkg/CHRG-118hhrg57440/html/CHRG-118hhrg57440.htm) explicitly lists the report under documents submitted by Mace (HTML lines 161–183). The House hosting a file makes it an attributable record of **submission**, not authentication of its source's identity, the presence of classified data, or a real Special Access Program.

### Source A: Shellenberger testimony and its 212-page attachment bundle
[Original House PDF](https://docs.house.gov/meetings/GO/GO12/20241113/117721/HHRG-118-GO12-Wstate-ShellenbergerM-20241113.pdf). **212 PDF pages**, counted by the official PDF reader, not a 212-page continuous factual investigation of a single alleged programme. Specific visual checks were made at PDF pages **1, 7, 18–21, 25, 30, 33–37, 41, 51, 91, 151 and 211–212** (one-based page labels in this sentence; corresponding zero-based numbers are in the JSON). Other pages were *not* visually audited end-to-end.

- **PDF pages 1–18 (0–17):** signed/attributed Shellenberger article-style witness testimony, end notes and references, including his October 2024 reporting on the alleged Immaculate Constellation programme and discussion of contrary DoD/AARO positions.
- **PDF pages 19–35 (18–34):** appended Navy FOIA responses and a historical **31 August 2020 redacted UAP Task Force briefing**. Its slides show government UAP work, and some heavily redacted content. There is no public, case-specific authentication of a programme named Immaculate Constellation on the reviewed pages. The files were embedded in a witness packet: **not authored by Shellenberger**, and original Navy version/custody has not yet been checked separately.
- **PDF pages 36–212 (35–211):** the long UAP historical *timeline* compilation, which blends identifiable official correspondence with attributed media interviews, research links, disputed material, and anecdotal allegations. Samples from PDF pages 36–37, 41, 51, 91, 151 and 211–212 confirm the **mixed source character**. The timeline includes a **PUBLIC DOMAIN** label on individual entries, which is a compiler's label, not independently verified evidence and not necessarily a copyright licence. The overall length is not evidence quantity.
- **Caution:** These are **navigation zones based on inspected boundaries**, not a legal attestation of every page or independent verification of every listed historical event. Publisher, source authorship and item-level original records must be traced separately.

### Source B: separate 12-page report alleging Immaculate Constellation
[House support-document PDF (SD003)](https://docs.house.gov/meetings/GO/GO12/20241113/117721/HHRG-118-GO12-20241113-SD003.pdf). A separately filed, scanned **12-page** document. We visually inspected samples of PDF pages **1, 4, 7, 11 and 12**. It alleges an unacknowledged Special Access Program, historical images/records, and UAP observations. The scanned report **asserts** internal official provenance but provides neither inspectable classified source data nor independent public proof of that provenance. The document's appearance as a government-typed report does not establish that a department endorsed it.

- **Critical authorship cross-check:** Under questioning by Rep. Clay Higgins, Shellenberger explicitly answered that **he was not the author** of the report, said he knew its author and could not say where the purported non-public version could be found. [Official GPO transcript, HTML lines 1698–1737](https://www.govinfo.gov/content/pkg/CHRG-118hhrg57440/html/CHRG-118hhrg57440.htm). Keep the author *unattributed from this 2024 record*, even if a later public claimant identifies themselves. A later identity claim would need its own independent provenance assessment.
- **No false corroboration:** Shellenberger's testimony, its news footnotes, the unnamed document, the congressional index and later media quoting the same submission can all describe **one common allegation family**, not multiple independently authenticated programme datasets.

### Source C: a contemporaneous official denial recorded in an ODNI FOIA release
[ODNI, “Description of Alleged ‘Immaculate Constellation’ Program,” FOIA DF-2025-00021](https://archive.dni.gov/files/documents/FOIA/DF-2025-00021-Immaculate-Constellation-descrp-from-UNCLASS-Press-22-Oct-2024.pdf). **One page**, visually inspected. Marked approved for public release on **6 November 2024**; summarises the **October 2024 press allegation** (not an ODNI independent case investigation) and records DoD spokesperson **Sue Gough's denial** that the Department had records of an SAP under that name. Part of the document is visibly **redacted under (b)(5)**.

The correct characterization is **an official contemporaneous record of two opposing public statements**: (a) allegations attributed to press sources, (b) the DoD denial. It is *not* additional government corroboration of the programme, and the visible press summary is not a full item-by-item forensic refutation of inaccessible claimed records. Nothing can be inferred from the blacked-out text.

## Stronger evidence graph — provenance, not popularity

| Item | Original publisher / origin | What is actually established | NOT established |
|---|---|---|---|
| House 2024 event index | U.S. House Committee Repository | Separate documents were filed and listed | Programme existence or report authorship |
| 212-page witness PDF | Shellenberger + historically distinct embedded sources | What his submitted testimony and appendices say; some redacted UAPTF activity is documented | 212 independently corroborating incidents, case sensor files |
| 12-page SD003 report | Claimed anonymous source; entered by Rep. Mace | Alleged claims were publicly submitted | Authenticated programme, imagery, chain of custody or identity |
| Oral hearing transcript | Government Publishing Office | Shellenberger distanced himself from authorship; public questioning and entry in record | That journalists or committee examined underlying classified sensors |
| ODNI one-page release | ODNI source of official press-summary/denial record | The existence of the DoD denial and time-specific press allegations | ODNI independently proved existence or nonexistence of each alleged programme |

**Important temporal sequence:** October 2024 press story/DoD denial → **6 November 2024** ODNI release approval → **13 November 2024** hearing and House submission. This sequence prevents mistakenly treating the earlier ODNI memo as a government authentication of the later congressional file.

## What remains unresolved

1. A version/chain-of-custody trail to the *actual anonymous 12-page report writer* and its claimed earlier internal edition.
2. Legally inspectable original videos, telemetry, sensor metadata, named programme files and audit records, if any.
3. The independence of the media informants: whether multiple reporters heard from different witnesses or received one reused story.
4. Exact original Navy FOIA reading-room files underlying the embedded 2020 presentation and release/version changes.
5. Item-level source vetting for the mixed chronology, including primary original documents versus disputed material and publisher copyright.
6. A qualified **first and second human editor**, dated conflict disclosures, rights/privacy review and transparent method — **not performed here**.

## Safe technical handover and QA

- Added research-only structured source catalogue `data/who-m32-immaculate-source-lineage.json` with **5 original-source nodes**, **3 internal witness-packet components**, **4 relationships**, linkable page/line locators and withheld-evaluation flags.
- Added adversarial automated checks in `scripts/test_who_m32_source_separation.cjs`: separate source IDs/URLs, page counts **212 vs 12 vs 1**, Shellenberger **not author** of anonymous report, denial **not proof**, 2020 slide deck **not independent 2017 SAP proof**, disputed timeline **not independent corroboration**, 23 M29 pending and 7 M31 pending claim records, and no rating/voting/portrait permission.
- A scoped GitHub **NO DEPLOY** workflow inherits M26–M31 source, release package and Chromium reader tests. The new research source catalogue and this memo are intentionally **not in the public allowlist**.
- No Supabase/SQL/account mutation, Netlify publish, Android release, live Who's Who scores or human signoffs. **Keep `production` unchanged.**

## M33 next

Pursue the **original Navy FOIA briefing version** and cross-reference with the embedded slide images; document primary source quality and disputed components of the timeline with a curated small sample, then inspect outstanding congressional support submissions and follow-up responses. A complete page-by-page independent verification of the timeline and alleged programme would need a separate, much larger properly resourced audit. Retain claim-specific evidence-rating methodology only as a proposal pending **genuine independent editorial approval**; never assign a person-level believability metric.
