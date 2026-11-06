# Disclosure Desk Chat + Discussions live beta backend — 6 November 2026

**Scope:** Supabase project `omqxizswzcwgzqaczlhe` only. User explicitly authorised live database beta testing because existing accounts and content are test-only and there are no outside users. The public site and release flags remain OFF.

## What is installed

- Chat: migration `20261106233100_dd_private_chat_consent_backend_beta_20261106`, five RLS tables, nine functions; guest function access 0, direct table access 0, consent opt-in false by default. Initial private pairs/messages both 0.
- Discussions: migration `20261106233240_dd_discussions_stewardship_backend_beta_20261106`, eight RLS tables, twenty functions; three intended guest-readable projections, seventeen authenticated-callable entry points, no direct table DML, no sections/threads/replies.
- Exact SQL bodies of both managed migrations are saved in `supabase/migrations/` on the unpublished branch. Historic `supabase/*_REVIEW.sql` candidates retain their original review-only comments; do NOT reapply them.

## Scope and preservation verification

Live aggregate counts after both migrations: Auth rows 3, Boards 3, research documents 7, Storage object metadata rows 1. No live user/guest messages posted. No user records read, no website deploy, no Netlify, no Android update, no Our Cinema change, no backup scheduler.

## Previously completed tests — do not duplicate

- Combined candidate Chat + Discussions signed HTTP/JWT disposable fixture **59/59 PASS**, run [42128775452](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42128775452).
- Separate isolated Postgres acceptance and original read-only rollback-only live Supabase candidate checks.
- Two-user genuine Supabase JWT live Board/research access isolation.
- Authentic encrypted DD and Cinema database+Storage audits and both successful isolated on-device PostgreSQL restores.

## Next distinct acceptance before public feature flags

1. Identify/authorise the site owner via **trusted authenticated metadata**, then enrol in `dd_chat_owner_admins` and `dd_forum_owner_admins` securely without exposing the Auth user UUID or broadening role permissions. This is not automatically included in schema migration.
2. Use the two registered test accounts through genuine Supabase Auth/HTTP for **new** Chat behaviour: independent opt-in, invitation preview, accept/decline, message send/read/unread, block and report; verify a third/unauthed person cannot read history or admin queue.
3. With new test sections, check registered and guest Discussions behaviour: posting/replies, vote/flags, five distinct registered report threshold, creator steward limitations and site owner moderation. Test data only.
4. Validate responsive Samsung browser for Chat panel, keyboard, histories, Discussions twelfth tab and W.NE Research Edition save-before-navigation. Do not expose unreviewed SQL or Finance files via public web package.
5. After these gates, switch two flags deliberately and publish only a reviewed allowlisted website release with rollback plan. Do not blanket-merge unpublished branch.
6. Hourly Drive backups and full hosted Supabase disaster recovery remain separate work; their remaining configuration tests must not be confused with real database restore gate already passed.

**Current user-facing status:** backend installed, Chat/Discussions frontend OFF, public 11-tab site unchanged.

## 6 Nov 23:41 UK — Downloadable localhost-only real-DD beta artifact

- GitHub Actions [Build local-only Chat + Discussions Samsung beta ZIP — SUCCESS](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42313558598), run 42313558598, implementation SHA `e60df82d`; separate full staging QA [42313558553 SUCCESS](https://github.com/boydamo84-coder/disclosure-desk-preview/actions/runs/42313558553).
- Artifact `disclosure-desk-chat-discussions-samsung-beta` id `13549881298` verified in GitHub Actions, 736012 bytes compressed, expires 2026-11-09 23:41 UTC.
- It includes **only approved public site files**. Its copied feature config enables Chat + Discussions on `localhost`/`127.0.0.1` only, and disables them on public domain/Netlify. No Netlify deployment performed; no private SQL, Finance, keys, backups or credentials packed.
- Owner Samsung execution after downloading ZIP (filename normally `disclosure-desk-chat-discussions-samsung-beta.zip`): `mkdir -p "$HOME/dd-community-beta"`; `python -m zipfile -e "$HOME/storage/downloads/disclosure-desk-chat-discussions-samsung-beta.zip" "$HOME/dd-community-beta"`; `cd "$HOME/dd-community-beta" && python -m http.server 8766 --bind 127.0.0.1`; open `http://127.0.0.1:8766/` in Samsung Internet/Chrome.
- Test **new** human UI + live Supabase Auth/HTTP for Chat and Discussions. Username save with public alias and independent Chat-contact opt-in is required for both test accounts. Private passwords, tokens, email addresses and UUIDs stay off screenshots/chat.
- Real phone result still **PENDING**, not passed by Actions.
