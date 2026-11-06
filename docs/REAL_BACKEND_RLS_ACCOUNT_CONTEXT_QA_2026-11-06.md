# Disclosure Desk — real backend RLS account-context acceptance (6 Nov 2026)

**Target:** connected live Supabase project `omqxizswzcwgzqaczlhe` ONLY.  
**Stage:** live database READ-ONLY account-context RLS acceptance; **NOT real Auth HTTP/JWT login**, not Chat/Discussions migration.  
**Release:** no website, Netlify, Android or Supabase writes. No need to repeat detached PostgreSQL synthetic checks.

## Safety and scope

- Owner authorised testing of current dummy/test accounts and Boards; we selected existing identities within the database without exposing IDs, email, names or research text.
- Every active role query was wrapped in `BEGIN TRANSACTION READ ONLY`, `SET LOCAL ROLE` and `ROLLBACK`. Temporary `request.jwt.claim.sub`/`request.jwt.claims` were set **inside the SQL session**; no real login, issued access token, Supabase HTTP, Storage download, new user, forum/chat table or private-data write occurred.
- Because a privileged SQL session can set these claims, these results verify **RLS behaviour for representative account contexts**, not whether Supabase Auth cryptographically validates JWTs. The real A/B network login and device tests remain mandatory.

## Connected backend inventory checked

- Supabase project healthy; 22 public tables, all RLS enabled.
- Database contains 3 Auth rows, 3 Investigation Boards, 7 research documents, 1 public username row, 1 comment and 1 Storage object. No community forum (`dd_forum_*`) or private 1:1 Chat (`dd_chat_*`) tables, zero witness submissions and zero LIVE event/message rows at this checkpoint.
- There are no Supabase preview branches. [Supabase branching cost documentation](https://supabase.com/docs/guides/platform/manage-your-usage/branching) confirms additional metered usage; did not create a branch to avoid costs.
- Production-derived website `witnessPublic` / `voting` are already enabled; unpublished flags `discussions:false`, `privateChat:false`, `profileAvatars:false`, `researchPublishing:false` remain unchanged.

## Live transactional tests

| Context | Actual test | Result |
| --- | --- | --- |
| `anon` (database role) | Read-only calls to `dd_public_comments`, `dd_public_aliases`, `dd_vote_summary` with deliberately nonexistent case/empty UUID lists, plus public witness projection | **PASS**: executed as `anon`, 0 matching rows, no error, no writes |
| `authenticated`, no user JWT claims | Read-only direct SELECTs of private Boards, documents, assets, username settings and witness-author rows | **PASS**: `auth.uid()` NULL and 0 private rows across all five projections |
| `authenticated`, Account A context (existing owner of test Boards) | Session-local `auth.uid()` claim mapped to existing account; direct SELECT counts subject to production RLS | **PASS**: 3 own Boards, 7 own documents, 1 own username record |
| `authenticated`, Account B context (separate existing Auth identity) | Session-local claim mapped to a different existing account; direct SELECT counts subject to production RLS | **PASS**: 0 Boards, 0 documents, 0 username records |
| Grants/policies | PostgreSQL catalogue checks of selected private/public tables and RPCs | **PASS for intended scope**: private Boards/docs have no `anon` direct SELECT grant; authenticated SELECT policies are owner-scoped. Public witness projection and documented guest-read RPCs callable; moderator/owner RPCs lack `anon` execute grants |

No identifiers, contents, passwords, access tokens, private messages or Storage object bytes were output.

## Security advisor observations — require deliberate review, not blind grants

- Live advisor warns on six anonymous-executable `SECURITY DEFINER` functions, including intentional `dd_public_comments`, `dd_public_aliases`, `dd_vote_summary`, `dd_public_hearing_chat`, `dd_media_ranking` and `rls_auto_enable`.
- Inspected live definitions: public comments return approved records and is-mine boolean; alias RPC returns only opt-in aliases for approved/public content; `dd_my_comments` checks `auth.uid()` and anonymous status; moderator queue requires server-side moderator check. No changes made.
- `rls_auto_enable()` returns `event_trigger`, and its definition sets RLS on newly created public tables. The advisor reports it executable by `anon`; review whether that grant should be narrowed during a future approved security migration. Do not assume that an event-trigger function can be used as an ordinary HTTP RPC.
- The RLS-no-policy advisor also names five intentionally private/internal tables (including moderator/limits and votes). They do **not** have direct anon SELECT grants in the inspected cases. No blanket grants/revokes were applied.
- Official Supabase guidance: [Security advisor](https://supabase.com/docs/guides/database/database-linter) and [Data API security](https://supabase.com/docs/guides/api/securing-your-api).

## Remaining release gates

1. **Real Auth HTTP/JWT A/B on Samsung**: user signs in as A and B in controlled distinct sessions; verify own/private data, guest, anonymous, blocked/member/steward/owner privileges without sharing passwords or tokens. Database claim simulation is not a substitute.
2. **Recoverability:** encrypted real Supabase database **and actual Storage object bytes**, independent integrity check, separate disposable restore for both products; not established. Seven of eight private runner secrets were previously reported configured, the rclone OAuth config remained outstanding; verify latest status rather than assuming.
3. **New features remain off:** Chat/forum backend DDL review-only and unapplied. Apply only after backup, review, suitable staging/rollback and owner approval. Do not merge the whole development branch, spend Netlify build credits or flip the public flags early.
4. Complete real Samsung/Chrome 12-tab navigation, W.NE unsaved-document guard, account switch, data privacy, moderators, comment/vote/report flows and Android parity before one coherent public release.

**Bottom line:** Real PostgreSQL role/RLS context for existing A/B account IDs is **PASS**. Real signed-in account HTTP and new social backend deployment remain **PENDING**.
