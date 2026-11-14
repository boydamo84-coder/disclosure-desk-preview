# R2 milestone 5 — Contradiction Radar source-comparison alpha
Date: 14 November 2026 · Branch: `queue/dd-web-r2-evidence-intelligence` · **NOT DEPLOYED**

## Purpose
Make the first Evidence Intelligence statement-comparison workflow available in the existing Archive case detail. This is an **editorial reading aid**, not a model-authored verdict, automated discrepancy detector, or reputation assessment.

## Implemented
- `assets/evidence-dna.js`: exported `compareClaims(graph, firstId, secondId)`, using the existing validated provenance schema and exact citation/document match. Rejects invalid graphs, the same statement twice, missing statements, and uncited statements. Returns both attributed editorial summaries, linked section locators, source limitations, shared canonical cited source URLs and explicit caution.
- `index.html`: nested **Contradiction Radar · Compare cited statements (R2 alpha)** expandable region in the existing Evidence DNA Archive panel, shown only for curated public cases containing at least two cited draft claims. Two-column source context automatically stacks on narrow devices; links open the original institutional records. The preview compares the two existing draft statements per case; selecting arbitrary statements is **not implemented**.
- Rendlesham Forest draft statements reference the same National Archives page; the panel labels that shared source plainly. Roswell's two archive/GAO citations are separate URLs, but the panel still says independence is unassessed.
- Public data only; no ingestion of private chats, Boards, witness locations, W.NE manuscripts or unpublished documents. No third-party full-text copying or real account migration.

## What this does NOT claim
- The summaries are **not verbatim quotations** and are not automatic contradictions.
- Different dates, documents or descriptions may have innocent methodological reasons. There is no automatic judgement about honesty, witness counts, publisher independence or proof of a UAP explanation.
- No crowdsourced accusation, confidence scoring, hidden AI rewriting or article scraping.
- Historical claims and links remain marked **draft-needs-review**, pending human source checks.
- Only two curated case graphs are included; this is not complete archive-wide coverage or the finished Contradiction Radar.

## Validation and next steps
- Unit checks cover two-citation requirements, distinct statement IDs, canonical shared-source detection, unassessed different pages, and prohibition on declaring a contradiction or independent corroboration.
- Site wiring and strict allowlist are unchanged except for code in already approved public files, with R2 no-deploy CI rechecking exact source and mobile/desktop Chromium.
- Next: manual attribution review, explicit researcher-driven statement selection across source documents, passage-based time/measurement context, disputed/updated statements, accessible comparisons and opt-in export into Boards/W.NE. Only then consider a cautious candidate discrepancy suggestion workflow with mandatory human validation.
- R1 publishes first after its separate checks; R2 must be reconciled onto verified R1 production SHA and get its own QA, physical Samsung acceptance and owner authorisation. **No Netlify deployment, preview, AdSense resubmission or data changes.**
