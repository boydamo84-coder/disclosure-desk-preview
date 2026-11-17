# M52 — Who's Who source identity, provenance and mobile-return review
_Date: 17 November 2026 · Branch: `prep/who-m52-source-lineage-reader-20261117` · Research/read-only preparation · NO DEPLOY_

## Why this matters

A list of several URLs can accidentally imply that several independent witnesses or independent measurements corroborate an extraordinary claim. M51 distinguished where documents were *hosted*. M52 adds a separate distinction: whether two URLs are **different views of one source**, the **same hearing containing different witness testimony**, an **archive copy of a named agency report**, or separate source types addressing only part of an assertion. This is not an independence score, personal credibility assessment, proof of document-byte identity, or determination that an extraordinary event occurred.

## Reader-visible improvements

- All **23 claim-specific Who’s Who dossiers** now expose a carefully written `evidenceReviewSummary.lineageNote`, headed **How these sources relate** in the existing expandable evidence section. These notes explain why repeated links, later retellings, shared witnesses, records and published models should not be counted twice. They never claim to settle the underlying claim.
- Among the unchanged **84 evidence links**, **28** now carry an optional `sharedRecord:{key,relation}` identifier. Curated groups cover **11 distinct original-record/publication families**; a shared key describes a common documentary source, not necessarily a common eyewitness or common UAP interpretation. A readable small label beside applicable links explains the relationship. Other links are **not** declared independent merely because they are untagged.
- Reader HTML escapes the authored note and the dictionary-controlled relation label. All outbound URLs still pass `safeUrl` and open in a separate tab using `noopener noreferrer`. Only small muted/gold source-lineage styling was added to `who-is-who.html`; the original premium 14-tab navigation, responsive cards and profile behaviour were preserved.
- No change to profiles, claim findings, missing-evidence descriptions, scores, signed votes, portraits, logs, Supabase, accounts, live website or APK.

## Explicitly tagged repeated source families

| Shared family | Links | What is actually shared |
| --- | ---: | --- |
| 26 July 2023 GPO hearing `CHRG-118hhrg53022` | 5 | Same hearing record, with **different individual witnesses** and later references to the proceeding. Different speakers may describe distinct events. |
| 13 November 2024 GPO hearing `CHRG-118hhrg57440` | 4 | Same hearing record across Elizondo, Gold, Gallaudet and Shellenberger. |
| Original July 2023 7NEWS Coulthart upload | 2 | Two timestamps in one original publisher upload, not separate films. |
| Original January 2025 NewsNation Jake Barber special | 2 | Two timestamps in one TV special, not two independent sighting videos. |
| Council Bluffs study DOI `10.1016/j.paerosci.2021.100788` | 2 | One 2022 article cited by both Vallée and Nolan; one retained parent specimen. |
| Chad Underwood's December 2019 interview | 2 | One interview reused as context for Fravor and Knuth. |
| Suffolk Constabulary 26 December 1980 scan | 2 | One contemporaneous police record linked on Warren's and Pope's pages. |
| DoD 27 April 2020 three-video public release | 3 | One governmental publication accessed under different host/path forms; not three independent sensor studies. |
| AARO 2025 Go Fast methodology | 2 | The AARO URL and third-party Black Vault-hosted copy of the same **named report**; identical bytes **not** confirmed. |
| December 1989 KLAS Lazar interview | 2 | Two third-party transcript copies purporting to reproduce one interview; complete source video still unavailable. |
| 18 December 1977 Council Bluffs newspaper clipping | 2 | One reproduced original-era newspaper item shared on Vallée and Nolan profiles. |

**Caution:** A shared record is *not automatically a shared independent event observation*. For example, one parliamentary transcript may contain many different people. Similarly, two interviews of the same alleged programme source are not independent physical corroboration of that allegation. The metadata distinguishes repeated references only. For uncertain links, M52 deliberately leaves `sharedRecord` unset rather than guessing.

## Claim-by-claim editorial notes

The 23 notes cover Grusch; Graves; Fravor; Coulthart; Corbell; Knapp; West; Lazar; Barber; Greer; Warren; Elizondo; Mellon; Loeb; Vallée; Fox; Pope; Gold; Gallaudet; Shellenberger; Nolan; Kean; and Knuth.

Key deliberate distinctions: the two 7NEWS and NewsNation jump links are one recording each; Loeb-led coauthored analyses use overlapping expedition material and are not independent specimen samples; same GPO proceeding does not make different witness accounts identical; Gold and Mellon are policy/records reviews, not event-score targets; the original AARO file and mirror have no verified SHA-256 correspondence; Kean's reporting and later Grusch testimony share an originating claimant.

## No-deploy tests and release boundaries

- `scripts/test_who_m52_source_lineage.cjs`: checks exactly **50** profiles, **23** claim dossiers, **27** unscored roles, **84** links, **23** substantial safe lineage notes and **28** tagged link references distributed across the exact **11** approved family IDs and relation kinds. It also checks family-specific document/video IDs and that editorial percentage and sign-off permissions remain withheld.
- `scripts/test_who_m52_source_lineage_chromium.cjs`: local-only real Chromium over all 23 profiles at **393 px** and five source-sensitive profiles at **320 / 820 / 1280 px**. Checks visible lineage notes, per-link labels, target URLs, external link isolation, no horizontal overflow, on-screen **Back to Who’s Who**, retained original 14-tab dock and no real vote controls. External publishers are not opened by this test.
- `.github/workflows/who-m40-policy-worklist-no-deploy.yml`: extends prior inherited checks and locally built allowlisted-release boundary, explicitly adds M52 branch trigger, new static/browser scripts and exclusion of this internal Markdown report. No publishing job added.
- **Important verification limit:** GitHub Actions exact-HEAD pass or failure has **not** been established via the available connector. GitHub commit-status entries were empty and a PR-only workflow-run lookup returned none; this does not mean runs passed or failed. The test scripts are committed and wired; a real CI result should be inspected before declaring the milestone GREEN. No Android hardware test or actual external-app handoff has been performed here.
- No site/Netlify, mobile APK, SQL, user accounts, member votes, public claim percentages, portrait rights, source enquiry status or private data affected. All 23 underlying reviews remain unsigned research drafts. No personal honesty/believability rating permitted. Existing Pentagon/NARA source enquiry status is `sent_unacknowledged`, not a verified response.

## M53 proposed

Once CI results can be seen, address any concrete failures. Then perform targeted **real Android/browser external-link return behaviour**, and review repeated source families across non-claim Who profiles or Archive case links. Add provenance only when source identity can be established, not by assuming that shared subject matter means identical evidence. Publishing remains gated on explicit approval, real-account voting security checks and independent second-editor review.
