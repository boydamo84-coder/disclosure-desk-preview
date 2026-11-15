# Who’s Who Milestone 22 — actual disposable PostgreSQL security and source-lineage audit

**15 November 2026 — RESEARCH BRANCH ONLY — NO PUBLIC RELEASE**  
Research branch: `feature/who-evidence-score-framework-20261115`. The exact SQL/PG test code was committed at `ce67458f8fa76c17a9c080394fde8fe56f025c38`. The browser/source and contract documentation snapshot is `bb3cc3ebc2800ec71359ccdc3f040299b694b6ae`. Subsequent documentation-only handover commits do **not** imply new code was tested.

## Independent CI confirmation — all 3 NO DEPLOY suites passed

- **Actual disposable PostgreSQL 17:** [run 43741083401](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43741083401), completed **SUCCESS**, exact code SHA `ce67458...`. Creates an otherwise empty `who_evidence_ci` DB in GitHub Actions `postgres:17-alpine`, adds minimal synthetic auth roles/users/functions and applies the **unapplied SQL design only inside that disposable container**. No Supabase project, real token, live user, Netlify, production database or migration used.
- **Source contract and 4-viewport Chromium:** [run 43741147297](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43741147297), completed **SUCCESS**, exact SHA `bb3cc3e...`. Existing 50-directory/23-claim/27 nonclaim checks, 38+ draft security static assertions, source lineage test, local package and browser source-reader/navigation audit retained. 320/393/820/1280px checks preserve original premium 14-tab navigation and blocked ratings.
- **Independent source + Chromium no-deploy runner:** [run 43741147246](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/43741147246), completed **SUCCESS**, exact SHA `bb3cc3e...`. It tests the same branch files without publishing.

**What the ephemeral PostgreSQL suite actually exercised:** raw guest/member table read/write denial; no guest write RPC; null, empty, malformed and over-20 summary lists; claim disabled/not found; metadata constraint disallowing missing or identical editor names; two role-separated member records that never expose raw votes to another account; simulated anonymous sign-in blocked; score range 0–100; signed-out/missing mock identity rejected; cooldown 3 minutes; 30 new ratings per rolling day cap; individual vote update rather than duplicate; average suppressed for 1–4 votes and visible at 5 synthetic votes; account deletion cascades and hides average again below 5; disabled registry hides summary and disallows writes.

A **separate two-client psql race test** uses a sixth synthetic user, one shared claim and concurrent SQL transactions: first accepted vote 33 holds a transaction lock; second attempted vote 99 waits then is rejected by cooldown; the final stored record remains exactly one vote of 33. The test uses synthetic UUIDs and no production account. These behaviours were observed as *actual PostgreSQL logic*, not assumed from regex.

## Real bug found and repaired before a release

The first PostgreSQL execution surfaced a `claim_id` ambiguity inside `dd_who_claim_rating_set` because PL/pgSQL `RETURNS TABLE (claim_id,...)` defines an output variable named the same as the `ON CONFLICT (claim_id,voter_id)` target. The staged design now uses `ON CONFLICT ON CONSTRAINT dd_who_claim_ratings_pkey` instead. Initial test fixture calls also used uncast integer arguments where the function declared `SMALLINT`; the test fixture now casts synthetic calls explicitly. Earlier red workflows are **genuine failures**, not ignored successes.

## Security-definer boundary corrected in the design (NOT APPLIED)

The initial design exposed two `SECURITY DEFINER` RPCs directly in `public`. Current Supabase documentation advises against privileged-definer functions in Data API exposed schemas. We refactored the **draft**:

1. `dd_who_private.dd_who_claim_rating_summary_impl` and `dd_who_private.dd_who_claim_rating_set_impl` contain the privileged, fixed-search-path logic. Their `PUBLIC` execute grants are revoked; only narrow `anon`/`authenticated` EXECUTE grants are added as appropriate.
2. `public.dd_who_claim_rating_summary` and `public.dd_who_claim_rating_set` are `SECURITY INVOKER`, fixed-search-path wrappers with their own explicit execute grants, not elevated functions.
3. Both tables retain RLS and revoked direct raw guest/member grants; the claim registry remains **disabled by default, with no seeded public claims**.
4. The draft statements are wrapped in `BEGIN; … COMMIT;`, preventing an intermediate default-`PUBLIC` function privilege gap if later deliberately reviewed and applied.
5. An actual PostgreSQL introspection test confirms **zero privileged public wrappers, two privileged private workers**, and guests cannot invoke the privileged private write function.

**Mandatory security signoff still missing:** verify on the actual intended Supabase environment that `dd_who_private` is *not* in the configured **Data API Exposed schemas**, and test real GoTrue/PostgREST signed JWTs, expiry, revoked sessions, anonymous users, authenticated impersonation prevention, realistic concurrency, audit/moderation and RLS interaction. A new schema name alone is not an exposure-control guarantee; our mock `auth.uid()` reads a session GUC and **does not validate a token signature**. Names/timestamps in approval fields also do **not** establish that two real independent editors exist or reviewed sources.

Supabase current references: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/database/functions ; https://supabase.com/docs/guides/api/securing-your-api

## Separate evidence source-ancestry audit

Source file: `scripts/test_who_source_lineage.cjs`. This read-only check confirms the directory has **50 people, 23 attributed claim/recommendation drafts, 27 unscored role/FOIA scopes and 89 provisional research entries**, with **17 distinct original publication URLs** across those 23 claim entries.

Three **shared original publication containers** are identified precisely:

- Official 26 July 2023 House hearing record: **David Grusch, Ryan Graves, David Fravor** cite the same GovInfo hearing **transcript URL**. They may provide separate statements, but repeating the document link is not three independent government confirmations of every claim.
- Official 13 November 2024 House hearing record: **Luis Elizondo, Mike Gold, Tim Gallaudet, Michael Shellenberger** share the same GovInfo **transcript URL**. Distinct allegations/policy testimony in one publication should not be pooled as independent validation of the same phenomenon.
- Nolan and Vallée cite the **same 2022 Progress in Aerospace Sciences publication** involving one underlying Council Bluffs case/material provenance. Multiple coauthor profiles or alternate access routes cannot be counted as independent laboratory replications.

Three **shared research/case-lineage family IDs** also require special handling: Coulthart/Leslie Kean (overlapping Grusch recovery-reporting source chain), Larry Warren/Nick Pope (Rendlesham retrospective and 1980 witness disputes, different nights/positions), and Nolan/Vallée (same coauthored study). A shared *case* is not automatically a duplicated *witness*, and a shared *document* is not automatically a duplicated *testimony*. These flags are **deduplication/interpretation aids only**; they do not establish whether any reported extraordinary interpretation is true.

The new source-lineage static test runs in both original browser/source workflows and the disposable database workflow. The count is **17 unique original publication URLs**, not 17 independent UAP events or 17 confirmed eyewitnesses.

## Original-source, rights and release gates remain

All 23 claims have `fullOriginalReviewed:false` and `secondEditorSignoff:'not_obtained'`, and all 50 photo rights scope records retain `finalRightsApproval:false`. The 20 catalogued Commons portrait sources and 30 initials remain unchanged; no likeness was added or legally signed off. Nick Pope first-party text and the Peabody/Knap photograph-date disagreement are as documented in M21, without new assertions of extraordinary proof. No scores have been published, no community ballots cast, no personal honesty percentages invented.

**No owner-approved production release or live migration was performed**. The live GitHub `production` branch was independently checked at `6b602324d14b834b0ef5ac222d3cae3acbf53a56` during M22; M22 work stayed on its isolated feature branch. No Netlify build credits, real Supabase rows, Android/Play builds, R3 encrypted Hypothesis Lab vault or W.NE content were modified by M22.

## Next — M23

- Arrange an *owner-approved* genuinely isolated Supabase Auth+PostgREST end-to-end test of signed sessions and current Data API exposed schemas, with two real separate test accounts, guest, expired/revoked JWT, RLS and simulated attack cases, **before** any proposed migration.
- Validate material independence/source chains case by case with original footage/transcripts, source ownership, calibrated sensor/digital evidence and qualified second editorial review; do not assign percentages on one broadcaster/source repeated in many profiles.
- Professional image reuse assessment of currently selected 20 image catalogue entries, including the unresolved Knapp event date/source image and Elizondo original video frame licence, before any final rights signoff.
- Only after real dual reviewer evidence verification, security tests and separate owner-approved release plan consider staged public claim ratings and a pinned-homepage update.
