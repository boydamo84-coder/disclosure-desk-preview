# Who's Who community evidence ratings — database contract and release gate (STAGED DESIGN)

**Date:** 15 Nov 2026. **No database migration has been applied.** This is a SQL design reference, NOT a deployable migration. Generate the real migration using the current Supabase CLI when the owner authorises a controlled backend release; independent security review and isolated database tests are prerequisites.

## Product contract

A registered member may assign an **evidence-support score from 0 to 100** to a specific, accurately attributed public claim that has passed source/context review. This does NOT rate the person, honesty or extraordinary origins, and no numerical score represents a probability of truth. Scores are independent of the editorial Disclosure Desk assessment. One rating per account per approved claim; users can change it after a cooldown. Do not permit votes on unreviewed claim drafts or arbitrary person IDs. Public figures never get a personal aggregate rank.

The claim-level response must contain only `claim_id`, `rating_count`, `community_mean` (only with at least 5 ratings), and `my_rating` (the current request's verified account only). Do not return voters' names, emails, UUIDs, raw votes, tokens or private research.

## Reviewed-claim registry

Create `public.dd_who_reviewable_claims` with `claim_id TEXT PRIMARY KEY`, `person_id TEXT NOT NULL`, `public_primary_url TEXT NOT NULL`, `editorial_version TEXT NOT NULL`, `enabled_at TIMESTAMPTZ NOT NULL`, and timestamps. **No public insert/update/delete grant**. Add claims only after a primary-source/transcript fact check and approval of the published statement in `data/public-people-directory.json`. Initial seed list is **empty**: the three first source-attributed statements remain editorial drafts, so no live votes should open automatically.

Create `public.dd_who_evidence_votes` with composite primary key `(claim_id, voter_id)`, foreign keys to `dd_who_reviewable_claims(claim_id)` and `auth.users(id)` (with deletion cleanup), constrained `rating SMALLINT CHECK (rating BETWEEN 0 AND 100)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, and an index supporting voter daily-rate checks.

**Security:** RLS enabled on both tables. REVOKE all public/anon/authenticated direct table writes; **no raw vote SELECT grant**, including to authenticated users. Access only through tightly scoped RPCs. Every write must derive voter ID on the server from `auth.uid()`, reject absent/anonymous authentication, and ensure the claim is enabled server-side. Never accept caller-supplied voter IDs or user-metadata roles. Fixed function `search_path` and schema-qualified references are mandatory; functions must not interpolate SQL. Use dedicated EXECUTE grants rather than the default PUBLIC grant. Avoid SECURITY DEFINER unless its exact permissions/implementation have been individually reviewed by the database security gate. Disabling a claim must also remove its vote form and stop new votes.

## Proposed RPCs

- `dd_who_claim_rating_summary(p_claim_ids TEXT[])`: read-only, bounded list (1–20), only enabled claim IDs; aggregates counts and optional mean without user IDs; `community_mean` is NULL if there are fewer than 5 votes. `my_rating` comes only from a server-validated current auth account, never a caller UUID. Public guests may read aggregate results.
- `dd_who_claim_rating_set(p_claim_id TEXT, p_rating SMALLINT)`: authenticated-only write after claim registry check; `auth.uid()` selects the row. Serialise per-user writes, check new-vote daily limit (e.g. 30/24h) and 3-minute edit cooldown, and upsert the *same* member's row atomically. If the server fails/connection drops, never show “saved” without acknowledgement; re-read the current rating on reconnect. Check abandoned accounts and deletion cleanup.
- Anti-abuse hardening: verified-account eligibility; reportable suspicious vote bursts; editorial moderation may temporarily lock a claim; no community ranking that could invite targeting or brigading. Clear rate-limit messaging without leaking account status.

## Web UI behaviour

- Every claim card has two independent readouts: **Disclosure Desk evidence review** and **Community evidence review**. Only genuinely reviewed claims can have a site number; no profile-wide personal score.
- If the claim's attribution is not independently approved, BOTH sections explicitly say **Not assessed / Voting not open**. No fake totals or synthetic percentages in production.
- For an approved claim, load guest-safe summary and total ratings; show community average only after minimum vote count, and a 0–100 input for authenticated eligible members. Rate button submits once, handles errors, does not lie about pending results; later changes overwrite one's previous vote.
- A separate shared methodology explainer says what the number means and how individual opinions differ from the editorial assessment.
- Original 14-tab navy/gold dock, case navigation/Back behaviour and anonymous guest directory reading stay intact.

## Release and QA gates

1. Complete human editorial/source review of each public claim before setting `source_verified` and adding it to enabled claim registry.
2. Convert this contract into an audited Supabase migration. Check current CLI documentation and GitHub branch state first; do not mutate live tables in a source-only release.
3. Isolated Postgres checks: guest cannot write; one member cannot see, impersonate or alter another; disabled/nonexistent claims reject votes; uniqueness under concurrent requests; daily cap; edit cooldown; low-count mean hidden; sign-out/expired JWT; wrong/malformed bearer; account deletion cleanup; no attacker-controlled SQL.
4. Run no-deploy source and mobile browser tests at exact SHA, then user-approved controlled migration and site release with a rollback plan.
5. Update the pinned homepage news only when the two perspectives are actually published; preserve the prior R3 launch bulletin.

**Further references:** Supabase official RLS guide https://supabase.com/docs/guides/database/postgres/row-level-security and API access https://supabase.com/docs/guides/api/securing-your-api .
