# M60 — Six source-linked Who’s Who profiles

Prepared on 17 November 2026 (Europe/London), based on M59 `9bf3b66523e0a44f87c8df6ffe626a2ddb12d7af`.

Branch: `prep/who-m60-next-six-profile-research-20261117`.

The user requested the next six profiles. This batch expands the five unenabled M58 candidates and adds Alex Dietrich. Sean Kirkpatrick's existing M59 content is retained. All seven supplementary records now pass the staged-reader gate, producing **57 searchable profiles** alongside the unchanged original 50. These are source-linked research profiles, not exhaustive case validations.

| Profile | Sources and treatment | Source cards | Timeline entries |
| --- | --- | ---: | ---: |
| Robert T. Bigelow | DIA contract briefing, NASA BEAM and TechPort, original CBS interview, Rogan publisher feed, BICS organisational description, attributed Skinwalker/NIDS history | 7 | 5 |
| John Olsen Lear | Museum catalogue, Knapp's filed testimony, two original Coast to Coast listings, UNLV oral-history collection | 5 | 4 |
| James T. Lacatski | DIA context, WEAPONIZED publisher page and feed, released DOPSR correspondence, explicitly inaccessible AARO comparison lead | 5 | 4 |
| J. Allen Hynek | Northwestern finding aid, original 1960 and 1969 manuscripts, CUFOS biography, NARA archival context | 5 | 4 |
| Stanton T. Friedman | Museum collection, two original radio programme records, NARA document-provenance discussion, GAO records search | 5 | 4 |
| Alex Dietrich | Original Goodstory interview/transcript, syndicated Reuters interview, CBS listing, inherited Fravor and Underwood source trails | 5 | 4 |

Each has four biography paragraphs (Bigelow has five), dated milestones, source locators, publication links and specific open questions. Podcast appearances are linked where publisher listings were found. Hynek's CUFOS recordings index and Dietrich's CBS programme are linked without inventing upload provenance or asserting a successful playback. No new portraits or social handles were selected.

## Access and attribution

The internal `data/who-m60-profile-source-audit.json` records 31 distinct URLs and their access level. Its six profile summaries are not a claim that every original recording was watched or every archival box examined.

- **Lear:** UNLV OH-03428 is an aviation/Gold Butte interview collection with digital audio and no transcript listed. It is not a university verification of Lear's extraordinary claims. Museum catalogue search text was available; direct retrieval timed out. The original KLAS master remains a research task.
- **Lacatski:** the DOPSR clearance letter's first page was visually inspected, with selected correspondence text checked. Full manuscript/attachments and interview dialogue were not comprehensively audited. Security-review permission and factual endorsement are explicitly separated. The publisher page and podcast feed describe one production, despite different posting dates. The AARO comparison PDF returned 403 and is labelled as a lead, not freshly reviewed evidence.
- **Hynek:** selected original manuscript text was read; the complete scans were not visually audited. Northwestern's indexed finding-aid text was available while direct access returned 403. The historical papers behind the finding aid were not retrieved.
- **Friedman:** radio listings and synopses were reviewed, not full subscription audio. GAO selected extracted text was checked. Collection preservation and a copy in official custody are not authenticity rulings.
- **Dietrich:** selected original Goodstory transcript and Reuters interview text were checked. CBS metadata was accessible but video playback requested TV-provider access. Fravor's House record and Underwood's interview inherit the earlier M47 review; they were not newly re-audited. Same-encounter observers, repeat interviews and later filming retain their different evidentiary roles.
- **Bigelow:** BICS's indexed first-party organisational description was available, but direct retrieval returned 502. The Rogan feed supplies guest/date metadata; full audio was not audited. HISTORY's Skinwalker ownership account is labelled secondary reporting, not a deed search or inspection of NIDS logs.

## Integration and verification

`appendStagedProfiles` in `assets/people-directory.js` admits only seven explicitly selected IDs with a source-review marker, populated biography/timeline, valid HTTPS references, a rendered source panel and initials fallback. Duplicate IDs, unsafe URLs, incomplete/unreviewed records, added numeric scores and added claim-voting structures are rejected without mutating the original directory.

All six browser journeys were exercised on the actual local candidate in the cloud browser: search by name, open profile, expand source panel, check source/timeline counts, and use Back. **57** results appeared before filtering. Dietrich's inspected layout had **1348 px viewport / 1348 px page width**. This was a desktop browser pass, not physical Samsung, Android WebView, narrow-screen emulation or an end-to-end external-media playback pass. The local static server does not emulate Netlify's extensionless routing; QA used `who-is-who.html` after the extensionless preview link returned `Cannot GET`.

Executed successfully:

- Node syntax check and `test_who_m60_six_profiles.cjs` (actual merge/render functions; malformed/duplicate input and escaping).
- M59 Kirkpatrick regression, M57 worksheet, M52 lineage, M51 source provenance and existing person/case relationship checks.
- Strict 125-file public-candidate build and SHA-256 package-boundary check; internal source audit and development worksheet excluded.
- `git diff --check`.

**Previous confirmed packaging failure repaired:** M59 Actions run `44195996604`, job `134437479116`, failed because `assets/who-community-worksheet-m57.js` was rejected as an unexpected public asset. The builder now explicitly skips this one development-only file and rejects non-regular replacements; it does not allowlist the prototype for release. M57 and package tests enforce exclusion. Unknown files still fail closed.

**Inherited separate failure:** the unmodified M58 world-programmes structural test fails on the France record (`geipan-france` expected; existing catalogue uses `fr-geipan`). M59 already flagged the inherited world-programmes work as unreviewed. M60 does not revise that catalogue or claim its tests pass. The new M60 workflow scopes validation to profiles, preserved source readers and packaging, and contains no deployment job.

## Next handover

Inspect the exact-head M60 Actions run. Continue the original-source/media backlog and narrow-screen/physical-device QA. The broader M57 source-first migration is still incomplete in the inherited homepage, role/claim copy and legacy scalar rating implementation; do not enable that endpoint or imply the new five-criterion community system is live. Source-first copy is applied to the seven supplemental profile readers here, with no numerical editorial score or submission control.

The original 50 people, 23 claim dossiers and four person/case relations are unchanged. Dietrich is documented in her profile but has no newly added graph edge; a future graph update must also update its validation and archive-side person inventory together. No Netlify build/publish, production ref update, database migration, account action, live vote, APK or image-rights expansion occurred.
