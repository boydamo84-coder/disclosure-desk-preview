# M57 — Source-first Who’s Who + member-owned five-criterion evidence assessment
_17 November 2026 · owner-approved direction · design and local non-submitting prototype · NO DEPLOY_

## Decision

Disclosure Desk will **NOT issue an editorial numerical score** to a person, claim, incident or scientific hypothesis. All original research, biographies, source/context/lineage notes, opposing interpretations, legal/role records and research gaps are retained and expanded.

The community may **eventually** evaluate the available evidence behind an **eligible specifically worded claim**, using the same original five weighted methodological categories from M29. The platform still verifies sources and corrects research errors; it does **not** certify whether an object was extraterrestrial or claim what a vote means about an individual’s honesty.

The original M29 rubric is not destroyed: weights **25 / 30 / 25 / 10 / 10**, sum 100, are retained exactly. We repurpose it as an optional **member worksheet**, not as a staff editorial scoring system.

### Member worksheet categories

| Category | Maximum | How the reader should think about it |
|---|---:|---|
| Original claim recorded in context | 25 | Is there an inspectable, correctly attributed primary statement? Documentary attribution alone is not confirmation of the extraordinary event. |
| Independent corroboration | 30 | Separate witnesses, truly independent observation streams and their source lineage, not multiple links to one shared recording. |
| Direct original records and measurements | 25 | Camera originals, radar and other physical measurements, provenance, calibration and custody. Recognise authentic materials without claiming uninspected raw data was verified. |
| Testability and methodology | 10 | Is the exact proposition measurable and independently reproducible with uncertainty bounds? |
| Alternative interpretations and conflicts | 10 | Are the strongest relevant explanations, counter-records and limitations considered fairly? |
| **Total possible** | **100** | Only an individual **complete** worksheet can calculate a personal points total; **not** a truth probability. |

Every category permits **“Not enough information to score”**, represented as **null**. Null must **never** become zero; zero is a deliberate assessment and valid. If some categories are unanswered, show answered-point subtotal and answered maximum but **do not extrapolate** a case-level /100 total. For completed personal worksheets, a points sum is allowed as a **private self-assessment only**.

A later public community summary will show **each criterion’s response distribution, response count and unknown count**, rather than a single misleading headline average. Community opinions are not endorsed as scientific findings and are not evidence of truth by consensus. Include sampling, brigading and self-selection limitations visibly.

### Research-first reader

For every eligible claim card:

1. Exact original quoted or paraphrased claim + date and speaker + original record link.
2. Source trail: role of each witness/data stream; proof of source independence or explicit shared lineage.
3. Supporting original evidence, contradictory records, alternate analyses, any raw-data limitations.
4. Clearly defined five-criterion **member assessment**, tied to the same exact proposition; do not mix basic observation with alleged physics or claimed nonhuman origin.
5. Source and fact-correction links; transparent method changes and access limitations.

The proposed editorial number is retired, including any previously withdrawn private trial such as Fravor’s 54/100. Keep these old internal calculations only as labelled, *non-published research history*. Do not surface them in source pages, news, member summaries or the production website.

### Eligibility and security before voting

- No claim becomes voter-eligible because it appears in a biography. A source-and-scope review must approve **that specific claim**, its current version, its primary source and vote question.
- NASA roles, legislative oversight, participation in commissions, FOIA work, podcasts and scientific recommendations remain source records, not automatically scoreable extraordinary incidents.
- Do not reuse the existing single 0–100 RPC `dd_who_claim_rating_set` for these five metrics. **The current scalar community voting code is legacy and stays disabled**; a separately audited versioned per-criterion ballot must be implemented and tested.
- Eligible signed-in non-anonymous members only. One server-identified ballot per member per approved claim version; enforce server-side schema, points within each category cap, explicit nulls, unique constraint and RLS. Do not trust a client-supplied user ID or claim state.
- A member can change their vote after a moderated cooldown; retain private audit records and anomaly flags for coordinated voting, bots and Sockpuppets. Account verification cannot guarantee one human per account.
- Aggregate only for eligible claim versions, suppress small counts when appropriate, avoid individual ballot leakage. Display *Not enough information* count separately in each category and explain that users self-select.
- No public voting, Supabase migration, active feature flags, editorial scores or Netlify release in M57.

## What is already coded in M57

- `data/who-community-m57-design.json`: governing owner-approved design and release gates.
- `assets/who-community-worksheet-m57.js`: **pure** client-side calculator accepting numeric points or null; refuses invalid or over-max inputs; calculates a personal /100 **only if all five categories are answered**. Does not call any account, network API, localStorage or cookies.
- `scripts/fixtures/who-community-five-criteria-m57.html`: mobile-friendly dark navy/gold worksheet fixture with individual controls, a `Not enough information` option per category, reset, truthful non-submission notice and example Nimitz source links. **THIS IS A LOCAL DESIGN PREVIEW, NOT LIVE VOTING**. Use a local server on the repo root, e.g., `http://127.0.0.1:4173/scripts/fixtures/who-community-five-criteria-m57.html`.
- `scripts/test_who_m57_community_criteria_contract.cjs`: verifies category caps, exact legacy weights, null semantics, zero vs unanswered, partial sums, invalid inputs, zero storage/submission, site staging exclusion and original research count.
- `data/who-m57-all-50-enrichment-queue.json`: an individual, **unscored** research-gaps and verified-source checklist for **all 50 people**. Snapshot resource counts are derived from the actual people directory. These are research TO-DO items, **not new verified sources or media**.
- M57-only no-deploy CI stages the existing allowlisted public website and checks that the **new preview assets and internal data** are not packaged.

### Known migration gap, explicitly recorded

The older production-facing `who-is-who.html`, `assets/people-directory.js` and existing pinned homepage explanation **still describe the earlier dual editorial / scalar community rating plan** on the inherited M56 site source. They currently withhold real score publishing and voting. **M57 deliberately does not silently enable new voting or deploy conflicting partial UI changes**. In the **next staged user-facing migration**, update all three together, remove dual-rating presentation and editorial-score publishing pathway, preserve the substantive original-source readers, and update inherited QA fixtures that explicitly test the former synthetic score. Only after those integration checks are green and owner approves should public copy be updated. Maintain backward compatibility for the research content, not the retired numerical verdict. A new backend is needed for actual member per-category submissions and aggregated results.

## Enrich EVERY person without padding

The full individual worklist covers all **50** Who’s Who people (the existing **23** claim-linked dossiers and **27** research-scope role/activity profiles), including source-check priorities, missing podcasts, videos, film credits, publications, social identity checks, profile portrait rights and safe case link research. Real sources are only added when independently checked, with source date/locator and an explanation of what they establish. Never invent a podcast, documentary credit, case association, social account, photo right or independent witness count. Shared government archives and hearing records remain distinguished from genuinely independent underlying observations.

**M58 next:** stage the new source-first claim UX on actual Who’s Who pages, replace synthetic editorial score paths and old homepage two-score explainer, build a mobile browser integration test, then plan the signed-in criteria ballot and audited Supabase security as a separate owner-approved phase. No assumptions that this M57 development branch has passed Actions or is live.
