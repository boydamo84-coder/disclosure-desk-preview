# Case Connections — source-first archive matching (M4 / 13 Nov 2026)

**Status:** Staged only on `audit/adsense-low-value-recovery-nov13`. NOT merged or deployed. User request: show meaningful related cases for **any** public archive case, considering similarity, geographic proximity and dates.

## Implementation

- Public self-contained module: `assets/case-connections.js`, loaded before the main archive script. Index rebuilt when curated and full historical archive data arrive; no private Supabase data or account state used.
- Uses an **inverted index** of selected descriptive/title terms, **named locality** index, and **1° geographical grid** to retrieve candidates efficiently. Scores and explains each candidate on demand. There is no 10k×10k up-front pair calculation or separate Netlify function.
- Available on the existing case detail modal for every case, with **All connections**, **Nearby**, **Similar reports**, and **Close in time** filters.
- Provides specific shared terms, source-locality match, approximate Haversine distance where both published coordinates exist, supportive record-year range, and labelled possible overlapping record when multiple signals agree.
- Merely sharing a year or broad subject category does **not** justify a match; same source URL is not treated as independent corroboration. Suggested matches do not merge archive records or make any claim about an extraordinary explanation.
- Cases lacking usable coordinates can still be matched on specific named place and descriptive terms. No location is invented or geocoded from vague region/country strings; distance labels are **approximate published-coordinate separation**, not verified event-to-event distance.
- Reference years can refer to a file, catalogue or investigation period rather than an exact event date. UI cautions users. Hidden/private witness coordinates must never enter this matching engine.
- UI only renders a limited ranked result set per request, but searches the full **loaded** public dataset. It explains when enough source data is unavailable. It never fabricates connections solely to populate a list.
- Existing archive source links, follow, citations, comparisons, comments, profile and W.NE remain untouched by the engine.

## Test coverage

- `scripts/test_case_connections.cjs`: 12,000 synthetic records; validates approximate distances, named-locality match, similar terms, year/support signals, source-URL duplicate handling, missing geodata, and year-only false-positive rejection. First successful GitHub no-deploy run 43512644999 reported 176 ms synthetic index build, 23 ms candidate query; this is CI-runner-specific, not phone performance.
- `scripts/test_original_research_contract.cjs`: asserts bundled module, public links and removal of year-only recommendations.
- `scripts/test_original_research_chromium.cjs`: in simulated 393px phone and 1280px desktop, opens both editorial articles and matching source archive modals, checks Case Connections filters, then closes. Each navigation journey uses an isolated tab due deliberate existing history.back on modal dismissal.
- `.github/workflows/qa-adsense-research-no-deploy.yml` runs source, search, release packaging, public-page and local Chromium checks without deploying or requesting AdSense review.

## Limitations and next research phases

1. The historical archive includes a mix of reports and collection-level records. Similarity is **related catalogue content**, not independently corroborating events. Keep source provenance visible.
2. Country/region strings and unverified map markers are not sufficiently precise for measured proximity. Location-aware enrichment needs documented record-level provenance, uncertainty radius and permission-safe handling, and must be verified before publication.
3. Month/day closeness should be added only for reliable typed incident dates; a bare `year` often means something else. Avoid turning catalogue-year overlap into claimed simultaneous reports.
4. Potential duplicates are an **invitation to verify** shared events, not automatic deletion or merging. Build a human-reviewed relationship/duplicate ledger in a later milestone if useful.
5. The first version searches public archive cases. News/videos can be shown separately as attributed leads using current matching tools; private witness reports, chat and Boards do not join the public search without explicit consent and validation.
6. Future enhancements: case graph overlay, configurable proximity radius, event-date precision, evidence-side-by-side compare, independently corroborated relationships and provenance stamps; stage and QA each separately.

## Release checklist

- Verify latest no-deploy workflow green after browser test changes.
- Reconcile M86–M96 and newer approved releases on exact final website head before merging this branch.
- Confirm no console errors or slow scroll on actual Samsung/desktop; test representative cases with and without source coordinates, large/full catalogue, and back navigation.
- Never deploy merely to test a UI preview; conserve Netlify credits.
- The current authenticated AdSense rejection is low-value content; this research convenience is **not a substitute** for original editorial analysis and does not guarantee approval.
