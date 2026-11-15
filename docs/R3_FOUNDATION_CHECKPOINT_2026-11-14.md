# Disclosure Desk R3 — R2-based development foundation
_Date: 14 November 2026 · Development only · Not for Netlify/production deployment_

## Release boundary

- The owner reported that the live R2 Who's Who / premium dock experience **works** after Netlify production published application SHA `8af0a5a60c8282542154502e17d96177aade97d2`.
- The original 13 November `queue/dd-web-r3-hypothesis-discovery` branch is a stale roadmap fork, NOT a release base.
- This new branch `queue/dd-web-r3-from-r2-nov14` was created from production documentation SHA `4c8107d34dd379d92e00e5708306a567bd09146b`, which differs from the R2 published runtime SHA only by recorded handover changes. Production is untouched by R3 commits.
- Do not open a Netlify preview/PR, publish, contact Supabase or change live accounts until a separate R3 release approval. Preserve R1 and R2 rollback SHAs.

## User-approved R3 scope (from docs/RELEASE_R3_HYPOTHESIS_DISCOVERY_SCOPE.md)

1. **Research Gap Finder** — inspect only source-linked catalogue data available to this application; label missing fields *in the catalogue* rather than asserting the real-world evidence does not exist. Each suggestion must say what field prompted it, cite the case/record link, describe limits and propose a next researcher action.
2. **Hypothesis Lab** — private-by-default competing explanations with assumptions, predicted observations, alternative interpretations, disconfirming data and timestamped, versioned revisions. Never produce an alien-origin probability or invent certainty. Integration with account/Boards/W.NE is a separate privacy-reviewed milestone.

## Real-case baseline inspected before implementing

`data/curated-historical-cases.json` has 12 public curated entries: 3 featured incidents with more detailed timelines/source records, and 9 archive catalogues/record guides. The latter should **not** be treated as 9 additional witnessed incidents. Only 1 of the three featured records contains an approximate coordinate pair, explicitly labelled as a public forest visitor area rather than the actual sighting point. All 12 have a primary `url` field, while only 3 include a detailed `sources` array. Missing a structured field is not proof that information is absent from prose, original documents or other archives.

## Alpha implementation contract

- Pure offline function with no network, authentication, database writes or automatic public disclosure.
- Records must have a stable ID and be expressly recognised as an incident/case, not an archive index.
- Findings are **candidate prompts** with case ID, provenance link, field name, explicit caveat and next research step; never invented event data.
- When the dataset has only a year, flag **structured date precision not indexed**, NOT an undated incident. Where the location lacks vetted coordinates, say this catalogue has no verified sighting point; do not request witness home/exact private location.
- Instrument metadata and source independence are not assumed absent in the world when the catalogue does not index them. Human confirmation is required before accepting a gap.
- Add synthetic positive/negative tests and an actual 12-record public fixture check. Do not package experimental files into the live public site or silently modify existing nav/design.

## Further gates

Hypothesis Lab implementation, linking to Evidence DNA, non-fabrication tests, privacy/source review, website UX, Android/iPhone testing, production diff, independent R3 approval and an explicit rollback plan all remain pending. R4 remains untouched.
