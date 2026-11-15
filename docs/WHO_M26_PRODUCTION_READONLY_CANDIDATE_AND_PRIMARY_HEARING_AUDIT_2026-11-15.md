# Who’s Who Milestone 26 — primary-source spot-checks and clean production-based read-only release candidate

**15 November 2026 (Europe/London) — completed, NOT DEPLOYED**

## Actual separate candidate and green run

- Production baseline: `6b602324d14b834b0ef5ac222d3cae3acbf53a56`.
- Research branch: `feature/who-evidence-score-framework-20261115`, contains source audits and **unapplied** SQL voting drafts.
- **Release preparation branch created directly from production:** `prep/who-evidence-readonly-m26-20261115`.
- **Last exact green tested candidate SHA:** `e25eb6d0be5ba4d4c929dee583f262eda1d05146`. [GitHub Actions run 43768161801](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43768161801), final **SUCCESS**, source/package and real 4-viewport Chromium browser jobs **BOTH successful**. [Previous candidate run 43767845587](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43767845587) and [source/photo update run 43768149887](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43768149887) also SUCCESS.
- The initial candidate workflow definition on `e526605...` was rejected before jobs were started, with run `43767542218` marked FAILED (invalid workflow configuration). It was replaced by a simpler branch-specific Actions workflow; no invalid run is being counted as a pass.

The exact final GitHub comparison of candidate to unchanged production shows **only four existing website files modified**: `index.html`, `who-is-who.html`, `assets/people-directory.js`, `data/public-people-directory.json`. A new candidate-only **no-deploy** workflow and five local test scripts are additional source-controlled files, **NOT** included in the public website build. This avoids merging the 307+ commits from the research branch and leaves all existing production cloud/W.NE/R3/navigation files at their production versions.

The production-derived `scripts/build_public_release.cjs` produced **117 allowlisted public files** with hashes individually verified by `scripts/test_who_public_package_boundary.cjs` (source-only research-branch M23 snapshot produced 116; the current production base is the authority for the 117-file candidate). No draft SQL, Auth token script, test fixture, private R3 data or `docs/` file was included in the public package. **No Netlify deployment or Supabase migration was invoked by this milestone**.

## Genuine first-party transcript re-check: three distinct kinds of testimony

**Source:** [U.S. Government Publishing Office, July 26, 2023 UAP House hearing full public HTML](https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm), Serial No. 118-53.

1. **Ryan Graves — personal sensor accounts versus teammate’s near-miss.** He testified about the 2014 Navy working area and repeated sightings. In the Rep. Raskin follow-up (HTML transcript lines approximately 2725–2753), he was asked if he was aboard the aircraft reportedly about 50 feet from a dark cube inside a transparent sphere; **he answered that he was not**, but spoke to the pilot after landing. These are not two identical eyewitness testimonies. The committee transcript confirms that Graves relayed this report, not that the original flight-safety file, sensor output or other pilot’s complete statement was independently reviewed.
2. **David Fravor — firsthand sighting versus a second crew’s later footage.** In his opening statement (about lines 838–900), Fravor described personally seeing the object in 2004 and said a **later aircrew** went out and recorded the 90-second video. In questions from Rep. Langworthy (about 2437–2454), he distinguished his own aircraft fire-control radar, which he said did **not** detect the object, from reported Princeton/Nimitz/E-2 tracking and the later video aircraft’s radar interaction. Hearing testimony concerning unreleased raw radar is not a release of that telemetry. The [Department of Defense April 27, 2020 release](https://www.defense.gov/News/Releases/Release/Article/2165713/statement-by-the-department-of-defense-on-the-release-of-historical-navy-videos/) authenticated public Navy clips (one dated 2004, two 2015), but the release describes depicted UAP as *unidentified*; that alone does not prove origin or extreme velocities.
3. **David Grusch — alleged programme reports versus directly observed material.** In his opening statement (about lines 767–818), he said his testimony drew on information from other individuals, and that he was informed of alleged secret retrieval/reverse-engineering programmes. When Rep. Burlison asked about alleged bodies (about 2130–2140), he stated **he had not personally witnessed them**; on claimed spacecraft he deferred specifics to a closed session. The transcript therefore confirms his publicly attributable testimony, not an independently demonstrated recovered device, specimen or programme.

A new structured `sourceAudit.m26DirectHearingSpotCheck` field was added to those exact three profiles with source URL, date, direct-versus-reported attribution, uncertainty, and explicit `independentSecondHumanEditor:false` and `permissionToPublishPercentage:false`. Existing visible `sourceAudit.original.locator` and `independentEvidence` text was enhanced to convey these distinctions in the real Who reader. All original `fullOriginalReviewed:false`, `secondEditorSignoff:'not_obtained'` and editorial approval `withheld` flags stay unchanged. The check is **source-level**, not a whole original-case/sensor forensic investigation or a second human editor review.

The test `scripts/test_who_m26_hearing_spotchecks.cjs` safeguards those distinctions, three exact source links, the number of 50 profiles/23 claim drafts/89 research entries, and zero numeric or portrait approvals. Both original research-branch read-only workflows completed successfully after this update: [editorial run 43768127133](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43768127133) and [source + Chromium run 43768116740](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43768116740).

## Wikimedia Commons photo chain — promising metadata, NOT legal signoff

A public [Wikimedia Commons still of the July 26, 2023 hearing](https://commons.wikimedia.org/wiki/File:US_congressional_hearing_on_UAPs_on_26_July_2023_with_Grusch_Graves_and_Fravor.png) explicitly identifies an extracted frame from the House Oversight hearing video/WebM. Its file page lists House federal-government authorship and **US federal public-domain** status. The [individual David Grusch still’s Commons page](https://commons.wikimedia.org/wiki/File:David_Grusch_giving_testimony_on_26_July_2023_before_the_US_House_Subcommittee_on_National_Security_the_Border_and_Foreign_Affairs.png) also identifies a screenshot from the House hearing, uploader, date and the same US-public-domain listing. The Ryan Graves individual crop file was linked from the group page but was **not directly retrievable** during this check. Commons licence templates are **not proof of original camera ownership, non-US re-use treatment, framing or any independent legal/portrait clearance**.

Added conservative `photoRightsAudit.m26HouseFootageChainCheck` source fields for **Graves, Grusch and Fravor**. For Fravor the potential House hearing image is only a candidate in `rightsFollowup`: his displayed **initials fallback remains unchanged**; no new portrait was inserted or selected. Two existing Commons-catalogue portraits were not changed. Every single `finalRightsApproval` remains **false**; the 20 existing catalogue picture listings and 30 initials fallback profiles are preserved.

## Release gate

| Component | Outcome |
| --- | --- |
| 50-person public Who reader and mobile/desktop navigation | **Read-only candidate tested green**, separate from live site |
| Source-independence and first-party witness distinction | **Three new exact hearing spot-checks**; overall 23 claim studies still provisional |
| Production-derived four-website-file change scope | **Confirmed** |
| Public package boundary and full SHA-256 manifest | **117 files checked**, no internal draft SQL/fixtures |
| Human second-editor complete case review | **Not obtained**; zero claim percentages |
| Independent final photo-rights/editorial approval | **Not obtained**; zero new portraits signed off |
| Live signed community ballots and percentage backend | **Still disabled/unapplied**, earlier GoTrue tests were synthetic-only |
| Live website or Android release | **No deployment** |

This milestone is best understood as a ready-to-review **technical candidate for an unscored, more transparent evidence reader**, **not** approval to activate numeric ratings or new unreviewed likenesses. Production has not changed. Prior exact code GoTrue M25 token/session tests remain recorded in `docs/WHO_M25_ACTIVE_SESSION_REVOCATION_AND_NO_DEPLOY_RELEASE_QA_2026-11-15.md` on the research branch.

**Proposed next milestone M27:** have the owner visually review the read-only candidate, confirm editorial/source wording and portrait-use policy, then (only on explicit controlled go-ahead) stage a significant Netlify publish from a production-derived release while keeping all vote SQL uninstalled. Update the pinned homepage news overview only with actual live availability and instructions after post-deploy checks. Separately obtain **real, named independent human case and photo reviewers**, and complete actual hosted Supabase session/exposed-schema checks before any claim-level 0–100 editorial rating or community vote is enabled.
