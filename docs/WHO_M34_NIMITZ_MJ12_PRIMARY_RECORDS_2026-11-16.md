# Disclosure Desk — M34 Navy 2004 FLIR video provenance and NARA 1987 MJ-12 reference-report audit

**Date:** 16 November 2026, UK  
**Branch:** `prep/who-m34-source-provenance-20261116`  
**Status:** Original-publication and archival-source research only. Not a claim verification, numerical score, human editorial signoff, public release or production deployment.

## Finding A — Nimitz footage: government acceptance versus original-sensor evidence

**First-party historical source:** [24 July 2020 U.S. Navy Public Affairs briefing card](https://www.secnav.navy.mil/foia/readingroom/CaseFiles/UAP%20INFO/UAP%20DOCUMENTS/PAO%20Briefing%20Card%202020-012022%20and%202022-006563.pdf), **PDF pp. 1–3**, prepared by OPNAV N2N6 Public Affairs. The official document text was retrievable, including its **Questions and Answers** on PDF p. 3, although the Navy source later **rejected screenshot requests**, so no original PDF byte hash or page-image verification is claimed.

Its Q2 explains that footage made during the **2004 Nimitz deployment** was reportedly shared among sailors, appeared online in **2007**, and was reviewed by Navy officials in **2009**. The Navy says it could not establish which crew member released the file. This is the **Navy's 2020 institutional account of release history**, not an independently inspected chain-of-custody log for the original 2004 camera-media master. The briefing card also distinguishes *unclassified* content from authorised public release.

Separately, the [Department of Defense's official release statement, 27 April 2020](https://www.defense.gov/News/Releases/release/article/2165713/statement-by-the-department-of-defense-on-the-release-of-historical-navy-videos/) says that **three** formerly unauthorised Navy clips were formally released: **one recorded in November 2004**, and **two recorded in January 2015**. The Navy already accepted that circulating copies were Navy footage; the DoD characterised what was shown as **unidentified**. Navy origin is not scientific confirmation of an exotic craft, instrument-calibrated speed or the object's precise identity.

An additional [DoD FOIA record release](https://media.defense.gov/2024/Sep/30/2003555596/-1/-1/1/20240822%20UAP%20RECORDS%20RELEASE.PDF) indexes the actual public [NAVAIR FLIR file path](https://www.navair.navy.mil/foia/sites/g/files/jejdrs566/files/2020-04/1%20-%20FLIR.mp4). **That video was NOT downloaded or hashed in M34.** The official statement and the 2024 release index are **provenance of public publication**, not a second independent observation of the 2004 event. The 2020 Navy deck from M33 is another *retrospective about the same event*, not additional independent measured sensor data.

**Not yet obtained:** original 2004 camera memory master, uncompressed video and timestamps, sensor calibration/protocols, original USS Princeton radar tracks, original 2004 aircrew recordings/transcripts and a reproducible motion analysis. **No object-speed finding was made here.**

### The still-blocked Navy source comparison

The M33 [Navy NASA Brief Redacted PDF](https://www.secnav.navy.mil/foia/readingroom/CaseFiles/UAP%20INFO/UAP%20DOCUMENTS/NASA%20Brief%20Redacted.pdf) is still independently identifiable in Navy's official FOIA Reading Room index (listing date **9 October 2024**), but fresh attempts to open the original returned **Request Rejected** and a direct container download failed. The 212-page House witness packet remains a different *container* for the Navy material. This source cannot be promoted from **indexed/text comparison** to a visually or cryptographically proven identical PDF. `originalSHA256=null` and `originalHouseBinaryMatch=false` persist.

## Finding B — Original 1987 NARA report, not merely a modern summary

**Original archival reproduction:** the Ronald Reagan Presidential Library's [digitised Outer Space correspondence folder](https://reaganlibrary.archives.gov/public/2021-06/40-654-209237726-004-008-2021.pdf), indexed text approximately **lines 2670–2834**, contains the **22 July 1987 National Archives Military Reference Branch “Reference Report on MJ-12.”** Its historical provenance is stronger than an unattributed later blog or paraphrase because a contemporaneous federal archival report is reproduced. The PDF source text was retrievable, but screenshot access redirected/failed; a **specific visual page-number and source-PDF hash were not verified**.

That report is **about a particular alleged July 14, 1954 memorandum from Robert Cutler to Nathan Twining**. The report's documented concerns are:
- Filing in **Record Group 341, entry 267, folder T4-1846** without the expected top-secret register number.
- An NSC security marking that the researchers said did not come into use until the **Nixon** administration.
- No found evidence in the inspected meeting records of a **16 July 1954** National Security Council meeting concerning MJ-12.
- Evidence that **Cutler was overseas** when the memorandum purportedly originated.
- The express archive distinction between retaining/certifying a true copy **and authenticating its contents**.

The [modern National Archives MJ-12 webpage](https://www.archives.gov/research/military/air-force/ufos) reproduces or summarises that **same underlying 1987 archival investigation**; it cannot be added as a second independent confirming archive. The reported deficiencies are specific to that **Cutler–Twining memo**. They do **not** constitute an item-by-item forensic test of the separately alleged **1947 Hillenkoetter MAJIC document** or **1954 SOM1-01 manual** described in M33.

### Interesting version issue to research, not to “solve” by guesswork

The archived **1987 text** describes a folder headed *“Special Meeting July 16, 1954”* (extract around line 2778). The live NARA page instead describes a *“Special Meeting July 16, 1956”* (Majestic 12 reference report, point 9). We have **not** reconciled whether this is an original report variant, reading/transcription error or later correction. The old PDF's screenshot operation failed and no certified change history was accessed; therefore M34 logs a **`needs_scan_and_version_reconciliation`** entry, does not silently choose a year, and does not claim that either difference is evidence for or against the extraordinary allegation.

## Assessment and source graph

| Source | What is independently established | What it does not prove |
|---|---|---|
| 2020 Navy public-affairs briefing, pp. 1–3 | Navy's account of video distribution and public-release governance | Exact 2004 footage chain of custody or anomalous performance |
| 2020 DoD release announcement | Department formally authorised distribution of 2004 and 2015 Navy-origin videos | Source object's identity, velocity or nonhuman origin |
| NAVAIR FLIR path in 2024 DoD records | Official location/index of released media | Original 2004 aircraft camera master or full metadata |
| M33 2020 NASA/UAPTF briefing (Navy original blocked) | An indexed 2020 government presentation is identified by source and date | Binary-equivalent House appendix or Immaculate Constellation evidence |
| 1987 NARA archival report | What federal archivists found problematic about the particular Cutler–Twining memo | Authentication of every other alleged MJ-12 variant |
| Live NARA reproduction | Re-publishes the 1987 analysis and contains a date discrepancy requiring follow-up | An independent second archival verification |

The **government provenance of a media file, a witness's testimony, a government source's uncertainty, and corroborated physical performance are distinct dimensions**. An official archive hosting a document authenticates custody or an attributable statement, **not every allegation inside it**. Two government pages repeating the same release statement or the same 1987 report represent **one investigation/source family**.

## M34 QA, safety and next milestone

- New internal metadata: `data/who-m34-nimitz-mj12-primary-sources.json` tracks first-party links, dated release events, first-hand versus retrospective source identity, gaps in original video/radar/FOIA assets, the 1987 NARA source-family alias and its unresolved meeting-folder year discrepancy.
- `scripts/test_who_m34_primary_provenance.cjs` asserts no claim of original Navy PDF bytes or SHA-256, no unauthorised video download, no inferred object performance, no treating a copied NARA report as independent evidence, and **no accidental extra witness/source** from reuse.
- `.github/workflows/who-m34-primary-provenance-no-deploy.yml` inherits the public source/package and real browser checks, while excluding the internal M31–M34 research materials from the public allowlist. **Not a Netlify deployment.**
- The public Who's Who directory remains **50 people**, **23 unsigned claim/proposition dossiers**, **27 activity profiles**; all numeric claim-specific editorial ratings and community votes stay off. No personal honesty or believability percentages, human signoffs, photo-rights changes, SQL/RLS changes, or production branch edits.

**Suggested M35:** Obtain actually readable Navy original and NAVAIR file bytes if freely and lawfully accessible and compare file hashes/embedded media metadata; independently locate original 2004 radar/motion records if public; investigate the NARA 1954/1956 date discrepancy with a real scan or archivist-issued correction. Preserve original wording and document versions instead of upgrading an indexed snippet into an inspected physical record. Any live editorial score still requires qualified independent human review and explicit publication approval.

**M34 is about defensible source provenance, not a case verdict.**
