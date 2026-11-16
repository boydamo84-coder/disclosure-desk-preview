# Disclosure Desk — Who's Who M28b: four original-publication source comparisons
**Date:** 16 November 2026 (Europe/London)  
**Branch:** `prep/who-evidence-m28b-original-sources-20261116`  
**Safety:** PROVISIONAL RESEARCH ONLY — not independently approved, not numeric scores or community voting, not deployed.

## What this milestone does

Following the green, source-limited M28a review of four witnesses at the 2024 House hearing, M28b inspects **four very different types** of source: original public optical interpretation, original mathematical model, original published investigative reporting and an original peer-reviewed laboratory paper. The checks answer **what was publicly claimed, calculated or reported**, not whether any extraordinary explanation is true.

Every item below is independently openable by a reader, with precisely located passages and limits. **No second human editor has approved any dossier**. No character, truthfulness or overall person score is produced.

## 1. Mick West — 2022 Gimbal analysis
**Original first-party source:** https://www.metabunk.org/threads/gimbal-ufo-a-new-analysis.12333/

- Original authored Metabunk post #1, dated 13 March 2022: West argues that rotating infrared glare plus tracking-pod motion can reproduce apparent object rotation. He specifically does **not** claim this identifies the target or dismisses every possible UAP.
- That post links the original simulator, related discussions, source-code ZIP and project data; this pass checked the original author post and linked file list, **not** the working software or the correctness of its output.
- Same paper/thread, video and code can all be presentations of related analysis: **not three independent instrument measurements**. Full sensor geometry, original uncompressed footage, pod angle logs and a separate repeat implementation are still needed. Competing interpretations remain open and must be sourced separately.

**Classification:** technical imaging hypothesis, not target identification.

## 2. Kevin Knuth — 2019 peer-reviewed conditional acceleration model
**Original first-party publisher HTML:** https://www.mdpi.com/1099-4300/21/10/939

- **Entropy 21(10), 939, published 25 September 2019**, section **2.4.1 Senior Chief Operations Specialist Kevin Day (RADAR)**: the reported Nimitz descent comes from Day's account. The authors say they did not have detailed radar data to reconstruct acceleration directly.
- The model's altitude change is **8,530 ± 90 metres** and its assumed time interval **0.78 ± 0.08 seconds**. It assumes equal acceleration for half the interval and equal deceleration for the remainder.
- Section 2.4.1 and **Figure 3B** produce a **modal estimated 5,370 g** (approximately –820/+1,430 g uncertainty) and mean 5,950 g *conditional on those inputs*. The paper explicitly also considers that observations may be fabricated or seriously erroneous as alternatives. The figures are **not** independently verified original 2004 radar measurements and should never be described as such.
- A university repository linking the same journal paper is **one publication**, not independent measurement. Fravor's first-person later testimony does not independently time-stamp the separate Day descent. The author's calculations and conclusions should be independently replicated using validated source data.

**Classification:** conditional mathematical model, not direct radar verification of a 5,370-g event.

## 3. Leslie Kean — original June 2023 investigative reporting
**Original signed report:** https://thedebrief.org/intelligence-officials-say-u-s-has-retrieved-non-human-craft/

- The **5 June 2023** article is signed by **Leslie Kean and Ralph Blumenthal**. Opening paragraphs say other active and retired officials supplied supporting accounts of alleged covert recovery activity. This is a published claim by reporters about their sourcing, not a publicly verifiable inventory of those officials.
- The article publishes on-record remarks from **David Grusch** and **Christopher Mellon**. Repeated later summaries and Grusch's July House testimony support **attribution of allegations**, not independent recovery of any object.
- It describes a U.S. DoD prepublication/security review of some statements. Permission to make a statement publicly does **not** establish official agreement that the statement is true.
- Public text does not expose each confidential source's firsthand knowledge, interview evidence, source independence or physical samples. Respect confidential sources; require a separately controlled editorial review rather than pressuring them to reveal private identities publicly.

**Classification:** source-backed journalistic assertion, with public limits on externally verifying unnamed sources.

## 4. Avi Loeb — original 2024 Pacific-seafloor spherule chemistry
**Original open-access Chemical Geology paper hosted by the authors' Harvard project:**  
https://galileo.hsites.harvard.edu/sites/g/files/omnuum6371/files/chemical_classification_of_spherules_1-s2.0-s0009254124004959-main.pdf

- Visually checked **printed pages 1, 3 and 11** of the actual 20-page paper (PDF zero-index pages 0, 2 and 10). The abstract describes ~850 physically retrieved small spherules, a chemical taxonomy, probable terrestrial D-type particles and many uncertain origins.
- Critically, **section 3, printed page 3** explicitly says the investigators cannot demonstrate any recovered particle came directly from **IM1**, despite seafloor surveying near its estimated path.
- **Printed page 11, figures 15–16 and sections 6.2–6.4** compare chemical signatures with meteorites and terrestrial igneous materials; that comparison is a legitimate analytical method, not proof of interstellar origin, a spacecraft or manufacture.
- **Contrasting paper (independent authors):** Rudraswami, Singh and Pandey, *Chemical Geology* 677 (2025) 122628, original publisher abstract/highlights https://www.sciencedirect.com/science/article/pii/S000925412500018X — argues the majority of disputed spherules have volcanic origins.
- **Same-team follow-up (not an independent expedition):** Hyung, Cherston, Jacobsen and Loeb, *Chemical Geology* 677 (2025) 122627, original publisher abstract/highlights https://www.sciencedirect.com/science/article/pii/S0009254125000178 — some D-type morphologies interpreted as terrestrial, others potentially mixed.
- Both **2025 publisher full-text article URLs returned 403** to the direct reader during this check. The research record clearly labels them *publisher-indexed abstracts/highlights only*, **not** complete original papers reviewed. No blinded independent laboratory or complete twenty-page paper/supplement analysis has been performed here.

**Classification:** verified publication describing actual materials measurements, with unproven links between particles and a particular fireball and disputed origins.

## Source-lineage / independence warnings

1. A published first-party statement confirms **that statement was made**. It does not, without more, verify a claimed secret programme or object's characteristics.
2. A replicated link, journalist summary, simulator, DOI index or coauthored follow-up is not automatically **independent corroboration**.
3. A mathematical acceleration estimate is only as secure as its reported timing, range, model and measurement uncertainty.
4. A real laboratory measurement and chemical classification can be valid without proving a specific meteor-to-particle origin or alien technology.
5. A source-indexed abstract with blocked full text must be labelled as an **abstract-level** check.

## Repository changes and QA

- Structured source-check fields for exactly four profiles: `data/public-people-directory.json` → `sourceAudit.m28bOriginalSourceCheck`.
- Escaped, HTTPS-validated, accessible navy-and-gold source disclosures: `assets/people-directory.js` and `who-is-who.html`.
- New source integrity and safety contract: `scripts/test_who_m28b_original_sources.cjs`.
- Four viewport real-Chromium acceptance: `scripts/test_who_m28b_original_sources_chromium.cjs` (320, 393, 820, 1280px).
- New no-deploy workflow reuses **all** M26–M28a contract, package and Chromium gates: `.github/workflows/who-readonly-m28b-original-sources-no-deploy.yml`.

This update leaves the original **50 profiles, 23 claim/recommendation drafts, 27 role/publication-only profiles, 89 evidence references, M28a GPO source checks, original premium 14-tab navigation and all R3 website functionality intact**. **Eight** of 23 dossiers have now received an additional dedicated M28 passage-check entry (four M28a + four M28b); the remaining **15** require that additional level. All 23 still lack independent editorial approval and no score is authorized. The 27 role-only profiles remain non-scored.

## Still blocking score/vote/live release

- Independently source-check the **15 remaining** attributed claim/recommendation dossiers; independently adjudicate context and conflicting documents for all 23.
- Independent, named *human* second-editor approval is not something automated GitHub tests can grant.
- Proposal of a claim score requires explicit, criteria-by-criteria source evidence and genuine corroboration, not a person's overall credibility.
- Community voting still needs two real account/JWT security tests, RLS authorization, cooldown/rate controls and a separately approved backend before any on-site ballot.
- Original photo creator, licence, attribution and separate rights approval must be recorded before new image deployment.
- Never merge M28b or change GitHub production, Netlify, Supabase, Android, public profiles or account data without fresh release review and owner approval. The live site is an independently controlled R3 baseline.

## Exact CI status
M28b's first no-deploy workflow is on GitHub at https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43835915208. Check conclusion and exact tested HEAD before describing the candidate as fully QA-green.
