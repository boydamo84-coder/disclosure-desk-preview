# Disclosure Desk M40 — Source-first review of policy-only Who's Who dossiers

**Date:** 17 November 2026. **Branch:** `prep/who-m40-policy-evidence-worklist-20261117`. **State:** Candidate research and Who's Who reader improvement only. NO DEPLOY, editorial percentages, personal ratings, voting or reviewer signoff.

## Scope and why it matters

The previous M29 dossier worklist has exactly **23** public-claim dossiers, none with a completed independent human second-editor signoff; **27 other Who's Who profiles are role/activity descriptions**. Of the 23, **two are public-policy/records-access proposals** for which an extraordinary-event evidence percentage is not conceptually appropriate. M40 retains all 23, without equating a detailed research checklist with a verified conclusion.

We added `data/who-m40-policy-source-worklist.json` to classify outstanding **source work**, not people or their honesty. Its four non-numeric work lanes are: 2 policy/records proposals, 5 dossiers with original-source access blocked, 2 partial original-document audits and 14 needing more separable underlying evidence. These are *triage counts*, not a count of disproved, true, supported or independent UAP claims.

### Mike Gold — what the actual original says

[Original House Oversight written statement, 13 November 2024](https://oversight.house.gov/wp-content/uploads/2024/11/Written-Testimony-Gold.pdf), original PDF first page **visually inspected** (zero-based 0), along with **pages 2 and 3** covering the proposals. PDF text lines 12–13 explicitly state Gold speaks **on his own behalf**, not for NASA or Redwire. Proposal text includes:
- NASA-led stigma-reduction engagement and symposia; systematic archival searches assisted by AI or machine learning (PDF extracted lines 28–37, PDF screenshot page index 2);
- international scientific cooperation, civilian-pilot UAP reporting with NASA/FAA support, and use of the already operating Aviation Safety Reporting System (ASRS) as a *proposed* means of UAP collection (lines 38–53, PDF page index 3);
- dedicated, calibrated observational instruments if budgets permit (lines 60–62).

A [separate original government transcript of the **same** 13 November 2024 House hearing](https://www.govinfo.gov/content/pkg/CHRG-118hhrg57440/html/CHRG-118hhrg57440.htm) independently confirms the **attribution** (oral Gold statement at transcript ~1040–1053, exchanges ~1832–1858, ~1896–1917 and ~2109–2129). It is a *second publication form of the same testimony session*, NOT independent implementation evidence or a second eyewitness. [NASA's independent study summary](https://science.nasa.gov/uap/) confirms a 14 September 2023 report with recommendations on improving collection, and [the NASA report PDF](https://science.nasa.gov/wp-content/uploads/2023/09/uap-independent-study-team-final-report.pdf) is a separate institutional report, **not a complete line-by-line re-audit here**.

**Correct editorial status:** A sound scientific proposal can be evaluated on practicality, data design, governance, costs and adoption, **not** used as a scored UAP event. The existence of ASRS and the NASA study does not prove **Gold's specific recommendations were actually implemented**, that NASA adopted an AI archival search, or that specialised instruments detected an anomalous object.

### Christopher Mellon — distinguish opinion from NARA's observed records collection

Mellon's own [14 October 2025 republication](https://christopherkmellon.substack.com/p/the-us-government-is-sitting-on-a) identifies an original **11 October 2025 San Francisco Chronicle** opinion. It argues that more federal UAP records should be disclosed and some are overclassified. As a published argument, it establishes what Mellon says, **not an audited inventory of unlawfully withheld records**.

The [NARA RG615 original catalogue guidance](https://www.archives.gov/research/topics/uaps/rg-615) confirms a UAP Records Collection with multiple federal agency record series. The [NARA FAQ](https://www.archives.gov/research/topics/uaps/faqs) states transfers occur on a rolling basis and explains public and restricted/redacted copies. NARA's original [10 October 2024 agency memo, AC 04.2025](https://www.archives.gov/records-mgmt/memos/ac-04-2025), requested transfer of releasable UAP records **identified by October 2024** no later than **30 September 2025**. The [24 April 2025 NARA press release](https://www.archives.gov/press/press-releases/2025/nr25-07) reports received records from ODNI, OSD, FAA and NRC. These *independently establish that the collection and transfer process exists*, not that it is complete, that every agency complied with timing, that any particular withholding was improper, or that the records prove nonhuman activity.

**Correct editorial status:** Mellon can be reviewed on the content of his policy proposal and whether the cited legal/archives mechanisms exist. His experience-based assessment about excessive classification requires item-level evidence and independent case decisions to test; archive volume alone cannot settle it. This is **not applicable to an extraordinary-incident score** and not a personal believability assessment.

## Reader-side improvement

The existing premium navy/gold Who's Who directory now has a small **"Different claims need different evidence"** expandable guide above the directory. Gold/Mellon each have a first-party original, an independent contextual agency link, a deliberately *unresolved* note, and a direct link into their existing profile. It never presents a progress bar, a numerical "evidence score", a personal honesty mark, a ballot or agency endorsement. It adds **no new navigation tabs** and does not modify any claims' underlying public rating fields.

The **M39 Source Verification Tracker** remains staged in Sources and linked from Who's Who. Its NARA and OSD enquiry statuses stay `sent_unacknowledged` as of 17 November 2026; no actual replies have been verified. The feature does not automatically monitor Gmail or FOIA portals. Keep factual updates dated if an agency later replies.

## QA / release constraints

- Source worklist derived from all **23 original M29 handoff dockets** with deterministic lane-by-source accessibility, preserving each docket's source URL and source-family duplicates, with all human/score/vote publication gates still closed.
- New public guide uses **original first-party and labelled original-opinion links**, never copies the full article or unlicensed photos. Original 14-tab navigation and existing 50 profiles stay unchanged.
- `scripts/test_who_m40_policy_worklist.cjs` asserts four lane totals, 2 policy exceptions, source lineage and missing original data, no numeric scores, no publication of internal M40 worklist, visible no-score policy guide.
- `scripts/test_who_m40_policy_chromium.cjs` checks at 320/393/820/1280 pixels that Gold and Mellon expand correctly with original links, that the 14-tab dock survives, no balloting or policy incident score appears and mobile is not horizontally overflowing.
- `.github/workflows/who-m40-policy-worklist-no-deploy.yml` inherits prior M26–M39 source/build/real Chromium tests and adds M40; strict staged release excludes private M40 worklist and this document while retaining M39 approved public tracker assets.

**M41 next:** Advance selected blocked-original cases with original copyrighted source-access checks or alternate primary records; make a per-claim evidence-review status view (not a percentile) only after independent reader verification. Await explicit owner approval for any significant production release. **Do not silently infer a government acknowledgement or respond to emails without user approval.**
