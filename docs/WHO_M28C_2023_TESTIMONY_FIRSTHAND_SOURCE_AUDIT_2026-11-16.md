# Disclosure Desk — M28c: first-person versus relayed source lineage
**Date:** 16 November 2026 • **Stage:** development-only, source-limited, unapproved • **Branch:** `prep/who-evidence-m28c-testimony-lineage-20261116`

## Scope
Compared selected original official 26 July 2023 House/GPO testimony passages across **David Grusch, Ryan Graves and David Fravor**, plus **Christopher Mellon's original-author-republished October 2025 policy article**, against **the National Archives' own UAP Records Collection page** for administrative context. These are **12 passage checks across four profiles plus one separate NARA institutional-context source**. None entails review of complete classified programme files, original flight-sensor recordings, confidential witness identity, or every related publication. No additional editorial percentage or community ballot is authorized.

Source records:
- U.S. Government Publishing Office, *Unidentified Anomalous Phenomena: Implications on National Security, Public Safety, and Government Transparency*, 26 July 2023, witness testimony and member questions, https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm
- U.S. House committee's own witness list, https://oversight.house.gov/hearing/unidentified-anomalous-phenomena-implications-on-national-security-public-safety-and-government-transparency/ — **same hearing**, not an independent incident observation.
- Christopher Mellon, signed reprint dated 14 October 2025 of the 11 October 2025 *San Francisco Chronicle* opinion, https://christopherkmellon.substack.com/p/the-us-government-is-sitting-on-a
- National Archives and Records Administration, UAP Records Collection, Record Group 615, https://www.archives.gov/research/topics/uaps — **official administrative existence and transfer guidance**, not proof any particular allegation is true.

Passage locators use the directly retrieved original GPO HTML sections / lines at the time of checking. Browser word wrapping may change display line positions; section titles and named questioners are the durable find-in-document cues.

## Firsthand, secondhand and records distinctions

### David Grusch (GPO July 2023)
1. **Opening statement, HTML lines 767–791:** explicitly says he received information from other serving/former officials, describes interviewing and checking claims, and frames testimony as facts relayed to him. This independently verifies his attributed speech, not inaccessible source documents or material.
2. **Rep. Garcia question, lines 1189–1198:** says his belief in government possession was informed by interviews with more than forty people, and claims firsthand informants made protected disclosures. The original protected disclosures and identities are not publicly inspected here.
3. **Rep. Burlison question, lines 2130–2139:** declines to discuss alleged craft observations in the public session and states he personally had not seen the alleged bodies. Do not describe his recovery allegations as independently observed biology by him. The status of anything potentially discussed in a classified session remains outside this pass.

**Verification blocked:** lawful independently accessible original programme authorisations, separate primary witness accounts, chain of custody and an independent second editor. AARO's broader 2024 competing programme review is already represented by the existing dossier, but no new AARO full report audit was performed in M28c.

### Ryan Graves (GPO July 2023)
1. **Opening, lines 691–700:** describes NAS Oceana 2014 operational context, radar upgrade and correlations with infrared and some visual observations; the raw sensor files are unavailable in this review.
2. **Opening W-72 near-miss, lines 700–708:** reports two F-18 aircraft reportedly passing within 50 ft of a cube-in-sphere-like object, followed by an asserted safety report; the report itself was not supplied by the hearing transcript.
3. **Rep. Raskin, lines 2725–2753:** Graves expressly said he **was not** on either near-miss aircraft and heard the returning pilot describe it. This is firsthand testimony to *receiving the report*, not firsthand sight of that near miss.

**Verification blocked:** contemporaneous safety record, aircraft logs, original pilot interview, sensor calibration and independent witnesses with non-overlapping sources.

### David Fravor (GPO July 2023)
1. **Opening, lines 839–878:** his own firsthand airborne visual observation of a white Tic Tac-shaped object and manoeuvres. Testimony supports attribution, not calibrated kinematics or origin.
2. **Opening, lines 880–893:** the fast transition to the CAP point was **relayed by a controller**, not published radar tracking; a **different crew** captured the well-known video on a **later sortie**.
3. **Rep. Langworthy, lines 2437–2454:** Fravor says his own aircraft's fire-control radar did **not** acquire the object; tracking and reported jamming were associated with other platforms and later pilot reports. Video authenticating agency provenance is not independent confirmation of full trajectory and acceleration.

**Verification blocked:** complete contemporaneous ship/E-2 radar and cockpit records, original FLIR metadata, dated sortie/flight logs, independent geometry and source review.

### Christopher Mellon (2025 signed opinion plus NARA)
1. **Substack signed reprint, lines 13–16:** Mellon describes his former intelligence roles and his personal experience of an institutional overclassification pattern. The article is firsthand about his stated view, not a public audit of every classified record.
2. **Lines 19–25:** argues classified practices restrict research and cites federal legal obligations to disclose or transfer appropriate records. His argument is a published legal/policy position, **not a judicial finding** that any particular classification violated law.
3. **Lines 26–33:** describes intended Freedom of Information Act action and argues benefits of greater transparency regardless of whether a particular anomaly is conventional. Intent to request documents is not proof of FOIA success, physical extraterrestrial evidence or compulsory publication of every record.
4. **NARA official RG 615 page:** confirms a statutory UAP collection and transfer/accession process with ongoing accession, not a full count or judgement on all allegedly withheld material. Author Substack reprint and original *Chronicle* opinion are **one article**, not two independent investigations.

**Scoring:** Mellon's advocacy/policy record is **not applicable to an incident evidence percentage**. The source-reader must retain that designation even while allowing readers to read and assess the policy rationale themselves.

## Implementation and safety
- `data/public-people-directory.json`: source-audit records `sourceAudit.m28cFirstPartyCheck` on precisely four person-specific **existing** claim dossiers, with explicit evidence kinds, first-party locators, limits, source lineage, further source requirements and withheld publication permissions.
- `assets/people-directory.js`: `m28cFirstPartyCheckHtml` displays a separate escaped source-vs-relayed/policy disclosure under the already existing evidence list, only for valid data records with full independent approval *explicitly withheld*.
- `who-is-who.html`: matching premium navy/gold source drawer and versioned asset key.
- `scripts/test_who_m28c_firstparty_lineage.cjs`: fail-closed data integrity and no-score checks.
- `scripts/test_who_m28c_firstparty_lineage_chromium.cjs`: actual Chrome at **320, 393, 820 and 1280 px**, source links, labels, navigation, no active scores or voting controls, no horizontal overflow.
- `.github/workflows/who-readonly-m28c-testimony-lineage-no-deploy.yml`: extend **all preceding M26, M27, M28a and M28b** source/package/browser gates.

All staged changes are isolated; no production or Netlify deployment, Android APK, account/database/SQL write, portrait approval or community voting. The live 14-tab navigation remains unchanged.

## What is not yet complete
M28a checked four profiles, M28b four, and M28c **four**; this gives **12/23** claim/recommendation dossiers with additional targeted original-source passage checks. **11 remain** for this added level, but **all 23** still need independent second-*human*-editor assessment, independently corroborated evidence where available and an explicit publication decision before numeric ratings can appear. **27 role/publication-only profiles** remain outside event ratings.

Next M28d should prioritize inaccessible original broadcasters/full video (Jake Barber, Bob Lazar, Ross Coulthart and Larry Warren), then remaining archival/publication and science dossiers without treating a syndicated programme package as independent corroboration. Avoid claiming direct original-video transcript review until actually inspected; document any access denial accurately.

## CI
No-deploy GitHub Actions workflow: https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43838726139. The branch is not eligible for any release merely because a source-text test passes; always check exact tested SHA, real-browser status, updated production compare and separate release approval.
