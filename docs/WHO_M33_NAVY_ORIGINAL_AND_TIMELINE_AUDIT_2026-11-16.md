# Disclosure Desk — M33 original Navy FOIA provenance and three historical-source audits

**Date:** 16 November 2026 (Europe/London)  
**Branch:** `prep/who-m33-navy-source-originals-20261116`  
**Status:** Research-only source provenance. **NOT** incident-origin proof, not a verified Immaculate Constellation SAP, not a personal credibility assessment, not a signed independent human review, not deployed.

## Breakthrough: identified the *original* Navy-hosted slide package

The [Navy Reading Room's original **NASA Brief Redacted** PDF](https://www.secnav.navy.mil/foia/readingroom/CaseFiles/UAP%20INFO/UAP%20DOCUMENTS/NASA%20Brief%20Redacted.pdf) is the federal host for the Navy/NASA exchange and 31 August 2020 UAP Task Force briefing that appears as an appendix in Michael Shellenberger's [212-page House submission](https://docs.house.gov/meetings/GO/GO12/20241113/117721/HHRG-118-GO12-Wstate-ShellenbergerM-20241113.pdf).

The House package itself contains **two Department of the Navy FOIA response letters**, both dated **10 October 2024**, to John Greenewald:

| Navy case number | Request date | Subject in letter | Public-file path identified |
|---|---|---|---|
| `DON-NAVY-2021-008741` | 19 July 2021 | NASA/UAPTF interagency briefing email communications | **NASA Brief Redacted** |
| `DON-NAVY-2022-004904` | 23 February 2022 | UAP slide deck reportedly shown to NASA and other agencies | **NASA Brief Redacted** |

See House PDF **pp. 19–20** (one-based PDF index 18–19), with letter text also directly indexed in the original congressional filing. Those letter identities are *not* two independent witness or sensor records; they route two disclosure requests to **the same Navy source file**. The Navy original also contains visible/indexed emails dated **14, 16 and 18 September 2020**, corroborating an interagency briefing exchange. Recipient identities and redactions are preserved as redacted; no private account data was inferred.

### Technical access limitation: exact PDF bytes NOT compared

The Navy's own URL was **retrieved as indexed/extracted PDF content** and matching text from its slides was inspected. The Navy website rejected screenshot requests, and the direct file download attempted during this research did not succeed. Consequently **no byte-for-byte equality, SHA-256 hash comparison, full original page-image inspection, or complete document-equivalence verdict is claimed**. The House's embedded copy was separately accessible via indexed text and selected rendered pages; its release correspondence and identifying slides match in the *examined portions*. M33 records `originalFileByteHash:null`, `fullOriginalReviewed:false`, `exactHashMatch:false`.

## Selected source-to-source checks: slide evidence and limits

Comparison between the Navy's hosted indexed PDF and the House's appended visible document:

1. **Title / date / provenance:** `UAP Task Force (UAPTF)`, dated **31 August 2020**, and Naval Intelligence Activity / Office of Naval Intelligence associations. This establishes an authentic, officially released briefing, **not** any separately alleged 2017 programme.
2. **Mission and scope:** Deck page **2** documents reporting standardisation, safety-of-flight, interagency partners, and attempts to reduce reporting stigma. The Navy's [14 August 2020 formation announcement](https://www.navy.mil/Press-Office/Press-Releases/display-pressreleases/Article/2314280/establishment-of-unidentified-aerial-phenomena-task-force/) independently documents creation of the task force, approved **4 August 2020**. That is independent confirmation of the *organisation*, not independent validation of extraterrestrial technology.
3. **Nimitz/Tic Tac retrospective:** Deck page **4** calls out **14 November 2004**, describes how reports were made and says there was **very limited data to support technical analysis**. This is an institutional retrospective; original 2004 radar, raw sensor files, flight-control synchronization and full witness interview recordings were not inspected. Do not count the 2020 deck as an extra eyewitness or independently measured object speed.
4. **Multiple Sensors, Worldwide Reporting:** Deck page **8** displays redactions and an image panel; neither the original raw file, date/location nor calibration of that panel were independently audited. The headline **does not by itself authenticate multiple independent sensor measurements** for any one named incident.
5. **Current Assessment:** Deck page **10** states that some reports were sensed by multiple sensors, *while* listing **unknown weather or other natural phenomena** as a possible explanation alongside redacted categories. A redacted total/report period means that no specific count can be safely calculated from the public slide.

**Three separate notions must not be confused:** (a) official briefing authenticity, (b) official recognition of UAP reporting, and (c) physical proof of any asserted exotic cause. Only the first two have partial direct source support in this reviewed material.

## Historical chronology: small adversarial sample, not the entire 177-page timeline

The long private chronology embedded in the same House PDF mixes authentic government actions with claims, secondhand anecdotes, purported documents and disputed material. It is **not itself an official historical finding**. M33 isolates just **three clearly labelled examples**:

### 1. 1947 alleged Hillenkoetter / MAJIC memo

The witness-packet timeline describes a **disputed 19 September 1947 document** attributed to Roscoe Hillenkoetter, linked to a privately hosted MJ-12 archive. This records *what the chronology alleges*. No original government issuance/custody chain was established or paper/ink tested.

- The [National Archives' MJ-12 reference report](https://www.archives.gov/research/military/air-force/ufos) identifies serious anomalies in the different **1954 Cutler–Twining** memo and lack of supporting government records. Its criticisms are relevant warnings about provenance but **are not a direct forensic test of this particular 1947 memo**.
- The [GAO's 28 July 1995 summary](https://www.gao.gov/products/154832) records that consulted agencies found no evidence the considered MJ-12 material originated in the executive branch; this is about the *examined materials*, not a complete inventory of every later attributed MJ-12 variant.
- The [FBI Vault's Majestic-12 catalogue](https://vault.fbi.gov/unexplained-phenomenon/search) says an Air Force investigation determined a purported **1988-circulated** memo was fake. It is not a second independent lab investigation of the 1947 Hillenkoetter claim.

### 2. 1954 alleged SOM1-01 recovery manual

A timeline entry repeats an **alleged SOM1-01 special operations manual**, including an interpretation that it might have been planted as disinformation. The alleged origins, original classified registry and custody were **not established**, and neither archival inquiries nor inclusion in a congressional attachment independently authenticates its claims. This is classified in M33 as **unverified document/repeated reporting**, not a verified government spacecraft recovery policy. NARA/GAO are provenance context, not item-specific forensic rulings.

### 3. 2004 Nimitz incident as recapped in an official **2020** Navy briefing

Unlike the two disputed purported documents, the **2020 Navy deck itself is a directly indexed official release**. It contains a retrospective account of reported 2004 aircrew experience, but expressly notes little available technical-analysis data. Its *government provenance* is stronger than a private alleged document; its **underlying 2004 observation remains a separate question**. The deck is not the original 2004 ship's log or raw FLIR.

This makes a useful future pattern for Disclosure Desk: **verified publication ≠ verified extraordinary conclusion**. The structure allows readers to examine why a file counts as official, what exact claim it contains, and what original material is missing.

## Source-review methodology and test coverage

Structured record: `data/who-m33-navy-historical-source-audit.json`. Contains original Navy URL, two FOIA links/case IDs, five textual slide comparisons, four institutional-context references and three historical chronology samples. The parser/QA tests do **not** make live web requests or pretend to repeat human research. They assert citation provenance, sensible chronology, source-family reuse, unknown hash flags and fail-closed editorial restrictions.

- **M26–M32 previous research records preserved:** 50 public profile entries, 23 unsigned claim/recommendation dossiers and 27 public-role/activity records; no new evidence-rating points, human second-editor signoff or member ballot.
- **Internal-only:** Neither the new M33 JSON, this report nor test scripts is included in the public Netlify allowlist. The `who-is-who.html` premium design, existing profile contents, and 14-tab navigation are not changed.
- **Release:** Separate GitHub research branch and NO DEPLOY CI only. Do not deploy to Netlify, change `production`, install RLS/SQL, touch OAuth/users, publish unapproved portraits, or turn on votes. No fabricated "scientific confidence percentage".

## M34 next

1. Obtain directly accessible **original Navy PDF bytes** using an authorised and functioning source for release-to-embedded comparison, and produce page-by-page visual and cryptographic comparison *only if both files are actually available*.
2. Investigate selected disputed timeline entries from **their particular original cited records**, not broad claims about MJ-12; explicitly log which agencies examined which item.
3. Separate raw sensor availability from the Navy's own 2020 retrospective on 2004 Nimitz. Obtain case-specific logs through authorised public releases if any exist.
4. Do not publish claim-specific percentages until **two genuinely independent qualified humans** have reviewed the exact version, any conflicting evidence, rights, source independence and method reliability; community votes also need authenticated distinct-account/RLS/abuse checks and explicit owner permission.

**No deploy or public editorial approval follows from M33.**
