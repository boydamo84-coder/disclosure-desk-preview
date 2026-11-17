# M51 — Evidence link provenance, access fallback and responsive reading QA
_17 November 2026 · INTERNAL PREPARATION ONLY · NO DEPLOY_

## Starting point

M50 source-linked all **23 claim-specific evidence reviews** across the unchanged **50-person** Who’s Who directory (27 remaining activity/role profiles), with **83 public reading links**. The M50 exact-HEAD GitHub Actions result has **not been independently retrieved** in this session: the available commit-status endpoint returned no status entries, and the available workflow-run connector only exposes pull-request-triggered runs (none found). These observations **cannot** justify a CI-green claim. Existing commits and handover were read directly from GitHub.

## M51 implemented

1. **82 unchanged link URLs + 1 repaired host spelling + 1 fallback = 84 reader-visible links.** Steven Greer's 9 May 2001 archive video page had used `https://www.disclosureprojectarchive.net/items/show/6`, which did not load in automated inspection, while `https://disclosureprojectarchive.net/items/show/6` displayed the right video recording, identifier DP-0006, duration 1:55:00 and a curator-provided checksum. The site labels it a personal collection. The original 644 MB media was **not downloaded, watched end-to-end or hash-verified**; the page listing is a source locator, not a verified unmodified broadcast master.
2. **AARO original retained, third-party alternative added.** The official `https://www.aaro.mil/Portals/136/PDFs/case_resolution_reports/AARO_GoFast_Case_Resolution_Card_Methodology_Final.pdf` gave **403 Forbidden** to the automated fetch. That does *not* prove that the original is missing for readers in a normal browser. A 26-page mirror at `https://www.theblackvault.com/documentarchive/wp-content/uploads/2025/02/AARO_GoFast_Case_Resolution_Card_Methodology_Final.pdf` was reachable; its first PDF page was visually inspected and bears AARO/DoD attribution and **6 February 2025** date. No byte-for-byte comparison against inaccessible agency-original bytes was possible. Both links now appear on Tim Gallaudet's evidence list, with the access distinction.
3. **Brazil STM access limitation explicitly disclosed.** The original STM Varginha inquiry index and volume listed in James Fox’s research may be access-restricted. Automated access did not establish their live contents for M51. Both original institutional URLs are retained, labelled as agency-hosted, with visible access notes. Do not silently replace the full original inquiry with a press report or assert that the origin site is gone.
4. **Source hosting classes for every link** in `data/public-people-directory.json`. Counts: 33 `agency_hosted`, 21 `publisher_page`, 15 `independent_archive`, 7 `research_publication`, 8 `video_platform` = **84**. These are *location/format metadata*, not evidence weights, journal quality scores, claims of original authorship or independent witness counts. Government webpages can host statements made by non-government authors. An archive mirror does not independently corroborate the underlying event. Different web links can derive from one original witness or article.
5. **Premium Who reader accessibility.** The existing `evidenceReviewSummaryHtml()` now prints a subdued hosting-label next to each source link and, only where needed, a short access note; it displays one readable caveat explaining source lineage. Labels and notes are HTML-escaped, links continue through `safeUrl()`, open external sites with `target="_blank" rel="noopener noreferrer"`, and remain within existing `overflow-wrap:anywhere` source card styling. No nav, profile, login, photo, vote, score or database code changed.
6. **Static contract** `scripts/test_who_m51_source_provenance.cjs` confirms counts/categories, original-plus-copy distinction, Greer canonical address, STM warnings, safe link schema, draft status, no independent editor sign-off, no rating approval and private report exclusion. M50's existing test is made forward compatible: its 83-link *minimum baseline* remains required and M51's stricter test requires exactly 84.
7. **Isolated real Chromium script** `scripts/test_who_m51_source_provenance_chromium.cjs` opens the existing profile URL at **393 px for all 23 claim dossiers** and at **320/820/1280 px for the four selected Greer/Gallaudet/Fox/Shellenberger cases**. Checks evidence disclosure, correct source link URLs/labels, outbound `rel`, access notes, 14-tab premium dock, absent live vote controls and no horizontal overflow. It **does not visit third-party websites in-browser**; remote requests are blocked. Actual remote link availability remains separate from local layout/link integrity.
8. The existing **NO DEPLOY** workflow `.github/workflows/who-m40-policy-worklist-no-deploy.yml` was extended to trigger on M51 and run source/package/static and the new real-browser script while excluding this internal Markdown report from the strict public release. No production deployment job added.

## Provenance and methodological limits

| Classification | What the label means | What it cannot establish |
| --- | --- | --- |
| Agency-hosted page or filing | The link is on a government, parliamentary or official agency website. | Endorsement, authorship or confirmation of a third-party submission. |
| Publisher or author page | The named publisher, individual or site presents its own account or commentary. | Independent proof or access to underlying classified data. |
| Archival or third-party host | A collector/repository provides a copy, transcript or historical document page. | Original-byte equivalence, original rights, complete custody, or a separate new witness. |
| Research publication or institution | A published research link, DOI or institutional research/finding-aid page. | Complete reproduction of the underlying measurements, validity of assumptions, or a unique conclusion. |
| Video platform | A public YouTube/video listing at its supplied watch URL. | Original raw file custody, uploader verification unless separately confirmed, full transcription, or verified incident footage. |

### Verified access subset on 17 November

- Archive `disclosureprojectarchive.net/items/show/6` loaded with press-conference metadata.
- `www.metabunk.org/threads/gimbal-ufo-a-new-analysis.12333/` opened and was attributable to Mick West with its dated March 2022 original discussion.
- The Black Vault `.../AARO_GoFast_Case_Resolution_Card_Methodology_Final.pdf` opened as 26-page AARO-attributed report and **its PDF page zero was visually checked**.
- AARO original was 403 in automated inspection; the Brazilian STM index did not load from the automated browser; `www` prefix of Disclosure Project collector item failed whereas canonical bare domain loaded.
- **NOT** a blanket 84/84 HTTP health check or complete legal/archival authentication. Do not say so.

## Release gates and next M52

This branch remains prep-only: editorial percentages, signed second-reviewer approval, community voting/RLS abuse checks, new portrait permission and live Netlify/Android publication are all **withheld**. Record original M50 exact-HEAD workflow status and M51 exact-HEAD workflow status once legitimately observable. If a step fails, inspect that specific workflow job rather than claiming success.

M52 suggestions: link-resolution reliability at user/browser level, primary-vs-copy document lineage for repeated UAP reports, versioned last-checked timestamps only when checked, and targeted manual phone verification of the external-link handoff and back navigation. Keep the existing website release queue independent of prep work. If owner chooses a significant live update, do a separate release approval and smoke-test process with the pinned homepage feature explainer.
