# Disclosure Desk — Curated Source-First Research Release Candidate RC1

_Date: 18 November 2026, Europe/London_  
_Branch: `release/research-source-first-rc1-20261118`_  
_Base: exact GitHub `production` commit `6b602324d14b834b0ef5ac222d3cae3acbf53a56`_  
_Status: STAGED RELEASE CANDIDATE — NOT DEPLOYED; no live Netlify build, no APK, no Supabase changes_

## Scope and approved decision

The owner approved a curated website update consisting of source-first Who's Who research, internationally verified source and inquiry records, and corresponding premium reader/navigation improvements, while keeping public voting and Community Research out of the general release until separate real-account testing.

**This is not the 426-commit M07 development branch and is not a merge of staged changes.** It was created directly from the currently recorded GitHub `production` branch and copies only audited page/data/script files from `prep/source-m40-public-outreach-register-20261118`. A pinned SHA diff test fails if unrelated edits appear.

### Included website changes

- **Who's Who:** Preserve all 50 existing people and 23 source-specific claim dossiers; add seven independent, source-linked supplementary biographies (including Sean M. Kirkpatrick and Alex Dietrich), for **57 profiles**. Primary source links, source-access limitations, provenance and open questions are exposed without personal honesty judgments or Disclosure Desk editorial percentages. The retired one-number member rating and dual editorial/community score panels remain absent. The future five-criterion discussion is explanatory only and **not a live vote**.
- **Worldwide archives:** New `world-uap-programmes.html` and `assets/world-uap-programmes.js` read-only directory of 23 sourced institutional programmes, historical archives/reports and policy reviews across 18 jurisdictions, with 14 additional countries awaiting original-source verification. The list differentiates dedicated agencies from archives and historical inquiries. It does not infer extraordinary origin or official endorsement from a documented investigation.
- **Sources and inquiries:** The existing Sources & Archives page gains a manual, cited tracker for five enquiries: Pentagon/Navy 151-page referral, independent German GEP reuse permission, Brazilian Arquivo Nacional SIAN correspondence, Library and Archives Canada file-specific copyright permission and the NARA MJ-12 report request. Status is manually maintained, distinctions between reply/FOIA decision/record permission are explicit, and undocumented original-email dates remain marked unknown. No automatic inbox polling, government endorsement, source scraping, paid archive order or private emails are shipped.
- **Canadian licence correction:** The source M40 draft inaccurately said no reproduction licence had been granted. The owner-provided `CROWN 02650 - Boyd, Gary.docx` was directly inspected. Library and Archives Canada permission dated **3 November 2026** covers the specified Hertzberg Institute of Astrophysics material, file **UAR/N66/001-074**, as a **single-use**, non-exclusive/non-transferable licence with mandatory credit. The format-specific Internet/electronic publication boxes were not clearly selected, so actual site reproduction remains on hold pending written clarification; this does not grant broad re-use of other Canadian records. The licence document, private contact information and source pages are **not published** in the website bundle.
- **Navigation/premium layout:** Who → Archive contextual return, updated Who's Who pinned guide and research resource links, existing **14-tab** premium navigation unchanged. No new main bottom tab and no unrelated discussion/news/chat changes.
- **Packaging:** Explicit public release allowlist contains only new site pages, HTML, JS and public source JSON. Existing production R3 Hypothesis Lab remains unaltered.

### Explicitly excluded

- M07 pilot beta Community Research pages, private drafts, publish/revise/withdraw UI, flags, SQL and test credentials. The existing Supabase **two-account server roster is configured**, but this curated release does not expose the beta website interface; current live site's normal member features unchanged.
- M63/M64 five-criterion voting engine, ballots, live community aggregates or claims of real member voting; editorial approvals remain missing.
- Any W.NE manuscript changes, Android APK builds, Supabase schema modification, archive-copy republishing, World programme speculative conclusions, admin/finance/Netlify secrets or unrelated staged changes.
- Anything already present in the recorded production baseline, including R3, Discussions M90, Archive Back M91 and favicon M96, is not reapplied as a separate feature.

### Automated release safety

- `scripts/test_curated_research_rc1_diff.cjs`: pin `production` SHA and allow only the reviewed file paths. The release branch must remain closely scoped.
- `scripts/test_curated_research_rc1_contract.cjs`: checks profile and dossier counts, disabled ratings/voting, external source labels, manual tracker safety, exactly documented LAC licence scope and prohibited automatic publishing.
- `scripts/test_who_m62_source_first_contract.cjs` and `scripts/test_who_m62_source_first_chromium.cjs`: preserve 57 profiles, original source dossiers and all 14 tabs, without RPC calls or numerical ratings on mobile/desktop.
- `scripts/test_who_m39_source_tracker_chromium.cjs` and `scripts/test_curated_research_rc1_browser.cjs`: five enquiry cards, Canada licence wording, 23 programmes, outbound source-link safety, UI search, responsive widths 320/393/820/1280 and no untrusted scripts.
- `scripts/build_public_release.cjs` and unmodified existing `scripts/test_public_release_package.cjs`: exact source file count/hash and **production-shaped** website bundle; exclude internal docs/SQL/voting prototype/RC test scripts. The build does **not deploy**.

Workflow: `.github/workflows/curated-research-rc1-no-deploy.yml`. Consult the newest **exact-head** successful GitHub Actions run before considering release.

### Remaining live deployment gates

1. Confirm the active Netlify production source and publish directory; the GitHub `production` branch is the baseline used for this candidate, not definitive proof of the last deployed Netlify commit.
2. Compare the actual deploy payload and check public source URLs and copyright notes. Ensure the Canadians' electronic/Internet reproduction clarification is sought **before** any documents are mirrored; the tracker itself is only an attributed summary.
3. Confirm navigation, mobile Samsung Chrome/APK links and any CDN cache after one separately approved significant deployment. Preserve the live discussion, chat, W.NE and Hypothesis Lab experience.
4. Do not unlock Who voting or the Community Research publishing pilot as a side effect. The two account pilot needs real browser Auth sessions and a separate, bounded QA release.
5. Update the manually maintained tracker only with independently verified incoming correspondence.

**Current action:** staged candidate and CI; not a production or Netlify deployment. This work is recorded in `MASTER_HANDOVER.md` on the candidate branch.

## Final RC1 responsive QA — verified 18 November 2026

The curated code at commit `9a72b54c01f78c07a1b0aecc5564571f82e47a06` passed **both** jobs of [GitHub Actions run 44411377484](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/44411377484). All 57 profiles, 23 original claim dossiers, five source enquiry records, 23 global records and the existing 14-tab navigation passed their isolated browser tests at 320/393/820/1280px, with no community vote API calls or unresolved page errors. The production-shaped public bundle passed checksum/allowlist checks and excluded every Community Research beta page, ballot prototype and internal SQL.

A stronger full-page mobile test found an existing Sources header Help “i” control overflowing the viewport at 320px, even though the new source tracker itself fitted. The candidate `sources.html` mobile header was changed to wrap its controls below 690px without changing its desktop presentation. The full-page test was reinstated and passed at 320/393/820/1280px in that successful run.

**There was no Netlify or production-branch deployment.** As this document itself is updated after the tested code, use the latest exact HEAD Actions run for final verification.
