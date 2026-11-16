# Disclosure Desk — M29 independent claim-evidence editorial review protocol
**Draft date:** 16 November 2026 (UK)  
**State:** INTERNAL WORKFLOW TEMPLATE — no human editor has been assigned or signed; no scores, community ballots, photo rights, site deployment or editorial approval are authorised.
**Branch:** `prep/who-editorial-m29-readiness-20261116`

## Purpose and non-negotiable distinctions

Disclosure Desk may ultimately show **a claim-specific editorial assessment of the strength of publicly available evidence** and a **separately aggregated signed-in community assessment**, subject to responsible design and release approval. Neither is a rating of the person's honesty, their general trustworthiness, or a mathematical probability of extraterrestrial origin. A policy recommendation, researcher career or reporting activity is **not an incident** and must remain `Not applicable` where an incident metric makes no sense.

M28a–M28e achieved **23/23 source-review coverage**, not physical confirmation. Many original master videos, private witnesses, historical logs, scientific full texts, sample chains or underlying raw sensor streams remain unexamined or unavailable. A publisher's signed article, committee hosting, DOI, syndicated report or interview proves attribution to the extent of the accessible record; it does not independently establish every underlying claim.

The new `data/public-who-editorial-readiness-m29.json` is **entirely a public research-handoff checklist**. It deliberately has **no score weights**, no percentage, no actual assigned reviewer, no private contact info, no ballot data, no signoff date and no "approved" path. M29 is not a content-management/authentication system. Public read-only browser data cannot grant permissions.

## Seven mandatory areas to be checked independently

| ID | Editorial gate | Primary requirement | Current stage |
|---|---|---|---|
| 1 | Exact claim and firsthand scope | Use the actual attributed words; separate direct witness, journalist, secondhand source, model or policy opinion | First passage indexing only |
| 2 | Original-source access/provenance | Direct primary document/video/methods with locator, master/file condition, access denials, archive rights, chain of custody where relevant | Not signed off |
| 3 | Source independence | Disentangle shared hearings, same interview, syndicated republication, same scientific paper/specimen, competing eyewitnesses and independent instrumentation | Not signed off |
| 4 | Contrary sources | Locate strongest accessible competing original records and plausible alternatives; avoid selective quotation, categorical dismissal or unearned certainty | Not signed off |
| 5 | Technical/physical documentation | Where applicable reconstruct measurements, uncertainty and sample custody; for policy set explicit incident `N/A` | Not signed off |
| 6 | Independent human editorial review | Assign a real qualified second human distinct from initial researcher, disclose conflicts, record concrete checked materials and an attributable signed decision | **No reviewer assigned** |
| 7 | Publication rights and security | Confirm legal citation/media/portrait use; publication release approval; separately test authenticated voting and rate abuse controls | All withheld |

**No numeric weights or scoring formula have been approved.** Establishing score categories and calibration requires a *later* explicit, documented proposal, independent sample-case pilot, consistency checks and owner approval. If original sources are blocked or the evidence cannot be assessed responsibly, use `Not assessed` with a factual explanation rather than an invented zero. A finding of insufficient publicly available evidence is not a finding of dishonesty.

## Original-publication graph and attribution rules

M29 has **23 claim records and 17 distinct original-publication URLs**. This is a count of *URL families*, not independent incidents, eyewitnesses or experiments. Three public-publisher families contain multiple profiles:
- **2023 GPO House transcript:** Grusch, Graves, Fravor — different subjects/observations in one published congressional record. These are not the same testimony or the same underlying incident simply because they share a transcript.
- **2024 GPO House transcript:** Gallaudet, Elizondo, Shellenberger, Mike Gold — one original hearing publication. Gold's science-policy recommendation is still incident-scoring N/A.
- **2022 Nolan–Vallée–Jiang–Lemke paper:** Nolan and Vallée — **exactly one journal article and one CB_JV-1 parent specimen**, not two lab replications.

The seven source/claim relationships in the structured public ledger explicitly distinguish these three publication overlaps, the **Grusch–Coulthart–Kean** overlapping programme-reporting chain, **Lazar–Knapp** (1989 historical interview), **Warren–Pope** (same Rendlesham historical event; Pope is a later desk reviewer), and **Fravor–Knuth** (same Nimitz case; visual testimony versus conditional radar-timing model). These are **caution relationships**, not a finding that all named people secretly share identical witnesses or that any particular claim is false.

Do not conflate: (1) same web page with same real-world event, (2) same event with same observed measurement, (3) a second named eyewitness with a second independent radar calibration, or (4) editorial criticism with case-specific disproof. Any truly independent evidence must list its own discoverable record or private responsibly reviewed source, means of knowing, date, chain and scope.

## Ready-for-human-review queue criteria

An item may be **assigned** only when a lead researcher provides:
1. Exact claim ID and bounded claim wording; source/date/version, firsthand/secondhand distinction.
2. Primary record(s) by individual URL, retrieval date, quotations or page/section locator and original-record access grade. Include authenticated master materials where practical.
3. Dedicated source-independence map and evidence grouping; no multiplication of the same study, clip, hearing, press release or confidential witness.
4. Original counter-record, competing interpretation and uncertainty, or a documented reason it could not be obtained.
5. For technical assertions, reproducibility packet, signal calibration, raw data, sample identity/custody and appropriate specialist rather than a general-purpose editor.
6. Any privacy, personal safety, copyright or confidentiality considerations, and an explicit note that public source links must not disclose protected witness identities.

If the above is incomplete, status remains `research_followup`. It is correct for a dossier to remain pending for weeks or longer; the website must display missing evidence, not an artificially precise rating.

## Independent human second-editor signoff: blank template

This is a **blank template**, never a signed approval or proof that an editor exists.

```text
Claim ID:
Exact reviewed statement and source/date:
Researcher and review material version/checksum:
Independent human editor [ASSIGNMENT PENDING]:
Editor competence and independence:
Conflict of interest declaration [NOT OBTAINED]:
Date actually inspected [NOT RECORDED]:
Exact primary documents/master material inspected:
Exact parts only indexed or unavailable:
Sources verified independently of shared publication / source lineage:
Competing explanations and original counter-records checked:
Measurement/sample custody/uncertainty review (or N/A with reason):
What the primary records actually establish:
What remains unsupported:
Proposed disposition [NOT ASSESSED | NOT APPLICABLE | FURTHER REVIEW]:
Does this claim support an incident evidence percentage? [UNDETERMINED]
Proposed methodology and supporting criteria [NOT APPROVED]:
Human editor signature and date [NOT OBTAINED]:
Separate publication owner approval and date [NOT GRANTED]:
Media/portrait rights approval and source [NOT GRANTED]:
Public source-explanation version and correction path:
```

Signatures must be given by **real people** after personal examination. Do not infer approval from GitHub Actions, AI-generated text, test accounts, blank text fields, stars, point counts, commit authors or the source uploader. Genuine human identities should be handled in a permission-controlled reviewer registry, not a public JSON file or GitHub history.

## Separate community voting security phase

Community opinions must not be confused with independent corroboration or a signed editorial assessment. Before any vote control appears on the public site:
- Test real **two-account authenticated sessions** with valid independent access tokens, not simulator accounts alone.
- Verify Supabase RLS prevents one user reading/updating another user's vote or inserting a vote for a different account; prevent extra profiles, duplicate votes and score changes outside account owner permission.
- Define uniqueness, cooldown, posting limits, spam/brigading protections, rate enforcement, error and sign-out behaviour, audit and delete/correction methods.
- Preserve privacy and data minimisation: no reviewer's private email or voter identity in public source data; show only safe aggregated community score and sample count if later authorised.
- Owners must approve the final rubric, signed-in-voter population, moderation and any privacy disclosures before launch.

No live database, Netlify build, APK, community-voting backend, permissions or publication score is changed by this protocol.

## M29 implementation and production boundary

- Structured public readiness graph: `data/public-who-editorial-readiness-m29.json` (23 unsigned records, 17 original-publication families, 7 explicitly qualified relationships).
- Reader: `assets/people-directory.js` supplies an expandable per-claim checklist, source-family and cautious related-profile links. Its parser is **fail closed** and is not used by actual score/vote permission checks.
- Premium responsive presentation: `who-is-who.html`. Existing 14-tab navigation, all 50 profiles, 23 unfinished claim assessments, 27 non-claim roles and previous M26–M28e evidence reader remain.
- Public file boundary: `scripts/build_public_release.cjs` allows the **one** new named JSON research ledger, and `scripts/test_who_public_package_boundary.cjs` ensures it contains no scores, signoffs or voting data.
- CI: `.github/workflows/who-readonly-m29-editorial-readiness-no-deploy.yml` reruns every prior source/browser test plus new M29 checks and a real-browser forged-ledger test. It builds a local **allowlisted staging folder only**—not a website deployment.

Release requirements remain: reconciled exact-current `production`/R3 branch, reviewed source and portrait rights, genuine human signoffs, independent vote security if votes proposed, and **explicit owner release approval**. No numerical ratings are approved by this M29 workflow.
