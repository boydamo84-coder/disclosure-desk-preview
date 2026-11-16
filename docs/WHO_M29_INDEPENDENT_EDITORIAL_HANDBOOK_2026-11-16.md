# Disclosure Desk — M29 independent editorial-review handbook and source graph
**Date:** 16 November 2026 (UK)  
**Status:** Public-facing **research handoff only**; no scores or signed approvals, no ballots, no personal trustworthiness metric, no live deployment.  
**Development branch:** `prep/who-evidence-m29-editorial-handoff-20261116`

## Outcome and limits

M28a–M28e created a **source-coverage pass for 23/23** specifically attributed UAP claims and research propositions across a **50-person Who's Who directory**. The other **27** profile records cover a documented public role, legislative action or research/publication history; they do **not** have a scoreable incident claim. The 23 source reviews were explicitly limited to selected passages or sometimes indexed source-access metadata; **23/23 is research coverage, NOT 23 verified extraordinary incidents**. Independent physical corroboration, unedited original videos and full custody records remain unavailable for some claims.

**M29 adds a public, read-only review queue**, not a verdict. Each claim now has a structured handoff explaining the original publication, its accessibility, repeated bibliographic links, related case/reporting/study families, possible opposing source references, and six tasks requiring a **real** separately identified editor. No source, person, algorithm or test automatically gets a percentage. No human approval is fabricated.

### What the proposed five-part rubric means

These are **possible maximum weights** from the existing `dd-claim-evidence-v1` proposal, not awarded scores. Until actual qualified independent human review approves the methodology and the specific claim, no number can appear.

| Proposed criterion | Max points | Reviewer evidence needed |
| --- | ---: | --- |
| Original claim recorded accurately and in context | 25 | Dated complete original text/recording with speaker, scope, correct quotation and version provenance |
| Genuine independent corroboration | 30 | Separately originated witness or sensor data, independent laboratory replication or distinct government records, with shared-origin chain eliminated |
| Inspectable direct records, data and custody | 25 | Original radar/IR metadata, source documents, log timestamps, calibrated measurements, verified specimens and custody as relevant |
| Specificity, testable methods and uncertainty | 10 | Defined claims, alternative test predictions, model inputs and error estimates verified to available source data |
| Contradicting records and serious alternatives | 10 | Best available original contrary evidence with scope, limits, applicable date and uncertainty |
| **Total possible, only after signoff** | **100** | **No points assigned in M29** |

The point of this rubric is to assess **the public evidence for one narrowly described claim**. It must never become an individual's personal honesty, trustworthiness, reputation or broad believability percentage. For policy/recommendation records (e.g. Christopher Mellon, Mike Gold), the future **physical-incident evidence score is Not applicable**, even though the original argument can be sourced and reviewed.

### Actual source-independence findings in this repository

The 23 dossiers cite **89 indexed public bibliography entries at 59 distinct literal URLs**. Those are source *references*, not independent witnesses or independent observations. M29 identifies **14 URLs reused across multiple claim dossiers** and **three explicitly shared research-family groups**.

- **One shared peer-reviewed experiment — Council Bluffs (Nolan / Vallée):** both profiles reference the **same DOI, 2022 research team and CB_JV-1 parent specimen**, under `council-bluffs-1977-one-paper-100788`. Count ONE empirical paper and collection, not two independent lab reproductions.
- **Grusch reporting network (Coulthart / Kean):** under `grusch-coulthart-2023-recovery-reporting-not-independent`, different reporting channels discuss overlapping Grusch and source assertions. This is NOT two newly authenticated physical recoveries. It does not rule out distinct confidential sources, which must be assessed independently by an authorised editor.
- **Rendlesham historic case (Warren / Pope):** under `rendlesham-1980-distinct-nights-halt-warren-claims`, the records concern the same historic multi-night event but **different people and different retrospective claims**. The family label does not mean the observers' statements are identical; it flags the need to date, locate and independently check each alleged event.
- **2023 GPO testimony URL:** reused by Grusch, Graves, Fravor and other profiles which cite the public 2023 hearing. A shared transcript contains **distinct speakers**, but the same hosted hearing URL does not certify independent military measurements or the same underlying first-person event.
- **NASA FAQs / DoD broad reports:** public methodological context reused across cases. A NASA FAQ is not case-specific validation; AARO's broad 2024 historical review predates Jake Barber's January 2025 broadcast and cannot be treated as a personal case-specific investigation.
- **Navy imagery:** a later authenticated video does not necessarily record an earlier eyewitness encounter. Cases must separate the 2004 Nimitz firsthand sighting, a later FLIR crew clip, and reported ship radar timelines.

**Important distinction:** A **shared literal URL**, a **shared reporting chain**, a **shared incident or a shared study** are *not identical concepts*. Their presence identifies a follow-up independence question, not a numerical amount of corroboration. Absence of a duplicate link does not establish independence either. This static M29 graph does NOT infer hidden-source identities or add unpublished account data.

## What an independent second-human review actually requires

The web reader contains an **unsigned, unassigned** handoff. A prospective qualified independent editor must separately perform and record each of these checks. A spreadsheet, GitHub commit, scripted test or language-model review **cannot substitute** for a second human's source comparison, conflict-of-interest declaration and signed decision.

1. **Original and context.** Open the original publisher/agency document, correct relevant passages and dates, preserve its version and note whether video/audio, methods or only an abstract or index was actually available. If original unavailable, mark its access limitation; do not silently upgrade.
2. **Source independence.** For each eyewitness, instrument, journalist, researcher or authority, trace whether reports share people, datasets, sensor events, source passages, funders and editorial intermediaries. Republished reporting and coauthorship alone are not new experiments.
3. **Underlying records.** Determine what measurements, original images, physical materials, logs, technical methods or chain of custody are truly inspectable. Preserve unknowns and permissions.
4. **Competing original evidence.** Record strongest independently authored contrary explanations, original records and dates; explain whether they address the precise claim or only general methodology.
5. **Uncertainty and replication.** Require reproducibility of any instrument-based calculation or laboratory finding with raw data and realistic uncertainties, and distinguish source claim from inference.
6. **Rights and privacy.** Check licences for portraits and research documents, legal access, responsible witness privacy and any confidential-source protection.

Only when these **six** checks have individually documented outcomes and evidence citations should an **editor** discuss scoring suitability; the person's profile is still not a target of a credibility percentage.

## Suggested *internal* human review form — blank by design

This is a **template, not a real completed review**. Keep real names, conflict disclosures, private source material and unpublished audit attachments in an approved private process rather than in the public queue.

- Claim identifier and exact wording: **[not filled]**
- Source scope: original speaker / publisher / date / precise locator / access or redaction limitations: **[not filled]**
- Distinct source family identities and underlying records, with any republished duplicates counted once: **[not filled]**
- Case-specific contradictory records, methodological alternatives and uncertainty: **[not filled]**
- Original instrument / material / document availability and rights: **[not filled]**
- Methodology or score suitability, including “Not applicable” where appropriate: **[not filled]**
- Lead reviewer and dated conflict-of-interest declaration: **[not assigned]**
- Separate qualified second human editor, dated source verification and approval or dissent: **[not assigned]**
- Clear publishable reasoning and source citations with privacy/redaction review: **[not approved]**
- Explicit product/release owner permission: **[not obtained]**

There must be a versioned human-created decision with genuinely distinct editorial reviewers before any status flags for a published score are even *considered*. No public M29 data field contains a signed reviewer, assigned points, approved methodology application or publication permission.

### Community voting is separate

Even an approved individual **claim** evidence assessment does not automatically authorize community voting. Member voting requires real authenticated account isolation, signed JWTs, correct Supabase RLS and row ownership, case-specific vote uniqueness, rate/cooldown and abuse protections, testing using two genuinely distinct accounts, and explicit deployment approval. It remains **disabled**. No backend security state was changed by M29.

## Source locations and technical handoff

- **Public, non-authorizing data:** `data/who-editorial-handoff-m29.json`, 23 per-claim pending-review dockets; the proposed rubric; 14 reused literal URLs; three shared research families; no human assignment, no score or vote approval.
- **Public reader:** `assets/people-directory.js` contains fail-closed `parseM29EditorialQueue` and `m29EditorialHandoffHtml`. The drawer appears inside the existing draft evidence reader when the static file is present **and** each record matches the original claim and all approval flags are explicitly withheld.
- **Premium presentation:** `who-is-who.html`, source-independent drawer styling and asset version. Original premium **14-tab** navigation remains unchanged.
- **Public allowlist:** `scripts/build_public_release.cjs` now explicitly packages **only** `data/who-editorial-handoff-m29.json` in addition to the already authorised public assets. `scripts/test_who_public_package_boundary.cjs` checks 23 pending dockets, zero approvals, exact package SHA-256 integrity and no hidden SQL, tests or internal docs.
- **QA:** `scripts/test_who_m29_editorial_handoff.cjs` checks exact 23/89/59/14/3 source graph maths against the original 50 people and prevents fabricated second-human approval. `scripts/test_who_m29_editorial_handoff_chromium.cjs` checks full 23-person reader at 393px and mobile/tablet/desktop samples at 320, 393, 820 and 1280px; role-only people remain non-scoreable, and original links, navigation and closed voting are preserved.
- **No-deploy CI:** `.github/workflows/who-m29-editorial-handoff-no-deploy.yml` runs all M26–M28e inherited source/packaging/browser gates plus M29. No Netlify publish, new Supabase table, OAuth actions, Android release or private account operations.

### Next M30 gates
Priority should be designing a **real confidential independent-review process** and a source version/expiry policy, finishing the most critical original access gaps (original full videos, research paper and archive records), running an adversarial source-reuse/case-link test, and assessing whether the proposed rubric would be reliable on counterexamples. Do not enable numeric scores and member ballots until genuine, separately verified human review, complete backend security tests and explicit owner authorisation.

Before any release, compare the exact then-current `production` / R3, reconcile later mainline changes, rerun end-to-end browser/account tests and obtain explicit deployment approval. **M29 is a development-only evidence-transparency milestone.**
